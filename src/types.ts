export interface Task {
  id: string;
  title: string;
  description: string;
  requester: string;
  assigned_to: string;
  status: string;
  deadline: string;
  parentId?: string;
}

export interface Subtask {
  task_name: string;
  description: string;
  status: string;
  due_date: string;
  priority: string;
  best_approach: string;
  assigned_to?: string;
  dependencies?: string[];
}

export interface AIResponse {
  response: {
    text: string;
  };
  threadId?: string;
}

export interface TaskDetailResponse {
  subtasks: Subtask[];
  message: string[];
  threadId?: string;
}

export interface TaskOrganizationResponse {
  response: {
    text: string;
  };
  threadId?: string;
  data?: {
    tasks?: any[];
  };
}
