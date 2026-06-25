import { createServiceRoleClient } from "./server";

/**
 * Upload a buffer to a Supabase Storage bucket.
 * Returns the public URL (or signed URL for private buckets).
 *
 * Path convention: `<user_id>/<project_id>/<filename>`.
 */
export async function uploadToStorage(opts: {
  bucket: "voice" | "footage" | "music" | "renders" | "assets" | "thumbnails";
  path: string;
  body: Buffer;
  contentType: string;
  upsert?: boolean;
}): Promise<{ url: string; path: string }> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.storage
    .from(opts.bucket)
    .upload(opts.path, opts.body, {
      contentType: opts.contentType,
      upsert: opts.upsert ?? true,
    });
  if (error) {
    throw new Error(`Storage upload failed [${opts.bucket}/${opts.path}]: ${error.message}`);
  }
  // For public buckets, return public URL. For private, return signed URL (1 hour).
  const isPublic = opts.bucket === "music" || opts.bucket === "thumbnails";
  if (isPublic) {
    const { data } = supabase.storage.from(opts.bucket).getPublicUrl(opts.path);
    return { url: data.publicUrl, path: opts.path };
  }
  const { data, error: signError } = await supabase.storage
    .from(opts.bucket)
    .createSignedUrl(opts.path, 60 * 60); // 1 hour
  if (signError || !data) {
    throw new Error(`Signed URL failed: ${signError?.message}`);
  }
  return { url: data.signedUrl, path: opts.path };
}

/** Refresh a signed URL for a private storage object. */
export async function refreshSignedUrl(
  bucket: "voice" | "footage" | "renders" | "assets",
  path: string,
  expiresIn = 3600,
): Promise<string> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error || !data) throw new Error(`Signed URL refresh failed: ${error?.message}`);
  return data.signedUrl;
}
