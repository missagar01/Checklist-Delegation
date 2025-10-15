import { ListTodo, CheckCircle2, Clock, AlertTriangle, BarChart3, XCircle } from "lucide-react"

export default function StatisticsCards({ dashboardType, totalTask, completeTask, pendingTask, overdueTask }) {
  // Calculate completion rate
  const completionRate = totalTask > 0 ? Math.round((completeTask / totalTask) * 100) : 0;

  // Calculate not done tasks (total - completed)
  const notDoneTask = totalTask - completeTask - pendingTask - overdueTask;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left side - Statistics Cards */}
      <div className="lg:w-1/2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Total Tasks */}
          <div className="rounded-lg border border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-all bg-white">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded-tr-lg p-4">
              <h3 className="text-sm font-medium text-blue-700">Total Tasks</h3>
              <ListTodo className="h-4 w-4 text-blue-500" />
            </div>
            <div className="p-4">
              <div className="text-2xl sm:text-3xl font-bold text-blue-700">{totalTask}</div>
              <p className="text-xs text-blue-600">
                {dashboardType === "delegation"
                  ? "All tasks"
                  : "Total tasks in checklist"}
              </p>
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="rounded-lg border border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-all bg-white">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-green-50 to-green-100 rounded-tr-lg p-4">
              <h3 className="text-sm font-medium text-green-700">
                {dashboardType === "delegation" ? "Completed Once" : "Completed Tasks"}
              </h3>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <div className="p-4">
              <div className="text-2xl sm:text-3xl font-bold text-green-700">{completeTask}</div>
              <p className="text-xs text-green-600">
                {dashboardType === "delegation" ? "Tasks completed once" : "Total completed"}
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
              <div className="text-2xl sm:text-3xl font-bold text-amber-700">{pendingTask}</div>
              <p className="text-xs text-amber-600">
                {dashboardType === "delegation" ? "Tasks completed twice" : "Including today"}
              </p>
            </div>
          </div>

          {/* Not Done Tasks - New Box */}
          <div className="rounded-lg border border-l-4 border-l-gray-500 shadow-md hover:shadow-lg transition-all bg-white">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-tr-lg p-4">
              <h3 className="text-sm font-medium text-gray-700">Not Done</h3>
              <XCircle className="h-4 w-4 text-gray-500" />
            </div>
            <div className="p-4">
              <div className="text-2xl sm:text-3xl font-bold text-gray-700">{notDoneTask}</div>
              <p className="text-xs text-gray-600">
                {dashboardType === "delegation" ? "Tasks not completed" : "Absent Day's tasks"}
              </p>
            </div>
          </div>

          {/* Overdue Tasks */}
          <div className="rounded-lg border border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-all bg-white sm:col-span-2 lg:col-span-1">
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
              <div className="text-2xl sm:text-3xl font-bold text-red-700">{overdueTask}</div>
              <p className="text-xs text-red-600">
                {dashboardType === "delegation" ? "Tasks completed 3+ times" : "Past due"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Circular Progress Graph */}
      <div className="lg:w-1/2">
        <div className="rounded-lg border border-l-4 border-l-indigo-500 shadow-md hover:shadow-lg transition-all bg-white h-70">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-tr-lg p-4">
            <h3 className="text-sm font-medium text-indigo-700">Progress Percent</h3>
            <BarChart3 className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="">
            <div className="flex flex-col items-center justify-center">
              {/* Circular Progress Container */}
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 mb-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  {/* Progress circle - Changed to single green color for completed tasks */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#10b981"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${completionRate * 2.513} 251.3`}
                  />
                </svg>

                {/* Percentage text in center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold text-indigo-700">
                      {completionRate}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Completed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}