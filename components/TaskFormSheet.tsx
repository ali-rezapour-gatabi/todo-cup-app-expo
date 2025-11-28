import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Keyboard, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CalendarClock, CalendarDays, CheckSquare, Clock3, FileText, Layers, Mic } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/check-box';
import { JalaliDatePickerModal } from '@/components/JalaliDatePickerModal';
import { vazirmatnFamilies } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useJalaliCalendar } from '@/hooks/use-jalali-calendar';
import { Task } from '@/database/types';
import { useTodoStore } from '@/stores/useTodoStore';
import { todayIso } from '@/utils/date';
import { useToast } from '@/components/ui/toast';
import { VoiceTab } from '@/components/VoiceTab';

const defaultTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const parseTimeToDate = (timeString: string) => {
  const [h, m] = timeString.split(':').map((v) => Number(v));
  const base = new Date();
  base.setHours(h || 0, m || 0, 0, 0);
  return base;
};

const taskSchema = z.object({
  title: z.string().trim().min(2, 'عنوان باید حداقل ۲ کاراکتر باشد.'),
  description: z.string().trim(),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  date: z.string().regex(dateRegex, 'تاریخ باید در قالب yyyy-MM-dd باشد.'),
  time: z.string().regex(timeRegex, 'ساعت باید در قالب HH:mm باشد.'),
  repeatDaily: z.boolean(),
});

export type TaskFormValues = z.infer<typeof taskSchema>;

type TabKey = 'details' | 'schedule' | 'voice';

type Props = {
  visible: boolean;
  onClose: () => void;
  task?: Task | null;
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const SHEET_HEIGHT = screenHeight * 0.6;
const TAB_INDEX: Record<TabKey, number> = { details: 0, schedule: 1, voice: 2 };

export const TaskFormSheet = ({ visible, onClose, task }: Props) => {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const { showToast } = useToast();

  const addTask = useTodoStore((state) => state.addTask);
  const updateTask = useTodoStore((state) => state.updateTask);
  const loadTasks = useTodoStore((state) => state.loadTasks);

  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const tabSlideAnim = useRef(new Animated.Value(0)).current;

  const [renderSheet, setRenderSheet] = useState(visible);
  const [activeTab, setActiveTab] = useState<TabKey>('details');
  const [voiceTabMounted, setVoiceTabMounted] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerMounted, setDatePickerMounted] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [iosTimePickerMounted, setIosTimePickerMounted] = useState(false);
  const [iosTimeValue, setIosTimeValue] = useState(() => parseTimeToDate(defaultTime()));

  const defaultValues = useMemo<TaskFormValues>(
    () => ({
      title: '',
      description: '',
      priority: 2,
      date: todayIso(),
      time: defaultTime(),
      repeatDaily: false,
    }),
    []
  );

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues,
    mode: 'onChange',
  });

  const titleValue = watch('title');
  const dateValue = watch('date');
  const timeValue = watch('time');
  const repeatValue = watch('repeatDaily');
  const priorityValue = watch('priority');

  const { jalaliLabel } = useJalaliCalendar(dateValue);

  const canSave = useMemo(() => titleValue.trim().length > 1 && dateRegex.test(dateValue) && timeRegex.test(timeValue), [titleValue, dateValue, timeValue]);

  useEffect(() => {
    Animated.spring(tabSlideAnim, {
      toValue: TAB_INDEX[activeTab],
      damping: 20,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
  }, [activeTab, tabSlideAnim]);

  useEffect(() => {
    if (visible) {
      setRenderSheet(true);
      Animated.spring(translateY, {
        toValue: 0,
        damping: 18,
        stiffness: 180,
        useNativeDriver: true,
      }).start();

      const nextValues = task
        ? {
            title: task.title,
            description: task.description ?? '',
            priority: task.priority,
            date: task.date,
            time: task.time,
            repeatDaily: Boolean(task.repeatDaily),
          }
        : defaultValues;
      const safeValues = nextValues.repeatDaily ? { ...nextValues, date: todayIso() } : nextValues;
      reset(safeValues);
      setIosTimeValue(parseTimeToDate(safeValues.time || defaultTime()));
      setActiveTab('details');
    } else if (renderSheet) {
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setRenderSheet(false);
        }
      });
    }
  }, [visible, renderSheet, translateY, task, reset, defaultValues]);

  const requestClose = useCallback(() => {
    setDatePickerVisible(false);
    setTimePickerVisible(false);
    onClose();
  }, [onClose]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 8,
        onPanResponderMove: (_, gesture) => {
          const next = Math.min(Math.max(0, gesture.dy), SHEET_HEIGHT);
          translateY.setValue(next);
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 140 || gesture.vy > 1.2) {
            requestClose();
            return;
          }
          Animated.spring(translateY, {
            toValue: 0,
            damping: 18,
            stiffness: 180,
            useNativeDriver: true,
          }).start();
        },
      }),
    [requestClose, translateY]
  );

  const handleTimeChange = (date?: Date) => {
    if (!date) return;
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const formatted = `${hours}:${minutes}`;
    setValue('time', formatted, { shouldValidate: true });
    setIosTimeValue(date);
  };

  const onAndroidTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === 'set' && selected) {
      handleTimeChange(selected);
    }
  };

  const showTimePicker = () => {
    const initialDate = parseTimeToDate(timeValue || defaultTime());
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        mode: 'time',
        value: initialDate,
        is24Hour: true,
        onChange: onAndroidTimeChange,
      });
      return;
    }
    setIosTimePickerMounted(true);
    setIosTimeValue(initialDate);
    setTimePickerVisible(true);
  };

  const handleSave = async (values: TaskFormValues) => {
    const payload = {
      title: values.title.trim(),
      description: values.description ?? '',
      priority: values.priority,
      date: values.date,
      time: values.time,
      repeatDaily: values.repeatDaily,
    };

    try {
      if (task?.id) {
        await updateTask(task.id, payload);
        showToast({ type: 'success', title: 'ذخیره شد', message: 'ویرایش فعالیت با موفقیت انجام شد.' });
      } else {
        await addTask(payload);
        showToast({ type: 'success', title: 'ایجاد شد', message: 'فعالیت جدید ثبت شد.' });
      }
      Keyboard.dismiss();
      requestClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'خطای ناشناخته رخ داد.';
      showToast({ type: 'error', title: 'خطا', message });
    }
  };

  const handleVoiceTaskCreated = useCallback(async () => {
    await loadTasks();
    requestClose();
  }, [loadTasks, requestClose]);

  if (!renderSheet) {
    return null;
  }

  const backdropOpacity = translateY.interpolate({
    inputRange: [0, SHEET_HEIGHT],
    outputRange: [0.45, 0],
    extrapolate: 'clamp',
  });

  const formTitle = task ? 'ویرایش فعالیت' : 'فعالیت جدید';

  const detailsTranslateX = tabSlideAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, -screenWidth, -2 * screenWidth],
  });

  const scheduleTranslateX = tabSlideAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [screenWidth, 0, -screenWidth],
  });

  const voiceTranslateX = tabSlideAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [2 * screenWidth, screenWidth, 0],
  });

  const makeOpacity = (index: number) =>
    tabSlideAnim.interpolate({
      inputRange: [index - 0.5, index, index + 0.5],
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });

  const detailsOpacity = makeOpacity(0);
  const scheduleOpacity = makeOpacity(1);
  const voiceOpacity = makeOpacity(2);

  return (
    <Modal visible transparent animationType="none" onRequestClose={requestClose} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={requestClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheetContainer,
          {
            backgroundColor: palette.surface,
            height: SHEET_HEIGHT,
            transform: [{ translateY }],
          },
        ]}
      >
        <Pressable style={styles.handle} {...panResponder.panHandlers} onPress={requestClose}>
          <View style={[styles.grabber, { backgroundColor: palette.border }]} />
        </Pressable>

        <ThemedText type="subtitle" style={{ textAlign: 'center', marginVertical: 8, borderColor: palette.border, borderBottomWidth: 1, borderRadius: 12 }}>
          {formTitle}
        </ThemedText>

        <View style={styles.body}>
          <View style={styles.tabList}>
            <Button title="ذخیره" variant="primary" disabled={!canSave || isSubmitting} onPress={handleSubmit(handleSave)} style={styles.saveButton} />
            <View style={{ display: 'flex', flexDirection: 'row' }}>
              {[
                { key: 'details', icon: <FileText size={24} color={palette.icon} /> },
                { key: 'schedule', icon: <CalendarClock size={24} color={palette.icon} /> },
                { key: 'voice', icon: <Mic size={24} color={palette.icon} /> },
              ].map((tab) => {
                const selected = activeTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => {
                      if (tab.key === 'voice') {
                        setVoiceTabMounted(true);
                      }
                      setActiveTab(tab.key as TabKey);
                    }}
                    style={[styles.tabButton, selected && { backgroundColor: palette.tint + '24', borderColor: palette.tint }]}
                  >
                    <View style={[styles.tabIcon]}>{tab.icon}</View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.tabContainer}>
            <Animated.View
              style={[
                styles.tabAnimatedContent,
                {
                  opacity: detailsOpacity,
                  transform: [{ translateX: detailsTranslateX }],
                },
              ]}
              pointerEvents={activeTab === 'details' ? 'auto' : 'none'}
            >
              <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={styles.tabContent}>
                  <View style={styles.field}>
                    <View style={styles.labelRow}>
                      <CheckSquare size={16} color={palette.icon} />
                      <ThemedText weight="bold">عنوان *</ThemedText>
                    </View>
                    <Controller
                      control={control}
                      name="title"
                      render={({ field: { value, onChange, onBlur } }) => (
                        <TextInput
                          placeholder="عنوان فعالیت را بنویسید"
                          placeholderTextColor={palette.icon}
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          style={[styles.input, { borderColor: palette.border, color: palette.text }]}
                        />
                      )}
                    />
                    {errors.title ? <ThemedText style={styles.errorText}>{errors.title.message}</ThemedText> : null}
                  </View>

                  <View style={styles.field}>
                    <View style={styles.labelRow}>
                      <FileText size={16} color={palette.icon} />
                      <ThemedText weight="bold">توضیحات</ThemedText>
                    </View>
                    <Controller
                      control={control}
                      name="description"
                      render={({ field: { value, onChange, onBlur } }) => (
                        <TextInput
                          placeholder="جزئیات یا لینک‌های مهم را اینجا یادداشت کنید"
                          placeholderTextColor={palette.icon}
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          multiline
                          numberOfLines={4}
                          style={[styles.input, styles.multiline, { borderColor: palette.border, color: palette.text }]}
                        />
                      )}
                    />
                  </View>

                  <View style={styles.field}>
                    <View style={styles.labelRow}>
                      <Layers size={16} color={palette.icon} />
                      <ThemedText weight="bold">اولویت</ThemedText>
                    </View>
                    <View style={styles.priorityRow}>
                      {[1, 2, 3].map((level) => {
                        const labels: Record<number, string> = { 1: 'کم', 2: 'متوسط', 3: 'زیاد' };
                        const selected = priorityValue === level;
                        return (
                          <Pressable
                            key={level}
                            onPress={() => setValue('priority', level as 1 | 2 | 3, { shouldValidate: true })}
                            style={[
                              styles.priorityPill,
                              { borderColor: selected ? palette.tint : palette.border, backgroundColor: selected ? palette.tint + '15' : 'transparent' },
                            ]}
                          >
                            <ThemedText weight="semiBold" style={[styles.priorityLabel, selected && { color: palette.tint }]}>{`اولویت ${labels[level]}`}</ThemedText>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </View>
              </ScrollView>
            </Animated.View>

            <Animated.View
              style={[
                styles.tabAnimatedContent,
                {
                  opacity: scheduleOpacity,
                  transform: [{ translateX: scheduleTranslateX }],
                },
              ]}
              pointerEvents={activeTab === 'schedule' ? 'auto' : 'none'}
            >
              <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={styles.tabContent}>
                  <View style={styles.field}>
                    <View style={styles.labelRow}>
                      <Clock3 size={16} color={palette.icon} />
                      <ThemedText weight="bold">ساعت</ThemedText>
                    </View>
                    <Pressable onPress={showTimePicker} style={[styles.input, styles.inlineInput, { borderColor: palette.border }]}>
                      <ThemedText weight="semiBold">{timeValue || defaultTime()}</ThemedText>
                      <ThemedText style={styles.secondaryText}>۲۴ ساعته</ThemedText>
                    </Pressable>
                    {errors.time ? <ThemedText style={styles.errorText}>{errors.time.message}</ThemedText> : null}
                  </View>
                  <View style={styles.field}>
                    <View style={styles.labelRow}>
                      <CalendarDays size={16} color={palette.icon} />
                      <ThemedText weight="bold">تاریخ</ThemedText>
                    </View>
                    <Pressable
                      onPress={() => {
                        if (!repeatValue) {
                          setDatePickerMounted(true);
                          setDatePickerVisible(true);
                        }
                      }}
                      disabled={repeatValue}
                      style={[styles.input, styles.inlineInput, { borderColor: palette.border, backgroundColor: repeatValue ? palette.border + '33' : palette.background }]}
                    >
                      <ThemedText weight="semiBold">{jalaliLabel}</ThemedText>
                      <ThemedText style={styles.secondaryText}>{dateValue}</ThemedText>
                    </Pressable>
                    {repeatValue ? <ThemedText style={styles.helperText}>در حالت تکرار روزانه، تاریخ روز جاری است.</ThemedText> : null}
                    {errors.date ? <ThemedText style={styles.errorText}>{errors.date.message}</ThemedText> : null}
                  </View>

                  <View style={[styles.field, styles.repeatRow]}>
                    <Controller
                      control={control}
                      name="repeatDaily"
                      render={({ field: { value, onChange } }) => (
                        <View style={styles.labelRow}>
                          <ThemedText weight="bold">تکرار روزانه</ThemedText>
                          <ThemedText style={styles.secondaryText}>فعال کنید تا هر روز یادآوری شود</ThemedText>
                          <Checkbox
                            value={value}
                            onChange={(next) => {
                              onChange(next);
                              if (next) {
                                setValue('date', todayIso(), { shouldValidate: true });
                              }
                            }}
                          />
                        </View>
                      )}
                    />
                  </View>
                </View>
              </ScrollView>
            </Animated.View>

            <Animated.View
              style={[
                styles.tabAnimatedContent,
                {
                  opacity: voiceOpacity,
                  transform: [{ translateX: voiceTranslateX }],
                },
              ]}
              pointerEvents={activeTab === 'voice' ? 'auto' : 'none'}
            >
              <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={styles.tabContent}>{voiceTabMounted ? <VoiceTab onTaskCreated={handleVoiceTaskCreated} /> : null}</View>
              </ScrollView>
            </Animated.View>
          </View>
        </View>
      </Animated.View>

      {datePickerMounted ? (
        <JalaliDatePickerModal
          visible={datePickerVisible}
          selectedIsoDate={dateValue}
          onClose={() => setDatePickerVisible(false)}
          onConfirm={(iso) => {
            setValue('date', iso, { shouldValidate: true });
            setDatePickerVisible(false);
          }}
        />
      ) : null}

      {Platform.OS === 'ios' && iosTimePickerMounted ? (
        <Modal visible={timePickerVisible} transparent animationType="fade" onRequestClose={() => setTimePickerVisible(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setTimePickerVisible(false)} />
          <View style={[styles.timeSheet, { backgroundColor: palette.surface }]}>
            <ThemedText style={styles.timeSheetTitle} weight="bold">
              انتخاب ساعت
            </ThemedText>
            <DateTimePicker
              value={iosTimeValue}
              mode="time"
              display="spinner"
              is24Hour
              onChange={(date: any) => {
                if (date) {
                  setIosTimeValue(date);
                }
              }}
              themeVariant={scheme}
            />
            <Button
              title="تایید"
              variant="primary"
              fullWidth
              onPress={() => {
                handleTimeChange(iosTimeValue);
                setTimePickerVisible(false);
              }}
            />
          </View>
        </Modal>
      ) : null}
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 16,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  handle: {
    alignItems: 'center',
    paddingVertical: 6,
    gap: 2,
  },
  grabber: {
    width: 64,
    height: 4,
    borderRadius: 999,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 6,
  },
  headerHint: {
    opacity: 0.7,
  },
  saveButton: {
    minWidth: 96,
  },
  closeButton: {
    padding: 8,
  },
  body: {
    flex: 1,
    flexDirection: 'column-reverse',
    gap: 12,
  },
  tabList: {
    borderRadius: 16,
    padding: 8,
    gap: 8,
    display: 'flex',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  tabButton: {
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    gap: 10,
  },
  tabIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flex: 1,
    position: 'relative',
  },
  tabAnimatedContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    flexGrow: 1,
    padding: 6,
  },
  tabContent: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    textAlign: 'right',
    fontFamily: vazirmatnFamilies.regular,
  },
  inlineInput: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  priorityRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    flexWrap: 'wrap',
  },
  priorityPill: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  priorityLabel: {
    fontSize: 14,
  },
  secondaryText: {
    opacity: 0.6,
    fontSize: 12,
  },
  helperText: {
    opacity: 0.7,
    fontSize: 12,
  },
  repeatRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  timeSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: 12,
  },
  timeSheetTitle: {
    textAlign: 'center',
  },
});
