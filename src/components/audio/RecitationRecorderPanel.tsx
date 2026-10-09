import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { AudioPlayer } from './AudioPlayer';
import { RecordButton } from './RecordButton';
import { Waveform } from './Waveform';
import { PrimaryButton } from '@/components/ui';
import { Colors, Radius, Spacing, Typography } from '@/constants';
import type { UseRecitationRecorderResult } from '@/hooks/useRecitationRecorder';
import { formatMillis } from '@/utils/format';

interface RecitationRecorderPanelProps {
  recorder: UseRecitationRecorderResult;
  onAnalyze: () => void;
  analyzeLabel?: string;
}

/**
 * The idle → recording → review state machine shared by every "record
 * yourself reciting" screen (regular practice, voice discovery, ...).
 * Owns none of the recording logic itself — that's `useRecitationRecorder`.
 */
export function RecitationRecorderPanel({ recorder, onAnalyze, analyzeLabel = 'Analyze recitation' }: RecitationRecorderPanelProps) {
  if (recorder.status === 'recording') {
    return <RecordingPanel durationMillis={recorder.durationMillis} onCancel={recorder.cancel} onFinish={recorder.stop} />;
  }

  if (recorder.status === 'stopped' && recorder.uri) {
    return (
      <ReviewPanel uri={recorder.uri} onDelete={recorder.reset} onAnalyze={onAnalyze} analyzeLabel={analyzeLabel} />
    );
  }

  return (
    <IdlePanel
      errorMessage={recorder.errorMessage}
      permissionDenied={recorder.permissionDenied}
      isBusy={recorder.status === 'requestingPermission'}
      onPress={recorder.start}
    />
  );
}

function IdlePanel({
  errorMessage,
  permissionDenied,
  isBusy,
  onPress,
}: {
  errorMessage: string | null;
  permissionDenied: boolean;
  isBusy: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.idleWrap}>
      <Text style={styles.yourTurn}>Your turn</Text>
      <RecordButton isRecording={false} disabled={isBusy} onPress={onPress} />
      <Text style={styles.caption}>Recite when you&apos;re ready.</Text>

      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color={Colors.feedbackCaution} />
          <Text style={styles.errorText}>{errorMessage}</Text>
          {permissionDenied ? (
            <Pressable onPress={() => Linking.openSettings()} hitSlop={8}>
              <Text style={styles.errorAction}>Open Settings</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function RecordingPanel({
  durationMillis,
  onCancel,
  onFinish,
}: {
  durationMillis: number;
  onCancel: () => void;
  onFinish: () => void;
}) {
  return (
    <View style={styles.recordingWrap}>
      <Text style={styles.timer}>{formatMillis(durationMillis)}</Text>
      <Waveform isActive height={48} />
      <RecordButton isRecording onPress={onFinish} size={76} />
      <View style={styles.recordingActions}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cancel recording" onPress={onCancel}>
          <Text style={styles.cancelLabel}>Cancel</Text>
        </Pressable>
        <PrimaryButton label="Finish" onPress={onFinish} style={styles.finishButton} />
      </View>
    </View>
  );
}

function ReviewPanel({
  uri,
  onDelete,
  onAnalyze,
  analyzeLabel,
}: {
  uri: string;
  onDelete: () => void;
  onAnalyze: () => void;
  analyzeLabel: string;
}) {
  return (
    <View style={styles.reviewWrap}>
      <View style={styles.reviewRow}>
        <View style={styles.reviewPlayer}>
          <AudioPlayer source={{ uri }} allowSpeedControl={false} label="Your recording" />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Delete recording" onPress={onDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={18} color={Colors.feedbackCaution} />
        </Pressable>
      </View>
      <PrimaryButton label={analyzeLabel} onPress={onAnalyze} />
    </View>
  );
}

const styles = StyleSheet.create({
  idleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  yourTurn: {
    ...Typography.title2,
    color: Colors.text,
  },
  caption: {
    ...Typography.callout,
    color: Colors.secondaryText,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.goldAccentMuted,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginTop: Spacing.md,
  },
  errorText: {
    ...Typography.footnote,
    color: Colors.text,
    flex: 1,
  },
  errorAction: {
    ...Typography.footnote,
    color: Colors.primary,
    fontWeight: '700',
  },
  recordingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  timer: {
    ...Typography.numeric,
    color: Colors.text,
  },
  recordingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  cancelLabel: {
    ...Typography.bodyEmphasis,
    color: Colors.secondaryText,
  },
  finishButton: {
    minWidth: 140,
  },
  reviewWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  reviewPlayer: {
    flex: 1,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
