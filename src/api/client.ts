const API_BASE_URL = 'https://taskdrop-render-backend.onrender.com';
import { getUserData } from '../utils/userHelper';

// Интерфейс для API задачи (используем обновленный формат сервера)
export interface ApiTask {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  created_at: string;
  priority: string;
  due_date?: string;
  due_time?: string;
  notification?: string;
  tags?: string[];
  attachments?: string[];
  notes?: string;
  location?: string;
  repeat?: string;
  user_id?: number;
}

class ApiClient {
  private userId: number | null = null;

  // Метод для получения ID пользователя
  private async getUserId(): Promise<number> {
    if (this.userId !== null && this.userId > 0) {
      return this.userId;
    }

    try {
      const userData = await getUserData();
      
      // Проверяем, что получен корректный ID (не равный 0)
      if (userData.id && userData.id > 0) {
        this.userId = userData.id;
        console.log('Получен ID пользователя:', this.userId);
        
        // Сохраняем ID в localStorage для резервного использования
        try {
          localStorage.setItem('user_telegram_id', String(this.userId));
        } catch (e) {
          console.warn('Не удалось сохранить ID в localStorage:', e);
        }
        
        return this.userId;
      } else {
        console.warn('Получен некорректный ID пользователя (равен 0 или пустой):', userData.id);
        throw new Error('Invalid user ID');
      }
    } catch (error) {
      console.error('Ошибка при получении ID пользователя:', error);
      
      // Пытаемся восстановить ID из localStorage
      try {
        const savedId = localStorage.getItem('user_telegram_id');
        if (savedId) {
          const parsedId = parseInt(savedId, 10);
          if (!isNaN(parsedId) && parsedId > 0) {
            console.log('Восстановлен ID пользователя из localStorage:', parsedId);
            this.userId = parsedId;
            return parsedId;
          }
        }
      } catch (e) {
        console.warn('Не удалось получить ID из localStorage:', e);
      }
      
      // Используем фиксированный ID по умолчанию
      const defaultId = 1;
      console.warn('Используем ID пользователя по умолчанию:', defaultId);
      this.userId = defaultId;
      return defaultId;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      console.log('API Request:', {
        url: `${API_BASE_URL}${endpoint}`,
        method: options.method || 'GET',
        body: options.body ? JSON.parse(options.body as string) : undefined
      });

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData.message || `API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Success Response:', data);
      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Получение всех задач
  async getTasks(): Promise<ApiTask[]> {
    const userId = await this.getUserId();
    return this.request<ApiTask[]>(`/tasks?user_id=${userId}`);
  }

  // Получение всех задач пользователя, включая задачи с ID=0 и ID=1
  async getAllUserTasks(): Promise<ApiTask[]> {
    try {
      const userId = await this.getUserId();
      console.log('Запрашиваем задачи для пользователя с ID:', userId);
      
      // Создаем массив для всех задач
      let allTasks: ApiTask[] = [];
      
      // Запрашиваем задачи по текущему ID пользователя
      try {
        const userTasks = await this.request<ApiTask[]>(`/tasks?user_id=${userId}`);
        console.log(`Найдено ${userTasks.length} задач с user_id=${userId}`);
        allTasks = [...allTasks, ...userTasks];
      } catch (e) {
        console.warn(`Не удалось загрузить задачи для user_id=${userId}:`, e);
      }
      
      // Если ID пользователя не равен 0, проверяем задачи с user_id=0
      if (userId !== 0) {
        try {
          const zeroTasks = await this.request<ApiTask[]>(`/tasks?user_id=0`);
          if (zeroTasks && zeroTasks.length > 0) {
            console.log(`Найдено ${zeroTasks.length} задач с user_id=0`);
            allTasks = [...allTasks, ...zeroTasks];
          }
        } catch (e) {
          console.warn("Не удалось загрузить задачи с user_id=0:", e);
        }
      }
      
      // Если ID пользователя не равен 1, проверяем задачи с user_id=1
      if (userId !== 1) {
        try {
          const legacyTasks = await this.request<ApiTask[]>(`/tasks?user_id=1`);
          if (legacyTasks && legacyTasks.length > 0) {
            console.log(`Найдено ${legacyTasks.length} задач с user_id=1`);
            allTasks = [...allTasks, ...legacyTasks];
          }
        } catch (e) {
          console.warn("Не удалось загрузить задачи с user_id=1:", e);
        }
      }
      
      // Выводим итоговое количество загруженных задач
      console.log(`Всего загружено ${allTasks.length} задач`);
      
      // Удаляем возможные дубликаты (по id)
      const uniqueTasks = [...new Map(allTasks.map(task => 
        [task.id, task]
      )).values()];
      
      if (uniqueTasks.length < allTasks.length) {
        console.log(`Удалено ${allTasks.length - uniqueTasks.length} дубликатов задач`);
      }
      
      return uniqueTasks;
    } catch (error) {
      console.error("Ошибка при получении задач:", error);
      throw error;
    }
  }

  // Создание новой задачи
  async createTask(task: Omit<ApiTask, 'id' | 'created_at'>): Promise<ApiTask> {
    const userId = await this.getUserId();
    
    // Гарантируем, что ID пользователя не равен 0
    const safeUserId = userId === 0 ? 1 : userId;
    console.log('Создание задачи для пользователя с ID:', safeUserId);
    
    const response = await this.request<{ id: string; success: boolean }>('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        user_id: safeUserId,
        title: task.title,
        description: task.description,
        due_date: task.due_date,
        due_time: task.due_time,
        notification: task.notification,
        priority: task.priority,
        tags: task.tags,
        attachments: task.attachments,
        notes: task.notes,
        location: task.location,
        repeat: task.repeat,
        completed: task.done || false
      }),
    });

    // Возвращаем объект задачи, объединяя входные данные и полученный ID
    return {
      id: response.id,
      title: task.title,
      description: task.description,
      due_date: task.due_date,
      due_time: task.due_time,
      notification: task.notification,
      priority: task.priority,
      tags: task.tags,
      attachments: task.attachments,
      notes: task.notes,
      location: task.location,
      repeat: task.repeat,
      done: task.done || false,
      created_at: new Date().toISOString(),
      user_id: safeUserId
    };
  }

  // Обновление задачи
  async updateTask(id: string, task: Partial<Omit<ApiTask, 'id' | 'created_at'>>): Promise<ApiTask> {
    console.log('Отправка запроса на обновление задачи:', { id, task });
    
    // Формируем объект для обновления, включая все поля, кроме id и created_at
    const updateData = { ...task };
    
    console.log('Отправляемые данные:', updateData);
    
    try {
      // Отправляем запрос на обновление задачи
      return await this.request<ApiTask>(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    } catch (error) {
      // Если обновление не работает (возможно, сервер принимает только поле completed),
      // используем запасной вариант - создаем новую задачу и удаляем старую
      console.warn('Ошибка при обновлении задачи, используем запасной вариант:', error);
      
      // Получаем текущую задачу, чтобы иметь все поля
      const currentTask = await this.getTask(id);
      
      // Получаем ID пользователя
      const userId = await this.getUserId();
      // Гарантируем, что ID пользователя не равен 0
      const safeUserId = userId === 0 ? 1 : userId;
      
      // Создаем новую задачу с обновленными данными
      const newTaskData = {
        ...currentTask,
        ...task,
        user_id: safeUserId
      };
      
      // Создаем новый объект без id и created_at
      const { id: _, created_at: __, ...taskDataToCreate } = newTaskData;
      
      const newTask = await this.createTask(taskDataToCreate);
      
      // Удаляем старую задачу
      await this.deleteTask(id);
      
      return newTask;
    }
  }

  // Получение одной задачи по ID
  async getTask(id: string): Promise<ApiTask> {
    try {
      // Сначала пробуем прямой запрос к API для получения конкретной задачи
      console.log(`Выполняется прямой запрос для получения задачи по ID: ${id}`);
      const task = await this.request<ApiTask>(`/tasks/${id}`);
      return task;
    } catch (error) {
      console.warn(`Ошибка при прямом запросе задачи по ID ${id}, пробуем получить из списка всех задач:`, error);
      
      // Если прямой запрос не сработал, получаем все задачи и находим нужную
      const tasks = await this.getTasks();
      console.log(`Ищем задачу с ID ${id} в списке из ${tasks.length} задач`);
      
      // Преобразуем все ID в строки для надежного сравнения
      const task = tasks.find(t => String(t.id) === String(id));
      
      if (!task) {
        console.error(`Задача с ID ${id} не найдена ни прямым запросом, ни в списке задач`);
        throw new Error(`Task with id ${id} not found`);
      }
      
      return task;
    }
  }

  // Удаление задачи
  async deleteTask(id: string): Promise<void> {
    await this.request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Изменение статуса задачи
  async toggleTaskComplete(id: string, completed: boolean): Promise<ApiTask> {
    return this.updateTask(id, { done: completed });
  }
}

export const apiClient = new ApiClient(); 
