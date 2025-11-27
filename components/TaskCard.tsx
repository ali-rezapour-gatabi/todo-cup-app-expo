import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { TimerIcon } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Task } from '@/database/types';
import { Checkbox } from './ui/check-box';

type Props = {
  task: Task;
  onPress?: () => void;
  onDelete?: () => void;
  onToggleRepeat?: () => void;
  onToggleCompleted?: (next: boolean) => void;
};

const priorityColor: Record<Task['priority'], string> = {
  1: '#10B981',
  2: '#F59E0B',
  3: '#EF4444',
};

const TaskCardComponent = ({ task, onPress, onToggleCompleted }: Props) => {
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];

  const completed = task.isCompleted;

  return (
    <View style={{ display: 'flex', flexDirection: 'row-reverse', overflow: 'hidden' }}>
      <Checkbox value={completed} onChange={onToggleCompleted} style={{ width: 35, height: 35, marginLeft: 5 }} />
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.container,
          {
            backgroundColor: palette.surface,
            borderColor: priorityColor[task.priority],
            opacity: completed ? 0.7 : 1,
          },
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <ThemedText style={[completed && styles.completedText]} weight="bold">
              {task.title}
            </ThemedText>
          </View>
        </View>

        {task.description ? <ThemedText style={[styles.description, completed && styles.completedText]}>{task.description}</ThemedText> : null}

        <View style={styles.footer}>
          <View style={styles.meta}>
            <ThemedText style={[styles.metaText, completed && styles.completedText, { paddingTop: 4 }]}>{task.time}</ThemedText>
            <TimerIcon size={17} color={palette.icon} />
          </View>
        </View>
      </Pressable>
    </View>
  );
};

TaskCardComponent.displayName = 'TaskCard';

export const TaskCard = memo(TaskCardComponent, (prev, next) => prev.task === next.task);

const styles = StyleSheet.create({
  container: {
    width: '85%',
    borderWidth: 1,
    borderStartEndRadius: 14,
    borderEndEndRadius: 14,
    borderStartStartRadius: 14,
    padding: 14,
    gap: 10,
  },
  pressed: {
    transform: [{ scale: 0.995 }],
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  description: {
    opacity: 0.8,
    lineHeight: 22,
  },
  priorityText: {
    color: '#6b7280',
  },
  footer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  metaText: {
    color: '#6b7280',
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.65,
  },
  actions: {
    flexDirection: 'row-reverse',
    gap: 8,
    alignItems: 'center',
  },
  iconButton: {
    padding: 6,
    borderRadius: 10,
  },
});
