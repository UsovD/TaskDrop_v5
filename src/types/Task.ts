import type { LucideIcon } from 'lucide-react';
import type { ComponentType } from 'react';

export type TaskCategory = 'all' | 'inbox' | 'today' | 'tomorrow' | 'next7days' | 'completed';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority?: TaskPriority;
  completed: boolean;
  createdAt: Date;
  dueDate?: Date;
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