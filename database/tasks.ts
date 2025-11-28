import { getAll, getFirst, run, touchTimestamp } from '@/database';
import { Task, TaskInput, TaskRow, TaskUpdate } from '@/database/types';
import { validateTaskInput } from '@/utils/validation';
import { todayIso } from '@/utils/date';

const normalizeTask = (row: TaskRow): Task => ({
  ...row,
  description: row.description ?? '',
  repeatDaily: Boolean(row.repeatDaily),
  isCompleted: Boolean(row.isCompleted),
});

const sanitizeTask = (input: TaskInput | TaskUpdate, fallback?: Task) => {
  const base = fallback ?? ({} as Task);
  return {
    title: input.title?.trim() ?? base.title,
    description: (input.description !== undefined ? input.description?.trim() : base.description) ?? '',
    priority: input.priority ?? base.priority ?? 2,
    date: input.date ?? base.date,
    time: input.time ?? base.time,
    repeatDaily: input.repeatDaily !== undefined ? input.repeatDaily : base.repeatDaily,
    isCompleted: input.isCompleted !== undefined ? input.isCompleted : (base.isCompleted ?? false),
  };
};

export const fetchTasks = async (): Promise<Task[]> => {
  const today = todayIso();
  const rows = await getAll<TaskRow>('SELECT * FROM tasks WHERE date = ? ORDER BY date ASC, time ASC, createdAt DESC', [today]);
  return rows.map(normalizeTask);
};

export const fetchTaskById = async (id: number): Promise<Task | null> => {
  const row = await getFirst<TaskRow>('SELECT * FROM tasks WHERE id = ?', [id]);
  return row ? normalizeTask(row) : null;
};

export const createTask = async (input: TaskInput): Promise<Task> => {
  validateTaskInput(input);
  const data = sanitizeTask(input);
  const timestamp = touchTimestamp();

  const result = await run(
    `INSERT INTO tasks (title, description, priority, date, time, repeatDaily, isCompleted, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.title, data.description || null, data.priority, data.date, data.time, data.repeatDaily ?? 0, data.isCompleted ?? 0, timestamp, timestamp]
  );

  const inserted = await getFirst<TaskRow>('SELECT * FROM tasks WHERE id = ?', [result.lastInsertRowId]);

  if (!inserted) {
    throw new Error('ثبت فعالیت با خطا مواجه شد.');
  }

  return normalizeTask(inserted);
};

export const updateTask = async (id: number, changes: TaskUpdate): Promise<Task> => {
  const current = await fetchTaskById(id);
  if (!current) {
    throw new Error('فعالیت پیدا نشد.');
  }

  const next = sanitizeTask(changes, current);
  validateTaskInput(next);
  const timestamp = touchTimestamp();

  await run(
    `UPDATE tasks SET title = ?, description = ?, priority = ?, date = ?, time = ?, repeatDaily = ?, isCompleted = ?, updatedAt = ?
     WHERE id = ?`,
    [next.title, next.description || null, next.priority, next.date, next.time, next.repeatDaily ?? current.repeatDaily, next.isCompleted ?? current.isCompleted, timestamp, id]
  );

  const updated = await fetchTaskById(id);
  if (!updated) {
    throw new Error('به‌روزرسانی فعالیت ناموفق بود.');
  }
  return updated;
};

export const deleteTask = async (id: number) => {
  await run('DELETE FROM tasks WHERE id = ?', [id]);
};

export const toggleTaskRepeat = async (id: number): Promise<Task> => {
  const current = await fetchTaskById(id);
  if (!current) {
    throw new Error('فعالیت پیدا نشد.');
  }
  const nextRepeat = current.repeatDaily ? 0 : 1;
  await run('UPDATE tasks SET repeatDaily = ?, updatedAt = ? WHERE id = ?', [nextRepeat, touchTimestamp(), id]);
  return (await fetchTaskById(id)) as Task;
};

export const toggleTaskCompleted = async (id: number, forceValue?: boolean): Promise<Task> => {
  const current = await fetchTaskById(id);
  if (!current) {
    throw new Error('فعالیت پیدا نشد.');
  }
  const nextCompleted = forceValue !== undefined ? forceValue : !current.isCompleted;
  await run('UPDATE tasks SET isCompleted = ?, updatedAt = ? WHERE id = ?', [nextCompleted ? 1 : 0, touchTimestamp(), id]);
  return (await fetchTaskById(id)) as Task;
};

export const fetchRepeatingTasks = async (): Promise<Task[]> => {
  const rows = await getAll<TaskRow>('SELECT * FROM tasks WHERE repeatDaily = 1');
  return rows.map(normalizeTask);
};

export const cloneTaskForDate = async (task: Task, targetDate: string) => {
  const timestamp = touchTimestamp();
  await run(
    `INSERT INTO tasks (title, description, priority, date, time, repeatDaily, isCompleted, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [task.title, task.description || null, task.priority, targetDate, task.time, task.repeatDaily, 0, timestamp, timestamp]
  );
};
