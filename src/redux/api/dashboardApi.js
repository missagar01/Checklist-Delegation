// ------------------------------
// dashboardApi.js (FULL FIXED FILE)
// ------------------------------

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/dashboard`;
const BASE_URL1 = `${import.meta.env.VITE_API_BASE_URL}/staff-tasks`;

// ---------------------------------------------------------------------
// GLOBAL ROLE HELPER — har API me repeat na karna pade isliye function
// ---------------------------------------------------------------------
const getFinalStaffFilter = (inputFilter) => {
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("user-name");

  if (role === "user") return username;
  if (!inputFilter || inputFilter === "all") return "all";

  return inputFilter;
};

// ---------------------------------------------------------------------
// 1️⃣ MAIN DASHBOARD DATA FETCH
// ---------------------------------------------------------------------
export const fetchDashboardDataApi = async (
  dashboardType,
  staffFilter = "all",
  page = 1,
  limit = 50,
  taskView = "recent",
  departmentFilter = "all"
) => {

  const role = localStorage.getItem("role");
  const username = localStorage.getItem("user-name");

  // 👇 Force user filter
  staffFilter = getFinalStaffFilter(staffFilter);

  const params = new URLSearchParams({
    dashboardType,
    staffFilter,
    page,
    limit,
    taskView,
    departmentFilter,
    role,
    username
  });

  const res = await fetch(`${BASE_URL}?${params.toString()}`);
  return await res.json();
};

// ---------------------------------------------------------------------
// 2️⃣ SUPABASE COUNT USING ROLE-BASED FILTERING
// ---------------------------------------------------------------------
export const getDashboardDataCount = async (dashboardType, staffFilter = "all", taskView = 'recent', departmentFilter = "all") => {
  try {
    const role = localStorage.getItem("role");
    const username = localStorage.getItem("user-name");

    staffFilter = getFinalStaffFilter(staffFilter);

    const params = new URLSearchParams({
      dashboardType,
      staffFilter,
      taskView,
      departmentFilter,
      role,
      username
    });

    const url = `${BASE_URL}/count?${params.toString()}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    return await res.json();

  } catch (err) {
    console.error("Dashboard Count Error:", err);
    return 0;
  }
};

// ---------------------------------------------------------------------
// 3️⃣ SUMMARY COUNT APIs (Admin + User both)
// ---------------------------------------------------------------------
export const countTotalTaskApi = async (dashboardType, staffFilter = "all", departmentFilter = "all") => {
  staffFilter = getFinalStaffFilter(staffFilter);

  const role = localStorage.getItem("role");
  const username = localStorage.getItem("user-name");

  const url = `${BASE_URL}/total?dashboardType=${dashboardType}&staffFilter=${staffFilter}&departmentFilter=${departmentFilter}&role=${role}&username=${username}`;

  const res = await fetch(url);
  return res.json();
};

export const countCompleteTaskApi = async (dashboardType, staffFilter = "all", departmentFilter = "all") => {
  staffFilter = getFinalStaffFilter(staffFilter);

  const role = localStorage.getItem("role");
  const username = localStorage.getItem("user-name");

  const url = `${BASE_URL}/completed?dashboardType=${dashboardType}&staffFilter=${staffFilter}&departmentFilter=${departmentFilter}&role=${role}&username=${username}`;

  const res = await fetch(url);
  return res.json();
};

export const countPendingOrDelayTaskApi = async (dashboardType, staffFilter = "all", departmentFilter = "all") => {
  staffFilter = getFinalStaffFilter(staffFilter);

  const role = localStorage.getItem("role");
  const username = localStorage.getItem("user-name");

  const url = `${BASE_URL}/pending?dashboardType=${dashboardType}&staffFilter=${staffFilter}&departmentFilter=${departmentFilter}&role=${role}&username=${username}`;

  const res = await fetch(url);
  return res.json();
};

export const countOverDueORExtendedTaskApi = async (dashboardType, staffFilter = "all", departmentFilter = "all") => {
  staffFilter = getFinalStaffFilter(staffFilter);

  const role = localStorage.getItem("role");
  const username = localStorage.getItem("user-name");

  const url = `${BASE_URL}/overdue?dashboardType=${dashboardType}&staffFilter=${staffFilter}&departmentFilter=${departmentFilter}&role=${role}&username=${username}`;

  const res = await fetch(url);
  return res.json();
};

// ---------------------------------------------------------------------
// 4️⃣ SUMMARY COMBINED API
// ---------------------------------------------------------------------
export const getDashboardSummaryApi = async (dashboardType, staffFilter = "all") => {
  staffFilter = getFinalStaffFilter(staffFilter);

  const [totalTasks, completedTasks, pendingTasks, overdueTasks] = await Promise.all([
    countTotalTaskApi(dashboardType, staffFilter),
    countCompleteTaskApi(dashboardType, staffFilter),
    countPendingOrDelayTaskApi(dashboardType, staffFilter),
    countOverDueORExtendedTaskApi(dashboardType, staffFilter)
  ]);

  const completionRate =
    totalTasks > 0
      ? Number(((completedTasks / totalTasks) * 100).toFixed(1))
      : 0;

  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    completionRate
  };
};

// ---------------------------------------------------------------------
// 5️⃣ STAFF TASK TABLE APIs
// ---------------------------------------------------------------------
export const fetchStaffTasksDataApi = async (
  dashboardType,
  staffFilter = "all",
  page = 1,
  limit = 50,
  monthYear = "" // Add this parameter
) => {
  staffFilter = getFinalStaffFilter(staffFilter);

  const params = new URLSearchParams({
    dashboardType,
    staffFilter,
    page,
    limit
  });
  
  // Add monthYear if provided
  if (monthYear) {
    params.append('monthYear', monthYear);
  }

  const res = await fetch(
    `${BASE_URL1}/tasks?${params.toString()}`
  );

  return await res.json();
};

export const getStaffTasksCountApi = async (dashboardType, staffFilter = "all") => {
  staffFilter = getFinalStaffFilter(staffFilter);

  const res = await fetch(
    `${BASE_URL1}/count?dashboardType=${dashboardType}&staffFilter=${staffFilter}`
  );
  return res.json();
};

// dashboardApi.js - Add this function
export const getStaffTaskSummaryApi = async (dashboardType, departmentFilter = "all") => {
  try {
    const params = new URLSearchParams({
      dashboardType,
      departmentFilter
    });

    const url = `${BASE_URL}/staff-summary?${params.toString()}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    return await res.json();

  } catch (err) {
    console.error("Staff Summary Error:", err);
    return [];
  }
};

// ---------------------------------------------------------------------
export const getUniqueDepartmentsApi = async () => {
  const res = await fetch(`${BASE_URL}/departments`);
  return res.json();
};

export const getStaffNamesByDepartmentApi = async (department) => {
  const res = await fetch(`${BASE_URL}/staff?department=${department}`);
  return res.json();
};

export const getTotalUsersCountApi = async () => {
  const res = await fetch(`${BASE_URL1}/users-count`);
  return res.json();
};

// ---------------------------------------------------------------------
// 6️⃣ DATE RANGE FILTERED APIS
// ---------------------------------------------------------------------
export const fetchChecklistDataByDateRangeApi = async (
  startDate,
  endDate,
  staffFilter = "all",
  departmentFilter = "all"
) => {
  staffFilter = getFinalStaffFilter(staffFilter);

  const url = `${BASE_URL}/checklist/date-range?startDate=${startDate}&endDate=${endDate}&staffFilter=${staffFilter}&departmentFilter=${departmentFilter}`;

  const res = await fetch(url);
  return res.json();
};

export const getChecklistDateRangeCountApi = async (
  startDate,
  endDate,
  staffFilter = "all",
  departmentFilter = "all",
  statusFilter = "all"
) => {
  try {
    const role = localStorage.getItem("role");
    const username = localStorage.getItem("user-name");

    staffFilter = getFinalStaffFilter(staffFilter);

    const params = new URLSearchParams({
      startDate,
      endDate,
      staffFilter,
      departmentFilter,
      statusFilter,
      role,
      username
    });

    const url = `${BASE_URL}/checklist/date-range/count?${params.toString()}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    return await res.json();

  } catch (err) {
    console.error("Date Range Count Error:", err);
    return 0;
  }
};

export const getChecklistDateRangeStatsApi = async (
  startDate,
  endDate,
  staffFilter = "all",
  departmentFilter = "all"
) => {
  staffFilter = getFinalStaffFilter(staffFilter);

  const url = `${BASE_URL}/checklist/date-range/stats?startDate=${startDate}&endDate=${endDate}&staffFilter=${staffFilter}&departmentFilter=${departmentFilter}`;

  const res = await fetch(url);
  return res.json();
};


export const countNotDoneTaskApi = async (dashboardType, staffFilter = "all", departmentFilter = "all") => {
  staffFilter = getFinalStaffFilter(staffFilter);

  const role = localStorage.getItem("role");
  const username = localStorage.getItem("user-name");

  const url = `${BASE_URL}/not-done?dashboardType=${dashboardType}&staffFilter=${staffFilter}&departmentFilter=${departmentFilter}&role=${role}&username=${username}`;

  const res = await fetch(url);
  return res.json();
};
