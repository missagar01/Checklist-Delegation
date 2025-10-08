import React, { useEffect, useState } from 'react';
// import { Plus, User, Building, X, Save, Edit, Trash2, Settings } from 'lucide-react';
import { Plus, User, Building, X, Save, Edit, Trash2, Settings, Search, ChevronDown } from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import { useDispatch, useSelector } from 'react-redux';
import { createDepartment, createUser, deleteUser, departmentDetails, updateDepartment, updateUser, userDetails } from '../redux/slice/settingSlice';

const Setting = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentDeptId, setCurrentDeptId] = useState(null);
  const [usernameFilter, setUsernameFilter] = useState('');
  const [usernameDropdownOpen, setUsernameDropdownOpen] = useState(false);

  // Add this function to handle username filter selection
  const handleUsernameFilterSelect = (username) => {
    setUsernameFilter(username);
    setUsernameDropdownOpen(false);
  };

  // Add this function to clear username filter
  const clearUsernameFilter = () => {
    setUsernameFilter('');
    setUsernameDropdownOpen(false);
  };

  // Add this function to toggle username dropdown
  const toggleUsernameDropdown = () => {
    setUsernameDropdownOpen(!usernameDropdownOpen);
  };

  const { settings, userData, department } = useSelector((state) => state.setting)
  const dispatch = useDispatch();

  const handleAddButtonClick = () => {
    if (activeTab === 'users') {
      resetUserForm();
      setShowUserModal(true);

    } else if (activeTab === 'departments') {
      resetDeptForm();
      setShowDeptModal(true);
    }
  };



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
      user_access: userForm.department, // Add this line
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
      role: userForm.role,
      status: userForm.status,
      user_access: userForm.department // Add this line
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
      department: user.user_access || '', // Add this line
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
        <div className="my-5 flex justify-between">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font bold text-purple-600 font-bold">User Management System</h1>
          </div>

          <div className="flex border border-purple-200 rounded-md overflow-hidden self-start ">
            <button
              className={`flex px-4 py-3 text-sm font-medium ${activeTab === 'users' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
              onClick={() => {
                handleTabChange('users');
                dispatch(userDetails())
              }}

            >
              <User size={18} />
              Users
            </button>
            <button
              className={`flex px-4 py-3 text-sm font-medium ${activeTab === 'departments' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
              onClick={() => {
                handleTabChange('departments');
                dispatch(departmentDetails())
              }}
            >
              <Building size={18} />
              Departments
            </button>
          </div>

          {/* Tabs */}

          <button
            onClick={handleAddButtonClick}
            className="rounded-md gradient-bg py-2 px-4 text-white hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <div className="flex items-center">
              <Plus size={18} className="mr-2" />
              <span>{activeTab === 'users' ? 'Add User' : 'Add Department'}</span>
            </div>
          </button>
        </div>

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

            <div className=" h-[calc(100vh-275px)] overflow-auto" style={{ maxHeight: 'calc(100vh - 220px)' }} >
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
                      !usernameFilter || user.user_name.toLowerCase().includes(usernameFilter.toLowerCase())
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
                          <div className="text-sm text-gray-900">{user?.user_access || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user?.status)}`}>
                            {user?.status}
                          </span>
                        </td>
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
                            {/* <button
                            onClick={() => handleDeleteUser(user?.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={18} />
                          </button> */}
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
        {activeTab === 'departments' && (
          <div className="bg-white shadow rounded-lg overflow-hidden border border-purple-200">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple px-6 py-4  border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-purple-700">Department List</h2>

            </div>

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
                      Given By
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {department?.map((dept, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept?.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{dept?.given_by}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditDepartment(dept?.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit size={18} />
                          </button>
                          {/* <button
                            // onClick={() => handleDeleteDepartment(dept?.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={18} />
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                              department.map((dept) => (
                                <option key={dept.id} value={dept.department}>
                                  {dept.department}
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