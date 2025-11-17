import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { 
  fetchChechListDataForHistory, 
  fetchChechListDataSortByDate, 
  postChecklistAdminDoneAPI, 
  updateChecklistData 
} from "../api/checkListApi";


// ============================================================
// 1️⃣ FETCH PENDING CHECKLIST
// ============================================================
export const checklistData = createAsyncThunk(
  "fetch/checklist",
  async (page = 1) => {
    const { data, totalCount } = await fetchChechListDataSortByDate(page);
    return { data, totalCount, page };
  }
);


// ============================================================
// 2️⃣ FETCH HISTORY CHECKLIST
// ============================================================
export const checklistHistoryData = createAsyncThunk(
  "fetch/history",
  async (page = 1) => {
    const historyData = await fetchChechListDataForHistory(page);
    return { data: historyData, page };
  }
);


// ============================================================
// 3️⃣ UPDATE CHECKLIST (USER SUBMISSION)
// ============================================================
export const updateChecklist = createAsyncThunk(
  "update/checklist",
  async (submissionData) => {
    const updated = await updateChecklistData(submissionData);
    return updated;  // returns only message
  }
);


// ============================================================
// 4️⃣ ADMIN DONE
// ============================================================
export const checklistAdminDone = createAsyncThunk(
  "insert/admin_done",
  async (items) => {
    const admin_done = await postChecklistAdminDoneAPI(items);
    return admin_done;
  }
);


// ============================================================
// 5️⃣ SLICE
// ============================================================
const checkListSlice = createSlice({
  name: "checklist",
  initialState: {
    checklist: [],
    history: [],
    loading: false,
    error: null,
    hasMore: true,
    currentPage: 1,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder

      // -----------------------------
      // FETCH PENDING CHECKLIST
      // -----------------------------
      .addCase(checklistData.pending, (state) => {
        state.loading = true;
      })

      .addCase(checklistData.fulfilled, (state, action) => {
        state.loading = false;

        if (action.payload.page === 1) {
          state.checklist = action.payload.data;
        } else {
          state.checklist = [...state.checklist, ...action.payload.data];
        }

        state.currentPage = action.payload.page;

        // Determine pagination
        state.hasMore = state.checklist.length < action.payload.totalCount;
      })

      .addCase(checklistData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || "Failed fetching checklist";
      })



      // -----------------------------
      // FETCH HISTORY
      // -----------------------------
      .addCase(checklistHistoryData.pending, (state) => {
        state.loading = true;
      })

      .addCase(checklistHistoryData.fulfilled, (state, action) => {
        state.loading = false;

        if (action.payload.page === 1) {
          state.history = action.payload.data;
        } else {
          state.history = [...state.history, ...action.payload.data];
        }
      })

      .addCase(checklistHistoryData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || "Failed fetching history";
      })



      // -----------------------------
      // UPDATE CHECKLIST (USER SUBMIT)
      // -----------------------------
      .addCase(updateChecklist.pending, (state) => {
        state.loading = true;
      })

      .addCase(updateChecklist.fulfilled, (state) => {
        state.loading = false;
        // No need to update state.checklist – backend already saved
      })

      .addCase(updateChecklist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || "Failed updating checklist";
      })



      // -----------------------------
      // ADMIN DONE
      // -----------------------------
      .addCase(checklistAdminDone.pending, (state) => {
        state.loading = true;
      })

      .addCase(checklistAdminDone.fulfilled, (state) => {
        state.loading = false;
      })

      .addCase(checklistAdminDone.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || "Admin update failed";
      });
  },
});

export default checkListSlice.reducer;
