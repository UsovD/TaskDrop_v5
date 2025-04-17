const API_BASE_URL = 'https://taskdrop-render-backend.onrender.com';

export interface ApiTask {
  id: number;
  user_id: number;
  text: string;
  done: boolean;
  created_at: string;
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
    const response = await this.request<{ id: number; success: boolean }>('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        user_id: this.userId,
        text: task.text,
      }),
    });

    // Создаем объект задачи из полученного ответа
    return {
      id: response.id,
      user_id: this.userId,
      text: task.text,
      done: false,
      created_at: new Date().toISOString()
    };
  }

  // Обновление задачи
  async updateTask(id: number, task: { done: boolean }): Promise<ApiTask> {
    return this.request<ApiTask>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ done: task.done }),
    });
  }

  // Удаление задачи
  async deleteTask(id: number): Promise<void> {
    await this.request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Изменение статуса задачи
  async toggleTaskComplete(id: number, done: boolean): Promise<ApiTask> {
    return this.updateTask(id, { done });
  }
}

export const apiClient = new ApiClient(); 