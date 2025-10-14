import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { 
  deleteChecklistTasksApi, 
  deleteDelegationTasksApi, 
  fetchChecklistData, 
  fetchDelegationData,
  updateChecklistTaskApi  // ← Make sure this is imported
} from "../api/quickTaskApi";

export const uniqueChecklistTaskData = createAsyncThunk(
  'fetch/checklistTask',
  async () => {
    const Task = await fetchChecklistData();
    return Task;
  }
);

export const uniqueDelegationTaskData = createAsyncThunk(
  'fetch/delegationTask',
  async () => {
    const Task = await fetchDelegationData();
    return Task;
  }
);

export const deleteChecklistTask = createAsyncThunk(
  'delete/checklistTask',
  async (taskIds, { rejectWithValue }) => {
    try {
      return await deleteChecklistTasksApi(taskIds);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteDelegationTask = createAsyncThunk(
  'delete/delegationTask',
  async (taskIds, { rejectWithValue }) => {
    try {
      return await deleteDelegationTasksApi(taskIds);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ← ADD THIS UPDATE FUNCTION
export const updateChecklistTask = createAsyncThunk(
  'update/checklistTask',
  async ({ updatedTask, originalTask }, { rejectWithValue }) => {
    try {
      console.log("Redux action called with:", { updatedTask, originalTask });
      const result = await updateChecklistTaskApi(updatedTask, originalTask);
      return result;
    } catch (error) {
      console.error("Redux action error:", error);
      return rejectWithValue(error.message);
    }
  }
);

const quickTaskSlice = createSlice({
  name: 'quickTask',
  initialState: {
    quickTask: [],
    delegationTasks: [],
    error: null,
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(uniqueChecklistTaskData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uniqueChecklistTaskData.fulfilled, (state, action) => {
        state.loading = false;
        state.quickTask = action.payload;
      })
      .addCase(uniqueChecklistTaskData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(uniqueDelegationTaskData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uniqueDelegationTaskData.fulfilled, (state, action) => {
        state.loading = false;
        state.delegationTasks = action.payload;
      })
      .addCase(uniqueDelegationTaskData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(deleteChecklistTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteChecklistTask.fulfilled, (state, action) => {
        state.loading = false;
        state.quickTask = state.quickTask.filter(
          task => !action.payload.includes(task.task_id)
        );
      })
      .addCase(deleteChecklistTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(deleteDelegationTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteDelegationTask.fulfilled, (state, action) => {
        state.loading = false;
        state.delegationTasks = state.delegationTasks.filter(
          task => !action.payload.includes(task.task_id)
        );
      })
      .addCase(deleteDelegationTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ← ADD THESE UPDATE CASES
      .addCase(updateChecklistTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateChecklistTask.fulfilled, (state, action) => {
        state.loading = false;
        const updatedTasks = action.payload; // Array of updated tasks
        
        // Update all matching tasks in the state
        if (Array.isArray(updatedTasks)) {
          updatedTasks.forEach(updatedTask => {
            const index = state.quickTask.findIndex(task => task.task_id === updatedTask.task_id);
            if (index !== -1) {
              state.quickTask[index] = updatedTask;
            }
          });
        }
      })
      .addCase(updateChecklistTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default quickTaskSlice.reducer;