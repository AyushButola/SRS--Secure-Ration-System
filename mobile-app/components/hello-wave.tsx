
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';

export function HelloWave() {
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.Text
      style={[styles.text, animatedStyle]}
      onLayout={() => {
        rotation.value = withRepeat(
          withSequence(
            withTiming(25, { duration: 150 }),
            withTiming(-25, { duration: 150 }),
            withTiming(25, { duration: 150 }),
            withTiming(0, { duration: 150 })
          ),
          4 // Iterations
        );
      }}>
      👋
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 28,
    lineHeight: 32,
    marginTop: -6,
  },
});
