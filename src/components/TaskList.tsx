import React, { useState, useEffect } from 'react';
import { Task, TaskCategory } from '../types/Task';
import { CategorySelector } from './CategorySelector';
import { CategoryPage } from './CategoryPage';
import { UserInfo } from './UserInfo';

interface TaskListProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onEditTask: (task: Task) => void;
  onToggleTask: (taskId: string) => void;
  isAddingTask?: boolean;
  isLoading?: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onAddTask,
  onEditTask,
  onToggleTask,
  isAddingTask = false,
  isLoading = false,
}) => {
  const [currentCategory, setCurrentCategory] = useState<TaskCategory>('inbox');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | null>(null);
  const [isAdding, setIsAdding] = useState(isAddingTask);

  // Выводим все задачи в консоль при загрузке компонента
  useEffect(() => {
    console.log('Все задачи в базе данных:', tasks);
  }, [tasks]);

  // Update isAdding when isAddingTask prop changes
  useEffect(() => {
    if (isAddingTask) {
      setIsAdding(true);
    }
  }, [isAddingTask]);

  const handleAddTask = (title: string, date?: Date) => {
    if (title.trim()) {
      // Определяем категорию на основе даты
      let category: TaskCategory = currentCategory === 'all' ? 'inbox' : currentCategory;
      
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

  const handleSelectCategory = (category: TaskCategory) => {
    setCurrentCategory(category);
    setSelectedCategory(category);
  };

  const handleBack = () => {
    setSelectedCategory(null);
  };

  // Если выбрана категория, показываем страницу категории
  if (selectedCategory) {
    return (
      <CategoryPage
        tasks={tasks}
        category={selectedCategory}
        onBack={handleBack}
        onToggleTask={onToggleTask}
        onEditTask={onEditTask}
        onAddTask={onAddTask}
      />
    );
  }

  // Иначе показываем основную страницу с выбором категорий
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900/80">
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6 header-container">
          <div className="header-content">
            <h1 className="text-2xl font-bold text-white mb-1">
              TaskDrop
            </h1>
            <p className="text-xs text-zinc-400">
              Управляй своими делами
            </p>
          </div>
          <UserInfo />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-zinc-500 text-sm">Загрузка...</div>
          </div>
        ) : (
          <div>
            <CategorySelector
              currentCategory={currentCategory}
              onSelectCategory={handleSelectCategory}
              tasks={tasks}
              isAdding={isAdding}
              onAddClick={() => setIsAdding(true)}
              onCancelAdd={() => setIsAdding(false)}
              onSubmitTask={handleAddTask}
            />
          </div>
        )}
      </div>
    </div>
  );
}; 