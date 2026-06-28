/**
 * storageService.ts
 *
 * Handles uploading local file URIs to Supabase Storage and then
 * inserting the DB record — all as a fire-and-forget background job.
 *
 * The upload store is updated throughout so the UI can reflect progress.
 *
 * Buckets in Supabase Storage:
 *   "media"   → zap images/videos & short videos
 *   "stories" → story images/videos
 *   "avatars" → profile pictures & cover photos
 */

import { storyService } from "@/services/storyService";
import { supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/services/supabase";
import { zapService } from "@/services/zapService";
import { useUploadStore } from "@/stores/useUploadStore";
import { AppLogger } from "@/utils/logger";
import { File, UploadType } from "expo-file-system";
import { Platform } from "react-native";

const TAG = "StorageService";

export type UploadBucket =
  | "zap_media"
  | "shorts"
  | "stories"
  | "profile_pictures"
  | "cover_photos"
  | "documents";

// ─── Helpers ────────────────────────────────────────────────────────────────

function mimeFromUri(uri: string): string {
  const lower = uri.toLowerCase().split("?")[0];
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".mov")) return "video/quicktime";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".heic") || lower.endsWith(".heif")) return "image/jpeg";
  return "application/octet-stream";
}

function buildStoragePath(userId: string, uri: string): string {
  const ext = uri.split("?")[0].split(".").pop() ?? "bin";
  const uniqueId = Math.random().toString(36).slice(2, 9);
  return `${userId}/${Date.now()}_${uniqueId}.${ext}`;
}

// ─── Core upload ─────────────────────────────────────────────────────────────

/**
 * Uploads a single local URI to Supabase Storage.
 * @returns Public URL of the uploaded file.
 */
export async function uploadFile(
  localUri: string,
  userId: string,
  bucket: UploadBucket,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const path = buildStoragePath(userId, localUri);
  const contentType = mimeFromUri(localUri);

  AppLogger.info(TAG, `Uploading → ${bucket}/${path} (${contentType})`);
  onProgress?.(5);

  let errorResult: unknown = null;

  if (Platform.OS === "web") {
    try {
      const response = await fetch(localUri);
      if (!response.ok) throw new Error(`Cannot read local file: ${localUri}`);
      const uploadData = await response.blob();
      onProgress?.(40);
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, uploadData, { contentType, upsert: false });
      if (error) errorResult = error;
    } catch (e) {
      errorResult = e;
    }
  } else {
    try {
      // Supabase storage needs auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token || SUPABASE_ANON_KEY;

      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;
      const file = new File(localUri);
      const uploadResult = await file.upload(uploadUrl, {
        httpMethod: "POST",
        uploadType: UploadType.BINARY_CONTENT,
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: SUPABASE_ANON_KEY,
          "Content-Type": contentType,
        },
      });

      if (uploadResult.status !== 200 && uploadResult.status !== 201) {
        errorResult = new Error(
          `Upload failed with status ${uploadResult.status}: ${uploadResult.body}`,
        );
      }
    } catch (e) {
      errorResult = e;
    }
  }

  if (errorResult) {
    AppLogger.error(TAG, "Storage upload failed", errorResult);
    throw errorResult instanceof Error
      ? errorResult
      : new Error(String(errorResult));
  }
  onProgress?.(80);

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  AppLogger.info(TAG, `Upload success → ${urlData.publicUrl}`);
  onProgress?.(100);
  return urlData.publicUrl;
}

// ─── Background job types ────────────────────────────────────────────────────

export interface PostUploadJob {
  type: "post" | "short";
  jobId: string;
  userId: string;
  text: string;
  mediaUris: string[] | null;
  isShort: boolean;
}

export interface StoryUploadJob {
  type: "story";
  jobId: string;
  userId: string;
  caption: string;
  mediaUri: string;
  visibility?: "public" | "followers" | "close_friends";
}

// ─── Background runners (fire-and-forget) ────────────────────────────────────

/**
 * Runs a post/short upload job in the background.
 * Updates the upload store throughout. Never throws — errors are stored.
 */
export async function runPostUploadJob(job: PostUploadJob): Promise<void> {
  const store = useUploadStore.getState();
  store.setUploading(job.jobId, 0);

  AppLogger.info(
    TAG,
    `Starting post upload job [${job.jobId}] for user [${job.userId}]. Media count: ${job.mediaUris?.length ?? 0}`,
  );

  try {
    let remoteUrls: string[] = [];

    if (job.mediaUris && job.mediaUris.length > 0) {
      const bucket: UploadBucket = job.isShort ? "shorts" : "zap_media";
      const totalFiles = job.mediaUris.length;
      const progressArray = new Array(totalFiles).fill(0);

      AppLogger.info(
        TAG,
        `Uploading ${totalFiles} media files in parallel to bucket '${bucket}' for job [${job.jobId}]`,
      );

      // Map each URI to an upload promise
      const uploadPromises = job.mediaUris.map(async (uri, index) => {
        try {
          AppLogger.info(
            TAG,
            `[Job ${job.jobId}] Starting upload of file ${index + 1}/${totalFiles}: ${uri}`,
          );
          const url = await uploadFile(uri, job.userId, bucket, (pct) => {
            progressArray[index] = pct;
            const sumProgress = progressArray.reduce((sum, p) => sum + p, 0);
            const averageProgress = sumProgress / totalFiles;
            // 0-80% of total progress is allocated for storage upload
            const overallPct = Math.round(averageProgress * 0.8);
            store.setUploading(job.jobId, overallPct);
          });
          AppLogger.info(
            TAG,
            `[Job ${job.jobId}] Successfully uploaded file ${index + 1}/${totalFiles}. Remote URL: ${url}`,
          );
          return url;
        } catch (fileError: any) {
          AppLogger.error(
            TAG,
            `[Job ${job.jobId}] Failed to upload file ${index + 1}/${totalFiles} (${uri})`,
            fileError,
          );
          throw new Error(
            `File ${index + 1} upload failed: ${fileError?.message || String(fileError)}`,
          );
        }
      });

      // Wait for all uploads to complete
      remoteUrls = await Promise.all(uploadPromises);
      AppLogger.info(
        TAG,
        `[Job ${job.jobId}] All ${totalFiles} uploads completed successfully. Remote URLs: ${JSON.stringify(remoteUrls)}`,
      );
    } else {
      AppLogger.info(
        TAG,
        `[Job ${job.jobId}] No media files to upload. Proceeding with text-only post.`,
      );
    }

    // Set progress to 85% before DB insertion
    store.setUploading(job.jobId, 85);
    AppLogger.info(
      TAG,
      `[Job ${job.jobId}] Inserting database record for zap.`,
    );

    await zapService.createZap({
      userId: job.userId,
      text: job.text,
      mediaUrls: remoteUrls,
      isShort: job.isShort,
    });

    store.setDone(job.jobId);
    AppLogger.info(TAG, `Post job ${job.jobId} completed successfully`);
  } catch (e: any) {
    const msg = e?.message ?? "Upload failed";
    store.setError(job.jobId, msg);
    AppLogger.error(TAG, `Post job ${job.jobId} failed during execution`, e);
  }
}

/**
 * Runs a story upload job in the background.
 * Updates the upload store throughout. Never throws — errors are stored.
 */
export async function runStoryUploadJob(job: StoryUploadJob): Promise<void> {
  const store = useUploadStore.getState();
  store.setUploading(job.jobId, 0);

  try {
    const remoteUrl = await uploadFile(
      job.mediaUri,
      job.userId,
      "stories",
      (pct) => store.setUploading(job.jobId, Math.round(pct * 0.8)),
    );

    store.setUploading(job.jobId, 85);

    await storyService.createStory({
      userId: job.userId,
      caption: job.caption,
      mediaUrl: remoteUrl,
      visibility: job.visibility ?? "public",
    });

    store.setDone(job.jobId);
    AppLogger.info(TAG, `Story job ${job.jobId} done`);
  } catch (e: any) {
    const msg = e?.message ?? "Upload failed";
    store.setError(job.jobId, msg);
    AppLogger.error(TAG, `Story job ${job.jobId} failed`, e);
  }
}

/**
 * Simple one-shot upload for profile images — still awaited since we need
 * the URL before saving the profile.
 */
export async function uploadProfileImageFile(
  localUri: string,
  userId: string,
  bucket: "profile_pictures" | "cover_photos",
): Promise<string> {
  return uploadFile(localUri, userId, bucket);
}
