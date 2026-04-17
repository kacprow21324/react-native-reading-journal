import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { StarRating } from '@/components/StarRating';
import { ThemeToggle } from '@/components/ThemeToggle';
import { STATUS_LABELS, type BookStatus } from '@/lib/status';
import { useTheme } from '@/lib/ThemeContext';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import type { Book } from '@/types/db';

type Stats = {
  total: number;
  finishedTotal: number;
  finishedThisYear: number;
  averageRating: number | null;
  byStatus: Record<BookStatus, number>;
  topBook: Book | null;
};

export default function Statistics() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { theme } = useTheme();
  const { colors, spacing, radius, typography } = theme;
  const [stats, setStats] = useState<Stats | null>(null);

  const load = useCallback(async () => {
    if (!currentUser) return;
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', currentUser.id);
    if (error) {
      Toast.show({ type: 'error', text1: 'Błąd', text2: error.message });
      return;
    }
    const books = (data ?? []) as Book[];
    const finished = books.filter((b) => b.status === 'finished');
    const year = new Date().getFullYear();
    const ratings = finished
      .map((b) => b.rating)
      .filter((r): r is number => typeof r === 'number');
    const avg = ratings.length
      ? ratings.reduce((s, r) => s + r, 0) / ratings.length
      : null;
    const top =
      finished
        .filter((b) => typeof b.rating === 'number')
        .sort(
          (a, b) =>
            (b.rating! - a.rating!) ||
            (+new Date(b.date_added) - +new Date(a.date_added)),
        )[0] ?? null;
    setStats({
      total: books.length,
      finishedTotal: finished.length,
      finishedThisYear: finished.filter(
        (b) => new Date(b.date_added).getFullYear() === year,
      ).length,
      averageRating: avg,
      byStatus: {
        to_read: books.filter((b) => b.status === 'to_read').length,
        reading: books.filter((b) => b.status === 'reading').length,
        finished: finished.length,
      },
      topBook: top,
    });
  }, [currentUser]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.bg },
        content: { padding: spacing.lg, gap: spacing.sm },
        header: { marginBottom: spacing.sm },
        overline: { ...typography.overline, color: colors.textSubtle },
        title: { ...typography.h2, color: colors.text, marginTop: 4 },
        statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
        statCard: {
          flexBasis: '48%',
          flexGrow: 1,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.lg,
          gap: 4,
        },
        statIconWrap: {
          width: 36,
          height: 36,
          borderRadius: radius.pill,
          backgroundColor: colors.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xs,
        },
        statLabel: { ...typography.caption, color: colors.textMuted },
        statValue: { ...typography.h2, color: colors.text, marginTop: 2 },
        sectionHeader: {
          ...typography.overline,
          color: colors.textMuted,
          marginTop: spacing.md,
        },
        listCard: {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
        },
        listRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: spacing.sm,
        },
        listDivider: {
          height: 1,
          backgroundColor: colors.divider,
        },
        listLabel: { ...typography.body, color: colors.text },
        listValue: { ...typography.bodyStrong, color: colors.primary },
        top: {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.lg,
          gap: spacing.sm,
        },
        topTitle: { ...typography.h3, color: colors.text },
        settings: {
          marginTop: spacing.md,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.lg,
          gap: spacing.md,
        },
      }),
    [colors, spacing, radius, typography],
  );

  if (!stats) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={[styles.screen, { justifyContent: 'center' }]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.overline}>Statystyki</Text>
          <Text style={styles.title}>Twoja czytelnicza podróż</Text>
        </View>

        <Animated.View entering={FadeInUp.duration(240)} style={styles.statsGrid}>
          <StatCard
            icon="library-outline"
            label="Wszystkie książki"
            value={String(stats.total)}
            styles={styles}
            colors={colors}
          />
          <StatCard
            icon="checkmark-done-outline"
            label="Przeczytane ogółem"
            value={String(stats.finishedTotal)}
            styles={styles}
            colors={colors}
          />
          <StatCard
            icon="calendar-outline"
            label="W tym roku"
            value={String(stats.finishedThisYear)}
            styles={styles}
            colors={colors}
          />
          <StatCard
            icon="star-outline"
            label="Średnia ocena"
            value={stats.averageRating !== null ? stats.averageRating.toFixed(2) : '—'}
            styles={styles}
            colors={colors}
          />
        </Animated.View>

        <Text style={styles.sectionHeader}>Według statusu</Text>
        <Animated.View entering={FadeInDown.delay(60).duration(240)} style={styles.listCard}>
          {(Object.keys(stats.byStatus) as BookStatus[]).map((s, idx, arr) => (
            <View key={s}>
              <View style={styles.listRow}>
                <Text style={styles.listLabel}>{STATUS_LABELS[s]}</Text>
                <Text style={styles.listValue}>{stats.byStatus[s]}</Text>
              </View>
              {idx < arr.length - 1 ? <View style={styles.listDivider} /> : null}
            </View>
          ))}
        </Animated.View>

        {stats.topBook && (
          <Animated.View entering={FadeInDown.delay(120).duration(240)} style={styles.top}>
            <Text style={styles.sectionHeader}>Najwyżej oceniona</Text>
            <Text style={styles.topTitle}>
              {stats.topBook.title} — {stats.topBook.author}
            </Text>
            <StarRating value={stats.topBook.rating} disabled />
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(180).duration(240)} style={styles.settings}>
          <Text style={styles.sectionHeader}>Motyw</Text>
          <ThemeToggle />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

type CardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  styles: {
    statCard: object;
    statIconWrap: object;
    statLabel: object;
    statValue: object;
  };
  colors: { primary: string };
};

function StatCard({ icon, label, value, styles, colors }: CardProps) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}
