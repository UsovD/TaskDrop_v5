import React, { useState, useEffect, useRef } from 'react';
import { Plus, Calendar, Flag, Paperclip, Clock, Star, ChevronLeft, ChevronRight, X, Bell } from 'lucide-react';

interface AddTaskButtonProps {
  onClick: () => void;
  onClose?: () => void;
  isExpanded?: boolean;
  onAddTask?: (title: string, date?: Date, time?: string) => void;
}

const DAYS_OF_WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export const AddTaskButton: React.FC<AddTaskButtonProps> = ({ 
  onClick, 
  onClose, 
  isExpanded = false,
  onAddTask 
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showNotificationPicker, setShowNotificationPicker] = useState(false);
  const [notification, setNotification] = useState<string>('');
  const [taskTitle, setTaskTitle] = useState('');
  const formRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const handleDateSelect = (date: Date | null) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };

  const handleSubmitTask = () => {
    if (taskTitle.trim()) {
      if (onAddTask) {
        onAddTask(taskTitle, selectedDate || undefined, selectedTime || undefined);
        setTaskTitle('');
      }
      onClose?.();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDatePicker && calendarRef.current?.contains(event.target as Node)) {
        return;
      }
      
      if (isExpanded &&
          formRef.current &&
          !formRef.current.contains(event.target as Node) &&
          !calendarRef.current?.contains(event.target as Node)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded, onClose, showDatePicker]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const formatDate = (date: Date) => {
    if (isToday(date)) {
      return 'Сегодня';
    }
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long'
    });
  };

  const handleCancel = () => {
    onClose?.();
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const formatTime = (time: string) => {
    return time || '--:--';
  };

  const formatNotification = (notification: string) => {
    return notification || 'Укажите время';
  };

  const renderDatePicker = () => {
    if (!showDatePicker) return null;

    return (
      <div 
        ref={calendarRef}
        className="fixed inset-0 bg-black z-50 animate-in slide-in-from-bottom duration-300 flex flex-col"
        style={{ height: '100dvh' }}
      >
        {/* Header */}
        <div className="flex items-center h-10 px-4 border-b border-zinc-800/50">
          <button 
            onClick={() => setShowDatePicker(false)}
            className="w-7 h-7 -ml-2 flex items-center justify-center text-zinc-400"
          >
            <X size={16} />
          </button>
          <span className="flex-1 text-center text-xs font-medium text-white">Выберите дату</span>
          <div className="w-7" />
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between px-4 py-1.5">
          <button 
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} 
            className="w-7 h-7 flex items-center justify-center text-zinc-400"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="text-xs text-white font-medium">
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </div>
          <button 
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} 
            className="w-7 h-7 flex items-center justify-center text-zinc-400"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Calendar */}
        <div className="flex-1 flex flex-col min-h-0 px-1 max-h-[200px]">
          {/* Days of Week */}
          <div className="grid grid-cols-7">
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="text-center text-[10px] text-zinc-400 py-0.5">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: 42 }, (_, i) => {
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1 - new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() + i + 1);
              const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
              const isSelected = date.toDateString() === selectedDate?.toDateString();
              const isToday = date.toDateString() === new Date().toDateString();
              const isPast = isPastDate(date);

              return (
                <button
                  key={i}
                  onClick={() => !isPast && handleDateSelect(date)}
                  disabled={isPast}
                  className={`
                    relative h-6 flex items-center justify-center text-[10px]
                    ${isCurrentMonth ? (isPast ? 'text-zinc-700' : 'text-white') : 'text-zinc-600'}
                    ${isSelected ? 'bg-blue-500 rounded-full' : ''}
                    ${!isPast && !isSelected && 'hover:bg-zinc-800 rounded-full'}
                    ${isPast && 'cursor-not-allowed'}
                  `}
                >
                  {date.getDate()}
                  {isToday && !isSelected && (
                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-0.5 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-2 space-y-1.5">
          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => setSelectedDate(null)}
              className="py-1 text-blue-400 text-[10px] text-center bg-zinc-800/50 rounded-md font-medium active:bg-zinc-700"
            >
              Очистить
            </button>
            <button
              onClick={() => handleDateSelect(new Date())}
              className="py-1 text-blue-400 text-[10px] text-center bg-zinc-800/50 rounded-md font-medium active:bg-zinc-700"
            >
              Сегодня
            </button>
            <button
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                handleDateSelect(tomorrow);
              }}
              className="py-1 text-blue-400 text-[10px] text-center bg-zinc-800/50 rounded-md font-medium active:bg-zinc-700"
            >
              Завтра
            </button>
          </div>

          {/* Time and Notifications */}
          <div className="space-y-1 border-t border-zinc-800/50 pt-1.5">
            <button 
              onClick={() => {
                setShowTimePicker(true);
                setShowDatePicker(false);
              }}
              className="w-full flex items-center justify-between py-1 px-2 text-zinc-400"
            >
              <div className="flex items-center gap-1.5">
                <Clock size={14} />
                <span className="text-[10px]">Время</span>
              </div>
              <span className="text-[10px] text-zinc-600">{formatTime(selectedTime)}</span>
            </button>
            <button 
              onClick={() => {
                setShowNotificationPicker(true);
                setShowDatePicker(false);
              }}
              className="w-full flex items-center justify-between py-1 px-2 text-zinc-400"
            >
              <div className="flex items-center gap-1.5">
                <Bell size={14} />
                <span className="text-[10px]">Уведомления</span>
              </div>
              <span className="text-[10px] text-zinc-600">{formatNotification(notification)}</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setShowDatePicker(false)}
              className="flex-1 py-1 text-blue-400 text-[10px] font-medium"
            >
              Отменить
            </button>
            <button
              onClick={() => {
                handleDateSelect(selectedDate);
              }}
              className="flex-1 py-1 bg-blue-500 text-white text-[10px] font-medium rounded-md"
            >
              Применить
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTimePicker = () => {
    if (!showTimePicker) return null;

    return (
      <div 
        className="fixed inset-0 bg-black z-50 animate-in slide-in-from-bottom duration-300"
        style={{ height: '100dvh' }}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center h-14 px-4 border-b border-zinc-800">
            <button 
              onClick={() => {
                setShowTimePicker(false);
                setShowDatePicker(true);
              }}
              className="w-10 h-10 -ml-2 flex items-center justify-center text-zinc-400"
            >
              <X size={24} />
            </button>
            <span className="flex-1 text-center text-lg font-medium text-white">Выберите время</span>
            <div className="w-10" />
          </div>

          <div className="flex-1 p-4">
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full bg-zinc-800 text-white text-center py-3 rounded-xl"
            />
          </div>

          <div className="p-4">
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTimePicker(false);
                  setShowDatePicker(true);
                }}
                className="flex-1 py-3 text-blue-400 font-medium"
              >
                Отменить
              </button>
              <button
                onClick={() => {
                  setShowTimePicker(false);
                  setShowDatePicker(true);
                }}
                className="flex-1 py-3 bg-blue-500 text-white font-medium rounded-xl"
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNotificationPicker = () => {
    if (!showNotificationPicker) return null;

    const notifications = [
      'За 5 минут',
      'За 10 минут',
      'За 15 минут',
      'За 30 минут',
      'За 1 час',
      'За 2 часа',
      'За день'
    ];

    return (
      <div 
        className="fixed inset-0 bg-black z-50 animate-in slide-in-from-bottom duration-300"
        style={{ height: '100dvh' }}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center h-14 px-4 border-b border-zinc-800">
            <button 
              onClick={() => {
                setShowNotificationPicker(false);
                setShowDatePicker(true);
              }}
              className="w-10 h-10 -ml-2 flex items-center justify-center text-zinc-400"
            >
              <X size={24} />
            </button>
            <span className="flex-1 text-center text-lg font-medium text-white">Уведомления</span>
            <div className="w-10" />
          </div>

          <div className="flex-1 p-4">
            <div className="space-y-2">
              {notifications.map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    setNotification(n);
                    setShowNotificationPicker(false);
                    setShowDatePicker(true);
                  }}
                  className="w-full text-left py-3 px-4 text-white hover:bg-zinc-800 rounded-xl"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4">
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNotificationPicker(false);
                  setShowDatePicker(true);
                }}
                className="flex-1 py-3 text-blue-400 font-medium"
              >
                Отменить
              </button>
              <button
                onClick={() => {
                  setShowNotificationPicker(false);
                  setShowDatePicker(true);
                }}
                className="flex-1 py-3 bg-blue-500 text-white font-medium rounded-xl"
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isExpanded) {
    return (
      <>
        <div ref={formRef} className="bg-zinc-800/90 backdrop-blur-sm rounded-2xl p-4 space-y-4 transform transition-all duration-200 ease-out">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Добавить задачу"
              className="flex-1 bg-transparent text-white border-none outline-none text-lg placeholder:text-zinc-500"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(true)}
              className="flex items-center text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <Calendar size={16} className="mr-2" />
              <span>{formatDate(selectedDate || new Date())}</span>
            </button>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-700 pt-4">
            <div className="flex items-center space-x-4">
              <button className="text-zinc-400 hover:text-white transition-colors">
                <Flag size={20} />
              </button>
              <button className="text-zinc-400 hover:text-white transition-colors">
                <Paperclip size={20} />
              </button>
              <button className="text-zinc-400 hover:text-white transition-colors">
                <Clock size={20} />
              </button>
              <button className="text-zinc-400 hover:text-white transition-colors">
                <Star size={20} />
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleCancel}
                className="px-3 py-1 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Отмена
              </button>
              <button 
                onClick={handleSubmitTask}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 transition-colors"
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
        {renderDatePicker()}
        {renderTimePicker()}
        {renderNotificationPicker()}
      </>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full bg-zinc-800/50 backdrop-blur-sm hover:bg-zinc-800/70 transition-all duration-200 rounded-2xl px-4 py-3 flex items-center text-zinc-400 hover:text-white"
    >
      <Plus size={20} className="mr-2" />
      <span>Добавить задачу</span>
    </button>
  );
}; 