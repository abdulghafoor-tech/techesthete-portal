import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchWorkspaces, 
  setCurrentWorkspace,
  createWorkspace as createWorkspaceAction 
} from '../redux/slices/workspaceSlice';

export const useWorkspace = () => {
  const dispatch = useDispatch();
  const { workspaces, currentWorkspace, loading, error } = useSelector(
    (state) => state.workspace
  );

  useEffect(() => {
    if (workspaces.length === 0) {
      dispatch(fetchWorkspaces());
    }
  }, [dispatch, workspaces.length]);

  const selectWorkspace = (workspace) => {
    dispatch(setCurrentWorkspace(workspace));
  };

  const createWorkspace = async (name) => {
    return await dispatch(createWorkspaceAction(name));
  };

  return {
    workspaces,
    currentWorkspace,
    loading,
    error,
    selectWorkspace,
    createWorkspace,
  };
};