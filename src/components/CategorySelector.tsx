import React, { Suspense } from 'react';
import { Task, TaskCategory } from '../types/Task';
import { CATEGORIES } from '../constants/categories';
import { filterTasksByCategory } from '../utils/taskRules';

interface CategorySelectorProps {
  currentCategory: TaskCategory;
  onSelectCategory: (category: TaskCategory) => void;
  tasks: Task[];
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  currentCategory,
  onSelectCategory,
  tasks,
}) => {
  const renderBadge = (count: number, category: string) => {
    let badgeClasses = "text-xs px-2 py-0.5 rounded-full ml-auto ";
    
    switch (category) {
      case 'today':
        badgeClasses += "bg-blue-800 text-blue-300";
        break;
      case 'completed':
        badgeClasses += "bg-green-800 text-green-400";
        break;
      default:
        badgeClasses += "bg-zinc-700 text-zinc-300";
    }
    
    return <span className={badgeClasses}>{count}</span>;
  };

  const mainCategories = CATEGORIES.filter(cat => !['completed'].includes(cat.id));
  const statusCategories = CATEGORIES.filter(cat => ['completed'].includes(cat.id));

  const renderCategoryButton = (category: (typeof CATEGORIES)[number], isActive: boolean) => {
    const count = filterTasksByCategory(tasks, category.id).length;
    const Icon = category.icon;
    
    return (
      <button
        key={category.id}
        onClick={() => onSelectCategory(category.id)}
        className={`w-full bg-zinc-800 rounded-2xl px-4 py-3 flex justify-between items-center transition-colors ${
          isActive ? 'ring-2 ring-blue-600' : 'hover:bg-zinc-700'
        }`}
      >
        <div className="flex items-center">
          <span className="text-zinc-400 mr-3" aria-hidden="true">
            <Suspense fallback={<div className="w-5 h-5 bg-zinc-700 rounded" />}>
              <Icon size={20} />
            </Suspense>
          </span>
          <span className="text-white font-medium">{category.label}</span>
        </div>
        {renderBadge(count, category.id)}
      </button>
    );
  };

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        {mainCategories.map((category) => 
          renderCategoryButton(category, currentCategory === category.id)
        )}
      </div>

      {statusCategories.length > 0 && (
        <>
          <div className="border-t border-zinc-700 my-2" />
          <div className="space-y-2">
            {statusCategories.map((category) =>
              renderCategoryButton(category, currentCategory === category.id)
            )}
          </div>
        </>
      )}
    </div>
  );
}; 