import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskCategory } from '../types/Task';
import { CategorySelector } from './CategorySelector';
import { Button } from './ui/button';
import { AddTaskButton } from './AddTaskButton';

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
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setIsAdding(false);
        setNewTaskTitle('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = newTaskTitle.trim();
    if (trimmedTitle) {
      onAddTask({
        title: trimmedTitle,
        description: '',
        category: currentCategory === 'all' ? 'inbox' : currentCategory,
        priority: 'medium',
        completed: false,
      });
      setNewTaskTitle('');
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900/80">
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
            Задачи
          </h1>
          <p className="text-sm text-zinc-400">
            Управляй своими делами
          </p>
        </div>

        <div ref={formRef}>
          {isAdding ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Введите название задачи..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                autoFocus
              />
              <div className="flex space-x-2">
                <Button type="submit" disabled={!newTaskTitle.trim()}>
                  Добавить
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAdding(false)}
                >
                  Отмена
                </Button>
              </div>
            </form>
          ) : (
            <AddTaskButton onClick={() => setIsAdding(true)} />
          )}
        </div>

        <div className="mt-6">
          <CategorySelector
            currentCategory={currentCategory}
            onSelectCategory={setCurrentCategory}
            tasks={tasks}
          />
        </div>
      </div>
    </div>
  );
}; 