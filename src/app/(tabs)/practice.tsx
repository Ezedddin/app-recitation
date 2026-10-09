import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, EmptyState, ScreenContainer } from '@/components/ui';
import { Colors, Radius, Spacing, Typography } from '@/constants';
import { quranService } from '@/services/quran';
import { useAppStore } from '@/stores/useAppStore';
import type { Surah } from '@/types';

export default function PracticeBrowserScreen() {
  const [query, setQuery] = useState('');
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const attempts = useAppStore((state) => state.attempts);

  useEffect(() => {
    let active = true;
    quranService.searchSurahs(query).then((results) => {
      if (active) setSurahs(results);
    });
    return () => {
      active = false;
    };
  }, [query]);

  const attemptedAyahsBySurah = useMemo(() => {
    const map = new Map<string, Set<number>>();
    for (const attempt of attempts) {
      const set = map.get(attempt.surahId) ?? new Set<number>();
      set.add(attempt.ayahNumber);
      map.set(attempt.surahId, set);
    }
    return map;
  }, [attempts]);

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <Text style={styles.headline}>Practice</Text>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={Colors.secondaryText} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search Surah"
          placeholderTextColor={Colors.secondaryText}
          style={styles.searchInput}
          accessibilityLabel="Search Surah"
        />
      </View>

      <FlatList
        data={surahs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={
          <EmptyState icon="search-outline" title="No surahs found" message="Try a different name or number." />
        }
        renderItem={({ item }) => {
          const attemptedCount = attemptedAyahsBySurah.get(item.id)?.size ?? 0;
          return (
            <Card onPress={() => router.push(`/surah/${item.id}`)} accessibilityLabel={`Surah ${item.transliteratedName}`}>
              <View style={styles.row}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberText}>{item.number}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.arabicName}>{item.arabicName}</Text>
                  <Text style={styles.englishName}>
                    {item.transliteratedName} · {item.ayahCount} ayat
                  </Text>
                </View>
                {attemptedCount > 0 ? <Text style={styles.progressBadge}>{attemptedCount} practiced</Text> : null}
              </View>
            </Card>
          );
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headline: {
    ...Typography.title1,
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
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
  list: {
    paddingBottom: Spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  numberBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.sageMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    ...Typography.caption,
    color: Colors.primaryDark,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  arabicName: {
    ...Typography.headline,
    color: Colors.text,
  },
  englishName: {
    ...Typography.footnote,
    color: Colors.secondaryText,
  },
  progressBadge: {
    ...Typography.caption,
    color: Colors.primary,
  },
});
