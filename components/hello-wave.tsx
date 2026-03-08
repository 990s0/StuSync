import React from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

export function HelloWave() {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withSequence(
        withTiming(25, { duration: 150 }),
        withTiming(-10, { duration: 150 }),
        withTiming(0, { duration: 150 })
      ),
      4,
      false
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.Text
      style={[
        {
          fontSize: 28,
          lineHeight: 32,
          marginTop: -6,
        },
        animatedStyle,
      ]}
    >
      👋
    </Animated.Text>
  );
}
