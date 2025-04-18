const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

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

// Функция корректного завершения работы бота
function gracefulShutdown() {
  console.log('Получен сигнал завершения, останавливаю бота...');
  isShuttingDown = true;
  
  bot.stopPolling()
    .then(() => {
      console.log('Бот успешно остановлен');
      process.exit(0);
    })
    .catch(error => {
      console.error('Ошибка при остановке бота:', error);
      process.exit(1);
    });
}

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || 'пользователь';
  
  bot.sendMessage(chatId, `Привет, ${userName}! Я бот для управления задачами TaskDrop. Вот что я умею:
  
/tasks - показать список активных задач
/add - добавить новую задачу
/help - показать информацию о командах
/webapp - открыть веб-приложение`, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🚀 Открыть приложение', web_app: { url: webAppUrl } }]
      ]
    }
  });
});

// Обработчик команды /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, `*Список доступных команд:*
  
/tasks - показать список активных задач
/add - добавить новую задачу
/help - показать эту справку
/webapp - открыть веб-приложение`, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🚀 Открыть приложение', web_app: { url: webAppUrl } }]
      ]
    }
  });
});

// Обработчик команды /webapp - отправляет ссылку на веб-приложение
bot.onText(/\/webapp/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, 'Нажмите на кнопку ниже, чтобы открыть веб-приложение TaskDrop:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🚀 Открыть TaskDrop', web_app: { url: webAppUrl } }]
      ]
    }
  });
});

// Обработчик команды /tasks - получает и отображает задачи из API
bot.onText(/\/tasks/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    // Сообщаем пользователю, что загружаем задачи
    bot.sendMessage(chatId, 'Загружаю список задач...');
    
    // Делаем запрос к API для получения задач
    const response = await axios.get(`${apiUrl}/tasks?user_id=1`);
    const tasks = response.data;
    
    if (tasks.length === 0) {
      bot.sendMessage(chatId, 'У вас пока нет активных задач.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '➕ Добавить задачу', callback_data: 'prompt_add_task' }],
            [{ text: '🚀 Открыть приложение', web_app: { url: webAppUrl } }]
          ]
        }
      });
      return;
    }
    
    // Формируем сообщение со списком задач
    let message = '*Ваши активные задачи:*\n\n';
    
    tasks.filter(task => !task.done).forEach((task, index) => {
      const dueDate = task.due_date ? `📅 ${task.due_date}` : '';
      const dueTime = task.due_time ? `⏰ ${task.due_time}` : '';
      const notification = task.notification ? `🔔 ${task.notification}` : '';
      
      message += `*${index + 1}.* ${task.title}\n`;
      
      if (task.description) {
        message += `   _${task.description}_\n`;
      }
      
      if (dueDate || dueTime || notification) {
        message += `   ${dueDate} ${dueTime} ${notification}\n`;
      }
      
      message += '\n';
    });
    
    bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '➕ Добавить задачу', callback_data: 'prompt_add_task' }],
          [{ text: '🚀 Открыть в приложении', web_app: { url: webAppUrl } }]
        ]
      }
    });
  } catch (error) {
    console.error('Ошибка при получении задач:', error);
    bot.sendMessage(chatId, 'Произошла ошибка при получении задач. Пожалуйста, попробуйте позже.', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Открыть приложение', web_app: { url: webAppUrl } }]
        ]
      }
    });
  }
});

// Обработчик команды /add - добавление новой задачи
bot.onText(/\/add (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const taskTitle = match[1]; // текст задачи из команды /add
  
  if (!taskTitle) {
    bot.sendMessage(chatId, 'Пожалуйста, укажите текст задачи: /add Название задачи');
    return;
  }
  
  try {
    // Отправляем запрос к API для создания новой задачи
    const response = await axios.post(`${apiUrl}/tasks`, {
      title: taskTitle,
      user_id: 1,
      done: false
    });
    
    if (response.data && response.data.success) {
      bot.sendMessage(chatId, `✅ Задача *"${taskTitle}"* успешно добавлена!`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 Посмотреть все задачи', callback_data: 'show_tasks' }],
            [{ text: '🚀 Открыть приложение', web_app: { url: webAppUrl } }]
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
          [{ text: '🚀 Открыть приложение', web_app: { url: webAppUrl } }]
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
        [{ text: '🚀 Открыть приложение', web_app: { url: webAppUrl } }]
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
          [{ text: '🚀 Открыть приложение', web_app: { url: webAppUrl } }]
        ]
      }
    });
  }
});

// Обработчик callback_data
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  
  if (data === 'show_tasks') {
    // Эмулируем команду /tasks
    bot.emit('text', { 
      chat: { id: chatId },
      text: '/tasks',
      from: callbackQuery.from
    });
  } else if (data === 'prompt_add_task') {
    bot.sendMessage(chatId, 'Напишите задачу в формате: /add Название задачи', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Открыть приложение', web_app: { url: webAppUrl } }]
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
    const remainingText = textParts.slice(1).join('\n');
    
    console.log('Заголовок задачи:', firstLine);
    console.log('Описание задачи:', remainingText);
    
    try {
      // Подготавливаем данные для отправки в API
      const taskData = {
        title: firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine,
        description: remainingText,
        user_id: 1,
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
              [{ text: '🚀 Открыть приложение', web_app: { url: webAppUrl } }]
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
  }
  
  // Обязательно ответить на callback запрос
  bot.answerCallbackQuery(callbackQuery.id);
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

console.log('Бот TaskDrop запущен!'); 