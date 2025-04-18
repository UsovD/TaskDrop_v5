// Функция для проверки и отправки уведомлений
async function checkNotifications() {
  if (isShuttingDown) return;
  
  console.log("👉 Запуск проверки уведомлений");
  console.log("👉 Зарегистрированные пользователи:", Array.from(userChatIds.entries()));
  
  try {
    // Получаем все активные задачи
    console.log("👉 Запрос задач с API:", `${apiUrl}/tasks?user_id=1`);
    const response = await axios.get(`${apiUrl}/tasks?user_id=1`);
    const tasks = response.data;
    console.log(`👉 Получено задач: ${tasks.length}`);
    
    // Выводим задачи с уведомлениями для отладки
    const tasksWithNotifications = tasks.filter(task => 
      !task.done && task.due_date && task.due_time && task.notification
    );
    console.log(`👉 Задачи с настроенными уведомлениями:`, 
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
    
    // Фильтруем задачи, которые нужно напомнить
    for (const task of tasks) {
      // Пропускаем выполненные задачи
      if (task.done) {
        console.log(`👉 Задача "${task.title}" (${task.id}) пропущена - уже выполнена`);
        continue;
      }
      
      // Проверяем только задачи с датой и временем
      if (!task.due_date || !task.due_time || !task.notification) {
        console.log(`👉 Задача "${task.title}" (${task.id}) пропущена - отсутствует дата, время или уведомление`);
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
        const userId = task.user_id || 1;
        const chatId = userChatIds.get(userId);
        
        if (chatId) {
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
        } else {
          console.log(`👉 ❌ Нет зарегистрированного chat_id для пользователя с ID ${userId}`);
        }
      } else {
        console.log(`👉 ❌ Время не совпадает, уведомление не отправляем`);
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

// Обработчик команды /notification для тестирования отправки уведомлений
bot.onText(/\/notification/, (msg) => {
  const chatId = msg.chat.id;
  
  // Сохраняем chat_id пользователя
  userChatIds.set(1, chatId);
  console.log(`👉 Сохранен chat_id ${chatId} для пользователя 1`);
  
  // Отправляем тестовое уведомление
  bot.sendMessage(chatId, "⏱️ Отправка тестового уведомления...");
  
  // Создаем тестовую задачу для проверки
  const now = new Date();
  const testTask = {
    id: "test-" + Date.now(),
    title: "Тестовая задача",
    description: "Проверка системы уведомлений",
    due_date: now.toISOString().split('T')[0],
    due_time: `${now.getHours()}:${now.getMinutes()}`,
    notification: "За 5 минут",
    user_id: 1
  };
  
  // Отображаем инфо о тестовой задаче
  let message = `🔔 Тестовое уведомление!\n\n`;
  message += `${testTask.title}\n`;
  message += `${testTask.description}\n\n`;
  message += `📅 Срок: ${testTask.due_date}\n`;
  message += `⏰ Время: ${testTask.due_time}\n`;
  
  // Пробуем отправить уведомление
  bot.sendMessage(chatId, message, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '✅ Отметить выполненной', callback_data: `test_notification` }],
        [{ text: '🚀 Открыть приложение', web_app: { url: webAppUrl } }]
      ]
    }
  }).then(() => {
    console.log(`👉 ✅ Тестовое уведомление успешно отправлено пользователю ${chatId}`);
    bot.sendMessage(chatId, "✅ Тестовое уведомление успешно отправлено. Система уведомлений работает правильно!");
  }).catch(err => {
    console.error(`👉 ❌ Ошибка при отправке тестового уведомления:`, err);
    bot.sendMessage(chatId, `❌ Ошибка при отправке тестового уведомления: ${err.message}`);
  });
});

// Обработчик команды /force_notification для принудительной отправки уведомления о задаче
bot.onText(/\/force_notification (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const taskId = match[1]; // ID задачи из команды
  
  // Сохраняем chat_id пользователя
  userChatIds.set(1, chatId);
  console.log(`👉 Сохранен chat_id ${chatId} для пользователя 1`);
  
  try {
    // Получаем данные задачи
    const response = await axios.get(`${apiUrl}/tasks/${taskId}`);
    const task = response.data;
    
    if (!task) {
      bot.sendMessage(chatId, `❌ Задача с ID ${taskId} не найдена`);
      return;
    }
    
    console.log(`👉 Принудительная отправка уведомления для задачи:`, task);
    
    // Отправляем уведомление
    let message = `🔔 Напоминание о задаче!\n\n`;
    message += `${task.title}\n`;
    
    if (task.description) {
      message += `${task.description}\n\n`;
    }
    
    if (task.due_date) message += `📅 Срок: ${task.due_date}\n`;
    if (task.due_time) message += `⏰ Время: ${task.due_time}\n`;
    
    bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Отметить выполненной', callback_data: `complete_task_${task.id}` }],
          [{ text: '🚀 Открыть в приложении', web_app: { url: `${webAppUrl}/edit-task/${task.id}` } }]
        ]
      }
    });
    
    bot.sendMessage(chatId, `✅ Уведомление для задачи "${task.title}" отправлено принудительно`);
  } catch (error) {
    console.error('Ошибка при получении задачи:', error);
    bot.sendMessage(chatId, `❌ Произошла ошибка: ${error.message}`);
  }
});

// Обработчик простой команды без ID задачи
bot.onText(/^\/force_notification$/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Пожалуйста, укажите ID задачи: /force_notification ID_ЗАДАЧИ');
});

// Обновляем команды бота
bot.onText(/\/command/, (msg) => {
  // Установка команд для бота
  bot.setMyCommands([
    { command: '/start', description: 'Начать работу с ботом' },
    { command: '/help', description: 'Показать список команд' },
    { command: '/tasks', description: 'Показать список задач' },
    { command: '/add', description: 'Добавить новую задачу' },
    { command: '/webapp', description: 'Открыть веб-приложение' },
    { command: '/test', description: 'Проверить уведомления' },
    { command: '/notification', description: 'Отправить тестовое уведомление' },
    { command: '/force_notification', description: 'Принудительно отправить уведомление о задаче' }
  ]).then(() => {
    bot.sendMessage(msg.chat.id, 'Команды бота обновлены!');
  }).catch((error) => {
    bot.sendMessage(msg.chat.id, 'Произошла ошибка при обновлении команд: ' + error.message);
  });
}); 