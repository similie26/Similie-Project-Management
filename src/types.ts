export type Status = 'In Progress' | 'Blocked' | 'Done' | 'Backlog' | 'Review';

export interface Task {
  id: string;
  title: string;
  status: Status;
  assignees: string[];
  dueDate?: string;
  priority?: 'High' | 'Medium' | 'Low';
  category?: string;
  progress?: number;
  comments?: number;
  attachments?: number;
  description?: string;
  subtasks?: { label: string; done: boolean }[];
  projectId?: string;
  dependencies?: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  load: number;
  activeTasks: number;
  blockedTasks: number;
  status: 'online' | 'offline' | 'busy';
}

export interface Activity {
  id: string;
  user: string;
  avatar: string;
  action: string;
  target: string;
  time: string;
  project: string;
  comment?: string;
  type: 'move' | 'upload' | 'comment';
}

export interface Project {
  id: string;
  name: string;
  members: number;
  activeTasks: number;
  progress: number;
  status: 'Healthy' | 'At Risk';
  category: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  bio?: string;
  preferences: {
    notifications: boolean;
    darkMode: boolean;
    language: string;
  };
}
