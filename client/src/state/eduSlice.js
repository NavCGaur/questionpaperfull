// eduSlice.js
import { createSlice } from '@reduxjs/toolkit';

const eduSlice = createSlice({
  name: 'eduData',
  initialState: {
    data: null,
    isLoading: false,
    isError: false
  },
  reducers: {
    setEduData: (state, action) => {
      state.data = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.isError = action.payload;
    }
  }
});

export const { setEduData, setLoading, setError } = eduSlice.actions;
export default eduSlice.reducer;