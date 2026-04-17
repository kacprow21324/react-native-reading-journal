import { forwardRef } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = PressableProps & {
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  disabledOpacity?: number;
};

export const PressableScale = forwardRef<typeof AnimatedPressable, Props>(function PressableScale(
  { scaleTo = 0.97, style, disabledOpacity = 0.6, disabled, onPressIn, onPressOut, ...rest },
  _ref,
) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * (1 - scaleTo) }],
    opacity: disabled ? disabledOpacity : 1 - pressed.value * 0.1,
  }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        pressed.value = withTiming(1, { duration: 90 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withTiming(0, { duration: 140 });
        onPressOut?.(e);
      }}
      style={[style, animatedStyle]}
    />
  );
});
