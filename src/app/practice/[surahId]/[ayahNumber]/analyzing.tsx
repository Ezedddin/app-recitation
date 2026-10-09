import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { EmptyState, ScreenContainer } from '@/components/ui';
import { Colors, Spacing, Typography } from '@/constants';
import { analysisService } from '@/services/analysis';
import { useAppStore } from '@/stores/useAppStore';

const STEPS = ['Pronunciation', 'Tajweed', 'Pitch', 'Rhythm', 'Timing', 'Melody'];

export default function AnalyzingScreen() {
  const { surahId, ayahNumber, recordingUri, attemptNumber, durationMillis } = useLocalSearchParams<{
    surahId: string;
    ayahNumber: string;
    recordingUri: string;
    attemptNumber: string;
    durationMillis?: string;
  }>();
  const addAttempt = useAppStore((state) => state.addAttempt);
  const [activeStep, setActiveStep] = useState(0);
  const [failed, setFailed] = useState(false);
  const [failureDetail, setFailureDetail] = useState<string | null>(null);
  const navigatedRef = useRef(false);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setActiveStep((step) => (step + 1) % STEPS.length);
    }, 460);
    return () => clearInterval(stepTimer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    analysisService
      .analyze({
        surahId,
        ayahNumber: Number(ayahNumber),
        reciterId: useAppStore.getState().selectedReciterId ?? '',
        recordingUri,
        attemptNumber: Number(attemptNumber),
      })
      .then((analysis) => {
        if (cancelled || navigatedRef.current) return;
        navigatedRef.current = true;
        addAttempt({
          id: analysis.id,
          surahId,
          ayahNumber: Number(ayahNumber),
          reciterId: analysis.reciterId,
          createdAt: analysis.createdAt,
          durationSeconds: durationMillis ? Number(durationMillis) / 1000 : 0,
          recordingUri,
          analysis,
        });
        router.replace({
          pathname: '/practice/[surahId]/[ayahNumber]/results',
          params: { surahId, ayahNumber, attemptId: analysis.id },
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setFailed(true);
        setFailureDetail(error instanceof Error ? error.message : null);
      });

    return () => {
      cancelled = true;
    };
  }, [surahId, ayahNumber, recordingUri, attemptNumber, durationMillis, addAttempt]);

  if (failed) {
    return (
      <ScreenContainer>
        <EmptyState
          icon="cloud-offline-outline"
          title="Analysis failed"
          message={`Something went wrong while analyzing your recitation. Your recording is safe — try again.${failureDetail ? `\n\n${failureDetail}` : ''}`}
          actionLabel="Try again"
          onAction={() => (router.canGoBack() ? router.back() : router.replace(`/practice/${surahId}/${ayahNumber}`))}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.body}>
        <Text style={styles.headline}>Listening to your recitation…</Text>
        <ActivityIndicator color={Colors.primary} size="large" style={styles.spinner} />
        <View style={styles.stepList}>
          {STEPS.map((step, index) => (
            <Text key={step} style={[styles.step, index === activeStep && styles.stepActive]}>
              {step}
            </Text>
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  headline: {
    ...Typography.title2,
    color: Colors.text,
    textAlign: 'center',
  },
  spinner: {
    marginTop: Spacing.sm,
  },
  stepList: {
    gap: Spacing.sm,
    alignItems: 'center',
  },
  step: {
    ...Typography.callout,
    color: Colors.tertiaryText,
  },
  stepActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
