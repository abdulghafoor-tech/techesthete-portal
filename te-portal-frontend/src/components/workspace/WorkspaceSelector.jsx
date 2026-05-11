import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Check } from 'lucide-react';
import { setCurrentWorkspace } from '../../redux/slices/workspaceSlice';
import { clearChannels } from '../../redux/slices/channelSlice';
import { clearMessages } from '../../redux/slices/messageSlice';
import Modal from '../common/Modal';

export const WorkspaceSelector = ({ onClose }) => {
  const dispatch = useDispatch();
  const { workspaces, currentWorkspace } = useSelector((state) => state.workspace);

  const handleSelectWorkspace = (workspace) => {
    if (workspace.id !== currentWorkspace?.id) {
      dispatch(setCurrentWorkspace(workspace));
      dispatch(clearChannels());
      dispatch(clearMessages());
    }
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Switch Workspace</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {workspaces.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No workspaces found</p>
          ) : (
            workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => handleSelectWorkspace(workspace)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition ${
                  workspace.id === currentWorkspace?.id
                    ? 'bg-purple-100 border border-purple-500'
                    : 'hover:bg-gray-100 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 rounded flex items-center justify-center text-white font-bold">
                    {workspace.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-800">{workspace.name}</span>
                </div>
                {workspace.id === currentWorkspace?.id && (
                  <Check size={20} className="text-purple-600" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

export default WorkspaceSelector;