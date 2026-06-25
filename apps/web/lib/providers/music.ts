/**
 * Music library — picks a track from `assets` table matching the requested vibe.
 * Falls back to a default CC0 track if none in DB match.
 */
import { createServiceRoleClient } from "@/lib/supabase/server";

const DEFAULT_TRACK_URL =
  "https://archive.org/download/mindfront-dark-triad/Mindfront_-_Dark_Triad.mp3";

const VIBE_TO_TAGS: Record<string, string[]> = {
  cinematic: ["cinematic", "epic", "orchestra"],
  energetic: ["upbeat", "electronic", "dance"],
  calm: ["ambient", "chill", "soft"],
  dramatic: ["dramatic", "tense", "dark"],
  corporate: ["corporate", "motivational", "uplifting"],
  none: [],
};

export async function pickMusicTrack(vibe: string): Promise<string> {
  if (vibe === "none") return "";
  const tags = VIBE_TO_TAGS[vibe] ?? ["cinematic"];
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("assets")
    .select("url")
    .is("user_id", null)
    .eq("kind", "custom-music")
    .overlaps("tags", tags)
    .limit(5);
  if (data && data.length > 0) {
    // Random pick among matches
    const idx = Math.floor(Math.random() * data.length);
    return data[idx]!.url;
  }
  return DEFAULT_TRACK_URL;
}
