import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/lib/ThemeContext';
import { STATUS_LABELS, STATUS_OPTIONS, type BookStatus } from '@/lib/status';
import { PressableScale } from './PressableScale';

type Props = {
  value: BookStatus;
  onChange: (status: BookStatus) => void;
};

export function StatusPicker({ value, onChange }: Props) {
  const { theme } = useTheme();
  const { colors, spacing, radius } = theme;

  return (
    <View style={styles.wrap}>
      {STATUS_OPTIONS.map((option) => {
        const active = option === value;
        return (
          <PressableScale
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option)}
            scaleTo={0.95}
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: radius.pill,
              backgroundColor: active ? colors.primary : colors.surfaceMuted,
              borderWidth: 1,
              borderColor: active ? colors.primary : colors.border,
            }}
          >
            <Text
              style={{
                color: active ? colors.primaryText : colors.textMuted,
                fontSize: 13,
                fontWeight: active ? '700' : '500',
              }}
            >
              {STATUS_LABELS[option]}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
