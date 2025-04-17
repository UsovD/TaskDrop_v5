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
    return 'next7days';
  }

  return 'inbox';
};

export const mapApiTaskToTask = (apiTask: ApiTask): Task => {
  const createdAt = new Date(apiTask.created_at);
  
  // Пробуем извлечь дату срока выполнения из текста задачи
  let dueDate: Date | undefined = undefined;
  let category: TaskCategory = 'inbox';
  
  // Проверяем, есть ли в тексте задачи информация о сроке
  const dueDateMatch = apiTask.text.match(/\(Срок: (.+?)\)/);
  if (dueDateMatch && dueDateMatch[1]) {
    try {
      // Пробуем разобрать дату из текста
      const dateParts = dueDateMatch[1].split(' ');
      const day = parseInt(dateParts[0]);
      const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
                          'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
      const month = monthNames.indexOf(dateParts[1].toLowerCase());
      
      if (!isNaN(day) && month !== -1) {
        dueDate = new Date();
        dueDate.setDate(day);
        dueDate.setMonth(month);
        
        // Определяем категорию на основе срока
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const weekLater = new Date(today);
        weekLater.setDate(weekLater.getDate() + 7);
        
        const dueDateNoTime = new Date(dueDate);
        dueDateNoTime.setHours(0, 0, 0, 0);
        
        if (dueDateNoTime.getTime() === today.getTime()) {
          category = 'today';
        } else if (dueDateNoTime.getTime() === tomorrow.getTime()) {
          category = 'tomorrow';
        } else if (dueDateNoTime > today && dueDateNoTime <= weekLater) {
          category = 'next7days';
        }
      }
    } catch (error) {
      console.error('Ошибка при парсинге даты:', error);
    }
  }
  
  // Извлекаем чистый текст задачи без информации о сроке
  const taskText = apiTask.text.replace(/\s*\(Срок: .+?\)/, '');
  
  return {
    id: String(apiTask.id),
    title: taskText,
    description: '',
    category: category,
    completed: apiTask.done,
    createdAt: createdAt,
    dueDate: dueDate,
    priority: 'medium'
  };
};

export const mapTaskToApiTask = (task: Omit<Task, 'id' | 'createdAt'>): Omit<ApiTask, 'id' | 'created_at'> => {
  // Формируем текст с информацией о дате и времени, если они есть
  let taskText = task.title;
  
  if (task.dueDate) {
    const formattedDate = task.dueDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long'
    });
    taskText = `${taskText} (Срок: ${formattedDate})`;
  }
  
  return {
    text: taskText,
    done: task.completed,
    user_id: 1 // Временное решение
  };
}; 