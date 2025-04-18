import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Task } from './types/Task';
import { TaskList } from './components/TaskList';
import { DatePickerPage } from './DatePickerPage';
import { TaskEditPage } from './TaskEditPage';
import { apiClient } from './api/client';
import { mapApiTaskToTask, mapTaskToApiTask } from './utils/taskMappers';
import './css/components.css';

// Компонент для обеспечения плавного перехода между страницами
const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Небольшая задержка перед появлением для обеспечения плавного перехода
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);
  
  return (
    <div className={`page-transition ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {children}
    </div>
  );
};

const MainPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const location = useLocation();

  useEffect(() => {
    loadTasks();
  }, []);

  // Check if we need to expand the add task form when returning from DatePickerPage
  useEffect(() => {
    const locationState = location.state as { 
      expandAddTask?: boolean,
      editedTask?: Task 
    } || {};
    
    if (locationState.expandAddTask) {
      setIsAddingTask(true);
      // Clear the state to avoid reopening the form on page refresh
      window.history.replaceState({}, document.title);
    }
    
    // Обработка возврата с страницы редактирования
    if (locationState.editedTask) {
      handleEditTask(locationState.editedTask);
      // Очищаем состояние
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const loadTasks = async () => {
    try {
      const apiTasks = await apiClient.getTasks();
      setTasks(apiTasks.map(mapApiTaskToTask));
      setError(null);
    } catch (err) {
      setError('Не удалось загрузить задачи');
      console.error('Failed to load tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для форматирования даты в формат API
  const formatDateForApi = (date: Date): string => {
    return date.toISOString().split('T')[0]; // формат YYYY-MM-DD
  };

  const handleAddTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    try {
      const apiTask = await apiClient.createTask({
        title: taskData.title || '',  // Указываем, что поле не может быть undefined
        description: taskData.description,
        due_date: taskData.dueDate ? formatDateForApi(taskData.dueDate) : undefined,
        due_time: taskData.dueTime,
        notification: taskData.notification,
        priority: taskData.priority || 'medium',
        done: taskData.completed
      });
      const newTask = mapApiTaskToTask(apiTask);
      setTasks([...tasks, newTask]);
      setError(null);
    } catch (err) {
      setError('Не удалось создать задачу');
      console.error('Failed to create task:', err);
    }
  };

  const handleEditTask = async (task: Task) => {
    try {
      // Добавляем проверку на наличие идентификатора задачи
      if (!task.id) {
        setError('Невозможно обновить задачу: отсутствует идентификатор');
        console.error('Ошибка редактирования: отсутствует ID задачи');
        return;
      }
      
      console.log('Отправляем задачу на обновление:', JSON.stringify(task, null, 2));
      
      // Используем строковый ID
      const taskId = task.id;
      
      const taskToApi = mapTaskToApiTask(task);
      console.log('Задача после преобразования в API формат:', JSON.stringify(taskToApi, null, 2));
      
      const apiTask = await apiClient.updateTask(
        taskId,
        taskToApi
      );
      
      console.log('Ответ от API после обновления:', JSON.stringify(apiTask, null, 2));
      
      const updatedTask = mapApiTaskToTask(apiTask);
      
      console.log('Задача после обновления:', JSON.stringify(updatedTask, null, 2));
      
      setTasks(tasks.map(t =>
        t.id === task.id ? updatedTask : t
      ));
      setError(null);
    } catch (err) {
      console.error('Ошибка при обновлении задачи:', err);
      setError('Не удалось обновить задачу');
    }
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const taskIdStr = taskId; // Используем строковый id
      const updatedApiTask = await apiClient.toggleTaskComplete(taskIdStr, !task.completed);
      const updatedTask = mapApiTaskToTask(updatedApiTask);
      
      setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
    } catch (err) {
      setError('Не удалось обновить статус задачи');
      console.error('Failed to toggle task:', err);
    }
  };

  return (
    <div className="app">
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
      
      <TaskList
        tasks={tasks}
        onAddTask={handleAddTask}
        onEditTask={handleEditTask}
        onToggleTask={handleToggleTask}
        isAddingTask={isAddingTask}
        isLoading={isLoading}
      />
    </div>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <div className="routes-container" style={{ backgroundColor: "#000000", minHeight: "100vh" }}>
      <Routes>
        <Route path="/" element={
          <PageTransition>
            <MainPage key="main" />
          </PageTransition>
        } />
        <Route path="/datepicker" element={
          <PageTransition>
            <DatePickerPage key="datepicker" />
          </PageTransition>
        } />
        <Route path="/edit-task/:taskId" element={
          <PageTransition>
            <TaskEditPage key="taskedit" />
          </PageTransition>
        } />
      </Routes>
    </div>
  );
}

const App: React.FC = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default App; 