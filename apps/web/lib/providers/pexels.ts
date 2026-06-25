/**
 * Pexels Videos API wrapper.
 * Free tier: 200 requests/hour, 20k/month. Anonymous via API key header.
 */
import { ApiException } from "@/lib/api/errors";

export interface PexelsVideoFile {
  url: string;
  width: number;
  height: number;
  quality?: string;
  file_type: string;
  size_mb?: number;
}

export interface PexelsVideo {
  pexels_id: number;
  duration_s: number;
  thumbnail: string;
  files: PexelsVideoFile[];
}

export async function searchPexels(opts: {
  query: string;
  per_page?: number;
  orientation?: "landscape" | "portrait" | "square";
}): Promise<PexelsVideo[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) {
    throw new ApiException("EXTERNAL_API_ERROR", "PEXELS_API_KEY chưa cấu hình");
  }
  const params = new URLSearchParams({
    query: opts.query,
    per_page: String(opts.per_page ?? 8),
    orientation: opts.orientation ?? "landscape",
    size: "medium",
  });
  const response = await fetch(`https://api.pexels.com/videos/search?${params}`, {
    headers: {
      Authorization: key,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36",
    },
  });
  if (!response.ok) {
    throw new ApiException("EXTERNAL_API_ERROR", `Pexels ${response.status}: ${await response.text()}`);
  }
  const data = await response.json();
  return (data.videos ?? []).map((v: PexelsVideoRaw): PexelsVideo => ({
    pexels_id: v.id,
    duration_s: v.duration,
    thumbnail: v.image,
    files: v.video_files.map((f) => ({
      url: f.link,
      width: f.width,
      height: f.height,
      quality: f.quality,
      file_type: f.file_type,
      size_mb: f.file_size_bytes ? Math.round(f.file_size_bytes / 1_000_000) : undefined,
    })),
  }));
}

/** Pick the best HD-quality MP4 ≤1920px wide. Returns null if no suitable file. */
export function pickBestVideo(video: PexelsVideo): PexelsVideoFile | null {
  const candidates = video.files
    .filter((f) => f.file_type === "video/mp4" && f.width >= 1280 && f.width <= 1920)
    .sort((a, b) => b.width - a.width);
  return candidates[0] ?? video.files[0] ?? null;
}

/** Download a video and return as Buffer. Use sparingly — videos can be 10-30MB. */
export async function downloadPexelsVideo(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!response.ok) {
    throw new ApiException("EXTERNAL_API_ERROR", `Pexels download ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

// Internal — raw API response shape
interface PexelsVideoRaw {
  id: number;
  duration: number;
  image: string;
  video_files: Array<{
    link: string;
    width: number;
    height: number;
    quality?: string;
    file_type: string;
    file_size_bytes?: number;
  }>;
}
