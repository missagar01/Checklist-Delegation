"use client"

import { Filter } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { fetchDashboardDataApi, getDashboardDataCount } from "../../../redux/api/dashboardApi"

export default function TaskNavigationTabs({
  dashboardType,
  taskView,
  setTaskView,
  searchQuery,
  setSearchQuery,
  filterStaff,
  setFilterStaff,
  departmentData,
  getFrequencyColor,
  dashboardStaffFilter
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [displayedTasks, setDisplayedTasks] = useState([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreData, setHasMoreData] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 50

  // Reset pagination when filters change - FIXED: Added dashboardStaffFilter dependency
  useEffect(() => {
    setCurrentPage(1)
    setDisplayedTasks([])
    setHasMoreData(true)
    setTotalCount(0)
  }, [taskView, dashboardType, dashboardStaffFilter]) // FIXED: Added dashboardStaffFilter here

  // Function to load tasks from server - FIXED: Updated to properly use dashboardStaffFilter
  const loadTasksFromServer = useCallback(async (page = 1, append = false) => {
    if (isLoadingMore) return;
    
    try {
      setIsLoadingMore(true)
      
      console.log('Loading tasks with filters:', { 
        dashboardType, 
        dashboardStaffFilter, 
        taskView, 
        page 
      }); // Debug log
      
      // FIXED: Use dashboardStaffFilter instead of filterStaff for server call
      const data = await fetchDashboardDataApi(
        dashboardType, 
        dashboardStaffFilter, // This ensures server-side filtering works correctly
        page, 
        itemsPerPage, 
        taskView
      )

      // Get total count for this view (only on first load)
      if (page === 1) {
        // FIXED: Use dashboardStaffFilter for count as well
        const count = await getDashboardDataCount(dashboardType, dashboardStaffFilter, taskView)
        setTotalCount(count)
      }

      if (!data || data.length === 0) {
        setHasMoreData(false)
        if (!append) {
          setDisplayedTasks([])
        }
        setIsLoadingMore(false)
        return
      }

      console.log('Raw data received:', data.length, 'records'); // Debug log

      // Process the data similar to your existing logic
      const processedTasks = data.map((task) => {
        const taskStartDate = parseTaskStartDate(task.task_start_date)
        const completionDate = task.submission_date ? parseTaskStartDate(task.submission_date) : null

        let status = "pending"
        if (completionDate || task.status === 'Yes') {
          status = "completed"
        } else if (taskStartDate && isDateInPast(taskStartDate)) {
          status = "overdue"
        }

        return {
          id: task.task_id,
          title: task.task_description,
          assignedTo: task.name || "Unassigned",
          taskStartDate: formatDateToDDMMYYYY(taskStartDate),
          originalTaskStartDate: task.task_start_date,
          status,
          frequency: task.frequency || "one-time",
          rating: task.color_code_for || 0,
        }
      })

      console.log('Processed tasks:', processedTasks.length, 'records'); // Debug log

      // Apply client-side search filter if needed
      let filteredTasks = processedTasks.filter((task) => {
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

      console.log('Final filtered tasks:', filteredTasks.length, 'records'); // Debug log

      // REMOVED: Client-side staff filtering since server already handles it via dashboardStaffFilter
      // The server-side filtering via dashboardStaffFilter is sufficient

      if (append) {
        setDisplayedTasks(prev => [...prev, ...filteredTasks])
      } else {
        setDisplayedTasks(filteredTasks)
      }

      // Check if we have more data
      setHasMoreData(data.length === itemsPerPage)
      
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [dashboardType, dashboardStaffFilter, taskView, searchQuery, isLoadingMore, itemsPerPage]) // FIXED: Complete dependency array

  // Helper functions (add these to your component)
  const parseTaskStartDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== "string") return null

    if (dateStr.includes("-") && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      const parsed = new Date(dateStr)
      return isNaN(parsed) ? null : parsed
    }

    if (dateStr.includes("/")) {
      const parts = dateStr.split(" ")
      const datePart = parts[0]
      const dateComponents = datePart.split("/")
      if (dateComponents.length !== 3) return null

      const [day, month, year] = dateComponents.map(Number)
      if (!day || !month || !year) return null

      const date = new Date(year, month - 1, day)
      if (parts.length > 1) {
        const timePart = parts[1]
        const timeComponents = timePart.split(":")
        if (timeComponents.length >= 2) {
          const [hours, minutes, seconds] = timeComponents.map(Number)
          date.setHours(hours || 0, minutes || 0, seconds || 0)
        }
      }
      return isNaN(date) ? null : date
    }

    const parsed = new Date(dateStr)
    return isNaN(parsed) ? null : parsed
  }

  const formatDateToDDMMYYYY = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date)) return ""
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const isDateInPast = (date) => {
    if (!date || !(date instanceof Date)) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    return checkDate < today
  }

  // FIXED: Initial load when component mounts or key dependencies change
  useEffect(() => {
    loadTasksFromServer(1, false)
  }, [taskView, dashboardType, dashboardStaffFilter]) // FIXED: Added dashboardStaffFilter

  // Load more when search changes (client-side filter)
  useEffect(() => {
    if (currentPage === 1) {
      loadTasksFromServer(1, false)
    }
  }, [searchQuery]) // REMOVED: filterStaff dependency since it's not used anymore

  // FIXED: Reset local staff filter when dashboardStaffFilter changes
  useEffect(() => {
    if (dashboardStaffFilter !== "all") {
      setFilterStaff("all") // Reset local filter since dashboard filter is active
    }
  }, [dashboardStaffFilter])

  // Function to load more data when scrolling
  const loadMoreData = () => {
    if (!isLoadingMore && hasMoreData) {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      loadTasksFromServer(nextPage, true)
    }
  }

  // Handle scroll event for infinite loading
  useEffect(() => {
    const handleScroll = () => {
      if (!hasMoreData || isLoadingMore) return
      
      const tableContainer = document.querySelector('.task-table-container')
      if (!tableContainer) return
      
      const { scrollTop, scrollHeight, clientHeight } = tableContainer
      const isNearBottom = scrollHeight - scrollTop <= clientHeight * 1.2
      
      if (isNearBottom) {
        loadMoreData()
      }
    }

    const tableContainer = document.querySelector('.task-table-container')
    if (tableContainer) {
      tableContainer.addEventListener('scroll', handleScroll)
      return () => tableContainer.removeEventListener('scroll', handleScroll)
    }
  }, [hasMoreData, isLoadingMore, currentPage])

  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="grid grid-cols-3">
        <button
          className={`py-3 text-center font-medium transition-colors ${
            taskView === "recent" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          onClick={() => setTaskView("recent")}
        >
          {dashboardType === "delegation" ? "Today Tasks" : "Recent Tasks"}
        </button>
        <button
          className={`py-3 text-center font-medium transition-colors ${
            taskView === "upcoming" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          onClick={() => setTaskView("upcoming")}
        >
          {dashboardType === "delegation" ? "Future Tasks" : "Upcoming Tasks"}
        </button>
        <button
          className={`py-3 text-center font-medium transition-colors ${
            taskView === "overdue" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
        </div>

        {/* Show total count */}
        {totalCount > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            Total {taskView} tasks: {totalCount} | Showing: {displayedTasks.length}
            {dashboardStaffFilter !== "all" && (
              <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                Staff: {dashboardStaffFilter}
              </span>
            )}
          </div>
        )}

        {displayedTasks.length === 0 && !isLoadingMore ? (
          <div className="text-center p-8 text-gray-500">
            <p>No tasks found for {taskView} view.</p>
            {dashboardStaffFilter !== "all" && (
              <p className="text-sm mt-2">Try selecting "All Staff Members" to see more results.</p>
            )}
          </div>
        ) : (
          <div 
            className="task-table-container overflow-x-auto" 
            style={{ maxHeight: "400px", overflowY: "auto" }}
          >
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
                {displayedTasks.map((task) => (
                  <tr key={`${task.id}-${task.taskStartDate}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{task.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.assignedTo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.taskStartDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFrequencyColor(task.frequency)}`}>
                        {task.frequency.charAt(0).toUpperCase() + task.frequency.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {isLoadingMore && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-500 mt-2">Loading more tasks...</p>
              </div>
            )}
            
            {!hasMoreData && displayedTasks.length > 0 && (
              <div className="text-center py-4 text-sm text-gray-500">
                No more tasks to load
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}