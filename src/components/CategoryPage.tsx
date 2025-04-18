import React, { useState } from 'react';
import { Task, TaskCategory } from '../types/Task';
import { filterTasksByCategory } from '../utils/taskRules';
import { CATEGORIES } from '../constants/categories';
import { TaskCard } from './TaskCard';
import { ChevronLeft, Plus } from 'lucide-react';
import { AddTaskButton } from './AddTaskButton';

interface CategoryPageProps {
  tasks: Task[];
  category: TaskCategory;
  onBack: () => void;
  onToggleTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
  tasks,
  category,
  onBack,
  onToggleTask,
  onEditTask,
  onAddTask,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const filteredTasks = filterTasksByCategory(tasks, category);
  const categoryInfo = CATEGORIES.find(cat => cat.id === category);
  
  if (!categoryInfo) return null;
  
  const { label, icon: Icon } = categoryInfo;
  
  const getIconBackground = (categoryId: string) => {
    switch (categoryId) {
      case 'all':
        return 'bg-blue-500';
      case 'inbox':
        return 'bg-orange-500';
      case 'today':
        return 'bg-green-500';
      case 'tomorrow':
        return 'bg-red-500';
      case 'next7days':
        return 'bg-purple-500';
      case 'completed':
        return 'bg-gray-500';
      default:
        return 'bg-zinc-600';
    }
  };
  
  const bgColor = getIconBackground(category);

  const handleAddTask = (title: string, date?: Date, time?: string) => {
    if (title.trim()) {
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

  const handleEditTask = (task: Task) => {
    onEditTask(task);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900/80">
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center mb-6">
          <button 
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 rounded-xl mr-3 bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
          <div className="flex items-center">
            <span className={`flex items-center justify-center w-10 h-10 rounded-xl mr-3 ${bgColor}`}>
              <Icon size={24} className="text-white" />
            </span>
            <h1 className="text-2xl font-bold text-white">{label}</h1>
          </div>
        </div>
        
        <div className="mb-6">
          <AddTaskButton 
            onClick={() => setIsAdding(true)} 
            isExpanded={isAdding} 
            onClose={() => setIsAdding(false)}
            onAddTask={handleAddTask}
          />
        </div>
        
        {filteredTasks.length === 0 && !isAdding ? (
          <div className="text-center py-10">
            <p className="text-zinc-400 mb-2">В этой категории пока нет задач</p>
            <p className="text-zinc-500 text-sm">Нажмите "Добавить задачу", чтобы создать новую задачу в категории "{label}"</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={onToggleTask}
                onEdit={handleEditTask}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 