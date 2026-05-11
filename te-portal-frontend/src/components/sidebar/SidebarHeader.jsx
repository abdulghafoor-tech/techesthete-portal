import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Plus, Edit2, Trash2, Settings } from 'lucide-react';
import CreateWorkspaceModal from '../workspace/CreateWorkspaceModal';
import WorkspaceSelector from '../workspace/WorkspaceSelector';
import { updateWorkspace, deleteWorkspace } from '../../redux/slices/workspaceSlice';

const SidebarHeader = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentWorkspace, workspaces } = useSelector((state) => state.workspace);
  const { user } = useSelector((state) => state.auth);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showWorkspaceSelector, setShowWorkspaceSelector] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const menuRef = useRef(null);

  console.log('📺 SidebarHeader render - showWorkspaceModal:', showWorkspaceModal);

  // Check if current user is workspace owner
  const isOwner = currentWorkspace?.ownerId === user?.id;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowWorkspaceMenu(false);
      }
    };

    if (showWorkspaceMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showWorkspaceMenu]);

  const handleRenameWorkspace = () => {
    setShowWorkspaceMenu(false);
    setNewWorkspaceName(currentWorkspace?.name || '');
    setShowRenameModal(true);
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (newWorkspaceName.trim() && newWorkspaceName !== currentWorkspace?.name) {
      try {
        await dispatch(updateWorkspace({
          workspaceId: currentWorkspace.id,
          data: { name: newWorkspaceName.trim() }
        })).unwrap();
        setShowRenameModal(false);
      } catch (error) {
        console.error("Failed to rename workspace:", error);
      }
    }
  };

  const handleDeleteWorkspace = async () => {
    setShowWorkspaceMenu(false);
    
    if (window.confirm(`Are you sure you want to delete "${currentWorkspace?.name}"? This will delete all channels, messages, and members. This action cannot be undone.`)) {
      try {
        await dispatch(deleteWorkspace(currentWorkspace.id)).unwrap();
        
        // Navigate to first available workspace or home
        if (workspaces.length > 1) {
          const nextWorkspace = workspaces.find(w => w.id !== currentWorkspace.id);
          if (nextWorkspace) {
            navigate(`/workspace/${nextWorkspace.id}`);
          } else {
            navigate('/');
          }
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error("Failed to delete workspace:", error);
        alert("Failed to delete workspace. Please try again.");
      }
    }
  };

  return (
    <>
      <div className="px-4 py-3 border-b border-purple-800/30">
        {/* Workspace Name */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 min-w-0 relative">
            <div
              className="flex items-center gap-1.5 cursor-pointer hover:bg-purple-700/50 p-1.5 rounded-lg transition-colors"
              onClick={() => setShowWorkspaceSelector(true)}
            >
              <h2 className="font-bold text-base truncate text-white leading-tight">
                {currentWorkspace?.name || 'Techesthete'}
              </h2>
              <ChevronDown size={14} className="text-purple-200 shrink-0" />
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Settings/Menu Button (Owner only) */}
            {isOwner && (
              <button 
                className="p-2 hover:bg-purple-700 rounded-lg text-purple-200 transition relative"
                onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                title="Workspace settings"
              >
                <Settings size={18} strokeWidth={2} />
              </button>
            )}
            
            {/* Create Workspace Button */}
            <button 
              className="p-2 hover:bg-purple-700 rounded-lg text-purple-200 transition"
              onClick={() => {
                console.log('➕ Create workspace button clicked');
                setShowWorkspaceModal(true);
              }}
              title="Create new workspace"
            >
              <Plus size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Workspace Settings Menu */}
        {showWorkspaceMenu && isOwner && (
          <div
            ref={menuRef}
            className="absolute right-4 top-16 bg-white rounded-lg shadow-xl z-50 py-1 min-w-[200px] border border-gray-200"
          >
            <button
              onClick={handleRenameWorkspace}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition text-sm text-gray-700"
            >
              <Edit2 size={16} />
              <span>Rename workspace</span>
            </button>
            <div className="border-t my-1"></div>
            <button
              onClick={handleDeleteWorkspace}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition text-sm text-red-600"
            >
              <Trash2 size={16} />
              <span>Delete workspace</span>
            </button>
          </div>
        )}
      </div>

      {/* Rename Workspace Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Rename Workspace</h3>
            <form onSubmit={handleRenameSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g. My Company"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!newWorkspaceName.trim() || newWorkspaceName === currentWorkspace?.name}
                  className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRenameModal(false);
                    setNewWorkspaceName('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals */}
      {showWorkspaceModal && (
        <CreateWorkspaceModal onClose={() => setShowWorkspaceModal(false)} />
      )}

      {showWorkspaceSelector && (
        <WorkspaceSelector onClose={() => setShowWorkspaceSelector(false)} />
      )}
    </>
  );
};

export default SidebarHeader;