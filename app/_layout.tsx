import { Stack, router, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

import { ThemeProvider, useTheme } from '@/lib/ThemeContext';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootShell />
    </ThemeProvider>
  );
}

function RootShell() {
  const { theme } = useTheme();
  const { colors } = theme;
  const [bootstrapped, setBootstrapped] = useState(false);
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser);
  const currentUser = useAuthStore((s) => s.currentUser);
  const segments = useSegments();

  useEffect(() => {
    let mounted = true;

    async function syncFromSession(userId: string | null, email: string | null) {
      if (!userId) {
        setCurrentUser(null);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();
      if (!mounted) return;
      setCurrentUser({ id: userId, email, username: data?.username ?? '' });
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      syncFromSession(session?.user?.id ?? null, session?.user?.email ?? null).finally(() => {
        if (mounted) setBootstrapped(true);
      });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      syncFromSession(session?.user?.id ?? null, session?.user?.email ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [setCurrentUser]);

  useEffect(() => {
    if (!bootstrapped) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!currentUser && !inAuthGroup) {
      router.replace('/login');
    } else if (currentUser && inAuthGroup) {
      router.replace('/library');
    }
  }, [bootstrapped, currentUser, segments]);

  if (!bootstrapped) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.bg,
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bgElevated },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="book/new" options={{ title: 'Nowa książka', presentation: 'modal' }} />
        <Stack.Screen name="book/[id]" options={{ title: 'Szczegóły książki' }} />
        <Stack.Screen name="user/[id]" options={{ title: 'Biblioteka czytelnika' }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
      <Toast />
    </GestureHandlerRootView>
  );
}
