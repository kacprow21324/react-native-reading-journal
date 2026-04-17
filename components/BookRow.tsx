import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/lib/ThemeContext';
import { STATUS_LABELS, type BookStatus } from '@/lib/status';
import { PressableScale } from './PressableScale';
import { StarRating } from './StarRating';

type Props = {
  title: string;
  author: string;
  coverUrl: string | null;
  status?: BookStatus;
  rating?: number | null;
  rightSlot?: ReactNode;
  onPress?: () => void;
};

export function BookRow({ title, author, coverUrl, status, rating, rightSlot, onPress }: Props) {
  const { theme } = useTheme();
  const { colors, spacing, radius, typography } = theme;
  const isPressable = typeof onPress === 'function';

  const content = (
    <>
      {coverUrl ? (
        <Image
          source={{ uri: coverUrl }}
          style={[
            styles.cover,
            { backgroundColor: colors.surfaceMuted, borderRadius: radius.sm },
          ]}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            styles.cover,
            styles.coverFallback,
            { backgroundColor: colors.surfaceMuted, borderRadius: radius.sm },
          ]}
        >
          <Text style={[styles.coverFallbackText, { color: colors.textSubtle }]}>
            {title.slice(0, 1).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={[typography.bodyStrong, { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
        <Text
          style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}
          numberOfLines={1}
        >
          {author}
        </Text>
        {status && (
          <Text
            style={[
              typography.caption,
              { color: colors.primary, marginTop: spacing.xs },
            ]}
          >
            {STATUS_LABELS[status]}
          </Text>
        )}
        {typeof rating === 'number' && rating > 0 && (
          <View style={{ marginTop: spacing.xs }}>
            <StarRating value={rating} size={14} disabled />
          </View>
        )}
      </View>
      {rightSlot}
    </>
  );

  const sharedStyle = [
    styles.row,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radius.lg,
      marginHorizontal: spacing.lg,
      marginVertical: spacing.xs,
      padding: spacing.md,
      gap: spacing.md,
    },
  ];

  if (!isPressable) {
    return <View style={sharedStyle}>{content}</View>;
  }

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${author}`}
      onPress={onPress}
      scaleTo={0.985}
      style={sharedStyle}
    >
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  cover: { width: 58, height: 84 },
  coverFallback: { justifyContent: 'center', alignItems: 'center' },
  coverFallbackText: { fontSize: 28, fontWeight: '700' },
  body: { flex: 1 },
});
