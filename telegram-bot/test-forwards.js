require('dotenv').config();
const axios = require('axios');

const apiUrl = process.env.API_URL || 'https://taskdrop-render-backend.onrender.com';

// Эмуляция callbackQuery от телеграм-бота для задач из пересланных сообщений
const testCallback = {
  from: {
    id: 25278733, // Замените на ваш реальный Telegram ID
    first_name: 'Test',
    username: 'test_user'
  },
  message: {
    chat: {
      id: 25278733 // Замените на ваш реальный Telegram ID (должен совпадать с from.id)
    }
  }
};

// Функция для получения или создания пользователя
async function getOrCreateUser(msg) {
  try {
    const telegramUser = msg.from;
    
    console.log(`👉 DEBUG: getOrCreateUser вызван для пользователя с Telegram ID: ${telegramUser.id}, имя: ${telegramUser.first_name}`);
    
    // Проверяем, есть ли пользователь в базе
    const response = await axios.get(`${apiUrl}/users/telegram/${telegramUser.id}`);
    
    if (response.status === 200 && !response.data.error) {
      console.log(`👉 ✅ Найден существующий пользователь: ${telegramUser.first_name} (ID: ${response.data.id})`);
      console.log(`👉 DEBUG: Данные пользователя из базы:`, JSON.stringify(response.data));
      
      // Проверяем, соответствует ли ID пользователя его Telegram ID
      if (response.data.id !== telegramUser.id) {
        console.log(`👉 ⚠️ ID пользователя (${response.data.id}) не соответствует его Telegram ID (${telegramUser.id})`);
        
        try {
          // Обновляем пользователя, чтобы использовать Telegram ID в качестве основного ID
          const updateResponse = await axios.put(`${apiUrl}/users/${response.data.id}`, {
            id: telegramUser.id,
            telegram_id: telegramUser.id
          });
          
          if (updateResponse.status === 200) {
            console.log(`👉 ✅ ID пользователя обновлен на ${telegramUser.id}`);
            console.log(`👉 DEBUG: Обновленные данные пользователя:`, JSON.stringify(updateResponse.data));
            return updateResponse.data;
          }
        } catch (updateError) {
          console.error('Ошибка при обновлении ID пользователя:', updateError);
          console.error('Детали ошибки:', updateError.response ? updateError.response.data : 'Нет данных о response');
        }
      }
      
      return response.data;
    }
  } catch (error) {
    // Пользователь не найден, создаем нового
    console.log(`👉 ℹ️ Пользователь не найден в базе, создаем нового...`);
    console.error('Ошибка при поиске пользователя:', error);
    console.error('Детали ошибки:', error.response ? error.response.data : 'Нет данных о response');
  }
  
  try {
    const telegramUser = msg.from;
    // Создаем нового пользователя
    const userData = {
      id: telegramUser.id, // Используем Telegram ID как основной ID
      telegram_id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username
    };
    
    console.log(`👉 DEBUG: Создаем нового пользователя с данными:`, JSON.stringify(userData));
    
    const createResponse = await axios.post(`${apiUrl}/users`, userData);
    
    if (createResponse.status === 200 || createResponse.status === 201) {
      console.log(`👉 ✅ Создан новый пользователь: ${telegramUser.first_name} (ID: ${createResponse.data.id})`);
      console.log(`👉 DEBUG: Данные созданного пользователя:`, JSON.stringify(createResponse.data));
      return createResponse.data;
    }
    
    throw new Error('Не удалось создать пользователя');
  } catch (createError) {
    console.error('Ошибка при создании пользователя:', createError);
    console.error('Детали ошибки:', createError.response ? createError.response.data : 'Нет данных о response');
    
    // В случае ошибки используем локальные данные пользователя
    const telegramUser = msg.from;
    const defaultUser = {
      id: telegramUser.id,
      telegram_id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username
    };
    
    console.log(`👉 DEBUG: Возвращаем локальные данные пользователя:`, JSON.stringify(defaultUser));
    return defaultUser;
  }
}

// Функция, эмулирующая создание задачи из пересланного сообщения
async function createTaskFromForward() {
  try {
    console.log(`👉 DEBUG: Начало тестирования создания задачи из пересланного сообщения`);
    const chatId = testCallback.message.chat.id;
    const taskTitle = "Тестовая задача из пересланного сообщения";
    
    console.log(`👉 DEBUG: Данные telegramUser:`, JSON.stringify(testCallback.from));
    
    // Получаем пользователя через функцию getOrCreateUser
    const user = await getOrCreateUser({
      chat: { id: chatId },
      from: testCallback.from
    });
    
    console.log(`👉 DEBUG: Результат getOrCreateUser:`, JSON.stringify(user));
    console.log(`👉 DEBUG: user_id из getOrCreateUser: ${user.id}`);
    
    // Создаем данные задачи с корректным ID пользователя
    const taskData = {
      user_id: user.id, // Используем ID пользователя из базы данных
      title: taskTitle,
      description: "Это тестовая задача, созданная с помощью диагностического скрипта",
      due_date: new Date().toISOString().split('T')[0], // Сегодняшняя дата как срок по умолчанию
      priority: "medium"
    };
    
    console.log(`👉 DEBUG: Данные для создания задачи:`, JSON.stringify(taskData));
    console.log(`👉 Создание задачи для пользователя: ${user.first_name} (ID: ${user.id})`);
    
    const response = await axios.post(`${apiUrl}/tasks`, taskData);
    
    console.log('👉 DEBUG: Ответ API:', JSON.stringify(response.data));
    console.log(`👉 DEBUG: ID созданной задачи: ${response.data.id}, user_id: ${response.data.user_id}`);
    
    if (response.data && response.data.id) {
      console.log(`👉 ✅ Задача успешно создана с ID: ${response.data.id} для пользователя с ID: ${response.data.user_id}`);
      
      // Проверяем, что задача действительно создана с правильным user_id
      console.log(`👉 DEBUG: Проверка, что задача создана с правильным user_id`);
      console.log(`👉 Ожидаемый user_id: ${user.id}`);
      console.log(`👉 Фактический user_id в созданной задаче: ${response.data.user_id}`);
      
      if (response.data.user_id == user.id) {
        console.log(`👉 ✅ УСПЕХ: user_id в задаче совпадает с ID пользователя`);
      } else {
        console.log(`👉 ❌ ОШИБКА: user_id в задаче (${response.data.user_id}) НЕ совпадает с ID пользователя (${user.id})`);
      }
      
      return response.data;
    } else {
      console.error('Неожиданный ответ API:', response.data);
      throw new Error('Ответ API не содержит ID созданной задачи');
    }
  } catch (error) {
    console.error('❌ Ошибка при создании задачи:', error);
    console.error('Полная информация об ошибке:', error.response ? error.response.data : 'Нет данных о response');
  }
}

// Вызываем функцию тестирования
createTaskFromForward()
  .then(result => {
    console.log('➡️ Тестирование завершено');
    if (result) {
      console.log('✅ Результат: Задача успешно создана');
    } else {
      console.log('❌ Результат: Не удалось создать задачу');
    }
  })
  .catch(error => {
    console.error('❌ Ошибка в процессе тестирования:', error);
  }); 
const axios = require('axios');

const apiUrl = process.env.API_URL || 'https://taskdrop-render-backend.onrender.com';

// Эмуляция callbackQuery от телеграм-бота для задач из пересланных сообщений
const testCallback = {
  from: {
    id: 25278733, // Замените на ваш реальный Telegram ID
    first_name: 'Test',
    username: 'test_user'
  },
  message: {
    chat: {
      id: 25278733 // Замените на ваш реальный Telegram ID (должен совпадать с from.id)
    }
  }
};

// Функция для получения или создания пользователя
async function getOrCreateUser(msg) {
  try {
    const telegramUser = msg.from;
    
    console.log(`👉 DEBUG: getOrCreateUser вызван для пользователя с Telegram ID: ${telegramUser.id}, имя: ${telegramUser.first_name}`);
    
    // Проверяем, есть ли пользователь в базе
    const response = await axios.get(`${apiUrl}/users/telegram/${telegramUser.id}`);
    
    if (response.status === 200 && !response.data.error) {
      console.log(`👉 ✅ Найден существующий пользователь: ${telegramUser.first_name} (ID: ${response.data.id})`);
      console.log(`👉 DEBUG: Данные пользователя из базы:`, JSON.stringify(response.data));
      
      // Проверяем, соответствует ли ID пользователя его Telegram ID
      if (response.data.id !== telegramUser.id) {
        console.log(`👉 ⚠️ ID пользователя (${response.data.id}) не соответствует его Telegram ID (${telegramUser.id})`);
        
        try {
          // Обновляем пользователя, чтобы использовать Telegram ID в качестве основного ID
          const updateResponse = await axios.put(`${apiUrl}/users/${response.data.id}`, {
            id: telegramUser.id,
            telegram_id: telegramUser.id
          });
          
          if (updateResponse.status === 200) {
            console.log(`👉 ✅ ID пользователя обновлен на ${telegramUser.id}`);
            console.log(`👉 DEBUG: Обновленные данные пользователя:`, JSON.stringify(updateResponse.data));
            return updateResponse.data;
          }
        } catch (updateError) {
          console.error('Ошибка при обновлении ID пользователя:', updateError);
          console.error('Детали ошибки:', updateError.response ? updateError.response.data : 'Нет данных о response');
        }
      }
      
      return response.data;
    }
  } catch (error) {
    // Пользователь не найден, создаем нового
    console.log(`👉 ℹ️ Пользователь не найден в базе, создаем нового...`);
    console.error('Ошибка при поиске пользователя:', error);
    console.error('Детали ошибки:', error.response ? error.response.data : 'Нет данных о response');
  }
  
  try {
    const telegramUser = msg.from;
    // Создаем нового пользователя
    const userData = {
      id: telegramUser.id, // Используем Telegram ID как основной ID
      telegram_id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username
    };
    
    console.log(`👉 DEBUG: Создаем нового пользователя с данными:`, JSON.stringify(userData));
    
    const createResponse = await axios.post(`${apiUrl}/users`, userData);
    
    if (createResponse.status === 200 || createResponse.status === 201) {
      console.log(`👉 ✅ Создан новый пользователь: ${telegramUser.first_name} (ID: ${createResponse.data.id})`);
      console.log(`👉 DEBUG: Данные созданного пользователя:`, JSON.stringify(createResponse.data));
      return createResponse.data;
    }
    
    throw new Error('Не удалось создать пользователя');
  } catch (createError) {
    console.error('Ошибка при создании пользователя:', createError);
    console.error('Детали ошибки:', createError.response ? createError.response.data : 'Нет данных о response');
    
    // В случае ошибки используем локальные данные пользователя
    const telegramUser = msg.from;
    const defaultUser = {
      id: telegramUser.id,
      telegram_id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username
    };
    
    console.log(`👉 DEBUG: Возвращаем локальные данные пользователя:`, JSON.stringify(defaultUser));
    return defaultUser;
  }
}

// Функция, эмулирующая создание задачи из пересланного сообщения
async function createTaskFromForward() {
  try {
    console.log(`👉 DEBUG: Начало тестирования создания задачи из пересланного сообщения`);
    const chatId = testCallback.message.chat.id;
    const taskTitle = "Тестовая задача из пересланного сообщения";
    
    console.log(`👉 DEBUG: Данные telegramUser:`, JSON.stringify(testCallback.from));
    
    // Получаем пользователя через функцию getOrCreateUser
    const user = await getOrCreateUser({
      chat: { id: chatId },
      from: testCallback.from
    });
    
    console.log(`👉 DEBUG: Результат getOrCreateUser:`, JSON.stringify(user));
    console.log(`👉 DEBUG: user_id из getOrCreateUser: ${user.id}`);
    
    // Создаем данные задачи с корректным ID пользователя
    const taskData = {
      user_id: user.id, // Используем ID пользователя из базы данных
      title: taskTitle,
      description: "Это тестовая задача, созданная с помощью диагностического скрипта",
      due_date: new Date().toISOString().split('T')[0], // Сегодняшняя дата как срок по умолчанию
      priority: "medium"
    };
    
    console.log(`👉 DEBUG: Данные для создания задачи:`, JSON.stringify(taskData));
    console.log(`👉 Создание задачи для пользователя: ${user.first_name} (ID: ${user.id})`);
    
    const response = await axios.post(`${apiUrl}/tasks`, taskData);
    
    console.log('👉 DEBUG: Ответ API:', JSON.stringify(response.data));
    console.log(`👉 DEBUG: ID созданной задачи: ${response.data.id}, user_id: ${response.data.user_id}`);
    
    if (response.data && response.data.id) {
      console.log(`👉 ✅ Задача успешно создана с ID: ${response.data.id} для пользователя с ID: ${response.data.user_id}`);
      
      // Проверяем, что задача действительно создана с правильным user_id
      console.log(`👉 DEBUG: Проверка, что задача создана с правильным user_id`);
      console.log(`👉 Ожидаемый user_id: ${user.id}`);
      console.log(`👉 Фактический user_id в созданной задаче: ${response.data.user_id}`);
      
      if (response.data.user_id == user.id) {
        console.log(`👉 ✅ УСПЕХ: user_id в задаче совпадает с ID пользователя`);
      } else {
        console.log(`👉 ❌ ОШИБКА: user_id в задаче (${response.data.user_id}) НЕ совпадает с ID пользователя (${user.id})`);
      }
      
      return response.data;
    } else {
      console.error('Неожиданный ответ API:', response.data);
      throw new Error('Ответ API не содержит ID созданной задачи');
    }
  } catch (error) {
    console.error('❌ Ошибка при создании задачи:', error);
    console.error('Полная информация об ошибке:', error.response ? error.response.data : 'Нет данных о response');
  }
}

// Вызываем функцию тестирования
createTaskFromForward()
  .then(result => {
    console.log('➡️ Тестирование завершено');
    if (result) {
      console.log('✅ Результат: Задача успешно создана');
    } else {
      console.log('❌ Результат: Не удалось создать задачу');
    }
  })
  .catch(error => {
    console.error('❌ Ошибка в процессе тестирования:', error);
  }); 
 
 