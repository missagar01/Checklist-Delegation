"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchStaffTasksDataApi, getStaffTasksCountApi, getTotalUsersCountApi } from "../../../redux/api/dashboardApi"

export default function StaffTasksTable({
  dashboardType,
  dashboardStaffFilter,
  departmentFilter,
  parseTaskStartDate
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [staffMembers, setStaffMembers] = useState([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreData, setHasMoreData] = useState(true)
  const [totalStaffCount, setTotalStaffCount] = useState(0)
  const [totalUsersCount, setTotalUsersCount] = useState(0)
  const [selectedMonthYear, setSelectedMonthYear] = useState("")
  const [monthYearOptions, setMonthYearOptions] = useState([])
  const itemsPerPage = 20

  // Generate month-year options (last 12 months + current month)
  const generateMonthYearOptions = useCallback(() => {
    const options = []
    const today = new Date()
    const currentMonth = today.getMonth() // 0-11
    const currentYear = today.getFullYear()
    
    // Add current month as default
    const currentMonthYear = `${today.toLocaleString('default', { month: 'long' })} ${currentYear}`
    
    // Generate options for last 12 months (including current)
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1)
      const monthName = date.toLocaleString('default', { month: 'long' })
      const year = date.getFullYear()
      const monthYear = `${monthName} ${year}`
      
      options.push({
        value: `${year}-${(date.getMonth() + 1).toString().padStart(2, '0')}`,
        label: monthYear,
        isCurrent: i === 0 // Current month
      })
    }
    
    setMonthYearOptions(options)
    
    // Set default selection to current month
    if (options.length > 0 && !selectedMonthYear) {
      const currentOption = options.find(opt => opt.isCurrent)
      if (currentOption) {
        setSelectedMonthYear(currentOption.value)
      }
    }
  }, [selectedMonthYear])

  useEffect(() => {
    generateMonthYearOptions()
  }, [generateMonthYearOptions])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
    setStaffMembers([])
    setHasMoreData(true)
    setTotalStaffCount(0)
  }, [dashboardType, dashboardStaffFilter, departmentFilter, selectedMonthYear])

  // Function to load staff data from server
const loadStaffData = useCallback(async (page = 1, append = false) => {
  if (isLoadingMore) return;

  try {
    setIsLoadingMore(true)

    // Fetch staff data with their task summaries
    const data = await fetchStaffTasksDataApi(
      dashboardType,
      dashboardStaffFilter,
      page,
      itemsPerPage,
      selectedMonthYear // Pass monthYear parameter
    )

      // Get total counts for both staff with tasks and total users
      if (page === 1) {
        const [staffCount, usersCount] = await Promise.all([
          getStaffTasksCountApi(dashboardType, dashboardStaffFilter),
          getTotalUsersCountApi()
        ]);
        setTotalStaffCount(staffCount)
        setTotalUsersCount(usersCount)
      }

      if (!data || data.length === 0) {
        setHasMoreData(false)
        if (!append) {
          setStaffMembers([])
        }
        setIsLoadingMore(false)
        return
      }

      // Filter data by selected month-year if specified
      let filteredData = data
      if (selectedMonthYear) {
        const [year, month] = selectedMonthYear.split('-').map(Number)
        filteredData = data.filter(staff => {
          // This is a placeholder - you'll need actual task dates for each staff
          // You might need to modify your API to accept month-year filter
          return true // Filter logic will go here
        })
      }

      if (append) {
        setStaffMembers(prev => [...prev, ...filteredData])
      } else {
        setStaffMembers(filteredData)
      }

      // Check if we have more data
      setHasMoreData(data.length === itemsPerPage)

    } catch (error) {
      console.error('Error loading staff data:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [dashboardType, dashboardStaffFilter, departmentFilter, isLoadingMore, selectedMonthYear])

  // Initial load when component mounts or dependencies change
  useEffect(() => {
    loadStaffData(1, false)
  }, [dashboardType, dashboardStaffFilter, departmentFilter, selectedMonthYear])

  // Function to load more data when scrolling
  const loadMoreData = () => {
    if (!isLoadingMore && hasMoreData) {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      loadStaffData(nextPage, true)
    }
  }

  // Handle scroll event for infinite loading
  useEffect(() => {
    const handleScroll = () => {
      if (!hasMoreData || isLoadingMore) return

      const tableContainer = document.querySelector('.staff-table-container')
      if (!tableContainer) return

      const { scrollTop, scrollHeight, clientHeight } = tableContainer
      const isNearBottom = scrollHeight - scrollTop <= clientHeight * 1.2

      if (isNearBottom) {
        loadMoreData()
      }
    }

    const tableContainer = document.querySelector('.staff-table-container')
    if (tableContainer) {
      tableContainer.addEventListener('scroll', handleScroll)
      return () => tableContainer.removeEventListener('scroll', handleScroll)
    }
  }, [hasMoreData, isLoadingMore, currentPage])

  // Format on-time score with color coding
  const renderOnTimeScore = (score) => {
    let bgColor = "bg-red-100"
    let textColor = "text-red-800"
    
    if (score >= 80) {
      bgColor = "bg-green-100"
      textColor = "text-green-800"
    } else if (score >= 0) {
      bgColor = "bg-yellow-100"
      textColor = "text-yellow-800"
    }
    
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
        {score}%
      </span>
    )
  }

  return (
    <div className="space-y-4">
      {/* Show total count and active filters */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
        <div className="flex flex-col space-y-2">
          {/* Month-Year Dropdown */}
          <div className="flex items-center space-x-2">
            <label htmlFor="monthYearFilter" className="text-sm font-medium text-gray-700">
              Filter by Month:
            </label>
            <select
              id="monthYearFilter"
              value={selectedMonthYear}
              onChange={(e) => setSelectedMonthYear(e.target.value)}
              className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Months</option>
              {monthYearOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} {option.isCurrent && "(Current)"}
                </option>
              ))}
            </select>
          </div>
          
          {totalStaffCount > 0 && (
            <div className="text-sm text-gray-600">
              Total users: {totalUsersCount} | Showing: {staffMembers.length}
            </div>
          )}
        </div>

        {/* Show active filters */}
        <div className="flex flex-wrap gap-2">
          {dashboardStaffFilter !== "all" && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
              Staff: {dashboardStaffFilter}
            </span>
          )}
          {departmentFilter !== "all" && dashboardType === "checklist" && (
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
              Dept Filter: {departmentFilter}
            </span>
          )}
          {selectedMonthYear && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
              Month: {monthYearOptions.find(opt => opt.value === selectedMonthYear)?.label || selectedMonthYear}
            </span>
          )}
        </div>
      </div>

      {staffMembers.length === 0 && !isLoadingMore ? (
        <div className="text-center p-8 text-gray-500">
          <p>No staff data found for the selected filters.</p>
          {selectedMonthYear && (
            <p className="text-sm mt-2">Try selecting "All Months" to see more results.</p>
          )}
          {dashboardStaffFilter !== "all" && (
            <p className="text-sm mt-2">Try selecting "All Staff Members" to see more results.</p>
          )}
        </div>
      ) : (
        <div
          className="staff-table-container rounded-md border border-gray-200 overflow-auto"
          style={{ maxHeight: "400px" }}
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seq No.
                </th>
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
                  Done on Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  On Time Score
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staffMembers.map((staff, index) => (
                <tr key={`${staff.name}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                      <div className="text-xs text-gray-500">{staff.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.totalTasks}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.completedTasks}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.pendingTasks}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {staff.doneOnTime || 0}
                    {staff.completedTasks > 0 && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({Math.round((staff.doneOnTime / staff.completedTasks) * 100)}%)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderOnTimeScore(staff.onTimeScore || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {isLoadingMore && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-500 mt-2">Loading more staff...</p>
            </div>
          )}

          {!hasMoreData && staffMembers.length > 0 && (
            <div className="text-center py-4 text-sm text-gray-500">
              All staff members loaded
            </div>
          )}
        </div>
      )}
    </div>
  )
}