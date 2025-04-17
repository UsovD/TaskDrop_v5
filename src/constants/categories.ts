import { List, Inbox, CheckSquare, Calendar, CalendarDays, CheckCircle2 } from 'lucide-react';

export const CATEGORIES = [
  {
    id: 'all',
    label: 'Все задачи',
    icon: List
  },
  {
    id: 'inbox',
    label: 'Входящие',
    icon: Inbox
  },
  {
    id: 'today',
    label: 'Сегодня',
    icon: CheckSquare
  },
  {
    id: 'tomorrow',
    label: 'Завтра',
    icon: Calendar
  },
  {
    id: 'next7days',
    label: 'Следующие 7 дней',
    icon: CalendarDays
  },
  {
    id: 'completed',
    label: 'Завершенные',
    icon: CheckCircle2
  }
] as const;

export type TaskCategory = typeof CATEGORIES[number]['id'];

export function getCategoryInfo(category: TaskCategory) {
  return CATEGORIES.find(c => c.id === category);
} 