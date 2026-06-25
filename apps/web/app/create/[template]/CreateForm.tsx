"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TemplateId } from "@paxibay/core";

export function CreateForm({
  template,
  recommendedDuration,
  initialTopic,
}: {
  template: TemplateId;
  recommendedDuration: number;
  initialTopic: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [topic, setTopic] = useState(initialTopic);
  const [audience, setAudience] = useState("smb");
  const [tone, setTone] = useState("professional");
  const [duration, setDuration] = useState(recommendedDuration);
  const [llmProvider, setLlmProvider] = useState("claude");
  const [llmModel, setLlmModel] = useState("claude-sonnet-4-6");
  const [voiceProvider, setVoiceProvider] = useState<"edge-tts" | "vbee">("edge-tts");
  const [voiceCode, setVoiceCode] = useState("vi-VN-HoaiMyNeural");
  const [musicVibe, setMusicVibe] = useState("cinematic");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // 1. Create project
      const createRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template,
          topic,
          audience,
          tone,
          duration_target_s: duration,
          llm_provider: llmProvider,
          llm_model: llmModel,
          voice_provider: voiceProvider,
          voice_code: voiceCode,
          music_vibe: musicVibe,
        }),
      });
      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.message ?? "Tạo project thất bại");
      }
      const project = await createRes.json();

      // 2. Redirect to editor — script generation triggered there
      router.push(`/editor/${project.id}?action=generate-script`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 space-y-6">
      <div>
        <label className="block text-sm font-bold mb-2">CHỦ ĐỀ / Ý TƯỞNG *</label>
        <textarea
          required
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          rows={3}
          placeholder='vd: "Review sách Đắc Nhân Tâm — 5 nguyên tắc thay đổi cuộc sống"'
          className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:border-brand resize-none text-base"
        />
      </div>

      <FieldRadio
        label="TARGET AUDIENCE"
        value={audience}
        onChange={setAudience}
        options={[
          { value: "smb", label: "SMB / Doanh nghiệp" },
          { value: "creator", label: "Creator / KOL" },
          { value: "educator", label: "Educator" },
          { value: "general", label: "Khác" },
        ]}
      />

      <FieldRadio
        label="TONE"
        value={tone}
        onChange={setTone}
        options={[
          { value: "professional", label: "Chuyên nghiệp" },
          { value: "energetic", label: "Năng động" },
          { value: "dramatic", label: "Drama" },
          { value: "humor", label: "Hài hước" },
        ]}
      />

      <FieldRadio
        label={`THỜI LƯỢNG (đề xuất ${recommendedDuration}s)`}
        value={String(duration)}
        onChange={(v) => setDuration(parseInt(v))}
        options={[
          { value: "30", label: "30s" },
          { value: "60", label: "60s" },
          { value: "90", label: "90s" },
          { value: "120", label: "2 phút" },
          { value: "300", label: "5 phút" },
          { value: "600", label: "10 phút" },
        ]}
      />

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm text-brand hover:text-brand-light"
      >
        {showAdvanced ? "⊟ Ẩn nâng cao" : "⊞ Cài đặt nâng cao (LLM, Voice, Music)"}
      </button>

      {showAdvanced && (
        <div className="space-y-6 pt-2 border-t border-white/10">
          <div>
            <label className="block text-sm font-bold mb-2">AI MODEL</label>
            <select
              value={`${llmProvider}::${llmModel}`}
              onChange={(e) => {
                const [p, m] = e.target.value.split("::");
                if (p) setLlmProvider(p);
                if (m) setLlmModel(m);
              }}
              className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:border-brand"
            >
              <option value="claude::claude-sonnet-4-6">Claude Sonnet 4.6 (mặc định)</option>
              <option value="claude::claude-opus-4-8">Claude Opus 4.8 (premium)</option>
              <option value="claude::claude-haiku-4-5">Claude Haiku 4.5 (nhanh)</option>
              <option value="openrouter::anthropic/claude-sonnet-4-6">OpenRouter → Claude (BYOK)</option>
              <option value="openrouter::deepseek/deepseek-r1">OpenRouter → DeepSeek R1 (rẻ)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">VOICE</label>
            <select
              value={`${voiceProvider}::${voiceCode}`}
              onChange={(e) => {
                const [p, c] = e.target.value.split("::");
                if (p) setVoiceProvider(p as "edge-tts" | "vbee");
                if (c) setVoiceCode(c);
              }}
              className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:border-brand"
            >
              <optgroup label="Edge-TTS (miễn phí)">
                <option value="edge-tts::vi-VN-HoaiMyNeural">HoaiMy — nữ HN</option>
                <option value="edge-tts::vi-VN-NamMinhNeural">NamMinh — nam HN</option>
              </optgroup>
              <optgroup label="Vbee (BYOK)">
                <option value="vbee::hn_male_minhquan_yt-stable">HN — Minh Quân</option>
                <option value="vbee::hn_female_ngochuyen_full_48k-fhg">HN — Ngọc Huyền</option>
                <option value="vbee::sg_female_tuongvy_call_44k-fhg">SG — Tường Vy</option>
              </optgroup>
            </select>
          </div>

          <FieldRadio
            label="NHẠC NỀN"
            value={musicVibe}
            onChange={setMusicVibe}
            options={[
              { value: "cinematic", label: "Cinematic" },
              { value: "energetic", label: "Năng động" },
              { value: "calm", label: "Calm" },
              { value: "dramatic", label: "Drama" },
              { value: "none", label: "Không nhạc" },
            ]}
          />
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={() => history.back()}
          className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={submitting || !topic}
          className="px-8 py-3 rounded-xl bg-brand text-black font-bold hover:bg-brand-light disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Đang tạo..." : "Tạo script →"}
        </button>
      </div>
    </form>
  );
}

function FieldRadio({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-bold mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              value === o.value
                ? "bg-brand text-black font-semibold"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
