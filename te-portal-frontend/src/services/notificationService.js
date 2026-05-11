class NotificationService {
  constructor() {
    this.permission = 'default';
    this.requestPermission();
    this.soundEnabled = true;
    this.notificationSound = null;
    this.initSound();
  }

  async requestPermission() {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
    }
  }

  initSound() {
    // Create notification sound (you can replace with actual sound file)
    try {
      this.notificationSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    } catch (error) {
      // Silently fail if sound initialization fails
    }
  }

  playNotificationSound() {
    if (this.soundEnabled && this.notificationSound) {
      try {
        this.notificationSound.currentTime = 0;
        this.notificationSound.play().catch(() => {
          // Silently fail if sound play fails
        });
      } catch (error) {
        // Silently fail if sound play fails
      }
    }
  }

  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
  }

  showNotification(title, options = {}) {
    // Only show if permission granted and browser tab is hidden
    if (this.permission === 'granted' && document.hidden) {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        // Optional: Navigate to the conversation/channel
        if (options.onClick) {
          options.onClick();
        }
      };

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    }
    return null;
  }

  showMessageNotification(senderName, message, channelName, channelId, workspaceId) {
    this.playNotificationSound();
    
    return this.showNotification(`${senderName} in #${channelName}`, {
      body: message.length > 100 ? message.substring(0, 100) + '...' : message,
      icon: '/favicon.ico',
      tag: `channel-${channelId}`,
      requireInteraction: false,
      onClick: () => {
        // Navigate to channel
        window.location.href = `/workspace/${workspaceId}/channel/${channelId}`;
      }
    });
  }

  showDMNotification(senderName, message, conversationId, workspaceId, senderImage = null) {
    this.playNotificationSound();
    
    return this.showNotification(`${senderName} sent you a message`, {
      body: message.length > 100 ? message.substring(0, 100) + '...' : message,
      icon: senderImage ? `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'}${senderImage}` : '/favicon.ico',
      tag: `dm-${conversationId}`,
      requireInteraction: false,
      onClick: () => {
        // Navigate to DM
        window.location.href = `/workspace/${workspaceId}/dm/${conversationId}`;
      }
    });
  }

  // Show browser notification for mentions
  showMentionNotification(senderName, message, channelName, channelId, workspaceId) {
    this.playNotificationSound();
    
    return this.showNotification(`${senderName} mentioned you in #${channelName}`, {
      body: message.length > 100 ? message.substring(0, 100) + '...' : message,
      icon: '/favicon.ico',
      tag: `mention-${channelId}`,
      requireInteraction: true, // Keep visible until user interacts
      onClick: () => {
        window.location.href = `/workspace/${workspaceId}/channel/${channelId}`;
      }
    });
  }
}

export default new NotificationService();