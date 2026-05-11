
import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
  
    sidebarOpen: true,
    
    
    loading: false,
    globalLoading: false,
    
  
    notifications: [],
    
    
    activeModal: null,
    
    
    theme: 'light', 
    
    searchQuery: '',
    searchResults: [],
    isSearching: false,
    
    
    isMobile: window.innerWidth < 768,
    
  
    error: null,
    
  
    isTyping: false,
    typingUsers: [],
    
    // Settings
    settings: {
      notifications: true,
      soundEnabled: true,
      darkMode: false,
      fontSize: 'medium', 
    },
  },
  
  reducers: {
    
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    
    closeSidebar: (state) => {
      state.sidebarOpen = false;
    },
    
    openSidebar: (state) => {
      state.sidebarOpen = true;
    },
    
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    
    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload;
    },
    
    
    addNotification: (state, action) => {
      const notification = {
        id: Date.now(),
        type: action.payload.type || 'info', 
        message: action.payload.message,
        duration: action.payload.duration || 3000,
        timestamp: new Date().toISOString(),
      };
      state.notifications.push(notification);
    },
    
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
    },
    

    openModal: (state, action) => {
      state.activeModal = action.payload;
    },
    
    closeModal: (state) => {
      state.activeModal = null;
    },
    
    
    setTheme: (state, action) => {
      state.theme = action.payload;
      state.settings.darkMode = action.payload === 'dark';
    },
    
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      state.settings.darkMode = state.theme === 'dark';
    },
    
    
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    
    setSearchResults: (state, action) => {
      state.searchResults = action.payload;
    },
    
    setIsSearching: (state, action) => {
      state.isSearching = action.payload;
    },
    
    clearSearch: (state) => {
      state.searchQuery = '';
      state.searchResults = [];
      state.isSearching = false;
    },
    
  
    setIsMobile: (state, action) => {
      state.isMobile = action.payload;
    },
    
    
    setError: (state, action) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
  
    setIsTyping: (state, action) => {
      state.isTyping = action.payload;
    },
    
    addTypingUser: (state, action) => {
      if (!state.typingUsers.includes(action.payload)) {
        state.typingUsers.push(action.payload);
      }
    },
    
    removeTypingUser: (state, action) => {
      state.typingUsers = state.typingUsers.filter(
        (userId) => userId !== action.payload
      );
    },
    
    clearTypingUsers: (state) => {
      state.typingUsers = [];
    },
    
  
    updateSettings: (state, action) => {
      state.settings = {
        ...state.settings,
        ...action.payload,
      };
    },
    
    toggleNotifications: (state) => {
      state.settings.notifications = !state.settings.notifications;
    },
    
    toggleSound: (state) => {
      state.settings.soundEnabled = !state.settings.soundEnabled;
    },
    
    setFontSize: (state, action) => {
      state.settings.fontSize = action.payload;
    },
    

    resetUI: (state) => {
      state.sidebarOpen = true;
      state.loading = false;
      state.globalLoading = false;
      state.notifications = [];
      state.activeModal = null;
      state.searchQuery = '';
      state.searchResults = [];
      state.isSearching = false;
      state.error = null;
      state.isTyping = false;
      state.typingUsers = [];
    },
  },
});

export const {

  toggleSidebar,
  setSidebarOpen,
  closeSidebar,
  openSidebar,
  

  setLoading,
  setGlobalLoading,
  

  addNotification,
  removeNotification,
  clearNotifications,
  

  openModal,
  closeModal,

  setTheme,
  toggleTheme,
  

  setSearchQuery,
  setSearchResults,
  setIsSearching,
  clearSearch,
  
  
  setIsMobile,
  

  setError,
  clearError,
  

  setIsTyping,
  addTypingUser,
  removeTypingUser,
  clearTypingUsers,
  
  
  updateSettings,
  toggleNotifications,
  toggleSound,
  setFontSize,
  
  
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;