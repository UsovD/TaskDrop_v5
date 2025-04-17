import React from 'react';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';

interface AddTaskButtonProps {
  onClick: () => void;
}

export const AddTaskButton: React.FC<AddTaskButtonProps> = ({ onClick }) => {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      className="w-full flex items-center justify-center gap-2"
    >
      <Plus className="h-4 w-4" />
      <span>Добавить задачу</span>
    </Button>
  );
}; 