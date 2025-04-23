import { configureStore } from '@reduxjs/toolkit';
import paperReducer from '../state/index';
import { paperApi } from '../state/api';
import chatbotReducer from "../state/chatbotSlice"; 
import { chatbotApi } from "../state/chatbotApi";  // Import chatbot API
import eduReducer from '../state/eduSlice'; // Import your eduSlice

const store = configureStore({
  reducer: {
    paper: paperReducer,
    [paperApi.reducerPath]: paperApi.reducer,
    chatbot: chatbotReducer,
    [chatbotApi.reducerPath]: chatbotApi.reducer, // Add chatbot API reducer
    eduData: eduReducer,

  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(paperApi.middleware)
      .concat(chatbotApi.middleware), // Include chatbot API middleware
});

export default store;
