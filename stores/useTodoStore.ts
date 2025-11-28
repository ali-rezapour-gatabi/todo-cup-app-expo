import { create } from 'zustand';

import { initializeDatabase } from '@/database';
import { fetchProfile, upsertProfile } from '@/database/profile';
import { createTask, deleteTask as deleteTaskDb, fetchTasks, toggleTaskCompleted, toggleTaskRepeat, updateTask as updateTaskDb } from '@/database/tasks';
import { Profile, ProfileInput, Task, TaskInput, TaskUpdate } from '@/database/types';
import { runDailyRepeat, RepeatCheckResult } from '@/utils/repeatDaily';

type TodoStore = {
  tasks: Task[];
  profile: Profile | null;
  initialized: boolean;
  theme: 'light' | 'dark' | 'system';
  loadTasks: () => Promise<Task[]>;
  addTask: (input: TaskInput) => Promise<Task>;
  updateTask: (id: number, changes: TaskUpdate) => Promise<Task>;
  deleteTask: (id: number) => Promise<void>;
  toggleRepeat: (id: number) => Promise<Task>;
  toggleCompleted: (id: number, value?: boolean) => Promise<Task>;
  runDailyRepeatCheck: () => Promise<RepeatCheckResult>;
  loadProfile: () => Promise<Profile>;
  saveProfile: (input: ProfileInput) => Promise<Profile>;
  setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
};

export const useTodoStore = create<TodoStore>((set, get) => ({
  tasks: [],
  profile: null,
  initialized: false,
  theme: 'system',

  setTheme: async (theme) => {
    set({ theme });
    const profile = get().profile ?? (await get().loadProfile());
    const newProfile = { ...profile, settings: { ...profile.settings, theme } };
    await upsertProfile(newProfile);
    set({ profile: newProfile as Profile });
  },

  loadTasks: async () => {
    await initializeDatabase();
    const tasks = await fetchTasks();
    set({ tasks, initialized: true });
    return tasks;
  },

  addTask: async (input) => {
    const task = await createTask(input);
    set((state) => ({ tasks: [task, ...state.tasks] }));
    return task;
  },

  updateTask: async (id, changes) => {
    const updated = await updateTaskDb(id, changes);
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === id ? updated : task)),
    }));
    return updated;
  },

  deleteTask: async (id) => {
    await deleteTaskDb(id);
    set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) }));
  },

  toggleRepeat: async (id) => {
    const updated = await toggleTaskRepeat(id);
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === id ? updated : task)),
    }));
    return updated;
  },

  toggleCompleted: async (id, value) => {
    const updated = await toggleTaskCompleted(id, value);
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === id ? updated : task)),
    }));
    return updated;
  },

  loadProfile: async () => {
    await initializeDatabase();
    const existing = await fetchProfile();
    if (existing) {
      set({ profile: existing });
      if (existing.settings?.theme) {
        set({ theme: existing.settings.theme });
      }
      return existing;
    }
    const created = await upsertProfile({ name: 'کاربر', settings: { theme: 'system' } });
    set({ profile: created, theme: 'system' });
    return created;
  },

  saveProfile: async (input) => {
    const profile = await upsertProfile(input);
    set({ profile });
    return profile;
  },

  runDailyRepeatCheck: async () => {
    const profile = get().profile ?? (await get().loadProfile());
    const lastCheck = profile?.settings?.lastRepeatCheck;
    const result = await runDailyRepeat(lastCheck);
    if (result.created > 0 || !get().initialized) {
      await get().loadTasks();
    }
    if (result.lastChecked !== lastCheck && profile) {
      const updatedProfile = await upsertProfile({
        name: profile.name,
        avatar: profile.avatar ?? undefined,
        settings: { ...profile.settings, lastRepeatCheck: result.lastChecked },
      });
      set({ profile: updatedProfile });
    }
    return result;
  },
}));
