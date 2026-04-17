import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { BookRow } from '@/components/BookRow';
import { PressableScale } from '@/components/PressableScale';
import { STATUS_GROUP_ORDER, STATUS_LABELS, type BookStatus } from '@/lib/status';
import { useTheme } from '@/lib/ThemeContext';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import type { Book } from '@/types/db';

export default function Library() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { theme } = useTheme();
  const { colors, spacing, radius, typography } = theme;
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('date_added', { ascending: false });
    setLoading(false);
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Nie udało się pobrać książek',
        text2: error.message,
      });
      return;
    }
    setBooks((data ?? []) as Book[]);
  }, [currentUser]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const finishedThisYear = useMemo(() => {
    const year = new Date().getFullYear();
    return books.filter(
      (b) => b.status === 'finished' && new Date(b.date_added).getFullYear() === year,
    ).length;
  }, [books]);

  const sections = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? books.filter(
          (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q),
        )
      : books;
    const groups = new Map<BookStatus, Book[]>();
    for (const b of filtered) {
      const arr = groups.get(b.status) ?? [];
      arr.push(b);
      groups.set(b.status, arr);
    }
    return Array.from(groups.entries())
      .sort((a, b) => STATUS_GROUP_ORDER[a[0]] - STATUS_GROUP_ORDER[b[0]])
      .map(([status, data]) => ({ title: STATUS_LABELS[status], data }));
  }, [books, search]);

  async function signOut() {
    await supabase.auth.signOut();
  }

  const initial = (currentUser?.username || currentUser?.email || '?').slice(0, 1).toUpperCase();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.bg },
        topBar: {
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.md,
        },
        greetingBox: { flex: 1 },
        greetingLabel: { ...typography.overline, color: colors.textSubtle },
        greeting: { ...typography.h2, color: colors.text, marginTop: 2 },
        userBlock: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radius.pill,
          paddingLeft: 4,
          paddingRight: spacing.sm,
          paddingVertical: 4,
        },
        avatar: {
          width: 32,
          height: 32,
          borderRadius: radius.pill,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        avatarText: { color: colors.primaryText, fontWeight: '800', fontSize: 14 },
        username: { color: colors.text, fontWeight: '600', fontSize: 13, maxWidth: 120 },
        signOut: {
          width: 36,
          height: 36,
          borderRadius: radius.pill,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        },
        counterCard: {
          marginHorizontal: spacing.lg,
          marginTop: spacing.sm,
          marginBottom: spacing.md,
          padding: spacing.lg,
          borderRadius: radius.xl,
          backgroundColor: colors.primary,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
        },
        counterIcon: {
          width: 44,
          height: 44,
          borderRadius: radius.pill,
          backgroundColor: 'rgba(255,255,255,0.18)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        counterLabel: { color: colors.primaryText, opacity: 0.8, fontSize: 12, fontWeight: '600' },
        counterValue: { color: colors.primaryText, fontSize: 26, fontWeight: '800', marginTop: 2 },
        searchWrap: {
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: spacing.lg,
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: spacing.md,
          gap: spacing.sm,
        },
        search: {
          flex: 1,
          paddingVertical: spacing.sm + 2,
          color: colors.text,
          fontSize: 14,
        },
        sectionHeader: {
          ...typography.overline,
          color: colors.textMuted,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing.xs,
        },
        empty: {
          textAlign: 'center',
          color: colors.textMuted,
          marginTop: spacing.xxl,
          paddingHorizontal: spacing.xl,
        },
        fab: {
          position: 'absolute',
          right: spacing.lg,
          bottom: spacing.lg,
          width: 60,
          height: 60,
          borderRadius: radius.pill,
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: `0px 6px 16px ${colors.shadow}`,
        },
      }),
    [colors, spacing, radius, typography],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Animated.View entering={FadeInUp.duration(260)} style={styles.topBar}>
        <View style={styles.greetingBox}>
          <Text style={styles.greetingLabel}>Biblioteka</Text>
          <Text style={styles.greeting} numberOfLines={1}>
            Cześć{currentUser?.username ? `, ${currentUser.username}` : ''}
          </Text>
        </View>
        <View style={styles.userBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.username} numberOfLines={1}>
            {currentUser?.username || 'Gość'}
          </Text>
        </View>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Wyloguj się"
          onPress={signOut}
          style={styles.signOut}
          scaleTo={0.92}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.textMuted} />
        </PressableScale>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(60).duration(260)} style={styles.counterCard}>
        <View style={styles.counterIcon}>
          <Ionicons name="trophy-outline" size={22} color={colors.primaryText} />
        </View>
        <View>
          <Text style={styles.counterLabel}>Przeczytane w tym roku</Text>
          <Text style={styles.counterValue}>{finishedThisYear}</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(120).duration(260)} style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={colors.textSubtle} />
        <TextInput
          style={styles.search}
          placeholder="Szukaj po tytule lub autorze"
          placeholderTextColor={colors.textSubtle}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <PressableScale onPress={() => setSearch('')} scaleTo={0.9}>
            <Ionicons name="close-circle" size={18} color={colors.textSubtle} />
          </PressableScale>
        )}
      </Animated.View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.primary} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 25).duration(240)}>
              <BookRow
                title={item.title}
                author={item.author}
                coverUrl={item.cover_url}
                rating={item.rating}
                onPress={() =>
                  router.push({ pathname: '/book/[id]', params: { id: item.id } })
                }
              />
            </Animated.View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {search ? 'Brak wyników.' : 'Dodaj pierwszą książkę przyciskiem poniżej.'}
            </Text>
          }
          contentContainerStyle={{ paddingBottom: 140, paddingTop: spacing.xs }}
          stickySectionHeadersEnabled={false}
        />
      )}
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Dodaj nową książkę"
        style={styles.fab}
        onPress={() => router.push('/book/new')}
        scaleTo={0.9}
      >
        <Ionicons name="add" size={30} color={colors.primaryText} />
      </PressableScale>
    </SafeAreaView>
  );
}
