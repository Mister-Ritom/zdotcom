/**
 * useUploadStore.ts
 *
 * Global upload queue. Tracks every background media upload so the UI can
 * show progress without blocking the creation screen.
 *
 * Job lifecycle:
 *   pending → uploading → done
 *                       ↘ error
 */

import { create } from 'zustand';

export type UploadStatus = 'pending' | 'uploading' | 'done' | 'error';
export type UploadType = 'post' | 'short' | 'story';

export interface UploadJob {
  /** Unique job identifier */
  id: string;
  type: UploadType;
  status: UploadStatus;
  /** 0–100 */
  progress: number;
  /** Set when status === 'error' */
  errorMessage?: string;
  /** Human-readable label, e.g. caption snippet */
  label: string;
}

interface UploadState {
  jobs: UploadJob[];
  /** Add a new job in 'pending' state */
  addJob: (job: Omit<UploadJob, 'status' | 'progress'>) => void;
  /** Transition a job to 'uploading' and set progress */
  setUploading: (id: string, progress: number) => void;
  /** Mark a job as successfully done */
  setDone: (id: string) => void;
  /** Mark a job as failed */
  setError: (id: string, message: string) => void;
  /** Remove a job (e.g., after user dismisses it) */
  removeJob: (id: string) => void;
  /** Number of active (pending + uploading) jobs */
  activeCount: () => number;
}

export const useUploadStore = create<UploadState>((set, get) => ({
  jobs: [],

  addJob: (job) =>
    set((s) => ({
      jobs: [
        ...s.jobs,
        { ...job, status: 'pending', progress: 0 },
      ],
    })),

  setUploading: (id, progress) =>
    set((s) => ({
      jobs: s.jobs.map((j) =>
        j.id === id ? { ...j, status: 'uploading', progress } : j,
      ),
    })),

  setDone: (id) =>
    set((s) => ({
      jobs: s.jobs.map((j) =>
        j.id === id ? { ...j, status: 'done', progress: 100 } : j,
      ),
    })),

  setError: (id, message) =>
    set((s) => ({
      jobs: s.jobs.map((j) =>
        j.id === id ? { ...j, status: 'error', errorMessage: message } : j,
      ),
    })),

  removeJob: (id) =>
    set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) })),

  activeCount: () =>
    get().jobs.filter((j) => j.status === 'pending' || j.status === 'uploading').length,
}));
