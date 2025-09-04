"use client"
import { useEffect, useState, useCallback } from "react";
import { format } from 'date-fns';
import { Search, ChevronDown, Filter, Trash2 } from "lucide-react";
import AdminLayout from "../components/layout/AdminLayout";
import DelegationPage from "./delegation-data";
import { useDispatch, useSelector } from "react-redux";
import { deleteChecklistTask, uniqueChecklistTaskData, uniqueDelegationTaskData } from "../redux/slice/quickTaskSlice";

export default function QuickTask() {
 const [tasks, setTasks] = useState([]);
  const [delegationLoading, setDelegationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [activeTab, setActiveTab] = useState('checklist');
  const [nameFilter, setNameFilter] = useState('');
  const [freqFilter, setFreqFilter] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState({
    name: false,
    frequency: false
  });
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const {quickTask, loading, delegationTasks} = useSelector((state) => state.quickTask);
  const dispatch = useDispatch();
useEffect(()=>{
  dispatch(uniqueChecklistTaskData())
},[dispatch])

// Change your checkbox to store whole row instead of only id
const handleCheckboxChange = (task) => {
  if (selectedTasks.find(t => t.task_id === task.task_id)) {
    setSelectedTasks(selectedTasks.filter(t => t.task_id !== task.task_id));
  } else {
    setSelectedTasks([...selectedTasks, task]);
  }
};

// Select all
const handleSelectAll = () => {
  if (selectedTasks.length === filteredChecklistTasks.length) {
    setSelectedTasks([]);
  } else {
    setSelectedTasks(filteredChecklistTasks); // store full rows
  }
};

// Delete
const handleDeleteSelected = async () => {
  if (selectedTasks.length === 0) return;

  setIsDeleting(true);
  try {
    console.log("Deleting rows:", selectedTasks);
    await dispatch(deleteChecklistTask(selectedTasks)).unwrap();
    setSelectedTasks([]);
  } catch (error) {
    console.error("Failed to delete tasks:", error);
    setError("Failed to delete tasks");
  } finally {
    setIsDeleting(false);
  }
};


  const CONFIG = {
    APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzXzqnKmbeXw3i6kySQcBOwxHQA7y8WBFfEe69MPbCR-jux0Zte7-TeSKi8P4CIFkhE/exec",
    SHEET_NAME: "Unique task",
    DELEGATION_SHEET: "Delegation",
    PAGE_CONFIG: {
      title: "Task Management",
      description: "Showing all unique tasks"
    }
  };

//   const fetchData = useCallback(async (sheetName, isDelegation = false) => {
//     try {
//       isDelegation ? setDelegationLoading(true) : setLoading(true);
//       setError(null);

//       const response = await fetch(
//         `${CONFIG.APPS_SCRIPT_URL}?sheet=${sheetName}&action=fetch&cacheBuster=${Date.now()}`,
//         { redirect: 'follow' }
//       );

//       if (!response.ok) throw new Error(`HTTP ${response.status}`);

//       const data = await response.json();

//       if (data?.table?.rows) {
//         const rows = data.table.rows.slice(1);
//         const transformedData = rows.map((row, rowIndex) => {
//           const baseData = {
//             _id: `row_${rowIndex}_${Math.random().toString(36).substring(2, 15)}`,
//             _rowIndex: rowIndex + 2,
//           };

//           if (isDelegation) {
//             row.c.forEach((cell, colIndex) => {
//               baseData[`col${colIndex}`] = cell?.v || "";
//             });
//           } else {
//             baseData.Department = row.c[0]?.v || "";
//             baseData['Given By'] = row.c[1]?.v || "";
//             baseData.Name = row.c[2]?.v || "";
//             baseData['Task Description'] = row.c[3]?.v || "";
//             baseData['Task Start Date'] = formatDate(row.c[4]?.v);
//             baseData.Freq = row.c[5]?.v || "";
//             baseData['Enable Reminders'] = row.c[6]?.v || "";
//             baseData['Require Attachment'] = row.c[7]?.v || "";
//             baseData.Task = 'Checklist';
//           }

//           return baseData;
//         });

//         if (isDelegation) {
//           setDelegationTasks(transformedData);
//         } else {
//           setTasks(transformedData);
//         }
//       } else {
//         throw new Error("Invalid data format");
//       }
//     } catch (err) {
//       console.error("Fetch error:", err);
//       setError(err.message || "Failed to load data");
//     } finally {
//       if (isDelegation) {
//         setDelegationLoading(false);
//       } else {
//       //  setLoading(false);
//       }
//     }
//  }, []);

  const formatDate = (dateValue) => {
    if (!dateValue) return "";
    try {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? dateValue : format(date, 'dd/MM/yyyy HH:mm');
    } catch {
      return dateValue;
    }
  };

  const requestSort = (key) => {
    if (loading) return;
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleDropdown = (dropdown) => {
    setDropdownOpen(prev => ({
      ...prev,
      [dropdown]: !prev[dropdown]
    }));
  };

  const handleNameFilterSelect = (name) => {
    setNameFilter(name);
    setDropdownOpen({ ...dropdownOpen, name: false });
  };

  const handleFrequencyFilterSelect = (freq) => {
    setFreqFilter(freq);
    setDropdownOpen({ ...dropdownOpen, frequency: false });
  };

  const clearNameFilter = () => {
    setNameFilter('');
    setDropdownOpen({ ...dropdownOpen, name: false });
  };

  const clearFrequencyFilter = () => {
    setFreqFilter('');
    setDropdownOpen({ ...dropdownOpen, frequency: false });
  };

  // FIXED: Added proper null/undefined checks and string validation
  const allNames = [
    ...new Set([
      ...quickTask.map(task => task.name),
      ...delegationTasks.map(task => task.name)
    ])
  ].filter(name => name && typeof name === 'string' && name.trim() !== '');

  const allFrequencies = [
    ...new Set([
      ...quickTask.map(task => task.frequency),
      ...delegationTasks.map(task => task.frequency)
    ])
  ].filter(frequency => frequency && typeof frequency === 'string' && frequency.trim() !== '');

  const filteredChecklistTasks = quickTask.filter(task => {
    const nameFilterPass = !nameFilter || task.name === nameFilter;
    const freqFilterPass = !freqFilter || task.frequency === freqFilter;
   const searchTermPass = task.task_description
    ?.toLowerCase()
    .includes(searchTerm.toLowerCase());
    return nameFilterPass && freqFilterPass && searchTermPass;
  }).sort((a, b) => {
    if (!sortConfig.key) return 0;
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

function formatTimestampToDDMMYYYY(timestamp) {
  if (!timestamp || timestamp === "" || timestamp === null) {
    return "—"; // or just return ""
  }

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return "—"; // fallback if it's not a valid date
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}


  // useEffect(() => {
  //   fetchData(CONFIG.SHEET_NAME);
  //   fetchData(CONFIG.DELEGATION_SHEET, true);
  // }, [fetchData]);

  return (
    <AdminLayout>
      <div className="sticky top-0 z-30 bg-white pb-4 border-b border-gray-200">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-purple-700">
              {CONFIG.PAGE_CONFIG.title}
            </h1>
            <p className="text-purple-600 text-sm">
              {activeTab === 'checklist'
                ? `Showing ${quickTask.length} checklist tasks`
                : `Showing delegation tasks`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="flex border border-purple-200 rounded-md overflow-hidden self-start">
              <button
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'checklist' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
                onClick={() => {setActiveTab('checklist')
                  dispatch(uniqueChecklistTaskData())
                }
                }
              >
                Checklist
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'delegation' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
                onClick={() => {setActiveTab('delegation')
                  dispatch(uniqueDelegationTaskData())
                }}
              >
                Delegation
              </button>
            </div>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loading || delegationLoading}
              />
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('name')}
                  className="flex items-center gap-2 px-3 py-2 border border-purple-200 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4" />
                  {nameFilter || 'Filter by Name'}
                  <ChevronDown size={16} className={`transition-transform ${dropdownOpen.name ? 'rotate-180' : ''}`} />
                </button>
                {dropdownOpen.name && (
                  <div className="absolute z-50 mt-1 w-56 rounded-md bg-white shadow-lg border border-gray-200 max-h-60 overflow-auto">
                    <div className="py-1">
                      <button
                        onClick={clearNameFilter}
                        className={`block w-full text-left px-4 py-2 text-sm ${!nameFilter ? 'bg-purple-100 text-purple-900' : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        All Names
                      </button>
                      {allNames.map(name => (
                        <button
                          key={name}
                          onClick={() => handleNameFilterSelect(name)}
                          className={`block w-full text-left px-4 py-2 text-sm ${nameFilter === name ? 'bg-purple-100 text-purple-900' : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => toggleDropdown('frequency')}
                  className="flex items-center gap-2 px-3 py-2 border border-purple-200 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4" />
                  {freqFilter || 'Filter by Frequency'}
                  <ChevronDown size={16} className={`transition-transform ${dropdownOpen.frequency ? 'rotate-180' : ''}`} />
                </button>
                {dropdownOpen.frequency && (
                  <div className="absolute z-50 mt-1 w-56 rounded-md bg-white shadow-lg border border-gray-200 max-h-60 overflow-auto">
                    <div className="py-1">
                      <button
                        onClick={clearFrequencyFilter}
                        className={`block w-full text-left px-4 py-2 text-sm ${!freqFilter ? 'bg-purple-100 text-purple-900' : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        All Frequencies
                      </button>
                      {allFrequencies.map(freq => (
                        <button
                          key={freq}
                          onClick={() => handleFrequencyFilterSelect(freq)}
                          className={`block w-full text-left px-4 py-2 text-sm ${freqFilter === freq ? 'bg-purple-100 text-purple-900' : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                          {freq}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
              {selectedTasks.length > 0 && activeTab === 'checklist' && (
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 size={16} />
                {isDeleting ? 'Deleting...' : `Delete (${selectedTasks.length})`}
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 p-4 rounded-md text-red-800 text-center">
          {error}{" "}
          <button
            onClick={() => {
             dispatch(uniqueChecklistTaskData())
            }}
            className="underline ml-2 hover:text-red-600"
          >
            Try again
          </button>
        </div>
      )}

      {loading && activeTab === 'checklist' && (
        <div className="mt-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-2"></div>
          <p className="text-purple-600">Loading task data...</p>
        </div>
      )}

      {loading && activeTab === 'delegation' && (
        <div className="mt-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-2"></div>
          <p className="text-purple-600">Loading delegation data...</p>
        </div>
      )}

      {!error && (
        <>
          {activeTab === 'checklist' ? (
           <div className="mt-4 rounded-lg border border-purple-200 shadow-md bg-white overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-4 flex justify-between items-center">
            <div>
              <h2 className="text-purple-700 font-medium">Checklist Tasks</h2>
              <p className="text-purple-600 text-sm">
                {CONFIG.PAGE_CONFIG.description}
              </p>
            </div>
            {selectedTasks.length > 0 && (
              <span className="text-sm text-purple-600">
                {selectedTasks.length} task(s) selected
              </span>
            )}
          </div>
              <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-20">
                     <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={selectedTasks.length === filteredChecklistTasks.length && filteredChecklistTasks.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </th>
                      {[
                        { key: 'Department', label: 'Department' },
                        { key: 'Given By', label: 'Given By' },
                        { key: 'Name', label: 'Name' },
                        { key: 'Task Description', label: 'Task Description', minWidth: 'min-w-[300px]' },
                        { key: 'Task Start Date', label: 'Start Date', bg: 'bg-yellow-50' },
                          { key: ' End Date', label: 'End Date', bg: 'bg-yellow-50' },
                        { key: 'Freq', label: 'Frequency' },
                        { key: 'Enable Reminders', label: 'Reminders' },
                        { key: 'Require Attachment', label: 'Attachment' },
                      ].map((column) => (
                        <th
                      key={column.label}
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.bg || ''} ${column.minWidth || ''} ${column.key ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                      onClick={() => column.key && requestSort(column.key)}
                    >
                      <div className="flex items-center">
                        {column.label}
                        {sortConfig.key === column.key && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredChecklistTasks.length > 0 ? (
                      filteredChecklistTasks.map((task,index) => (
                        <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                         <input
              type="checkbox"
              checked={selectedTasks.includes(task)}
              onChange={() => handleCheckboxChange(task)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
                      </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {task.department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {task.given_by}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {task.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 min-w-[300px] max-w-[400px]">
                            <div className="whitespace-normal break-words">
                              {task.task_description}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-yellow-50">
                            {formatTimestampToDDMMYYYY(task.task_start_date)}
                          </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 bg-yellow-50">
                            {formatTimestampToDDMMYYYY(task.submission_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`px-2 py-1 rounded-full text-xs ${task.frequency === 'Daily' ? 'bg-blue-100 text-blue-800' :
                              task.frequency === 'Weekly' ? 'bg-green-100 text-green-800' :
                                task.frequency === 'Monthly' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                              }`}>
                              {task.frequency}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {task.enable_reminder || "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {task.require_attachment || "—"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                          {searchTerm || nameFilter || freqFilter
                            ? "No tasks matching your filters"
                            : "No tasks available"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <DelegationPage
              searchTerm={searchTerm}
              nameFilter={nameFilter}
              freqFilter={freqFilter}
              setNameFilter={setNameFilter}
              setFreqFilter={setFreqFilter}
            />
          )}
        </>
      )}
    </AdminLayout>
  );
}