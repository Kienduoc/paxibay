/**
 * Multi-provider TTS client.
 *
 * - edge-tts: free, server-side via msedge-tts WebSocket. No key needed.
 * - vbee: paid, requires BYOK (app_id + token). Async polling via existing
 *         /v1/tts → /v1/tts/requests/:id endpoints (proven by gen-voice.py).
 * - piper: local-only — engine fetches MP3, not called from server.
 *
 * Returns Buffer (MP3 bytes). Caller uploads to Supabase Storage.
 */
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import type { VoiceProvider } from "@paxibay/core";
import { ApiException } from "@/lib/api/errors";

export interface TtsRequest {
  text: string;
  voice_code: string;
  speed?: number;
}

export interface TtsResult {
  mp3: Buffer;
  bytes: number;
  duration_estimate_s: number;   // rough — measure after upload with ffprobe
}

export interface VbeeCreds {
  app_id: string;
  token: string;
}

export async function synthesize(
  provider: VoiceProvider,
  req: TtsRequest,
  vbeeCreds?: VbeeCreds,
): Promise<TtsResult> {
  switch (provider) {
    case "edge-tts":
      return synthesizeEdgeTts(req);
    case "vbee":
      if (!vbeeCreds) {
        throw new ApiException("VALIDATION_ERROR", "Vbee BYOK creds required (app_id + token)");
      }
      return synthesizeVbee(req, vbeeCreds);
    case "piper":
      throw new ApiException(
        "VALIDATION_ERROR",
        "Piper local — render engine xử lý, không gọi từ server.",
      );
  }
}

// --- EDGE-TTS -------------------------------------------------------------
async function synthesizeEdgeTts(req: TtsRequest): Promise<TtsResult> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(req.voice_code, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  // Speed via prosody rate. msedge-tts accepts rate like "+10%", "-5%".
  const speedPct = Math.round(((req.speed ?? 1.0) - 1) * 100);
  const rate = speedPct >= 0 ? `+${speedPct}%` : `${speedPct}%`;

  const chunks: Buffer[] = [];
  const { audioStream } = tts.toStream(req.text, { rate });
  await new Promise<void>((resolve, reject) => {
    audioStream.on("data", (c: Buffer) => chunks.push(c));
    audioStream.on("end", () => resolve());
    audioStream.on("error", (e: Error) => reject(e));
  });
  const mp3 = Buffer.concat(chunks);
  return {
    mp3,
    bytes: mp3.length,
    duration_estimate_s: estimateDuration(req.text, req.speed ?? 1.0),
  };
}

// --- VBEE -----------------------------------------------------------------
async function synthesizeVbee(req: TtsRequest, creds: VbeeCreds): Promise<TtsResult> {
  const submit = await fetch("https://api.vbee.vn/v1/tts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.token}`,
      "App-Id": creds.app_id,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: req.text,
      voiceCode: req.voice_code,
      outputFormat: "mp3",
      bitrate: 128,
      speed: req.speed ?? 1.0,
      mode: "async",
      webhookUrl: "https://webhook.site/dummy",
    }),
  });
  if (!submit.ok) {
    throw new ApiException("EXTERNAL_API_ERROR", `Vbee submit ${submit.status}: ${await submit.text()}`);
  }
  const { requestId } = await submit.json();

  // Poll for completion
  const deadline = Date.now() + 90_000;
  let audioUrl: string | null = null;
  while (Date.now() < deadline) {
    const poll = await fetch(`https://api.vbee.vn/v1/tts/requests/${requestId}`, {
      headers: { Authorization: `Bearer ${creds.token}`, "App-Id": creds.app_id },
    });
    if (poll.ok) {
      const body = await poll.json();
      if (body.status === "COMPLETED") {
        audioUrl = body.audioLink;
        break;
      }
      if (body.status === "FAILED") {
        throw new ApiException("EXTERNAL_API_ERROR", `Vbee failed: ${JSON.stringify(body)}`);
      }
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  if (!audioUrl) {
    throw new ApiException("EXTERNAL_API_ERROR", "Vbee timeout (90s)");
  }

  // Download MP3
  const download = await fetch(audioUrl);
  if (!download.ok) {
    throw new ApiException("EXTERNAL_API_ERROR", `Vbee audio download ${download.status}`);
  }
  const mp3 = Buffer.from(await download.arrayBuffer());
  return {
    mp3,
    bytes: mp3.length,
    duration_estimate_s: estimateDuration(req.text, req.speed ?? 1.0),
  };
}

// --- HELPERS --------------------------------------------------------------
function estimateDuration(text: string, speed: number): number {
  // Rough heuristic: Vietnamese narration ~15 chars/sec at speed 1.0.
  const charsPerSec = 15 * speed;
  return text.length / charsPerSec;
}
