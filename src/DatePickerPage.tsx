import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Bell, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from './api/client';
import { ApiTask } from './api/client';

const DAYS_OF_WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const NOTIFICATION_OPTIONS = [
  'За 5 минут',
  'За 10 минут',
  'За 15 минут',
  'За 30 минут',
  'За 1 час',
  'За 2 часа',
  'За день'
];

export const DatePickerPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { 
    initialDate?: string, 
    initialTime?: string, 
    initialNotification?: string, 
    fromAddTask?: boolean,
    taskId?: string,
    taskTitle?: string
  } || {};
  
  const initialDate = state.initialDate ? new Date(state.initialDate) : new Date();
  const taskId = state.taskId;
  const taskTitle = state.taskTitle || '';
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string>(state.initialTime || '');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<string>(state.initialNotification || '');
  const [showNotificationPicker, setShowNotificationPicker] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  // Функция для определения, является ли дата текущим днем
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Функция для определения, является ли дата прошедшей
  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Обработчик выбора даты
  const handleDateSelect = (date: Date) => {
    if (isPastDate(date)) return;
    setSelectedDate(date);
  };

  // Функция для возврата назад с анимацией
  const handleBack = () => {
    setIsExiting(true);
    setTimeout(() => {
      navigate(-1);
    }, 70);
  };

  // Функция для применения выбранной даты с анимацией
  const handleApply = async () => {
    setIsExiting(true);
    
    try {
      // Если есть ID задачи, обновляем её
      if (taskId) {
        console.log('Обрабатываем выбор даты для задачи с ID:', taskId);
        
        // Корректируем дату для правильной обработки часового пояса
        let dateStr = undefined;
        if (selectedDate) {
          // Получаем локальную дату без учета времени
          const year = selectedDate.getFullYear();
          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
          const day = String(selectedDate.getDate()).padStart(2, '0');
          dateStr = `${year}-${month}-${day}`;
          console.log('Форматированная дата для отправки:', dateStr);
        }
        
        // Создаем объект с обновленными данными
        const updatedTask: Partial<Omit<ApiTask, "id" | "created_at">> = {
          due_date: dateStr,
          due_time: selectedTime || undefined,
          notification: selectedNotification || undefined
        };
        
        console.log('Данные для обновления задачи:', updatedTask);
        
        // Напрямую отправляем запрос на обновление задачи
        try {
          const result = await apiClient.updateTask(String(taskId), updatedTask);
          console.log('Задача успешно обновлена на сервере:', result);
          
          // Устанавливаем таймаут для анимации и используем navigate вместо window.location
          setTimeout(() => {
            console.log(`Перенаправляем на страницу редактирования задачи: /edit-task/${taskId}`);
            // Направляем пользователя обратно на страницу редактирования задачи
            navigate(`/edit-task/${taskId}`, { 
              replace: true, // Заменяем текущую страницу в истории
              state: { 
                forceRefresh: Date.now(), // Добавляем случайный параметр для принудительного обновления
                // Передаем обновленные данные для формы
                selectedDate: selectedDate ? dateStr : undefined,
                selectedTime: selectedTime || undefined,
                selectedNotification: selectedNotification || undefined
              }
            });
          }, 70);
        } catch (err) {
          console.error('Ошибка при обновлении задачи:', err);
          alert('Не удалось обновить дату. Пожалуйста, попробуйте снова.');
          
          // Даже при ошибке возвращаемся на страницу редактирования
          setTimeout(() => {
            console.log(`При ошибке перенаправляем на: /edit-task/${taskId}`);
            navigate(`/edit-task/${taskId}`, { 
              replace: true,
              state: { 
                forceRefresh: Date.now(),
                error: 'Не удалось обновить дату задачи, но вы можете попробовать снова'
              } 
            });
          }, 70);
        }
      } else {
        // Если нет ID задачи, возвращаемся на главную с параметрами для создания новой задачи
        setTimeout(() => {
          navigate('/', { 
            state: { 
              selectedDate: selectedDate?.toISOString(),
              selectedTime,
              selectedNotification,
              expandAddTask: true,
              taskTitle
            } 
          });
        }, 70);
      }
    } catch (error) {
      console.error('Ошибка при сохранении даты:', error);
      alert('Произошла ошибка при сохранении. Пожалуйста, попробуйте снова.');
      setIsExiting(false);
    }
  };

  // Отображение времени
  const formatTime = (time: string) => {
    return time || '--:--';
  };

  // Отображение уведомления
  const formatNotification = (notification: string) => {
    return notification || 'Укажите время';
  };

  // Получение дней для текущего месяца
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // День недели первого числа месяца (0 - воскресенье, 1 - понедельник и т.д.)
    // Преобразуем к формату, где 0 - понедельник, 6 - воскресенье
    let firstDayOfWeek = firstDay.getDay() - 1;
    if (firstDayOfWeek < 0) firstDayOfWeek = 6; // Если воскресенье (было 0), делаем его 6
    
    const days = [];
    
    // Добавляем дни из предыдущего месяца
    if (firstDayOfWeek > 0) {
      const prevMonthLastDay = new Date(year, month, 0);
      const prevMonthDays = prevMonthLastDay.getDate();
      
      for (let i = 0; i < firstDayOfWeek; i++) {
        days.push({
          date: new Date(year, month - 1, prevMonthDays - firstDayOfWeek + i + 1),
          isCurrentMonth: false
        });
      }
    }
    
    // Добавляем дни текущего месяца
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Добавляем дни следующего месяца, чтобы заполнить последнюю неделю
    const totalDaysVisible = Math.ceil((firstDayOfWeek + lastDay.getDate()) / 7) * 7;
    const nextMonthDays = totalDaysVisible - days.length;
    
    for (let i = 1; i <= nextMonthDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  // Переключение на предыдущий месяц
  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      const prevMonth = new Date(prev);
      prevMonth.setMonth(prev.getMonth() - 1);
      return prevMonth;
    });
  };

  // Переключение на следующий месяц
  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      const nextMonth = new Date(prev);
      nextMonth.setMonth(prev.getMonth() + 1);
      return nextMonth;
    });
  };

  // Выбор сегодняшней даты
  const handleSelectToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today);
  };

  // Выбор завтрашней даты
  const handleSelectTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow);
    setCurrentMonth(tomorrow);
  };

  // Очистка выбора даты
  const handleClearSelection = () => {
    setSelectedDate(null);
    setSelectedTime('');
    setSelectedNotification('');
  };

  // Рендер выбора времени
  const renderTimePicker = () => {
    if (!showTimePicker) return null;

    return (
      <div className="time-picker-modal">
        <div className="picker-modal-content">
          <div className="picker-modal-header">
            <button 
              onClick={() => setShowTimePicker(false)}
              className="w-8 h-8 flex items-center justify-center text-zinc-400"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="flex-1 text-center text-sm font-medium text-white">Выберите время</span>
            <div className="w-8"></div>
          </div>

          <div className="picker-modal-body">
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full bg-zinc-800/70 text-white text-center py-4 rounded-xl text-xl"
            />
          </div>

          <div className="picker-modal-footer">
            <button
              onClick={() => setShowTimePicker(false)}
              className="flex-1 py-3 text-blue-400 text-sm font-medium"
            >
              Отменить
            </button>
            <button
              onClick={() => setShowTimePicker(false)}
              className="flex-1 py-3 bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Применить
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Рендер выбора уведомлений
  const renderNotificationPicker = () => {
    if (!showNotificationPicker) return null;

    return (
      <div className="notification-picker-modal">
        <div className="picker-modal-content">
          <div className="picker-modal-header">
            <button 
              onClick={() => setShowNotificationPicker(false)}
              className="w-8 h-8 flex items-center justify-center text-zinc-400"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="flex-1 text-center text-sm font-medium text-white">Уведомления</span>
            <div className="w-8"></div>
          </div>

          <div className="picker-modal-body max-h-[300px] overflow-y-auto">
            <div className="space-y-2">
              {NOTIFICATION_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setSelectedNotification(option);
                    setShowNotificationPicker(false);
                  }}
                  className={`
                    w-full text-left py-3 px-4 text-white text-sm rounded-xl transition-colors
                    ${selectedNotification === option ? 'bg-blue-500' : 'hover:bg-zinc-800/70 active:bg-zinc-700'}
                  `}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Получаем дни для сетки календаря
  const daysInMonth = getDaysInMonth();

  return (
    <div className={`date-picker-page ${isExiting ? 'date-picker-fade-out' : 'date-picker-fade-in'}`}>
      {/* Заголовок */}
      <div className="header">
        <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center rounded-full">
          <ChevronLeft size={24} color="#fff" />
        </button>
        <h1 className="text-xl font-medium text-white">Выбор даты</h1>
        <div className="w-10"></div>
      </div>
      
      {/* Навигация месяцев */}
      <div className="month-navigation">
        <button onClick={handlePrevMonth} className="w-8 h-8 flex items-center justify-center">
          <ChevronLeft size={20} color="#fff" />
        </button>
        <span className="text-lg font-medium text-white">
          {`${MONTHS[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`}
        </span>
        <button onClick={handleNextMonth} className="w-8 h-8 flex items-center justify-center">
          <ChevronRight size={20} color="#fff" />
        </button>
      </div>

      {/* Дни недели */}
      <div className="calendar-grid">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="day-header text-zinc-400">
            {day}
          </div>
        ))}
        
        {/* Даты */}
        {daysInMonth.map((day, index) => (
          <button
            key={index}
            disabled={isPastDate(day.date)}
            onClick={() => handleDateSelect(day.date)}
            className={`date-cell ${
              !day.isCurrentMonth 
                ? 'text-zinc-600' 
                : isPastDate(day.date) 
                  ? 'text-zinc-700' 
                  : isToday(day.date) 
                    ? 'text-blue-400 font-bold' 
                    : 'text-white'
            } ${
              selectedDate && 
              selectedDate.getDate() === day.date.getDate() &&
              selectedDate.getMonth() === day.date.getMonth() &&
              selectedDate.getFullYear() === day.date.getFullYear()
                ? 'bg-blue-500 text-white'
                : ''
            }`}
          >
            {day.date.getDate()}
          </button>
        ))}
      </div>

      {/* Кнопки быстрого выбора */}
      <div className="quick-buttons">
        <button onClick={handleClearSelection}>Очистить</button>
        <button onClick={handleSelectToday}>Сегодня</button>
        <button onClick={handleSelectTomorrow}>Завтра</button>
      </div>

      {/* Выбор времени */}
      <div className="time-section" onClick={() => setShowTimePicker(true)}>
        <Clock size={20} className="section-icon" />
        <div className="section-content">
          <div className="text-white">Время</div>
          <div className="text-zinc-400">{formatTime(selectedTime)}</div>
        </div>
      </div>

      {/* Уведомления */}
      <div className="notification-section" onClick={() => setShowNotificationPicker(true)}>
        <Bell size={20} className="section-icon" />
        <div className="section-content">
          <div className="text-white">Уведомить</div>
          <div className="text-zinc-400">{formatNotification(selectedNotification)}</div>
        </div>
      </div>

      {/* Кнопка сохранения */}
      <button className="save-button" onClick={handleApply}>
        Сохранить
      </button>

      {/* Модальные окна */}
      {renderTimePicker()}
      {renderNotificationPicker()}
    </div>
  );
}; 