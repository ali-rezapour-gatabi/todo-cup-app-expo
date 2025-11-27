import { useEffect, useMemo } from 'react';
import { Image, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { vazirmatnFamilies } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppInit } from '@/hooks/useAppInit';
import { useTodoStore } from '@/stores/useTodoStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Redo } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/components/ui/toast';

const profileSchema = z.object({
  name: z.string().trim().min(1, 'نام نمی‌تواند خالی باشد.'),
  avatar: z
    .string()
    .trim()
    .refine((value) => value.length === 0 || /^https?:\/\/.+/i.test(value), 'آدرس تصویر باید معتبر باشد.'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export const ProfileScreen = () => {
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];
  const { showToast } = useToast();
  const profile = useTodoStore((state) => state.profile);
  const saveProfile = useTodoStore((state) => state.saveProfile);
  const runDailyRepeatCheck = useTodoStore((state) => state.runDailyRepeatCheck);
  const tasksCount = useTodoStore((state) => state.tasks.length);
  useAppInit();

  const defaultValues = useMemo<ProfileFormValues>(
    () => ({
      name: 'کاربر',
      avatar: '',
    }),
    []
  );

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
    mode: 'onChange',
  });

  const avatarValue = watch('avatar');

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name,
        avatar: profile.avatar ?? '',
      });
    } else {
      reset(defaultValues);
    }
  }, [profile, reset, defaultValues]);

  const handleSave = async (values: ProfileFormValues) => {
    try {
      await saveProfile({ name: values.name, avatar: values.avatar || undefined });
      showToast({ type: 'success', title: 'ذخیره شد', message: 'پروفایل شما بروزرسانی شد.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'خطای ناشناخته رخ داد.';
      showToast({ type: 'error', title: 'خطا', message });
    }
  };

  const handleRepeatCheck = async () => {
    const result = await runDailyRepeatCheck();
    if (result.created > 0) {
      showToast({ type: 'success', title: 'تکرار انجام شد', message: `${result.created} فعالیت برای فردا ساخته شد.` });
    } else {
      showToast({ type: 'info', title: 'تکرار روزانه', message: 'فعالیت‌ی جدیدی نیاز نبود. همه چیز به‌روز است.' });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={{ display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
        <Button style={{ width: 60, borderRadius: 18 }} title={null} icon={<Redo color={'white'} size={28} />} onPress={() => router.push('/')} />
        <ThemedText type="title">پروفایل</ThemedText>
      </View>

      <View style={styles.card}>
        <View style={styles.avatarRow}>
          <Image source={avatarValue ? { uri: avatarValue } : require('../assets/images/icon.png')} style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.label} weight="bold">
              نام
            </ThemedText>
            <Controller
              control={control}
              name="name"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="نام شما"
                  placeholderTextColor={palette.icon}
                  style={[styles.input, { borderColor: palette.border, color: palette.text }]}
                />
              )}
            />
            {errors.name ? <ThemedText style={styles.errorText}>{errors.name.message}</ThemedText> : null}
          </View>
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label} weight="bold">
            آواتار (آدرس تصویر)
          </ThemedText>
          <Controller
            control={control}
            name="avatar"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="https://نمونه.ir/avatar.jpg"
                placeholderTextColor={palette.icon}
                style={[styles.input, { borderColor: palette.border, color: palette.text }]}
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}
          />
          {errors.avatar ? <ThemedText style={styles.errorText}>{errors.avatar.message}</ThemedText> : null}
        </View>

        <View style={styles.metaRow}>
          <ThemedText style={styles.metaLabel}>تعداد وظایف</ThemedText>
          <ThemedText style={styles.metaValue} weight="bold">
            {tasksCount}
          </ThemedText>
        </View>

        <View style={styles.metaRow}>
          <ThemedText style={styles.metaLabel}>آخرین بررسی تکرار</ThemedText>
          <ThemedText style={styles.metaValue} weight="bold">
            {profile?.settings?.lastRepeatCheck ?? 'انجام نشده'}
          </ThemedText>
        </View>

        <View style={styles.actions}>
          <Button title="ذخیره پروفایل" variant="primary" fullWidth disabled={isSubmitting} onPress={handleSubmit(handleSave)} />
          <Button title="اجرای تکرار روزانه" variant="secondary" fullWidth onPress={handleRepeatCheck} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  header: {
    gap: 8,
  },
  subtitle: {
    opacity: 0.8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderColor: '#e5e7eb',
  },
  avatarRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e5e7eb',
  },
  field: {
    gap: 8,
  },
  label: {},
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: 'right',
    fontFamily: vazirmatnFamilies.regular,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  metaLabel: {
    opacity: 0.8,
  },
  metaValue: {},
  actions: {
    gap: 10,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
  },
});
