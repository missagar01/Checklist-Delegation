"use client"

import { useState, useEffect } from "react"
import { BarChart3, CheckCircle2, Clock, ListTodo, Users, AlertTriangle, Filter } from 'lucide-react'
import AdminLayout from "../../components/layout/AdminLayout.jsx"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { useDispatch, useSelector } from "react-redux"
import { completeTaskInTable, dashboardData, overdueTaskInTable, pendingTaskInTable, totalTaskInTable, } from "../../redux/slice/dashboardSlice.js"
import { countTotalTaskApi, fetchDashboardDataApi } from "../../redux/api/dashboardApi.js"

export default function AdminDashboard() {
  const [dashboardType, setDashboardType] = useState("checklist")
  const [taskView, setTaskView] = useState("recent")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterStaff, setFilterStaff] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  // New state for dashboard-wide staff filter
  const [dashboardStaffFilter, setDashboardStaffFilter] = useState("all")
  const [availableStaff, setAvailableStaff] = useState([])
  const userRole = localStorage.getItem('role');
  const username = localStorage.getItem('user-name');

  // State for department data
  const [departmentData, setDepartmentData] = useState({
    allTasks: [],
    staffMembers: [],
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
    barChartData: [],
    pieChartData: [],
    completedRatingOne: 0,
    completedRatingTwo: 0,
    completedRatingThreePlus: 0
  })

  // Store the current date for overdue calculation
  const [currentDate, setCurrentDate] = useState(new Date())

  // New state for date range filtering
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
    filtered: false
  });

  // State to store filtered statistics
  const [filteredDateStats, setFilteredDateStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    completionRate: 0
  });

  const { dashboard, totalTask, completeTask, pendingTask, overdueTask } = useSelector((state) => state.dashBoard)
  const dispatch = useDispatch();

  // Updated date parsing function to handle both formats
const parseTaskStartDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;

  // Handle YYYY-MM-DD format (ISO format from Supabase)
  if (dateStr.includes('-') && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    const parsed = new Date(dateStr);
    return isNaN(parsed) ? null : parsed;
  }

  // Handle DD/MM/YYYY format (with or without time)
  if (dateStr.includes('/')) {
    // Split by space first to separate date and time
    const parts = dateStr.split(' ');
    const datePart = parts[0]; // "25/08/2025"

    const dateComponents = datePart.split('/');
    if (dateComponents.length !== 3) return null;

    const [day, month, year] = dateComponents.map(Number);

    if (!day || !month || !year) return null;

    // Create date object (month is 0-indexed)
    const date = new Date(year, month - 1, day);

    // If there's time component, parse it
    if (parts.length > 1) {
      const timePart = parts[1]; // "09:00:00"
      const timeComponents = timePart.split(':');
      if (timeComponents.length >= 2) {
        const [hours, minutes, seconds] = timeComponents.map(Number);
        date.setHours(hours || 0, minutes || 0, seconds || 0);
      }
    }

    return isNaN(date) ? null : date;
  }

  // Fallback: Try ISO format
  const parsed = new Date(dateStr);
  return isNaN(parsed) ? null : parsed;
};

  // Helper function to format date from ISO format to DD/MM/YYYY
  const formatLocalDate = (isoDate) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    return formatDateToDDMMYYYY(date);
  };

  // Function to filter tasks by date range
  const filterTasksByDateRange = () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      alert("Please select both start and end dates");
      return;
    }

    const startDate = new Date(dateRange.startDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(dateRange.endDate);
    endDate.setHours(23, 59, 59, 999);

    if (startDate > endDate) {
      alert("Start date must be before end date");
      return;
    }

    const filteredTasks = departmentData.allTasks.filter(task => {
      const taskStartDate = parseTaskStartDate(task.originalTaskStartDate); // Use original date string
      if (!taskStartDate) return false;
      return taskStartDate >= startDate && taskStartDate <= endDate;
    });

    let totalTasks = filteredTasks.length;
    let completedTasks = 0;
    let pendingTasks = 0;
    let overdueTasks = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    filteredTasks.forEach(task => {
      if (task.status === 'completed') {
        completedTasks++;
      } else {
        pendingTasks++;
        if (task.status === 'overdue') {
          overdueTasks++;
        }
      }
    });

    const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;

    setFilteredDateStats({
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionRate
    });

    setDateRange(prev => ({ ...prev, filtered: true }));
  };

  // Format date as DD/MM/YYYY
  const formatDateToDDMMYYYY = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date)) return "";
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Check if date is today
  const isDateToday = (date) => {
    if (!date || !(date instanceof Date)) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Check if date is in the past (excluding today)
  const isDateInPast = (date) => {
    if (!date || !(date instanceof Date)) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  // Check if date is in the future (excluding today)
  const isDateFuture = (date) => {
    if (!date || !(date instanceof Date)) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate > today;
  };

  // Function to check if a date is tomorrow
  const isDateTomorrow = (dateStr) => {
    const date = parseTaskStartDate(dateStr);
    if (!date) return false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === tomorrow.getTime();
  };

  // Updated fetch function to support both checklist and delegation with proper date filtering
  // The main issue is in the fetchDepartmentData function. Here are the key fixes:

  // 1. Move the dashboard staff filter application to the right place
  // Replace the existing fetchDepartmentData function with this corrected version:

  // Replace the existing fetchDepartmentData function with this corrected version:

// Add these debug logs to your fetchDepartmentData function to identify the issue:

const fetchDepartmentData = async () => {
  try {
    // Get all data first
    const data = await fetchDashboardDataApi(dashboardType);
    console.log('Raw data from API:', data); // DEBUG LOG
    
    const username = localStorage.getItem('user-name');
    const userRole = localStorage.getItem('role');
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    let totalTasks = 0;
    let completedTasks = 0;
    let pendingTasks = 0;
    let overdueTasks = 0;
    let completedRatingOne = 0;
    let completedRatingTwo = 0;
    let completedRatingThreePlus = 0;

    const monthlyData = {
      Jan: { completed: 0, pending: 0 },
      Feb: { completed: 0, pending: 0 },
      Mar: { completed: 0, pending: 0 },
      Apr: { completed: 0, pending: 0 },
      May: { completed: 0, pending: 0 },
      Jun: { completed: 0, pending: 0 },
      Jul: { completed: 0, pending: 0 },
      Aug: { completed: 0, pending: 0 },
      Sep: { completed: 0, pending: 0 },
      Oct: { completed: 0, pending: 0 },
      Nov: { completed: 0, pending: 0 },
      Dec: { completed: 0, pending: 0 }
    };

    // FIRST: Filter data by dashboard type - REMOVE this filter for checklist to include all tasks
    let filteredData = data;
    // COMMENTED OUT: This was preventing upcoming tasks from showing
    // if (dashboardType === "checklist") {
    //   filteredData = data.filter(task => {
    //     const taskDate = parseTaskStartDate(task.task_start_date);
    //     return taskDate && taskDate <= today;
    //   });
    // }

    // Extract unique staff names for the dropdown BEFORE staff filtering
    const uniqueStaff = [...new Set(data.map(task => task.name).filter(name => name && name.trim() !== ""))];
    setAvailableStaff(uniqueStaff);

    // SECOND: Apply dashboard staff filter ONLY if not "all"
    if (dashboardStaffFilter !== "all") {
      filteredData = filteredData.filter(task =>
        task.name && task.name.toLowerCase() === dashboardStaffFilter.toLowerCase()
      );
    }

    console.log('Filtered data after staff filter:', filteredData); // DEBUG LOG

    // Process tasks with your field names
    const processedTasks = filteredData.map(task => {
      // Skip if not assigned to current user (for non-admin)
      if (userRole !== "admin" && task.name?.toLowerCase() !== username?.toLowerCase()) {
        return null;
      }

      // FIXED: Use correct field name from your Supabase data
      const taskStartDate = parseTaskStartDate(task.task_start_date);
      const completionDate = task.submission_date ? parseTaskStartDate(task.submission_date) : null;

      // console.log('Processing task:', {
      //   id: task.task_id,
      //   originalDate: task.task_start_date,
      //   parsedDate: taskStartDate,
      //   today: today
      // }); // DEBUG LOG

      let status = "pending";
      if (completionDate) {
        status = "completed";
      } else if (taskStartDate && isDateInPast(taskStartDate)) {
        status = "overdue";
      }

      // Only count tasks up to today for cards (but keep all tasks for table display)
      if (taskStartDate && taskStartDate <= today) {
        if (status === "completed") {
          completedTasks++;
          if (dashboardType === "delegation") {
            if (task.color_code_for === 1) completedRatingOne++;
            else if (task.color_code_for === 2) completedRatingTwo++;
            else if (task.color_code_for >= 3) completedRatingThreePlus++;
          }
        } else {
          pendingTasks++;
          if (status === "overdue") overdueTasks++;
        }
        totalTasks++;
      }

      // Update monthly data for all tasks
      if (taskStartDate) {
        const monthName = taskStartDate.toLocaleString("default", { month: "short" });
        if (monthlyData[monthName]) {
          if (status === "completed") {
            monthlyData[monthName].completed++;
          } else {
            monthlyData[monthName].pending++;
          }
        }
      }

      return {
        id: task.task_id,
        title: task.task_description,
        assignedTo: task.name || "Unassigned",
        taskStartDate: formatDateToDDMMYYYY(taskStartDate),
        originalTaskStartDate: task.task_start_date, // Keep original for filtering
        status,
        frequency: task.frequency || "one-time",
        rating: task.color_code_for || 0
      };
    }).filter(Boolean);

    console.log('Processed tasks:', processedTasks); // DEBUG LOG
    console.log('Upcoming tasks:', processedTasks.filter(task => {
      const taskDate = parseTaskStartDate(task.originalTaskStartDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const taskDateOnly = new Date(taskDate);
      taskDateOnly.setHours(0, 0, 0, 0);
      return taskDateOnly > today;
    })); // DEBUG LOG

    const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;

    const barChartData = Object.entries(monthlyData).map(([name, data]) => ({
      name,
      completed: data.completed,
      pending: data.pending
    }));

    const pieChartData = [
      { name: "Completed", value: completedTasks, color: "#22c55e" },
      { name: "Pending", value: pendingTasks, color: "#facc15" },
      { name: "Overdue", value: overdueTasks, color: "#ef4444" }
    ];

    const staffMap = new Map();

    if (processedTasks.length > 0) {
      processedTasks.forEach(task => {
        const taskDate = parseTaskStartDate(task.originalTaskStartDate);
        // Only include tasks up to today for staff calculations
        if (taskDate && taskDate <= today) {
          const assignedTo = task.assignedTo || "Unassigned";
          if (!staffMap.has(assignedTo)) {
            staffMap.set(assignedTo, {
              name: assignedTo,
              totalTasks: 0,
              completedTasks: 0,
              pendingTasks: 0
            });
          }
          const staff = staffMap.get(assignedTo);
          staff.totalTasks++;
          if (task.status === "completed") {
            staff.completedTasks++;
          } else {
            staff.pendingTasks++;
          }
        }
      });
    }

    const staffMembers = Array.from(staffMap.values()).map(staff => ({
      ...staff,
      id: (staff.name || "unassigned").replace(/\s+/g, "-").toLowerCase(),
      email: `${(staff.name || "unassigned").toLowerCase().replace(/\s+/g, ".")}@example.com`,
      progress: staff.totalTasks > 0 ? Math.round((staff.completedTasks / staff.totalTasks) * 100) : 0
    }));

    setDepartmentData({
      allTasks: processedTasks, // This now includes ALL tasks (including upcoming)
      staffMembers,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionRate,
      barChartData,
      pieChartData,
      completedRatingOne,
      completedRatingTwo,
      completedRatingThreePlus
    });

  } catch (error) {
    console.error(`Error fetching ${dashboardType} data:`, error);
  }
};

  // 2. Also update the Redux dispatch calls to pass the staff filter:
  // Replace the useEffect with:

  // Replace your existing useEffect with this updated version:

  useEffect(() => {
    // Fetch detailed data for charts and tables
    fetchDepartmentData();

    // Update Redux state counts with staff filter
    dispatch(totalTaskInTable({
      dashboardType,
      staffFilter: dashboardStaffFilter
    }));
    dispatch(completeTaskInTable({
      dashboardType,
      staffFilter: dashboardStaffFilter
    }));
    dispatch(pendingTaskInTable({
      dashboardType,
      staffFilter: dashboardStaffFilter
    }));
    dispatch(overdueTaskInTable({
      dashboardType,
      staffFilter: dashboardStaffFilter
    }));
  }, [dashboardType, dashboardStaffFilter, dispatch]);

  // 3. Make sure your Redux API functions also handle the staff filter:
  // You'll need to update your Redux slice and API functions to accept and use the staff filter parameter

  // The key changes:
  // 1. Apply dashboardStaffFilter BEFORE other filtering
  // 2. Move staff filtering to the top of the function
  // 3. Remove the redundant staff filtering that was happening after processing
  // 4. Make sure the filtered data is used for all calculations

  // Filter tasks based on criteria
  const filteredTasks = departmentData.allTasks.filter((task) => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false;
    if (filterStaff !== "all" && task.assignedTo.toLowerCase() !== filterStaff.toLowerCase()) {
      return false;
    }
    if (searchQuery && searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      return (
        (task.title && task.title.toLowerCase().includes(query)) ||
        (task.id && task.id.toString().includes(query)) ||
        (task.assignedTo && task.assignedTo.toLowerCase().includes(query))
      );
    }
    return true;
  });

  // Reset dashboard staff filter when dashboard type changes
  useEffect(() => {
    setDashboardStaffFilter("all");
  }, [dashboardType]);

  // Get tasks by view
  // Replace the existing getTasksByView function with this fixed version:

const getTasksByView = (view) => {
  return filteredTasks.filter(task => {
    const taskDate = parseTaskStartDate(task.originalTaskStartDate);
    if (!taskDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const taskDateOnly = new Date(taskDate);
    taskDateOnly.setHours(0, 0, 0, 0);

    switch (view) {
      case "recent":
        // Show today's tasks but exclude completed ones for consistency with cards
        return isDateToday(taskDate) && task.status !== 'completed';
      
      // case "upcoming":
      //   // FIXED: Show tasks that are in the future (after today)
      //   return taskDateOnly > today;

      case "upcoming":
        // MODIFIED: Show only tomorrow's tasks instead of all future tasks
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return taskDateOnly.getTime() === tomorrow.getTime();
      
      case "overdue":
        // Show tasks that are past due and not completed
        return taskDateOnly < today && task.status !== 'completed';
      
      default:
        return true;
    }
  });
};

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500 hover:bg-green-600 text-white";
      case "pending":
        return "bg-amber-500 hover:bg-amber-600 text-white";
      case "overdue":
        return "bg-red-500 hover:bg-red-600 text-white";
      default:
        return "bg-gray-500 hover:bg-gray-600 text-white";
    }
  };

  const getFrequencyColor = (frequency) => {
    switch (frequency) {
      case "one-time":
        return "bg-gray-500 hover:bg-gray-600 text-white";
      case "daily":
        return "bg-blue-500 hover:bg-blue-600 text-white";
      case "weekly":
        return "bg-purple-500 hover:bg-purple-600 text-white";
      case "fortnightly":
        return "bg-indigo-500 hover:bg-indigo-600 text-white";
      case "monthly":
        return "bg-orange-500 hover:bg-orange-600 text-white";
      case "quarterly":
        return "bg-amber-500 hover:bg-amber-600 text-white";
      case "yearly":
        return "bg-emerald-500 hover:bg-emerald-600 text-white";
      default:
        return "bg-gray-500 hover:bg-gray-600 text-white";
    }
  };

  // Tasks Overview Chart Component
  const TasksOverviewChart = () => {
    return (
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={departmentData.barChartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" fontSize={12} stroke="#888888" tickLine={false} axisLine={false} />
          <YAxis fontSize={12} stroke="#888888" tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
          <Tooltip />
          <Legend />
          <Bar dataKey="completed" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="pending" stackId="a" fill="#f87171" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Tasks Completion Chart Component
  const TasksCompletionChart = () => {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={departmentData.pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
            {departmentData.pieChartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Staff Tasks Table Component
  const StaffTasksTable = () => {
    // Get today's date for filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate staff tasks excluding upcoming tasks
    const staffMembersWithCurrentTasks = departmentData.staffMembers.map(staff => {
      // Filter tasks assigned to this staff member that are not upcoming (due today or before)
      const staffTasks = departmentData.allTasks.filter(task => {
        const taskDate = parseTaskStartDate(task.originalTaskStartDate);
        return task.assignedTo === staff.name && taskDate && taskDate <= today;
      });

      const completedTasks = staffTasks.filter(task => task.status === 'completed').length;
      const totalTasks = staffTasks.length;
      const pendingTasks = totalTasks - completedTasks;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        ...staff,
        totalTasks,
        completedTasks,
        pendingTasks,
        progress
      };
    });

    return (
      <div className="rounded-md border border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Tasks
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Completed
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pending
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staffMembersWithCurrentTasks.map((staff) => (
              <tr key={staff.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                    <div className="text-xs text-gray-500">{staff.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.totalTasks}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.completedTasks}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.pendingTasks}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-[100px] bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${staff.progress}%` }}></div>
                    </div>
                    <span className="text-xs text-gray-500">{staff.progress}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {staff.progress >= 80 ? (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Excellent
                    </span>
                  ) : staff.progress >= 60 ? (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Good
                    </span>
                  ) : (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Needs Improvement
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };


  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate filtered stats for cards - same logic as table
  const cardStats = (() => {
    // Filter tasks that are not upcoming (due today or before)
    const filteredTasks = departmentData.allTasks.filter(task => {
      const taskDate = parseTaskStartDate(task.originalTaskStartDate);
      return taskDate && taskDate <= today;
    });

    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(task => task.status === 'completed').length;
    const pendingTasks = totalTasks - completedTasks;
    const overdueTasks = filteredTasks.filter(task => task.status === 'overdue').length;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks
    };
  })();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold tracking-tight text-purple-500">Dashboard </h1>
          <div className="flex items-center gap-2">
            {/* Dashboard Type Selection */}
            <select
              value={dashboardType}
              onChange={(e) => setDashboardType(e.target.value)}
              className="w-[140px] rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="checklist">Checklist</option>
              <option value="delegation">Delegation</option>
            </select>

            {/* Dashboard Staff Filter */}
            {userRole === "admin" ? (
              <select
                value={dashboardStaffFilter}
                onChange={(e) => setDashboardStaffFilter(e.target.value)}
                className="w-[180px] rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="all">All Staff Members</option>
                {availableStaff.map((staffName) => (
                  <option key={staffName} value={staffName}>
                    {staffName}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={username || ""}
                disabled={true}
                className="w-[180px] rounded-md border border-gray-300 p-2 bg-gray-100 text-gray-600 cursor-not-allowed"
              >
                <option value={username || ""}>{username || "Current User"}</option>
              </select>
            )}
          </div>
        </div>



        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-all bg-white">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded-tr-lg p-4">
              <h3 className="text-sm font-medium text-blue-700">Total Tasks</h3>
              <ListTodo className="h-4 w-4 text-blue-500" />
            </div>
           <div className="p-4">
              <div className="text-3xl font-bold text-blue-700">{totalTask}</div>
              <p className="text-xs text-blue-600">
                {dashboardType === "delegation"
                  ? "All tasks in delegation sheet"
                  : "Total tasks in checklist (up to today)"
                }
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-all bg-white">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-green-50 to-green-100 rounded-tr-lg p-4">
              <h3 className="text-sm font-medium text-green-700">
                {dashboardType === "delegation" ? "Completed Once" : "Completed Tasks"}
              </h3>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-green-700">
                { completeTask}
              </div>
              <p className="text-xs text-green-600">
                {dashboardType === "delegation" ? "Tasks completed once" : "Total completed till date"}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-all bg-white">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-amber-50 to-amber-100 rounded-tr-lg p-4">
              <h3 className="text-sm font-medium text-amber-700">
                {dashboardType === "delegation" ? "Completed Twice" : "Pending Tasks"}
              </h3>
              {dashboardType === "delegation" ? (
                <CheckCircle2 className="h-4 w-4 text-amber-500" />
              ) : (
                <Clock className="h-4 w-4 text-amber-500" />
              )}
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-amber-700">
                {pendingTask}
              </div>
              <p className="text-xs text-amber-600">
                {dashboardType === "delegation" ? "Tasks completed twice" : "Including today + overdue"}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-all bg-white">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-red-50 to-red-100 rounded-tr-lg p-4">
              <h3 className="text-sm font-medium text-red-700">
                {dashboardType === "delegation" ? "Completed 3+ Times" : "Overdue Tasks"}
              </h3>
              {dashboardType === "delegation" ? (
                <CheckCircle2 className="h-4 w-4 text-red-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-red-700">
                {overdueTask}
              </div>
              <p className="text-xs text-red-600">
                {dashboardType === "delegation" ? "Tasks completed 3+ times" : "Past due (excluding today)"}
              </p>
            </div>
          </div>
        </div>

        {/* Task Navigation Tabs */}
        <div className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="grid grid-cols-3">
            <button
              className={`py-3 text-center font-medium transition-colors ${taskView === "recent" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              onClick={() => setTaskView("recent")}
            >
              {dashboardType === "delegation" ? "Today Tasks" : "Recent Tasks"}
            </button>
            <button
              className={`py-3 text-center font-medium transition-colors ${taskView === "upcoming" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              onClick={() => setTaskView("upcoming")}
            >
              {dashboardType === "delegation" ? "Future Tasks" : "Upcoming Tasks"}
            </button>
            <button
              className={`py-3 text-center font-medium transition-colors ${taskView === "overdue" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              onClick={() => setTaskView("overdue")}
            >
              Overdue Tasks
            </button>
          </div>

          <div className="p-4">
            <div className="flex flex-col gap-4 md:flex-row mb-4">
              <div className="flex-1 space-y-2">
                <label htmlFor="search" className="flex items-center text-purple-700">
                  <Filter className="h-4 w-4 mr-2" />
                  Search Tasks
                </label>
                <input
                  id="search"
                  placeholder="Search by task title or ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div className="space-y-2 md:w-[180px]">
                <label htmlFor="staff-filter" className="flex items-center text-purple-700">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter by Staff
                </label>
                <select
                  id="staff-filter"
                  value={filterStaff}
                  onChange={(e) => setFilterStaff(e.target.value)}
                  className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="all">All Staff</option>
                  {Array.from(new Set(departmentData.allTasks.map(task => task.assignedTo)))
                    .filter(name => name) // Remove empty/null names
                    .map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {getTasksByView(taskView).length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                <p>No tasks found matching your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto" style={{ maxHeight: "400px", overflowY: "auto" }}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task Description
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task Start Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Frequency
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getTasksByView(taskView).map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.assignedTo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.taskStartDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getFrequencyColor(task.frequency)}`}
                          >
                            {task.frequency.charAt(0).toUpperCase() + task.frequency.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
          <div className="rounded-lg border border-l-4 border-l-indigo-500 shadow-md hover:shadow-lg transition-all bg-white">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-tr-lg p-4">
              <h3 className="text-sm font-medium text-indigo-700">Task Completion Rate</h3>
              <BarChart3 className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-indigo-700">{departmentData.completionRate}%</div>
                <div className="flex items-center space-x-2">
                  <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="text-xs text-gray-600">Completed: {departmentData.completedTasks}</span>
                  <span className="inline-block w-3 h-3 bg-amber-500 rounded-full"></span>
                  <span className="text-xs text-gray-600">Total: {departmentData.totalTasks}</span>
                </div>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-amber-500 rounded-full"
                  style={{ width: `${departmentData.completionRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="space-y-4">
          <div className="bg-purple-100 rounded-md p-1 flex space-x-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 py-2 text-center rounded-md transition-colors ${activeTab === "overview" ? "bg-purple-600 text-white" : "text-purple-700 hover:bg-purple-200"
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("mis")}
              className={`flex-1 py-2 text-center rounded-md transition-colors ${activeTab === "mis" ? "bg-purple-600 text-white" : "text-purple-700 hover:bg-purple-200"
                }`}
            >
              MIS Report
            </button>
            <button
              onClick={() => setActiveTab("staff")}
              className={`flex-1 py-2 text-center rounded-md transition-colors ${activeTab === "staff" ? "bg-purple-600 text-white" : "text-purple-700 hover:bg-purple-200"
                }`}
            >
              Staff Performance
            </button>
          </div>

          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="lg:col-span-4 rounded-lg border border-purple-200 shadow-md bg-white">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-4">
                    <h3 className="text-purple-700 font-medium">Tasks Overview</h3>
                    <p className="text-purple-600 text-sm">Task completion rate over time</p>
                  </div>
                  <div className="p-4 pl-2">
                    <TasksOverviewChart />
                  </div>
                </div>
                <div className="lg:col-span-3 rounded-lg border border-purple-200 shadow-md bg-white">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-4">
                    <h3 className="text-purple-700 font-medium">Task Status</h3>
                    <p className="text-purple-600 text-sm">Distribution of tasks by status</p>
                  </div>
                  <div className="p-4">
                    <TasksCompletionChart />
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-purple-200 shadow-md bg-white">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-4">
                  <h3 className="text-purple-700 font-medium">Staff Task Summary</h3>
                  <p className="text-purple-600 text-sm">Overview of tasks assigned to each staff member</p>
                </div>
                <div className="p-4">
                  <StaffTasksTable />
                </div>
              </div>
            </div>
          )}

          {activeTab === "mis" && (
            <div className="rounded-lg border border-purple-200 shadow-md bg-white">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-4">
                <h3 className="text-purple-700 font-medium">MIS Report</h3>
                <p className="text-purple-600 text-sm">
                  {dashboardType === "delegation"
                    ? "Detailed delegation analytics - all tasks from sheet data"
                    : "Detailed task analytics and performance metrics"
                  }
                </p>
              </div>
              <div className="p-4">
                <div className="space-y-8">
                  {dashboardType !== "delegation" && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <div className="space-y-2 lg:col-span-1">
                        <label htmlFor="start-date" className="flex items-center text-purple-700 text-sm font-medium">
                          Start Date
                        </label>
                        <input
                          id="start-date"
                          type="date"
                          value={dateRange.startDate}
                          onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <div className="space-y-2 lg:col-span-1">
                        <label htmlFor="end-date" className="flex items-center text-purple-700 text-sm font-medium">
                          End Date
                        </label>
                        <input
                          id="end-date"
                          type="date"
                          value={dateRange.endDate}
                          onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <div className="space-y-2 lg:col-span-2 flex items-end">
                        <button
                          onClick={filterTasksByDateRange}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded transition-colors"
                        >
                          Apply Filter
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-purple-600">Total Tasks Assigned</div>
                      <div className="text-3xl font-bold text-purple-700">
                        {dashboardType === "delegation"
                          ? departmentData.totalTasks
                          : (dateRange.filtered ? filteredDateStats.totalTasks : departmentData.totalTasks)
                        }
                      </div>
                      {dashboardType === "delegation" ? (
                        <p className="text-xs text-purple-600">All tasks from delegation sheet</p>
                      ) : (
                        dateRange.filtered && (
                          <p className="text-xs text-purple-600">
                            For period: {formatLocalDate(dateRange.startDate)} - {formatLocalDate(dateRange.endDate)}
                          </p>
                        )
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-purple-600">Tasks Completed</div>
                      <div className="text-3xl font-bold text-purple-700">
                        {dashboardType === "delegation"
                          ? departmentData.completedTasks
                          : (dateRange.filtered ? filteredDateStats.completedTasks : departmentData.completedTasks)
                        }
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-purple-600">
                        {dashboardType === "delegation" ? "Tasks Pending" : "Tasks Pending/Overdue"}
                      </div>
                      <div className="text-3xl font-bold text-purple-700">
                        {dashboardType === "delegation"
                          ? departmentData.pendingTasks
                          : (dateRange.filtered
                            ? `${filteredDateStats.pendingTasks} / ${filteredDateStats.overdueTasks}`
                            : `${departmentData.pendingTasks} / ${departmentData.overdueTasks}`
                          )
                        }
                      </div>
                      <div className="text-xs text-purple-600">
                        {dashboardType === "delegation"
                          ? "All incomplete tasks"
                          : "Pending (all incomplete) / Overdue (past dates only)"
                        }
                      </div>
                    </div>
                  </div>

                  {dashboardType !== "delegation" && dateRange.filtered && (
                    <div className="rounded-lg border border-purple-100 p-4 bg-gray-50">
                      <h4 className="text-lg font-medium text-purple-700 mb-4">Detailed Date Range Breakdown</h4>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="bg-white p-3 rounded-lg border border-amber-200">
                          <div className="text-sm font-medium text-amber-700">Pending Tasks</div>
                          <div className="text-2xl font-bold text-amber-600">{filteredDateStats.pendingTasks}</div>
                          <div className="text-xs text-amber-600 mt-1">All incomplete tasks (including overdue + today)</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-red-200">
                          <div className="text-sm font-medium text-red-700">Overdue Tasks</div>
                          <div className="text-2xl font-bold text-red-600">{filteredDateStats.overdueTasks}</div>
                          <div className="text-xs text-red-600 mt-1">Past due dates only (excluding today)</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-green-200">
                          <div className="text-sm font-medium text-green-700">Completed Once</div>
                          <div className="text-2xl font-bold text-green-600">{departmentData.completedRatingOne}</div>
                          <div className="text-xs text-green-600 mt-1">Tasks with rating 1</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-amber-200">
                          <div className="text-sm font-medium text-amber-700">Completed Twice</div>
                          <div className="text-2xl font-bold text-amber-600">{departmentData.completedRatingTwo}</div>
                          <div className="text-xs text-amber-600 mt-1">Tasks with rating 2</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-red-200">
                          <div className="text-sm font-medium text-red-700">Completed 3+ Times</div>
                          <div className="text-2xl font-bold text-red-600">{departmentData.completedRatingThreePlus}</div>
                          <div className="text-xs text-red-600 mt-1">Tasks with rating 3 or higher</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-purple-700">Department Performance</h3>
                    <div className="grid gap-4 md:grid-cols-1">
                      <div className="rounded-lg border border-purple-200 bg-white p-4">
                        <h4 className="text-sm font-medium text-purple-700 mb-2">Completion Rate</h4>
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-bold text-purple-700">
                            {dashboardType === "delegation"
                              ? departmentData.completionRate
                              : (dateRange.filtered ? filteredDateStats.completionRate : departmentData.completionRate)
                            }%
                          </div>
                          <div className="flex-1">
                            <div className="w-full h-6 bg-gray-200 rounded-full">
                              <div
                                className="h-full rounded-full flex items-center justify-end px-3 text-xs font-medium text-white"
                                style={{
                                  width: `${dashboardType === "delegation"
                                    ? departmentData.completionRate
                                    : (dateRange.filtered ? filteredDateStats.completionRate : departmentData.completionRate)
                                    }%`,
                                  background: `linear-gradient(to right, #10b981 ${(dashboardType === "delegation"
                                    ? departmentData.completionRate
                                    : (dateRange.filtered ? filteredDateStats.completionRate : departmentData.completionRate)
                                  ) * 0.8}%, #f59e0b ${(dashboardType === "delegation"
                                    ? departmentData.completionRate
                                    : (dateRange.filtered ? filteredDateStats.completionRate : departmentData.completionRate)
                                  ) * 0.8}%)`
                                }}
                              >
                                {dashboardType === "delegation"
                                  ? departmentData.completionRate
                                  : (dateRange.filtered ? filteredDateStats.completionRate : departmentData.completionRate)
                                }%
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-purple-600 mt-2">
                          {dashboardType === "delegation" ?
                            `${departmentData.completedTasks} of ${departmentData.totalTasks} tasks completed in delegation mode (all sheet data)` :
                            `${dateRange.filtered ? filteredDateStats.completedTasks : departmentData.completedTasks} of ${dateRange.filtered ? filteredDateStats.totalTasks : departmentData.totalTasks} tasks completed in checklist mode`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "staff" && (
            <div className="rounded-lg border border-purple-200 shadow-md bg-white">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-4">
                <h3 className="text-purple-700 font-medium">Staff Performance</h3>
                <p className="text-purple-600 text-sm">
                  {dashboardType === "delegation"
                    ? "Task completion rates by staff member (all delegation sheet data)"
                    : "Task completion rates by staff member (tasks up to today only)"
                  }
                </p>
              </div>
              <div className="p-4">
                <div className="space-y-8">
                  {departmentData.staffMembers.length > 0 ? (
                    <>
                      {(() => {
                        // Sort staff members by performance (high to low)
                        const sortedStaffMembers = [...departmentData.staffMembers]
                          .filter(staff => staff.totalTasks > 0)
                          .sort((a, b) => b.progress - a.progress);

                        return (
                          <>
                            {/* High performers section (70% or above) */}
                            <div className="rounded-md border border-green-200">
                              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
                                <h3 className="text-lg font-medium text-green-700">Top Performers</h3>
                                <p className="text-sm text-green-600">
                                  {dashboardType === "delegation"
                                    ? "Staff with high task completion rates (all delegation data)"
                                    : "Staff with high task completion rates (tasks up to today only)"
                                  }
                                </p>
                              </div>
                              <div className="p-4">
                                <div className="space-y-4">
                                  {sortedStaffMembers
                                    .filter(staff => staff.progress >= 70)
                                    .map((staff) => (
                                      <div
                                        key={staff.id}
                                        className="flex items-center justify-between p-3 border border-green-100 rounded-md bg-green-50"
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center">
                                            <span className="text-sm font-medium text-white">{staff.name.charAt(0)}</span>
                                          </div>
                                          <div>
                                            <p className="font-medium text-green-700">{staff.name}</p>
                                            <p className="text-xs text-green-600">{staff.completedTasks} of {staff.totalTasks} tasks completed</p>
                                          </div>
                                        </div>
                                        <div className="text-lg font-bold text-green-600">{staff.progress}%</div>
                                      </div>
                                    ))
                                  }
                                  {sortedStaffMembers.filter(staff => staff.progress >= 70).length === 0 && (
                                    <div className="text-center p-4 text-gray-500">
                                      <p>No staff members with high completion rates found.</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Mid performers section (40-69%) */}
                            <div className="rounded-md border border-yellow-200">
                              <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 border-b border-yellow-200">
                                <h3 className="text-lg font-medium text-yellow-700">Average Performers</h3>
                                <p className="text-sm text-yellow-600">
                                  {dashboardType === "delegation"
                                    ? "Staff with moderate task completion rates (all delegation data)"
                                    : "Staff with moderate task completion rates (tasks up to today only)"
                                  }
                                </p>
                              </div>
                              <div className="p-4">
                                <div className="space-y-4">
                                  {sortedStaffMembers
                                    .filter(staff => staff.progress >= 40 && staff.progress < 70)
                                    .map((staff) => (
                                      <div
                                        key={staff.id}
                                        className="flex items-center justify-between p-3 border border-yellow-100 rounded-md bg-yellow-50"
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 flex items-center justify-center">
                                            <span className="text-sm font-medium text-white">{staff.name.charAt(0)}</span>
                                          </div>
                                          <div>
                                            <p className="font-medium text-yellow-700">{staff.name}</p>
                                            <p className="text-xs text-yellow-600">{staff.completedTasks} of {staff.totalTasks} tasks completed</p>
                                          </div>
                                        </div>
                                        <div className="text-lg font-bold text-yellow-600">{staff.progress}%</div>
                                      </div>
                                    ))
                                  }
                                  {sortedStaffMembers.filter(staff => staff.progress >= 40 && staff.progress < 70).length === 0 && (
                                    <div className="text-center p-4 text-gray-500">
                                      <p>No staff members with moderate completion rates found.</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Low performers section (below 40%) */}
                            <div className="rounded-md border border-red-200">
                              <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
                                <h3 className="text-lg font-medium text-red-700">Needs Improvement</h3>
                                <p className="text-sm text-red-600">
                                  {dashboardType === "delegation"
                                    ? "Staff with lower task completion rates (all delegation data)"
                                    : "Staff with lower task completion rates (tasks up to today only)"
                                  }
                                </p>
                              </div>
                              <div className="p-4">
                                <div className="space-y-4">
                                  {sortedStaffMembers
                                    .filter(staff => staff.progress < 40)
                                    .map((staff) => (
                                      <div
                                        key={staff.id}
                                        className="flex items-center justify-between p-3 border border-red-100 rounded-md bg-red-50"
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                                            <span className="text-sm font-medium text-white">{staff.name.charAt(0)}</span>
                                          </div>
                                          <div>
                                            <p className="font-medium text-red-700">{staff.name}</p>
                                            <p className="text-xs text-red-600">{staff.completedTasks} of {staff.totalTasks} tasks completed</p>
                                          </div>
                                        </div>
                                        <div className="text-lg font-bold text-red-600">{staff.progress}%</div>
                                      </div>
                                    ))
                                  }
                                  {sortedStaffMembers.filter(staff => staff.progress < 40).length === 0 && (
                                    <div className="text-center p-4 text-gray-500">
                                      <p>No staff members with low completion rates found.</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* No assigned tasks section */}
                            {departmentData.staffMembers.filter(staff => staff.totalTasks === 0).length > 0 && (
                              <div className="rounded-md border border-gray-200">
                                <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                  <h3 className="text-lg font-medium text-gray-700">No Tasks Assigned</h3>
                                  <p className="text-sm text-gray-600">
                                    {dashboardType === "delegation"
                                      ? "Staff with no tasks in delegation sheet"
                                      : "Staff with no tasks assigned for current period"
                                    }
                                  </p>
                                </div>
                                <div className="p-4">
                                  <div className="space-y-4">
                                    {departmentData.staffMembers
                                      .filter(staff => staff.totalTasks === 0)
                                      .map((staff) => (
                                        <div
                                          key={staff.id}
                                          className="flex items-center justify-between p-3 border border-gray-100 rounded-md bg-gray-50"
                                        >
                                          <div className="flex items-center gap-2">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center">
                                              <span className="text-sm font-medium text-white">{staff.name.charAt(0)}</span>
                                            </div>
                                            <div>
                                              <p className="font-medium text-gray-700">{staff.name}</p>
                                              <p className="text-xs text-gray-600">
                                                {dashboardType === "delegation"
                                                  ? "No tasks in delegation sheet"
                                                  : "No tasks assigned up to today"
                                                }
                                              </p>
                                            </div>
                                          </div>
                                          <div className="text-lg font-bold text-gray-600">N/A</div>
                                        </div>
                                      ))
                                    }
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    <div className="text-center p-8 text-gray-500">
                      <p>
                        {dashboardType === "delegation"
                          ? "No delegation data available."
                          : "Loading staff data..."
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}


// Helper components (keep these the same as before)
const TasksOverviewChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={350}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
      <XAxis dataKey="name" fontSize={12} stroke="#888888" tickLine={false} axisLine={false} />
      <YAxis fontSize={12} stroke="#888888" tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
      <Tooltip />
      <Legend />
      <Bar dataKey="completed" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
      <Bar dataKey="pending" stackId="a" fill="#f87171" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
)

const TasksCompletionChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
)