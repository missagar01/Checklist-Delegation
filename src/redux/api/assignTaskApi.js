import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5050/api/assign-task",
});

export const fetchUniqueDepartmentDataApi = async (user_name) => {
  return (await API.get(`/departments/${user_name}`)).data;
};

export const fetchUniqueGivenByDataApi = async () => {
  return (await API.get(`/given-by`)).data;
};

export const fetchUniqueDoerNameDataApi = async (department) => {
  return (await API.get(`/doer/${department}`)).data;
};

export const pushAssignTaskApi = async (tasks) => {
  return (await API.post(`/assign`, tasks)).data;
};
