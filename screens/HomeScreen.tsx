import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { CalendarClock, Plus } from 'lucide-react-native';
import { TaskCard } from '@/components/TaskCard';
import { TaskFormSheet } from '@/components/TaskFormSheet';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppInit } from '@/hooks/useAppInit';
import { useTodoStore } from '@/stores/useTodoStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import UserHeaderProfile from '@/components/UserHeaderProfile';
import { Task } from '@/database/types';
import { useToast } from '@/components/ui/toast';
import { useJalaliCalendar } from '@/hooks/use-jalali-calendar';
import { JalaliDatePickerModal } from '@/components/JalaliDatePickerModal';

type HourGroup = {
  hour: string;
  tasks: Task[];
};

const normalizeHour = (time: string) => {
  const [hour] = time.split(':');
  const safeHour = hour?.padStart(2, '0') ?? '00';
  return `${safeHour}:00`;
};

const groupTasksByHour = (tasks: Task[]): HourGroup[] => {
  const grouped: Record<string, Task[]> = {};

  tasks.forEach((task) => {
    const hourKey = normalizeHour(task.time);
    if (!grouped[hourKey]) {
      grouped[hourKey] = [];
    }
    grouped[hourKey].push(task);
  });

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, hourTasks]) => ({ hour, tasks: hourTasks }));
};

export const HomeScreen = () => {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const { showToast } = useToast();
  const tasks = useTodoStore((state) => state.tasks);
  const loadTasks = useTodoStore((state) => state.loadTasks);
  const deleteTask = useTodoStore((state) => state.deleteTask);
  const toggleCompleted = useTodoStore((state) => state.toggleCompleted);
  const [sheetKey, setSheetKey] = useState('details');
  const [selectDate, setSelectDate] = useState<string | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { isoDate, jalaliLabel } = useJalaliCalendar(selectDate, { fallbackToToday: true });

  useAppInit(isoDate);

  const handleToggleCompleted = async (task: Task, next: boolean) => {
    try {
      await toggleCompleted(task.id, next);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'خطا در به‌روزرسانی وضعیت انجام شده.';
      showToast({ type: 'error', title: 'خطا', message });
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTasks(isoDate);
    setRefreshing(false);
  }, [isoDate, loadTasks]);

  const groupedTasks = useMemo(() => groupTasksByHour(tasks), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((task) => task.isCompleted).length, [tasks]);
  const pendingTasks = tasks.length - completedTasks;

  const openCreate = () => {
    setEditingTask(null);
    setFormVisible(true);
    setSheetKey('details');
  };

  const openCreateByAi = () => {
    setEditingTask(null);
    setFormVisible(true);
    setSheetKey('voice');
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setFormVisible(true);
  };

  const closeForm = () => {
    setFormVisible(false);
    setEditingTask(null);
  };

  const handleDelete = (id: number) => {
    showToast({
      type: 'warning',
      title: 'حذف فعالیت',
      message: 'برای حذف روی تایید بزنید.',
      actionLabel: 'بله، حذف شود',
      duration: 5000,
      onAction: async () => {
        await deleteTask(id);
        showToast({ type: 'success', title: 'حذف شد', message: 'فعالیت از لیست پاک شد.' });
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <UserHeaderProfile />

      <View style={[styles.headerCard, { backgroundColor: palette.surface, borderColor: palette.border, shadowColor: palette.tint }]}>
        <ThemedView style={[styles.headerTopRow, { backgroundColor: 'transparent' }]}>
          <ThemedText type="title" style={[styles.headerTitle, { color: palette.text }]}>
            لیست فعالیت ها
          </ThemedText>

          <View style={styles.linkRow}>
            <Pressable
              onPress={() => setDatePickerVisible(true)}
              style={[styles.datePill, { backgroundColor: palette.tabIconDefault + '25', borderColor: palette.surface + '35' }]}
            >
              <CalendarClock color={palette.text} size={17} />
              <ThemedText weight="semiBold" style={[styles.dateText, { color: palette.text }]}>
                {jalaliLabel}
              </ThemedText>
            </Pressable>

            {datePickerVisible ? (
              <JalaliDatePickerModal
                visible={datePickerVisible}
                selectedIsoDate={isoDate ?? ''}
                onClose={() => setDatePickerVisible(false)}
                onConfirm={(date) => {
                  setSelectDate(date);
                  setDatePickerVisible(false);
                }}
              />
            ) : null}
          </View>
        </ThemedView>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: palette.tint + '18' }]}>
            <ThemedText weight="semiBold" style={[styles.statNumber, { color: palette.tint }]}>
              {pendingTasks}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: palette.icon }]}>فعال</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: palette.completedTask + '55' }]}>
            <ThemedText weight="semiBold" style={[styles.statNumber, { color: scheme === 'dark' ? '#F5F3FF' : '#1e1b4b' }]}>
              {completedTasks}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: palette.icon }]}>تمام شده</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: palette.border + '70' }]}>
            <ThemedText weight="semiBold" style={[styles.statNumber, { color: palette.text }]}>
              {tasks.length}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: palette.icon }]}>کل</ThemedText>
          </View>
        </View>
      </View>

      <Button
        onLongPress={openCreateByAi}
        delayLongPress={500}
        title={null}
        variant="primary"
        fullWidth
        icon={<Plus color={palette.background} size={34} />}
        onPress={openCreate}
        style={styles.addButton}
      />

      <FlatList
        data={groupedTasks}
        keyExtractor={(item) => item.hour}
        renderItem={({ item }) => (
          <View
            style={[
              styles.hourCard,
              {
                backgroundColor: palette.surface + 20,
              },
            ]}
          >
            <View style={styles.hourHeader}>
              <View style={[styles.hourPill, { backgroundColor: palette.tint + '22' }]}>
                <ThemedText weight="bold" style={[styles.hourText, { color: palette.tint }]}>
                  {item.hour}
                </ThemedText>
              </View>
              <ThemedText style={styles.taskCount} weight="semiBold">
                {item.tasks.length} فعالیت
              </ThemedText>
            </View>

            <View style={styles.taskList}>
              {item.tasks.map((task, index) => (
                <View key={task.id} style={index > 0 ? styles.taskSpacing : undefined}>
                  <TaskCard
                    task={task}
                    onLongPress={() => handleDelete(task.id)}
                    onPress={() => openEdit(task)}
                    onDelete={() => handleDelete(task.id)}
                    onToggleCompleted={(next) => handleToggleCompleted(task, next)}
                  />
                </View>
              ))}
            </View>
          </View>
        )}
        contentContainerStyle={groupedTasks.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.tint} title="در حال بروزرسانی" />}
        ListEmptyComponent={
          <ThemedView style={styles.emptyState}>
            <ThemedText type="subtitle" style={{ color: Colors.dark.border }}>
              فعالیت‌ای ثبت نشده است
            </ThemedText>
            <ThemedText style={styles.emptyText}>روی دکمه افزودن فعالیت بزنید و اولین فعالیت خود را اضافه کنید.</ThemedText>
          </ThemedView>
        }
      />

      <TaskFormSheet visible={formVisible} onClose={closeForm} task={editingTask ?? undefined} tabKey={sheetKey as any} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  headerCard: {
    gap: 10,
    borderRadius: 20,
    padding: 16,
    marginTop: 4,
    borderWidth: 1,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  headerTopRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
  },
  headerHint: {
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 28,
    lineHeight: 30,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  statCard: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    width: '30%',
    justifyContent: 'center',
    gap: 6,
  },
  statNumber: {
    fontSize: 14,
  },
  statLabel: {
    fontSize: 13,
  },
  listContent: {
    paddingVertical: 12,
    gap: 14,
    paddingBottom: 120,
  },
  emptyContainer: {
    marginTop: 80,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    gap: 4,
  },
  emptyText: {
    opacity: 0.7,
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 60,
    right: 40,
    zIndex: 1000,
    width: 70,
    height: 70,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },
  hourCard: {
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  hourHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hourPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  hourText: {
    letterSpacing: 0.3,
  },
  taskCount: {
    color: '#6b7280',
  },
  taskList: {
    gap: 10,
  },
  taskSpacing: {
    marginTop: 4,
  },

  linkRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  linkText: {
    fontSize: 15,
  },
  datePill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 14,
  },
});
