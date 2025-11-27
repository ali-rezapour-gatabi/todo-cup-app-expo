import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Plus } from 'lucide-react-native';
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
  const toggleRepeat = useTodoStore((state) => state.toggleRepeat);
  useAppInit();

  const [refreshing, setRefreshing] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  }, [loadTasks]);

  const groupedTasks = useMemo(() => groupTasksByHour(tasks), [tasks]);

  const openCreate = () => {
    setEditingTask(null);
    setFormVisible(true);
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

      <View style={styles.header}>
        <ThemedText type="title">لیست فعالیت ها</ThemedText>
      </View>

      <Button title={null} variant="primary" fullWidth icon={<Plus color={palette.background} size={34} />} onPress={openCreate} style={styles.addButton} />

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
                  <TaskCard task={task} onPress={() => openEdit(task)} onDelete={() => handleDelete(task.id)} onToggleRepeat={() => toggleRepeat(task.id)} />
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

      <TaskFormSheet visible={formVisible} onClose={closeForm} task={editingTask ?? undefined} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  header: {
    gap: 6,
    marginTop: 10,
  },
  subtitle: {
    opacity: 0.8,
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
});
