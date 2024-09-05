import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface wpTableState {
  tables: {
    [key: string]: any; // Adjust the type according to your actual data structure
  };
}

const initialState: wpTableState = {
  tables: {}, // Initialize with an empty object or default structure
};

export const setTableSlice = createSlice({
  name: 'wpTableState',
  initialState,
  reducers: {
    setTable: (state, action: PayloadAction<{ tables: { [key: string]: any } }>) => {
      state.tables = action.payload.tables; // Update state.tables directly
    },
  },
});

// Action creators are generated for each case reducer function
export const { setTable } = setTableSlice.actions;

export default setTableSlice.reducer;
