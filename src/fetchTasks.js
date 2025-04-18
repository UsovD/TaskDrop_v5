// Скрипт для получения задач из API
const API_BASE_URL = 'https://taskdrop-render-backend.onrender.com';
const userId = 1; // Временное решение для демонстрации

async function fetchTasks() {
  try {
    console.log('Запрос на получение задач...');
    const response = await fetch(`${API_BASE_URL}/tasks?user_id=${userId}`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    const tasks = await response.json();
    console.log('Получено задач:', tasks.length);
    console.log('Список задач:');
    
    // Выводим задачи в виде таблицы
    console.table(tasks.map(task => ({
      id: task.id,
      title: task.title,
      done: task.done,
      created_at: task.created_at
    })));
    
    return tasks;
  } catch (error) {
    console.error('Ошибка при получении задач:', error);
    return [];
  }
}

// Запускаем функцию
fetchTasks(); 