import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';

import { ThemedButton } from '@/components/ThemedButton';
import { useTheme } from '@/lib/ThemeContext';
import { supabase } from '@/services/supabase';

export default function Register() {
  const { theme } = useTheme();
  const { colors, spacing, radius, typography } = theme;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  async function signUp() {
    if (!email.trim() || !password || !username.trim()) {
      Toast.show({ type: 'error', text1: 'Uzupełnij wszystkie pola' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { username: username.trim() } },
    });
    setLoading(false);
    if (error) {
      Toast.show({ type: 'error', text1: 'Błąd rejestracji', text2: error.message });
      return;
    }
    Toast.show({
      type: 'success',
      text1: 'Konto utworzone',
      text2: 'Jeśli włączona jest weryfikacja, sprawdź email.',
    });
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
        Załóż konto
      </Animated.Text>
      <Animated.Text entering={FadeInUp.delay(120).duration(260)} style={styles.subtitle}>
        Zacznij zbierać swoją biblioteczkę już dziś.
      </Animated.Text>

      <Animated.View entering={FadeInDown.delay(160).duration(260)}>
        <TextInput
          style={styles.input}
          placeholder="Nazwa użytkownika"
          placeholderTextColor={colors.textSubtle}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(200).duration(260)}>
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
      <Animated.View entering={FadeInDown.delay(240).duration(260)}>
        <TextInput
          style={styles.input}
          placeholder="Hasło"
          placeholderTextColor={colors.textSubtle}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(280).duration(260)}>
        <ThemedButton label="Załóż konto" onPress={signUp} loading={loading} fullWidth />
      </Animated.View>

      <Link href="/login" style={styles.link}>
        Masz już konto? Zaloguj się
      </Link>
    </View>
  );
}
