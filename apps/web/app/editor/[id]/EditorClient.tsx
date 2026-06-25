"use client";

import { useEffect, useRef, useState } from "react";

interface Project {
  id: string;
  title: string;
  template: string;
  status: string;
  topic: string;
  voice_provider: string;
  voice_code: string;
  total_frames: number;
  total_duration_s: number | null;
  scene_count: number;
}

interface Scene {
  id: string;
  position: number;
  slug: string;
  text: string;
  visual_prompt: string | null;
  voice_url: string | null;
  voice_duration_s: number | null;
  footage_url: string | null;
  start_frame: number | null;
  duration_frames: number | null;
}

type StepKey = "script" | "voice" | "footage" | "manifest" | "render";

interface StepState {
  status: "pending" | "running" | "done" | "error";
  message?: string;
  result?: Record<string, unknown>;
}

export function EditorClient({
  project: initialProject,
  initialScenes,
  autoAction,
}: {
  project: Project;
  initialScenes: Scene[];
  autoAction?: string;
}) {
  const [project, setProject] = useState(initialProject);
  const [scenes, setScenes] = useState<Scene[]>(initialScenes);
  const [steps, setSteps] = useState<Record<StepKey, StepState>>({
    script: { status: initialScenes.length > 0 ? "done" : "pending" },
    voice: { status: initialScenes.every((s) => s.voice_url) && initialScenes.length > 0 ? "done" : "pending" },
    footage: { status: initialScenes.every((s) => s.footage_url) && initialScenes.length > 0 ? "done" : "pending" },
    manifest: { status: initialProject.total_frames > 0 ? "done" : "pending" },
    render: { status: "pending" },
  });
  const [renderResult, setRenderResult] = useState<{
    download_manifest_url?: string;
    render_id?: string;
  } | null>(null);
  const autoActionConsumed = useRef(false);

  // Auto-trigger script generation if redirected from create form
  useEffect(() => {
    if (autoAction === "generate-script" && !autoActionConsumed.current && scenes.length === 0) {
      autoActionConsumed.current = true;
      runStep("script");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAction]);

  function setStep(key: StepKey, state: StepState) {
    setSteps((s) => ({ ...s, [key]: state }));
  }

  async function refreshProject() {
    const res = await fetch(`/api/projects/${project.id}`);
    if (res.ok) {
      const data = await res.json();
      setProject(data);
      setScenes(data.scenes ?? []);
    }
  }

  async function runStep(key: StepKey) {
    setStep(key, { status: "running" });
    try {
      if (key === "script") {
        const res = await fetch("/api/generate/script", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project_id: project.id, force_regenerate: scenes.length > 0 }),
        });
        if (!res.ok) throw new Error((await res.json()).message);
        const result = await res.json();
        setStep(key, { status: "done", result });
        await refreshProject();
      } else if (key === "voice") {
        const res = await fetch("/api/generate/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project_id: project.id, scope: "missing-only" }),
        });
        if (!res.ok) throw new Error((await res.json()).message);
        const result = await res.json();
        setStep(key, { status: "done", result });
        await refreshProject();
      } else if (key === "footage") {
        await runFootage();
      } else if (key === "manifest") {
        const res = await fetch("/api/manifest/build", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project_id: project.id }),
        });
        if (!res.ok) throw new Error((await res.json()).message);
        const result = await res.json();
        setStep(key, { status: "done", result });
        await refreshProject();
      } else if (key === "render") {
        const res = await fetch("/api/renders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project_id: project.id, location: "local" }),
        });
        if (!res.ok) throw new Error((await res.json()).message);
        const result = await res.json();
        setStep(key, { status: "done", result });
        setRenderResult(result);
      }
    } catch (e) {
      setStep(key, { status: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }

  async function runFootage() {
    // For each scene without footage, search Pexels with visual_prompt + assign first result
    const todo = scenes.filter((s) => !s.footage_url && s.visual_prompt);
    if (todo.length === 0) {
      setStep("footage", { status: "done", message: "Tất cả scene đã có footage" });
      return;
    }
    let done = 0;
    let failed = 0;
    for (const scene of todo) {
      try {
        const search = await fetch("/api/pexels/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: scene.visual_prompt, per_page: 5 }),
        });
        if (!search.ok) throw new Error("search failed");
        const { items } = await search.json();
        if (items.length === 0 || !items[0].best_file) {
          failed++;
          continue;
        }
        const best = items[0].best_file;
        const assign = await fetch("/api/pexels/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scene_id: scene.id,
            pexels_id: items[0].pexels_id,
            file_url: best.url,
            width: best.width,
            height: best.height,
            duration_s: items[0].duration_s,
          }),
        });
        if (!assign.ok) {
          failed++;
          continue;
        }
        done++;
      } catch {
        failed++;
      }
    }
    setStep("footage", {
      status: failed === todo.length ? "error" : "done",
      result: { done, failed, total: todo.length },
    });
    await refreshProject();
  }

  async function runAll() {
    if (steps.script.status !== "done") await runStep("script");
    if (steps.voice.status !== "done") await runStep("voice");
    if (steps.footage.status !== "done") await runStep("footage");
    if (steps.manifest.status !== "done") await runStep("manifest");
    await runStep("render");
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT: Steps + actions */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
          <div className="text-xs uppercase tracking-wider text-white/40 mb-1">Project</div>
          <h1 className="text-xl font-black mb-2 break-words">{project.title}</h1>
          <div className="text-xs text-white/50">
            {project.template} · {scenes.length} scene · {Math.round((project.total_duration_s ?? 0))}s
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3">
          <div className="text-xs uppercase tracking-wider text-white/40 mb-1">Pipeline</div>
          <StepRow
            label="1. Generate script (LLM)"
            state={steps.script}
            onRun={() => runStep("script")}
          />
          <StepRow
            label="2. Generate voice"
            state={steps.voice}
            disabled={steps.script.status !== "done"}
            onRun={() => runStep("voice")}
          />
          <StepRow
            label="3. Find footage (Pexels)"
            state={steps.footage}
            disabled={steps.script.status !== "done"}
            onRun={() => runStep("footage")}
          />
          <StepRow
            label="4. Build timeline"
            state={steps.manifest}
            disabled={steps.voice.status !== "done"}
            onRun={() => runStep("manifest")}
          />
          <StepRow
            label="5. Render MP4"
            state={steps.render}
            disabled={steps.manifest.status !== "done" || steps.footage.status !== "done"}
            onRun={() => runStep("render")}
          />
          <button
            onClick={runAll}
            className="w-full mt-2 px-4 py-3 rounded-xl bg-brand text-black font-bold hover:bg-brand-light"
          >
            ▶ Chạy hết
          </button>
        </div>

        {renderResult && renderResult.download_manifest_url && (
          <div className="bg-brand/10 border border-brand/30 rounded-2xl p-5">
            <div className="font-bold mb-2">🎬 Render manifest sẵn sàng</div>
            <p className="text-sm text-white/70 mb-3">
              Render Engine (Electron) đang phát triển. Tạm thời tải manifest JSON về và chạy thủ công qua Remotion CLI.
            </p>
            <a
              href={renderResult.download_manifest_url}
              download
              className="inline-block px-4 py-2 rounded-lg bg-brand text-black font-semibold"
            >
              ⬇ Tải manifest.json
            </a>
          </div>
        )}
      </div>

      {/* RIGHT: Scene list */}
      <div className="lg:col-span-2 space-y-3">
        {scenes.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-10 text-center text-white/50">
            Chưa có scene nào. Nhấn "Generate script" để bắt đầu.
          </div>
        ) : (
          scenes.map((scene) => <SceneCard key={scene.id} scene={scene} />)
        )}
      </div>
    </div>
  );
}

function StepRow({
  label,
  state,
  onRun,
  disabled,
}: {
  label: string;
  state: StepState;
  onRun: () => void;
  disabled?: boolean;
}) {
  const dotColor = {
    pending: "bg-white/20",
    running: "bg-amber-400 animate-pulse",
    done: "bg-brand",
    error: "bg-red-500",
  }[state.status];

  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${dotColor}`} />
      <div className="flex-1 text-sm">{label}</div>
      <button
        onClick={onRun}
        disabled={disabled || state.status === "running"}
        className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {state.status === "running" ? "..." : state.status === "done" ? "↻" : "▶"}
      </button>
    </div>
  );
}

function SceneCard({ scene }: { scene: Scene }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-mono text-brand">{scene.slug}</span>
        <span className="text-xs text-white/40">#{scene.position + 1}</span>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-xs">
          {scene.voice_url ? (
            <span className="text-brand">✓ voice {scene.voice_duration_s?.toFixed(1)}s</span>
          ) : (
            <span className="text-white/40">○ voice</span>
          )}
          {scene.footage_url ? (
            <span className="text-brand">✓ footage</span>
          ) : (
            <span className="text-white/40">○ footage</span>
          )}
        </div>
      </div>
      <div className="text-sm leading-relaxed text-white/90 mb-2">{scene.text}</div>
      {scene.visual_prompt && (
        <div className="text-xs text-white/40">
          Pexels query: <span className="font-mono">{scene.visual_prompt}</span>
        </div>
      )}
    </div>
  );
}
