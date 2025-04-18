const API_BASE_URL = 'https://taskdrop-render-backend.onrender.com';

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
  private userId = 1; // Временное решение для демонстрации

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
    return this.request<ApiTask[]>(`/tasks?user_id=${this.userId}`);
  }

  // Создание новой задачи
  async createTask(task: Omit<ApiTask, 'id' | 'created_at'>): Promise<ApiTask> {
    const response = await this.request<{ id: string; success: boolean }>('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        user_id: this.userId,
        text: task.title,
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
      created_at: new Date().toISOString()
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
      
      // Создаем новую задачу с обновленными данными
      const newTaskData = {
        ...currentTask,
        ...task,
        user_id: this.userId
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
    // Так как API не предоставляет эндпоинт для получения одной задачи,
    // получаем все задачи и находим нужную
    const tasks = await this.getTasks();
    const task = tasks.find(t => t.id === id);
    
    if (!task) {
      throw new Error(`Task with id ${id} not found`);
    }
    
    return task;
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