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

// Alternative version if you want to see detailed task breakdown for debugging
export const fetchStaffTasksDataApi = async (dashboardType, staffFilter = null, departmentFilter = null, page = 1, limit = 20, selectedMonth = null) => {
  try {
    console.log('Fetching staff tasks data:', { dashboardType, staffFilter, departmentFilter, page, limit, selectedMonth });

    const role = localStorage.getItem('role');
    const username = localStorage.getItem('user-name');

    // Use selected month or current month as default
    let year, month;
    if (selectedMonth) {
      [year, month] = selectedMonth.split('-').map(Number);
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth() + 1;
    }

    // Calculate start and end dates for the selected month
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDayOfMonth.toString().padStart(2, '0')}`;

    console.log('Date range for filtering:', {
      startDate,
      endDate,
      year,
      month,
      lastDayOfMonth,
      selectedMonth
    });

    // Build the query
    let query = supabase
      .from(dashboardType)
      .select('*')
      .gte('task_start_date', `${startDate}T00:00:00`)
      .lte('task_start_date', `${endDate}T23:59:59`)
      .not('name', 'is', null);

    // Apply role-based filtering
    if (role === 'user' && username) {
      query = query.eq('name', username);
    }

    // Apply staff filter if provided
    if (staffFilter && staffFilter !== 'all' && role === 'admin') {
      query = query.eq('name', staffFilter);
    }

    // Apply department filter if provided
    if (departmentFilter && departmentFilter !== 'all') {
      query = query.eq('department', departmentFilter);
    }

    const { data: tasksData, error } = await query;

    if (error) {
      console.error("Error fetching tasks data:", error);
      throw error;
    }

    console.log(`Found ${tasksData.length} tasks in date range ${startDate} to ${endDate}`);

    // Process data to match SQL query structure
    const summary = {};

    tasksData.forEach(task => {
      const key = `${task.department}-${task.name}`;

      if (!summary[key]) {
        summary[key] = {
          department: task.department,
          name: task.name,
          total_tasks: 0,
          total_completed_tasks: 0,
          total_done_on_time: 0
        };
      }

      summary[key].total_tasks++;

      // Check if task is completed
      const isCompleted = dashboardType === 'checklist'
        ? task.status === 'Yes' || task.status === 'yes' || task.status === 'Completed' || task.status === 'completed'
        : (dashboardType === 'delegation' ? task.status === 'done' || task.status === 'completed' || task.status === 'Done' : false);

      if (isCompleted) {
        summary[key].total_completed_tasks++;

        // Check if done on time
        if (task.submission_date && task.task_start_date) {
          const submissionDate = new Date(task.submission_date);
          const startDate = new Date(task.task_start_date);

          // Compare dates only (ignore time)
          const submissionDateOnly = new Date(submissionDate.getFullYear(), submissionDate.getMonth(), submissionDate.getDate());
          const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

          // Count as "on time" only if submission date is same as or before start date
          if (submissionDateOnly <= startDateOnly) {
            summary[key].total_done_on_time++;
          }
        }
      }
    });

    // Calculate scores and convert to array
    let staffResults = Object.values(summary).map(staff => {
      const completion_score = staff.total_tasks > 0
        ? Number((((staff.total_completed_tasks / staff.total_tasks) * 100) - 100).toFixed(2))
        : -100;

      const ontime_score = staff.total_completed_tasks > 0
        ? Number((((staff.total_done_on_time / staff.total_completed_tasks) * 100) - 100).toFixed(2))
        : (staff.total_tasks > 0 ? -100 : 0);

      return {
        id: staff.name.replace(/\s+/g, "-").toLowerCase(),
        department: staff.department,
        name: staff.name,
        email: `${staff.name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        total_tasks: staff.total_tasks,
        total_completed_tasks: staff.total_completed_tasks,
        total_done_on_time: staff.total_done_on_time,
        completion_score,
        ontime_score
      };
    });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit;
    const paginatedResults = staffResults.slice(from, to);

    console.log(`Fetched ${paginatedResults.length} staff members with task data for ${month}/${year}`);
    return paginatedResults;

  } catch (error) {
    console.error("Error from Supabase:", error);
    throw error;
  }
};

export const getStaffTasksCountApi = async (dashboardType, staffFilter = null, departmentFilter = null, selectedMonth = null) => {
  try {
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('user-name');

    // Use selected month or current month as default
    let year, month;
    if (selectedMonth) {
      [year, month] = selectedMonth.split('-').map(Number);
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth() + 1;
    }

    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDayOfMonth.toString().padStart(2, '0')}`;

    let query = supabase
      .from(dashboardType)
      .select('department, name')
      .gte('task_start_date', `${startDate}T00:00:00`)
      .lte('task_start_date', `${endDate}T23:59:59`)
      .not('name', 'is', null);

    // Apply role-based filtering
    if (role === 'user' && username) {
      query = query.eq('name', username);
    }

    // Apply staff filter
    if (staffFilter && staffFilter !== 'all' && role === 'admin') {
      query = query.eq('name', staffFilter);
    }

    // Apply department filter
    if (departmentFilter && departmentFilter !== 'all') {
      query = query.eq('department', departmentFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error getting staff count:", error);
      throw error;
    }

    // Count unique staff names
    const uniqueStaff = new Set(data.map(item => `${item.department}-${item.name}`));
    console.log(`Total unique staff count for ${month}/${year}: ${uniqueStaff.size}`);
    return uniqueStaff.size;

  } catch (error) {
    console.error("Error from Supabase:", error);
    throw error;
  }
};

// Helper function to get exact date range for any month
export const getCurrentMonthDateRange = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
  const endDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${lastDayOfMonth.toString().padStart(2, '0')}`;

  return {
    startDate,
    endDate,
    currentYear,
    currentMonth,
    lastDayOfMonth
  };
};

export const getTotalUsersCountApi = async (departmentFilter = null) => {
  try {
    let query = supabase
      .from('users')
      .select('user_name, department', { count: 'exact', head: true })
      .not('user_name', 'is', null)
      .not('user_name', 'eq', '');

    // Apply department filter if provided and not "all"
    if (departmentFilter && departmentFilter !== 'all') {
      query = query.eq('department', departmentFilter);
    }

    const { count, error } = await query;

    if (error) {
      console.error("Error fetching total users count:", error);
      throw error;
    }

    console.log(`Total users count${departmentFilter && departmentFilter !== 'all' ? ` for department ${departmentFilter}` : ''}: ${count}`);
    return count || 0;
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
