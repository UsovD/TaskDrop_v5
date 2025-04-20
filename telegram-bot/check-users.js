const axios = require('axios');

// Конфигурация
const apiUrl = 'https://taskdrop-render-backend.onrender.com';
const telegramId = 25278733; // Ваш Telegram ID

async function main() {
  console.log('⏳ Проверка задач в базе данных...');
  
  try {
    // 1. Проверяем задачи пользователя с Telegram ID
    console.log(`\n1️⃣ Проверяем задачи пользователя с Telegram ID = ${telegramId}:`);
    const userTasksResponse = await axios.get(`${apiUrl}/tasks?user_id=${telegramId}`);
    const userTasks = userTasksResponse.data;
    
    console.log(`Найдено ${userTasks.length} задач:`);
    userTasks.forEach(task => {
      console.log(`  - ID ${task.id}: "${task.title}" (user_id: ${task.user_id})`);
    });
    
    // 2. Проверяем задачи пользователя с ID = 1
    console.log(`\n2️⃣ Проверяем задачи пользователя с ID = 1:`);
    const legacyTasksResponse = await axios.get(`${apiUrl}/tasks?user_id=1`);
    const legacyTasks = legacyTasksResponse.data;
    
    console.log(`Найдено ${legacyTasks.length} задач:`);
    legacyTasks.forEach(task => {
      console.log(`  - ID ${task.id}: "${task.title}" (user_id: ${task.user_id})`);
    });
    
    // 3. Проверяем задачи пользователя с ID = 0
    console.log(`\n3️⃣ Проверяем задачи пользователя с ID = 0:`);
    const zeroTasksResponse = await axios.get(`${apiUrl}/tasks?user_id=0`);
    const zeroTasks = zeroTasksResponse.data;
    
    console.log(`Найдено ${zeroTasks.length} задач:`);
    zeroTasks.forEach(task => {
      console.log(`  - ID ${task.id}: "${task.title}" (user_id: ${task.user_id})`);
    });
    
    // 4. Добавляем информацию о других пользователях (перебираем ID от 2 до 10)
    console.log(`\n4️⃣ Проверяем задачи других пользователей (ID от 2 до 10):`);
    for (let id = 2; id <= 10; id++) {
      const otherTasksResponse = await axios.get(`${apiUrl}/tasks?user_id=${id}`);
      const otherTasks = otherTasksResponse.data;
      
      if (otherTasks.length > 0) {
        console.log(`Пользователь ${id}: найдено ${otherTasks.length} задач`);
        otherTasks.forEach(task => {
          console.log(`  - ID ${task.id}: "${task.title}" (user_id: ${task.user_id})`);
        });
      }
    }
    
    // 5. Решение проблемы: предлагаем обновить user_id для задач
    console.log(`\n5️⃣ Возможное решение проблемы:`);
    
    if (legacyTasks.length > 0) {
      console.log(`\nДля переноса задач с user_id=1 на ваш Telegram ID ${telegramId}, выполните следующие команды:\n`);
      
      legacyTasks.forEach(task => {
        console.log(`curl -X PUT "${apiUrl}/tasks/${task.id}" -H "Content-Type: application/json" -d '{"user_id": ${telegramId}}'`);
      });
    }
    
    if (zeroTasks.length > 0) {
      console.log(`\nДля переноса задач с user_id=0 на ваш Telegram ID ${telegramId}, выполните следующие команды:\n`);
      
      zeroTasks.forEach(task => {
        console.log(`curl -X PUT "${apiUrl}/tasks/${task.id}" -H "Content-Type: application/json" -d '{"user_id": ${telegramId}}'`);
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке задач:', error.message);
    if (error.response) {
      console.error('Данные ответа:', error.response.data);
    }
  }
}

main().catch(console.error); 

// Конфигурация
const apiUrl = 'https://taskdrop-render-backend.onrender.com';
const telegramId = 25278733; // Ваш Telegram ID

async function main() {
  console.log('⏳ Проверка задач в базе данных...');
  
  try {
    // 1. Проверяем задачи пользователя с Telegram ID
    console.log(`\n1️⃣ Проверяем задачи пользователя с Telegram ID = ${telegramId}:`);
    const userTasksResponse = await axios.get(`${apiUrl}/tasks?user_id=${telegramId}`);
    const userTasks = userTasksResponse.data;
    
    console.log(`Найдено ${userTasks.length} задач:`);
    userTasks.forEach(task => {
      console.log(`  - ID ${task.id}: "${task.title}" (user_id: ${task.user_id})`);
    });
    
    // 2. Проверяем задачи пользователя с ID = 1
    console.log(`\n2️⃣ Проверяем задачи пользователя с ID = 1:`);
    const legacyTasksResponse = await axios.get(`${apiUrl}/tasks?user_id=1`);
    const legacyTasks = legacyTasksResponse.data;
    
    console.log(`Найдено ${legacyTasks.length} задач:`);
    legacyTasks.forEach(task => {
      console.log(`  - ID ${task.id}: "${task.title}" (user_id: ${task.user_id})`);
    });
    
    // 3. Проверяем задачи пользователя с ID = 0
    console.log(`\n3️⃣ Проверяем задачи пользователя с ID = 0:`);
    const zeroTasksResponse = await axios.get(`${apiUrl}/tasks?user_id=0`);
    const zeroTasks = zeroTasksResponse.data;
    
    console.log(`Найдено ${zeroTasks.length} задач:`);
    zeroTasks.forEach(task => {
      console.log(`  - ID ${task.id}: "${task.title}" (user_id: ${task.user_id})`);
    });
    
    // 4. Добавляем информацию о других пользователях (перебираем ID от 2 до 10)
    console.log(`\n4️⃣ Проверяем задачи других пользователей (ID от 2 до 10):`);
    for (let id = 2; id <= 10; id++) {
      const otherTasksResponse = await axios.get(`${apiUrl}/tasks?user_id=${id}`);
      const otherTasks = otherTasksResponse.data;
      
      if (otherTasks.length > 0) {
        console.log(`Пользователь ${id}: найдено ${otherTasks.length} задач`);
        otherTasks.forEach(task => {
          console.log(`  - ID ${task.id}: "${task.title}" (user_id: ${task.user_id})`);
        });
      }
    }
    
    // 5. Решение проблемы: предлагаем обновить user_id для задач
    console.log(`\n5️⃣ Возможное решение проблемы:`);
    
    if (legacyTasks.length > 0) {
      console.log(`\nДля переноса задач с user_id=1 на ваш Telegram ID ${telegramId}, выполните следующие команды:\n`);
      
      legacyTasks.forEach(task => {
        console.log(`curl -X PUT "${apiUrl}/tasks/${task.id}" -H "Content-Type: application/json" -d '{"user_id": ${telegramId}}'`);
      });
    }
    
    if (zeroTasks.length > 0) {
      console.log(`\nДля переноса задач с user_id=0 на ваш Telegram ID ${telegramId}, выполните следующие команды:\n`);
      
      zeroTasks.forEach(task => {
        console.log(`curl -X PUT "${apiUrl}/tasks/${task.id}" -H "Content-Type: application/json" -d '{"user_id": ${telegramId}}'`);
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке задач:', error.message);
    if (error.response) {
      console.error('Данные ответа:', error.response.data);
    }
  }
}

main().catch(console.error); 

// Конфигурация
const apiUrl = 'https://taskdrop-render-backend.onrender.com';
const telegramId = 25278733; // Ваш Telegram ID

async function main() {
  console.log('⏳ Проверка задач в базе данных...');
  
  try {
    // 1. Проверяем задачи пользователя с Telegram ID
    console.log(`\n1️⃣ Проверяем задачи пользователя с Telegram ID = ${telegramId}:`);
    const userTasksResponse = await axios.get(`${apiUrl}/tasks?user_id=${telegramId}`);
    const userTasks = userTasksResponse.data;
    
    console.log(`Найдено ${userTasks.length} задач:`);
    userTasks.forEach(task => {
      console.log(`  - ID ${task.id}: "${task.title}" (user_id: ${task.user_id})`);
    });
    
    // 2. Проверяем задачи пользователя с ID = 1
    console.log(`\n2️⃣ Проверяем задачи пользователя с ID = 1:`);
    const legacyTasksResponse = await axios.get(`${apiUrl}/tasks?user_id=1`);
    const legacyTasks = legacyTasksResponse.data;
    
    console.log(`Найдено ${legacyTasks.length} задач:`);
    legacyTasks.forEach(task => {
      console.log(`  - ID ${task.id}: "${task.title}" (user_id: ${task.user_id})`);
    });
    
    // 3. Проверяем задачи пользователя с ID = 0
    console.log(`\n3️⃣ Проверяем задачи пользователя с ID = 0:`);
    const zeroTasksResponse = await axios.get(`${apiUrl}/tasks?user_id=0`);
    const zeroTasks = zeroTasksResponse.data;
    
    console.log(`Найдено ${zeroTasks.length} задач:`);
    zeroTasks.forEach(task => {
      console.log(`  - ID ${task.id}: "${task.title}" (user_id: ${task.user_id})`);
    });
    
    // 4. Добавляем информацию о других пользователях (перебираем ID от 2 до 10)
    console.log(`\n4️⃣ Проверяем задачи других пользователей (ID от 2 до 10):`);
    for (let id = 2; id <= 10; id++) {
      const otherTasksResponse = await axios.get(`${apiUrl}/tasks?user_id=${id}`);
      const otherTasks = otherTasksResponse.data;
      
      if (otherTasks.length > 0) {
        console.log(`Пользователь ${id}: найдено ${otherTasks.length} задач`);
        otherTasks.forEach(task => {
          console.log(`  - ID ${task.id}: "${task.title}" (user_id: ${task.user_id})`);
        });
      }
    }
    
    // 5. Решение проблемы: предлагаем обновить user_id для задач
    console.log(`\n5️⃣ Возможное решение проблемы:`);
    
    if (legacyTasks.length > 0) {
      console.log(`\nДля переноса задач с user_id=1 на ваш Telegram ID ${telegramId}, выполните следующие команды:\n`);
      
      legacyTasks.forEach(task => {
        console.log(`curl -X PUT "${apiUrl}/tasks/${task.id}" -H "Content-Type: application/json" -d '{"user_id": ${telegramId}}'`);
      });
    }
    
    if (zeroTasks.length > 0) {
      console.log(`\nДля переноса задач с user_id=0 на ваш Telegram ID ${telegramId}, выполните следующие команды:\n`);
      
      zeroTasks.forEach(task => {
        console.log(`curl -X PUT "${apiUrl}/tasks/${task.id}" -H "Content-Type: application/json" -d '{"user_id": ${telegramId}}'`);
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке задач:', error.message);
    if (error.response) {
      console.error('Данные ответа:', error.response.data);
    }
  }
}

main().catch(console.error); 

// Конфигурация
const apiUrl = 'https://taskdrop-render-backend.onrender.com';
const telegramId = 25278733; // Ваш Telegram ID

async function main() {
  console.log('⏳ Проверка задач в базе данных...');
  
  try {
    // 1. Проверяем задачи пользователя с Telegram ID
    console.log(`\n1️⃣ Проверяем задачи пользователя с Telegram ID = ${telegramId}:`);
    const userTasksResponse = await axios.get(`${apiUrl}/tasks?user_id=${telegramId}`);
    const userTasks = userTasksResponse.data;
    
    console.log(`Найдено ${userTasks.length} задач:`);
    userTasks.forEach(task => {
      console.log(`  - ID ${task.id}: "${task.title}" (user_id: ${task.user_id})`);
    });
    
    // 2. Проверяем задачи пользователя с ID = 1
    console.log(`\n2️⃣ Проверяем задачи пользователя с ID = 1:`);
    const legacyTasksResponse = await axios.get(`${apiUrl}/tasks?user_id=1`);
    const legacyTasks = legacyTasksResponse.data;
    
    console.log(`Найдено ${legacyTasks.length} задач:`);
    legacyTasks.forEach(task => {
      console.log(`  - ID ${task.id}: "${task.title}" (user_id: ${task.user_id})`);
    });
    
    // 3. Проверяем задачи пользователя с ID = 0
    console.log(`\n3️⃣ Проверяем задачи пользователя с ID = 0:`);
    const zeroTasksResponse = await axios.get(`${apiUrl}/tasks?user_id=0`);
    const zeroTasks = zeroTasksResponse.data;
    
    console.log(`Найдено ${zeroTasks.length} задач:`);
    zeroTasks.forEach(task => {
      console.log(`  - ID ${task.id}: "${task.title}" (user_id: ${task.user_id})`);
    });
    
    // 4. Добавляем информацию о других пользователях (перебираем ID от 2 до 10)
    console.log(`\n4️⃣ Проверяем задачи других пользователей (ID от 2 до 10):`);
    for (let id = 2; id <= 10; id++) {
      const otherTasksResponse = await axios.get(`${apiUrl}/tasks?user_id=${id}`);
      const otherTasks = otherTasksResponse.data;
      
      if (otherTasks.length > 0) {
        console.log(`Пользователь ${id}: найдено ${otherTasks.length} задач`);
        otherTasks.forEach(task => {
          console.log(`  - ID ${task.id}: "${task.title}" (user_id: ${task.user_id})`);
        });
      }
    }
    
    // 5. Решение проблемы: предлагаем обновить user_id для задач
    console.log(`\n5️⃣ Возможное решение проблемы:`);
    
    if (legacyTasks.length > 0) {
      console.log(`\nДля переноса задач с user_id=1 на ваш Telegram ID ${telegramId}, выполните следующие команды:\n`);
      
      legacyTasks.forEach(task => {
        console.log(`curl -X PUT "${apiUrl}/tasks/${task.id}" -H "Content-Type: application/json" -d '{"user_id": ${telegramId}}'`);
      });
    }
    
    if (zeroTasks.length > 0) {
      console.log(`\nДля переноса задач с user_id=0 на ваш Telegram ID ${telegramId}, выполните следующие команды:\n`);
      
      zeroTasks.forEach(task => {
        console.log(`curl -X PUT "${apiUrl}/tasks/${task.id}" -H "Content-Type: application/json" -d '{"user_id": ${telegramId}}'`);
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке задач:', error.message);
    if (error.response) {
      console.error('Данные ответа:', error.response.data);
    }
  }
}

main().catch(console.error); 
 
 