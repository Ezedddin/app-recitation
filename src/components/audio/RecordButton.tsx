import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

import { Colors, Shadows } from '@/constants';

interface RecordButtonProps {
  isRecording: boolean;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
}

export function RecordButton({ isRecording, onPress, disabled, size = 96 }: RecordButtonProps) {
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!isRecording) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isRecording, pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
      disabled={disabled}
      onPress={onPress}
      style={[styles.wrapper, { width: size * 1.6, height: size * 1.6 }]}>
      {isRecording ? (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              transform: [{ scale: ringScale }],
              opacity: ringOpacity,
            },
          ]}
        />
      ) : null}
      <Animated.View
        style={[
          styles.button,
          { width: size, height: size, borderRadius: size / 2, opacity: disabled ? 0.5 : 1 },
          isRecording ? styles.buttonRecording : styles.buttonIdle,
        ]}>
        <Ionicons name={isRecording ? 'square' : 'mic'} size={size * 0.36} color={Colors.onPrimary} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    backgroundColor: Colors.recordingActive,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.floating,
  },
  buttonIdle: {
    backgroundColor: Colors.primary,
  },
  buttonRecording: {
    backgroundColor: Colors.recordingActive,
  },
});
