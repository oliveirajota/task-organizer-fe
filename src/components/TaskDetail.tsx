import React, { useState } from 'react';
import { Task } from '../types';
import { TaskOrganizer } from './TaskOrganizer';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({ task, onClose }) => {
  const [showOrganizer, setShowOrganizer] = useState(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[80vh] flex flex-col">
        {showOrganizer ? (
          <TaskOrganizer task={task} onClose={() => setShowOrganizer(false)} />
        ) : (
          <>
            {/* Header */}
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-semibold">{task.title}</h2>
                  <p className="text-gray-600 mt-1">Requested by {task.requester}</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-auto">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-700">{task.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Details</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-600">Deadline:</span>{' '}
                        <span>{new Date(task.deadline).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Assigned to:</span>{' '}
                        <span>{task.assigned_to}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>{' '}
                        <span className="capitalize">{task.status}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => setShowOrganizer(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Help me organize this task
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
