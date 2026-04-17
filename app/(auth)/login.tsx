import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';

import { ThemedButton } from '@/components/ThemedButton';
import { useTheme } from '@/lib/ThemeContext';
import { supabase } from '@/services/supabase';

export default function Login() {
  const { theme } = useTheme();
  const { colors, spacing, radius, typography } = theme;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signIn() {
    if (!email.trim() || !password) {
      Toast.show({ type: 'error', text1: 'Uzupełnij email i hasło' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      Toast.show({ type: 'error', text1: 'Błąd logowania', text2: error.message });
    }
  }

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          padding: spacing.xl,
          justifyContent: 'center',
          gap: spacing.md,
          backgroundColor: colors.bg,
        },
        brand: { ...typography.overline, color: colors.primary, textAlign: 'center' },
        title: { ...typography.h1, color: colors.text, textAlign: 'center' },
        subtitle: {
          ...typography.body,
          color: colors.textMuted,
          textAlign: 'center',
          marginBottom: spacing.md,
        },
        input: {
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          color: colors.text,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          fontSize: 15,
        },
        link: { color: colors.primary, textAlign: 'center', marginTop: spacing.md, fontWeight: '600' },
      }),
    [colors, spacing, radius, typography],
  );

  return (
    <View style={styles.screen}>
      <Animated.Text entering={FadeInUp.duration(260)} style={styles.brand}>
        Dziennik Czytelnika
      </Animated.Text>
      <Animated.Text entering={FadeInUp.delay(60).duration(260)} style={styles.title}>
        Witaj z powrotem
      </Animated.Text>
      <Animated.Text entering={FadeInUp.delay(120).duration(260)} style={styles.subtitle}>
        Zaloguj się, aby wrócić do swojej biblioteki.
      </Animated.Text>
      <Animated.View entering={FadeInDown.delay(160).duration(260)}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.textSubtle}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(200).duration(260)}>
        <TextInput
          style={styles.input}
          placeholder="Hasło"
          placeholderTextColor={colors.textSubtle}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(240).duration(260)}>
        <ThemedButton
          label="Zaloguj"
          onPress={signIn}
          loading={loading}
          fullWidth
          accessibilityLabel="Zaloguj się"
        />
      </Animated.View>
      <Link href="/register" style={styles.link}>
        Nie masz konta? Zarejestruj się
      </Link>
    </View>
  );
}
