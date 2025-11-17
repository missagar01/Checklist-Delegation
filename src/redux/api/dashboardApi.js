// import supabase from "../../SupabaseClient";

// frontend/src/redux/api/dashboardApi.js
const BASE_URL = "http://localhost:5050/api/dashboard";

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




export const getDashboardDataCount = async (dashboardType, staffFilter = null, taskView = 'recent', departmentFilter = null) => {
  try {
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('user-name');
    const today = new Date().toISOString().split('T')[0];

    let query = supabase
      .from(dashboardType)
      .select('*', { count: 'exact', head: true });

    // Apply role-based filtering
    if (role === 'user' && username) {
      query = query.eq('name', username);
    }

    // Apply staff filter
    if (staffFilter && staffFilter !== 'all' && role === 'admin') {
      query = query.eq('name', staffFilter);
    }

    // Apply department filter (only for checklist)
    if (departmentFilter && departmentFilter !== 'all' && dashboardType === 'checklist') {
      query = query.eq('department', departmentFilter);
    }

    // Apply task view filtering
    switch (taskView) {
      case 'recent':
        query = query.gte('task_start_date', `${today}T00:00:00`)
          .lte('task_start_date', `${today}T23:59:59`);
        if (dashboardType === 'checklist') {
          query = query.or('status.is.null,status.neq.Yes');
        }
        break;

      case 'upcoming':
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        query = query.gte('task_start_date', `${tomorrowStr}T00:00:00`)
          .lte('task_start_date', `${tomorrowStr}T23:59:59`);
        break;

      case 'overdue':
        // Tasks before today that are not completed AND have null submission_date
        query = query.lt('task_start_date', `${today}T00:00:00`)
          .is('submission_date', null);

        if (dashboardType === 'checklist') {
          query = query.or('status.is.null,status.neq.Yes');
        } else if (dashboardType === 'delegation') {
          query = query.neq('status', 'done');
        }
        break;

      default:
        query = query.lte('task_start_date', `${today}T23:59:59`);
        break;
    }

    const { count, error } = await query;

    if (error) {
      console.error("Error getting count:", error);
      throw error;
    }

    return count || 0;

  } catch (error) {
    console.error("Error from Supabase:", error);
    throw error;
  }
};

// Existing count functions remain the same but optimized
export const countTotalTaskApi = async (dashboardType, staffFilter = "all", departmentFilter = "all") => {
  const url = `${BASE_URL}/total?dashboardType=${dashboardType}&staffFilter=${staffFilter}&departmentFilter=${departmentFilter}`;
  const response = await fetch(url);
  return await response.json();
};


export const countCompleteTaskApi = async (dashboardType, staffFilter = "all", departmentFilter = "all") => {
  const url = `${BASE_URL}/completed?dashboardType=${dashboardType}&staffFilter=${staffFilter}&departmentFilter=${departmentFilter}`;
  const response = await fetch(url);
  return await response.json();
};


export const countPendingOrDelayTaskApi = async (dashboardType, staffFilter = "all", departmentFilter = "all") => {
  const url = `${BASE_URL}/pending?dashboardType=${dashboardType}&staffFilter=${staffFilter}&departmentFilter=${departmentFilter}`;
  const response = await fetch(url);
  return await response.json();
};


export const countOverDueORExtendedTaskApi = async (dashboardType, staffFilter = "all", departmentFilter = "all") => {
  const url = `${BASE_URL}/overdue?dashboardType=${dashboardType}&staffFilter=${staffFilter}&departmentFilter=${departmentFilter}`;
  const response = await fetch(url);
  return await response.json();
};

export const getDashboardSummaryApi = async (dashboardType, staffFilter = null) => {
  try {
    const [totalTasks, completedTasks, pendingTasks, overdueTasks] = await Promise.all([
      countTotalTaskApi(dashboardType, staffFilter),
      countCompleteTaskApi(dashboardType, staffFilter),
      countPendingOrDelayTaskApi(dashboardType, staffFilter),
      countOverDueORExtendedTaskApi(dashboardType, staffFilter)
    ]);

    const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionRate: parseFloat(completionRate)
    };
  } catch (error) {
    console.error('Error getting dashboard summary:', error);
    throw error;
  }
};

const BASE_URL1 = "http://localhost:5050/api/staff-tasks";

export const fetchStaffTasksDataApi = async (
  dashboardType,
  staffFilter,
  page = 1,
  limit = 50
) => {
  const res = await fetch(
    `${BASE_URL1}/tasks?dashboardType=${dashboardType}&staffFilter=${staffFilter}&page=${page}&limit=${limit}`
  );

  return await res.json();
};


export const getStaffTasksCountApi = async (dashboardType, staffFilter) => {
  const res = await fetch(
    `${BASE_URL1}/count?dashboardType=${dashboardType}&staffFilter=${staffFilter}`
  );
  return await res.json();
};



export const getUniqueDepartmentsApi = async () => {
  const res = await fetch(`${BASE_URL}/departments`);
  return await res.json();
};



export const getStaffNamesByDepartmentApi = async (department) => {
  const res = await fetch(`${BASE_URL}/staff?department=${department}`);
  return await res.json();
};

export const getTotalUsersCountApi = async () => {
  const res = await fetch(`${BASE_URL1}/users-count`);
  return await res.json();
};



/**
 * Fetch checklist data with date range filtering
 */
export const fetchChecklistDataByDateRangeApi = async (
  startDate,
  endDate,
  staffFilter = "all",
  departmentFilter = "all"
) => {
  const url = `${BASE_URL}/checklist/date-range?startDate=${startDate}&endDate=${endDate}&staffFilter=${staffFilter}&departmentFilter=${departmentFilter}`;

  const res = await fetch(url);
  return await res.json();
};


/**
 * Get count of checklist records for date range with filters
 */
export const getChecklistDateRangeCountApi = async (
  startDate,
  endDate,
  staffFilter = null,
  departmentFilter = null,
  statusFilter = 'all'
) => {
  try {
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('user-name');
    const today = new Date().toISOString().split('T')[0];

    let query = supabase
      .from('checklist')
      .select('*', { count: 'exact', head: true });

    // Apply date range filter
    if (startDate && endDate) {
      query = query
        .gte('task_start_date', `${startDate}T00:00:00`)
        .lte('task_start_date', `${endDate}T23:59:59`);
    } else if (startDate) {
      query = query.gte('task_start_date', `${startDate}T00:00:00`);
    } else if (endDate) {
      query = query.lte('task_start_date', `${endDate}T23:59:59`);
    }

    // Apply role-based filtering
    if (role === 'user' && username) {
      query = query.eq('name', username);
    }

    // Apply department filter
    if (departmentFilter && departmentFilter !== 'all') {
      query = query.eq('department', departmentFilter);
    }

    // Apply staff filter
    if (staffFilter && staffFilter !== 'all' && role === 'admin') {
      query = query.eq('name', staffFilter);
    }

    // Apply status filter
    switch (statusFilter) {
      case 'completed':
        query = query.eq('status', 'Yes');
        break;
      case 'pending':
        query = query.or('status.is.null,status.neq.Yes')
          .gte('task_start_date', `${today}T00:00:00`);
        break;
      case 'overdue':
        query = query.or('status.is.null,status.neq.Yes')
          .is('submission_date', null)
          .lt('task_start_date', `${today}T00:00:00`);
        break;
      // 'all' - no additional status filter
    }

    const { count, error } = await query;

    if (error) {
      console.error("Error getting date range count:", error);
      throw error;
    }

    return count || 0;

  } catch (error) {
    console.error("Error from Supabase:", error);
    throw error;
  }
};

/**
 * Get comprehensive statistics for date range
 */
export const getChecklistDateRangeStatsApi = async (
  startDate,
  endDate,
  staffFilter = "all",
  departmentFilter = "all"
) => {
  const url = `${BASE_URL}/checklist/date-range/stats?startDate=${startDate}&endDate=${endDate}&staffFilter=${staffFilter}&departmentFilter=${departmentFilter}`;

  const res = await fetch(url);
  return await res.json();
};
