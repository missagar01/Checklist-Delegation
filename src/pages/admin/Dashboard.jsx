"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import AdminLayout from "../../components/layout/AdminLayout.jsx"
import DashboardHeader from "./dashboard/DashboardHeader.jsx"
import StatisticsCards from "./dashboard/StaticsCard.jsx"
import TaskNavigationTabs from "./dashboard/TaskNavigationTab.jsx"
import CompletionRateCard from "./dashboard/CompletionRateCard.jsx"
import TasksOverviewChart from "./dashboard/Chart/TaskOverviewChart.jsx"
import TasksCompletionChart from "./dashboard/Chart/TaskCompletionChart.jsx"
import StaffTasksTable from "./dashboard/StaffTaskTable.jsx"
import {
  completeTaskInTable,
  overdueTaskInTable,
  pendingTaskInTable,
  totalTaskInTable,
} from "../../redux/slice/dashboardSlice.js"
// import { fetchDashboardDataApi } from "../../redux/api/dashboardApi.js"
import { fetchDashboardDataApi, getUniqueDepartmentsApi, getStaffNamesByDepartmentApi } from "../../redux/api/dashboardApi.js"
// import { getUniqueDepartmentsApi } from "../../redux/api/dashboardApi.js"

export default function AdminDashboard() {
  const [dashboardType, setDashboardType] = useState("checklist")
  const [taskView, setTaskView] = useState("recent")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterStaff, setFilterStaff] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [dashboardStaffFilter, setDashboardStaffFilter] = useState("all")
  const [availableStaff, setAvailableStaff] = useState([])
  const userRole = localStorage.getItem("role")
  const username = localStorage.getItem("user-name")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreData, setHasMoreData] = useState(true)
  const [allTasks, setAllTasks] = useState([])
  const [batchSize] = useState(1000) // Increased batch size for better performance
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [availableDepartments, setAvailableDepartments] = useState([])



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
    completedRatingThreePlus: 0,
  })

  // Store the current date for overdue calculation
  const [currentDate, setCurrentDate] = useState(new Date())

  // New state for date range filtering
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
    filtered: false,
  })

  // State to store filtered statistics
  const [filteredDateStats, setFilteredDateStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
  })

  const { dashboard, totalTask, completeTask, pendingTask, overdueTask } = useSelector((state) => state.dashBoard)
  const dispatch = useDispatch()

  // Updated date parsing function to handle both formats
  const parseTaskStartDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== "string") return null

    // Handle YYYY-MM-DD format (ISO format from Supabase)
    if (dateStr.includes("-") && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      const parsed = new Date(dateStr)
      return isNaN(parsed) ? null : parsed
    }

    // Handle DD/MM/YYYY format (with or without time)
    if (dateStr.includes("/")) {
      // Split by space first to separate date and time
      const parts = dateStr.split(" ")
      const datePart = parts[0] // "25/08/2025"

      const dateComponents = datePart.split("/")
      if (dateComponents.length !== 3) return null

      const [day, month, year] = dateComponents.map(Number)

      if (!day || !month || !year) return null

      // Create date object (month is 0-indexed)
      const date = new Date(year, month - 1, day)

      // If there's time component, parse it
      if (parts.length > 1) {
        const timePart = parts[1] // "09:00:00"
        const timeComponents = timePart.split(":")
        if (timeComponents.length >= 2) {
          const [hours, minutes, seconds] = timeComponents.map(Number)
          date.setHours(hours || 0, minutes || 0, seconds || 0)
        }
      }

      return isNaN(date) ? null : date
    }

    // Fallback: Try ISO format
    const parsed = new Date(dateStr)
    return isNaN(parsed) ? null : parsed
  }

  // Helper function to format date from ISO format to DD/MM/YYYY
  const formatLocalDate = (isoDate) => {
    if (!isoDate) return ""
    const date = new Date(isoDate)
    return formatDateToDDMMYYYY(date)
  }

  // Function to filter tasks by date range
  const filterTasksByDateRange = () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      alert("Please select both start and end dates")
      return
    }

    const startDate = new Date(dateRange.startDate)
    startDate.setHours(0, 0, 0, 0)

    const endDate = new Date(dateRange.endDate)
    endDate.setHours(23, 59, 59, 999)

    if (startDate > endDate) {
      alert("Start date must be before end date")
      return
    }

    const filteredTasks = departmentData.allTasks.filter((task) => {
      const taskStartDate = parseTaskStartDate(task.originalTaskStartDate) // Use original date string
      if (!taskStartDate) return false
      return taskStartDate >= startDate && taskStartDate <= endDate
    })

    const totalTasks = filteredTasks.length
    let completedTasks = 0
    let pendingTasks = 0
    let overdueTasks = 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    filteredTasks.forEach((task) => {
      if (task.status === "completed") {
        completedTasks++
      } else {
        pendingTasks++
        if (task.status === "overdue") {
          overdueTasks++
        }
      }
    })

    const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0

    setFilteredDateStats({
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionRate,
    })

    setDateRange((prev) => ({ ...prev, filtered: true }))
  }

  // Format date as DD/MM/YYYY
  const formatDateToDDMMYYYY = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date)) return ""
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Check if date is today
  const isDateToday = (date) => {
    if (!date || !(date instanceof Date)) return false
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // Check if date is in the past (excluding today)
  const isDateInPast = (date) => {
    if (!date || !(date instanceof Date)) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    return checkDate < today
  }

  // Check if date is in the future (excluding today)
  const isDateFuture = (date) => {
    if (!date || !(date instanceof Date)) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    return checkDate > today
  }

  // Function to check if a date is tomorrow
  const isDateTomorrow = (dateStr) => {
    const date = parseTaskStartDate(dateStr)
    if (!date) return false
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    return date.getTime() === tomorrow.getTime()
  }

  const fetchDepartmentData = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setIsLoadingMore(true)
        setHasMoreData(true)
      } else {
        setIsLoadingMore(true)
      }

      // Use the updated API function with department filter
      const data = await fetchDashboardDataApi(dashboardType, dashboardStaffFilter, page, batchSize, 'all', departmentFilter)

      if (!data || data.length === 0) {
        if (page === 1) {
          setDepartmentData(prev => ({
            ...prev,
            allTasks: [],
            totalTasks: 0,
            completedTasks: 0,
            pendingTasks: 0,
            overdueTasks: 0,
            completionRate: 0,
          }))
        }
        setHasMoreData(false)
        setIsLoadingMore(false)
        return
      }

      console.log(`Fetched ${data.length} records successfully`)

      const username = localStorage.getItem("user-name")
      const userRole = localStorage.getItem("role")
      const today = new Date()
      today.setHours(23, 59, 59, 999) // End of today

      let totalTasks = 0
      let completedTasks = 0
      let pendingTasks = 0
      let overdueTasks = 0
      let completedRatingOne = 0
      let completedRatingTwo = 0  // Fixed: Added 'let' declaration
      let completedRatingThreePlus = 0

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
        Dec: { completed: 0, pending: 0 },
      }

      // FIRST: Filter data by dashboard type - REMOVE this filter for checklist to include all tasks
      let filteredData = data

      // Extract unique staff names for the dropdown BEFORE staff filtering
      // Extract unique staff names for the dropdown BEFORE staff filtering
      // Extract unique staff names for the dropdown BEFORE staff filtering
      // Extract unique staff names for the dropdown BEFORE staff filtering
      let uniqueStaff;

      if (dashboardType === 'checklist' && departmentFilter !== 'all') {
        // For checklist with department filter, get staff from users table based on user_access
        try {
          uniqueStaff = await getStaffNamesByDepartmentApi(departmentFilter);
        } catch (error) {
          console.error('Error fetching staff by department:', error);
          uniqueStaff = [...new Set(data.map((task) => task.name).filter((name) => name && name.trim() !== ""))];
        }
      } else {
        // Default behavior - extract from task data
        uniqueStaff = [...new Set(data.map((task) => task.name).filter((name) => name && name.trim() !== ""))];
      }

      // For non-admin users, always ensure current user appears in staff dropdown
      if (userRole !== "admin" && username) {
        if (!uniqueStaff.some(staff => staff.toLowerCase() === username.toLowerCase())) {
          uniqueStaff.push(username)
        }
      }

      setAvailableStaff(uniqueStaff)

      // SECOND: Apply dashboard staff filter ONLY if not "all"
      if (dashboardStaffFilter !== "all") {
        filteredData = filteredData.filter(
          (task) => task.name && task.name.toLowerCase() === dashboardStaffFilter.toLowerCase(),
        )
      }

      // Process tasks with your field names
      // Update the task processing logic to include submission_date:

      const processedTasks = filteredData
        .map((task) => {
          // Skip if not assigned to current user (for non-admin)
          if (userRole !== "admin" && task.name?.toLowerCase() !== username?.toLowerCase()) {
            return null;
          }

          // FIXED: Use correct field name from your Supabase data
          const taskStartDate = parseTaskStartDate(task.task_start_date);
          const completionDate = task.submission_date ? parseTaskStartDate(task.submission_date) : null;

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
              if (dashboardType === "delegation" && task.submission_date) {
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
            submission_date: task.submission_date, // Add this for delegation tracking
            status,
            frequency: task.frequency || "one-time",
            rating: task.color_code_for || 0,
          };
        })
        .filter(Boolean);

      const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0

      const barChartData = Object.entries(monthlyData).map(([name, data]) => ({
        name,
        completed: data.completed,
        pending: data.pending,
      }))

      const pieChartData = [
        { name: "Completed", value: completedTasks, color: "#22c55e" },
        { name: "Pending", value: pendingTasks, color: "#facc15" },
        { name: "Overdue", value: overdueTasks, color: "#ef4444" },
      ]

      const staffMap = new Map()

      if (processedTasks.length > 0) {
        processedTasks.forEach((task) => {
          const taskDate = parseTaskStartDate(task.originalTaskStartDate)
          // Only include tasks up to today for staff calculations
          if (taskDate && taskDate <= today) {
            const assignedTo = task.assignedTo || "Unassigned"
            if (!staffMap.has(assignedTo)) {
              staffMap.set(assignedTo, {
                name: assignedTo,
                totalTasks: 0,
                completedTasks: 0,
                pendingTasks: 0,
              })
            }
            const staff = staffMap.get(assignedTo)
            staff.totalTasks++
            if (task.status === "completed") {
              staff.completedTasks++
            } else {
              staff.pendingTasks++
            }
          }
        })
      }

      const staffMembers = Array.from(staffMap.values()).map((staff) => ({
        ...staff,
        id: (staff.name || "unassigned").replace(/\s+/g, "-").toLowerCase(),
        email: `${(staff.name || "unassigned").toLowerCase().replace(/\s+/g, ".")}@example.com`,
        progress: staff.totalTasks > 0 ? Math.round((staff.completedTasks / staff.totalTasks) * 100) : 0,
      }))

      setDepartmentData(prev => {
        const updatedTasks = append
          ? [...prev.allTasks, ...processedTasks]
          : processedTasks

        return {
          allTasks: updatedTasks,
          staffMembers,
          totalTasks: append ? prev.totalTasks + totalTasks : totalTasks,
          completedTasks: append ? prev.completedTasks + completedTasks : completedTasks,
          pendingTasks: append ? prev.pendingTasks + pendingTasks : pendingTasks,
          overdueTasks: append ? prev.overdueTasks + overdueTasks : overdueTasks,
          completionRate: append
            ? (updatedTasks.filter(t => t.status === "completed").length / updatedTasks.length * 100).toFixed(1)
            : completionRate,
          barChartData,
          pieChartData,
          completedRatingOne: append ? prev.completedRatingOne + completedRatingOne : completedRatingOne,
          completedRatingTwo: append ? prev.completedRatingTwo + completedRatingTwo : completedRatingTwo,
          completedRatingThreePlus: append ? prev.completedRatingThreePlus + completedRatingThreePlus : completedRatingThreePlus,
        }
      })

      // Check if we have more data to load
      if (data.length < batchSize) {
        setHasMoreData(false)
      }

      setIsLoadingMore(false)
    } catch (error) {
      console.error(`Error fetching ${dashboardType} data:`, error)
      setIsLoadingMore(false)
    }
  }

  const fetchDepartments = async () => {
    if (dashboardType === 'checklist') {
      try {
        const departments = await getUniqueDepartmentsApi();
        console.log('All departments from API:', departments);

        // Get user's department access
        const userAccess = localStorage.getItem("user_access") || "";
        console.log('User access from localStorage:', userAccess);

        const userDepartments = userAccess
          ? userAccess.split(',').map(dept => dept.trim().toLowerCase()) // Keep lowercase for comparison
          : [];
        console.log('Parsed user departments:', userDepartments);

        // Filter departments based on user access for admin users
        let filteredDepartments = departments;
        if (userRole === "admin" && userDepartments.length > 0) {
          filteredDepartments = departments.filter(dept =>
            userDepartments.includes(dept.toLowerCase()) // Compare in lowercase
          );
        }

        console.log('Filtered departments:', filteredDepartments);
        setAvailableDepartments(filteredDepartments);
      } catch (error) {
        console.error('Error fetching departments:', error);
        setAvailableDepartments([]);
      }
    } else {
      setAvailableDepartments([]);
    }
  }


  useEffect(() => {
    fetchDepartments();
  }, [dashboardType, userRole]); // Add userRole as dependency

  // Reset staff filter when department filter changes
  useEffect(() => {
    if (dashboardType === 'checklist') {
      setDashboardStaffFilter("all");
    }
  }, [departmentFilter, dashboardType]);

  // Add scroll event listener for infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      const tableContainer = document.querySelector('.task-table-container')
      if (!tableContainer) return

      const { scrollTop, scrollHeight, clientHeight } = tableContainer
      const isNearBottom = scrollHeight - scrollTop <= clientHeight * 1.2

      if (isNearBottom && !isLoadingMore && hasMoreData) {
        loadMoreData()
      }
    }

    const tableContainer = document.querySelector('.task-table-container')
    if (tableContainer) {
      tableContainer.addEventListener('scroll', handleScroll)
      return () => tableContainer.removeEventListener('scroll', handleScroll)
    }
  }, [isLoadingMore, hasMoreData])

  useEffect(() => {
    // Fetch detailed data for charts and tables
    fetchDepartmentData(1, false)

    // Update Redux state counts with staff and department filters
    dispatch(
      totalTaskInTable({
        dashboardType,
        staffFilter: dashboardStaffFilter,
        departmentFilter, // Add this
      }),
    )
    dispatch(
      completeTaskInTable({
        dashboardType,
        staffFilter: dashboardStaffFilter,
        departmentFilter, // Add this
      }),
    )
    dispatch(
      pendingTaskInTable({
        dashboardType,
        staffFilter: dashboardStaffFilter,
        departmentFilter, // Add this
      }),
    )
    dispatch(
      overdueTaskInTable({
        dashboardType,
        staffFilter: dashboardStaffFilter,
        departmentFilter, // Add this
      }),
    )
  }, [dashboardType, dashboardStaffFilter, departmentFilter, dispatch]) // Add departmentFilter to dependency array


  // Filter tasks based on criteria
  const filteredTasks = departmentData.allTasks.filter((task) => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false
    if (filterStaff !== "all" && task.assignedTo.toLowerCase() !== filterStaff.toLowerCase()) {
      return false
    }
    if (searchQuery && searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim()
      return (
        (task.title && task.title.toLowerCase().includes(query)) ||
        (task.id && task.id.toString().includes(query)) ||
        (task.assignedTo && task.assignedTo.toLowerCase().includes(query))
      )
    }
    return true
  })

  // Reset dashboard staff filter when dashboard type changes
  useEffect(() => {
    setDashboardStaffFilter("all")
    setDepartmentFilter("all") // Add this line
    setCurrentPage(1)
    setHasMoreData(true)
  }, [dashboardType])

  const getTasksByView = (view) => {
    return filteredTasks.filter((task) => {
      const taskDate = parseTaskStartDate(task.originalTaskStartDate);
      if (!taskDate) return false;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const taskDateOnly = new Date(taskDate);
      taskDateOnly.setHours(0, 0, 0, 0);

      switch (view) {
        case "recent":
          // For delegation, show today's tasks regardless of completion status
          if (dashboardType === "delegation") {
            return isDateToday(taskDate);
          }
          // For checklist, show today's tasks but exclude completed ones
          return isDateToday(taskDate) && task.status !== "completed";

        case "upcoming":
          // For delegation, show tomorrow's tasks regardless of completion status
          if (dashboardType === "delegation") {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return taskDateOnly.getTime() === tomorrow.getTime();
          }
          // For checklist, show only tomorrow's tasks
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          return taskDateOnly.getTime() === tomorrow.getTime();

        case "overdue":
          // For delegation, show tasks that are past due and have null submission_date
          if (dashboardType === "delegation") {
            return taskDateOnly < today && !task.submission_date;
          }
          // For checklist, show tasks that are past due and not completed
          return taskDateOnly < today && task.status !== "completed";

        default:
          return true;
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500 hover:bg-green-600 text-white"
      case "pending":
        return "bg-amber-500 hover:bg-amber-600 text-white"
      case "overdue":
        return "bg-red-500 hover:bg-red-600 text-white"
      default:
        return "bg-gray-500 hover:bg-gray-600 text-white"
    }
  }

  const getFrequencyColor = (frequency) => {
    switch (frequency) {
      case "one-time":
        return "bg-gray-500 hover:bg-gray-600 text-white"
      case "daily":
        return "bg-blue-500 hover:bg-blue-600 text-white"
      case "weekly":
        return "bg-purple-500 hover:bg-purple-600 text-white"
      case "fortnightly":
        return "bg-indigo-500 hover:bg-indigo-600 text-white"
      case "monthly":
        return "bg-orange-500 hover:bg-orange-600 text-white"
      case "quarterly":
        return "bg-amber-500 hover:bg-amber-600 text-white"
      case "yearly":
        return "bg-emerald-500 hover:bg-emerald-600 text-white"
      default:
        return "bg-gray-500 hover:bg-gray-600 text-white"
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Calculate filtered stats for cards - same logic as table
  const cardStats = (() => {
    // Filter tasks that are not upcoming (due today or before)
    const filteredTasks = departmentData.allTasks.filter((task) => {
      const taskDate = parseTaskStartDate(task.originalTaskStartDate)
      return taskDate && taskDate <= today
    })

    const totalTasks = filteredTasks.length
    const completedTasks = filteredTasks.filter((task) => task.status === "completed").length
    const pendingTasks = totalTasks - completedTasks
    const overdueTasks = filteredTasks.filter((task) => task.status === "overdue").length

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
    }
  })()

  // Function to load more data when scrolling
  // Function to load more data when scrolling
  const loadMoreData = () => {
    if (!isLoadingMore && hasMoreData) {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      fetchDepartmentData(nextPage, true)
    }
  }


  // Add scroll event listener for infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      const tableContainer = document.querySelector('.task-table-container')
      if (!tableContainer) return

      const { scrollTop, scrollHeight, clientHeight } = tableContainer
      const isNearBottom = scrollHeight - scrollTop <= clientHeight * 1.2

      if (isNearBottom && !isLoadingMore && hasMoreData) {
        loadMoreData()
      }
    }

    const tableContainer = document.querySelector('.task-table-container')
    if (tableContainer) {
      tableContainer.addEventListener('scroll', handleScroll)
      return () => tableContainer.removeEventListener('scroll', handleScroll)
    }
  }, [isLoadingMore, hasMoreData])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <DashboardHeader
          dashboardType={dashboardType}
          setDashboardType={setDashboardType}
          dashboardStaffFilter={dashboardStaffFilter}
          setDashboardStaffFilter={setDashboardStaffFilter}
          availableStaff={availableStaff}
          userRole={userRole}
          username={username}
          departmentFilter={departmentFilter}
          setDepartmentFilter={setDepartmentFilter}
          availableDepartments={availableDepartments}
          isLoadingMore={isLoadingMore} // Add this line
        />

        <StatisticsCards
          totalTask={totalTask}
          completeTask={completeTask}
          pendingTask={pendingTask}
          overdueTask={overdueTask}
          dashboardType={dashboardType}
        />

        <TaskNavigationTabs
          taskView={taskView}
          setTaskView={setTaskView}
          dashboardType={dashboardType}
          dashboardStaffFilter={dashboardStaffFilter}
          departmentFilter={departmentFilter} // Add this line
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterStaff={filterStaff}
          setFilterStaff={setFilterStaff}
          departmentData={departmentData}
          getTasksByView={getTasksByView}
          getFrequencyColor={getFrequencyColor}
          isLoadingMore={isLoadingMore}
          hasMoreData={hasMoreData}
        />

        <CompletionRateCard departmentData={departmentData} />

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
            {/* <button
              onClick={() => setActiveTab("mis")}
              className={`flex-1 py-2 text-center rounded-md transition-colors ${
                activeTab === "mis" ? "bg-purple-600 text-white" : "text-purple-700 hover:bg-purple-200"
              }`}
            >
              MIS Report
            </button>
            <button
              onClick={() => setActiveTab("staff")}
              className={`flex-1 py-2 text-center rounded-md transition-colors ${
                activeTab === "staff" ? "bg-purple-600 text-white" : "text-purple-700 hover:bg-purple-200"
              }`}
            >
              Staff Performance
            </button> */}
          </div>

          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-purple-200 shadow-md p-4">
                  <h3 className="text-purple-700 font-medium mb-4">Tasks Overview</h3>
                  <TasksOverviewChart data={departmentData.barChartData} />
                </div>
                <div className="bg-white rounded-lg border border-purple-200 shadow-md p-4">
                  <h3 className="text-purple-700 font-medium mb-4">Completion Status</h3>
                  <TasksCompletionChart data={departmentData.pieChartData} />
                </div>
              </div>
              {/* Other overview components */}
              <div className="rounded-lg border border-purple-200 shadow-md bg-white">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-4">
                  <h3 className="text-purple-700 font-medium">Staff Task Summary</h3>
                  <p className="text-purple-600 text-sm">Overview of tasks assigned to each staff member</p>
                </div>
                <div className="p-4">
                  <StaffTasksTable
                    dashboardType={dashboardType}
                    dashboardStaffFilter={dashboardStaffFilter}
                    departmentFilter={departmentFilter} // Add this line
                    parseTaskStartDate={parseTaskStartDate}
                  />
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
                          <div className="text-sm font-medium text-green-700">Completion Rate</div>
                          <div className="text-2xl font-bold text-green-600">{filteredDateStats.completionRate}%</div>
                          <div className="text-xs text-green-600 mt-1">Filtered date range completion rate</div>
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