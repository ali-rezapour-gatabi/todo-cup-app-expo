import { getDb } from '@/database';
import { fetchRepeatingTasks } from '@/database/tasks';
import { nowIso, todayIso, tomorrowIso } from '@/utils/date';

export type RepeatCheckResult = {
  created: number;
  lastChecked: string;
};

export const runDailyRepeat = async (lastRepeatCheck?: string): Promise<RepeatCheckResult> => {
  const today = todayIso();
  if (lastRepeatCheck === today) {
    return { created: 0, lastChecked: today };
  }

  const repeatingTasks = await fetchRepeatingTasks();
  if (!repeatingTasks.length) {
    return { created: 0, lastChecked: today };
  }

  const db = await getDb();
  const tomorrow = tomorrowIso();
  const timestamp = nowIso();
  let created = 0;

  await db.withTransactionAsync(async () => {
    for (const task of repeatingTasks) {
      const existing = await db.getFirstAsync<{ id: number }>('SELECT id FROM tasks WHERE title = ? AND date = ? AND time = ?', [task.title, tomorrow, task.time]);
      if (existing) continue;

      await db.runAsync(
        `INSERT INTO tasks (title, description, priority, date, time, repeatDaily, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [task.title, task.description || null, task.priority, tomorrow, task.time, task.repeatDaily, timestamp, timestamp]
      );
      created += 1;
    }
  });

  return { created, lastChecked: today };
};
