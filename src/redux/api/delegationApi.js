import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
// const API = "http://localhost:5050/api";
const API = `${import.meta.env.VITE_API_BASE_URL}`;

// FETCH PENDING
export const fetchDelegationDataSortByDate = async () => {
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("user-name");
  const userAccess = localStorage.getItem("user_access");

  const { data } = await axios.get(`${API}/delegation`, {
    params: { role, username, user_access: userAccess },
  });

  return data;
};

// FETCH DONE
export const fetchDelegation_DoneDataSortByDate = async () => {
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("user-name");
  const userAccess = localStorage.getItem("user_access");

  const { data } = await axios.get(`${API}/delegation-done`, {
    params: { role, username, user_access: userAccess },
  });

  return data;
};

// SUBMIT
// export const insertDelegationDoneAndUpdate = async ({
//   selectedDataArray,
//   uploadedImages,
// }) => {
//   const formData = new FormData();
//   formData.append("selectedData", JSON.stringify(selectedDataArray));

//   Object.entries(uploadedImages).forEach(([taskId, file]) => {
//     formData.append(`image_${taskId}`, file);
//   });

//   const { data } = await axios.post(`${API}/delegation/submit`, formData);
//   return data;
// };



// SINGLE — send all tasks in one go
export const insertDelegationDoneAndUpdate = createAsyncThunk(
  "delegation/submit",
  async ({ selectedDataArray }, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(`${API}/delegation/submit`, {
        selectedData: selectedDataArray,
      });

      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);
