import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
// const API = "http://localhost:5050/api";
const API = `${import.meta.env.VITE_API_BASE_URL}`;

const api = axios.create({
  baseURL: API,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for better logging
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response received from: ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', {
      message: error.message,
      code: error.code,
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// SINGLE — send all tasks in one go
export const insertDelegationDoneAndUpdate = createAsyncThunk(
  "delegation/submit",
  async ({ selectedDataArray }, { rejectWithValue }) => {
    try {
      console.log('🚀 Sending delegation submission:', {
        itemCount: selectedDataArray.length,
        data: selectedDataArray
      });

      const { data } = await api.post(`/delegation/submit`, {
        selectedData: selectedDataArray,
      });

      console.log('✅ Delegation submission successful:', data);
      return data;

    } catch (err) {
      console.error('❌ Delegation submission failed:', {
        error: err.message,
        response: err.response?.data,
        status: err.response?.status
      });

      // Handle different types of errors
      if (err.code === 'ERR_NETWORK') {
        return rejectWithValue('Network error: Please check your internet connection and try again.');
      } else if (err.code === 'ECONNABORTED') {
        return rejectWithValue('Request timeout: The server took too long to respond.');
      } else {
        return rejectWithValue(err.response?.data || err.message);
      }
    }
  }
);

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
// export const insertDelegationDoneAndUpdate = createAsyncThunk(
//   "delegation/submit",
//   async ({ selectedDataArray }, { rejectWithValue }) => {
//     try {
//       const { data } = await axios.post(`${API}/delegation/submit`, {
//         selectedData: selectedDataArray,
//       });

//       return data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data || err.message);
//     }
//   }
// );
