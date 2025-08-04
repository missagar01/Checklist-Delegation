"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { CheckSquare, ClipboardList, Home, LogOut, Menu, Database, ChevronDown, ChevronRight, Zap, KeyRound, Video } from 'lucide-react'

export default function AdminLayout({ children, darkMode, toggleDarkMode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDataSubmenuOpen, setIsDataSubmenuOpen] = useState(false)
  const [username, setUsername] = useState("")
  const [userRole, setUserRole] = useState("")
  const [userDepartments, setUserDepartments] = useState("")
  const [pendingCounts, setPendingCounts] = useState({})

  // Check authentication on component mount
  useEffect(() => {
    const storedUsername = sessionStorage.getItem('username')
    const storedRole = sessionStorage.getItem('role')
    const storedDepartments = sessionStorage.getItem('userDepartments')
    
    if (!storedUsername) {
      // Redirect to login if not authenticated
      navigate("/login")
      return
    }
  
    setUsername(storedUsername)
    setUserRole(storedRole || "user")
    setUserDepartments(storedDepartments || "")
  }, [navigate])

  const parseGoogleSheetsDate = (dateStr) => {
    if (!dateStr) return '';
    
    // Convert to string first
    const dateString = String(dateStr).trim();
    
    // If it's already in DD/MM/YYYY format, return as is
    if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return dateString;
    }
    
    // Handle Google Sheets Date(year,month,day) format (legacy support)
    if (dateString.startsWith('Date(')) {
      const match = /Date\((\d+),(\d+),(\d+)\)/.exec(dateString);
      if (match) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10); // 0-indexed in Google's format
        const day = parseInt(match[3], 10);
        
        // Format as DD/MM/YYYY
        return `${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${year}`;
      }
    }
    
    // Handle ISO date format (2025-07-22T18:30:00.000Z) or other date formats
    if (dateString.includes('T') || dateString.includes('Z') || dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
      try {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return formatDateToDDMMYYYY(date);
        }
      } catch (e) {
        console.error("Error parsing ISO date:", e);
      }
    }
    
    // Try to parse as a general date and format
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return formatDateToDDMMYYYY(date);
      }
    } catch (e) {
      console.error("Error parsing date:", e);
    }
    
    // If all parsing fails, return the original string
    return dateString;
  }

  const parseDateFromDDMMYYYY = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return null
    const parts = dateStr.split('/')
    if (parts.length !== 3) return null
    return new Date(parts[2], parts[1] - 1, parts[0])
  }

  // Function to fetch pending tasks for a specific department
  const fetchPendingTasksForDepartment = async (sheetName) => {
    try {
      const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbygIvQKoBIOy0xmUddkJw_L2KUO8475ldRIt8Si1ZuBingQaROb5zD__cmt8_rZYz4AWA/exec";
      const response = await fetch(`${APPS_SCRIPT_URL}?sheet=${sheetName}`);
      
      if (!response.ok) return 0;
      
      const text = await response.text();
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) return 0;
      
      const jsonString = text.substring(jsonStart, jsonEnd + 1);
      let data;
      try {
        data = JSON.parse(jsonString);
      } catch (e) {
        console.error("Error parsing JSON:", e);
        return 0;
      }
      
      if (!data?.table?.rows) return 0;
      
      const currentUsername = sessionStorage.getItem('username');
      const currentUserRole = sessionStorage.getItem('role');
      
      // Get today's date at midnight for comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let pendingCount = 0;
      
      // Helper function to check if task should be shown based on frequency
      const shouldShowTask = (taskDate, frequency) => {
        const taskDateObj = parseDateFromDDMMYYYY(taskDate);
        if (!taskDateObj) return false;
        
        taskDateObj.setHours(0, 0, 0, 0);
        
        // Always show past due tasks
        if (taskDateObj < today) return true;
        
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        switch (frequency?.toLowerCase()) {
          case 'weekly':
            const currentDay = today.getDay();
            const currentWeekStart = new Date(today);
            currentWeekStart.setDate(today.getDate() - currentDay);
            
            const nextWeekEnd = new Date(currentWeekStart);
            nextWeekEnd.setDate(currentWeekStart.getDate() + 13);
            return taskDateObj >= currentWeekStart && taskDateObj <= nextWeekEnd;
          
          case 'monthly':
            const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
            return taskDateObj >= currentMonthStart && taskDateObj <= nextMonthEnd;
          
          case 'yearly':
            const currentYearStart = new Date(today.getFullYear(), 0, 1);
            const nextYearEnd = new Date(today.getFullYear() + 1, 11, 31);
            return taskDateObj >= currentYearStart && taskDateObj <= nextYearEnd;
          
          default:
            return taskDateObj.getTime() === today.getTime() || 
                   taskDateObj.getTime() === tomorrow.getTime();
        }
      };
  
      // Process rows to count pending tasks
      for (const row of data.table.rows) {
        if (!row?.c) continue;
        
        // Check if user has access to this task
        const assignedTo = (row.c[4]?.v || 'Unassigned').toString().trim();
        const isUserMatch = currentUserRole === 'admin' || 
                           assignedTo.toLowerCase() === currentUsername.toLowerCase();
        if (!isUserMatch) continue;
        
        // Check if task is marked as DONE in column Q (index 16)
        const columnQValue = row.c[16]?.v?.toString().trim();
        if (columnQValue === 'DONE') continue;
        
        // Get task date from column L (index 11) and frequency from column I (index 8)
        const columnLValue = row.c[11]?.v;
        const columnMValue = row.c[12]?.v;
        const frequency = row.c[8]?.v?.toString().trim() || 'daily';
        
        if (columnLValue && !columnMValue) {
          const taskDate = parseGoogleSheetsDate(columnLValue);
          if (!taskDate) continue;
          
          // Check if task should be shown based on frequency
          if (shouldShowTask(taskDate, frequency)) {
            pendingCount++;
          }
        }
      }
      
      return pendingCount;
    } catch (error) {
      console.error(`Error fetching pending tasks for ${sheetName}:`, error);
      return 0;
    }
  };

  // Function to fetch all pending counts
  const fetchAllPendingCounts = async () => {
    const departmentSheetMapping = {
      'main': 'ADMIN',
      'accounts': 'ACCOUNTS',
      'sales': 'IT',
      'service': 'MARKETING',
      'account': 'HR',
      'warehouse': 'CRM',
      'purchase': 'PURCHASE',
      'director': 'MIS',
      'managing-director': 'EA',
      'coo': 'WB',
      'jockey': 'DISPATCH',
      'inward': 'INWARD',
      'store': 'STORE',
      'labQualityControl': 'LAB AND QUALITY CONTROL',
      'security': 'SECURITY',
      'transport': 'TRANSPORT',
      'furnanceProduction': 'FURNANCE PRODUCTION',
      'stripMillProduction': 'STRIP MILL PRODUCTION',
      'pipeMillProduction': 'PIPE MILL PRODUCTION',
      'workshop': 'WORKSHOP',
      'smsMaintenance': 'SMS MAINTENANCE',
      'ccmMaintenance': 'CCM MAINTENANCE',
      'stripMillMaintenance': 'STRIP MILL MAINTENANCE',
      'pipeMillMaintenance': 'PIPE MILL MAINTENANCE',
      'smsElectrical': 'SMS ELECTRICAL',
      'ccmElectrical': 'CCM ELECTRICAL',
      'stripMillElectrical': 'STRIP MILL ELECTRICAL',
      'pipeMillElectrical': 'PIPE MILL ELECTRICAL',
      'housekeeping': 'HOUSEKEEPING',
      'ccm': 'CCM',
      'crusher': 'CRUSHER',
      'oneLineSecurity': 'ON LINE SECURITY',
      'project': 'PROJECT'
    };
    
    // Get accessible departments for the current user
    const accessibleDepts = getAccessibleDepartments();
    const accessibleDeptIds = accessibleDepts.map(dept => dept.id);
    
    // Only fetch counts for accessible departments
    const filteredDepartmentMapping = Object.fromEntries(
      Object.entries(departmentSheetMapping).filter(([categoryId]) => 
        accessibleDeptIds.includes(categoryId)
      )
    );
    
    // Fetch counts in parallel
    const countPromises = Object.entries(filteredDepartmentMapping).map(
      async ([categoryId, sheetName]) => {
        try {
          const count = await fetchPendingTasksForDepartment(sheetName);
          return { categoryId, count };
        } catch (error) {
          console.error(`Error fetching count for ${categoryId}:`, error);
          return { categoryId, count: 0 };
        }
      }
    );
    
    try {
      const results = await Promise.all(countPromises);
      const counts = {};
      results.forEach(({ categoryId, count }) => {
        counts[categoryId] = count;
      });
      setPendingCounts(counts);
    } catch (error) {
      console.error("Error fetching pending counts:", error);
      // Set all counts to 0 if there's an error
      const counts = {};
      Object.keys(filteredDepartmentMapping).forEach(categoryId => {
        counts[categoryId] = 0;
      });
      setPendingCounts(counts);
    }
  };

  // Fetch pending counts when component mounts and user is authenticated
  useEffect(() => {
    if (!username) return;
  
    // Initial fetch
    fetchAllPendingCounts();
    
    // Auto-refresh counts every 5 minutes
    const interval = setInterval(fetchAllPendingCounts, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [username, userDepartments]);

  // Handle logout
  const handleLogout = () => {
    sessionStorage.removeItem('username')
    sessionStorage.removeItem('role')
    sessionStorage.removeItem('department')
    sessionStorage.removeItem('userDepartments')
    sessionStorage.removeItem('isAdmin')
    navigate("/login")
  }

  // All data categories
  const allDataCategories = [
    { id: "main", name: "Admin", link: "/dashboard/data/main", department: "admin" },
    { id: "accounts", name: "Accounts", link: "/dashboard/data/accounts", department: "accounts" },
    { id: "sales", name: "It", link: "/dashboard/data/sales", department: "it" },
    { id: "service", name: "Marketing", link: "/dashboard/data/service", department: "marketing" },
    { id: "account", name: "Hr", link: "/dashboard/data/account", department: "hr" },
    { id: "warehouse", name: "Crm", link: "/dashboard/data/warehouse", department: "crm" },
    { id: "purchase", name: "Purchase", link: "/dashboard/data/purchase", department: "purchase" },
    { id: "director", name: "Mis", link: "/dashboard/data/director", department: "mis" },
    { id: "managing-director", name: "Ea", link: "/dashboard/data/managing-director", department: "ea" },
    { id: "coo", name: "Wb", link: "/dashboard/data/coo", department: "wb" },
    { id: "jockey", name: "Dispatch", link: "/dashboard/data/jockey", department: "dispatch" },
    { id: "inward", name: "Inward", link: "/dashboard/data/inward", department: "inward" },
    { id: "store", name: "Store", link: "/dashboard/data/store", department: "store" },
    { id: "labQualityControl", name: "Lab and Quality Control", link: "/dashboard/data/labQualityControl", department: "lab and quality control" },
    { id: "security", name: "Security", link: "/dashboard/data/security", department: "security" },
    { id: "transport", name: "Transport", link: "/dashboard/data/transport", department: "transport" },
    { id: "furnanceProduction", name: "Furnance Production", link: "/dashboard/data/furnanceProduction", department: "furnance production" },
    { id: "stripMillProduction", name: "Strip Mill Production", link: "/dashboard/data/stripMillProduction", department: "strip mill production" },
    { id: "pipeMillProduction", name: "Pipe Mill Production", link: "/dashboard/data/pipeMillProduction", department: "pipe mill production" },
    { id: "workshop", name: "Workshop", link: "/dashboard/data/workshop", department: "workshop" },
    { id: "smsMaintenance", name: "Sms Maintenance", link: "/dashboard/data/smsMaintenance", department: "sms maintenance" },
    { id: "ccmMaintenance", name: "Ccm Maintenance", link: "/dashboard/data/ccmMaintenance", department: "ccm maintenance" },
    { id: "stripMillMaintenance", name: "Strip Mill Maintenance", link: "/dashboard/data/stripMillMaintenance", department: "strip mill maintenance" },
    { id: "pipeMillMaintenance", name: "Pipe Mill Maintenance", link: "/dashboard/data/pipeMillMaintenance", department: "pipe mill maintenance" },
    { id: "smsElectrical", name: "Sms Electrical", link: "/dashboard/data/smsElectrical", department: "sms electrical" },
    { id: "ccmElectrical", name: "Ccm Electrical", link: "/dashboard/data/ccmElectrical", department: "ccm electrical" },
    { id: "stripMillElectrical", name: "Strip Mill Electrical", link: "/dashboard/data/stripMillElectrical", department: "strip mill electrical" },
    { id: "pipeMillElectrical", name: "Pipe Mill Electrical", link: "/dashboard/data/pipeMillElectrical", department: "pipe mill electrical" },
    { id: "housekeeping", name: "Housekeeping", link: "/dashboard/data/housekeeping", department: "housekeeping" },
    { id: "ccm", name: "Ccm", link: "/dashboard/data/ccm", department: "ccm" },
    { id: "crusher", name: "Crusher", link: "/dashboard/data/crusher", department: "crusher" },
    { id: "onLineSecurity", name: "On Line Security", link: "/dashboard/data/onLineSecurity", department: "on line security" },
    { id: "project", name: "Project", link: "/dashboard/data/project", department: "project" },
  ]

  // Update the routes array based on user role
  const routes = [
    {
      href: "/dashboard/admin",
      label: "Dashboard",
      icon: Database,
      active: location.pathname === "/dashboard/admin",
      showFor: ["admin", "user"] // Show for both roles
    },
    {
      href: "/dashboard/quick-task",
      label: "Quick Task",
      icon: Zap,
      active: location.pathname === "/dashboard/quick-task",
      showFor: ["admin", "user"] // Only show for admin
    },
    {
      href: "/dashboard/assign-task",
      label: "Assign Task",
      icon: CheckSquare,
      active: location.pathname === "/dashboard/assign-task",
      showFor: ["admin"] // Only show for admin
    },
    {
      href: "/dashboard/delegation",
      label: "Delegation",
      icon: ClipboardList,
      active: location.pathname === "/dashboard/delegation",
      showFor: ["admin", "user"] // Only show for admin
    },
    {
      href: "#",
      label: "Data",
      icon: Database,
      active: location.pathname.includes("/dashboard/data"),
      submenu: true,
      showFor: ["admin", "user"] // Show for both roles
    },
    {
      href: "/dashboard/license",
      label: "License",
      icon: KeyRound,
      active: location.pathname === "/dashboard/license",
      showFor: ["admin", "user"] // show both
    },

    {
      href: "/dashboard/traning-video",
      label: "Training Video",
      icon: Video,
      active: location.pathname === "/dashboard/traning-video",
      showFor: ["admin", "user"] //  show both
    },
  ]

  // Function to get accessible departments based on user permissions
  const getAccessibleDepartments = () => {
    const currentUserRole = sessionStorage.getItem('role') || 'user'
    const currentUserDepartments = sessionStorage.getItem('userDepartments') || ''
    
    console.log("Current user role:", currentUserRole)
    console.log("Current user departments:", currentUserDepartments)
    
    // If user is admin, return all departments
    if (currentUserRole === 'admin' || currentUserDepartments === 'all') {
      console.log("Admin user - returning all departments")
      return allDataCategories
    }
    
    // For non-admin users, filter based on their department access
    if (!currentUserDepartments || currentUserDepartments.trim() === '') {
      console.log("No departments specified - returning empty array")
      return []
    }
    
    // Split the departments by comma and normalize
    const allowedDepartments = currentUserDepartments
      .split(',')
      .map(dept => dept.trim().toLowerCase())
      .filter(dept => dept !== '')
    
    console.log("Allowed departments for user:", allowedDepartments)
    
    // Filter categories based on allowed departments
    const accessibleCategories = allDataCategories.filter(category => {
      const categoryDepartment = category.department.toLowerCase()
      const hasAccess = allowedDepartments.includes(categoryDepartment)
      console.log(`Checking ${category.name} (${categoryDepartment}): ${hasAccess}`)
      return hasAccess
    })
    
    console.log("Accessible categories:", accessibleCategories.map(cat => cat.name))
    return accessibleCategories
  }

  // Filter routes based on user role
  const getAccessibleRoutes = () => {
    const userRole = sessionStorage.getItem('role') || 'user'
    return routes.filter(route => 
      route.showFor.includes(userRole)
    )
  }

  // Check if the current path is a data category page
  const isDataPage = location.pathname.includes("/dashboard/data/")
  
  // If it's a data page, expand the submenu by default
  useEffect(() => {
    if (isDataPage && !isDataSubmenuOpen) {
      setIsDataSubmenuOpen(true)
    }
  }, [isDataPage, isDataSubmenuOpen])

  // Get accessible routes and departments
  const accessibleRoutes = getAccessibleRoutes()
  const accessibleDepartments = getAccessibleDepartments()

  // Notification Badge Component
  const NotificationBadge = ({ count }) => {
    if (!count || count === 0) return null;
    
    return (
      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[20px] h-5">
        {count > 99 ? '99+' : count}
      </span>
    );
  };

  return (
    <div className={`flex h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50`}>
      {/* Sidebar for desktop */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-blue-200 bg-white md:flex md:flex-col">
        <div className="flex h-14 items-center border-b border-blue-200 px-4 bg-gradient-to-r from-blue-100 to-purple-100">
          <Link to="/dashboard/admin" className="flex items-center gap-2 font-semibold text-blue-700">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            <span>Checklist & Delegation</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {accessibleRoutes.map((route) => (
              <li key={route.label}>
                {route.submenu ? (
                  <div>
                    <button
                      onClick={() => setIsDataSubmenuOpen(!isDataSubmenuOpen)}
                      className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        route.active
                          ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                          : "text-gray-700 hover:bg-blue-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <route.icon className={`h-4 w-4 ${route.active ? "text-blue-600" : ""}`} />
                        {route.label}
                      </div>
                      {isDataSubmenuOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    {isDataSubmenuOpen && (
                      <ul className="mt-1 ml-6 space-y-1 border-l border-blue-100 pl-2">
                        {accessibleDepartments.map((category) => (
                          <li key={category.id}>
                            <Link
                              to={category.link || `/dashboard/data/${category.id}`}
                              className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                                location.pathname === (category.link || `/dashboard/data/${category.id}`)
                                  ? "bg-blue-50 text-blue-700 font-medium"
                                  : "text-gray-600 hover:bg-blue-50 hover:text-blue-700 "
                              }`}
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <span>{category.name}</span>
                              <NotificationBadge count={pendingCounts[category.id]} />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    to={route.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      route.active
                        ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                        : "text-gray-700 hover:bg-blue-50"
                    }`}
                  >
                    <route.icon className={`h-4 w-4 ${route.active ? "text-blue-600" : ""}`} />
                    {route.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-blue-200 p-4 bg-gradient-to-r from-blue-50 to-purple-50 ">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">{username ? username.charAt(0).toUpperCase() : 'U'}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">
                  {username || "User"} {userRole === "admin" ? "(Admin)" : ""}
                </p>
                <p className="text-xs text-blue-600">
                  {username ? `${username.toLowerCase()}@example.com` : "user@example.com"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {toggleDarkMode && (
                <button 
                  onClick={toggleDarkMode} 
                  className="text-blue-700 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100"
                >
                  {darkMode ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                  <span className="sr-only">{darkMode ? "Light mode" : "Dark mode"}</span>
                </button>
              )}
              <button 
                onClick={handleLogout}
                className="text-blue-700 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Log out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden absolute left-4 top-3 z-50 text-blue-700 p-2 rounded-md hover:bg-blue-100"
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </button>

      {/* Mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/20" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
            <div className="flex h-14 items-center border-b border-blue-200 px-4 bg-gradient-to-r from-blue-100 to-purple-100">
              <Link
                to="/dashboard/admin"
                className="flex items-center gap-2 font-semibold text-blue-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <ClipboardList className="h-5 w-5 text-blue-600" />
                <span>Checklist & Delegation</span>
              </Link>
            </div>
            <nav className="flex-1 overflow-y-auto p-2 bg-white">
              <ul className="space-y-1">
                {accessibleRoutes.map((route) => (
                  <li key={route.label}>
                    {route.submenu ? (
                      <div>
                        <button
                          onClick={() => setIsDataSubmenuOpen(!isDataSubmenuOpen)}
                          className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                            route.active
                              ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                              : "text-gray-700 hover:bg-blue-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <route.icon className={`h-4 w-4 ${route.active ? "text-blue-600" : ""}`} />
                            {route.label}
                          </div>
                          {isDataSubmenuOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        {isDataSubmenuOpen && (
                          <ul className="mt-1 ml-6 space-y-1 border-l border-blue-100 pl-2">
                            {accessibleDepartments.map((category) => (
                              <li key={category.id}>
                                <Link
                                  to={category.link || `/dashboard/data/${category.id}`}
                                  className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                                    location.pathname === (category.link || `/dashboard/data/${category.id}`)
                                      ? "bg-blue-50 text-blue-700 font-medium"
                                      : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                                  }`}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                >
                                  <span>{category.name}</span>
                                  <NotificationBadge count={pendingCounts[category.id]} />
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <Link
                        to={route.href}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          route.active
                            ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                            : "text-gray-700 hover:bg-blue-50"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <route.icon className={`h-4 w-4 ${route.active ? "text-blue-600" : ""}`} />
                        {route.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
            <div className="border-t border-blue-200 p-4 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">{username ? username.charAt(0).toUpperCase() : 'U'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      {username || "User"} {userRole === "admin" ? "(Admin)" : ""}
                    </p>
                    <p className="text-xs text-blue-600">
                      {username ? `${username.toLowerCase()}@example.com` : "user@example.com"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {toggleDarkMode && (
                    <button 
                      onClick={toggleDarkMode} 
                      className="text-blue-700 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100"
                    >
                      {darkMode ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      )}
                      <span className="sr-only">{darkMode ? "Light mode" : "Dark mode"}</span>
                    </button>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="text-blue-700 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100 "
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="sr-only">Log out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-blue-200 bg-white px-4 md:px-6">
          <div className="flex md:hidden w-8"></div>
          <h1 className="text-lg font-semibold text-blue-700">Checklist & Delegation</h1>
          <div className="w-8"></div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-br from-blue-50 to-purple-50">
          {children}
          <div className="fixed md:left-64 left-0 right-0 bottom-0 py-1 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center text-sm shadow-md z-10">
          <a
    href="https://www.botivate.in/" // Replace with actual URL
    target="_blank"
    rel="noopener noreferrer"
    className="hover:underline"
  >
    Powered by-<span className="font-semibold">Botivate</span>
  </a>
    </div>
        </main>
      </div>
      
    </div>
  )
}