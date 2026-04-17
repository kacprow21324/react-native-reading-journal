import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/lib/ThemeContext';
import { PressableScale } from './PressableScale';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

type Props = {
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  icon?: ReactNode;
  label?: string;
  fullWidth?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function ThemedButton({
  onPress,
  disabled,
  loading,
  variant = 'primary',
  icon,
  label,
  fullWidth,
  compact,
  style,
  accessibilityLabel,
}: Props) {
  const { theme } = useTheme();
  const { colors, radius, spacing } = theme;

  const palette: Record<Variant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: colors.primary, fg: colors.primaryText },
    secondary: { bg: colors.primaryMuted, fg: colors.primary },
    danger: { bg: colors.dangerBg, fg: colors.danger },
    ghost: { bg: 'transparent', fg: colors.text, border: colors.border },
  };
  const p = palette[variant];

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.base,
        {
          backgroundColor: p.bg,
          borderColor: p.border ?? 'transparent',
          borderWidth: p.border ? 1 : 0,
          borderRadius: radius.md,
          paddingVertical: compact ? spacing.sm : spacing.md,
          paddingHorizontal: compact ? spacing.md : spacing.lg,
          alignSelf: fullWidth ? 'stretch' : 'auto',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <View style={[styles.content, { gap: spacing.sm }]}>
          {icon}
          {label ? (
            <Text style={[styles.label, { color: p.fg, fontSize: compact ? 13 : 15 }]}>
              {label}
            </Text>
          ) : null}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  label: { fontWeight: '600' },
});
