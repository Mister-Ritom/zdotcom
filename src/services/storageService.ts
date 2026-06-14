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

import { supabase } from '@/services/supabase';
import { AppLogger } from '@/utils/logger';
import { useUploadStore, type UploadType } from '@/stores/useUploadStore';
import { zapService } from '@/services/zapService';
import { storyService } from '@/services/storyService';
import { type ZapModel } from '@/types/models';
import { type StoryModel } from '@/types/models';

const TAG = 'StorageService';

export type UploadBucket = 'zap_media' | 'shorts' | 'stories' | 'profile_pictures' | 'cover_photos' | 'documents';

// ─── Helpers ────────────────────────────────────────────────────────────────

function mimeFromUri(uri: string): string {
  const lower = uri.toLowerCase().split('?')[0];
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/jpeg';
  return 'application/octet-stream';
}

function buildStoragePath(userId: string, uri: string): string {
  const ext = uri.split('?')[0].split('.').pop() ?? 'bin';
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

  const response = await fetch(localUri);
  if (!response.ok) throw new Error(`Cannot read local file: ${localUri}`);
  const arrayBuffer = await response.arrayBuffer();
  onProgress?.(40);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuffer, { contentType, upsert: false });

  if (error) {
    AppLogger.error(TAG, 'Storage upload failed', error);
    throw new Error(error.message);
  }
  onProgress?.(80);

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  AppLogger.info(TAG, `Upload success → ${urlData.publicUrl}`);
  onProgress?.(100);
  return urlData.publicUrl;
}

// ─── Background job types ────────────────────────────────────────────────────

export interface PostUploadJob {
  type: 'post' | 'short';
  jobId: string;
  userId: string;
  text: string;
  mediaUri: string | null;
  isShort: boolean;
}

export interface StoryUploadJob {
  type: 'story';
  jobId: string;
  userId: string;
  caption: string;
  mediaUri: string;
  visibility?: 'public' | 'followers' | 'close_friends';
}

// ─── Background runners (fire-and-forget) ────────────────────────────────────

/**
 * Runs a post/short upload job in the background.
 * Updates the upload store throughout. Never throws — errors are stored.
 */
export async function runPostUploadJob(job: PostUploadJob): Promise<void> {
  const store = useUploadStore.getState();
  store.setUploading(job.jobId, 0);

  try {
    let remoteUrl: string | null = null;

    if (job.mediaUri) {
      const bucket: UploadBucket = job.isShort ? 'shorts' : 'zap_media';
      remoteUrl = await uploadFile(
        job.mediaUri,
        job.userId,
        bucket,
        (pct) => store.setUploading(job.jobId, Math.round(pct * 0.8)), // 0-80% for upload
      );
    }

    store.setUploading(job.jobId, 85);

    await zapService.createZap({
      userId: job.userId,
      text: job.text,
      mediaUrls: remoteUrl ? [remoteUrl] : [],
      isShort: job.isShort,
    });

    store.setDone(job.jobId);
    AppLogger.info(TAG, `Post job ${job.jobId} done`);
  } catch (e: any) {
    const msg = e?.message ?? 'Upload failed';
    store.setError(job.jobId, msg);
    AppLogger.error(TAG, `Post job ${job.jobId} failed`, e);
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
      'stories',
      (pct) => store.setUploading(job.jobId, Math.round(pct * 0.8)),
    );

    store.setUploading(job.jobId, 85);

    await storyService.createStory({
      userId: job.userId,
      caption: job.caption,
      mediaUrl: remoteUrl,
      visibility: job.visibility ?? 'public',
    });

    store.setDone(job.jobId);
    AppLogger.info(TAG, `Story job ${job.jobId} done`);
  } catch (e: any) {
    const msg = e?.message ?? 'Upload failed';
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
  bucket: 'profile_pictures' | 'cover_photos',
): Promise<string> {
  return uploadFile(localUri, userId, bucket);
}
