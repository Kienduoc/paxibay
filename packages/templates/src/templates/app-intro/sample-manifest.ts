import type { RenderManifest } from "@paxibay/core";

export const sampleAppIntroManifest: RenderManifest = {
  render_id: "00000000-0000-0000-0000-000000000002",
  remotion_composition: "app-intro",
  fps: 30,
  width: 1920,
  height: 1080,
  total_frames: 240,
  music_url:
    "https://archive.org/download/audio-ambient-collection-2024/Song_2_3ed88492-7335-4113-a1ba-0a1f71aceea8.mp3",
  music_volume: 0.18,
  upload_url: "https://example.com/upload",
  upload_token: "studio-stub",
  scenes: [
    {
      slug: "01-hook",
      text: "Sản phẩm bạn dùng hằng ngày — tốc độ là tất cả.",
      start_frame: 0,
      duration_frames: 120,
      voice_url:
        "https://archive.org/download/mindfront-dark-triad/Mindfront_-_Dark_Triad.mp3",
      footage_url:
        "https://videos.pexels.com/video-files/8480244/8480244-hd_1920_1080_25fps.mp4",
    },
    {
      slug: "02-cta",
      text: "Vào app ngay hôm nay. Miễn phí.",
      start_frame: 120,
      duration_frames: 120,
      voice_url:
        "https://archive.org/download/mindfront-dark-triad/Mindfront_-_Dark_Triad.mp3",
      footage_url:
        "https://videos.pexels.com/video-files/8480244/8480244-hd_1920_1080_25fps.mp4",
    },
  ],
};
