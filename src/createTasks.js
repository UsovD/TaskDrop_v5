// Скрипт для создания тестовых задач
const API_BASE_URL = 'https://taskdrop-render-backend.onrender.com';
const userId = 1; // Временное решение для демонстрации

// Список тестовых задач для создания
const testTasks = [
  { text: "Подготовить отчет (Срок: 18 апреля)", category: "today" },
  { text: "Созвониться с клиентом (Срок: 19 апреля)", category: "tomorrow" },
  { text: "Купить продукты", category: "inbox" },
  { text: "Оплатить счета (Срок: 22 апреля)", category: "next7days" },
  { text: "Подготовиться к встрече", category: "inbox" }
];

// Функция для создания задачи
async function createTask(taskText) {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        text: taskText
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Задача "${taskText}" успешно создана, ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error(`Ошибка при создании задачи "${taskText}":`, error);
    return null;
  }
}

// Функция для создания всех тестовых задач
async function createTestTasks() {
  console.log('Начинаем создание тестовых задач...');
  
  for (const task of testTasks) {
    await createTask(task.text);
    // Добавляем небольшую задержку между запросами
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('Все тестовые задачи созданы!');
}

// Запускаем создание задач
createTestTasks(); 