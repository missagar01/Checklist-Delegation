import { ListTodo, CheckCircle2, Clock, AlertTriangle } from "lucide-react"

export default function StatisticsCards({ dashboardType, totalTask, completeTask, pendingTask, overdueTask }) {
  return (
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
              : "Total tasks in checklist (up to today)"}
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
          <div className="text-3xl font-bold text-green-700">{completeTask}</div>
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
          <div className="text-3xl font-bold text-amber-700">{pendingTask}</div>
          <p className="text-xs text-amber-600">
            {dashboardType === "delegation" ? "Tasks completed twice" : "Including today"}
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
          <div className="text-3xl font-bold text-red-700">{overdueTask}</div>
          <p className="text-xs text-red-600">
            {dashboardType === "delegation" ? "Tasks completed 3+ times" : "Past due (excluding today)"}
          </p>
        </div>
      </div>
    </div>
  )
}
