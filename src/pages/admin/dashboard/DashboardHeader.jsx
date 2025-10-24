"use client"

import { useState, useEffect } from "react"
import { getTotalUsersCountApi } from "../../../redux/api/dashboardApi"

export default function DashboardHeader({
  dashboardType,
  setDashboardType,
  dashboardStaffFilter,
  setDashboardStaffFilter,
  availableStaff,
  userRole,
  username,
  departmentFilter,
  setDepartmentFilter,
  availableDepartments,
  isLoadingMore
}) {
  const [totalUsersCount, setTotalUsersCount] = useState(0)

  // Fetch total users count - same method as StaffTasksTable
  useEffect(() => {
    const fetchTotalUsers = async () => {
      try {
        const count = await getTotalUsersCountApi()
        setTotalUsersCount(count)
      } catch (error) {
        console.error('Error fetching total users count:', error)
      }
    }

    fetchTotalUsers()
  }, [])

  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-purple-500">Dashboard</h1>
        {userRole === "admin" && (
          <div className="flex items-center gap-2 ml-auto mr-5">
            <div className="text-sm text-gray-600">Total Users</div>
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {totalUsersCount}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Dashboard Type Selection */}
        <select
          value={dashboardType}
          onChange={(e) => setDashboardType(e.target.value)}
          className="w-[110px] sm:w-[140px] rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          <option value="checklist">Checklist</option>
          <option value="delegation">Delegation</option>
        </select>

        {/* Department Filter - Only show for checklist */}
        {dashboardType === "checklist" && userRole === "admin" && (
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-[110px] sm:w-[160px] rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="all">All Departments</option>
            {availableDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        )}

        {/* Dashboard Staff Filter */}
        {userRole === "admin" ? (
          <select
            value={dashboardStaffFilter}
            onChange={(e) => setDashboardStaffFilter(e.target.value)}
            className="w-[140px] sm:w-[180px] rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
  )
}