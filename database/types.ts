export type TaskPriority = 1 | 2 | 3;

export type TaskRow = {
  id: number;
  title: string;
  description: string | null;
  priority: TaskPriority;
  date: string;
  time: string;
  repeatDaily: boolean;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Task = Omit<TaskRow, 'description'> & {
  description: string;
};

export type TaskInput = {
  title: string;
  description?: string;
  priority: TaskPriority;
  date: string;
  time: string;
  repeatDaily: boolean;
  isCompleted?: boolean;
};

export type TaskUpdate = Partial<Omit<TaskInput, 'repeatDaily'>> & {
  repeatDaily?: boolean;
  isCompleted?: boolean;
};

export type ProfileSettings = {
  lastRepeatCheck?: string;
  theme?: 'light' | 'dark' | 'system';
  email?: string;
  age?: number;
};

export type ProfileRow = {
  id: number;
  name: string | null;
  avatar: string | null;
  settingsJson: string | null;
};

export type ProfileInput = {
  name?: string;
  avatar?: string;
  settings?: ProfileSettings;
};

export type Profile = {
  id: number;
  name: string;
  avatar: any;
  settings: ProfileSettings;
};
