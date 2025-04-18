const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

// Токен API для бота
const token = process.env.TELEGRAM_BOT_TOKEN;
// URL API для доступа к данным о задачах
const apiUrl = process.env.API_URL;
// URL веб-приложения
const webAppUrl = process.env.WEBAPP_URL;

// Создаем экземпляр бота
const bot = new TelegramBot(token, { polling: true });

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || 'пользователь';
  
  bot.sendMessage(chatId, `Привет, ${userName}! Я бот для управления задачами TaskDrop. Вот что я умею:
  
/tasks - показать список активных задач
/add - добавить новую задачу
/help - показать информацию о командах
/webapp - открыть веб-приложение`, {
    parse_mode: 'Markdown'
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
    parse_mode: 'Markdown'
  });
});

// Обработчик команды /webapp - отправляет ссылку на веб-приложение
bot.onText(/\/webapp/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, 'Нажмите на кнопку ниже, чтобы открыть веб-приложение TaskDrop:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Открыть TaskDrop', web_app: { url: webAppUrl } }]
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
      bot.sendMessage(chatId, 'У вас пока нет активных задач.');
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
          [{ text: 'Открыть в приложении', web_app: { url: webAppUrl } }]
        ]
      }
    });
  } catch (error) {
    console.error('Ошибка при получении задач:', error);
    bot.sendMessage(chatId, 'Произошла ошибка при получении задач. Пожалуйста, попробуйте позже.');
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
            [{ text: 'Посмотреть все задачи', callback_data: 'show_tasks' }]
          ]
        }
      });
    } else {
      throw new Error('Ответ API не содержит подтверждения успешного создания задачи');
    }
  } catch (error) {
    console.error('Ошибка при создании задачи:', error);
    bot.sendMessage(chatId, 'Произошла ошибка при добавлении задачи. Пожалуйста, попробуйте позже.');
  }
});

// Обработчик простой команды добавления задачи без параметров
bot.onText(/^\/add$/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Пожалуйста, укажите текст задачи: /add Название задачи');
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
  }
  
  // Обязательно ответить на callback запрос
  bot.answerCallbackQuery(callbackQuery.id);
});

// Обработчик всех остальных сообщений
bot.on('message', (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    const chatId = msg.chat.id;
    
    bot.sendMessage(chatId, 'Я понимаю только команды. Используйте /help для получения списка команд.');
  }
});

console.log('Бот TaskDrop запущен!'); 