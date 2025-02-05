import React, { useState, useEffect } from 'react';
import { Send, ChevronRight } from 'react-feather';
import { Task, SubTask } from '../types';
import { organizeTask, askFollowUpQuestion } from '../services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface TaskOrganizerProps {
  task: Task;
  onClose: () => void;
}

export const TaskOrganizer: React.FC<TaskOrganizerProps> = ({ task, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [threadId, setThreadId] = useState<string | undefined>();
  const [organizationComplete, setOrganizationComplete] = useState(false);

  // Initial organization when component mounts
  useEffect(() => {
    const initializeOrganization = async () => {
      try {
        const response = await organizeTask(task);
        if (response.data?.tasks) {
          setSubTasks(response.data.tasks);
        }
        setThreadId(response.threadId);
        setMessages([{ role: 'assistant', content: response.message }]);
        setOrganizationComplete(true);
      } catch (error) {
        console.error('Error organizing task:', error);
        setMessages([{ 
          role: 'assistant', 
          content: 'Sorry, I encountered an error while organizing the task.' 
        }]);
      }
      setLoading(false);
    };

    initializeOrganization();
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || loading) return;

    const userMessage = currentMessage;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setCurrentMessage('');
    setLoading(true);

    try {
      const response = await askFollowUpQuestion(task.id, userMessage, threadId);
      setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
      
      // Update subtasks if the response includes new ones
      if (response.data?.tasks) {
        setSubTasks(response.data.tasks);
      }
    } catch (error) {
      console.error('Error getting response:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error while processing your request.' 
      }]);
    }

    setLoading(false);
  };

  const suggestedQuestions = [
    'What are the key stakeholders for this task?',
    'Can you break down the main objectives?',
    'What are the dependencies between subtasks?',
    'What are the potential risks?',
    'How should we prioritize these subtasks?'
  ];

  if (!organizationComplete) {
    return (
      <div className="flex flex-col h-full bg-white rounded-lg shadow-lg items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Analyzing and organizing your task...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">Task Organization</h2>
        <p className="text-sm text-gray-600 mt-1">{task.title}</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="animate-pulse flex space-x-1">
                  <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                </div>
                <span>Thinking...</span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex items-center space-x-2">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Ask a question about the task..."
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !currentMessage.trim()}
                className="p-2 text-blue-500 hover:text-blue-600 disabled:text-gray-300"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l overflow-auto">
          {/* Subtasks */}
          <div className="p-4">
            <h3 className="font-semibold mb-3">Subtasks</h3>
            <div className="space-y-3">
              {subTasks.map((subtask, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium">{subtask.title}</div>
                  <p className="text-sm text-gray-600 mt-1">{subtask.description}</p>
                  <div className="text-xs text-gray-500 mt-2">
                    Assigned to: {subtask.assigned_to || 'Unassigned'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Questions */}
          <div className="p-4 border-t">
            <h3 className="font-semibold mb-3">Suggested Questions</h3>
            <div className="space-y-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentMessage(question)}
                  className="flex items-center text-left text-sm text-gray-600 hover:text-blue-500 w-full group"
                >
                  <ChevronRight className="w-4 h-4 mr-1 opacity-0 group-hover:opacity-100" />
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
