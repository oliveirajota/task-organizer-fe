import axios from 'axios';
import { AIResponse, Task, TaskOrganizationResponse, TaskDetailResponse, Subtask } from '../types';

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

export const organizeTask = async (task: Task, threadId?: string): Promise<TaskDetailResponse> => {
  try {
    console.log('Sending task to organize:', task);
    const response = await api.post('/tasks/organize', { task, threadId });
    console.log('Raw response from organize:', response);
    
    // Ensure we're returning the correct data structure
    const responseData: TaskDetailResponse = {
      subtasks: response.data.subtasks || [],
      message: response.data.message || [],
      threadId: response.data.threadId
    };
    
    console.log('Processed response data:', responseData);
    return responseData;
  } catch (error: any) {
    console.error('Error organizing task:', error);
    throw error;
  }
};

export const askFollowUpQuestion = async (taskId: string, question: string, threadId?: string): Promise<TaskDetailResponse> => {
  try {
    console.log('Sending follow-up question:', { taskId, question, threadId });
    const response = await api.post('/tasks/ask-followup', { 
      taskId,
      question,
      threadId 
    });
    console.log('Raw response from follow-up:', response);
    
    // Ensure we're returning the correct data structure
    const responseData: TaskDetailResponse = {
      subtasks: response.data.subtasks || [],
      message: response.data.message || [],
      threadId: response.data.threadId
    };
    
    console.log('Processed response data:', responseData);
    return responseData;
  } catch (error: any) {
    console.error('Error asking follow-up question:', error);
    throw error;
  }
};

// Task CRUD operations
export const getAllTasks = async (signal?: AbortSignal): Promise<Task[]> => {
  try {
    const response = await api.get('/tasks', { signal });
    return response.data;
  } catch (error: any) {
    if (error.name === 'CanceledError') {
      // Request was aborted, ignore
      return [];
    }
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

export const getTask = async (id: string): Promise<Task> => {
  try {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
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
    const response = await api.put(`/tasks/${id}`, task);
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

export const getSubtasks = async (taskId: string, signal?: AbortSignal): Promise<Subtask[]> => {
  try {
    const response = await api.get(`/tasks/${taskId}/subtasks`, { signal });
    return response.data;
  } catch (error: any) {
    if (error.name === 'CanceledError') {
      // Request was aborted, ignore
      return [];
    }
    console.error('Error fetching subtasks:', error);
    throw error;
  }
};
