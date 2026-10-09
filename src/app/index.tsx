import { Redirect } from 'expo-router';
import { View } from 'react-native';

import { Colors } from '@/constants';
import { useAppStore } from '@/stores/useAppStore';

export default function Index() {
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const onboardingCompleted = useAppStore((state) => state.onboardingCompleted);

  if (!hasHydrated) {
    return <View style={{ flex: 1, backgroundColor: Colors.background }} />;
  }

  return <Redirect href={onboardingCompleted ? '/(tabs)' : '/onboarding/welcome'} />;
}
