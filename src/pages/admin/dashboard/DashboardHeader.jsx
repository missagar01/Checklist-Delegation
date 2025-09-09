"use client"

export default function DashboardHeader({
  dashboardType,
  setDashboardType,
  dashboardStaffFilter,
  setDashboardStaffFilter,
  availableStaff,
  userRole,
  username,
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <h1 className="text-2xl font-bold tracking-tight text-purple-500">Dashboard</h1>
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
  )
}
