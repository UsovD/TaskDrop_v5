import React, { useState } from 'react';
import { Task, TaskCategory } from '../types/Task';
import { CategorySelector } from './CategorySelector';

interface TaskListProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onEditTask: (task: Task) => void;
  onToggleTask: (taskId: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onAddTask,
  onEditTask,
  onToggleTask,
}) => {
  const [currentCategory, setCurrentCategory] = useState<TaskCategory>('all');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTask = (title: string, date?: Date, time?: string) => {
    if (title.trim()) {
      // Определяем категорию на основе даты
      let category = currentCategory === 'all' ? 'inbox' : currentCategory;
      
      // Если указана дата
      if (date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const dateOnly = new Date(date);
        dateOnly.setHours(0, 0, 0, 0);
        
        if (dateOnly.getTime() === today.getTime()) {
          category = 'today';
        } else if (dateOnly.getTime() === tomorrow.getTime()) {
          category = 'tomorrow';
        }
      }
      
      onAddTask({
        title: title.trim(),
        description: '',
        category,
        priority: 'medium',
        completed: false,
        dueDate: date
      });
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900/80">
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
            TaskDrop
          </h1>
          <p className="text-sm text-zinc-400">
            Управляй своими делами
          </p>
        </div>

        <div>
          <CategorySelector
            currentCategory={currentCategory}
            onSelectCategory={setCurrentCategory}
            tasks={tasks}
            isAdding={isAdding}
            onAddClick={() => setIsAdding(true)}
            onCancelAdd={() => setIsAdding(false)}
            onSubmitTask={handleAddTask}
          />
        </div>
      </div>
    </div>
  );
}; 