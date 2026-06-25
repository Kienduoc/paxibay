import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrompt } from "@paxibay/prompts";
import { requireUser } from "@/lib/api/auth";
import { handleApiError, ApiException } from "@/lib/api/errors";
import { callLlm, parseJsonResponse } from "@/lib/providers/llm";
import { getUserByok } from "@/lib/api/byok";

export const runtime = "nodejs";
export const maxDuration = 60;

const inputSchema = z.object({
  project_id: z.string().uuid(),
  force_regenerate: z.boolean().default(false),
});

interface LlmSceneOutput {
  scenes: Array<{
    slug: string;
    text: string;
    visual_prompt: string;
  }>;
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const { project_id, force_regenerate } = inputSchema.parse(await request.json());

    // Load project
    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .single();
    if (error || !project) throw new ApiException("NOT_FOUND", "Project not found");

    // Check if scenes already exist
    const { count: existingScenes } = await supabase
      .from("scenes")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project_id);
    if ((existingScenes ?? 0) > 0 && !force_regenerate) {
      throw new ApiException(
        "VALIDATION_ERROR",
        "Scenes already exist. Pass force_regenerate=true to overwrite.",
      );
    }

    // Get prompt template
    const prompt = getPrompt(project.template);
    if (!prompt) {
      throw new ApiException(
        "VALIDATION_ERROR",
        `Template "${project.template}" chưa có prompt — chưa support trong MVP`,
      );
    }

    // BYOK lookup
    const providerKey = project.llm_provider === "claude" ? "anthropic" : project.llm_provider;
    const byok = await getUserByok(user.id, providerKey);

    // Call LLM
    const result = await callLlm(
      project.llm_provider,
      project.llm_model,
      {
        system: prompt.system,
        user: prompt.user({
          topic: project.topic,
          audience: project.audience ?? "general",
          tone: project.tone ?? "professional",
          duration_target_s: project.duration_target_s,
        }),
        max_tokens: 8000,
        temperature: 0.8,
      },
      byok?.secret,
    );

    // Parse JSON
    const parsed = parseJsonResponse<LlmSceneOutput>(result.text);
    if (!parsed.scenes || !Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
      throw new ApiException("EXTERNAL_API_ERROR", "LLM returned no scenes");
    }

    // Wipe existing scenes if regenerating
    if (force_regenerate) {
      await supabase.from("scenes").delete().eq("project_id", project_id);
    }

    // Insert scenes
    const sceneRows = parsed.scenes.map((s, i) => ({
      project_id,
      position: i,
      slug: s.slug,
      text: s.text,
      visual_prompt: s.visual_prompt,
    }));
    const { error: insertError } = await supabase.from("scenes").insert(sceneRows);
    if (insertError) {
      throw new ApiException("INTERNAL", `Insert scenes: ${insertError.message}`);
    }

    // Update project status → ready
    await supabase
      .from("projects")
      .update({ status: "ready" })
      .eq("id", project_id);

    // Log usage
    await supabase.from("usage_events").insert({
      user_id: user.id,
      event: "script_generated",
      project_id,
      payload: {
        llm_provider: project.llm_provider,
        llm_model: project.llm_model,
        llm_input_tokens: result.input_tokens,
        llm_output_tokens: result.output_tokens,
        cost_usd: result.cost_usd,
        scenes_created: parsed.scenes.length,
      },
    });

    return NextResponse.json({
      project_id,
      scenes_created: parsed.scenes.length,
      llm_input_tokens: result.input_tokens,
      llm_output_tokens: result.output_tokens,
      cost_usd: result.cost_usd,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
