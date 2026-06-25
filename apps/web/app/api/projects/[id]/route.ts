import { NextResponse } from "next/server";
import { updateProjectInputSchema } from "@paxibay/core";
import { requireUser } from "@/lib/api/auth";
import { handleApiError, ApiException } from "@/lib/api/errors";

export const runtime = "nodejs";

// GET /api/projects/:id — project + all scenes
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase } = await requireUser();
    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !project) throw new ApiException("NOT_FOUND", "Project not found");

    const { data: scenes } = await supabase
      .from("scenes")
      .select("*")
      .eq("project_id", id)
      .order("position", { ascending: true });

    return NextResponse.json({ ...project, scenes: scenes ?? [] });
  } catch (e) {
    return handleApiError(e);
  }
}

// PATCH /api/projects/:id — partial update
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase } = await requireUser();
    const body = await request.json();
    const input = updateProjectInputSchema.parse(body);

    const { data, error } = await supabase
      .from("projects")
      .update(input)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new ApiException("INTERNAL", error.message);
    if (!data) throw new ApiException("NOT_FOUND", "Project not found");
    return NextResponse.json(data);
  } catch (e) {
    return handleApiError(e);
  }
}

// DELETE /api/projects/:id — soft delete
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase } = await requireUser();
    const { error } = await supabase
      .from("projects")
      .update({ status: "archived" })
      .eq("id", id);
    if (error) throw new ApiException("INTERNAL", error.message);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return handleApiError(e);
  }
}
