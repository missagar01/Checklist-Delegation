import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchDelegationDataSortByDate,
  fetchDelegation_DoneDataSortByDate,
  insertDelegationDoneAndUpdate,
} from "../api/delegationApi";

export const delegationData = createAsyncThunk(
  "delegation/fetchPending",
  async () => {
    return await fetchDelegationDataSortByDate();
  }
);

export const delegationDoneData = createAsyncThunk(
  "delegation/fetchDone",
  async () => {
    return await fetchDelegation_DoneDataSortByDate();
  }
);

export const submitDelegation = createAsyncThunk(
  "delegation/submit",
  async (payload) => {
    return await insertDelegationDoneAndUpdate(payload);
  }
);

const delegationSlice = createSlice({
  name: "delegation",
  initialState: {
    delegation: [],
    delegation_done: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Pending
      .addCase(delegationData.pending, (state) => {
        state.loading = true;
      })
      .addCase(delegationData.fulfilled, (state, action) => {
        state.loading = false;
        state.delegation = action.payload;
      })
      .addCase(delegationData.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to fetch delegation";
      })

      // Fetch Done
      .addCase(delegationDoneData.pending, (state) => {
        state.loading = true;
      })
      .addCase(delegationDoneData.fulfilled, (state, action) => {
        state.loading = false;
        state.delegation_done = action.payload;
      })
      .addCase(delegationDoneData.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to fetch done delegation";
      })

      // Submit
      .addCase(submitDelegation.pending, (state) => {
        state.loading = true;
      })
      .addCase(submitDelegation.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(submitDelegation.rejected, (state) => {
        state.loading = false;
        state.error = "Submission failed";
      });
  },
});

export default delegationSlice.reducer;
