import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Task } from './types/Task';
import { ChevronLeft } from 'lucide-react';
import { apiClient } from './api/client';
import { mapApiTaskToTask, mapTaskToApiTask } from './utils/taskMappers';

export const TaskEditPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { taskId } = useParams<{ taskId: string }>();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [dueTime, setDueTime] = useState('');
  const [notification, setNotification] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [originalTask, setOriginalTask] = useState<Task | null>(null); // Храним оригинальную задачу
  
  // Получаем данные задачи из состояния навигации
  useEffect(() => {
    const state = location.state as { 
      task?: Task,
      selectedDate?: string,
      selectedTime?: string,
      selectedNotification?: string,
      taskTitle?: string,
      forceRefresh?: number
    } || {};

    console.log("TaskEditPage - Первый useEffect: проверка state", state);
    
    if (state.task) {
      // Есть полные данные задачи в state, используем их
      setTitle(state.task.title);
      setDescription(state.task.description || '');
      
      if (state.selectedDate) {
        setDueDate(new Date(state.selectedDate));
      } else {
        setDueDate(state.task.dueDate || null);
      }
      
      if (state.selectedTime) {
        setDueTime(state.selectedTime);
      }
      
      if (state.selectedNotification) {
        setNotification(state.selectedNotification);
      }
      
      setIsCompleted(state.task.completed);
      setOriginalTask(state.task);
    } 
    else if (state.forceRefresh) {
      // Это возврат с DatePickerPage, загрузим задачу с сервера
      console.log("Возврат с DatePickerPage с forceRefresh, загружаем задачу");
      loadTask();
    }
    else if (taskId) {
      // Есть ID задачи в URL, но нет данных в state - попробуем загрузить
      console.log("Есть ID задачи в URL, но нет данных в state - загружаем задачу");
      loadTask();
    }
    else {
      // Нет ни task, ни forceRefresh, ни taskId - возвращаемся на главную
      console.log("Нет ни task, ни forceRefresh, ни taskId - возвращаемся на главную");
      navigate('/');
    }
  }, [location.state, navigate, taskId]);
  
  const handleGoBack = () => {
    navigate('/');
  };
  
  const handleSave = async () => {
    // Проверяем наличие ID задачи и загруженного originalTask
    if (!originalTask || !taskId) {
      console.error("Нет данных для сохранения");
      alert("Не удалось сохранить изменения - отсутствуют исходные данные задачи");
      return;
    }
    
    try {
      console.log("Исходная задача:", originalTask);
      
      const editedTask: Task = {
        ...originalTask,
        title,
        description,
        dueDate: dueDate || undefined,
        dueTime,
        notification,
        completed: isCompleted
      };
      
      console.log('Сохраняем задачу:', editedTask);
      
      // Конвертируем задачу для отправки на сервер
      const apiTaskData = mapTaskToApiTask(editedTask);
      
      // Отправляем изменения на сервер
      const updatedApiTask = await apiClient.updateTask(taskId, apiTaskData);
      console.log('Ответ от сервера:', updatedApiTask);
      
      // Конвертируем обратно в формат для фронтенда
      const updatedTask = mapApiTaskToTask(updatedApiTask);
      
      // Возвращаемся на главную и передаем обновленную задачу
      navigate('/', { state: { editedTask: updatedTask } });
    } catch (error) {
      console.error('Ошибка при сохранении задачи:', error);
      alert('Произошла ошибка при сохранении задачи');
    }
  };
  
  const formatDateForDisplay = (date: Date | null) => {
    if (!date) return 'Не выбрана';
    
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  // Обработчик открытия DatePickerPage для выбора даты
  const handleOpenDatePicker = () => {
    navigate('/datepicker', {
      state: {
        initialDate: dueDate?.toISOString(),
        initialTime: dueTime,
        initialNotification: notification,
        taskId: taskId,
        taskTitle: title // Передаем название задачи
      }
    });
  };
  
  // Загружаем данные из состояния маршрутизации при возврате с DatePickerPage
  useEffect(() => {
    const state = location.state as {
      task?: Task,
      selectedDate?: string,
      selectedTime?: string,
      selectedNotification?: string,
      taskTitle?: string, // Добавляем поле для названия задачи
      forceRefresh?: number // Изменение имени параметра для соответствия с DatePickerPage
    } || {};

    console.log("TaskEditPage - Второй useEffect: проверка дополнительных параметров", state);

    // Обрабатываем только случаи с дополнительными параметрами 
    // (forceRefresh уже обработан в первом useEffect, проверяем остальные)
    if (state.selectedDate || state.selectedTime || state.selectedNotification || state.taskTitle) {
      if (state.selectedDate) {
        setDueDate(new Date(state.selectedDate));
      }
      
      if (state.selectedTime) {
        setDueTime(state.selectedTime);
      }
      
      if (state.selectedNotification) {
        setNotification(state.selectedNotification);
      }
      
      // Восстанавливаем название задачи, если оно было передано
      if (state.taskTitle) {
        setTitle(state.taskTitle);
      }
    }
  }, [location.state]);
  
  // Функция загрузки задачи по ID
  const loadTask = async () => {
    try {
      console.log("Старт загрузки задачи с сервера, ID:", taskId);
      
      try {
        console.log("Пробуем получить задачу напрямую через getTask API");
        const taskData = await apiClient.getTask(String(taskId));
        console.log("Задача успешно получена напрямую:", taskData);
        
        const task = mapApiTaskToTask(taskData);
        setTitle(task.title);
        setDescription(task.description || '');
        setIsCompleted(task.completed);
        setDueDate(task.dueDate || null);
        setDueTime(task.dueTime || '');
        setNotification(task.notification || '');
        setOriginalTask(task);
        console.log("Данные успешно загружены в форму");
        return;
      } catch (directError) {
        console.warn("Не удалось получить задачу напрямую, пробуем через список:", directError);
      }
      
      console.log("Загружаем список всех задач");
      const tasks = await apiClient.getTasks();
      console.log("Получены задачи с сервера:", tasks);
      console.log("Ищем задачу с ID:", taskId, "типа:", typeof taskId);
      
      // Преобразуем taskId в строку для надежного сравнения
      const idToFind = String(taskId);
      
      // Логируем ID всех задач для диагностики
      console.log("ID всех задач:", tasks.map(t => {
        return { id: t.id, type: typeof t.id };
      }));
      
      const foundTask = tasks.find(t => String(t.id) === idToFind);
      
      if (foundTask) {
        console.log("Задача найдена в списке:", foundTask);
        const task = mapApiTaskToTask(foundTask);
        setTitle(task.title);
        setDescription(task.description || '');
        setIsCompleted(task.completed);
        setDueDate(task.dueDate || null);
        setDueTime(task.dueTime || '');
        setNotification(task.notification || '');
        setOriginalTask(task);
        console.log("Данные задачи загружены в форму");
      } else {
        console.error("Задача с ID", idToFind, "не найдена в списке задач!");
        
        // Если задача не найдена, предупреждаем пользователя
        alert("Не удалось загрузить информацию о задаче. Возврат на главную страницу.");
        // Возвращаемся на главную
        navigate('/');
      }
    } catch (error) {
      console.error('Ошибка при загрузке задачи:', error);
      alert("Произошла ошибка при загрузке задачи. Возврат на главную страницу.");
      navigate('/');
    }
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
              onClick={handleOpenDatePicker} 
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
              disabled={!title.trim() || !originalTask}
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 