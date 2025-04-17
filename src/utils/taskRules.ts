import { Task, TaskCategory } from '../types/Task';

// Правила для категорий
export const categoryRules = {
  // Проверяет, подходит ли задача для категории "Сегодня"
  isToday: (task: Task): boolean => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDate = new Date(task.createdAt.getFullYear(), task.createdAt.getMonth(), task.createdAt.getDate());
    return taskDate.getTime() === today.getTime();
  },

  // Проверяет, подходит ли задача для категории "Завтра"
  isTomorrow: (task: Task): boolean => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const taskDate = new Date(task.createdAt.getFullYear(), task.createdAt.getMonth(), task.createdAt.getDate());
    return taskDate.getTime() === tomorrow.getTime();
  },

  // Проверяет, входит ли задача в диапазон 7 дней
  isWithinWeek: (task: Task): boolean => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekLater = new Date(today);
    weekLater.setDate(weekLater.getDate() + 7);
    const taskDate = new Date(task.createdAt.getFullYear(), task.createdAt.getMonth(), task.createdAt.getDate());
    return taskDate > today && taskDate <= weekLater;
  }
};

// Функция фильтрации задач по категории
export const filterTasksByCategory = (tasks: Task[], category: TaskCategory): Task[] => {
  const nonCompletedTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  switch (category) {
    case 'inbox':
      return nonCompletedTasks.filter(task => 
        !categoryRules.isToday(task) && 
        !categoryRules.isTomorrow(task) && 
        !categoryRules.isWithinWeek(task)
      );
    
    case 'today':
      return nonCompletedTasks.filter(task => categoryRules.isToday(task));
    
    case 'tomorrow':
      return nonCompletedTasks.filter(task => categoryRules.isTomorrow(task));
    
    case 'week':
      return nonCompletedTasks.filter(task => categoryRules.isWithinWeek(task));
    
    case 'all':
      return nonCompletedTasks;
    
    case 'completed':
      return completedTasks;
    
    default:
      return tasks;
  }
};

// Правила валидации задачи
export const taskValidationRules = {
  title: {
    minLength: 1,
    maxLength: 100,
    validate: (title: string): boolean => {
      return title.length >= 1 && title.length <= 100;
    }
  },
  description: {
    maxLength: 500,
    validate: (description?: string): boolean => {
      if (!description) return true;
      return description.length <= 500;
    }
  },
  dueDate: {
    validate: (dueDate?: Date): boolean => {
      if (!dueDate) return true;
      const now = new Date();
      return dueDate >= now;
    }
  }
};

// Функция для автоматического определения категории задачи
export const determineTaskCategory = (task: Omit<Task, 'category'>): TaskCategory => {
  if (task.completed) return 'completed';
  if (!task.dueDate) return 'inbox';
  
  if (categoryRules.isToday(task as Task)) return 'today';
  if (categoryRules.isTomorrow(task as Task)) return 'tomorrow';
  if (categoryRules.isWithinWeek(task as Task)) return 'week';
  
  return 'all';
}; 