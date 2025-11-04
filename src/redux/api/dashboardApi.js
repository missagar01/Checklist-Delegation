import supabase from "../../SupabaseClient";

/**
 * Fetch dashboard data with proper server-side filtering and pagination
 */
export const fetchDashboardDataApi = async (
  dashboardType,
  staffFilter = null,
  page = 1,
  limit = 50,
  taskView = 'recent',
  departmentFilter = null,
  startDate = null,
  endDate = null
) => {
  try {
    console.log('Fetching dashboard data:', { dashboardType, staffFilter, page, limit, taskView, departmentFilter });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('user-name');
    const today = new Date().toISOString().split('T')[0];

    let query = supabase
      .from(dashboardType)
      .select('*')
      .order('task_start_date', { ascending: false })
      .range(from, to);

    // Apply role-based filtering first
    if (role === 'user' && username) {
      query = query.eq('name', username);
    }

    // Apply department filter if provided (only for checklist)
    if (departmentFilter && departmentFilter !== 'all' && dashboardType === 'checklist') {
      query = query.eq('department', departmentFilter);
    }



    // Apply staff filter if provided and not "all" (for admin users)
    if (staffFilter && staffFilter !== 'all' && role === 'admin') {
      query = query.eq('name', staffFilter);
    }

    // Apply task view filtering on server side
    switch (taskView) {
      case 'recent':
        // Today's tasks only
        query = query.gte('task_start_date', `${today}T00:00:00`)
          .lte('task_start_date', `${today}T23:59:59`);
        if (dashboardType === 'checklist') {
          // Exclude completed tasks for recent view
          query = query.or('status.is.null,status.neq.Yes');
        }
        break;

      case 'upcoming':
        // Tomorrow's tasks only
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
        // For 'all' or other views, don't add additional date filters
        // but still limit to tasks up to today for statistics consistency
        query = query.lte('task_start_date', `${today}T23:59:59`);
        break;
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching dashboard data:", error);
      throw error;
    }

    console.log(`Fetched ${data?.length || 0} records for ${taskView} view`);
    return data || [];

  } catch (error) {
    console.error("Error from Supabase:", error);
    throw error;
  }
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
export const countTotalTaskApi = async (dashboardType, staffFilter = null, departmentFilter = null) => {
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('user-name');

  try {
    const today = new Date().toISOString().split('T')[0];

    let query = supabase
      .from(dashboardType)
      .select('*', { count: 'exact', head: true })
      .lte('task_start_date', `${today}T23:59:59`);

    // Apply filters
    if (role === 'user' && username) {
      query = query.eq('name', username);
    } else if (staffFilter && staffFilter !== 'all') {
      query = query.eq('name', staffFilter);
    }

    // Apply department filter (only for checklist)
    if (departmentFilter && departmentFilter !== 'all' && dashboardType === 'checklist') {
      query = query.eq('department', departmentFilter);
    }

    const { count, error } = await query;

    if (error) {
      console.error("Error counting total tasks:", error);
      throw error;
    }

    return count || 0;

  } catch (error) {
    console.error("Error from Supabase:", error);
    throw error;
  }
};

export const countCompleteTaskApi = async (dashboardType, staffFilter = null, departmentFilter = null) => {
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('user-name');

  try {
    const today = new Date().toISOString().split('T')[0];
    let query;

    if (dashboardType === 'delegation') {
      query = supabase
        .from('delegation')
        .select('*', { count: 'exact', head: true })
        .not('submission_date', 'is', null)
        .lte('task_start_date', `${today}T23:59:59`);
    } else {
      query = supabase
        .from('checklist')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Yes')
        .lte('task_start_date', `${today}T23:59:59`);
    }

    // Apply filters
    if (role === 'user' && username) {
      query = query.eq('name', username);
    } else if (staffFilter && staffFilter !== 'all') {
      query = query.eq('name', staffFilter);
    }

    // Apply department filter (only for checklist)
    if (departmentFilter && departmentFilter !== 'all' && dashboardType === 'checklist') {
      query = query.eq('department', departmentFilter);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error counting complete tasks:', error);
      throw error;
    }

    return count || 0;

  } catch (error) {
    console.error('Unexpected error:', error);
    throw error;
  }
};

export const countPendingOrDelayTaskApi = async (dashboardType, staffFilter = null, departmentFilter = null) => {
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('user-name');

  try {
    const today = new Date().toISOString().split('T')[0];
    let query;

    if (dashboardType === 'delegation') {
      query = supabase
        .from('delegation')
        .select('*', { count: 'exact', head: true })
        .is('submission_date', null)
        .gte('task_start_date', `${today}T00:00:00`)
        .lte('task_start_date', `${today}T23:59:59`);
    } else {
      query = supabase
        .from('checklist')
        .select('*', { count: 'exact', head: true })
        .or('status.is.null,status.neq.Yes')
        .gte('task_start_date', `${today}T00:00:00`)
        .lte('task_start_date', `${today}T23:59:59`);
    }

    // Apply filters
    if (role === 'user' && username) {
      query = query.eq('name', username);
    } else if (staffFilter && staffFilter !== 'all') {
      query = query.eq('name', staffFilter);
    }

    // Apply department filter (only for checklist)
    if (departmentFilter && departmentFilter !== 'all' && dashboardType === 'checklist') {
      query = query.eq('department', departmentFilter);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error counting pending tasks:', error);
      throw error;
    }

    return count || 0;

  } catch (error) {
    console.error('Unexpected error:', error);
    throw error;
  }
};

export const countOverDueORExtendedTaskApi = async (dashboardType, staffFilter = null, departmentFilter = null) => {
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('user-name');

  try {
    const today = new Date().toISOString().split('T')[0];
    let query;

    if (dashboardType === 'delegation') {
      query = supabase
        .from('delegation')
        .select('*', { count: 'exact', head: true })
        .is('submission_date', null)
        .lt('task_start_date', `${today}T00:00:00`);
    } else {
      query = supabase
        .from('checklist')
        .select('*', { count: 'exact', head: true })
        .or('status.is.null,status.neq.Yes')
        .is('submission_date', null)
        .lt('task_start_date', `${today}T00:00:00`);
    }

    // Apply filters
    if (role === 'user' && username) {
      query = query.eq('name', username);
    } else if (staffFilter && staffFilter !== 'all') {
      query = query.eq('name', staffFilter);
    }

    // Apply department filter (only for checklist)
    if (departmentFilter && departmentFilter !== 'all' && dashboardType === 'checklist') {
      query = query.eq('department', departmentFilter);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error counting overdue tasks:', error);
      throw error;
    }

    return count || 0;

  } catch (error) {
    console.error('Unexpected error:', error);
    throw error;
  }
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

export const fetchStaffTasksDataApi = async (dashboardType, staffFilter = null, page = 1, limit = 20) => {
  try {
    console.log('Fetching staff tasks data:', { dashboardType, staffFilter, page, limit });

    const role = localStorage.getItem('role');
    const username = localStorage.getItem('user-name');
    const today = new Date().toISOString().split('T')[0];

    // First, get unique staff names with pagination
    let staffQuery = supabase
      .from(dashboardType)
      .select('name')
      .not('name', 'is', null)
      .lte('task_start_date', `${today}T23:59:59`); // Only tasks up to today

    // Apply role-based filtering
    if (role === 'user' && username) {
      staffQuery = staffQuery.eq('name', username);
    }

    // Apply staff filter if provided
    if (staffFilter && staffFilter !== 'all' && role === 'admin') {
      staffQuery = staffQuery.eq('name', staffFilter);
    }

    const { data: staffData, error: staffError } = await staffQuery;

    if (staffError) {
      console.error("Error fetching staff names:", staffError);
      throw staffError;
    }

    // Get unique staff names
    const uniqueStaffNames = [...new Set(staffData.map(item => item.name))];

    // Apply pagination to staff names
    const from = (page - 1) * limit;
    const to = from + limit;
    const paginatedStaff = uniqueStaffNames.slice(from, to);

    if (paginatedStaff.length === 0) {
      return [];
    }

    // For each staff member, get their task statistics
    const staffTasksPromises = paginatedStaff.map(async (staffName) => {
      let tasksQuery = supabase
        .from(dashboardType)
        .select('*')
        .eq('name', staffName)
        .lte('task_start_date', `${today}T23:59:59`); // Only tasks up to today

      const { data: tasks, error: tasksError } = await tasksQuery;

      if (tasksError) {
        console.error(`Error fetching tasks for ${staffName}:`, tasksError);
        return null;
      }

      // Calculate task statistics
      const totalTasks = tasks.length;
      let completedTasks = 0;

      tasks.forEach(task => {
        if (dashboardType === 'checklist') {
          if (task.status === 'Yes') {
            completedTasks++;
          }
        } else if (dashboardType === 'delegation') {
          if (task.status === 'done') {
            completedTasks++;
          }
        }
      });

      const pendingTasks = totalTasks - completedTasks;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        id: staffName.replace(/\s+/g, "-").toLowerCase(),
        name: staffName,
        email: `${staffName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        totalTasks,
        completedTasks,
        pendingTasks,
        progress
      };
    });

    const staffResults = await Promise.all(staffTasksPromises);
    const validStaffResults = staffResults.filter(staff => staff !== null);

    console.log(`Fetched ${validStaffResults.length} staff members with task data`);
    return validStaffResults;

  } catch (error) {
    console.error("Error from Supabase:", error);
    throw error;
  }
};

export const getStaffTasksCountApi = async (dashboardType, staffFilter = null) => {
  try {
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('user-name');
    const today = new Date().toISOString().split('T')[0];

    let query = supabase
      .from(dashboardType)
      .select('name')
      .not('name', 'is', null)
      .lte('task_start_date', `${today}T23:59:59`);

    // Apply role-based filtering
    if (role === 'user' && username) {
      query = query.eq('name', username);
    }

    // Apply staff filter
    if (staffFilter && staffFilter !== 'all' && role === 'admin') {
      query = query.eq('name', staffFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error getting staff count:", error);
      throw error;
    }

    // Count unique staff names
    const uniqueStaffCount = [...new Set(data.map(item => item.name))].length;

    return uniqueStaffCount;

  } catch (error) {
    console.error("Error from Supabase:", error);
    throw error;
  }
};


export const getUniqueDepartmentsApi = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('department')
      .not('department', 'is', null)
      .not('department', 'eq', '');

    if (error) {
      console.error("Error fetching departments:", error);
      throw error;
    }

    // Get unique departments, handle case-insensitive comparison, and sort them
    const uniqueDepartments = [...new Set(
      data.map(item => item.department.trim()) // Remove extra spaces
        .filter(dept => dept.length > 0) // Remove empty strings
    )].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())); // Case-insensitive sort

    return uniqueDepartments;
  } catch (error) {
    console.error("Error from Supabase:", error);
    throw error;
  }
};


export const getStaffNamesByDepartmentApi = async (departmentFilter = null) => {
  try {
    let query = supabase
      .from('users')
      .select('user_name, user_access')
      .not('user_name', 'is', null)
      .not('user_access', 'is', 'admin')
      .not('user_name', 'eq', '');

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching staff names:", error);
      throw error;
    }

    let filteredStaff = data.map(user => user.user_name);

    // Filter by department if provided
    if (departmentFilter && departmentFilter !== 'all') {
      filteredStaff = data
        .filter(user => {
          if (!user.user_access) return false;
          const userDepartments = user.user_access.split(',').map(dept => dept.trim().toLowerCase());
          return userDepartments.includes(departmentFilter.toLowerCase());
        })
        .map(user => user.user_name);
    }

    return [...new Set(filteredStaff)]; // Remove duplicates
  } catch (error) {
    console.error("Error from Supabase:", error);
    throw error;
  }
};

export const getTotalUsersCountApi = async () => {
  try {
    const { data, error, count } = await supabase
      .from('users')
      .select('user_name', { count: 'exact', head: true })
      .not('user_name', 'is', null)
      .not('user_name', 'eq', '');

    if (error) {
      console.error("Error fetching total users count:", error);
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error("Error from Supabase:", error);
    throw error;
  }
};


/**
 * Fetch checklist data with date range filtering
 */
export const fetchChecklistDataByDateRangeApi = async (
  startDate,
  endDate,
  staffFilter = null,
  departmentFilter = null,
  page = 1,
  limit = 50,
  statusFilter = 'all' // 'all', 'completed', 'pending', 'overdue'
) => {
  try {
    console.log('Fetching checklist data by date range:', {
      startDate,
      endDate,
      staffFilter,
      departmentFilter,
      page,
      limit,
      statusFilter
    });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('user-name');
    const today = new Date().toISOString().split('T')[0];

    let query = supabase
      .from('checklist')
      .select('*')
      .order('task_start_date', { ascending: false })
      .range(from, to);

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

    // Apply staff filter (for admin users)
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

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching checklist data by date range:", error);
      throw error;
    }

    console.log(`Fetched ${data?.length || 0} records for date range ${startDate} to ${endDate}`);
    return data || [];

  } catch (error) {
    console.error("Error from Supabase:", error);
    throw error;
  }
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
  staffFilter = null,
  departmentFilter = null
) => {
  try {
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('user-name');
    const today = new Date().toISOString().split('T')[0];

    let baseQuery = supabase
      .from('checklist')
      .select('*');

    // Apply date range filter
    if (startDate && endDate) {
      baseQuery = baseQuery
        .gte('task_start_date', `${startDate}T00:00:00`)
        .lte('task_start_date', `${endDate}T23:59:59`);
    } else if (startDate) {
      baseQuery = baseQuery.gte('task_start_date', `${startDate}T00:00:00`);
    } else if (endDate) {
      baseQuery = baseQuery.lte('task_start_date', `${endDate}T23:59:59`);
    }

    // Apply role-based filtering
    if (role === 'user' && username) {
      baseQuery = baseQuery.eq('name', username);
    }

    // Apply department filter
    if (departmentFilter && departmentFilter !== 'all') {
      baseQuery = baseQuery.eq('department', departmentFilter);
    }

    // Apply staff filter
    if (staffFilter && staffFilter !== 'all' && role === 'admin') {
      baseQuery = baseQuery.eq('name', staffFilter);
    }

    const { data: allTasks, error } = await baseQuery;

    if (error) {
      console.error("Error fetching tasks for statistics:", error);
      throw error;
    }

    // Calculate statistics
    const totalTasks = allTasks?.length || 0;
    const completedTasks = allTasks?.filter(task => task.status === 'Yes').length || 0;

    const pendingTasks = allTasks?.filter(task =>
      (task.status === null || task.status !== 'Yes') &&
      new Date(task.task_start_date) >= new Date(`${today}T00:00:00`)
    ).length || 0;

    const overdueTasks = allTasks?.filter(task =>
      (task.status === null || task.status !== 'Yes') &&
      task.submission_date === null &&
      new Date(task.task_start_date) < new Date(`${today}T00:00:00`)
    ).length || 0;

    const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionRate: parseFloat(completionRate),
      dateRange: {
        startDate,
        endDate
      }
    };

  } catch (error) {
    console.error("Error getting date range statistics:", error);
    throw error;
  }
};