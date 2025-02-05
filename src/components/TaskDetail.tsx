import React, { useState, useEffect } from 'react';
import { Task, Subtask } from '../types';
import { ArrowLeft, Send, Loader2, HelpCircle } from 'lucide-react';
import * as api from '../services/api';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}

interface Question {
  id: string;
  text: string;
  answer?: string;
  timestamp: string;
  loading?: boolean;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({ task, onClose }) => {
  const [showOrganizer, setShowOrganizer] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingSubtasks, setIsLoadingSubtasks] = useState(true);

  // Load existing subtasks when component mounts
  useEffect(() => {
    const abortController = new AbortController();
    
    const loadSubtasks = async () => {
      try {
        const existingSubtasks = await api.getSubtasks(task.id, abortController.signal);
        if (existingSubtasks.length > 0) {
          setSubtasks(existingSubtasks);
          setShowOrganizer(true);
        }
      } catch (error) {
        console.error('Error loading subtasks:', error);
      } finally {
        setIsLoadingSubtasks(false);
      }
    };

    loadSubtasks();

    return () => {
      abortController.abort();
    };
  }, [task.id]);

  const handleInitialOrganization = async () => {
    setIsInitializing(true);
    try {
      console.log('Organizing task:', task);
      const response = await api.organizeTask(task);
      console.log('Organization response:', response);
      
      // Handle subtasks if present
      if (response.subtasks && Array.isArray(response.subtasks)) {
        console.log('Setting subtasks:', response.subtasks);
        setSubtasks(response.subtasks);
      } else {
        console.log('No subtasks in response or invalid format:', response);
      }

      // Handle messages if present
      if (response.message && Array.isArray(response.message)) {
        const initialQuestions = response.message.map((message, index) => ({
          id: `${Date.now()}-${index}`,
          text: index === 0 ? 'Help me organize this task' : 'Additional information',
          answer: message,
          timestamp: new Date().toISOString()
        }));
        setQuestions(initialQuestions);
      } else {
        // If no messages, add a default success message
        const defaultQuestion: Question = {
          id: Date.now().toString(),
          text: 'Help me organize this task',
          answer: 'I have organized the task into subtasks. You can find them in the sidebar.',
          timestamp: new Date().toISOString()
        };
        setQuestions([defaultQuestion]);
      }

      // Store thread ID for continued conversation
      if (response.threadId) {
        setCurrentThreadId(response.threadId);
      }

      setShowOrganizer(true);
    } catch (error) {
      console.error('Error organizing task:', error);
      // Show error in the chat
      const errorQuestion: Question = {
        id: Date.now().toString(),
        text: 'Help me organize this task',
        answer: 'Sorry, I encountered an error while organizing the task. Please try again.',
        timestamp: new Date().toISOString()
      };
      setQuestions([errorQuestion]);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleAskQuestion = async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    const newQuestionId = Date.now().toString();
    const newQuestionItem: Question = {
      id: newQuestionId,
      text,
      timestamp: new Date().toISOString(),
      loading: true
    };

    setQuestions(prev => [...prev, newQuestionItem]);
    setNewQuestion('');
    setIsLoading(true);

    try {
      const response = await api.askFollowUpQuestion(
        task.id,
        text,
        currentThreadId || undefined
      );

      // Update subtasks if present in response
      if (response.subtasks) {
        setSubtasks(response.subtasks);
      }

      // Handle messages if present
      if (response.message && response.message.length > 0) {
        setQuestions(prev => {
          const updatedQuestions = [...prev];
          const questionIndex = updatedQuestions.findIndex(q => q.id === newQuestionId);
          
          if (questionIndex !== -1) {
            // Update the original question with the first message
            updatedQuestions[questionIndex] = {
              ...updatedQuestions[questionIndex],
              answer: response.message[0],
              loading: false
            };
            
            // Add additional messages as separate entries
            const additionalMessages = response.message.slice(1).map((message, index) => ({
              id: `${newQuestionId}-additional-${index}`,
              text: 'Additional information',
              answer: message,
              timestamp: new Date().toISOString()
            }));
            
            updatedQuestions.splice(questionIndex + 1, 0, ...additionalMessages);
          }
          
          return updatedQuestions;
        });
      } else {
        // If no messages, just remove loading state and add default response
        setQuestions(prev => prev.map(q => 
          q.id === newQuestionId
            ? {
                ...q,
                answer: 'I have updated the task organization. Check the subtasks in the sidebar.',
                loading: false
              }
            : q
        ));
      }

      // Store thread ID for continued conversation
      if (response.threadId) {
        setCurrentThreadId(response.threadId);
      }
    } catch (error) {
      console.error('Error getting response:', error);
      setQuestions(prev => prev.map(q => 
        q.id === newQuestionId
          ? {
              ...q,
              answer: 'Sorry, I encountered an error while processing your question. Please try again.',
              loading: false
            }
          : q
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-semibold">{task.title}</h1>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <span>Requester: {task.requester}</span>
                <span className="mx-2">•</span>
                <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                {task.status && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="capitalize">{task.status}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoadingSubtasks ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 size={20} className="animate-spin text-blue-500" />
          </div>
        ) : !showOrganizer ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <HelpCircle size={48} className="mx-auto mb-4 text-blue-500" />
              <h2 className="text-xl font-semibold mb-4">Need help organizing this task?</h2>
              <button
                onClick={handleInitialOrganization}
                disabled={isInitializing}
                className={`inline-flex items-center px-4 py-2 rounded-lg ${
                  isInitializing
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isInitializing ? (
                  <>
                    <Loader2 size={20} className="animate-spin mr-2" />
                    Organizing task...
                  </>
                ) : (
                  'Help me organize this task'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-6">
            {/* Questions and Answers */}
            <div className="flex-1">
              <div className="space-y-6">
                {questions.map(question => (
                  <div key={question.id} className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500 mb-2">{question.timestamp}</div>
                    <div className="font-medium text-blue-600 mb-2">{question.text}</div>
                    {question.loading ? (
                      <div className="flex items-center text-gray-500 mt-4">
                        <Loader2 size={16} className="animate-spin mr-2" />
                        <span>Getting response...</span>
                      </div>
                    ) : question.answer && (
                      <div className="text-gray-700 mt-2">{question.answer}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Question input */}
              <div className="mt-6 bg-white rounded-lg shadow p-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Ask a question about this task..."
                    className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAskQuestion(newQuestion);
                      }
                    }}
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => handleAskQuestion(newQuestion)}
                    className={`p-2 rounded-lg ${
                      isLoading 
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Send size={20} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-80">
              {/* Subtasks List */}
              <div className="bg-white rounded-lg shadow p-4 mb-6">
                <h2 className="font-semibold mb-4">Subtasks ({subtasks.length})</h2>
                <div className="space-y-3">
                  {console.log('Rendering subtasks:', subtasks)}
                  {subtasks && subtasks.length > 0 ? (
                    subtasks.map((subtask, index) => (
                      <div key={subtask.id || index} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">{subtask.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{subtask.description}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            subtask.priority === 'High' 
                              ? 'bg-red-100 text-red-800'
                              : subtask.priority === 'Medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {subtask.priority}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          <div>Due: {new Date(subtask.deadline).toLocaleDateString()}</div>
                          <div>Status: {subtask.status}</div>
                          {subtask.assigned_to && (
                            <div>Assigned to: {subtask.assigned_to}</div>
                          )}
                        </div>
                        {subtask.best_approach && (
                          <div className="mt-2 text-xs text-gray-600 italic">
                            Tip: {subtask.best_approach}
                          </div>
                        )}
                        {subtask.dependencies && (
                          <div className="mt-2 text-xs text-gray-500">
                            <div>Dependencies:</div>
                            <ul className="list-disc list-inside">
                              <li>{subtask.dependencies}</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm">No subtasks available</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
