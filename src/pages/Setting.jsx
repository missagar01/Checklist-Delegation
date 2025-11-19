import React, { useEffect, useState } from 'react';
import { Plus, User, Building, X, Save, Edit, Trash2, Settings, Search, ChevronDown, Calendar, RefreshCw } from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import { useDispatch, useSelector } from 'react-redux';
import { createDepartment, createUser, deleteUser, departmentOnlyDetails, givenByDetails, departmentDetails, updateDepartment, updateUser, userDetails } from '../redux/slice/settingSlice';
import supabase from '../SupabaseClient';

const Setting = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentDeptId, setCurrentDeptId] = useState(null);
  const [usernameFilter, setUsernameFilter] = useState('');
  const [usernameDropdownOpen, setUsernameDropdownOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [activeDeptSubTab, setActiveDeptSubTab] = useState('departments');
  // Leave Management State
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [remark, setRemark] = useState('');
  const [leaveUsernameFilter, setLeaveUsernameFilter] = useState('');
  
  const { userData, department, departmentsOnly, givenBy, loading, error } = useSelector((state) => state.setting);
  const dispatch = useDispatch();
  // Add this function to fetch device logs and update user status
// Add this function to fetch device logs from both APIs and update user status
// Fix the fetchDeviceLogsAndUpdateStatus function
// const fetchDeviceLogsAndUpdateStatus = async () => {
//   try {
//     setIsRefreshing(true);
//     const today = new Date().toISOString().split('T')[0];
    
//     const IN_API_URL = `http://139.167.179.193:90/api/v2/WebAPI/GetDeviceLogs?APIKey=205511032522&SerialNumber=E03C1CB34D83AA02&FromDate=${today}&ToDate=${today}`;
//     const OUT_API_URL = `http://139.167.179.193:90/api/v2/WebAPI/GetDeviceLogs?APIKey=205511032522&SerialNumber=E03C1CB36042AA02&FromDate=${today}&ToDate=${today}`;
    
//     const [inResponse, outResponse] = await Promise.all([
//       fetch(IN_API_URL),
//       fetch(OUT_API_URL)
//     ]);
    
//     const inLogs = await inResponse.json();
//     const outLogs = await outResponse.json();
    
//     const allLogs = [...inLogs, ...outLogs];
    
//     // Sort logs by date
//     allLogs.sort((a, b) => new Date(a.LogDate) - new Date(b.LogDate));
    
//     // Process logs to calculate status based on 8-hour rule
//     const employeeStatus = {};
    
//     allLogs.forEach(log => {
//       const employeeCode = log.EmployeeCode;
//       const punchDirection = log.PunchDirection?.toLowerCase();
//       const logDate = new Date(log.LogDate);
      
//       if (!employeeStatus[employeeCode]) {
//         employeeStatus[employeeCode] = {
//           lastInTime: null,
//           lastOutTime: null,
//           status: 'inactive',
//           logDate: log.LogDate,
//           serialNumber: log.SerialNumber
//         };
//       }
      
//       if (punchDirection === 'in') {
//         employeeStatus[employeeCode].lastInTime = logDate;
//         employeeStatus[employeeCode].status = 'active';
//         employeeStatus[employeeCode].logDate = log.LogDate;
//         employeeStatus[employeeCode].serialNumber = log.SerialNumber;
//       } else if (punchDirection === 'out') {
//         employeeStatus[employeeCode].lastOutTime = logDate;
//         employeeStatus[employeeCode].logDate = log.LogDate;
//         employeeStatus[employeeCode].serialNumber = log.SerialNumber;
        
//         // Check if there was a previous "in" punch
//         if (employeeStatus[employeeCode].lastInTime) {
//           const timeDiffMs = logDate - employeeStatus[employeeCode].lastInTime;
//           const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
          
//           // Only mark as inactive if time difference is greater than 8 hours
//           if (timeDiffHours > 8) {
//             employeeStatus[employeeCode].status = 'inactive';
//           } else {
//             // If less than 8 hours, keep as active
//             employeeStatus[employeeCode].status = 'active';
//           }
//         } else {
//           // If no "in" punch found before "out", mark as inactive
//           employeeStatus[employeeCode].status = 'inactive';
//         }
//       }
//     });
    
//     // Update users in database
//     const updatePromises = Object.entries(employeeStatus).map(async ([employeeCode, statusInfo]) => {
//       try {
//         const { data: users, error: userError } = await supabase
//           .from('users')
//           .select('*')
//           .eq('employee_id', employeeCode);
        
//         if (userError) {
//           console.error('Error finding user:', userError);
//           return;
//         }
          
//         if (users && users.length > 0) {
//           const user = users[0];
          
//           // Only update if status changed
//           if (user.status !== statusInfo.status) {
//             const updateData = {
//               status: statusInfo.status
//             };
            
//             const { data, error } = await supabase
//               .from('users')
//               .update(updateData)
//               .eq('id', user.id);
            
//             if (error) {
//               console.error(`Error updating user ${user.user_name}:`, error);
//             }
//           }
//         }
//       } catch (error) {
//         console.error(`Error processing employee ${employeeCode}:`, error);
//       }
//     });
    
//     await Promise.all(updatePromises);
//     dispatch(userDetails());
    
//   } catch (error) {
//     console.error('Error fetching device logs:', error);
//   } finally {
//     setIsRefreshing(false);
//   }
// };



// Simplified status logic: IN = active, OUT = inactive (today's date only)
// const fetchDeviceLogsAndUpdateStatus = async () => {
//   try {
//     setIsRefreshing(true);
//     const today = new Date().toISOString().split('T')[0];
    
//     const IN_API_URL = `http://139.167.179.193:90/api/v2/WebAPI/GetDeviceLogs?APIKey=205511032522&SerialNumber=E03C1CB34D83AA02&FromDate=${today}&ToDate=${today}`;
//     const OUT_API_URL = `http://139.167.179.193:90/api/v2/WebAPI/GetDeviceLogs?APIKey=205511032522&SerialNumber=E03C1CB36042AA02&FromDate=${today}&ToDate=${today}`;
    
//     const [inResponse, outResponse] = await Promise.all([
//       fetch(IN_API_URL),
//       fetch(OUT_API_URL)
//     ]);
    
//     const inLogs = await inResponse.json();
//     const outLogs = await outResponse.json();
    
//     const allLogs = [...inLogs, ...outLogs];
    
//     // Sort logs by date (latest first)
//     allLogs.sort((a, b) => new Date(b.LogDate) - new Date(a.LogDate));
    
//     // Simple logic: Check latest punch for each employee
//     const employeeStatus = {};
    
//     allLogs.forEach(log => {
//       const employeeCode = log.EmployeeCode;
//       const punchDirection = log.PunchDirection?.toLowerCase();
      
//       // Only process if this employee hasn't been processed yet (we want the latest punch)
//       if (!employeeStatus[employeeCode]) {
//         // Simple rule: IN = active, OUT = inactive
//         employeeStatus[employeeCode] = {
//           status: punchDirection === 'in' ? 'active' : 'inactive',
//           logDate: log.LogDate,
//           serialNumber: log.SerialNumber
//         };
//       }
//     });
    
//     // Update users in database
//     const updatePromises = Object.entries(employeeStatus).map(async ([employeeCode, statusInfo]) => {
//       try {
//         const { data: users, error: userError } = await supabase
//           .from('users')
//           .select('*')
//           .eq('employee_id', employeeCode);
        
//         if (userError) {
//           console.error('Error finding user:', userError);
//           return;
//         }
          
//         if (users && users.length > 0) {
//           const user = users[0];
          
//           // Only update if status changed
//           if (user.status !== statusInfo.status) {
//             const updateData = {
//               status: statusInfo.status
//             };
            
//             const { data, error } = await supabase
//               .from('users')
//               .update(updateData)
//               .eq('id', user.id);
            
//             if (error) {
//               console.error(`Error updating user ${user.user_name}:`, error);
//             }
//           }
//         }
//       } catch (error) {
//         console.error(`Error processing employee ${employeeCode}:`, error);
//       }
//     });
    
//     await Promise.all(updatePromises);
//     dispatch(userDetails());
    
//   } catch (error) {
//     console.error('Error fetching device logs:', error);
//   } finally {
//     setIsRefreshing(false);
//   }
// };



const fetchDeviceLogsAndUpdateStatus = async () => {
  try {
    setIsRefreshing(true);
    const response = await fetch('https://checklist-backend-yan3.onrender.com/api/device-sync');
    const data = await response.json();
    console.log(data.message);
    dispatch(userDetails());
  } catch (error) {
    console.error('Error syncing device logs:', error);
  } finally {
    setIsRefreshing(false);
  }
};

  // Add real-time subscription
  useEffect(() => {
    // Subscribe to users table changes
    const subscription = supabase
      .channel('users-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        (payload) => {
          // console.log('Real-time update received:', payload);
          // Refresh user data when any change occurs
          dispatch(userDetails());
        }
      )
      .subscribe();

    // Set up interval to check device logs every 30 seconds
    const intervalId = setInterval(fetchDeviceLogsAndUpdateStatus, 30000);

    // Initial fetch of device logs
    fetchDeviceLogsAndUpdateStatus();

    return () => {
      subscription.unsubscribe();
      clearInterval(intervalId);
    };
  }, [dispatch]);

  // Add this function to debug a specific user
const debugUserStatus = async () => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_name', 'Hem Kumar Jagat');
    
    if (error) {
      console.error('Error fetching user:', error);
      return;
    }
    
    if (users && users.length > 0) {
      const user = users[0];
      // console.log('🔍 DEBUG - Hem Kumar Jagat:', {
      //   id: user.id,
      //   username: user.user_name,
      //   employee_id: user.employee_id,
      //   current_status: user.status,
      //   last_punch_time: user.last_punch_time,
      //   last_punch_device: user.last_punch_device
      // });
    } else {
      console.log('User "Hem Kumar Jagat" not found');
    }
  } catch (error) {
    console.error('Error in debug:', error);
  }
};

// Call this to check the current status
// debugUserStatus();

  // Add manual refresh button handler
  const handleManualRefresh = () => {
    fetchDeviceLogsAndUpdateStatus();
  };

  // Your existing functions remain the same...
  const handleLeaveUsernameFilter = (username) => {
    setLeaveUsernameFilter(username);
  };

  const clearLeaveUsernameFilter = () => {
    setLeaveUsernameFilter('');
  };

  const handleUsernameFilterSelect = (username) => {
    setUsernameFilter(username);
    setUsernameDropdownOpen(false);
  };

  const clearUsernameFilter = () => {
    setUsernameFilter('');
    setUsernameDropdownOpen(false);
  };

  const toggleUsernameDropdown = () => {
    setUsernameDropdownOpen(!usernameDropdownOpen);
  };


  const handleAddButtonClick = () => {
    if (activeTab === 'users') {
      resetUserForm();
      setShowUserModal(true);
    } else if (activeTab === 'departments') {
      resetDeptForm();
      setShowDeptModal(true);
    }
    // No action for leave tab
  };



  const handleUserSelection = (userId, isSelected) => {
    if (isSelected) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(userData.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

const handleSubmitLeave = async () => {
  if (selectedUsers.length === 0 || !leaveStartDate || !leaveEndDate) {
    alert('Please select at least one user and provide both start and end dates');
    return;
  }

  // Validate date range
  const startDate = new Date(leaveStartDate);
  const endDate = new Date(leaveEndDate);
  
  if (startDate > endDate) {
    alert('End date cannot be before start date');
    return;
  }

  try {
    // Update each selected user with leave information
    const updatePromises = selectedUsers.map(userId =>
      dispatch(updateUser({
        id: userId,
        updatedUser: {
          leave_date: leaveStartDate, // You can store start date or both dates
          leave_end_date: leaveEndDate, // Add this field to your user table if needed
          remark: remark
        }
      })).unwrap()
    );

    await Promise.all(updatePromises);

    // Delete matching checklist tasks for the date range
    const deleteChecklistPromises = selectedUsers.map(async (userId) => {
      const user = userData.find(u => u.id === userId);
      if (user && user.user_name) {
        try {
          // Format dates for Supabase query
          const formattedStartDate = `${leaveStartDate}T00:00:00`;
          const formattedEndDate = `${leaveEndDate}T23:59:59`;

          // console.log(`Deleting tasks for ${user.user_name} from ${leaveStartDate} to ${leaveEndDate}`);

          // Delete checklist tasks where name matches and date falls within the range
          const { error } = await supabase
            .from('checklist')
            .delete()
            .eq('name', user.user_name)
            .gte('task_start_date', formattedStartDate)
            .lte('task_start_date', formattedEndDate);

          if (error) {
            console.error('Error deleting checklist tasks:', error);
          } else {
            console.log(`Deleted checklist tasks for ${user.user_name} from ${leaveStartDate} to ${leaveEndDate}`);
          }
        } catch (error) {
          console.error('Error in checklist deletion:', error);
        }
      }
    });

    await Promise.all(deleteChecklistPromises);

    // Reset form
    setSelectedUsers([]);
    setLeaveStartDate('');
    setLeaveEndDate('');
    setRemark('');

    // Refresh data
    setTimeout(() => window.location.reload(), 1000);
    alert('Leave information submitted successfully and matching tasks deleted');
  } catch (error) {
    console.error('Error submitting leave information:', error);
    alert('Error submitting leave information');
  }
};

  // Add to your existing handleTabChange function
  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'users') {
      dispatch(userDetails());
      dispatch(departmentDetails()); // Ensure departments are fetched
    } else if (tab === 'departments') {
      dispatch(departmentDetails());
    }
  };

  // Add to your handleAddButtonClick function





  // Sample data
  // const [users, setUsers] = useState([
  //   {
  //     id: '1',
  //     username: 'john_doe',
  //     email: 'john@example.com',
  //     password: '********',
  //     department: 'IT',
  //     givenBy: 'admin',
  //     phone: '1234567890',
  //     role: 'user',
  //     status: 'active'
  //   },
  //   {
  //     id: '2',
  //     username: 'jane_smith',
  //     email: 'jane@example.com',
  //     password: '********',
  //     department: 'HR',
  //     givenBy: 'admin',
  //     phone: '0987654321',
  //     role: 'admin',
  //     status: 'active'
  //   }
  // ]);

  // const [departments, setDepartments] = useState([
  //   { id: '1', name: 'IT', givenBy: 'super_admin' },
  //   { id: '2', name: 'HR', givenBy: 'super_admin' },
  //   { id: '3', name: 'Finance', givenBy: 'admin' }
  // ]);

  // Form states
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    employee_id: '',
    role: 'user',
    status: 'active'
  });

  const [deptForm, setDeptForm] = useState({
    name: '',
    givenBy: ''
  });

  useEffect(() => {
    dispatch(userDetails());
    dispatch(departmentDetails()); // Fetch departments on mount
  }, [dispatch])

  // In your handleAddUser function:
  // Modified handleAddUser
const handleAddUser = async (e) => {
  e.preventDefault();
  const newUser = {
    ...userForm,
    user_access: userForm.department,
  };

  try {
    await dispatch(createUser(newUser)).unwrap();
    resetUserForm();
    setShowUserModal(false);
    setTimeout(() => window.location.reload(), 1000);
  } catch (error) {
    console.error('Error adding user:', error);
  }
};

  // Modified handleUpdateUser
const handleUpdateUser = async (e) => {
  e.preventDefault();
  const updatedUser = {
    user_name: userForm.username,
    password: userForm.password,
    email_id: userForm.email,
    number: userForm.phone,
    employee_id: userForm.employee_id, // Add this line
    role: userForm.role,
    status: userForm.status,
    user_access: userForm.department
  };

  try {
    await dispatch(updateUser({ id: currentUserId, updatedUser })).unwrap();
    resetUserForm();
    setShowUserModal(false);
    setTimeout(() => window.location.reload(), 1000);
  } catch (error) {
    console.error('Error updating user:', error);
  }
};

  // Modified handleAddDepartment
  const handleAddDepartment = async (e) => {
    e.preventDefault();
    const newDept = { ...deptForm };

    try {
      await dispatch(createDepartment(newDept)).unwrap();
      resetDeptForm();
      setShowDeptModal(false);
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error adding department:', error);
    }
  };

  // Modified handleUpdateDepartment
  const handleUpdateDepartment = async (e) => {
    e.preventDefault();
    const updatedDept = {
      department: deptForm.name,
      given_by: deptForm.givenBy
    };

    try {
      await dispatch(updateDepartment({ id: currentDeptId, updatedDept })).unwrap();
      resetDeptForm();
      setShowDeptModal(false);
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error updating department:', error);
    }
  };

  // Modified handleDeleteUser
  const handleDeleteUser = async (userId) => {
    try {
      await dispatch(deleteUser(userId)).unwrap();
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };


  // User form handlers
  const handleUserInputChange = (e) => {
    const { name, value } = e.target;
    setUserForm(prev => ({ ...prev, [name]: value }));
  };

  // const handleAddUser = (e) => {
  //   e.preventDefault();
  //   const newUser = {
  //     ...userForm,
  //     id: (users.length + 1).toString(),
  //     password: '********'
  //   };
  //   setUsers([...users, newUser]);
  //   resetUserForm();
  //   setShowUserModal(false);
  // };
const handleEditUser = (userId) => {
  const user = userData.find(u => u.id === userId);
  setUserForm({
    username: user.user_name,
    email: user.email_id,
    password: user.password,
    phone: user.number,
    employee_id: user.employee_id || '', // Add this line
    department: user.user_access || '',
    role: user.role,
    status: user.status
  });
  setCurrentUserId(userId);
  setIsEditing(true);
  setShowUserModal(true);
};

  const handleEditDepartment = (deptId) => {
    const dept = department.find(d => d.id === deptId);
    setDeptForm({
      name: dept.department,  // Match your API response field names
      givenBy: dept.given_by
    });
    setCurrentDeptId(deptId);
    setShowDeptModal(true);
  };
  // const handleUpdateUser = (e) => {
  //   e.preventDefault();
  //   setUsers(users.map(user => 
  //     user.id === currentUserId ? { ...userForm, id: currentUserId } : user
  //   ));
  //   resetUserForm();
  //   setShowUserModal(false);
  // };



  const resetUserForm = () => {
    setUserForm({
      username: '',
      email: '',
      password: '',
      phone: '',
      employee_id: '',
      department: '', // Add this line
      givenBy: '',
      role: 'user',
      status: 'active'
    });
    setIsEditing(false);
    setCurrentUserId(null);
  };

  // Department form handlers
  const handleDeptInputChange = (e) => {
    const { name, value } = e.target;
    setDeptForm(prev => ({ ...prev, [name]: value }));
  };

  // const handleAddDepartment = (e) => {
  //   e.preventDefault();
  //   const newDept = {
  //     ...deptForm,
  //     id: (departments.length + 1).toString()
  //   };
  //   setDepartments([...departments, newDept]);
  //   resetDeptForm();
  //   setShowDeptModal(false);
  // };


  //   const handleUpdateDepartment = (e) => {
  //     e.preventDefault();
  //     setDepartments(departments.map(dept => 
  //       dept.id === currentDeptId ? { ...deptForm, id: currentDeptId } : dept
  //     ));
  //     resetDeptForm();
  //     setShowDeptModal(false);
  //   };


  // const handleDeleteDepartment = (deptId) => {
  //   setDepartments(department.filter(dept => dept.id !== deptId));
  // };

  const resetDeptForm = () => {
    setDeptForm({
      name: '',
      givenBy: ''
    });
    setCurrentDeptId(null);
  };


  // Add this filtered users calculation for leave tab
  const filteredLeaveUsers = userData?.filter(user =>
    !leaveUsernameFilter || user.user_name.toLowerCase().includes(leaveUsernameFilter.toLowerCase())
  );


  const getStatusColor = (status) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'manager': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header and Tabs */}
       {/* Header and Tabs */}
<div className="my-5 flex justify-between">
  <div className="flex justify-between items-center mb-6">
    <h1 className="text-2xl font bold text-purple-600 font-bold">User Management System</h1>
  </div>

  <div className="flex items-center gap-4">
    <div className="flex border border-purple-200 rounded-md overflow-hidden self-start">
      {/* Your existing tab buttons */}
      <button
        className={`flex px-4 py-3 text-sm font-medium ${activeTab === 'users' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
        onClick={() => {
          handleTabChange('users');
          dispatch(userDetails());
        }}
      >
        <User size={18} />
        Users
      </button>
      <button
        className={`flex px-4 py-3 text-sm font-medium ${activeTab === 'departments' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
        onClick={() => {
          handleTabChange('departments');
          dispatch(departmentOnlyDetails());
          dispatch(givenByDetails());
        }}
      >
        <Building size={18} />
        Departments
      </button>
      <button
        className={`flex px-4 py-3 text-sm font-medium ${activeTab === 'leave' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
        onClick={() => {
          handleTabChange('leave');
          dispatch(userDetails());
        }}
      >
        <Calendar size={18} />
        Leave Management
      </button>
    </div>

    {/* Add this debug button temporarily next to your refresh button */}
<button
  onClick={debugUserStatus}
  className="rounded-md bg-yellow-600 py-2 px-4 text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
>
  <div className="flex items-center">
    <Search size={18} className="mr-2" />
    <span>Debug User</span>
  </div>
</button>

    {/* Refresh Button */}
    <button
      onClick={handleManualRefresh}
      disabled={isRefreshing}
      className="rounded-md bg-green-600 py-2 px-4 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex items-center">
        <RefreshCw size={18} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span>{isRefreshing ? 'Refreshing...' : 'Refresh Status'}</span>
      </div>
    </button>

    {/* Add button - hide for leave tab */}
    {activeTab !== 'leave' && (
      <button
        onClick={handleAddButtonClick}
        className="rounded-md gradient-bg py-2 px-4 text-white hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <div className="flex items-center">
          <Plus size={18} className="mr-2" />
          <span>{activeTab === 'users' ? 'Add User' : 'Add Department'}</span>
        </div>
      </button>
    )}
  </div>
</div>
{/* <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h3 className="text-sm font-medium text-yellow-800">Debug Info</h3>
        <p className="text-xs text-yellow-700">
          Total Users: {userData?.length || 0} | 
          Active: {userData?.filter(u => u.status === 'active').length || 0} | 
          Inactive: {userData?.filter(u => u.status === 'inactive').length || 0}
        </p>
        <p className="text-xs text-yellow-700">
          Employee IDs in DB: {userData?.map(u => u.employee_id).filter(Boolean).join(', ') || 'None'}
        </p>
      </div> */}
        

        {/* Leave Management Tab */}
        {activeTab === 'leave' && (
          <div className="bg-white shadow rounded-lg overflow-hidden border border-purple-200">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple px-6 py-4 border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-purple-700">Leave Management</h2>

              <div className="flex items-center gap-4">
                {/* Username Search Filter for Leave Tab */}
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        list="leaveUsernameOptions"
                        placeholder="Filter by username..."
                        value={leaveUsernameFilter}
                        onChange={(e) => setLeaveUsernameFilter(e.target.value)}
                        className="w-48 pl-10 pr-8 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                      <datalist id="leaveUsernameOptions">
                        {userData?.map(user => (
                          <option key={user.id} value={user.user_name} />
                        ))}
                      </datalist>

                      {/* Clear button for input */}
                      {leaveUsernameFilter && (
                        <button
                          onClick={clearLeaveUsernameFilter}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmitLeave}
                  className="rounded-md bg-green-600 py-2 px-4 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Submit Leave
                </button>
              </div>
            </div>


            {/* Leave Form */}
<div className="p-6 border-b border-gray-200">
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Leave Start Date
      </label>
      <input
        type="date"
        value={leaveStartDate}
        onChange={(e) => setLeaveStartDate(e.target.value)}
        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Leave End Date
      </label>
      <input
        type="date"
        value={leaveEndDate}
        onChange={(e) => setLeaveEndDate(e.target.value)}
        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
    </div>
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Remarks
      </label>
      <input
        type="text"
        value={remark}
        onChange={(e) => setRemark(e.target.value)}
        placeholder="Enter remarks"
        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
    </div>
  </div>
</div>

            {/* Users List for Leave Selection - Updated with filter */}
            {/* Users List for Leave Selection */}
<div className="h-[calc(100vh-400px)] overflow-auto">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          <input
            type="checkbox"
            onChange={handleSelectAll}
            checked={selectedUsers.length === filteredLeaveUsers?.length && filteredLeaveUsers?.length > 0}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </th>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Username
        </th>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Current Leave Start Date
        </th>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Current Leave End Date
        </th>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Current Remarks
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {filteredLeaveUsers?.map((user) => (
        <tr key={user.id} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap">
            <input
              type="checkbox"
              checked={selectedUsers.includes(user.id)}
              onChange={(e) => handleUserSelection(user.id, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm font-medium text-gray-900">{user.user_name}</div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-gray-900">
              {user.leave_date ? new Date(user.leave_date).toLocaleDateString() : 'No leave set'}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-gray-900">
              {user.leave_end_date ? new Date(user.leave_end_date).toLocaleDateString() : 'No end date set'}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-gray-900">{user.remark || 'No remarks'}</div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
          </div>
        )}


        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white shadow rounded-lg overflow-hidden border border-purple-200">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple px-6 py-4 border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-purple-700">User List</h2>

              {/* Username Filter */}
              <div className="relative">
                <div className="flex items-center gap-2">
                  {/* Input with datalist for autocomplete */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      list="usernameOptions"
                      placeholder="Filter by username..."
                      value={usernameFilter}
                      onChange={(e) => setUsernameFilter(e.target.value)}
                      className="w-48 pl-10 pr-8 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                    <datalist id="usernameOptions">
                      {userData?.map(user => (
                        <option key={user.id} value={user.user_name} />
                      ))}
                    </datalist>

                    {/* Clear button for input */}
                    {usernameFilter && (
                      <button
                        onClick={clearUsernameFilter}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown button */}
                  <button
                    onClick={toggleUsernameDropdown}
                    className="flex items-center gap-1 px-3 py-2 border border-purple-200 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <ChevronDown size={16} className={`transition-transform ${usernameDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Dropdown menu */}
                {usernameDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-56 rounded-md bg-white shadow-lg border border-gray-200 max-h-60 overflow-auto top-full right-0">
                    <div className="py-1">
                      <button
                        onClick={clearUsernameFilter}
                        className={`block w-full text-left px-4 py-2 text-sm ${!usernameFilter ? 'bg-purple-100 text-purple-900' : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        All Usernames
                      </button>
                      {userData?.map(user => (
                        <button
                          key={user.id}
                          onClick={() => handleUsernameFilterSelect(user.user_name)}
                          className={`block w-full text-left px-4 py-2 text-sm ${usernameFilter === user.user_name ? 'bg-purple-100 text-purple-900' : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                          {user.user_name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="h-[calc(100vh-275px)] overflow-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Username
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Phone No.
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Employee ID
</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Department
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {userData
            ?.filter(user =>
               user.user_name !== 'admin' &&
                user.user_name !== 'DSMC' && (
              !usernameFilter || user.user_name.toLowerCase().includes(usernameFilter.toLowerCase()))
            )
            .map((user, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900">{user?.user_name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user?.email_id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user?.number}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
  <div className="text-sm text-gray-900">{user?.employee_id || 'N/A'}</div>
</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user?.user_access || 'N/A'}</div>
                </td>
                
                {/* ADD THE STATUS CELL HERE */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user?.status)}`}>
                      {user?.status}
                    </span>
                    {user?.status === 'active' && (
                      <span className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live Status"></span>
                    )}
                  </div>
                </td>
                {/* END OF STATUS CELL */}
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user?.role)}`}>
                    {user?.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditUser(user?.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  </div>
)}

        {/* Departments Tab */}
       {/* Departments Tab */}
{/* Departments Tab */}
{activeTab === 'departments' && (
  <div className="bg-white shadow rounded-lg overflow-hidden border border-purple-200">
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple px-6 py-4 border-gray-200">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-purple-700">Department Management</h2>
        
        {/* Sub-tabs for Departments and Given By */}
        <div className="flex border border-purple-200 rounded-md overflow-hidden">
          <button
            className={`px-4 py-2 text-sm font-medium ${activeDeptSubTab === 'departments' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
            onClick={() => setActiveDeptSubTab('departments')}
          >
            Departments
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${activeDeptSubTab === 'givenBy' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
            onClick={() => setActiveDeptSubTab('givenBy')}
          >
            Given By
          </button>
        </div>
      </div>
    </div>

    {/* Loading State */}
    {loading && (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    )}

    {/* Error State */}
    {error && (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md m-4">
        <p className="text-red-600">Error: {error}</p>
      </div>
    )}

    {/* Departments Sub-tab - Show only department names */}
    {activeDeptSubTab === 'departments' && !loading && (
      <div className="h-[calc(100vh-275px)] overflow-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {department && department.length > 0 ? (
              // Get unique departments and show them
              Array.from(new Map(department.map(dept => [dept.department, dept])).values())
                .filter(dept => dept?.department && dept.department.trim() !== '')
                .map((dept, index) => (
                  <tr key={dept.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditDepartment(dept.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                  No departments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )}

    {/* Given By Sub-tab - Show only given_by values */}
    {activeDeptSubTab === 'givenBy' && !loading && (
      <div className="h-[calc(100vh-275px)] overflow-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Given By
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {department && department.length > 0 ? (
              // Get unique given_by values and show them
              Array.from(new Map(department.map(dept => [dept.given_by, dept])).values())
                .filter(dept => dept?.given_by && dept.given_by.trim() !== '')
                .map((dept, index) => (
                  <tr key={dept.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.given_by}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditDepartment(dept.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                  No given by data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )}
  </div>
)}

        {/* User Modal */}
        {showUserModal && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {isEditing ? 'Edit User' : 'Create New User'}
                    </h3>
                    <button
                      onClick={() => setShowUserModal(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="mt-6">
                    <form onSubmit={isEditing ? handleUpdateUser : handleAddUser}>
                      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                            Username
                          </label>
                          <input
                            type="text"
                            name="username"
                            id="username"
                            value={userForm.username}
                            onChange={handleUserInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <input
                            type="email"
                            name="email"
                            id="email"
                            value={userForm.email}
                            onChange={handleUserInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>

                        {!isEditing && (
                          <div className="sm:col-span-3">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                              Password
                            </label>
                            <input
                              type="password"
                              name="password"
                              id="password"
                              value={userForm.password}
                              onChange={handleUserInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>
                        )}

                        <div className="sm:col-span-3">
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Phone
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            id="phone"
                            value={userForm.phone}
                            onChange={handleUserInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>



                        <div className="sm:col-span-3">
  <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700">
    Employee ID
  </label>
  <input
    type="text"
    name="employee_id"
    id="employee_id"
    value={userForm.employee_id}
    onChange={handleUserInputChange}
    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
    placeholder="Enter Employee ID"
  />
</div>

                        <div className="sm:col-span-3">
                          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                            Role
                          </label>
                          <select
                            id="role"
                            name="role"
                            value={userForm.role}
                            onChange={handleUserInputChange}
                            className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                            Department
                          </label>
                          <select
                            id="department"
                            name="department"
                            value={userForm.department}
                            onChange={handleUserInputChange}
                            className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="">Select Department</option>
                            {department && department.length > 0 ? (
                              // Get unique departments using Set
                              [...new Set(department.map(dept => dept.department))]
                                .filter(deptName => deptName) // Remove empty values
                                .map((deptName, index) => (
                                  <option key={index} value={deptName}>
                                    {deptName}
                                  </option>
                                ))
                            ) : (
                              <option value="" disabled>Loading departments...</option>
                            )}
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                            Status
                          </label>
                          <select
                            id="status"
                            name="status"
                            value={userForm.status}
                            onChange={handleUserInputChange}
                            className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowUserModal(false)}
                          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Save size={18} className="mr-2" />
                          {isEditing ? 'Update User' : 'Save User'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Department Modal */}
        {showDeptModal && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {currentDeptId ? 'Edit Department' : 'Create New Department'}
                    </h3>
                    <button
                      onClick={() => setShowDeptModal(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="mt-6">
                    <form onSubmit={currentDeptId ? handleUpdateDepartment : handleAddDepartment}>
                      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-6">
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Department Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            value={deptForm.name}
                            onChange={handleDeptInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>

                        <div className="sm:col-span-6">
                          <label htmlFor="givenBy" className="block text-sm font-medium text-gray-700">
                            Given By
                          </label>
                          <input
                            type="text"
                            id="givenBy"
                            name="givenBy"
                            value={deptForm.givenBy}
                            onChange={handleDeptInputChange}
                            className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Enter Given By"
                          />
                        </div>

                      </div>

                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowDeptModal(false)}
                          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Save size={18} className="mr-2" />
                          {currentDeptId ? 'Update Department' : 'Save Department'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Setting;










// <div className="space-y-8">
//   {/* Header and Tabs */}
//   <div className="my-5">
//     {/* Header */}
//     <div className="flex justify-between items-center mb-6">
//       <h1 className="text-xl md:text-2xl font-bold text-purple-600">User Management System</h1>
//     </div>

//     {/* Tabs and Add Button Container */}
//     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//       {/* Tabs */}
//       <div className="flex border border-purple-200 rounded-md overflow-hidden self-start w-full sm:w-auto">
//         <button
//           className={`flex flex-1 justify-center items-center px-3 py-2 md:px-4 md:py-3 text-sm font-medium ${activeTab === 'users' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
//           onClick={() => {
//             handleTabChange('users');
//             dispatch(userDetails());
//           }}
//         >
//           <User size={16} className="mr-1 md:mr-2" />
//           <span className="hidden xs:inline">Users</span>
//         </button>
//         <button
//           className={`flex flex-1 justify-center items-center px-3 py-2 md:px-4 md:py-3 text-sm font-medium ${activeTab === 'departments' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
//           onClick={() => {
//             handleTabChange('departments');
//             dispatch(departmentOnlyDetails());
//             dispatch(givenByDetails());
//           }}
//         >
//           <Building size={16} className="mr-1 md:mr-2" />
//           <span className="hidden xs:inline">Departments</span>
//         </button>
//         <button
//           className={`flex flex-1 justify-center items-center px-3 py-2 md:px-4 md:py-3 text-sm font-medium ${activeTab === 'leave' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
//           onClick={() => {
//             handleTabChange('leave');
//             dispatch(userDetails());
//           }}
//         >
//           <Calendar size={16} className="mr-1 md:mr-2" />
//           <span className="hidden xs:inline">Leave</span>
//         </button>
//       </div>

//       {/* Add button - hide for leave tab */}
//       {activeTab !== 'leave' && (
//         <button
//           onClick={handleAddButtonClick}
//           className="rounded-md gradient-bg py-2 px-3 md:px-4 text-white hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto"
//         >
//           <div className="flex items-center justify-center">
//             <Plus size={16} className="mr-1 md:mr-2" />
//             <span className="text-sm">
//               {activeTab === 'users' ? 'Add User' : 'Add Department'}
//             </span>
//           </div>
//         </button>
//       )}
//     </div>
//   </div>
