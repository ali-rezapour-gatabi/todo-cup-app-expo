import { ProfileInput, TaskInput, TaskPriority, TaskUpdate } from '@/database/types';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const isPriority = (value: unknown): value is TaskPriority => value === 1 || value === 2 || value === 3;

export function validateTaskInput(input: TaskInput | TaskUpdate) {
  if (!input.title || input.title.trim().length < 2) {
    throw new Error('عنوان باید حداقل ۲ کاراکتر باشد.');
  }
  if (input.priority !== undefined && !isPriority(input.priority)) {
    throw new Error('اولویت نامعتبر است.');
  }
  if (!input.date || !dateRegex.test(input.date)) {
    throw new Error('تاریخ باید در قالب yyyy-MM-dd باشد.');
  }
  if (!input.time || !timeRegex.test(input.time)) {
    throw new Error('ساعت باید در قالب HH:mm باشد.');
  }
}

export function validateProfileInput(input: ProfileInput) {
  if (input.name !== undefined && input.name.trim().length === 0) {
    throw new Error('نام نمی‌تواند خالی باشد.');
  }
}
