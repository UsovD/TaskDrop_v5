import { Task, TaskCategory, TaskPriority } from '../types/Task';
import { ApiTask } from '../api/client';

// Преобразуем задачу из API в задачу для фронтенда
export const mapApiTaskToTask = (apiTask: ApiTask): Task => {
  const createdAt = new Date(apiTask.created_at);
  
  // Преобразуем строковую дату в объект Date, если она указана
  let dueDate: Date | undefined = undefined;
  if (apiTask.due_date) {
    dueDate = new Date(apiTask.due_date);
  }
  
  // Определяем категорию задачи
  let category: TaskCategory = 'inbox';
  if (dueDate) {
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
  
  // Создаем объект задачи с полями из API
  const task: Task = {
    id: String(apiTask.id),
    title: apiTask.title || '',
    description: apiTask.description || '',
    category: category,
    completed: apiTask.done,
    createdAt: createdAt,
    dueDate: dueDate,
    priority: (apiTask.priority as TaskPriority) || 'medium'
  };
  
  // Добавляем дополнительные поля, если они есть
  if (apiTask.due_time) task.dueTime = apiTask.due_time;
  if (apiTask.notification) task.notification = apiTask.notification;
  if (apiTask.tags) task.tags = apiTask.tags;
  if (apiTask.attachments) task.attachments = apiTask.attachments;
  if (apiTask.notes) task.notes = apiTask.notes;
  if (apiTask.location) task.location = apiTask.location;
  if (apiTask.repeat) task.repeat = apiTask.repeat;
  
  return task;
};

// Преобразуем задачу из фронтенда в задачу для API
export const mapTaskToApiTask = (task: Partial<Task>): Partial<ApiTask> => {
  // Создаем базовый объект задачи для API
  const apiTask: Partial<ApiTask> = {
    title: task.title || '',
    done: task.completed ?? false,
    user_id: 1 // Временное решение
  };
  
  // Добавляем остальные поля, если они есть
  if (task.description) apiTask.description = task.description;
  if (task.dueDate) apiTask.due_date = task.dueDate.toISOString().split('T')[0];
  if (task.dueTime) apiTask.due_time = task.dueTime;
  if (task.notification) apiTask.notification = task.notification;
  if (task.priority) apiTask.priority = task.priority;
  if (task.tags) apiTask.tags = task.tags;
  if (task.attachments) apiTask.attachments = task.attachments;
  if (task.notes) apiTask.notes = task.notes;
  if (task.location) apiTask.location = task.location;
  if (task.repeat) apiTask.repeat = task.repeat;
  
  // Если есть id задачи, добавляем его в apiTask
  if (task.id) {
    apiTask.id = task.id;
  }
  
  return apiTask;
}; 