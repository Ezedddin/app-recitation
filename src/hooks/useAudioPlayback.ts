import { useCallback } from 'react';
import { useAudioPlayer, useAudioPlayerStatus, type AudioSource } from 'expo-audio';

export interface UseAudioPlaybackResult {
  isPlaying: boolean;
  isLoaded: boolean;
  positionSeconds: number;
  durationSeconds: number;
  rate: number;
  error: string | null;
  play: () => void;
  pause: () => void;
  replay: () => Promise<void>;
  setRate: (rate: number) => void;
}

/**
 * Thin, reusable wrapper around expo-audio playback. Used for both the
 * reference-reciter audio and for letting the user play back their own
 * recording — the source is the only thing that differs.
 */
export function useAudioPlayback(source: AudioSource | null): UseAudioPlaybackResult {
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);

  const play = useCallback(() => player.play(), [player]);
  const pause = useCallback(() => player.pause(), [player]);
  const replay = useCallback(async () => {
    try {
      await player.seekTo(0);
      player.play();
    } catch {
      // The screen may have unmounted mid-seek, releasing the native
      // player — nothing to recover, just don't crash on the stale call.
    }
  }, [player]);
  const setRate = useCallback((rate: number) => player.setPlaybackRate(rate, 'high'), [player]);

  return {
    isPlaying: status.playing,
    isLoaded: status.isLoaded,
    positionSeconds: status.currentTime ?? 0,
    durationSeconds: status.duration ?? 0,
    rate: status.playbackRate ?? 1,
    error: status.error ?? null,
    play,
    pause,
    replay,
    setRate,
  };
}
