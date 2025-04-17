import { Task, TaskCategory } from '../types/Task';
import { ApiTask } from '../api/client';

// Функция для определения категории задачи на основе даты
const determineTaskCategory = (createdAt: Date): TaskCategory => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekLater = new Date(today);
  weekLater.setDate(weekLater.getDate() + 7);

  const taskDate = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate());

  if (taskDate.getTime() === today.getTime()) {
    return 'today';
  } else if (taskDate.getTime() === tomorrow.getTime()) {
    return 'tomorrow';
  } else if (taskDate > today && taskDate <= weekLater) {
    return 'week';
  }

  return 'inbox';
};

export const mapApiTaskToTask = (apiTask: ApiTask): Task => {
  const createdAt = new Date(apiTask.created_at);
  
  return {
    id: String(apiTask.id),
    title: apiTask.text,
    description: '',
    category: determineTaskCategory(createdAt),
    completed: apiTask.done,
    createdAt: createdAt,
    dueDate: undefined,
    priority: 'medium'
  };
};

export const mapTaskToApiTask = (task: Omit<Task, 'id' | 'createdAt'>): Omit<ApiTask, 'id' | 'created_at'> => ({
  text: task.title,
  done: task.completed,
  user_id: 1 // Временное решение
}); 