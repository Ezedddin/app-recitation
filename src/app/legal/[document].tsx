import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackHeader, EmptyState, ScreenContainer } from '@/components/ui';
import { Colors, Spacing, Typography } from '@/constants';
import { LEGAL_DETAILS, LEGAL_DOCUMENTS, type LegalDocumentId } from '@/content/legal';

export default function LegalDocumentScreen() {
  const { document } = useLocalSearchParams<{ document: string }>();
  const legal = LEGAL_DOCUMENTS[document as LegalDocumentId];

  if (!legal) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <BackHeader title="Legal" />
        <EmptyState icon="document-text-outline" title="Not found" message="This document doesn't exist." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <BackHeader title={legal.title} subtitle={`Last updated: ${LEGAL_DETAILS.lastUpdated}`} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.paragraph}>{legal.intro}</Text>
        {legal.sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.heading}>{section.heading}</Text>
            {section.bullets?.map((bullet) => (
              <Text key={bullet} style={styles.paragraph}>
                • {bullet}
              </Text>
            ))}
            {section.paragraphs?.map((paragraph) => (
              <Text key={paragraph} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.xs,
  },
  heading: {
    ...Typography.headline,
    color: Colors.text,
  },
  paragraph: {
    ...Typography.callout,
    color: Colors.secondaryText,
  },
});
