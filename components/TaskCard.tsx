import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { PenLine, RefreshCcw, TimerIcon, Trash2 } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Task } from '@/database/types';

type Props = {
  task: Task;
  onPress?: () => void;
  onDelete?: () => void;
  onToggleRepeat?: () => void;
};

const priorityColor: Record<Task['priority'], string> = {
  1: '#10B981',
  2: '#F59E0B',
  3: '#EF4444',
};

const TaskCardComponent = ({ task, onPress, onDelete, onToggleRepeat }: Props) => {
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.container, { backgroundColor: palette.surface, borderColor: palette.border }, pressed && styles.pressed]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.priorityDot, { backgroundColor: priorityColor[task.priority] }]} />
          <ThemedText style={styles.title} weight="bold">
            {task.title}
          </ThemedText>
        </View>
      </View>

      {task.description ? <ThemedText style={styles.description}>{task.description}</ThemedText> : null}

      <View style={styles.footer}>
        <View style={styles.meta}>
          <TimerIcon size={16} color={palette.icon} />
          <ThemedText style={styles.metaText}>{task.time}</ThemedText>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={onToggleRepeat} style={styles.iconButton}>
            <RefreshCcw size={18} color={task.repeatDaily ? palette.tint : palette.icon} />
          </Pressable>
          <Pressable onPress={onPress} style={styles.iconButton}>
            <PenLine size={18} color={palette.icon} />
          </Pressable>
          <Pressable onPress={onDelete} style={styles.iconButton}>
            <Trash2 size={18} color="#ef4444" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

TaskCardComponent.displayName = 'TaskCard';

export const TaskCard = memo(TaskCardComponent, (prev, next) => prev.task === next.task);

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  pressed: {
    transform: [{ scale: 0.995 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  title: {},
  description: {
    opacity: 0.8,
    lineHeight: 22,
  },
  priorityText: {
    color: '#6b7280',
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#6b7280',
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
