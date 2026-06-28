import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Play } from 'lucide-react-native';

interface Props {
  uri: string;
  onAspectRatioCalculated?: (ratio: number) => void;
}

export function ZapVideoPlayer({ uri, onAspectRatioCalculated }: Props) {
  const [manualPaused, setManualPaused] = useState(true);

  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true; // Auto-play muted, or don't autoplay
    p.pause();
  });

  useEffect(() => {
    if (!player || !onAspectRatioCalculated) return;
    
    const checkSize = (videoTrack: any) => {
      if (videoTrack?.size) {
        const { width, height } = videoTrack.size;
        if (width > 0 && height > 0) {
          onAspectRatioCalculated(width / height);
        }
      }
    };
    
    const subscription = player.addListener('videoTrackChange', (payload) => {
      checkSize(payload.videoTrack);
    });
    
    // Check immediately in case it's already loaded
    checkSize(player.videoTrack);

    return () => subscription.remove();
  }, [player, onAspectRatioCalculated]);

  useEffect(() => {
    if (!player) return;
    if (!manualPaused) {
      player.play();
      player.muted = false;
    } else {
      player.pause();
    }
  }, [manualPaused, player]);

  return (
    <View style={styles.container}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="cover"
        nativeControls={true} // Let user have controls
      />
      {manualPaused && (
        <View style={styles.playOverlay} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => setManualPaused(false)}
          >
            <Play size={32} color="#FFF" fill="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    position: 'relative',
  },
  playOverlay: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0, right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
