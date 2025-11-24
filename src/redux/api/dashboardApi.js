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
    const today = new Date().toISOString().split("T")[0];

    staffFilter = getFinalStaffFilter(staffFilter);

    let query = supabase
      .from(dashboardType)
      .select("*", { count: "exact", head: true });

    // USER → Filter his own tasks only
    if (role === "user") query = query.eq("name", username);

    // ADMIN staff filter
    if (role === "admin" && staffFilter !== "all") {
      query = query.eq("name", staffFilter);
    }

    if (departmentFilter !== "all" && dashboardType === "checklist") {
      query = query.eq("department", departmentFilter);
    }

    // TASK VIEW LOGIC
    switch (taskView) {
      case "recent":
        query = query
          .gte("task_start_date", `${today}T00:00:00`)
          .lte("task_start_date", `${today}T23:59:59`);

        if (dashboardType === "checklist") {
          query = query.or("status.is.null,status.neq.Yes");
        }
        break;

      case "upcoming":
        const tmr = new Date();
        tmr.setDate(tmr.getDate() + 1);
        const ts = tmr.toISOString().split("T")[0];

        query = query
          .gte("task_start_date", `${ts}T00:00:00`)
          .lte("task_start_date", `${ts}T23:59:59`);
        break;

      case "overdue":
        query = query
          .lt("task_start_date", `${today}T00:00:00`)
          .is("submission_date", null);

        if (dashboardType === "checklist") {
          query = query.or("status.is.null,status.neq.Yes");
        } else if (dashboardType === "delegation") {
          query = query.neq("status", "done");
        }
        break;

      default:
        break;
    }

    const { count, error } = await query;

    if (error) throw error;

    return count || 0;

  } catch (err) {
    console.error("Supabase Count Error:", err);
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
  limit = 50
) => {
  staffFilter = getFinalStaffFilter(staffFilter);

  const res = await fetch(
    `${BASE_URL1}/tasks?dashboardType=${dashboardType}&staffFilter=${staffFilter}&page=${page}&limit=${limit}`
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
  staffFilter = getFinalStaffFilter(staffFilter);

  const role = localStorage.getItem("role");
  const username = localStorage.getItem("user-name");
  const today = new Date().toISOString().split("T")[0];

  let query = supabase
    .from("checklist")
    .select("*", { count: "exact", head: true });

  if (startDate) query = query.gte("task_start_date", `${startDate}T00:00:00`);
  if (endDate) query = query.lte("task_start_date", `${endDate}T23:59:59`);

  if (role === "user") query = query.eq("name", username);
  if (role === "admin" && staffFilter !== "all") query = query.eq("name", staffFilter);
  if (departmentFilter !== "all") query = query.eq("department", departmentFilter);

  switch (statusFilter) {
    case "completed":
      query = query.eq("status", "Yes");
      break;
    case "pending":
      query = query.or("status.is.null,status.neq.Yes");
      break;
    case "overdue":
      query = query
        .or("status.is.null,status.neq.Yes")
        .is("submission_date", null)
        .lt("task_start_date", `${today}T00:00:00`);
      break;
  }

  const { count } = await query;
  return count || 0;
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
