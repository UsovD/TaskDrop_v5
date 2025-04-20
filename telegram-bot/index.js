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

// Создаем временное хранилище для пересланных сообщений
const forwardedMessages = {};

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
            
            // Сохраняем chat_id пользователя для уведомлений
            userChatIds.set(telegramUser.id, msg.chat.id);
            
            return updateResponse.data;
          }
        } catch (updateError) {
          console.error('Ошибка при обновлении ID пользователя:', updateError);
          console.error('Детали ошибки:', updateError.response ? updateError.response.data : 'Нет данных о response');
        }
      }
      
      // Сохраняем chat_id пользователя для уведомлений
      userChatIds.set(response.data.id, msg.chat.id);
      
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
      
      // Сохраняем chat_id пользователя для уведомлений
      userChatIds.set(createResponse.data.id, msg.chat.id);
      
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
    
    // Сохраняем chat_id пользователя для уведомлений
    userChatIds.set(defaultUser.id, msg.chat.id);
    
    return defaultUser;
  }
}

// Обработчик команды /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    // Получаем или создаем пользователя
    const user = await getOrCreateUser(msg);
    const userName = user.first_name || 'пользователь';
    
    bot.sendMessage(chatId, `Привет, ${userName}! Я бот для управления задачами TaskDrop. 

🔸 *Как со мной работать:*
1. Используйте команды, начинающиеся со знака / (например, /tasks)
2. Пересылайте мне сообщения, чтобы создать задачи на их основе
3. Нажимайте на кнопки под сообщениями для быстрого доступа

🔸 *Основные команды:*
/tasks - показать список активных задач
/add название задачи - добавить новую задачу
/help - показать информацию о командах
/webapp - открыть веб-приложение

🚀 Нажмите кнопку ниже, чтобы открыть веб-версию приложения:`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Открыть приложение', web_app: { url: webAppUrl } }]
        ]
      }
    });
  } catch (error) {
    console.error('Ошибка при обработке команды /start:', error);
    bot.sendMessage(chatId, 'Произошла ошибка при инициализации. Пожалуйста, попробуйте позже.');
  }
});

// Обработчик команды /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, `📚 *Справка по TaskDrop*

🔸 *Основные команды:*
/tasks - показать список активных задач
/add название - добавить новую задачу (пример: /add Купить молоко)
/help - показать эту справку
/webapp - открыть веб-приложение

🔸 *Создание задач:*
1. Используйте команду /add с текстом задачи
2. Перешлите мне любое сообщение, чтобы создать задачу на его основе

🔸 *Управление задачами:*
- В веб-приложении: полное управление задачами
- В боте: просмотр списка и добавление новых задач

🔸 *Уведомления:*
- Бот автоматически отправит напоминание о приближающихся задачах
- В веб-приложении можно настроить время уведомления 

🚀 Нажмите кнопку ниже, чтобы открыть веб-приложение:`, {
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
  const telegramUserId = msg.from.id;
  
  try {
    // Сохраняем chat_id пользователя для уведомлений
    userChatIds.set(telegramUserId, chatId);
    
    // Сообщаем пользователю, что загружаем задачи
    bot.sendMessage(chatId, 'Загружаю список задач...');
    
    // Делаем запрос к API для получения задач по Telegram ID пользователя
    const response = await axios.get(`${apiUrl}/tasks?user_id=${telegramUserId}`);
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
    // Получаем пользователя
    const user = await getOrCreateUser(msg);
    
    // Отправляем запрос к API для создания новой задачи с корректным ID пользователя
    const response = await axios.post(`${apiUrl}/tasks`, {
      title: taskTitle,
      user_id: user.id, // Используем ID пользователя из базы данных
      done: false
    });
    
    if (response.data && response.data.id) {
      bot.sendMessage(chatId, `✅ Задача "${taskTitle}" успешно добавлена!`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 Посмотреть все задачи', callback_data: 'show_tasks' }],
            [{ text: '🚀 Открыть приложение', web_app: { url: webAppUrl } }]
          ]
        }
      });
    } else {
      throw new Error('Ответ API не содержит ID созданной задачи');
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
  bot.sendMessage(chatId, `Для добавления задачи используйте команду в формате:
  
📝 */add Текст вашей задачи*

*Например:*
/add Купить молоко
/add Позвонить маме в 18:00
/add Подготовить презентацию к понедельнику

После создания задачи вы можете открыть веб-приложение для настройки уведомлений, дат и времени.`, {
    parse_mode: 'Markdown',
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
    
    // Сохраняем пересланное сообщение во временном хранилище с привязкой к chatId
    forwardedMessages[chatId] = msg;
    console.log(`👉 DEBUG: Сохранено пересланное сообщение для chatId: ${chatId}`);
    
    bot.sendMessage(chatId, `Переслано от: ${forwardFrom}\n${msg.text || 'Медиа-контент'}\n\nХотите создать задачу на основе этого сообщения?`, {
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
    bot.sendMessage(chatId, `Я понимаю только команды и пересланные сообщения:

1️⃣ *Команды* начинаются со знака / (например, /help)
2️⃣ *Пересылайте* сообщения, чтобы создать задачи
3️⃣ Используйте *кнопки* для быстрого доступа

Используйте /help для получения списка всех доступных команд.`, {
      parse_mode: 'Markdown',
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
    try {
      // Получаем сохраненное пересланное сообщение
      const forwardedMessage = forwardedMessages[chatId];
      if (!forwardedMessage) {
        console.error(`👉 ❌ Не найдено пересланное сообщение для chatId: ${chatId}`);
        throw new Error('Не удалось найти пересланное сообщение. Пожалуйста, попробуйте снова.');
      }
      
      const taskTitle = forwardedMessage.text || forwardedMessage.caption || 'Задача из Telegram';
      
      console.log(`👉 DEBUG: Обработка пересланного сообщения для создания задачи`);
      console.log(`👉 DEBUG: Данные callbackQuery.from:`, JSON.stringify(callbackQuery.from));
      console.log(`👉 DEBUG: Текст пересланного сообщения:`, taskTitle);
      
      // Получаем пользователя через функцию getOrCreateUser
      const user = await getOrCreateUser({
        chat: { id: chatId },
        from: callbackQuery.from
      });
      
      console.log(`👉 DEBUG: Результат getOrCreateUser:`, JSON.stringify(user));
      console.log(`👉 DEBUG: user_id из getOrCreateUser: ${user.id}`);
      
      // Создаем данные задачи с корректным ID пользователя
      const taskData = {
        user_id: user.id, // Используем ID пользователя из базы данных
        title: taskTitle.substring(0, 100), // Ограничиваем длину заголовка
        description: taskTitle.length > 100 ? taskTitle.substring(100) : '',
        due_date: new Date().toISOString().split('T')[0], // Сегодняшняя дата как срок по умолчанию
        priority: 'medium'
      };
      
      console.log(`👉 DEBUG: Данные для создания задачи:`, JSON.stringify(taskData));
      console.log(`👉 Создание задачи для пользователя: ${user.first_name} (ID: ${user.id})`);
      
      const response = await axios.post(`${apiUrl}/tasks`, taskData);
      
      console.log('👉 DEBUG: Ответ API:', JSON.stringify(response.data));
      console.log(`👉 DEBUG: ID созданной задачи: ${response.data.id}, user_id: ${response.data.user_id}`);
      
      if (response.data && response.data.id) {
        // Очищаем временное хранилище, чтобы избежать повторного создания задачи
        delete forwardedMessages[chatId];
        
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
    // Очищаем временное хранилище, чтобы освободить память
    delete forwardedMessages[chatId];
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
  const telegramUserId = msg.from.id;
  
  // Сохраняем chat_id пользователя для уведомлений
  userChatIds.set(telegramUserId, chatId);
  console.log(`Сохранен chat_id: ${chatId} для пользователя с Telegram ID: ${telegramUserId}`);
  
  // Текущее время для отладки
  const now = new Date();
  const currentTime = now.toLocaleTimeString('ru-RU');
  const currentDate = now.toLocaleDateString('ru-RU');
  
  // Отправляем тестовое уведомление
  let message = `🔔 Тестовое уведомление\n\n`;
  message += `Текущее время: ${currentTime}\n`;
  message += `Текущая дата: ${currentDate}\n\n`;
  message += `Ваш Telegram ID: ${telegramUserId}\n`;
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
  
  console.log("👉 Запуск проверки уведомлений");
  console.log("👉 Зарегистрированные пользователи:", Array.from(userChatIds.entries()));
  
  try {
    // Проверяем каждого пользователя, для которого у нас есть chat_id
    for (const [userId, chatId] of userChatIds.entries()) {
      try {
        console.log(`👉 Проверка задач для пользователя с ID: ${userId}`);
        
        // Получаем задачи для конкретного пользователя
        const response = await axios.get(`${apiUrl}/tasks?user_id=${userId}`);
        const tasks = response.data;
        console.log(`👉 Получено ${tasks.length} задач для пользователя ${userId}`);
        
        // Выводим задачи с уведомлениями для отладки
        const tasksWithNotifications = tasks.filter(task => 
          !task.done && task.due_date && task.due_time && task.notification
        );
        console.log(`👉 Задачи с настроенными уведомлениями для пользователя ${userId}:`, 
          tasksWithNotifications.map(t => ({
            id: t.id,
            title: t.title,
            due_date: t.due_date,
            due_time: t.due_time,
            notification: t.notification
          }))
        );
        
        // Текущая дата и время
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        console.log(`👉 Текущее время: ${currentDate} ${currentHour}:${currentMinute}`);
        
        // Проверяем задачи этого пользователя
        for (const task of tasks) {
          // Пропускаем выполненные задачи
          if (task.done) {
            continue;
          }
          
          // Проверяем только задачи с датой и временем
          if (!task.due_date || !task.due_time || !task.notification) {
            continue;
          }
          
          console.log(`👉 Обрабатываем задачу: "${task.title}" (${task.id}), срок: ${task.due_date} ${task.due_time}, уведомление: ${task.notification}`);
          
          // Разбираем время задачи
          const [taskHour, taskMinute] = task.due_time.split(':').map(Number);
          
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
            
            // Отправляем уведомление пользователю, если знаем его chat_id
            console.log(`👉 Отправка уведомления пользователю с chat_id: ${chatId}`);
            
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
              console.log(`👉 ✅ Уведомление успешно отправлено`);
            }).catch(err => {
              console.error(`👉 ❌ Ошибка при отправке уведомления для задачи ${task.id}:`, err.message);
            });
          }
        }
      } catch (userError) {
        console.error(`❌ Ошибка при проверке задач для пользователя ${userId}:`, userError);
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
    { command: '/force_notification', description: 'Отправить уведомление по ID задачи' }
  ]).then(() => {
    bot.sendMessage(msg.chat.id, 'Команды бота обновлены!');
  }).catch((error) => {
    bot.sendMessage(msg.chat.id, 'Произошла ошибка при обновлении команд: ' + error.message);
  });
});

// Обработчик команды /force_notification - для принудительной отправки уведомлений
bot.onText(/\/force_notification (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const telegramUserId = msg.from.id;
  const taskId = match[1]; // ID задачи из команды /force_notification
  
  console.log(`Пользователь ${msg.from.username || msg.from.first_name} (ID: ${telegramUserId}) запросил уведомление для задачи ${taskId}`);
  
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
    
    // Проверяем, принадлежит ли задача этому пользователю
    if (task.user_id !== telegramUserId) {
      console.log(`Пользователь ${telegramUserId} пытается получить уведомление для задачи пользователя ${task.user_id}`);
      bot.sendMessage(chatId, `❌ Эта задача не принадлежит вам.`);
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
    
    console.log(`Уведомление для задачи ${taskId} отправлено пользователю ${telegramUserId}`);
    
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

console.log('Бот TaskDrop запущен!');