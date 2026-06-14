/**
 * UploadStatusBanner.tsx
 *
 * Floating banner shown at the bottom of the screen when there are
 * active or failed upload jobs. Reads from useUploadStore.
 *
 * - Uploading: animated progress bar + label
 * - Done: shown briefly (auto-dismissed after 2s)
 * - Error: shown with a retry option (currently just dismiss)
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, AlertCircle, Upload, X } from 'lucide-react-native';
import { useUploadStore, type UploadJob } from '@/stores/useUploadStore';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Auto-dismiss done jobs after 3 seconds
const DONE_DISMISS_MS = 3000;

function JobRow({ job }: { job: UploadJob }) {
  const isDark = useColorScheme() === 'dark';
  const { removeJob } = useUploadStore();
  const progressAnim = useRef(new Animated.Value(job.progress)).current;

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: job.progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [job.progress]);

  // Auto-dismiss done jobs
  useEffect(() => {
    if (job.status === 'done') {
      const t = setTimeout(() => removeJob(job.id), DONE_DISMISS_MS);
      return () => clearTimeout(t);
    }
  }, [job.status]);

  const barColor =
    job.status === 'error' ? '#EF4444' :
    job.status === 'done'  ? '#22C55E' : '#208AEF';

  const icon =
    job.status === 'done'  ? <CheckCircle size={16} color="#22C55E" /> :
    job.status === 'error' ? <AlertCircle size={16} color="#EF4444" /> :
                             <Upload size={16} color="#208AEF" />;

  const statusText =
    job.status === 'done'    ? 'Published!' :
    job.status === 'error'   ? job.errorMessage ?? 'Failed' :
    job.status === 'uploading' ? `Uploading… ${job.progress}%` :
                                 'Waiting…';

  return (
    <View style={styles.jobRow}>
      <View style={styles.jobLeft}>
        {icon}
        <View style={styles.jobTextWrap}>
          <Text
            style={[styles.jobLabel, { color: isDark ? '#FFF' : '#18181B' }]}
            numberOfLines={1}
          >
            {job.label}
          </Text>
          <Text style={[styles.jobStatus, { color: barColor }]}>
            {statusText}
          </Text>
        </View>
      </View>

      <TouchableOpacity onPress={() => removeJob(job.id)} style={styles.dismissBtn}>
        <X size={14} color="#888" />
      </TouchableOpacity>

      {/* Progress bar */}
      {(job.status === 'uploading' || job.status === 'pending') && (
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: barColor,
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      )}
    </View>
  );
}

export default function UploadStatusBanner() {
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const jobs = useUploadStore((s) => s.jobs);

  // Only show if there's at least one active/error/done job
  const visible = jobs.length > 0;
  const slideAnim = useRef(new Animated.Value(visible ? 0 : 120)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : 120,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (jobs.length === 0) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#18181B' : '#FFFFFF',
          bottom: insets.bottom + 80, // above tab bar
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {jobs.map((job) => (
        <JobRow key={job.id} job={job} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderRadius: 14,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 9999,
    overflow: 'hidden',
  },
  jobRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  jobLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  jobTextWrap: {
    flex: 1,
  },
  jobLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  jobStatus: {
    fontSize: 12,
    marginTop: 1,
  },
  dismissBtn: {
    position: 'absolute',
    top: 10,
    right: 14,
    padding: 4,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(128,128,128,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
