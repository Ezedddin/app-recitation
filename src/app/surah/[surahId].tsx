import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { AyahCard } from '@/components/quran';
import { BackHeader, EmptyState, ScreenContainer } from '@/components/ui';
import { Colors, Spacing } from '@/constants';
import { useAsync } from '@/hooks/useAsync';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { quranService } from '@/services/quran';
import { useAppStore } from '@/stores/useAppStore';

interface PlayRequest {
  ayahNumber: number;
}

export default function AyahListScreen() {
  const { surahId } = useLocalSearchParams<{ surahId: string }>();
  const { data: surah } = useAsync(() => quranService.getSurah(surahId), [surahId]);
  const { data: ayahs, loading, error } = useAsync(() => quranService.getAyahs(surahId), [surahId]);
  const [playRequest, setPlayRequest] = useState<PlayRequest | null>(null);
  const [playSource, setPlaySource] = useState<string | null>(null);
  const selectedReciterId = useAppStore((state) => state.selectedReciterId);
  const attempts = useAppStore((state) => state.attempts);
  const setLastPosition = useAppStore((state) => state.setLastPosition);

  const player = useAudioPlayback(playSource);

  useEffect(() => {
    if (!playRequest || !selectedReciterId) return;
    let active = true;
    quranService.getReferenceAudio(surahId, playRequest.ayahNumber).then((entries) => {
      if (!active) return;
      setPlaySource(entries.find((entry) => entry.reciterId === selectedReciterId)?.ayahAudioUrl ?? null);
    });
    return () => {
      active = false;
    };
  }, [surahId, playRequest, selectedReciterId]);

  useEffect(() => {
    if (playSource) {
      player.replay();
    }
    // `player` is a fresh object every render (its status fields change
    // constantly while playing) — depending on the whole object would
    // re-fire this effect on every status tick and restart playback from 0
    // each time. `player.replay` is a stable function reference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.replay, playSource]);

  const bestScoreByAyah = useMemo(() => {
    const map = new Map<number, number>();
    for (const attempt of attempts) {
      if (attempt.surahId !== surahId) continue;
      map.set(attempt.ayahNumber, Math.max(map.get(attempt.ayahNumber) ?? 0, attempt.analysis.overallScore));
    }
    return map;
  }, [attempts, surahId]);

  const handlePlayReference = (ayahNumber: number) => {
    if (playRequest?.ayahNumber === ayahNumber && player.isPlaying) {
      player.pause();
      return;
    }
    setPlayRequest({ ayahNumber });
  };

  const handlePractice = (ayahNumber: number) => {
    setLastPosition(surahId, ayahNumber);
    router.push(`/practice/${surahId}/${ayahNumber}`);
  };

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <BackHeader title={surah?.transliteratedName ?? 'Surah'} subtitle={surah?.arabicName} />

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={styles.loading} />
      ) : error || !ayahs || ayahs.length === 0 ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Couldn't load this surah"
          message="Check your connection and try again."
        />
      ) : (
        <FlatList
          data={ayahs}
          keyExtractor={(item) => String(item.number)}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          renderItem={({ item }) => (
            <AyahCard
              ayah={item}
              isPlayingReference={playRequest?.ayahNumber === item.number && player.isPlaying}
              bestScore={bestScoreByAyah.get(item.number)}
              onPlayReference={() => handlePlayReference(item.number)}
              onPractice={() => handlePractice(item.number)}
            />
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: Spacing.xxl,
  },
  loading: {
    marginTop: Spacing.xxl,
  },
});
