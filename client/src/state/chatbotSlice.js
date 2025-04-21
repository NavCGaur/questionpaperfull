import { createSlice } from "@reduxjs/toolkit";

const chatbotSlice = createSlice({
  name: "chatbot",
    initialState: {
      isOpen: false,
      isTyping: false,
      messages: [
        { text: "Hi! How can I help you today?", sender: "bot" },
        { 
          text: `I can assist you with:\n
                1️⃣ Generate Questions.\n\n
                2️⃣ Doubt Solving.\n
                3️⃣ Lesson plans.\n
                4️⃣ Teaching strategies.\n
                5️⃣ Site Support.\n
                Which one should I help you with?`,
          sender: "bot"
        }
    ],
  },
  reducers: {
    toggleChatbot: (state) => {
      state.isOpen = !state.isOpen;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setTyping: (state, action) => {
      state.isTyping = action.payload;
    },
    setUserId: (state, action) => {
      state.userId = action.payload;
    }
  }
});

export const { toggleChatbot, addMessage, setTyping, setUserId } = chatbotSlice.actions;
export default chatbotSlice.reducer;
