import type { RenderManifest } from "@paxibay/core";

/**
 * Sample manifest used by Remotion Studio for local preview.
 * In production the web app produces a real manifest pointing to Supabase Storage URLs.
 */
export const sampleReviewManifest: RenderManifest = {
  render_id: "00000000-0000-0000-0000-000000000001",
  remotion_composition: "review",
  fps: 30,
  width: 1920,
  height: 1080,
  total_frames: 300,
  music_url:
    "https://archive.org/download/mindfront-dark-triad/Mindfront_-_Dark_Triad.mp3",
  music_volume: 0.22,
  upload_url: "https://example.com/upload",
  upload_token: "studio-stub",
  scenes: [
    {
      slug: "01-intro",
      text: "Đây là demo template Review chạy trong Remotion Studio.",
      start_frame: 0,
      duration_frames: 150,
      voice_url:
        "https://archive.org/download/mindfront-dark-triad/Mindfront_-_Dark_Triad.mp3",
      footage_url:
        "https://videos.pexels.com/video-files/8480244/8480244-hd_1920_1080_25fps.mp4",
    },
    {
      slug: "02-lesson1",
      text: "Mỗi scene đọc footage và voice từ URL trong manifest — không hardcode.",
      start_frame: 150,
      duration_frames: 150,
      voice_url:
        "https://archive.org/download/mindfront-dark-triad/Mindfront_-_Dark_Triad.mp3",
      footage_url:
        "https://videos.pexels.com/video-files/8480244/8480244-hd_1920_1080_25fps.mp4",
    },
  ],
};
