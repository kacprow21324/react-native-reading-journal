import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';

import { PressableScale } from '@/components/PressableScale';
import { StarRating } from '@/components/StarRating';
import { ThemedButton } from '@/components/ThemedButton';
import { normalize } from '@/lib/normalize';
import { STATUS_LABELS } from '@/lib/status';
import { useTheme } from '@/lib/ThemeContext';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import type { Book } from '@/types/db';

type ReaderRow = {
  id: string;
  user_id: string;
  rating: number | null;
  date_added: string;
  profiles: { username: string } | { username: string }[] | null;
};

type Reader = {
  id: string;
  user_id: string;
  username: string;
  rating: number | null;
  date_added: string;
  isFollowed: boolean;
};

function readUsername(profiles: ReaderRow['profiles']): string {
  if (!profiles) return '(nieznany)';
  if (Array.isArray(profiles)) return profiles[0]?.username ?? '(nieznany)';
  return profiles.username;
}

export default function BookDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = useAuthStore((s) => s.currentUser);
  const { theme } = useTheme();
  const { colors, spacing, radius, typography } = theme;
  const [book, setBook] = useState<Book | null>(null);
  const [readers, setReaders] = useState<Reader[]>([]);
  const [loading, setLoading] = useState(true);
  const [followBusy, setFollowBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id || !currentUser) return;
    setLoading(true);

    const { data: b, error: bErr } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single<Book>();
    if (bErr || !b) {
      Toast.show({ type: 'error', text1: 'Nie znaleziono książki' });
      setLoading(false);
      return;
    }
    setBook(b);

    const { data: others, error: oErr } = await supabase
      .from('public_finished_books')
      .select('id, user_id, rating, date_added, profiles:user_id(username)')
      .eq('title_normalized', normalize(b.title))
      .eq('author_normalized', normalize(b.author))
      .neq('user_id', currentUser.id);

    if (oErr) {
      Toast.show({
        type: 'error',
        text1: 'Błąd sekcji społecznościowej',
        text2: oErr.message,
      });
      setReaders([]);
      setLoading(false);
      return;
    }

    const rows = (others ?? []) as ReaderRow[];
    const userIds = rows.map((r) => r.user_id);
    let followed = new Set<string>();
    if (userIds.length > 0) {
      const { data: follows } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', currentUser.id)
        .in('following_id', userIds);
      followed = new Set((follows ?? []).map((f) => f.following_id));
    }
    setReaders(
      rows.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        username: readUsername(r.profiles),
        rating: r.rating,
        date_added: r.date_added,
        isFollowed: followed.has(r.user_id),
      })),
    );
    setLoading(false);
  }, [id, currentUser]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function follow(userId: string) {
    if (!currentUser || followBusy) return;
    setFollowBusy(userId);
    const { error } = await supabase
      .from('user_follows')
      .insert({ follower_id: currentUser.id, following_id: userId });
    setFollowBusy(null);
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Nie udało się zaobserwować',
        text2: error.message,
      });
      return;
    }
    Toast.show({ type: 'success', text1: 'Obserwujesz użytkownika' });
    setReaders((rs) =>
      rs.map((r) => (r.user_id === userId ? { ...r, isFollowed: true } : r)),
    );
  }

  function confirmDelete() {
    const runDelete = async () => {
      if (!book) return;
      const { error } = await supabase.from('books').delete().eq('id', book.id);
      if (error) {
        Toast.show({ type: 'error', text1: 'Błąd', text2: error.message });
        return;
      }
      Toast.show({ type: 'success', text1: 'Usunięto' });
      router.back();
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Usunąć książkę? Tej operacji nie można cofnąć.')) {
        runDelete();
      }
      return;
    }
    Alert.alert('Usunąć książkę?', 'Tej operacji nie można cofnąć.', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: runDelete },
    ]);
  }

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.bg },
        content: { padding: spacing.lg, gap: spacing.md },
        card: {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.lg,
        },
        header: { flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start' },
        cover: { width: 104, height: 156, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
        title: { ...typography.h2, color: colors.text },
        author: { ...typography.body, color: colors.textMuted, marginTop: 2 },
        statusBadge: {
          alignSelf: 'flex-start',
          marginTop: spacing.sm,
          backgroundColor: colors.primaryMuted,
          paddingHorizontal: spacing.md,
          paddingVertical: 4,
          borderRadius: radius.pill,
        },
        statusText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
        sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.md },
        notes: { marginTop: spacing.sm, color: colors.textMuted, lineHeight: 20 },
        actions: { flexDirection: 'row', gap: spacing.sm },
        readerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.md,
          gap: spacing.md,
        },
        readerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
        avatar: {
          width: 40,
          height: 40,
          borderRadius: radius.pill,
          backgroundColor: colors.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
        },
        readerName: { ...typography.bodyStrong, color: colors.text },
        readerMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
        followBtn: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          backgroundColor: colors.primary,
          borderRadius: radius.md,
          minWidth: 96,
          alignItems: 'center',
        },
        followBtnDone: { backgroundColor: colors.surfaceMuted },
        followBtnText: { color: colors.primaryText, fontSize: 12, fontWeight: '700' },
        empty: { color: colors.textMuted, marginTop: spacing.sm },
      }),
    [colors, spacing, radius, typography],
  );

  if (loading || !book) {
    return (
      <View style={[styles.screen, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Animated.View entering={FadeInUp.duration(260)} style={styles.card}>
        <View style={styles.header}>
          {book.cover_url ? (
            <Image source={{ uri: book.cover_url }} style={styles.cover} contentFit="cover" />
          ) : (
            <View style={styles.cover} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{book.title}</Text>
            <Text style={styles.author}>{book.author}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{STATUS_LABELS[book.status]}</Text>
            </View>
            {book.status === 'finished' && book.rating ? (
              <View style={{ marginTop: spacing.sm }}>
                <StarRating value={book.rating} size={18} disabled />
              </View>
            ) : null}
          </View>
        </View>
        {book.notes ? (
          <View style={{ marginTop: spacing.md }}>
            <Text style={styles.sectionTitle}>Notatki</Text>
            <Text style={styles.notes}>{book.notes}</Text>
          </View>
        ) : null}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(60).duration(260)} style={styles.actions}>
        <Link href={{ pathname: '/book/new', params: { id: book.id } }} asChild>
          <ThemedButton
            label="Edytuj"
            variant="secondary"
            icon={<Ionicons name="create-outline" size={18} color={colors.primary} />}
          />
        </Link>
        <ThemedButton
          label="Usuń"
          variant="danger"
          onPress={confirmDelete}
          icon={<Ionicons name="trash-outline" size={18} color={colors.danger} />}
        />
      </Animated.View>

      <Text style={styles.sectionTitle}>
        {readers.length}{' '}
        {readers.length === 1
          ? 'osoba przeczytała tę książkę'
          : 'osób przeczytało tę książkę'}
      </Text>
      {readers.map((r, idx) => (
        <Animated.View
          key={r.id}
          entering={FadeInDown.delay(idx * 30).duration(220)}
          style={styles.readerRow}
        >
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`Otwórz bibliotekę: ${r.username}`}
            style={styles.readerInfo}
            scaleTo={0.98}
            onPress={() =>
              router.push({ pathname: '/user/[id]', params: { id: r.user_id } })
            }
          >
            <View style={styles.avatar}>
              <Ionicons name="person" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.readerName} numberOfLines={1}>{r.username}</Text>
              <Text style={styles.readerMeta}>
                Ocena: {r.rating ?? '—'} ·{' '}
                {new Date(r.date_added).toLocaleDateString('pl-PL')}
              </Text>
            </View>
          </PressableScale>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={r.isFollowed ? 'Obserwujesz' : `Obserwuj ${r.username}`}
            disabled={r.isFollowed || followBusy === r.user_id}
            onPress={() => follow(r.user_id)}
            style={[styles.followBtn, r.isFollowed && styles.followBtnDone]}
            scaleTo={0.95}
          >
            {followBusy === r.user_id ? (
              <ActivityIndicator size="small" color={colors.primaryText} />
            ) : (
              <Text
                style={[
                  styles.followBtnText,
                  r.isFollowed && { color: colors.textMuted },
                ]}
              >
                {r.isFollowed ? 'Obserwujesz' : 'Obserwuj'}
              </Text>
            )}
          </PressableScale>
        </Animated.View>
      ))}
      {readers.length === 0 && (
        <Text style={styles.empty}>Nikt inny jeszcze nie przeczytał tej książki.</Text>
      )}
    </ScrollView>
  );
}
