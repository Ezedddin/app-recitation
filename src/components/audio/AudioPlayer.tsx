import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { AudioSource } from 'expo-audio';

import { Waveform } from './Waveform';
import { Colors, Radius, Spacing, Typography } from '@/constants';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { formatDuration } from '@/utils/format';

const SPEED_OPTIONS = [0.75, 1, 1.25] as const;

interface AudioPlayerProps {
  source: AudioSource | null;
  label?: string;
  allowSpeedControl?: boolean;
}

/** Full reference-audio player: play/pause, replay, and a slow/normal/fast speed cycle. */
export function AudioPlayer({ source, label, allowSpeedControl = true }: AudioPlayerProps) {
  const player = useAudioPlayback(source);

  const cycleSpeed = () => {
    const currentIndex = SPEED_OPTIONS.indexOf(player.rate as (typeof SPEED_OPTIONS)[number]);
    const next = SPEED_OPTIONS[(currentIndex + 1) % SPEED_OPTIONS.length] ?? 1;
    player.setRate(next);
  };

  if (player.error) {
    return (
      <View style={styles.errorRow}>
        <Ionicons name="alert-circle-outline" size={18} color={Colors.feedbackCaution} />
        <Text style={styles.errorText}>This audio couldn&apos;t be played. Check your connection and try again.</Text>
      </View>
    );
  }

  const isBuffering = Boolean(source) && !player.isLoaded;

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Waveform isActive={player.isPlaying} />

      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Restart from the beginning"
          onPress={player.replay}
          hitSlop={8}
          style={styles.iconButton}>
          <Ionicons name="play-back" size={18} color={Colors.text} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isBuffering ? 'Loading audio' : player.isPlaying ? 'Pause' : 'Play'}
          disabled={isBuffering}
          onPress={player.isPlaying ? player.pause : player.play}
          style={[styles.playButton, isBuffering && styles.playButtonBuffering]}>
          {isBuffering ? (
            <ActivityIndicator size="small" color={Colors.onPrimary} />
          ) : (
            <Ionicons name={player.isPlaying ? 'pause' : 'play'} size={22} color={Colors.onPrimary} />
          )}
        </Pressable>

        <Text style={styles.time}>
          {formatDuration(player.positionSeconds)} / {formatDuration(player.durationSeconds)}
        </Text>

        {allowSpeedControl ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Playback speed, currently ${player.rate}x`}
            onPress={cycleSpeed}
            hitSlop={8}
            style={styles.speedButton}>
            <Text style={styles.speedText}>{player.rate}x</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  label: {
    ...Typography.subhead,
    color: Colors.secondaryText,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  playButtonBuffering: {
    backgroundColor: Colors.sage,
  },
  time: {
    ...Typography.caption,
    color: Colors.secondaryText,
    flex: 1,
  },
  speedButton: {
    minWidth: 44,
    height: 32,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.goldAccentMuted,
  },
  speedText: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '700',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
  },
  errorText: {
    ...Typography.footnote,
    color: Colors.feedbackCaution,
    flex: 1,
  },
});
