import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme, type ThemeMode } from '@/lib/ThemeContext';
import { PressableScale } from './PressableScale';

const OPTIONS: { mode: ThemeMode; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { mode: 'system', icon: 'phone-portrait-outline', label: 'System' },
  { mode: 'light', icon: 'sunny-outline', label: 'Jasny' },
  { mode: 'dark', icon: 'moon-outline', label: 'Ciemny' },
];

export function ThemeToggle() {
  const { mode, setMode, theme } = useTheme();
  const { colors, spacing, radius } = theme;

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.surfaceMuted,
          borderRadius: radius.pill,
          padding: 4,
          gap: 4,
        },
      ]}
    >
      {OPTIONS.map((opt) => {
        const active = mode === opt.mode;
        return (
          <PressableScale
            key={opt.mode}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Motyw: ${opt.label}`}
            onPress={() => setMode(opt.mode)}
            style={[
              styles.pill,
              {
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radius.pill,
                backgroundColor: active ? colors.primary : 'transparent',
              },
            ]}
            scaleTo={0.94}
          >
            <Ionicons
              name={opt.icon}
              size={14}
              color={active ? colors.primaryText : colors.textMuted}
            />
            <Text
              style={[
                styles.label,
                { color: active ? colors.primaryText : colors.textMuted },
              ]}
            >
              {opt.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignSelf: 'flex-start' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 13, fontWeight: '600' },
});
