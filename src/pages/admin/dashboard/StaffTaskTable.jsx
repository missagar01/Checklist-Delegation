"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchStaffTasksDataApi, getStaffTasksCountApi, getTotalUsersCountApi } from "../../../redux/api/dashboardApi"

export default function StaffTasksTable({
  dashboardType,
  dashboardStaffFilter,
  departmentFilter, // Add this prop
  parseTaskStartDate
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [staffMembers, setStaffMembers] = useState([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreData, setHasMoreData] = useState(true)
  const [totalStaffCount, setTotalStaffCount] = useState(0) // Count from staff tasks
  const [totalUsersCount, setTotalUsersCount] = useState(0) // Count from users table
  const itemsPerPage = 20

  // Reset pagination when filters change - Add departmentFilter to dependencies
  useEffect(() => {
    setCurrentPage(1)
    setStaffMembers([])
    setHasMoreData(true)
    setTotalStaffCount(0)
  }, [dashboardType, dashboardStaffFilter, departmentFilter])

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
        itemsPerPage
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
  }, [dashboardType, dashboardStaffFilter, departmentFilter, isLoadingMore])

  // Initial load when component mounts or dependencies change
  useEffect(() => {
    loadStaffData(1, false)
  }, [dashboardType, dashboardStaffFilter, departmentFilter])

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

  return (
    <div className="space-y-4">
      {/* Show total count and active filters */}
      <div className="flex justify-between items-center">
        {totalStaffCount > 0 && (
          <div className="text-sm text-gray-600">
            Total users: {totalUsersCount} | Showing: {staffMembers.length}
          </div>
        )}

        {/* Show active filters */}
        <div className="flex gap-2">
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
        </div>
      </div>

      {staffMembers.length === 0 && !isLoadingMore ? (
        <div className="text-center p-8 text-gray-500">
          <p>No staff data found.</p>
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
                  Progress
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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