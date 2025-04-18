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
  const [isShowingTasks, setIsShowingTasks] = useState(false);
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

  const handleAddTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    try {
      const apiTask = await apiClient.createTask(mapTaskToApiTask(taskData));
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
      
      const taskId = parseInt(task.id, 10);
      if (isNaN(taskId)) {
        setError('Невозможно обновить задачу: неверный идентификатор');
        console.error('Ошибка редактирования: неверный ID задачи', task.id);
        return;
      }
      
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

      const updatedApiTask = await apiClient.toggleTaskComplete(parseInt(taskId, 10), !task.completed);
      const updatedTask = mapApiTaskToTask(updatedApiTask);
      
      setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
    } catch (err) {
      setError('Не удалось обновить статус задачи');
      console.error('Failed to toggle task:', err);
    }
  };

  const showAllTasks = () => {
    setIsShowingTasks(true);
    console.table(tasks.map(task => ({
      id: task.id,
      title: task.title,
      category: task.category,
      completed: task.completed,
      dueDate: task.dueDate ? task.dueDate.toLocaleDateString('ru-RU') : 'Нет',
      createdAt: task.createdAt ? task.createdAt.toLocaleDateString('ru-RU') : 'Нет'
    })));
    
    setTimeout(() => {
      setIsShowingTasks(false);
    }, 3000);
  };

  return (
    <div className="app">
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
      
      <div className="tasks-info">
        <button 
          onClick={showAllTasks}
          className="show-tasks-button"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '10px 15px',
            background: '#3b82f6',
            color: 'white',
            borderRadius: '6px',
            border: 'none',
            zIndex: 999,
            cursor: 'pointer'
          }}
        >
          {isShowingTasks ? 'Задачи выведены в консоль' : 'Показать все задачи'}
        </button>
      </div>
      
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
  const location = useLocation();
  
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