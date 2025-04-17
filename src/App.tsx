import React, { useState, useEffect } from 'react';
import { Task } from './types/Task';
import { TaskList } from './components/TaskList';
import { apiClient } from './api/client';
import { mapApiTaskToTask, mapTaskToApiTask } from './utils/taskMappers';
import './css/components.css';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
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
      const apiTask = await apiClient.updateTask(
        task.id,
        mapTaskToApiTask(task)
      );
      const updatedTask = mapApiTaskToTask(apiTask);
      setTasks(tasks.map(t =>
        t.id === task.id ? updatedTask : t
      ));
      setError(null);
    } catch (err) {
      setError('Не удалось обновить задачу');
      console.error('Failed to update task:', err);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const updatedApiTask = await apiClient.toggleTaskComplete(taskId, !task.completed);
      const updatedTask = mapApiTaskToTask(updatedApiTask);
      
      setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
    } catch (err) {
      setError('Не удалось обновить статус задачи');
      console.error('Failed to toggle task:', err);
    }
  };

  if (isLoading) {
    return <div className="loading">Загрузка...</div>;
  }

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
      />
    </div>
  );
};

export default App; 