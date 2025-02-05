import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Send, ArrowLeft, User, MessageSquare, AlertCircle } from 'lucide-react';
import { Task, AIResponse } from './types';
import * as api from './services/api';
import { TaskDetail } from './components/TaskDetail';

function App() {
  const [message, setMessage] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [needsContext, setNeedsContext] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'calendar'>('upcoming');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const fetchedTasks = await api.getAllTasks();
      setTasks(fetchedTasks);
    } catch (err) {
      setError('Failed to load tasks');
      console.error('Error loading tasks:', err);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const getPriorityColor = (dueDate: string) => {
    const days = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    if (days <= 3) return 'text-red-500 bg-red-50';
    if (days <= 7) return 'text-yellow-500 bg-yellow-50';
    return 'text-green-500 bg-green-50';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.processMessage(message, currentThreadId || undefined);

      if (response.status === 'success') {
        const newTasks = Array.isArray(response.data) ? response.data : response.data.tasks || [];
        setTasks(prevTasks => [...prevTasks, ...newTasks]);
        setMessage('');
        setNeedsContext(false);
        setQuestions([]);
        setCurrentThreadId(response.threadId || null);
      } else if (response.status === 'needs_context') {
        setNeedsContext(true);
        setQuestions(response.data.questions || []);
        setCurrentThreadId(response.threadId || null);
      }
    } catch (err) {
      setError('Failed to process message');
      console.error('Error processing message:', err);
    }

    setLoading(false);
  };

  if (selectedTask) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white border-b border-gray-200 p-4">
          <button 
            onClick={() => setSelectedTask(null)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
        <div className="flex-1 p-6">
          <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar - Upcoming Deadlines */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold">Upcoming Deadlines</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.request_date}
                onClick={() => handleTaskClick(task)}
                className="border rounded-lg p-3 cursor-pointer hover:shadow-md transition-all"
              >
                <h3 className="font-medium mb-1">{task.title}</h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center text-gray-500">
                    <User className="w-4 h-4 mr-1" />
                    {task.assigned_to}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${getPriorityColor(task.deadline)}`}>
                    Due {new Date(task.deadline).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'upcoming' 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Upcoming Tasks
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'calendar' 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Calendar View
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          {activeTab === 'calendar' ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Calendar integration coming soon
            </div>
          ) : (
            <div className="space-y-4">
              {needsContext && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center text-yellow-800 mb-2">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <h3 className="font-medium">More Information Needed</h3>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-yellow-700">
                    {questions.map((question, index) => (
                      <li key={index}>{question}</li>
                    ))}
                  </ul>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  // Auto-resize logic
                  e.target.style.height = 'inherit';
                  const computed = window.getComputedStyle(e.target);
                  const height = parseInt(computed.getPropertyValue('border-top-width'), 10)
                             + parseInt(computed.getPropertyValue('padding-top'), 10)
                             + e.target.scrollHeight
                             + parseInt(computed.getPropertyValue('padding-bottom'), 10)
                             + parseInt(computed.getPropertyValue('border-bottom-width'), 10);
                  
                  // Set height with min of 1 line and max of 4 lines
                  const lineHeight = 24; // Approximate line height
                  const maxHeight = lineHeight * 4;
                  e.target.style.height = `${Math.min(height, maxHeight)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      if (message.trim() && !loading) {
                        handleSubmit(e);
                      }
                    }
                  }
                }}
                placeholder="Paste your message here from Slack, Email, Discord, etc... (Press Enter to send, Shift+Enter for new line)"
                className={`w-full p-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-auto transition-colors ${
                  loading ? 'bg-gray-50' : 'bg-white'
                }`}
                style={{
                  minHeight: '24px', // One line height
                  maxHeight: '96px', // Four lines height
                  lineHeight: '24px'
                }}
                disabled={loading}
              />
              <div className="absolute right-2 top-4">
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-blue-600">Processing...</div>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || !message.trim()}
                    className="p-2 text-blue-500 hover:text-blue-600 disabled:text-gray-300 transition-colors"
                    title="Send message (Enter)"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            {currentThreadId && (
              <div className="mt-2 text-sm text-gray-500 flex items-center">
                <MessageSquare className="w-4 h-4 mr-1" />
                Continuing conversation...
              </div>
            )}
            {loading && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center text-blue-700">
                  <div className="mr-3">
                    <div className="animate-pulse flex space-x-1">
                      <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                      <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                      <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                    </div>
                  </div>
                  <div className="font-medium">Analyzing your message and extracting tasks...</div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;