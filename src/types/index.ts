export interface Task {
  id: string;
  request_date: string;
  title: string;
  description: string;
  deadline: string;
  assigned_to?: string;
  requester?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  parentId?: string;
}

export interface SubTask extends Task {
  parentId: string;
}

export interface TaskOrganization {
  tasks: SubTask[];
}

export interface BaseResponse {
  status: string;
  message: string;
  threadId?: string;
}

export interface SuccessResponse extends BaseResponse {
  status: 'success';
  data: Task[] | { tasks: Task[] };
}

export interface NeedsContextResponse extends BaseResponse {
  status: 'needs_context';
  data: {
    questions: string[];
  };
}

export interface TaskOrganizationResponse extends BaseResponse {
  status: 'success' | 'error';
  data?: {
    tasks: SubTask[];
  };
}

export type AIResponse = SuccessResponse | NeedsContextResponse;
