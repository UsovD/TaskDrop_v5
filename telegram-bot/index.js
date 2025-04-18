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

// Храним chat_id пользователей для уведомлений
const userChatIds = new Map();

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
  
  // Сохраняем chat_id пользователя
  userChatIds.set(1, chatId); // Для упрощения привязываем к user_id=1, можно расширить эту логику
  
  bot.sendMessage(chatId, `Привет, ${userName}! Я бот для управления задачами TaskDrop. Вот что я умею:
  
/tasks - показать список активных задач
/add - добавить новую задачу
/help - показать информацию о командах
/webapp - открыть веб-приложение`, {
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
  
  bot.sendMessage(chatId, `Список доступных команд:
  
/tasks - показать список активных задач
/add - добавить новую задачу
/help - показать эту справку
/webapp - открыть веб-приложение`, {
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
      bot.sendMessage(chatId, `✅ Задача "${taskTitle}" успешно добавлена!`, {
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
  } else if (data.startsWith('complete_task_')) {
    const taskId = data.split('_')[2];
    
    try {
      // Отправляем запрос к API для изменения статуса задачи
      await axios.put(`${apiUrl}/tasks/${taskId}`, {
        done: true
      });
      
      // Обновляем сообщение с уведомлением (убираем Markdown)
      bot.editMessageText(`✅ Задача выполнена!\n\n${callbackQuery.message.text.split('\n\n').slice(1).join('\n\n')}`, {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🚀 Открыть в приложении', web_app: { url: webAppUrl } }]
          ]
        }
      });
      
      // Отвечаем на callback_query
      bot.answerCallbackQuery(callbackQuery.id, {
        text: 'Задача отмечена как выполненная!'
      });
    } catch (error) {
      console.error('Ошибка при изменении статуса задачи:', error);
      bot.answerCallbackQuery(callbackQuery.id, {
        text: 'Произошла ошибка. Попробуйте снова позже.'
      });
    }
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

// Обработчик команды /test для тестирования уведомлений
bot.onText(/\/test/, (msg) => {
  const chatId = msg.chat.id;
  
  // Сохраняем chat_id пользователя, если еще не сохранен
  userChatIds.set(1, chatId);
  
  // Текущее время для отладки
  const now = new Date();
  const currentTime = now.toLocaleTimeString('ru-RU');
  const currentDate = now.toLocaleDateString('ru-RU');
  
  // Отправляем тестовое уведомление (удалим Markdown для надежности)
  let message = `🔔 Тестовое уведомление\n\n`;
  message += `Текущее время: ${currentTime}\n`;
  message += `Текущая дата: ${currentDate}\n\n`;
  message += `Ваш chat_id: ${chatId} сохранен для получения уведомлений.\n`;
  message += `Количество сохраненных пользователей: ${userChatIds.size}`;
  
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
  
  try {
    // Получаем все активные задачи
    const response = await axios.get(`${apiUrl}/tasks?user_id=1`);
    const tasks = response.data;
    
    // Текущая дата и время
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Фильтруем задачи, которые нужно напомнить
    for (const task of tasks) {
      // Пропускаем выполненные задачи
      if (task.done) continue;
      
      // Проверяем только задачи с датой и временем
      if (!task.due_date || !task.due_time || !task.notification) continue;
      
      // Разбираем время задачи
      const [taskHour, taskMinute] = task.due_time.split(':').map(Number);
      
      // Время для отправки уведомления в зависимости от настройки
      let notificationTime = new Date(`${task.due_date}T${task.due_time}`);
      
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
      
      // Проверяем, наступило ли время для отправки уведомления
      // С точностью до минуты
      const notificationHour = notificationTime.getHours();
      const notificationMinute = notificationTime.getMinutes();
      const notificationDate = notificationTime.toISOString().split('T')[0];
      
      // Если текущее время совпадает с временем отправки уведомления (с точностью до минуты)
      if (
        currentDate === notificationDate && 
        currentHour === notificationHour && 
        currentMinute === notificationMinute
      ) {
        // Отправляем уведомление пользователю, если знаем его chat_id
        const userId = task.user_id || 1;
        const chatId = userChatIds.get(userId);
        
        if (chatId) {
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
          }).catch(err => {
            console.error(`Ошибка при отправке уведомления для задачи ${task.id}:`, err.message);
          });
        } else {
          console.log(`Нет зарегистрированного chat_id для пользователя с ID ${userId}`);
        }
      }
    }
  } catch (error) {
    console.error('Ошибка при проверке уведомлений:', error.message);
  } finally {
    // Запускаем проверку снова через минуту, если бот активен
    if (!isShuttingDown) {
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
    { command: '/test', description: 'Проверить уведомления' }
  ]).then(() => {
    bot.sendMessage(msg.chat.id, 'Команды бота обновлены!');
  }).catch((error) => {
    bot.sendMessage(msg.chat.id, 'Произошла ошибка при обновлении команд: ' + error.message);
  });
});

console.log('Бот TaskDrop запущен!'); 