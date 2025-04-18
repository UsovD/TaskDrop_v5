import { ApiTask } from "./client";

export interface Task extends ApiTask {}

export interface TaskState {
  tasks: Task[];
  error: string | null;
  loading: boolean;
} 