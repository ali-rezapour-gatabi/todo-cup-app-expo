import { useEffect, useMemo } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTodoStore } from '@/stores/useTodoStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToast } from '@/components/ui/toast';
import { Colors } from '@/constants/theme';
import { vazirmatnFamilies } from '@/constants/fonts';
import { ArrowRight, Moon, Settings, Sun } from 'lucide-react-native';
import { router } from 'expo-router';

const profileSchema = z.object({
  name: z.string().trim().min(1, 'نام نمی‌تواند خالی باشد.'),
  email: z.string().trim().email('ایمیل وارد شده معتبر نیست.').optional().or(z.literal('')),
  age: z.string().trim().regex(/^\d+$/, 'سن باید یک عدد باشد.').optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

type ThemeOption = 'light' | 'dark' | 'system';

export function ProfileScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];
  const { showToast } = useToast();

  const profile = useTodoStore((state) => state.profile);
  const saveProfile = useTodoStore((state) => state.saveProfile);
  const currentTheme = useTodoStore((state) => state.theme);
  const setTheme = useTodoStore((state) => state.setTheme);

  const defaultValues = useMemo<ProfileFormValues>(
    () => ({
      name: profile?.name ?? 'کاربر',
      email: profile?.settings?.email ?? '',
      age: profile?.settings?.age ? String(profile.settings.age) : '',
    }),
    [profile]
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
    mode: 'onChange',
  });

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name,
        email: profile.settings?.email ?? '',
        age: profile.settings?.age ? String(profile.settings.age) : '',
      });
    }
  }, [profile, reset]);

  const handleSave = async (values: ProfileFormValues) => {
    try {
      const updatedSettings = {
        ...profile?.settings,
        email: values.email || undefined,
        age: values.age ? Number(values.age) : undefined,
      };
      await saveProfile({
        name: values.name,
        settings: updatedSettings,
      });
      showToast({ type: 'success', title: 'ذخیره شد', message: 'پروفایل شما بروزرسانی شد.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'خطای ناشناخته رخ داد.';
      showToast({ type: 'error', title: 'خطا', message });
    }
  };

  const themeOptions: { key: ThemeOption; icon: any }[] = [
    { key: 'light', icon: <Sun color={palette.completedTask} size={24} /> },
    { key: 'dark', icon: <Moon color={palette.completedTask} size={24} /> },
    { key: 'system', icon: <Settings color={palette.completedTask} size={24} /> },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.topHeader}>
        <Button title={null} variant="ghost" icon={<ArrowRight color={palette.icon} size={30} />} onPress={() => router.push('/')} style={styles.backButton} />
        <ThemedText type="title">پروفایل</ThemedText>
        <View style={styles.backButton} />
      </View>

      <View style={styles.header}>
        <Image source={require('../assets/images/personIcons.png')} style={[styles.avatar, { borderColor: palette.border }]} />
        <ThemedText type="subtitle" style={{ marginTop: 8 }}>
          {profile?.name ?? 'کاربر'}
        </ThemedText>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <ThemedText style={styles.label} weight="bold">
            نام
          </ThemedText>
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="نام خود را وارد کنید"
                placeholderTextColor={palette.icon}
                style={[styles.input, { borderColor: palette.border, color: palette.text, backgroundColor: palette.surface }]}
              />
            )}
          />
          {errors.name && <ThemedText style={styles.errorText}>{errors.name.message}</ThemedText>}
        </View>
        <View style={styles.field}>
          <ThemedText style={styles.label} weight="bold">
            ایمیل
          </ThemedText>
          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="ایمیل خود را وارد کنید"
                placeholderTextColor={palette.icon}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, { borderColor: palette.border, color: palette.text, backgroundColor: palette.surface }]}
              />
            )}
          />
          {errors.email && <ThemedText style={styles.errorText}>{errors.email.message}</ThemedText>}
        </View>
        <View style={styles.field}>
          <ThemedText style={styles.label} weight="bold">
            سن
          </ThemedText>
          <Controller
            control={control}
            name="age"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="سن خود را وارد کنید"
                placeholderTextColor={palette.icon}
                keyboardType="numeric"
                style={[styles.input, { borderColor: palette.border, color: palette.text, backgroundColor: palette.surface }]}
              />
            )}
          />
          {errors.age && <ThemedText style={styles.errorText}>{errors.age.message}</ThemedText>}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.label} weight="bold">
          تم برنامه
        </ThemedText>
        <View style={[styles.themeSelector, { borderColor: palette.border }]}>
          {themeOptions.map(({ key, icon }) => (
            <Pressable
              key={key}
              style={[
                styles.themeButton,
                {
                  backgroundColor: currentTheme === key ? palette.tint : 'transparent',
                },
              ]}
              onPress={() => setTheme(key)}
            >
              {icon}
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ flex: 1 }} />

      <Button title="ذخیره تغییرات" variant="primary" fullWidth disabled={isSubmitting || !isDirty} onPress={handleSubmit(handleSave)} />
      <Button title="نظرات و پیشنهادات" variant="secondary" fullWidth />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 24,
  },
  topHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#e5e7eb',
    borderWidth: 2,
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlign: 'right',
    fontFamily: vazirmatnFamilies.regular,
    fontSize: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'right',
  },
  section: {
    gap: 12,
  },
  themeSelector: {
    flexDirection: 'row-reverse',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  themeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    margin: 2,
  },
});
