import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X } from 'lucide-react';
import { createWorkspace } from '../../redux/slices/workspaceSlice';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';

const CreateWorkspaceModal = ({ onClose }) => {
  console.log('🎨 CreateWorkspaceModal rendered');
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.workspace);
  
const [name, setName] = useState('');
  const handleSubmit = async () => {
    if (!name.trim()) return;

    const result = await dispatch(createWorkspace(name));
    if (result.type === 'workspace/create/fulfilled') {
      onClose();
    }
  };

  // ✅ Handle input change
  const handleChange = (e) => {
    console.log('Workspace name changed:', e.target.value); // Debug
    setName(e.target.value);
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Create Workspace</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workspace Name
            </label>
            <Input
              type="text"
              name="workspaceName"  // ✅ Added name attribute
              placeholder="e.g. My Company"
              value={name}
              onChange={handleChange}  // ✅ Added onChange handler
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              This is the name of your team or organization.
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || loading}
            className="flex-1"
            variant="primary"
          >
            {loading ? 'Creating...' : 'Create'}
          </Button>
          <Button onClick={onClose} className="flex-1" variant="secondary">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateWorkspaceModal;