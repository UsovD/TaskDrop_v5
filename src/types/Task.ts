import type { ComponentType } from 'react';

export type TaskCategory = 'inbox' | 'today' | 'tomorrow' | 'next7days' | 'all' | 'completed';

export type TaskPriority = 'low' | 'medium' | 'high';

// Тип для уведомлений
export type NotificationType = 
  | 'За 5 минут'
  | 'За 10 минут'
  | 'За 15 минут'
  | 'За 30 минут'
  | 'За 1 час'
  | 'За 2 часа'
  | 'За день'
  | string;  // Для возможности добавления пользовательских уведомлений

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  completed: boolean;
  createdAt: Date;
  dueDate?: Date;
  dueTime?: string;          // Время выполнения в формате "HH:MM"
  notification?: string;
  priority: TaskPriority;
  tags?: string[];           // Теги для задачи
  attachments?: string[];    // URL или идентификаторы прикрепленных файлов
  notes?: string;            // Дополнительные заметки
  location?: string;         // Место выполнения задачи
  repeat?: string;           // Повторение задачи (ежедневно, еженедельно и т.д.)
  userId?: number;           // ID пользователя-владельца задачи
}

export interface CategoryInfo {
  id: TaskCategory;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

export interface TaskState {
  tasks: Task[];
  currentCategory: TaskCategory;
} 