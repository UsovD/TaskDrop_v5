const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Настройка логирования
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, `bot_${new Date().toISOString().replace(/:/g, '-')}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Перенаправление консольного вывода в файл логов
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = function() {
  const args = Array.from(arguments);
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] [INFO] ${args.join(' ')}`;
  
  originalConsoleLog.apply(console, [message]);
  logStream.write(message + '\n');
};

console.error = function() {
  const args = Array.from(arguments);
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] [ERROR] ${args.join(' ')}`;
  
  originalConsoleError.apply(console, [message]);
  logStream.write(message + '\n');
};

// Проверка на запущенный экземпляр
const lockFile = path.join(__dirname, 'bot.lock');
try {
  // Если файл блокировки существует, значит бот уже запущен
  if (fs.existsSync(lockFile)) {
    const pid = fs.readFileSync(lockFile, 'utf-8');
    console.error(`Бот уже запущен с PID ${pid}. Завершение работы.`);
    process.exit(1);
  }
  
  // Создаем файл блокировки
  fs.writeFileSync(lockFile, process.pid.toString());
} catch (error) {
  console.error('Ошибка при проверке/создании файла блокировки:', error);
}

// Токен API для бота
const token = process.env.TELEGRAM_BOT_TOKEN;
// URL API для доступа к данным о задачах
const apiUrl = process.env.API_URL;
// URL веб-приложения
const webAppUrl = process.env.WEBAPP_URL;

// Создаем экземпляр бота с настройками для предотвращения конфликтов
const bot = new TelegramBot(token, { 
  polling: true,
  filepath: false,
  webhookReply: false
});

// Флаг для отслеживания состояния завершения работы бота
let isShuttingDown = false;

// Добавляем обработку сигналов завершения для корректного закрытия соединения
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Храним chat_id пользователей для уведомлений
const userChatIds = new Map();

// Функция корректного завершения работы бота
function gracefulShutdown() {
  console.log('Получен сигнал завершения, останавливаю бота...');
  isShuttingDown = true;
  
  bot.stopPolling()
    .then(() => {
      console.log('Бот успешно остановлен');
      // Удаляем файл блокировки перед завершением работы
      try {
        if (fs.existsSync(lockFile)) {
          fs.unlinkSync(lockFile);
          console.log('Файл блокировки удален');
        }
      } catch (error) {
        console.error('Ошибка при удалении файла блокировки:', error);
      }
      
      // Закрываем поток записи логов
      logStream.end('Бот завершил работу\n', () => {
        process.exit(0);
      });
    })
    .catch(error => {
      console.error('Ошибка при остановке бота:', error);
      // Удаляем файл блокировки перед завершением работы
      try {
        if (fs.existsSync(lockFile)) {
          fs.unlinkSync(lockFile);
        }
      } catch (e) {
        console.error('Ошибка при удалении файла блокировки:', e);
      }
      
      logStream.end('Бот завершил работу с ошибкой\n', () => {
        process.exit(1);
      });
    });
}

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || 'пользователь';
  const userId = msg.from.id; // Получаем реальный ID пользователя Telegram
  const firstName = msg.from.first_name || '';
  const lastName = msg.from.last_name || '';
  const username = msg.from.username || '';
  
  // Сохраняем chat_id пользователя с его реальным ID
  userChatIds.set(userId, chatId);
  console.log(`👉 Сохранен chat_id ${chatId} для пользователя с ID ${userId}`);
  
  // Также сохраняем для user_id=1 для обратной совместимости
  userChatIds.set(1, chatId);
  
  // Формируем URL с данными пользователя
  const authDate = Math.floor(Date.now() / 1000);
  const userDataParams = new URLSearchParams();
  
  // Формируем данные пользователя для передачи в WebApp
  const userData = {
    id: userId,
    first_name: firstName,
    last_name: lastName,
    username: username
  };
  
  // Добавляем параметры для initData
  userDataParams.append('user', JSON.stringify(userData));
  userDataParams.append('auth_date', authDate.toString());
  userDataParams.append('hash', 'dummy_hash_for_testing'); // В реальном приложении нужно создавать настоящий хеш
  
  // Создаем personalized URL для web app
  const personalizedUrl = `${webAppUrl}#tgWebAppData=${encodeURIComponent(userDataParams.toString())}`;
  
  bot.sendMessage(chatId, `Привет, ${userName}! Я бот для управления задачами TaskDrop. Вот что я умею:
  
/tasks - показать список активных задач
/add - добавить новую задачу
/help - показать информацию о командах
/webapp - открыть веб-приложение
/test - проверить уведомления и показать информацию о вашем аккаунте`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🚀 Открыть приложение', web_app: { url: personalizedUrl } }]
      ]
    }
  });
});

// Обработчик команды /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const firstName = msg.from.first_name || '';
  const lastName = msg.from.last_name || '';
  const username = msg.from.username || '';
  
  // Формируем URL с данными пользователя
  const authDate = Math.floor(Date.now() / 1000);
  const userDataParams = new URLSearchParams();
  
  // Формируем данные пользователя для передачи в WebApp
  const userData = {
    id: userId,
    first_name: firstName,
    last_name: lastName,
    username: username
  };
  
  // Добавляем параметры для initData
  userDataParams.append('user', JSON.stringify(userData));
  userDataParams.append('auth_date', authDate.toString());
  userDataParams.append('hash', 'dummy_hash_for_testing'); // В реальном приложении нужно создавать настоящий хеш
  
  // Создаем personalized URL для web app
  const personalizedUrl = `${webAppUrl}#tgWebAppData=${encodeURIComponent(userDataParams.toString())}`;
  
  bot.sendMessage(chatId, `Список доступных команд:
  
/tasks - показать список активных задач
/add - добавить новую задачу
/help - показать эту справку
/webapp - открыть веб-приложение`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🚀 Открыть приложение', web_app: { url: personalizedUrl } }]
      ]
    }
  });
});

// Обработчик команды /webapp - отправляет ссылку на веб-приложение
bot.onText(/\/webapp/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const firstName = msg.from.first_name || '';
  const lastName = msg.from.last_name || '';
  const username = msg.from.username || '';
  
  // Формируем URL с данными пользователя для правильной идентификации
  const authDate = Math.floor(Date.now() / 1000);
  const userDataParams = new URLSearchParams();
  
  // Формируем данные пользователя для передачи в WebApp
  const userData = {
    id: userId,
    first_name: firstName,
    last_name: lastName,
    username: username
  };
  
  // Добавляем параметры для initData
  userDataParams.append('user', JSON.stringify(userData));
  userDataParams.append('auth_date', authDate.toString());
  userDataParams.append('hash', 'dummy_hash_for_testing'); // В реальном приложении нужно создавать настоящий хеш
  
  // Создаем personalized URL для web app
  const personalizedUrl = `${webAppUrl}#tgWebAppData=${encodeURIComponent(userDataParams.toString())}`;
  
  console.log(`Создан URL для пользователя ${userId}: ${personalizedUrl}`);
  
  bot.sendMessage(chatId, 'Нажмите на кнопку ниже, чтобы открыть веб-приложение TaskDrop:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🚀 Открыть TaskDrop', web_app: { url: personalizedUrl } }]
      ]
    }
  });
});

// Обработчик команды /tasks - получает и отображает задачи из API
bot.onText(/\/tasks/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id; // Получаем реальный ID пользователя
  const firstName = msg.from.first_name || '';
  const lastName = msg.from.last_name || '';
  const username = msg.from.username || '';
  
  // Формируем URL с данными пользователя
  const authDate = Math.floor(Date.now() / 1000);
  const userDataParams = new URLSearchParams();
  
  // Формируем данные пользователя для передачи в WebApp
  const userData = {
    id: userId,
    first_name: firstName,
    last_name: lastName,
    username: username
  };
  
  // Добавляем параметры для initData
  userDataParams.append('user', JSON.stringify(userData));
  userDataParams.append('auth_date', authDate.toString());
  userDataParams.append('hash', 'dummy_hash_for_testing'); // В реальном приложении нужно создавать настоящий хеш
  
  // Создаем personalized URL для web app
  const personalizedUrl = `${webAppUrl}#tgWebAppData=${encodeURIComponent(userDataParams.toString())}`;
  
  try {
    // Сообщаем пользователю, что загружаем задачи
    bot.sendMessage(chatId, 'Загружаю список задач...');
    
    // Делаем запрос к API для получения задач конкретного пользователя
    const response = await axios.get(`${apiUrl}/tasks?user_id=${userId}`);
    const tasks = response.data;
    
    if (tasks.length === 0) {
      bot.sendMessage(chatId, 'У вас пока нет активных задач.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '➕ Добавить задачу', callback_data: 'prompt_add_task' }],
            [{ text: '🚀 Открыть приложение', web_app: { url: personalizedUrl } }]
          ]
        }
      });
      return;
    }
    
    // Формируем сообщение со списком задач
    let message = 'Ваши активные задачи:\n\n';
    
    tasks.filter(task => !task.done).forEach((task, index) => {
      const dueDate = task.due_date ? `📅 ${task.due_date}` : '';
      const dueTime = task.due_time ? `⏰ ${task.due_time}` : '';
      const notification = task.notification ? `🔔 ${task.notification}` : '';
      
      message += `${index + 1}. ${task.title}\n`;
      
      if (task.description) {
        message += `   ${task.description}\n`;
      }
      
      if (dueDate || dueTime || notification) {
        message += `   ${dueDate} ${dueTime} ${notification}\n`;
      }
      
      message += '\n';
    });
    
    bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '➕ Добавить задачу', callback_data: 'prompt_add_task' }],
          [{ text: '🚀 Открыть в приложении', web_app: { url: personalizedUrl } }]
        ]
      }
    });
  } catch (error) {
    console.error('Ошибка при получении задач:', error);
    bot.sendMessage(chatId, 'Произошла ошибка при получении задач. Пожалуйста, попробуйте позже.', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Открыть приложение', web_app: { url: personalizedUrl } }]
        ]
      }
    });
  }
});

// Обработчик команды /add - добавление новой задачи
bot.onText(/\/add (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id; // Получаем реальный ID пользователя
  const taskTitle = match[1]; // текст задачи из команды /add
  
  if (!taskTitle) {
    bot.sendMessage(chatId, 'Пожалуйста, укажите текст задачи: /add Название задачи');
    return;
  }
  
  try {
    // Отправляем запрос к API для создания новой задачи с ID реального пользователя
    const response = await axios.post(`${apiUrl}/tasks`, {
      title: taskTitle,
      user_id: userId,
      done: false
    });
    
    if (response.data && response.data.success) {
      bot.sendMessage(chatId, `✅ Задача "${taskTitle}" успешно добавлена!`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 Посмотреть все задачи', callback_data: 'show_tasks' }],
            [{ text: '🚀 Открыть приложение', web_app: { url: personalizedUrl } }]
          ]
        }
      });
    } else {
      throw new Error('Ответ API не содержит подтверждения успешного создания задачи');
    }
  } catch (error) {
    console.error('Ошибка при создании задачи:', error);
    bot.sendMessage(chatId, 'Произошла ошибка при добавлении задачи. Пожалуйста, попробуйте позже.', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Открыть приложение', web_app: { url: personalizedUrl } }]
        ]
      }
    });
  }
});

// Обработчик простой команды добавления задачи без параметров
bot.onText(/^\/add$/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Пожалуйста, укажите текст задачи: /add Название задачи', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🚀 Открыть приложение', web_app: { url: personalizedUrl } }]
      ]
    }
  });
});

// Добавляем главную кнопку меню для открытия приложения
bot.setMyCommands([
  { command: '/start', description: 'Запустить бота' },
  { command: '/tasks', description: 'Показать список задач' },
  { command: '/add', description: 'Добавить новую задачу' },
  { command: '/help', description: 'Помощь по командам' },
  { command: '/webapp', description: 'Открыть приложение TaskDrop' }
]);

// Обработчик всех остальных сообщений
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  
  // Проверяем, является ли сообщение пересланным
  if (msg.forward_from || msg.forward_from_chat) {
    // Если сообщение переслано, это может быть новость
    const forwardFrom = msg.forward_from ? msg.forward_from.first_name : (msg.forward_from_chat ? msg.forward_from_chat.title : 'неизвестный источник');
    
    bot.sendMessage(chatId, `Переслано от: ${forwardFrom}\n${msg.text || 'Медиа-контент'}`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Создать задачу', callback_data: 'create_task_from_forward' }],
          [{ text: 'Отмена', callback_data: 'cancel_forward' }]
        ]
      }
    });
    return;
  }
  
  // Обработка обычных текстовых сообщений
  if (msg.text && !msg.text.startsWith('/')) {
    bot.sendMessage(chatId, 'Я понимаю только команды. Используйте /help для получения списка команд.', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Открыть приложение', web_app: { url: personalizedUrl } }]
        ]
      }
    });
  }
});

// Обработчик для callback-запросов от встроенных клавиатур
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  const userId = callbackQuery.from.id;
  const firstName = callbackQuery.from.first_name || '';
  const lastName = callbackQuery.from.last_name || '';
  const username = callbackQuery.from.username || '';
  
  // Создаем функцию для формирования персонализированного URL
  const createPersonalizedUrl = () => {
    const authDate = Math.floor(Date.now() / 1000);
    const userDataParams = new URLSearchParams();
    
    // Формируем данные пользователя для передачи в WebApp
    const userData = {
      id: userId,
      first_name: firstName,
      last_name: lastName,
      username: username
    };
    
    // Добавляем параметры для initData
    userDataParams.append('user', JSON.stringify(userData));
    userDataParams.append('auth_date', authDate.toString());
    userDataParams.append('hash', 'dummy_hash_for_testing'); // В реальном приложении нужно создавать настоящий хеш
    
    // Создаем personalized URL для web app
    return `${webAppUrl}#tgWebAppData=${encodeURIComponent(userDataParams.toString())}`;
  };
  
  try {
    // Обработка различных callback действий
    if (data === 'show_tasks') {
      // Показываем задачи пользователя
      try {
        // Сообщаем пользователю, что загружаем задачи
        bot.answerCallbackQuery(callbackQuery.id, { text: 'Загружаю список задач...' });
        
        // Делаем запрос к API для получения задач пользователя
        const response = await axios.get(`${apiUrl}/tasks?user_id=${userId}`);
        const tasks = response.data;
        
        if (tasks.length === 0) {
          bot.editMessageText('У вас пока нет активных задач.', {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: '➕ Добавить задачу', callback_data: 'prompt_add_task' }],
                [{ text: '🚀 Открыть приложение', web_app: { url: createPersonalizedUrl() } }]
              ]
            }
          });
          return;
        }
        
        // Формируем сообщение со списком задач
        let message = 'Ваши активные задачи:\n\n';
        
        tasks.filter(task => !task.done).forEach((task, index) => {
          const dueDate = task.due_date ? `📅 ${task.due_date}` : '';
          const dueTime = task.due_time ? `⏰ ${task.due_time}` : '';
          const notification = task.notification ? `🔔 ${task.notification}` : '';
          
          message += `${index + 1}. ${task.title}\n`;
          
          if (task.description) {
            message += `   ${task.description}\n`;
          }
          
          if (dueDate || dueTime || notification) {
            message += `   ${dueDate} ${dueTime} ${notification}\n`;
          }
          
          message += '\n';
        });
        
        bot.editMessageText(message, {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [{ text: '➕ Добавить задачу', callback_data: 'prompt_add_task' }],
              [{ text: '🚀 Открыть в приложении', web_app: { url: createPersonalizedUrl() } }]
            ]
          }
        });
      } catch (error) {
        console.error('Ошибка при получении задач:', error);
        bot.editMessageText('Произошла ошибка при получении задач. Пожалуйста, попробуйте позже.', {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [{ text: '🚀 Открыть приложение', web_app: { url: createPersonalizedUrl() } }]
            ]
          }
        });
      }
    } else if (data === 'prompt_add_task') {
      bot.sendMessage(chatId, 'Напишите задачу в формате: /add Название задачи', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🚀 Открыть приложение', web_app: { url: createPersonalizedUrl() } }]
          ]
        }
      });
    } else if (data === 'create_task_from_forward') {
      // Получаем текст из пересланного сообщения
      const messageText = callbackQuery.message.text;
      console.log('Исходный текст сообщения:', messageText);
      
      // Извлекаем текст сообщения, пропуская первую строку с "Переслано от:"
      const textParts = messageText.split('\n');
      const firstLine = textParts.length > 1 ? textParts[1] : messageText;
      const remainingText = textParts.slice(2).join('\n');
      
      console.log('Заголовок задачи:', firstLine);
      console.log('Описание задачи:', remainingText);
      
      try {
        // Подготавливаем данные для отправки в API
        const taskData = {
          title: firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine,
          description: remainingText,
          user_id: userId,
          done: false
        };
        
        console.log('Отправляем данные в API:', JSON.stringify(taskData));
        
        // Отправляем запрос к API для создания новой задачи
        const response = await axios.post(`${apiUrl}/tasks`, taskData);
        
        console.log('Ответ API:', JSON.stringify(response.data));
        
        if (response.data && response.data.id) {
          bot.sendMessage(chatId, '✅ Задача успешно создана из пересланного сообщения!', {
            reply_markup: {
              inline_keyboard: [
                [{ text: '📋 Посмотреть все задачи', callback_data: 'show_tasks' }],
                [{ text: '🚀 Открыть приложение', web_app: { url: createPersonalizedUrl() } }]
              ]
            }
          });
        } else {
          console.error('Неожиданный ответ API:', response.data);
          throw new Error('Ответ API не содержит ID созданной задачи');
        }
      } catch (error) {
        console.error('Ошибка при создании задачи из пересланного сообщения:', error);
        console.error('Полная информация об ошибке:', error.response ? error.response.data : 'Нет данных о response');
        
        bot.sendMessage(chatId, `Произошла ошибка при создании задачи: ${error.message}. Пожалуйста, попробуйте позже.`);
      }
    } else if (data === 'cancel_forward') {
      bot.sendMessage(chatId, 'Действие отменено.');
    } else if (data.startsWith('complete_task_')) {
      const taskId = data.split('_')[2];
      
      try {
        // Отправляем запрос к API для изменения статуса задачи
        await axios.put(`${apiUrl}/tasks/${taskId}`, {
          done: true
        });
        
        bot.answerCallbackQuery(callbackQuery.id, { text: '✅ Задача отмечена как выполненная!' });
        bot.sendMessage(chatId, '✅ Задача отмечена как выполненная!', {
          reply_markup: {
            inline_keyboard: [
              [{ text: '📋 Посмотреть задачи', callback_data: 'show_tasks' }],
              [{ text: '🚀 Открыть приложение', web_app: { url: createPersonalizedUrl() } }]
            ]
          }
        });
      } catch (error) {
        console.error('Ошибка при изменении статуса задачи:', error);
        bot.answerCallbackQuery(callbackQuery.id, { text: '❌ Ошибка: Не удалось изменить статус задачи' });
        bot.sendMessage(chatId, 'Произошла ошибка при изменении статуса задачи. Пожалуйста, попробуйте позже.');
      }
    } else {
      // Неизвестный callback_data
      bot.answerCallbackQuery(callbackQuery.id, { text: 'Неизвестная команда' });
    }
  } catch (error) {
    console.error('Ошибка при обработке callback_query:', error);
    bot.answerCallbackQuery(callbackQuery.id, { text: 'Произошла ошибка при обработке запроса' });
  }
});

// Добавляем обработку ошибок для устойчивости бота
bot.on('polling_error', (error) => {
  // Игнорируем ошибки во время завершения работы
  if (isShuttingDown) {
    return;
  }
  
  console.error('Ошибка в работе бота:', error.message);
  
  // Если ошибка 409 Conflict (конфликт при опросе), перезапускаем polling
  if (error.code === 409) {
    console.log('Обнаружен конфликт API, перезапускаю polling...');
    bot.stopPolling()
      .then(() => {
        setTimeout(() => {
          if (!isShuttingDown) {
            bot.startPolling();
            console.log('Polling успешно перезапущен');
          }
        }, 3000); // Ждем 3 секунды перед перезапуском
      })
      .catch(err => {
        console.error('Ошибка при перезапуске polling:', err);
      });
  }
});

// Обработчик команды /test для тестирования уведомлений
bot.onText(/\/test/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id; // Получаем реальный ID пользователя Telegram
  
  // Сохраняем реальный ID пользователя Telegram
  userChatIds.set(userId, chatId);
  console.log(`👉 Сохранен chat_id ${chatId} для пользователя с ID ${userId}`);
  
  // Также сохраняем для user_id=1 для обратной совместимости
  userChatIds.set(1, chatId);
  
  // Текущее время для отладки
  const now = new Date();
  const currentTime = now.toLocaleTimeString('ru-RU');
  const currentDate = now.toLocaleDateString('ru-RU');
  
  // Отправляем тестовое уведомление (удалим Markdown для надежности)
  let message = `🔔 Тестовое уведомление\n\n`;
  message += `Текущее время: ${currentTime}\n`;
  message += `Текущая дата: ${currentDate}\n\n`;
  message += `Ваш Telegram ID: ${userId}\n`;
  message += `Ваш chat_id: ${chatId}\n`;
  message += `Сохраненные пользователи: ${Array.from(userChatIds.entries()).map(entry => `ID ${entry[0]} -> chat ${entry[1]}`).join(', ')}\n\n`;
  message += `⚠️ Для задач с user_id = ${userId} и user_id = 1 будут приходить уведомления.`;
  
  bot.sendMessage(chatId, message, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📋 Посмотреть задачи', callback_data: 'show_tasks' }],
        [{ text: '🚀 Открыть приложение', web_app: { url: webAppUrl } }]
      ]
    }
  });
});

// Функция для безопасного экранирования Markdown
function escapeMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/~/g, '\\~')
    .replace(/`/g, '\\`')
    .replace(/>/g, '\\>')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/=/g, '\\=')
    .replace(/\|/g, '\\|')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\./g, '\\.')
    .replace(/\!/g, '\\!');
}

// Функция для проверки и отправки уведомлений
async function checkNotifications() {
  if (isShuttingDown) return;
  
  console.log("👉 Запуск проверки уведомлений");
  console.log("👉 Зарегистрированные пользователи:", Array.from(userChatIds.entries()));
  
  try {
    // Проверяем задачи для каждого зарегистрированного пользователя
    for (const [userId, chatId] of userChatIds.entries()) {
      try {
        console.log(`👉 Проверка задач для пользователя ${userId} (chat_id: ${chatId})`);
        
        // Получаем задачи пользователя
        const response = await axios.get(`${apiUrl}/tasks?user_id=${userId}`);
        const tasks = response.data;
        console.log(`👉 Получено задач для пользователя ${userId}: ${tasks.length}`);
        
        // Выводим задачи с уведомлениями для отладки
        const tasksWithNotifications = tasks.filter(task => 
          !task.done && task.due_date && task.due_time && task.notification
        );
        
        if (tasksWithNotifications.length > 0) {
          console.log(`👉 Задачи с настроенными уведомлениями для пользователя ${userId}:`, 
            tasksWithNotifications.map(t => ({
              id: t.id,
              title: t.title,
              due_date: t.due_date,
              due_time: t.due_time,
              notification: t.notification
            }))
          );
        } else {
          console.log(`👉 Для пользователя ${userId} нет задач с настроенными уведомлениями`);
          continue; // Пропускаем этого пользователя, если у него нет задач с уведомлениями
        }
        
        // Текущая дата и время
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        console.log(`👉 Текущее время: ${currentDate} ${currentHour}:${currentMinute}`);
        
        // Проверяем задачи пользователя
        for (const task of tasksWithNotifications) {
          console.log(`👉 Обрабатываем задачу: "${task.title}" (${task.id}), срок: ${task.due_date} ${task.due_time}, уведомление: ${task.notification}`);
          
          // Время для отправки уведомления в зависимости от настройки
          let notificationTime = new Date(`${task.due_date}T${task.due_time}`);
          console.log(`👉 Исходное время задачи: ${notificationTime.toISOString()}`);
          
          switch (task.notification) {
            case 'За 5 минут':
              notificationTime.setMinutes(notificationTime.getMinutes() - 5);
              break;
            case 'За 10 минут':
              notificationTime.setMinutes(notificationTime.getMinutes() - 10);
              break;
            case 'За 15 минут':
              notificationTime.setMinutes(notificationTime.getMinutes() - 15);
              break;
            case 'За 30 минут':
              notificationTime.setMinutes(notificationTime.getMinutes() - 30);
              break;
            case 'За 1 час':
              notificationTime.setHours(notificationTime.getHours() - 1);
              break;
            case 'За 2 часа':
              notificationTime.setHours(notificationTime.getHours() - 2);
              break;
            case 'За день':
              notificationTime.setDate(notificationTime.getDate() - 1);
              break;
          }
          
          console.log(`👉 Расчетное время уведомления: ${notificationTime.toISOString()}`);
          
          // Проверяем, наступило ли время для отправки уведомления
          // Допускаем погрешность в 2 минуты (т.е. проверяем ±2 минуты от расчетного времени)
          const notificationHour = notificationTime.getHours();
          const notificationMinute = notificationTime.getMinutes();
          const notificationDate = notificationTime.toISOString().split('T')[0];
          
          console.log(`👉 Сравниваем: Текущее [${currentDate} ${currentHour}:${currentMinute}] vs Уведомление [${notificationDate} ${notificationHour}:${notificationMinute}]`);
          
          // Переводим время в минуты для более простого сравнения
          const currentTotalMinutes = currentHour * 60 + currentMinute;
          const notificationTotalMinutes = notificationHour * 60 + notificationMinute;
          const timeDifference = Math.abs(currentTotalMinutes - notificationTotalMinutes);
          
          // Проверяем совпадение даты и близость времени (в пределах 2 минут)
          if (currentDate === notificationDate && timeDifference <= 2) {
            console.log(`👉 ✅ СОВПАДЕНИЕ! Отправляем уведомление для задачи "${task.title}" (${task.id}). Разница во времени: ${timeDifference} мин.`);
            
            // Отправляем уведомление пользователю
            console.log(`👉 Отправка уведомления пользователю с ID ${userId} (chat_id: ${chatId})`);
            
            // Отправляем сообщение без Markdown для избежания ошибок
            let message = `🔔 Напоминание о задаче!\n\n`;
            message += `${task.title}\n`;
            
            if (task.description) {
              message += `${task.description}\n\n`;
            }
            
            message += `📅 Срок: ${task.due_date}\n`;
            message += `⏰ Время: ${task.due_time}\n`;
            
            bot.sendMessage(chatId, message, {
              reply_markup: {
                inline_keyboard: [
                  [{ text: '✅ Отметить выполненной', callback_data: `complete_task_${task.id}` }],
                  [{ text: '🚀 Открыть в приложении', web_app: { url: `${webAppUrl}/edit-task/${task.id}` } }]
                ]
              }
            }).then(() => {
              console.log(`👉 ✅ Уведомление успешно отправлено пользователю ${userId}`);
            }).catch(err => {
              console.error(`👉 ❌ Ошибка при отправке уведомления для задачи ${task.id}:`, err.message);
            });
          } else {
            console.log(`👉 ❌ Время не совпадает, уведомление не отправляем`);
          }
        }
      } catch (err) {
        console.error(`❌ Ошибка при проверке задач для пользователя ${userId}:`, err.message);
      }
    }
  } catch (error) {
    console.error('❌ Ошибка при проверке уведомлений:', error.message);
    if (error.response) {
      console.error('❌ Данные ответа:', error.response.data);
    }
  } finally {
    // Запускаем проверку снова через минуту, если бот активен
    if (!isShuttingDown) {
      console.log(`👉 Следующая проверка через 60 секунд`);
      setTimeout(checkNotifications, 60000); // 1 минута
    }
  }
}

// Запускаем первую проверку уведомлений
setTimeout(checkNotifications, 5000); // Запускаем через 5 секунд после старта бота

bot.onText(/\/command/, (msg) => {
  // Установка команд для бота
  bot.setMyCommands([
    { command: '/start', description: 'Начать работу с ботом' },
    { command: '/help', description: 'Показать список команд' },
    { command: '/tasks', description: 'Показать список задач' },
    { command: '/add', description: 'Добавить новую задачу' },
    { command: '/webapp', description: 'Открыть веб-приложение' },
    { command: '/test', description: 'Проверить уведомления' },
    { command: '/force_notification', description: 'Отправить уведомление по ID задачи' },
    { command: '/notify', description: 'Установить напоминание для задачи' }
  ]).then(() => {
    bot.sendMessage(msg.chat.id, 'Команды бота обновлены!');
  }).catch((error) => {
    bot.sendMessage(msg.chat.id, 'Произошла ошибка при обновлении команд: ' + error.message);
  });
});

// Обработчик команды /force_notification - для принудительной отправки уведомлений
bot.onText(/\/force_notification (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const taskId = match[1]; // ID задачи из команды /force_notification
  
  console.log(`Пользователь ${msg.from.username || msg.from.first_name} (ID: ${msg.from.id}) запросил уведомление для задачи ${taskId}`);
  console.log(`Chat ID пользователя: ${chatId}`);
  
  if (!taskId || isNaN(parseInt(taskId))) {
    bot.sendMessage(chatId, 'Пожалуйста, укажите корректный ID задачи: /force_notification ID');
    return;
  }
  
  try {
    // Получаем информацию о задаче из API
    const response = await axios.get(`${apiUrl}/tasks/${taskId}`);
    const task = response.data;
    
    if (!task || !task.id) {
      bot.sendMessage(chatId, `❌ Задача с ID ${taskId} не найдена.`);
      return;
    }
    
    // Отправляем уведомление с информацией о задаче
    let message = `🔔 Напоминание о задаче!\n\n`;
    message += `${task.title}\n`;
    
    if (task.description) {
      message += `${task.description}\n\n`;
    }
    
    if (task.due_date) {
      message += `📅 Срок: ${task.due_date}\n`;
    }
    
    if (task.due_time) {
      message += `⏰ Время: ${task.due_time}\n`;
    }
    
    bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Отметить выполненной', callback_data: `complete_task_${task.id}` }],
          [{ text: '🚀 Открыть в приложении', web_app: { url: `${webAppUrl}/edit-task/${task.id}` } }]
        ]
      }
    });
    
    console.log(`Уведомление для задачи ${taskId} отправлено пользователю ${chatId}`);
    
  } catch (error) {
    console.error('Ошибка при отправке уведомления:', error);
    bot.sendMessage(chatId, 'Произошла ошибка при отправке уведомления. Пожалуйста, попробуйте позже.', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Открыть приложение', web_app: { url: webAppUrl } }]
        ]
      }
    });
  }
});

// Обработчик простой команды force_notification без параметров
bot.onText(/^\/force_notification$/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Пожалуйста, укажите ID задачи: /force_notification ID');
});

// Обработчик команды /notify - для установки напоминания для задачи
bot.onText(/\/notify (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const taskId = match[1]; // ID задачи из команды
  
  if (!taskId || isNaN(parseInt(taskId))) {
    bot.sendMessage(chatId, 'Пожалуйста, укажите корректный ID задачи: /notify ID');
    return;
  }
  
  try {
    // Получаем информацию о задаче из API
    const response = await axios.get(`${apiUrl}/tasks/${taskId}`);
    const task = response.data;
    
    if (!task || !task.id) {
      bot.sendMessage(chatId, `❌ Задача с ID ${taskId} не найдена.`);
      return;
    }
    
    // Варианты времени для уведомления
    bot.sendMessage(chatId, `Выберите когда прислать напоминание для задачи "${task.title}":`, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'За 5 минут', callback_data: `notify_${taskId}_5min` },
            { text: 'За 10 минут', callback_data: `notify_${taskId}_10min` }
          ],
          [
            { text: 'За 15 минут', callback_data: `notify_${taskId}_15min` },
            { text: 'За 30 минут', callback_data: `notify_${taskId}_30min` }
          ],
          [
            { text: 'За 1 час', callback_data: `notify_${taskId}_1hour` },
            { text: 'За 2 часа', callback_data: `notify_${taskId}_2hours` }
          ],
          [
            { text: 'За день', callback_data: `notify_${taskId}_1day` }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Ошибка при получении задачи:', error);
    bot.sendMessage(chatId, 'Произошла ошибка при получении информации о задаче. Пожалуйста, попробуйте позже.');
  }
});

console.log('Бот TaskDrop запущен!'); 