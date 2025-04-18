import React, { useState, useEffect, useRef } from 'react';
import { Plus, Calendar, Flag, Paperclip, Clock, Star, ChevronLeft, ChevronRight, X, Bell, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface AddTaskButtonProps {
  onClick: () => void;
  onClose?: () => void;
  isExpanded?: boolean;
  onAddTask?: (title: string, date?: Date, time?: string) => void;
  initialTask?: {
    id?: string;
    title: string;
    date?: Date;
    time?: string;
    notification?: string;
  };
  onEditTask?: (id: string, title: string, date?: Date, time?: string, notification?: string) => void;
  isEditing?: boolean;
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
  onAddTask,
  initialTask,
  onEditTask,
  isEditing = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Получаем выбранную дату из состояния маршрутизации (если она была передана)
  const locationState = location.state as { 
    selectedDate?: string, 
    selectedTime?: string, 
    selectedNotification?: string,
    taskTitle?: string
  } || {};
  const returnedDate = locationState.selectedDate ? new Date(locationState.selectedDate) : null;
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialTask?.date || new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showNotificationPicker, setShowNotificationPicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>(initialTask?.time || '');
  const [notification, setNotification] = useState<string>(initialTask?.notification || '');
  const [taskTitle, setTaskTitle] = useState(initialTask?.title || '');
  const [titleError, setTitleError] = useState<string>('');
  const formRef = useRef<HTMLDivElement>(null);
  const initialProcessRef = useRef(false);
  
  // Обновляем выбранную дату, время и уведомление, если они вернулись из DatePickerPage
  useEffect(() => {
    if (locationState && !initialProcessRef.current) {
      initialProcessRef.current = true;
      
      if (locationState.selectedDate) {
        setSelectedDate(returnedDate);
      }
      
      if (locationState.selectedTime) {
        setSelectedTime(locationState.selectedTime);
      }
      
      if (locationState.selectedNotification) {
        setNotification(locationState.selectedNotification);
      }
      
      // Восстанавливаем название задачи, если оно было передано
      if (locationState.taskTitle) {
        setTaskTitle(locationState.taskTitle);
      }
      
      // Очищаем состояние, чтобы избежать повторного применения даты при обновлении страницы
      window.history.replaceState({}, document.title);
    }
  }, [locationState]);

  // Валидация заголовка задачи при изменении
  const validateTaskTitle = (title: string) => {
    if (!title.trim()) {
      setTitleError('Название задачи обязательно');
      return false;
    }
    
    setTitleError('');
    return true;
  };

  // Обработчик изменения заголовка
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTaskTitle(newTitle);
    
    if (titleError) {
      validateTaskTitle(newTitle);
    }
  };

  const handleSubmitTask = () => {
    if (validateTaskTitle(taskTitle)) {
      if (isEditing && initialTask?.id && onEditTask) {
        console.log('Редактирование задачи:', {
          id: initialTask.id,
          title: taskTitle,
          date: selectedDate,
          time: selectedTime,
          notification
        });
        
        onEditTask(
          initialTask.id, 
          taskTitle, 
          selectedDate || undefined, 
          selectedTime || undefined,
          notification || undefined
        );
      } else if (onAddTask) {
        onAddTask(taskTitle, selectedDate || undefined, selectedTime || undefined);
      }
      
      setTaskTitle('');
      setSelectedDate(new Date());
      setSelectedTime('');
      setNotification('');
      setTitleError('');
      onClose?.();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Если открыт пикер времени или уведомлений, не закрываем форму
      if (showTimePicker || showNotificationPicker) {
        return;
      }
      
      if (isExpanded &&
          formRef.current &&
          !formRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded, onClose, showTimePicker, showNotificationPicker]);

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
    // Сбрасываем состояния пикеров, но не закрываем форму добавления задачи
    setShowTimePicker(false);
    setShowNotificationPicker(false);
  };

  const handleOpenDatePicker = () => {
    // Очищаем ошибку перед открытием выбора даты, чтобы пользователь мог сначала выбрать дату
    setTitleError('');
    
    // Вместо открытия модального окна переходим на страницу выбора даты
    // и передаем текущее название задачи
    navigate('/datepicker', { 
      state: { 
        initialDate: selectedDate?.toISOString(),
        initialTime: selectedTime,
        initialNotification: notification,
        fromAddTask: true,
        taskTitle: taskTitle // Передаем название задачи
      }
    });
  };

  const formatTime = (time: string) => {
    return time || '--:--';
  };

  const formatNotification = (notification: string) => {
    return notification || 'Укажите время';
  };

  const renderTimePicker = () => {
    if (!showTimePicker) return null;

    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-in fade-in duration-200"
        style={{ maxWidth: '100vw', maxHeight: '100dvh' }}
        onClick={(e) => {
          e.stopPropagation();
          setShowTimePicker(false);
        }}
      >
        <div className="bg-black w-full max-w-md rounded-xl overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col shadow-xl mx-auto my-auto" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center h-12 px-4 border-b border-zinc-800/50">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowTimePicker(false);
              }}
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
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="p-4 border-t border-zinc-800/50">
            <div className="flex gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTimePicker(false);
                }}
                className="flex-1 py-3 text-blue-400 text-sm font-medium"
              >
                Отменить
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTimePicker(false);
                }}
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-in fade-in duration-200"
        style={{ maxWidth: '100vw', maxHeight: '100dvh' }}
        onClick={(e) => {
          e.stopPropagation();
          setShowNotificationPicker(false);
        }}
      >
        <div className="bg-black w-full max-w-md rounded-xl overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col shadow-xl mx-auto my-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center h-12 px-4 border-b border-zinc-800/50">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowNotificationPicker(false);
              }}
              className="w-8 h-8 flex items-center justify-center text-zinc-400"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="flex-1 text-center text-sm font-medium text-white">Уведомления</span>
            <div className="w-8"></div>
          </div>

          <div className="p-4 max-h-[300px] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-2">
              {notifications.map((n) => (
                <button
                  key={n}
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotification(n);
                    setShowNotificationPicker(false);
                  }}
                  className="w-full text-left py-3 px-4 text-white text-sm hover:bg-zinc-800/70 active:bg-zinc-700 rounded-xl transition-colors"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-zinc-800/50">
            <div className="flex gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNotificationPicker(false);
                }}
                className="flex-1 py-3 text-blue-400 text-sm font-medium"
              >
                Отменить
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNotificationPicker(false);
                }}
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

  if (isExpanded) {
    return (
      <>
        <div ref={formRef} className="bg-zinc-800/90 backdrop-blur-sm rounded-2xl p-4 space-y-4 transform transition-all duration-200 ease-out">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder={isEditing ? "Редактировать задачу" : "Добавить задачу"}
                className={`flex-1 bg-transparent text-white border-none outline-none text-lg placeholder:text-zinc-500 ${titleError ? 'border-b border-red-500' : ''}`}
                value={taskTitle}
                onChange={handleTitleChange}
                autoFocus
                required
              />
            </div>
            {titleError && (
              <div className="flex items-center text-red-500 text-xs">
                <AlertCircle size={12} className="mr-1" />
                <span>{titleError}</span>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={handleOpenDatePicker}
              className="flex items-center text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <Calendar size={16} className="mr-2" />
              <span>{selectedDate ? formatDate(selectedDate) : 'Выбрать дату'}</span>
            </button>
          </div>
          
          {/* Добавляем отображение выбранного времени */}
          {selectedTime && (
            <div className="relative">
              <button
                onClick={() => setShowTimePicker(true)}
                className="flex items-center text-sm text-zinc-400 hover:text-white transition-colors"
              >
                <Clock size={16} className="mr-2" />
                <span>Время: {selectedTime}</span>
              </button>
            </div>
          )}
          
          {/* Добавляем отображение выбранного уведомления */}
          {notification && (
            <div className="relative">
              <button
                onClick={() => setShowNotificationPicker(true)}
                className="flex items-center text-sm text-zinc-400 hover:text-white transition-colors"
              >
                <Bell size={16} className="mr-2" />
                <span>Уведомление: {notification}</span>
              </button>
            </div>
          )}
          
          <div className="flex items-center justify-between border-t border-zinc-700 pt-4">
            <div className="flex items-center space-x-4">
              <button className="text-zinc-400 hover:text-white transition-colors">
                <Flag size={20} />
              </button>
              <button className="text-zinc-400 hover:text-white transition-colors">
                <Paperclip size={20} />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTimePicker(true);
                }} 
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <Clock size={20} />
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onClose?.();
                }}
                className="px-3 py-1 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Отмена
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubmitTask();
                }}
                disabled={!taskTitle.trim()}
                className={`px-3 py-1 text-white rounded-lg text-sm transition-colors ${taskTitle.trim() ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600/50 cursor-not-allowed'}`}
              >
                {isEditing ? 'Сохранить' : 'Добавить'}
              </button>
            </div>
          </div>
        </div>
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