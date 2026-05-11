import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import workspaceReducer from './slices/workspaceSlice';
import channelReducer from './slices/channelSlice';
import messageReducer from './slices/messageSlice';
import uiReducer from './slices/uiSlice';

// Persist configuration for messages
const messagePersistConfig = {
  key: 'message',
  storage,
  whitelist: ['messagesByChannel', 'messagesByConversation'], // Only persist messages
};

// Persist configuration for auth
const authPersistConfig = {
  key: 'auth',
  storage,
};

// Combine reducers
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  workspace: workspaceReducer,
  channel: channelReducer,
  message: persistReducer(messagePersistConfig, messageReducer),
  ui: uiReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export default store;