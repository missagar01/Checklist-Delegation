import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { 
  countCompleteTaskApi, 
  countOverDueORExtendedTaskApi, 
  countPendingOrDelayTaskApi, 
  countTotalTaskApi, 
  fetchDashboardDataApi 
} from "../api/dashboardApi";

// Dashboard data thunk
export const dashboardData = createAsyncThunk(
  'dashboard/fetchData',
  async ({ dashboardType, staffFilter }) => {
    const data = await fetchDashboardDataApi(dashboardType, staffFilter);
    return data;
  }
);

// Total tasks thunk
export const totalTaskInTable = createAsyncThunk(
  'dashboard/totalTask',
  async ({ dashboardType, staffFilter }) => {
    const totalTask = await countTotalTaskApi(dashboardType, staffFilter);
    return totalTask;
  }
);

// Complete tasks thunk
export const completeTaskInTable = createAsyncThunk(
  'dashboard/completeTask',
  async ({ dashboardType, staffFilter }) => {
    const completeTask = await countCompleteTaskApi(dashboardType, staffFilter);
    return completeTask;
  }
);

// Pending tasks thunk
export const pendingTaskInTable = createAsyncThunk(
  'dashboard/pendingTask',
  async ({ dashboardType, staffFilter }) => {
    const pendingTask = await countPendingOrDelayTaskApi(dashboardType, staffFilter);
    return pendingTask;
  }
);

// Overdue tasks thunk
export const overdueTaskInTable = createAsyncThunk(
  'dashboard/overdueTask',
  async ({ dashboardType, staffFilter }) => {
    const overdueTask = await countOverDueORExtendedTaskApi(dashboardType, staffFilter);
    return overdueTask;
  }
);

const dashboardSlice = createSlice({
  name: 'dashBoard',
  initialState: {
    dashboard: [],
    totalTask: 0,
    completeTask: 0,
    pendingTask: 0,
    overdueTask: 0,
    error: null,
    loading: false,
  },
  reducers: {
    // Reset dashboard state
    resetDashboardState: (state) => {
      state.dashboard = [];
      state.totalTask = 0;
      state.completeTask = 0;
      state.pendingTask = 0;
      state.overdueTask = 0;
      state.error = null;
      state.loading = false;
    },
    // Clear error
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Dashboard Data cases
      .addCase(dashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(dashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboard = action.payload;
      })
      .addCase(dashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || 'Failed to fetch dashboard data';
      })
      
      // Total Task cases
      .addCase(totalTaskInTable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(totalTaskInTable.fulfilled, (state, action) => {
        state.loading = false;
        state.totalTask = action.payload || 0;
      })
      .addCase(totalTaskInTable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || 'Failed to fetch total tasks';
      })
      
      // Complete Task cases
      .addCase(completeTaskInTable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeTaskInTable.fulfilled, (state, action) => {
        state.loading = false;
        state.completeTask = action.payload || 0;
      })
      .addCase(completeTaskInTable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || 'Failed to fetch complete tasks';
      })
      
      // Pending Task cases
      .addCase(pendingTaskInTable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(pendingTaskInTable.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingTask = action.payload || 0;
      })
      .addCase(pendingTaskInTable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || 'Failed to fetch pending tasks';
      })
      
      // Overdue Task cases
      .addCase(overdueTaskInTable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(overdueTaskInTable.fulfilled, (state, action) => {
        state.loading = false;
        state.overdueTask = action.payload || 0;
      })
      .addCase(overdueTaskInTable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || 'Failed to fetch overdue tasks';
      });
  },
});

export const { resetDashboardState, clearError } = dashboardSlice.actions;
export default dashboardSlice.reducer;