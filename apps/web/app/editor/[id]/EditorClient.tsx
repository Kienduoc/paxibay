"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
type StepStatus = "locked" | "todo" | "running" | "done" | "error";

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
  const [running, setRunning] = useState<StepKey | null>(null);
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [renderInfo, setRenderInfo] = useState<{ download?: string } | null>(null);
  const autoConsumed = useRef(false);

  // ---- derived step statuses (live from data) ----
  const hasScenes = scenes.length > 0;
  const allVoice = hasScenes && scenes.every((s) => s.voice_url);
  const allFootage = hasScenes && scenes.every((s) => s.footage_url);
  const timelineBuilt = project.total_frames > 0;
  const voiceCount = scenes.filter((s) => s.voice_url).length;
  const footageCount = scenes.filter((s) => s.footage_url).length;

  function statusOf(step: StepKey): StepStatus {
    if (running === step) return "running";
    switch (step) {
      case "script":
        return hasScenes ? "done" : "todo";
      case "voice":
        if (!hasScenes) return "locked";
        return allVoice ? "done" : voiceCount > 0 ? "todo" : "todo";
      case "footage":
        if (!hasScenes) return "locked";
        return allFootage ? "done" : "todo";
      case "manifest":
        if (!allVoice) return "locked";
        return timelineBuilt ? "done" : "todo";
      case "render":
        if (!timelineBuilt || !allFootage) return "locked";
        return renderInfo ? "done" : "todo";
    }
  }

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/projects/${project.id}`);
    if (res.ok) {
      const data = await res.json();
      setProject(data);
      setScenes(data.scenes ?? []);
    }
  }, [project.id]);

  // auto-run script generation when redirected from create form
  useEffect(() => {
    if (autoAction === "generate-script" && !autoConsumed.current && scenes.length === 0) {
      autoConsumed.current = true;
      void runScript();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAction]);

  // ============ STEP RUNNERS (client-orchestrated for live progress) ============

  async function runScript(force = false) {
    setRunning("script");
    setError(null);
    setProgress("Đang viết kịch bản bằng AI (có thể mất 10–30s)...");
    try {
      const res = await fetch("/api/generate/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: project.id, force_regenerate: force || hasScenes }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      const r = await res.json();
      setProgress(`✓ Tạo ${r.scenes_created} scene`);
      await refresh();
    } catch (e) {
      setError(`Generate script: ${msg(e)}`);
    } finally {
      setRunning(null);
    }
  }

  async function runVoice() {
    setRunning("voice");
    setError(null);
    const todo = scenes.filter((s) => !s.voice_url);
    let done = 0;
    try {
      for (const sc of todo) {
        setProgress(`Đang tạo voice ${done + 1}/${todo.length} — ${sc.slug}...`);
        const res = await fetch("/api/generate/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scene_id: sc.id }),
        });
        if (res.ok) done++;
        await refresh(); // live update after each scene
      }
      setProgress(`✓ Voice xong ${done}/${todo.length}`);
    } catch (e) {
      setError(`Generate voice: ${msg(e)}`);
    } finally {
      setRunning(null);
    }
  }

  async function runFootage() {
    setRunning("footage");
    setError(null);
    const todo = scenes.filter((s) => !s.footage_url && s.visual_prompt);
    let done = 0;
    try {
      for (const sc of todo) {
        setProgress(`Đang tìm clip ${done + 1}/${todo.length} — "${sc.visual_prompt}"...`);
        await assignFootage(sc, false);
        done++;
        await refresh();
      }
      setProgress(`✓ Footage xong ${done}/${todo.length}`);
    } catch (e) {
      setError(`Find footage: ${msg(e)}`);
    } finally {
      setRunning(null);
    }
  }

  async function runManifest() {
    setRunning("manifest");
    setError(null);
    setProgress("Đang dựng timeline...");
    try {
      const res = await fetch("/api/manifest/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: project.id }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      const r = await res.json();
      setProgress(`✓ Timeline: ${r.total_frames} frames (${r.duration_s?.toFixed(1)}s)`);
      await refresh();
    } catch (e) {
      setError(`Build timeline: ${msg(e)}`);
    } finally {
      setRunning(null);
    }
  }

  async function runRender() {
    setRunning("render");
    setError(null);
    setProgress("Đang chuẩn bị render...");
    try {
      const res = await fetch("/api/renders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: project.id, location: "local" }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      const r = await res.json();
      setRenderInfo({ download: r.download_manifest_url });
      setProgress("✓ Manifest sẵn sàng để render");
    } catch (e) {
      setError(`Render: ${msg(e)}`);
    } finally {
      setRunning(null);
    }
  }

  async function runAll() {
    if (!hasScenes) await runScript();
    if (scenes.some((s) => !s.voice_url) || !hasScenes) await runVoice();
    await runFootage();
    await runManifest();
    await runRender();
  }

  // ============ PER-SCENE actions ============

  async function assignFootage(sc: Scene, doRefresh = true) {
    const search = await fetch("/api/pexels/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: sc.visual_prompt ?? "abstract", per_page: 5 }),
    });
    if (!search.ok) throw new Error("Pexels search lỗi");
    const { items } = await search.json();
    const best = items?.[0]?.best_file;
    if (!best) throw new Error("Không tìm thấy clip phù hợp");
    const assign = await fetch("/api/pexels/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scene_id: sc.id,
        pexels_id: items[0].pexels_id,
        file_url: best.url,
        width: best.width,
        height: best.height,
        duration_s: items[0].duration_s,
      }),
    });
    if (!assign.ok) throw new Error("Gán clip lỗi");
    if (doRefresh) await refresh();
  }

  const [busyScene, setBusyScene] = useState<string | null>(null);

  async function regenSceneVoice(sc: Scene) {
    setBusyScene(sc.id + ":voice");
    setError(null);
    try {
      const res = await fetch("/api/generate/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scene_id: sc.id, force: true }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      await refresh();
    } catch (e) {
      setError(`Voice ${sc.slug}: ${msg(e)}`);
    } finally {
      setBusyScene(null);
    }
  }

  async function swapSceneFootage(sc: Scene) {
    setBusyScene(sc.id + ":footage");
    setError(null);
    try {
      await assignFootage(sc);
    } catch (e) {
      setError(`Clip ${sc.slug}: ${msg(e)}`);
    } finally {
      setBusyScene(null);
    }
  }

  async function saveSceneText(sc: Scene, text: string, visualPrompt: string) {
    setBusyScene(sc.id + ":save");
    setError(null);
    try {
      const res = await fetch(`/api/scenes/${sc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, visual_prompt: visualPrompt }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      await refresh(); // text change invalidated voice → reflected
    } catch (e) {
      setError(`Lưu ${sc.slug}: ${msg(e)}`);
    } finally {
      setBusyScene(null);
    }
  }

  async function deleteScene(sc: Scene) {
    if (!confirm(`Xóa scene "${sc.slug}"?`)) return;
    setBusyScene(sc.id + ":del");
    try {
      await fetch(`/api/scenes/${sc.id}`, { method: "DELETE" });
      await refresh();
    } finally {
      setBusyScene(null);
    }
  }

  async function addScene() {
    setBusyScene("add");
    try {
      await fetch("/api/scenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: project.id }),
      });
      await refresh();
    } finally {
      setBusyScene(null);
    }
  }

  // ============ RENDER ============
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
      {/* LEFT: project + pipeline */}
      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
          <div className="text-[11px] uppercase tracking-wider text-white/40 mb-1">Project</div>
          <h1 className="text-lg font-black leading-tight break-words mb-2">{project.title}</h1>
          <div className="text-xs text-white/50">
            {project.template} · {scenes.length} scene ·{" "}
            {Math.round(project.total_duration_s ?? 0)}s
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
          <div className="text-[11px] uppercase tracking-wider text-white/40 mb-3">Pipeline</div>
          <div className="space-y-1">
            <StepRow n={1} label="Viết kịch bản (AI)" status={statusOf("script")}
              detail={hasScenes ? `${scenes.length} scene` : undefined}
              onRun={() => runScript(true)} />
            <StepRow n={2} label="Tạo voice" status={statusOf("voice")}
              detail={hasScenes ? `${voiceCount}/${scenes.length}` : undefined}
              onRun={runVoice} />
            <StepRow n={3} label="Tìm clip (Pexels)" status={statusOf("footage")}
              detail={hasScenes ? `${footageCount}/${scenes.length}` : undefined}
              onRun={runFootage} />
            <StepRow n={4} label="Dựng timeline" status={statusOf("manifest")}
              detail={timelineBuilt ? `${project.total_frames}f` : undefined}
              onRun={runManifest} />
            <StepRow n={5} label="Render MP4" status={statusOf("render")} onRun={runRender} />
          </div>

          <button
            onClick={runAll}
            disabled={running !== null}
            className="w-full mt-4 px-4 py-3 rounded-xl bg-brand text-black font-bold hover:bg-brand-light disabled:opacity-50"
          >
            {running ? "Đang chạy..." : "▶ Chạy hết"}
          </button>

          {progress && (
            <div className="mt-3 text-xs text-white/70 flex items-center gap-2">
              {running && <Spinner />}
              <span>{progress}</span>
            </div>
          )}
          {error && (
            <div className="mt-3 text-xs p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300">
              ❌ {error}
            </div>
          )}
        </div>

        {renderInfo?.download && (
          <div className="bg-brand/10 border border-brand/30 rounded-2xl p-5">
            <div className="font-bold mb-1 text-sm">🎬 Sẵn sàng render</div>
            <p className="text-xs text-white/70 mb-3">
              Tải manifest về render bằng Remotion CLI (Render Engine đang phát triển).
            </p>
            <a href={renderInfo.download} download
              className="inline-block px-4 py-2 rounded-lg bg-brand text-black font-semibold text-sm">
              ⬇ Tải manifest.json
            </a>
          </div>
        )}
      </div>

      {/* RIGHT: scene workspace */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white/80">
            Scenes {scenes.length > 0 && <span className="text-white/40">({scenes.length})</span>}
          </h2>
          <button onClick={refresh} className="text-xs text-white/50 hover:text-white">🔄 Làm mới</button>
        </div>

        {scenes.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-10 text-center text-white/50">
            {running === "script" ? (
              <div className="flex flex-col items-center gap-3">
                <Spinner big />
                <span>Đang viết kịch bản bằng AI...</span>
              </div>
            ) : (
              'Chưa có scene. Nhấn "Viết kịch bản (AI)" để bắt đầu.'
            )}
          </div>
        ) : (
          <>
            {scenes.map((sc) => (
              <SceneCard
                key={sc.id}
                scene={sc}
                busy={busyScene}
                onSave={saveSceneText}
                onRegenVoice={regenSceneVoice}
                onSwapFootage={swapSceneFootage}
                onDelete={deleteScene}
              />
            ))}
            <button
              onClick={addScene}
              disabled={busyScene === "add"}
              className="w-full py-3 rounded-2xl border border-dashed border-white/20 text-white/50 hover:text-white hover:border-white/40 disabled:opacity-50"
            >
              {busyScene === "add" ? "Đang thêm..." : "+ Thêm scene"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ============ SUB-COMPONENTS ============

function StepRow({ n, label, status, detail, onRun }: {
  n: number; label: string; status: StepStatus; detail?: string; onRun: () => void;
}) {
  const dot = {
    locked: "bg-white/15",
    todo: "bg-white/40",
    running: "bg-amber-400 animate-pulse",
    done: "bg-brand",
    error: "bg-red-500",
  }[status];
  const disabled = status === "locked" || status === "running";
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
      <div className="flex-1 min-w-0">
        <div className={`text-sm ${status === "locked" ? "text-white/30" : "text-white/90"}`}>
          {n}. {label}
        </div>
        {detail && <div className="text-[11px] text-white/40">{detail}</div>}
      </div>
      <button
        onClick={onRun}
        disabled={disabled}
        title={status === "done" ? "Chạy lại" : "Chạy"}
        className="text-xs w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed shrink-0"
      >
        {status === "running" ? "•••" : status === "done" ? "↻" : "▶"}
      </button>
    </div>
  );
}

function SceneCard({ scene, busy, onSave, onRegenVoice, onSwapFootage, onDelete }: {
  scene: Scene;
  busy: string | null;
  onSave: (s: Scene, text: string, vp: string) => void;
  onRegenVoice: (s: Scene) => void;
  onSwapFootage: (s: Scene) => void;
  onDelete: (s: Scene) => void;
}) {
  const [text, setText] = useState(scene.text);
  const [vp, setVp] = useState(scene.visual_prompt ?? "");
  const [editing, setEditing] = useState(false);
  const dirty = text !== scene.text || vp !== (scene.visual_prompt ?? "");

  // keep local state synced when scene refreshes from server (and not actively editing)
  useEffect(() => {
    if (!editing) {
      setText(scene.text);
      setVp(scene.visual_prompt ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.text, scene.visual_prompt]);

  const b = (k: string) => busy === scene.id + ":" + k;

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs font-mono text-brand">{scene.slug}</span>
        <span className="text-[11px] text-white/40">#{scene.position + 1}</span>
        <div className="flex-1" />
        <Badge ok={!!scene.voice_url}
          label={scene.voice_url ? `voice ${scene.voice_duration_s?.toFixed(1)}s` : "voice"} />
        <Badge ok={!!scene.footage_url} label="clip" />
        <button onClick={() => onDelete(scene)} disabled={b("del")}
          className="text-xs text-white/30 hover:text-red-400 ml-1" title="Xóa scene">🗑</button>
      </div>

      {/* text */}
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setEditing(true); }}
        onBlur={() => setEditing(false)}
        rows={3}
        className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm leading-relaxed focus:outline-none focus:border-brand resize-y"
      />

      {/* visual prompt */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[11px] text-white/40 shrink-0">Pexels:</span>
        <input
          value={vp}
          onChange={(e) => { setVp(e.target.value); setEditing(true); }}
          onBlur={() => setEditing(false)}
          className="flex-1 px-2 py-1 rounded bg-black/30 border border-white/10 text-xs font-mono focus:outline-none focus:border-brand"
        />
      </div>

      {/* preview row */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {scene.voice_url && (
          <audio controls src={scene.voice_url} className="h-8" style={{ maxWidth: 240 }} />
        )}
        {scene.footage_url && (
          <video src={scene.footage_url} muted loop playsInline
            onMouseEnter={(e) => e.currentTarget.play()}
            onMouseLeave={(e) => e.currentTarget.pause()}
            className="h-12 w-20 object-cover rounded border border-white/10"
            title="Di chuột để xem" />
        )}
        <div className="flex-1" />
        {dirty && (
          <button onClick={() => onSave(scene, text, vp)} disabled={b("save")}
            className="text-xs px-3 py-1.5 rounded-lg bg-brand text-black font-semibold disabled:opacity-50">
            {b("save") ? "..." : "💾 Lưu"}
          </button>
        )}
        <button onClick={() => onRegenVoice(scene)} disabled={b("voice")}
          className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50">
          {b("voice") ? "..." : "🎙 Voice"}
        </button>
        <button onClick={() => onSwapFootage(scene)} disabled={b("footage")}
          className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50">
          {b("footage") ? "..." : "🎬 Đổi clip"}
        </button>
      </div>
    </div>
  );
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded ${ok ? "text-brand bg-brand/10" : "text-white/40 bg-white/5"}`}>
      {ok ? "✓" : "○"} {label}
    </span>
  );
}

function Spinner({ big }: { big?: boolean }) {
  return (
    <span
      className={`inline-block rounded-full border-2 border-white/20 border-t-brand animate-spin ${big ? "w-6 h-6" : "w-3.5 h-3.5"}`}
    />
  );
}

function msg(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}
