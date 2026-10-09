import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';

import { ReciterCard } from '@/components/quran';
import { EmptyState, PrimaryButton, ScreenContainer } from '@/components/ui';
import { Colors, Radius, Spacing, Typography } from '@/constants';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { quranService } from '@/services/quran';
import { reciterService } from '@/services/reciters';
import { useAppStore } from '@/stores/useAppStore';
import type { Reciter } from '@/types';

// Al-Fatihah, ayah 1 — used as the fixed "preview" clip for every reciter.
const PREVIEW_SURAH_ID = '1';
const PREVIEW_AYAH_NUMBER = 1;

export default function ChooseReciterScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Reciter[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(useAppStore.getState().selectedReciterId);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [previewSource, setPreviewSource] = useState<string | null>(null);
  const [previewUnavailable, setPreviewUnavailable] = useState(false);
  const preview = useAudioPlayback(previewSource);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const selectReciter = useAppStore((state) => state.selectReciter);

  useEffect(() => {
    if (!previewingId) return;
    let active = true;
    quranService.getReferenceAudio(PREVIEW_SURAH_ID, PREVIEW_AYAH_NUMBER).then((entries) => {
      if (!active) return;
      const url = entries.find((entry) => entry.reciterId === previewingId)?.ayahAudioUrl ?? null;
      setPreviewUnavailable(!url);
      if (url) {
        setPreviewSource(url);
      }
    });
    return () => {
      active = false;
    };
  }, [previewingId]);

  useEffect(() => {
    if (previewSource) {
      preview.replay();
    }
    // `preview` is a fresh object every render (its status fields change
    // constantly while playing) — depending on the whole object here would
    // re-fire this effect on every status tick and restart playback from 0
    // each time. `preview.replay` is a stable function reference, so this
    // only re-fires when the source actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview.replay, previewSource]);

  useEffect(() => {
    let active = true;
    reciterService.search(query).then((reciters) => {
      if (active) setResults(reciters);
    });
    return () => {
      active = false;
    };
  }, [query]);

  const handlePreview = (reciter: Reciter) => {
    if (previewingId === reciter.id && preview.isPlaying) {
      preview.pause();
      return;
    }
    setPreviewingId(reciter.id);
  };

  const handleContinue = () => {
    if (!selectedId) return;
    selectReciter(selectedId);
    completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headline}>Who inspires your recitation?</Text>
        <Text style={styles.subtitle}>Choose a reciter whose style you would like to learn from.</Text>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={Colors.secondaryText} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search for a reciter"
          placeholderTextColor={Colors.secondaryText}
          style={styles.searchInput}
          accessibilityLabel="Search for a reciter"
        />
      </View>

      {previewUnavailable ? (
        <Text style={styles.previewUnavailable}>No preview audio available for that reciter yet.</Text>
      ) : null}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ReciterCard
            reciter={item}
            selected={item.id === selectedId}
            isPreviewPlaying={previewingId === item.id && preview.isPlaying}
            onSelect={() => setSelectedId(item.id)}
            onPreviewPress={() => handlePreview(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={
          <EmptyState icon="search-outline" title="No reciters found" message="Try a different name or style." />
        }
      />

      <PrimaryButton label="Learn this style" onPress={handleContinue} disabled={!selectedId} style={styles.cta} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.xxs,
    marginBottom: Spacing.md,
  },
  headline: {
    ...Typography.title1,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.callout,
    color: Colors.secondaryText,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    height: 44,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
  },
  previewUnavailable: {
    ...Typography.caption,
    color: Colors.goldAccent,
    marginBottom: Spacing.sm,
  },
  list: {
    paddingBottom: Spacing.md,
  },
  cta: {
    marginBottom: Spacing.lg,
  },
});
