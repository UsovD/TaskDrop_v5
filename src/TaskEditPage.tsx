import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Task } from './types/Task';
import { ChevronLeft } from 'lucide-react';

export const TaskEditPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { taskId } = useParams<{ taskId: string }>();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [category, setCategory] = useState('');
  
  // Получаем данные задачи из состояния навигации
  useEffect(() => {
    const state = location.state as { 
      task?: Task,
      selectedDate?: string,
      selectedTime?: string,
      selectedNotification?: string 
    } || {};
    
    if (state.task) {
      setTitle(state.task.title);
      setDescription(state.task.description || '');
      
      // Если есть выбранная дата из DatePickerPage, используем её
      if (state.selectedDate) {
        setDueDate(new Date(state.selectedDate));
      } else {
        setDueDate(state.task.dueDate || null);
      }
      
      setIsCompleted(state.task.completed);
      setCategory(state.task.category);
    } else {
      // Если задача не передана через состояние, вернемся на главную
      navigate('/');
    }
  }, [location.state, navigate]);
  
  const handleGoBack = () => {
    navigate('/');
  };
  
  const handleSave = () => {
    const state = location.state as { task?: Task } || {};
    if (!state.task) return;
    
    const editedTask: Task = {
      ...state.task,
      title,
      description,
      dueDate: dueDate || undefined,
      completed: isCompleted
    };
    
    // Возвращаемся на главную и передаем отредактированную задачу
    navigate('/', { state: { editedTask } });
  };
  
  const formatDateForDisplay = (date: Date | null) => {
    if (!date) return 'Не выбрана';
    
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-md mx-auto">
        {/* Верхняя панель с кнопкой назад и заголовком */}
        <div className="flex items-center mb-6">
          <button 
            onClick={handleGoBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="ml-4 text-xl font-medium">Редактирование задачи</h1>
        </div>
        
        <div className="space-y-6">
          {/* Поле заголовка задачи */}
          <div className="space-y-2">
            <label className="block text-sm text-zinc-400">Заголовок задачи</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите заголовок задачи"
            />
          </div>
          
          {/* Поле описания */}
          <div className="space-y-2">
            <label className="block text-sm text-zinc-400">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Введите описание задачи"
              rows={4}
            />
          </div>
          
          {/* Дата выполнения */}
          <div className="space-y-2">
            <label className="block text-sm text-zinc-400">Срок выполнения</label>
            <div 
              onClick={() => navigate('/datepicker', { 
                state: { 
                  initialDate: dueDate?.toISOString(),
                  returnToEdit: true,
                  taskId: taskId
                }
              })} 
              className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-white cursor-pointer flex justify-between items-center"
            >
              <span>{dueDate ? formatDateForDisplay(dueDate) : 'Выбрать дату'}</span>
              <button className="text-blue-500 text-sm">Изменить</button>
            </div>
          </div>
          
          {/* Статус выполнения */}
          <div className="space-y-2">
            <label className="block text-sm text-zinc-400">Статус задачи</label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isCompleted}
                onChange={(e) => setIsCompleted(e.target.checked)}
                className="w-5 h-5 rounded border-zinc-700 text-blue-600 focus:ring-blue-500 bg-zinc-800"
              />
              <span>Выполнена</span>
            </div>
          </div>
          
          {/* Кнопки действий */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <button
              onClick={handleGoBack}
              className="w-full py-3 bg-zinc-800 text-white rounded-xl"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              className="w-full py-3 bg-blue-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!title.trim()}
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 