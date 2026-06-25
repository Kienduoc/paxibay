import { NextResponse } from "next/server";
import { pexelsSearchInputSchema } from "@paxibay/core";
import { requireUser } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";
import { searchPexels, pickBestVideo } from "@/lib/providers/pexels";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    await requireUser();
    const input = pexelsSearchInputSchema.parse(await request.json());
    const videos = await searchPexels(input);
    const items = videos.map((v) => ({
      ...v,
      best_file: pickBestVideo(v),
    }));
    return NextResponse.json({ items });
  } catch (e) {
    return handleApiError(e);
  }
}
