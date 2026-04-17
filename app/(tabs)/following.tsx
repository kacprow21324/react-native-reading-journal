import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { PressableScale } from '@/components/PressableScale';
import { useTheme } from '@/lib/ThemeContext';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/useAuthStore';

type FollowedProfile = { user_id: string; username: string; follow_id: string };

type FollowRow = {
  id: string;
  following_id: string;
  profiles: { username: string } | { username: string }[] | null;
};

function readUsername(profiles: FollowRow['profiles']): string {
  if (!profiles) return '(nieznany)';
  if (Array.isArray(profiles)) return profiles[0]?.username ?? '(nieznany)';
  return profiles.username;
}

export default function Following() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { theme } = useTheme();
  const { colors, spacing, radius, typography } = theme;
  const [rows, setRows] = useState<FollowedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('user_follows')
      .select('id, following_id, profiles:following_id(username)')
      .eq('follower_id', currentUser.id)
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) {
      Toast.show({ type: 'error', text1: 'Nie udało się pobrać listy', text2: error.message });
      return;
    }
    const mapped: FollowedProfile[] = (data ?? []).map((r: FollowRow) => ({
      user_id: r.following_id,
      username: readUsername(r.profiles),
      follow_id: r.id,
    }));
    setRows(mapped);
  }, [currentUser]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function unfollow(followId: string) {
    if (busyId) return;
    setBusyId(followId);
    const { error } = await supabase.from('user_follows').delete().eq('id', followId);
    setBusyId(null);
    if (error) {
      Toast.show({ type: 'error', text1: 'Nie udało się', text2: error.message });
      return;
    }
    Toast.show({ type: 'success', text1: 'Przestałeś obserwować' });
    setRows((prev) => prev.filter((r) => r.follow_id !== followId));
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
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          marginHorizontal: spacing.lg,
          marginVertical: spacing.xs,
          gap: spacing.md,
        },
        // Klikalny obszar z user info — szczelina flex, żeby nie zajmował przycisku.
        info: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
        avatar: {
          width: 44,
          height: 44,
          borderRadius: radius.pill,
          backgroundColor: colors.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
        },
        username: { ...typography.bodyStrong, color: colors.text },
        subtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
        unfollow: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          backgroundColor: colors.dangerBg,
          borderRadius: radius.md,
          minWidth: 120,
          alignItems: 'center',
        },
        unfollowText: { color: colors.danger, fontSize: 12, fontWeight: '700' },
        empty: {
          textAlign: 'center',
          color: colors.textMuted,
          marginTop: spacing.xxl,
          paddingHorizontal: spacing.xl,
        },
      }),
    [colors, spacing, radius, typography],
  );

  if (loading) {
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
      <View style={styles.header}>
        <Text style={styles.overline}>Obserwowani</Text>
        <Text style={styles.title}>Twoi czytelnicy</Text>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.follow_id}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.delay(index * 30).duration(240)}
            style={styles.row}
          >
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`Otwórz bibliotekę: ${item.username}`}
              style={styles.info}
              scaleTo={0.98}
              onPress={() =>
                router.push({ pathname: '/user/[id]', params: { id: item.user_id } })
              }
            >
              <View style={styles.avatar}>
                <Ionicons name="person" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.username} numberOfLines={1}>
                  {item.username}
                </Text>
                <Text style={styles.subtitle}>Zobacz bibliotekę</Text>
              </View>
            </PressableScale>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`Przestań obserwować ${item.username}`}
              onPress={() => unfollow(item.follow_id)}
              disabled={busyId === item.follow_id}
              style={styles.unfollow}
              scaleTo={0.95}
            >
              {busyId === item.follow_id ? (
                <ActivityIndicator size="small" color={colors.danger} />
              ) : (
                <Text style={styles.unfollowText}>Przestań obserwować</Text>
              )}
            </PressableScale>
          </Animated.View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Nikogo jeszcze nie obserwujesz.</Text>
        }
      />
    </SafeAreaView>
  );
}
