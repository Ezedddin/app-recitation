import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

export type RecorderStatus = 'idle' | 'requestingPermission' | 'recording' | 'stopped' | 'error';

export interface UseRecitationRecorderResult {
  status: RecorderStatus;
  durationMillis: number;
  uri: string | null;
  errorMessage: string | null;
  permissionDenied: boolean;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  cancel: () => Promise<void>;
  reset: () => void;
}

/**
 * Owns all microphone-recording concerns (permissions, lifecycle, cleanup)
 * behind a small state machine so screens never touch expo-audio directly.
 * Recordings are stored locally (cache directory) for phase 1 — no upload.
 */
export function useRecitationRecorder(): UseRecitationRecorderResult {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 100);

  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [uri, setUri] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      // The recorder's native shared object can already be torn down by the
      // time this runs (e.g. Fast Refresh, or a fast unmount during
      // navigation) — reading `.isRecording` on it then throws rather than
      // returning false, so this must be defensive, not just best-effort.
      try {
        if (recorder.isRecording) {
          recorder.stop().catch(() => {});
        }
      } catch {
        // Native object already released — nothing to clean up.
      }
    };
    // Only run on unmount — intentionally excludes `recorder` from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(async () => {
    setErrorMessage(null);
    setStatus('requestingPermission');
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        if (!isMountedRef.current) return;
        setPermissionDenied(true);
        setStatus('error');
        setErrorMessage('Microphone access is required to record your recitation.');
        return;
      }

      setPermissionDenied(false);
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();

      if (!isMountedRef.current) return;
      setUri(null);
      setStatus('recording');
    } catch (error) {
      if (!isMountedRef.current) return;
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Could not start recording.');
    }
  }, [recorder]);

  const stop = useCallback(async () => {
    try {
      await recorder.stop();
      // The session stays configured for recording until this runs — the
      // review player's `useAudioPlayer` can otherwise fail to load the
      // just-recorded file right after stopping. Playback still needs
      // audio to play in silent mode, so keep that flag on.
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (!isMountedRef.current) return;
      if (recorder.uri) {
        setUri(recorder.uri);
        setStatus('stopped');
      } else {
        setStatus('error');
        setErrorMessage('The recording could not be saved. Please try again.');
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Recording failed.');
    }
  }, [recorder]);

  const cancel = useCallback(async () => {
    try {
      if (recorder.isRecording) {
        await recorder.stop();
      }
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    } catch {
      // Best-effort cleanup — the recorder is being discarded either way.
    } finally {
      if (isMountedRef.current) {
        setUri(null);
        setStatus('idle');
        setErrorMessage(null);
      }
    }
  }, [recorder]);

  const reset = useCallback(() => {
    setUri(null);
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  return {
    status,
    durationMillis: recorderState.durationMillis ?? 0,
    uri,
    errorMessage,
    permissionDenied,
    start,
    stop,
    cancel,
    reset,
  };
}
