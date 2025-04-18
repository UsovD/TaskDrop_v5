import React from 'react';
import { Task, TaskCategory } from '../types/Task';
import { CATEGORIES } from '../constants/categories';
import { filterTasksByCategory } from '../utils/taskRules';
import { AddTaskButton } from './AddTaskButton';

interface CategorySelectorProps {
  currentCategory: TaskCategory;
  onSelectCategory: (category: TaskCategory) => void;
  tasks: Task[];
  isAdding: boolean;
  onAddClick: () => void;
  onCancelAdd: () => void;
  onSubmitTask: (title: string, date?: Date, time?: string) => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  currentCategory,
  onSelectCategory,
  tasks,
  isAdding,
  onAddClick,
  onCancelAdd,
  onSubmitTask,
}) => {
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

  const getBadgeBackground = (categoryId: string) => {
    switch (categoryId) {
      case 'all':
        return 'bg-blue-500/20 text-blue-300';
      case 'inbox':
        return 'bg-orange-500/20 text-orange-300';
      case 'today':
        return 'bg-green-500/20 text-green-300';
      case 'tomorrow':
        return 'bg-red-500/20 text-red-300';
      case 'next7days':
        return 'bg-purple-500/20 text-purple-300';
      case 'completed':
        return 'bg-gray-500/20 text-gray-300';
      default:
        return 'bg-zinc-700 text-zinc-300';
    }
  };

  const renderBadge = (count: number, categoryId: string) => {
    const badgeClasses = `text-xs px-2 py-0.5 rounded-full ml-auto ${getBadgeBackground(categoryId)}`;
    return <span className={badgeClasses}>{count}</span>;
  };

  const renderCategoryCard = (category: (typeof CATEGORIES)[number], isActive: boolean) => {
    const count = filterTasksByCategory(tasks, category.id).length;
    const Icon = category.icon;
    const bgColor = getIconBackground(category.id);
    
    return (
      <button
        key={category.id}
        onClick={() => onSelectCategory(category.id as TaskCategory)}
        className={`flex flex-col items-start p-4 bg-zinc-800/50 backdrop-blur-sm rounded-2xl transition-colors w-full ${
          isActive ? 'ring-2 ring-blue-600' : 'hover:bg-zinc-700/50'
        }`}
      >
        <span className={`flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${bgColor}`} aria-hidden="true">
          <Icon size={24} className="text-white" />
        </span>
        <div className="flex justify-between items-center w-full">
          <span className="text-white font-medium text-sm">{category.label}</span>
          <span className="text-2xl font-semibold text-white">{count}</span>
        </div>
      </button>
    );
  };

  const renderCategoryButton = (category: (typeof CATEGORIES)[number], isActive: boolean) => {
    const count = filterTasksByCategory(tasks, category.id).length;
    const Icon = category.icon;
    const bgColor = getIconBackground(category.id);
    
    return (
      <button
        key={category.id}
        onClick={() => onSelectCategory(category.id as TaskCategory)}
        className={`w-full bg-zinc-800 rounded-2xl px-4 py-3 flex justify-between items-center transition-colors ${
          isActive ? 'ring-2 ring-blue-600' : 'hover:bg-zinc-700'
        }`}
      >
        <div className="flex items-center">
          <span className={`flex items-center justify-center w-8 h-8 rounded-xl mr-3 ${bgColor}`} aria-hidden="true">
            <Icon size={20} className="text-white" />
          </span>
          <span className="text-white font-medium">{category.label}</span>
        </div>
        {renderBadge(count, category.id)}
      </button>
    );
  };

  const topCategories = CATEGORIES.filter(cat => ['today', 'completed'].includes(cat.id));
  const listCategories = CATEGORIES.filter(cat => !['today', 'completed'].includes(cat.id));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {topCategories.map((category) => 
          renderCategoryCard(category, currentCategory === category.id)
        )}
      </div>

      <div className="transform transition-all duration-300 ease-out">
        <AddTaskButton 
          onClick={onAddClick} 
          isExpanded={isAdding} 
          onClose={onCancelAdd}
          onAddTask={onSubmitTask}
        />
      </div>

      <div className="space-y-2">
        {listCategories.map((category) =>
          renderCategoryButton(category, currentCategory === category.id)
        )}
      </div>
    </div>
  );
}; 