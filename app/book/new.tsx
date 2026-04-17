import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';

import { StarRating } from '@/components/StarRating';
import { StatusPicker } from '@/components/StatusPicker';
import { ThemedButton } from '@/components/ThemedButton';
import { normalize } from '@/lib/normalize';
import { useTheme } from '@/lib/ThemeContext';
import type { BookStatus } from '@/lib/status';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import type { Book } from '@/types/db';

export default function AddOrEditBook() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = Boolean(id);
  const currentUser = useAuthStore((s) => s.currentUser);
  const { theme } = useTheme();
  const { colors, spacing, radius, typography } = theme;

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState<BookStatus>('to_read');
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing || !id) return;
    (async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single<Book>();
      if (error || !data) {
        Toast.show({ type: 'error', text1: 'Nie znaleziono książki' });
        setLoading(false);
        return;
      }
      setTitle(data.title);
      setAuthor(data.author);
      setStatus(data.status);
      setRating(data.rating);
      setNotes(data.notes ?? '');
      setCoverUrl(data.cover_url ?? '');
      setLoading(false);
    })();
  }, [editing, id]);

  async function save() {
    if (!currentUser || saving) return;
    if (!title.trim() || !author.trim()) {
      Toast.show({ type: 'error', text1: 'Tytuł i autor są wymagane' });
      return;
    }
    setSaving(true);

    // Ręczne sprawdzenie duplikatów również tutaj, żeby lepiej niż surowe 23505.
    if (!editing) {
      const { data: dup } = await supabase
        .from('books')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('title_normalized', normalize(title))
        .eq('author_normalized', normalize(author))
        .maybeSingle();
      if (dup) {
        setSaving(false);
        Toast.show({
          type: 'info',
          text1: 'Masz już tę książkę na liście',
        });
        return;
      }
    }

    const payload = {
      user_id: currentUser.id,
      title: title.trim(),
      author: author.trim(),
      status,
      rating: status === 'finished' ? rating : null,
      notes: notes.trim() ? notes.trim() : null,
      cover_url: coverUrl.trim() ? coverUrl.trim() : null,
    };
    const { error } =
      editing && id
        ? await supabase.from('books').update(payload).eq('id', id)
        : await supabase.from('books').insert(payload);
    setSaving(false);
    if (error) {
      const code = (error as { code?: string }).code;
      if (code === '23505') {
        Toast.show({ type: 'info', text1: 'Taka książka już istnieje na Twojej liście' });
        return;
      }
      Toast.show({
        type: 'error',
        text1: 'Zapis nie powiódł się',
        text2: error.message,
      });
      return;
    }
    Toast.show({
      type: 'success',
      text1: editing ? 'Zapisano zmiany' : 'Dodano książkę',
    });
    router.back();
  }

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.bg },
        content: { padding: spacing.lg, gap: spacing.sm },
        card: {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.lg,
          gap: spacing.sm,
        },
        label: {
          ...typography.caption,
          color: colors.textMuted,
          marginTop: spacing.sm,
          fontWeight: '700',
        },
        input: {
          backgroundColor: colors.bgElevated,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          fontSize: 15,
          color: colors.text,
          borderWidth: 1,
          borderColor: colors.border,
        },
        notes: { minHeight: 110, textAlignVertical: 'top' },
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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Animated.View entering={FadeInDown.duration(260)} style={styles.card}>
        <Text style={styles.label}>Tytuł</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="np. Lalka"
          placeholderTextColor={colors.textSubtle}
        />

        <Text style={styles.label}>Autor</Text>
        <TextInput
          style={styles.input}
          value={author}
          onChangeText={setAuthor}
          placeholder="np. Bolesław Prus"
          placeholderTextColor={colors.textSubtle}
        />

        <Text style={styles.label}>URL okładki (opcjonalnie)</Text>
        <TextInput
          style={styles.input}
          value={coverUrl}
          onChangeText={setCoverUrl}
          autoCapitalize="none"
          placeholder="https://..."
          placeholderTextColor={colors.textSubtle}
        />

        <Text style={styles.label}>Status</Text>
        <StatusPicker value={status} onChange={setStatus} />

        <Text style={styles.label}>
          Ocena {status === 'finished' ? '' : '(dostępna dla statusu „Przeczytane")'}
        </Text>
        <StarRating
          value={rating}
          onChange={status === 'finished' ? setRating : undefined}
          disabled={status !== 'finished'}
        />

        <Text style={styles.label}>Notatki</Text>
        <TextInput
          style={[styles.input, styles.notes]}
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Twoje przemyślenia o książce…"
          placeholderTextColor={colors.textSubtle}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(60).duration(260)}>
        <ThemedButton
          label={editing ? 'Zapisz zmiany' : 'Dodaj książkę'}
          loading={saving}
          onPress={save}
          fullWidth
        />
      </Animated.View>
    </ScrollView>
  );
}
