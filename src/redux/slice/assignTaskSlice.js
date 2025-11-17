import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { 
  fetchUniqueDepartmentDataApi, 
  fetchUniqueDoerNameDataApi, 
  fetchUniqueGivenByDataApi, 
  pushAssignTaskApi 
} from '../api/assignTaskApi';

// 1️⃣ Fetch Departments
export const uniqueDepartmentData = createAsyncThunk(
  'assignTask/fetchDepartments',
  async (user_name) => {
    return await fetchUniqueDepartmentDataApi(user_name);
  }
);

// 2️⃣ Fetch Given-By
export const uniqueGivenByData = createAsyncThunk(
  'assignTask/fetchGivenBy',
  async () => {
    return await fetchUniqueGivenByDataApi();
  }
);

// 3️⃣ Fetch Doer Names
export const uniqueDoerNameData = createAsyncThunk(
  'assignTask/fetchDoerNames',
  async (department) => {
    return await fetchUniqueDoerNameDataApi(department);
  }
);

// 4️⃣ Insert Tasks
export const assignTaskInTable = createAsyncThunk(
  'assignTask/postTasks',
  async (generatedTasks) => {
    return await pushAssignTaskApi(generatedTasks);
  }
);

// ---------------- Slice ------------------

const assignTaskSlice = createSlice({
  name: 'assignTask',
  initialState: {
    department: [],
    givenBy: [],
    doerName: [],
    assignTask: [],
    loading: false,
    error: null
  },

  reducers: {},

  extraReducers: (builder) => {
    builder
      // Department
      .addCase(uniqueDepartmentData.pending, (state) => {
        state.loading = true;
      })
      .addCase(uniqueDepartmentData.fulfilled, (state, action) => {
        state.loading = false;
        state.department = action.payload;
      })
      .addCase(uniqueDepartmentData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error;
      })

      // Given By
      .addCase(uniqueGivenByData.fulfilled, (state, action) => {
        state.givenBy = action.payload;
      })

      // Doer Name
      .addCase(uniqueDoerNameData.fulfilled, (state, action) => {
        state.doerName = action.payload;
      })

      // Insert Tasks
      .addCase(assignTaskInTable.fulfilled, (state, action) => {
        state.assignTask.push(action.payload);
      });
  },
});

export default assignTaskSlice.reducer;
