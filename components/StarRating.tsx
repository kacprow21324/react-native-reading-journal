import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/lib/ThemeContext';

type Props = {
  value: number | null;
  onChange?: (value: number) => void;
  size?: number;
  disabled?: boolean;
};

const STARS = [1, 2, 3, 4, 5] as const;

export function StarRating({ value, onChange, size = 28, disabled }: Props) {
  const { theme } = useTheme();
  const { colors } = theme;
  const readOnly = disabled || !onChange;

  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {STARS.map((n) => {
        const filled = (value ?? 0) >= n;

        if (readOnly) {
          return (
            <View key={n}>
              <Ionicons
                name={filled ? 'star' : 'star-outline'}
                size={size}
                color={colors.textSubtle}
              />
            </View>
          );
        }

        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`Ocena ${n} z 5`}
          >
            <Ionicons
              name={filled ? 'star' : 'star-outline'}
              size={size}
              color={colors.accent}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
