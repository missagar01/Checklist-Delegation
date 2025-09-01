import supabase from "../../SupabaseClient";

/**
 * Fetch all dashboard data based on type and optional staff filter
 */
export const fetchDashboardDataApi = async (dashboardType, staffFilter = null) => {
  try {
    console.log('Fetching dashboard data:', { dashboardType, staffFilter });
    
    let query = supabase.from(dashboardType).select('*');
    
    // Apply staff filter if provided and not "all"
    if (staffFilter && staffFilter !== 'all') {
      query = query.eq('name', staffFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching dashboard data:", error);
      throw error;
    }

    console.log(`Fetched ${data?.length || 0} records successfully`);
    return data || [];

  } catch (error) {
    console.error("Error from Supabase:", error);
    throw error;
  }
};

/**
 * Count total tasks with filtering
 */
export const countTotalTaskApi = async (dashboardType, staffFilter = null) => {
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('user-name');
  
  try {
    console.log('Counting total tasks:', { dashboardType, staffFilter, role, username });
    
    let query = supabase
      .from(dashboardType)
      .select('*', { count: 'exact', head: true });

    // For checklist, only count tasks up to today
    if (dashboardType === 'checklist') {
      const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
      query = query.lte('task_start_date', `${today}T23:59:59`);
    }

    // Apply staff filter logic
    if (staffFilter && staffFilter !== 'all') {
      // If staff filter is specified, use it regardless of role
      query = query.eq('name', staffFilter);
    } else if (role === 'user' && username) {
      // If no staff filter but user role, filter by username
      query = query.eq('name', username);
    }

    const { count, error } = await query;

    if (error) {
      console.error("Error counting total tasks:", error);
      throw error;
    }

    console.log(`Total ${dashboardType} count:`, count);
    return count || 0;
    
  } catch (error) {
    console.error("Error from Supabase:", error);
    throw error;
  }
};

/**
 * Count completed tasks based on dashboard type
 */
export const countCompleteTaskApi = async (dashboardType, staffFilter = null) => {
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('user-name');
  
  try {
    console.log('Counting complete tasks:', { dashboardType, staffFilter, role, username });
    
    let query;

    if (dashboardType === 'delegation') {
      query = supabase
        .from('delegation')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'done')
        .eq('color_code_for', 1);
    } else {
      // For checklist, count completed tasks (status = 'Yes') up to today
      const today = new Date().toISOString().split('T')[0];
      query = supabase
        .from('checklist')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Yes')
        .lte('task_start_date', `${today}T23:59:59`);
    }

    // Apply staff filter logic
    if (staffFilter && staffFilter !== 'all') {
      query = query.eq('name', staffFilter);
    } else if (role === 'user' && username) {
      query = query.eq('name', username);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error counting complete tasks:', error);
      throw error;
    }

    console.log(`Complete ${dashboardType} count:`, count);
    return count || 0;
    
  } catch (error) {
    console.error('Unexpected error:', error);
    throw error;
  }
};

/**
 * Count pending/delay tasks based on dashboard type
 */
export const countPendingOrDelayTaskApi = async (dashboardType, staffFilter = null) => {
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('user-name');
  
  try {
    console.log('Counting pending tasks:', { dashboardType, staffFilter, role, username });
    
    const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
    let query;

    if (dashboardType === 'delegation') {
      query = supabase
        .from('delegation')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'done')
        .eq('color_code_for', 2);
    } else {
      // For checklist, count tasks that are null/pending and up to today (including today)
      query = supabase
        .from('checklist')
        .select('*', { count: 'exact', head: true })
        .or('status.is.null,status.neq.Yes')
        .lte('task_start_date', `${today}T23:59:59`);
    }

    // Apply staff filter logic
    if (staffFilter && staffFilter !== 'all') {
      query = query.eq('name', staffFilter);
    } else if (role === 'user' && username) {
      query = query.eq('name', username);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error counting pending tasks:', error);
      throw error;
    }

    console.log(`Pending ${dashboardType} count:`, count);
    return count || 0;
    
  } catch (error) {
    console.error('Unexpected error:', error);
    throw error;
  }
};

/**
 * Count overdue/extended tasks based on dashboard type
 */
export const countOverDueORExtendedTaskApi = async (dashboardType, staffFilter = null) => {
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('user-name');
  
  try {
    console.log('Counting overdue tasks:', { dashboardType, staffFilter, role, username });
    
    const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
    let query;

    if (dashboardType === 'delegation') {
      query = supabase
        .from('delegation')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'done')
        .gt('color_code_for', 2);
    } else {
      // For checklist, count tasks that are incomplete and before today (not including today)
      query = supabase
        .from('checklist')
        .select('*', { count: 'exact', head: true })
        .or('status.is.null,status.neq.Yes')
        .lt('task_start_date', today); // exclude today
    }

    // Apply staff filter logic
    if (staffFilter && staffFilter !== 'all') {
      query = query.eq('name', staffFilter);
    } else if (role === 'user' && username) {
      query = query.eq('name', username);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error counting overdue tasks:', error);
      throw error;
    }

    console.log(`Overdue ${dashboardType} count:`, count);
    return count || 0;
    
  } catch (error) {
    console.error('Unexpected error:', error);
    throw error;
  }
};

/**
 * Get task statistics summary
 */
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