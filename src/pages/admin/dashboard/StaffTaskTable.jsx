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
  const [selectedMonth, setSelectedMonth] = useState('')
  const [availableMonths, setAvailableMonths] = useState([])
  const itemsPerPage = 20

  // Generate available months (last 12 months)
  useEffect(() => {
    const months = [];
    const currentDate = new Date();

    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      const value = `${year}-${month.toString().padStart(2, '0')}`;

      months.push({
        value,
        label: monthName
      });
    }

    setAvailableMonths(months);
    const currentMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
    setSelectedMonth(currentMonth);
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
    setStaffMembers([])
    setHasMoreData(true)
    setTotalStaffCount(0)
  }, [dashboardType, dashboardStaffFilter, departmentFilter, selectedMonth])

  // Function to load staff data from server
  const loadStaffData = useCallback(async (page = 1, append = false) => {
    if (isLoadingMore) return;

    try {
      setIsLoadingMore(true)

      // Fetch staff data with their task summaries
      const data = await fetchStaffTasksDataApi(
        dashboardType,
        dashboardStaffFilter,
        departmentFilter,
        page,
        itemsPerPage,
        selectedMonth
      )

      // Get total counts for both staff with tasks and total users
      if (page === 1) {
        const [staffCount, usersCount] = await Promise.all([
          getStaffTasksCountApi(dashboardType, dashboardStaffFilter, departmentFilter, selectedMonth),
          getTotalUsersCountApi(departmentFilter) // Pass department filter to users count API
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

      if (append) {
        setStaffMembers(prev => [...prev, ...data])
      } else {
        setStaffMembers(data)
      }

      // Check if we have more data
      setHasMoreData(data.length === itemsPerPage)

    } catch (error) {
      console.error('Error loading staff data:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [dashboardType, dashboardStaffFilter, departmentFilter, selectedMonth, isLoadingMore])

  // Initial load when component mounts or dependencies change
  useEffect(() => {
    if (selectedMonth) {
      loadStaffData(1, false)
    }
  }, [dashboardType, dashboardStaffFilter, departmentFilter, selectedMonth])

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

  // Format month for display
  const getDisplayMonth = () => {
    if (!selectedMonth) return '';
    const [year, month] = selectedMonth.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  return (
    <div className="space-y-4">
      {/* Month Selection and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Month Selection */}
        <div className="flex items-center gap-3">
          <label htmlFor="month-select" className="text-sm font-medium text-gray-700">
            Select Month:
          </label>
          <select
            id="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            {availableMonths.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>

        {/* Show total count and active filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {totalStaffCount > 0 && (
            <div className="text-sm text-gray-600">
              Total users{departmentFilter !== "all" ? ` in ${departmentFilter}` : ''}: {totalUsersCount} | Showing: {staffMembers.length} | Month: {getDisplayMonth()}
            </div>
          )}

          {/* Show active filters */}
          <div className="flex gap-2 flex-wrap">
            {dashboardStaffFilter !== "all" && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                Staff: {dashboardStaffFilter}
              </span>
            )}
            {departmentFilter !== "all" && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                Dept: {departmentFilter}
              </span>
            )}
          </div>
        </div>
      </div>

      {staffMembers.length === 0 && !isLoadingMore ? (
        <div className="text-center p-8 text-gray-500">
          <p>No staff data found for {getDisplayMonth()}.</p>
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
                  Department
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Tasks
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed Tasks
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Done On Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ontime Score
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staffMembers.map((staff, index) => (
                <tr key={`${staff.name}-${index}-${selectedMonth}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.total_tasks}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.total_completed_tasks}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.total_done_on_time}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={staff.ontime_score >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                      {staff.ontime_score}%
                    </span>
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
              All staff members loaded for {getDisplayMonth()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}