import axios from 'axios';
import { AIResponse, Task, TaskOrganizationResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Single API instance for all requests
const api = axios.create({
  baseURL: `${API_URL}/api`,  // Base URL includes /api
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request/response interceptors for debugging
api.interceptors.request.use(request => {
  console.log('Request:', {
    url: request.url,
    method: request.method,
    baseURL: request.baseURL,
    headers: request.headers,
    data: request.data
  });
  return request;
});

api.interceptors.response.use(
  response => {
    console.log('Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      }
    });
    throw error;
  }
);

export const processMessage = async (message: string, threadId?: string): Promise<AIResponse> => {
  try {
    const response = await api.post('/tasks/process-message', { message, threadId });
    return response.data;
  } catch (error: any) {
    console.error('Error processing message:', error);
    throw error;
  }
};

export const organizeTask = async (task: Task, threadId?: string): Promise<TaskOrganizationResponse> => {
  try {
    const response = await api.post('/tasks/organize', { task, threadId });
    
    // If successful, create subtasks through the backend
    if (response.data.data?.tasks) {
      const subtasks = response.data.data.tasks.map(subtask => ({
        ...subtask,
        id: `${task.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        parentId: task.id,
        assigned_to: subtask.assigned_to || task.assigned_to || 'Unassigned',
        requester: subtask.requester || task.requester || 'Unknown',
        status: subtask.status || 'pending'
      }));

      // Save subtasks through backend
      for (const subtask of subtasks) {
        await api.post(`/tasks/${task.id}/subtasks`, subtask);
      }
    }

    return response.data;
  } catch (error: any) {
    console.error('Error organizing task:', error);
    throw error;
  }
};

export const askFollowUpQuestion = async (taskId: string, question: string, threadId?: string): Promise<TaskOrganizationResponse> => {
  try {
    const response = await api.post('/tasks/ask-followup', { 
      taskId,
      question,
      threadId 
    });
    return response.data;
  } catch (error: any) {
    console.error('Error asking follow-up question:', error);
    throw error;
  }
};

// Task CRUD operations
export const getAllTasks = async (): Promise<Task[]> => {
  try {
    const response = await api.get('/tasks');
    return response.data.map((task: Task) => ({
      ...task,
      assigned_to: task.assigned_to || 'Unassigned',
      requester: task.requester || 'Unknown',
      status: task.status || 'pending'
    }));
  } catch (error: any) {
    console.error('Error getting tasks:', error);
    throw error;
  }
};

export const getTask = async (id: string): Promise<Task> => {
  try {
    const response = await api.get(`/tasks/${id}`);
    return {
      ...response.data,
      assigned_to: response.data.assigned_to || 'Unassigned',
      requester: response.data.requester || 'Unknown',
      status: response.data.status || 'pending'
    };
  } catch (error: any) {
    console.error('Error getting task:', error);
    throw error;
  }
};

export const createTask = async (task: Task): Promise<Task> => {
  try {
    const response = await api.post('/tasks', task);
    return response.data;
  } catch (error: any) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const updateTask = async (id: string, task: Partial<Task>): Promise<Task> => {
  try {
    const response = await api.patch(`/tasks/${id}`, task);
    return response.data;
  } catch (error: any) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (id: string): Promise<void> => {
  try {
    await api.delete(`/tasks/${id}`);
  } catch (error: any) {
    console.error('Error deleting task:', error);
    throw error;
  }
};
