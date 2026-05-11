import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeNotification } from '../../redux/slices/uiSlice';
import Notification from './Notification';

const NotificationContainer = () => {
  const dispatch = useDispatch();
  const { notifications } = useSelector((state) => state.ui);

  const handleClose = (id) => {
    dispatch(removeNotification(id));
  };

  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      <div className="pointer-events-auto">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            notification={notification}
            onClose={handleClose}
          />
        ))}
      </div>
    </div>
  );
};

export default NotificationContainer;