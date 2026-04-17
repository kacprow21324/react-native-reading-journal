import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';

import { BookRow } from '@/components/BookRow';
import { PressableScale } from '@/components/PressableScale';
import { normalize } from '@/lib/normalize';
import { STATUS_LABELS, type BookStatus } from '@/lib/status';
import { useTheme } from '@/lib/ThemeContext';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import type { PublicFinishedBook } from '@/types/db';

export default function OtherUserBooks() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = useAuthStore((s) => s.currentUser);
  const { theme } = useTheme();
  const { colors, spacing, radius, typography } = theme;
  const [username, setUsername] = useState<string>('');
  const [books, setBooks] = useState<PublicFinishedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: profile }, { data: booksData, error }] = await Promise.all([
      supabase.from('profiles').select('username').eq('id', id).single(),
      supabase
        .from('public_finished_books')
        .select('*')
        .eq('user_id', id)
        .order('date_added', { ascending: false }),
    ]);
    setUsername(profile?.username ?? '');
    if (error) {
      Toast.show({ type: 'error', text1: 'Nie udało się pobrać listy', text2: error.message });
    } else {
      setBooks((booksData ?? []) as PublicFinishedBook[]);
    }
    setLoading(false);
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const confirmStatusChange = useCallback(
    (bookId: string, currentStatus: BookStatus) => {
      if (Platform.OS === 'web') {
        // Alert.alert z przyciskami nie działa na web — pytamy przez confirm.
        const ok =
          typeof window !== 'undefined' &&
          window.confirm(
            `Książka jest już na Twojej liście (status: ${STATUS_LABELS[currentStatus]}). Zmienić status na „Chcę przeczytać"?`,
          );
        if (ok) applyStatusUpdate(bookId);
        return;
      }
      Alert.alert(
        'Książka już u Ciebie',
        `Obecny status: ${STATUS_LABELS[currentStatus]}. Zmienić na „Chcę przeczytać"?`,
        [
          { text: 'Zostaw', style: 'cancel' },
          { text: 'Zmień status', onPress: () => applyStatusUpdate(bookId) },
        ],
      );
    },
    [],
  );

  async function applyStatusUpdate(bookId: string) {
    const { error } = await supabase
      .from('books')
      .update({ status: 'to_read', rating: null })
      .eq('id', bookId);
    if (error) {
      Toast.show({ type: 'error', text1: 'Nie udało się zaktualizować', text2: error.message });
      return;
    }
    Toast.show({ type: 'success', text1: 'Zmieniono status na „Chcę przeczytać"' });
  }

  async function quickAdd(book: PublicFinishedBook) {
    if (!currentUser || addingId) return;
    setAddingId(book.id);
    try {
      const titleN = normalize(book.title);
      const authorN = normalize(book.author);

      const { data: existing, error: checkError } = await supabase
        .from('books')
        .select('id, status')
        .eq('user_id', currentUser.id)
        .eq('title_normalized', titleN)
        .eq('author_normalized', authorN)
        .maybeSingle();

      if (checkError) {
        Toast.show({
          type: 'error',
          text1: 'Nie udało się sprawdzić listy',
          text2: checkError.message,
        });
        return;
      }

      if (existing) {
        Toast.show({
          type: 'info',
          text1: 'Masz już tę książkę',
          text2: `Status: ${STATUS_LABELS[existing.status as BookStatus]}`,
        });
        confirmStatusChange(existing.id, existing.status as BookStatus);
        return;
      }

      const { error } = await supabase.from('books').insert({
        user_id: currentUser.id,
        title: book.title,
        author: book.author,
        cover_url: book.cover_url,
        status: 'to_read',
      });

      if (error) {
        // Zabezpieczenie DB (unique index) wyścigu: potraktuj jak istnienie.
        const code = (error as { code?: string }).code;
        if (code === '23505') {
          Toast.show({ type: 'info', text1: 'Masz już tę książkę na liście' });
          return;
        }
        Toast.show({ type: 'error', text1: 'Nie udało się dodać', text2: error.message });
        return;
      }

      Toast.show({
        type: 'success',
        text1: 'Dodano do Twojej listy',
        text2: `${book.title} — Chcę przeczytać`,
      });
    } finally {
      setAddingId(null);
    }
  }

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.bg },
        header: {
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.sm,
        },
        overline: { ...typography.overline, color: colors.textSubtle },
        title: { ...typography.h2, color: colors.text, marginTop: 4 },
        emptyBox: {
          alignItems: 'center',
          padding: spacing.xxl,
          marginHorizontal: spacing.lg,
          marginTop: spacing.lg,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
        },
        empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
        addBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: colors.primary,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.md,
          minWidth: 78,
          justifyContent: 'center',
        },
        addBtnText: { color: colors.primaryText, fontSize: 12, fontWeight: '700' },
      }),
    [colors, spacing, radius, typography],
  );

  if (loading) {
    return (
      <View style={[styles.screen, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Animated.View entering={FadeInUp.duration(260)} style={styles.header}>
        <Text style={styles.overline}>Przeczytane przez</Text>
        <Text style={styles.title}>{username || '—'}</Text>
      </Animated.View>
      <FlatList
        data={books}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ paddingBottom: spacing.xxl, paddingTop: spacing.xs }}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 30).duration(240)}>
            <BookRow
              title={item.title}
              author={item.author}
              coverUrl={item.cover_url}
              rating={item.rating}
              rightSlot={
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={`Dodaj ${item.title} do mojej listy`}
                  onPress={() => quickAdd(item)}
                  disabled={addingId === item.id}
                  style={styles.addBtn}
                >
                  {addingId === item.id ? (
                    <ActivityIndicator color={colors.primaryText} size="small" />
                  ) : (
                    <>
                      <Ionicons name="add" size={16} color={colors.primaryText} />
                      <Text style={styles.addBtnText}>Dodaj</Text>
                    </>
                  )}
                </PressableScale>
              }
            />
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="book-outline" size={32} color={colors.textSubtle} />
            <Text style={styles.empty}>Brak przeczytanych książek.</Text>
          </View>
        }
      />
    </View>
  );
}
