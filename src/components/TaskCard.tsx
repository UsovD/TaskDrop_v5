import React from 'react';
import { Task } from '../types/Task';
import { getCategoryInfo } from '../constants/categories';
import { useNavigate } from 'react-router-dom';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
}) => {
  const navigate = useNavigate();
  const categoryInfo = getCategoryInfo(task.category);
  if (!categoryInfo) return null;
  
  const Icon = categoryInfo.icon;

  const handleClick = () => {
    // Перенаправляем на страницу редактирования и передаем данные задачи
    navigate(`/edit-task/${task.id}`, { state: { task } });
  };

  return (
    <div 
      className={`bg-zinc-800 rounded-xl p-4 cursor-pointer hover:bg-zinc-700/50 transition-colors ${
        task.completed ? 'opacity-50' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-700">
          <Icon size={20} className="text-zinc-400" />
        </div>
        <h3 className="flex-1 text-white font-medium">{task.title}</h3>
        <label className="relative inline-flex items-center cursor-pointer" onClick={e => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggleComplete(task.id)}
            className="sr-only peer"
          />
          <div className="w-5 h-5 border-2 border-zinc-600 rounded peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors"></div>
        </label>
      </div>
      
      {task.description && (
        <p className="mt-2 text-sm text-zinc-400">{task.description}</p>
      )}
      
      {task.dueDate && (
        <p className="mt-2 text-xs text-zinc-500">
          Срок: {task.dueDate.toLocaleDateString('ru-RU')}
        </p>
      )}
    </div>
  );
}; 