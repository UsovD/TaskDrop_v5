import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Bell, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

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
  const state = location.state as { initialDate?: string, initialTime?: string, initialNotification?: string, fromAddTask?: boolean } || {};
  
  const initialDate = state.initialDate ? new Date(state.initialDate) : new Date();
  const fromAddTask = state.fromAddTask || false;
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string>(state.initialTime || '');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<string>(state.initialNotification || '');
  const [showNotificationPicker, setShowNotificationPicker] = useState(false);
  
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

  // Функция для применения выбранной даты
  const handleApply = () => {
    if (fromAddTask) {
      navigate('/', { 
        state: { 
          selectedDate: selectedDate?.toISOString(),
          selectedTime,
          selectedNotification: selectedNotification,
        } 
      });
    } else {
      navigate('/', { 
        state: { 
          selectedDate: selectedDate?.toISOString(),
          selectedTime,
          selectedNotification,
          expandAddTask: true
        } 
      });
    }
  };

  // Функция для возврата назад
  const handleBack = () => {
    navigate('/');
  };

  // Отображение времени
  const formatTime = (time: string) => {
    return time || '--:--';
  };

  // Отображение уведомления
  const formatNotification = (notification: string) => {
    return notification || 'Укажите время';
  };

  // Рендер выбора времени
  const renderTimePicker = () => {
    if (!showTimePicker) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-in fade-in duration-200">
        <div className="bg-black w-full max-w-md rounded-xl overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col shadow-xl mx-auto my-auto">
          {/* Header */}
          <div className="flex items-center h-12 px-4 border-b border-zinc-800/50">
            <button 
              onClick={() => setShowTimePicker(false)}
              className="w-8 h-8 flex items-center justify-center text-zinc-400"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="flex-1 text-center text-sm font-medium text-white">Выберите время</span>
            <div className="w-8"></div>
          </div>

          <div className="p-6 flex items-center justify-center">
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full bg-zinc-800/70 text-white text-center py-4 rounded-xl text-xl"
            />
          </div>

          <div className="p-4 border-t border-zinc-800/50">
            <div className="flex gap-3">
              <button
                onClick={() => setShowTimePicker(false)}
                className="flex-1 py-3 text-blue-400 text-sm font-medium"
              >
                Отменить
              </button>
              <button
                onClick={() => setShowTimePicker(false)}
                className="flex-1 py-3 bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors hover:bg-blue-600 active:bg-blue-700"
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Рендер выбора уведомлений
  const renderNotificationPicker = () => {
    if (!showNotificationPicker) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-in fade-in duration-200">
        <div className="bg-black w-full max-w-md rounded-xl overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col shadow-xl mx-auto my-auto">
          <div className="flex items-center h-12 px-4 border-b border-zinc-800/50">
            <button 
              onClick={() => setShowNotificationPicker(false)}
              className="w-8 h-8 flex items-center justify-center text-zinc-400"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="flex-1 text-center text-sm font-medium text-white">Уведомления</span>
            <div className="w-8"></div>
          </div>

          <div className="p-4 max-h-[300px] overflow-y-auto">
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

          <div className="p-4 border-t border-zinc-800/50">
            <div className="flex gap-3">
              <button
                onClick={() => setShowNotificationPicker(false)}
                className="flex-1 py-3 text-blue-400 text-sm font-medium"
              >
                Отменить
              </button>
              <button
                onClick={() => setShowNotificationPicker(false)}
                className="flex-1 py-3 bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors hover:bg-blue-600 active:bg-blue-700"
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app bg-black min-h-screen text-white">
      {/* Верхняя панель навигации */}
      <div className="flex items-center p-4 border-b border-zinc-800">
        <button 
          onClick={handleBack}
          className="w-8 h-8 flex items-center justify-center text-zinc-400"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="flex-1 text-center text-white font-medium">Выбор даты</span>
        <div className="w-8"></div>
      </div>

      <div className="p-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} 
            className="w-8 h-8 flex items-center justify-center text-zinc-400"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-base text-white font-medium">
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </div>
          <button 
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} 
            className="w-8 h-8 flex items-center justify-center text-zinc-400"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className="text-center text-xs text-zinc-400 py-2 font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 42 }, (_, i) => {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1 - new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() + i + 1);
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const isSelected = date.toDateString() === selectedDate?.toDateString();
            const isCurrentDate = isToday(date);
            const isPast = isPastDate(date);

            return (
              <div key={i} className="aspect-square flex items-center justify-center">
                <button
                  onClick={() => !isPast && handleDateSelect(date)}
                  disabled={isPast}
                  className={`
                    relative w-14 h-14 rounded-full flex items-center justify-center text-base
                    ${!isCurrentMonth ? 'text-zinc-700' : ''}
                    ${isCurrentMonth && isPast ? 'text-zinc-700' : ''}
                    ${isCurrentMonth && !isPast && !isSelected ? 'text-white' : ''}
                    ${isSelected ? 'bg-blue-500 text-white' : ''}
                    ${isCurrentDate && !isSelected ? 'text-blue-400' : ''}
                    ${!isPast && !isSelected ? 'hover:bg-zinc-800 active:bg-zinc-700' : ''}
                    ${isPast ? 'cursor-not-allowed' : ''}
                  `}
                >
                  {date.getDate()}
                  {isCurrentDate && !isSelected && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2 mt-6 border-t border-zinc-800 pt-6">
          <button
            onClick={() => setSelectedDate(null)}
            className="flex items-center justify-center gap-1.5 py-3 text-blue-400 text-sm bg-zinc-800/70 rounded-lg"
          >
            <span>Очистить</span>
          </button>
          <button
            onClick={() => handleDateSelect(new Date())}
            className="flex items-center justify-center gap-1.5 py-3 text-blue-400 text-sm bg-zinc-800/70 rounded-lg"
          >
            <span>Сегодня</span>
          </button>
          <button
            onClick={() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              handleDateSelect(tomorrow);
            }}
            className="flex items-center justify-center gap-1.5 py-3 text-blue-400 text-sm bg-zinc-800/70 rounded-lg"
          >
            <span>Завтра</span>
          </button>
        </div>

        {/* Time and Notifications */}
        <div className="space-y-0 mt-4 border-t border-zinc-800/50">
          <button 
            onClick={() => setShowTimePicker(true)}
            className="w-full flex items-center justify-between py-4 text-zinc-400 border-b border-zinc-800/50"
          >
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-zinc-400" />
              <span className="text-sm">Время</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${selectedTime ? 'text-white' : 'text-zinc-600'}`}>
                {formatTime(selectedTime)}
              </span>
              {selectedTime && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTime('');
                  }}
                  className="p-1 text-zinc-500 hover:text-zinc-300"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </button>

          <button 
            onClick={() => setShowNotificationPicker(true)}
            className="w-full flex items-center justify-between py-4 text-zinc-400"
          >
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-zinc-400" />
              <span className="text-sm">Уведомления</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${selectedNotification ? 'text-white' : 'text-zinc-600'}`}>
                {formatNotification(selectedNotification)}
              </span>
              {selectedNotification && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNotification('');
                  }}
                  className="p-1 text-zinc-500 hover:text-zinc-300"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black border-t border-zinc-800">
        <div className="flex gap-3">
          <button
            onClick={handleBack}
            className="flex-1 py-3.5 text-blue-400 text-sm font-medium"
          >
            Отменить
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-3.5 bg-blue-500 text-white text-sm font-medium rounded-xl"
          >
            Применить
          </button>
        </div>
      </div>

      {renderTimePicker()}
      {renderNotificationPicker()}
    </div>
  );
}; 