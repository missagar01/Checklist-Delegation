"use client"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { CheckCircle2, Upload, X, Search, History, ArrowLeft } from "lucide-react"
import AdminLayout from "../../components/layout/AdminLayout"
import { useDispatch, useSelector } from "react-redux"
import { checklistData, checklistHistoryData, updateChecklist } from "../../redux/slice/checklistSlice"
import { postChecklistAdminDoneAPI } from "../../redux/api/checkListApi"
import { uniqueDoerNameData} from "../../redux/slice/assignTaskSlice";
import { useNavigate } from "react-router-dom"

// Configuration object - Move all configurations here
const CONFIG = {
  // Google Apps Script URL No pending tasks for tommor
  // APPS_SCRIPT_URL:
  //   "https://script.google.com/macros/s/AKfycbzXzqnKmbeXw3i6kySQcBOwxHQA7y8WBFfEe69MPbCR-jux0Zte7-TeSKi8P4CIFkhE/exec",
  // // Google Drive folder ID for file uploads
  // DRIVE_FOLDER_ID: "1Y1lg8X7qFA4KgvcaVA_ywKx1gOnZ2ZO6",
  // // Sheet name to work with
  // SHEET_NAME: "Checklist",
  // Page configuration
  PAGE_CONFIG: {
    title: "Checklist Tasks",
    historyTitle: "Checklist Task History",
    description: "Showing today, tomorrow's tasks and past due tasks",
    historyDescription: "Read-only view of completed tasks with submission history (excluding admin-processed items)",
  },
}

function AccountDataPage() {
  const [accountData, setAccountData] = useState([])
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [additionalData, setAdditionalData] = useState({})
  const [searchTerm, setSearchTerm] = useState("")
 // const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [remarksData, setRemarksData] = useState({})
  const [historyData, setHistoryData] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [membersList, setMembersList] = useState([])
  const [selectedMembers, setSelectedMembers] = useState([])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [userRole, setUserRole] = useState("")
  const [username, setUsername] = useState("")
  const [currentPagePending, setCurrentPagePending] = useState(1);
const [currentPageHistory, setCurrentPageHistory] = useState(1);
const [isLoadingMore, setIsLoadingMore] = useState(false);


  const {checklist,loading,history}=useSelector((state)=>state.checkList)
  const {doerName}=useSelector((state)=>state.assignTask)

console.log(doerName)

  const dispatch =useDispatch();
  useEffect(()=>{
dispatch(checklistData())
dispatch(checklistHistoryData()) 
 dispatch(uniqueDoerNameData());

  },[dispatch])

const tableContainerRef = useRef(null);
const ITEMS_PER_PAGE = 100;

  // NEW: Admin history selection states
  const [selectedHistoryItems, setSelectedHistoryItems] = useState([])
  const [markingAsDone, setMarkingAsDone] = useState(false)
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    itemCount: 0,
  })

  // UPDATED: Format date-time to DD/MM/YYYY HH:MM:SS
  const formatDateTimeToDDMMYYYY = (date) => {
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const seconds = date.getSeconds().toString().padStart(2, "0")
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
  }

  // UPDATED: Format date only to DD/MM/YYYY (for comparison purposes)
  const formatDateToDDMMYYYY = (date) => {
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const isEmpty = (value) => {
    return value === null || value === undefined || (typeof value === "string" && value.trim() === "")
  }

  useEffect(() => {
    const role = localStorage.getItem("role")
    const user = localStorage.getItem("username")
    // console.log(role)
    setUserRole(role || "")
    setUsername(user || "")
  }, [])

  // UPDATED: Parse Google Sheets date-time to handle DD/MM/YYYY HH:MM:SS format
  const parseGoogleSheetsDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return ""
    // If already in DD/MM/YYYY HH:MM:SS format, return as is
    if (typeof dateTimeStr === "string" && dateTimeStr.match(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/)) {
      return dateTimeStr
    }
    // If in DD/MM/YYYY format (without time), return as is
    if (typeof dateTimeStr === "string" && dateTimeStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return dateTimeStr
    }
    // Handle Google Sheets Date(year,month,day) format
    if (typeof dateTimeStr === "string" && dateTimeStr.startsWith("Date(")) {
      const match = /Date$$(\d+),(\d+),(\d+)$$/.exec(dateTimeStr)
      if (match) {
        const year = Number.parseInt(match[1], 10)
        const month = Number.parseInt(match[2], 10)
        const day = Number.parseInt(match[3], 10)
        return `${day.toString().padStart(2, "0")}/${(month + 1).toString().padStart(2, "0")}/${year}`
      }
    }
    // Try to parse as a regular date
    try {
      const date = new Date(dateTimeStr)
      if (!isNaN(date.getTime())) {
        // Check if the original string contained time information
        if (typeof dateTimeStr === "string" && (dateTimeStr.includes(":") || dateTimeStr.includes("T"))) {
          return formatDateTimeToDDMMYYYY(date)
        } else {
          return formatDateToDDMMYYYY(date)
        }
      }
    } catch (error) {
      console.error("Error parsing date-time:", error)
    }
    return dateTimeStr
  }

  // UPDATED: Parse date from DD/MM/YYYY or DD/MM/YYYY HH:MM:SS format for comparison
  const parseDateFromDDMMYYYY = (dateStr) => {
    if (!dateStr || typeof dateStr !== "string") return null;
  
    const [datePart] = dateStr.split(" ");
    const parts = datePart.split("/");
  
    if (parts.length !== 3) return null;
  
    return new Date(parts[2], parts[1] - 1, parts[0]); // yyyy, mm (0-indexed), dd
  };
  


const sortDateWise = (a, b) => {
  // For current data structure, use task_start_date instead of col6
  const dateStrA = a.task_start_date || ""
  const dateStrB = b.task_start_date || ""
  
  const dateA = new Date(dateStrA)
  const dateB = new Date(dateStrB)
  
  if (!dateA || isNaN(dateA.getTime())) return 1
  if (!dateB || isNaN(dateB.getTime())) return -1
  
  return dateA.getTime() - dateB.getTime()
}

  const resetFilters = () => {
    setSearchTerm("")
    setSelectedMembers([])
    setStartDate("")
    setEndDate("")
  }

  // NEW: Admin functions for history management
  const handleMarkMultipleDone = async () => {
    if (selectedHistoryItems.length === 0) {
      return
    }
    if (markingAsDone) return

    // Open confirmation modal
    setConfirmationModal({
      isOpen: true,
      itemCount: selectedHistoryItems.length,
    })
  }

  // NEW: Confirmation modal component
  const ConfirmationModal = ({ isOpen, itemCount, onConfirm, onCancel }) => {
    if (!isOpen) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-yellow-100 text-yellow-600 rounded-full p-3 mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Mark Items as Done</h2>
          </div>

          <p className="text-gray-600 text-center mb-6">
            Are you sure you want to mark {itemCount} {itemCount === 1 ? "item" : "items"} as done?
          </p>

          <div className="flex justify-center space-x-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    )
  }

  const parseSupabaseDate = (dateStr) => {
  if (!dateStr) return null;
  
  // Handle ISO string from Supabase
  if (typeof dateStr === 'string' && dateStr.includes('T')) {
    return new Date(dateStr);
  }
  
  // Handle already parsed Date objects
  if (dateStr instanceof Date) {
    return dateStr;
  }
  
  // Fallback for other formats
  return new Date(dateStr);
};

  // UPDATED: Confirmation handler - Don't remove items from UI, just update their status
  const confirmMarkDone = async () => {
    setConfirmationModal({ isOpen: false, itemCount: 0 });
    setMarkingAsDone(true);
  console.log(selectedHistoryItems);
    try {
      const { data, error } = await postChecklistAdminDoneAPI(selectedHistoryItems);
      
      if (error) {
        throw new Error(error.message || "Failed to mark items as done");
      }
  
      // Clear selected items
      setSelectedHistoryItems([]);
      
      // Refresh data
      dispatch(checklistHistoryData());
      
      setSuccessMessage(
        `Successfully marked ${selectedHistoryItems.length} items as admin processed!`
      );
    } catch (error) {
      console.error("Error marking tasks as done:", error);
      setSuccessMessage(`Failed to mark tasks as done: ${error.message}`);
    } finally {
      setMarkingAsDone(false);
    }
  };

  // Memoized filtered data to prevent unnecessary re-renders
const filteredAccountData = useMemo(() => {
  if (!Array.isArray(checklist)) return [];
  
  // Apply search filter if searchTerm exists
  const filtered = searchTerm
    ? checklist.filter((account) =>
        Object.values(account).some(
          (value) =>
            value &&
            value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : checklist;

  const sorted = [...filtered].sort(sortDateWise);
  
  // Return only the items for current page (slice from 0 to currentPage * ITEMS_PER_PAGE)
  return sorted.slice(0, currentPagePending * ITEMS_PER_PAGE);
}, [checklist, searchTerm, currentPagePending]);

const filteredHistoryData = useMemo(() => {
  if (!Array.isArray(history)) return [];

  const filtered = history
    .filter((item) => {
      // Search filter
      const matchesSearch = searchTerm
        ? Object.entries(item).some(([key, value]) => {
            if (['image', 'admin_done'].includes(key)) return false;
            return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
          })
        : true;

      // Member filter
      const matchesMember = selectedMembers.length > 0 
        ? selectedMembers.includes(item.name)
        : true;

      // Date range filter
      let matchesDateRange = true;
      
      if (startDate || endDate) {
        const itemDate = parseSupabaseDate(item.task_start_date);
        if (!itemDate || isNaN(itemDate.getTime())) return false;

        // Normalize to start of day for comparison
        const itemDateOnly = new Date(
          itemDate.getFullYear(),
          itemDate.getMonth(),
          itemDate.getDate()
        );

        // Create comparison dates
        const start = startDate ? new Date(startDate) : null;
        if (start) start.setHours(0, 0, 0, 0);
        
        const end = endDate ? new Date(endDate) : null;
        if (end) {
          end.setHours(23, 59, 59, 999); // End of day
        }

        // Compare dates
        if (start && itemDateOnly < start) matchesDateRange = false;
        if (end && itemDateOnly > end) matchesDateRange = false;
      }

      return matchesSearch && matchesMember && matchesDateRange;
    })
    .sort((a, b) => {
      const dateA = parseSupabaseDate(a.task_start_date);
      const dateB = parseSupabaseDate(b.task_start_date);
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateB - dateA; // Sort newest first
    });

  // Return only the items for current page
  return filtered.slice(0, currentPageHistory * ITEMS_PER_PAGE);
}, [history, searchTerm, selectedMembers, startDate, endDate, currentPageHistory]);

const handleScroll = useCallback((e) => {
  console.log('Scroll detected:', { 
    isLoadingMore, 
    showHistory, 
    currentPagePending, 
    currentPageHistory,
    scrollTop: e.target.scrollTop,
    scrollHeight: e.target.scrollHeight,
    clientHeight: e.target.clientHeight
  });
  
  if (isLoadingMore) return;
  
  const { scrollTop, scrollHeight, clientHeight } = e.target;
  const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold
  
  if (isNearBottom) {
    setIsLoadingMore(true);
    
    // Simulate loading delay and load next page
    setTimeout(() => {
      if (showHistory) {
        const totalFilteredItems = history.filter((item) => {
          // Apply same filters as in filteredHistoryData
          const matchesSearch = searchTerm
            ? Object.entries(item).some(([key, value]) => {
                if (['image', 'admin_done'].includes(key)) return false;
                return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
              })
            : true;

          const matchesMember = selectedMembers.length > 0 
            ? selectedMembers.includes(item.name)
            : true;

          let matchesDateRange = true;
          if (startDate || endDate) {
            const itemDate = parseSupabaseDate(item.task_start_date);
            if (!itemDate || isNaN(itemDate.getTime())) return false;

            const itemDateOnly = new Date(
              itemDate.getFullYear(),
              itemDate.getMonth(),
              itemDate.getDate()
            );

            const start = startDate ? new Date(startDate) : null;
            if (start) start.setHours(0, 0, 0, 0);
            
            const end = endDate ? new Date(endDate) : null;
            if (end) end.setHours(23, 59, 59, 999);

            if (start && itemDateOnly < start) matchesDateRange = false;
            if (end && itemDateOnly > end) matchesDateRange = false;
          }

          return matchesSearch && matchesMember && matchesDateRange;
        }).length;

        if (currentPageHistory * ITEMS_PER_PAGE < totalFilteredItems) {
          setCurrentPageHistory(prev => prev + 1);
        }
      } else {
        const totalFilteredItems = checklist.filter((account) =>
          searchTerm
            ? Object.values(account).some(
                (value) =>
                  value &&
                  value.toString().toLowerCase().includes(searchTerm.toLowerCase())
              )
            : true
        ).length;

        if (currentPagePending * ITEMS_PER_PAGE < totalFilteredItems) {
          setCurrentPagePending(prev => prev + 1);
        }
      }
      
      setIsLoadingMore(false);
    }, 300); // Small delay for better UX
  }
}, [isLoadingMore, showHistory, currentPageHistory, currentPagePending, history, checklist, searchTerm, selectedMembers, startDate, endDate]);



  const getTaskStatistics = () => {
    const totalCompleted = history.length
    const memberStats =
      selectedMembers.length > 0
        ? selectedMembers.reduce((stats, member) => {
            const memberTasks = history.filter((task) => task.name === member).length
            return {
              ...stats,
              [member]: memberTasks,
            }
          }, {})
        : {}
    const filteredTotal = filteredHistoryData.length
    return {
      totalCompleted,
      memberStats,
      filteredTotal,
    }
  }

  const handleMemberSelection = (member) => {
    setSelectedMembers((prev) => {
      if (prev.includes(member)) {
        return prev.filter((item) => item !== member)
      } else {
        return [...prev, member]
      }
    })
  }

  const getFilteredMembersList = () => {
    if (userRole === "admin") {
      return doerName
    } else {
      return doerName.filter((member) => member.toLowerCase() === username.toLowerCase())
    }
  }

  // UPDATED: fetchSheetData - Include all history rows regardless of Column P status
  const fetchSheetData = useCallback(async () => {
    try {
    //  setLoading(true)
      const pendingAccounts = []
      const historyRows = []
     // const response = await fetch(`${CONFIG.APPS_SCRIPT_URL}?sheet=${CONFIG.SHEET_NAME}&action=fetch`)
      // if (!response.ok) {
      //   throw new Error(`Failed to fetch data: ${response.status}`)
      // }
      // const text = await response.text()
      // let data
      // try {
      //   data = JSON.parse(text)
      // } catch (parseError) {
      //   const jsonStart = text.indexOf("{")
      //   const jsonEnd = text.lastIndexOf("}")
      //   if (jsonStart !== -1 && jsonEnd !== -1) {
      //     const jsonString = text.substring(jsonStart, jsonEnd + 1)
      //     data = JSON.parse(jsonString)
      //   } else {
      //     throw new Error("Invalid JSON response from server")
      //   }
      // }

      const currentUsername = localStorage.getItem("username")
      const currentUserRole = localStorage.getItem("role")
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      const todayStr = formatDateToDDMMYYYY(today)
      const tomorrowStr = formatDateToDDMMYYYY(tomorrow)
      console.log("Filtering dates:", { todayStr, tomorrowStr })

      const membersSet = new Set()
      let rows = []
      if (data.table && data.table.rows) {
        rows = data.table.rows
      } else if (Array.isArray(data)) {
        rows = data
      } else if (data.values) {
        rows = data.values.map((row) => ({ c: row.map((val) => ({ v: val })) }))
      }

      rows.forEach((row, rowIndex) => {
        if (rowIndex === 0) return
        let rowValues = []
        if (row.c) {
          rowValues = row.c.map((cell) => (cell && cell.v !== undefined ? cell.v : ""))
        } else if (Array.isArray(row)) {
          rowValues = row
        } else {
          console.log("Unknown row format:", row)
          return
        }

        const assignedTo = rowValues[4] || "Unassigned"
        membersSet.add(assignedTo)
        const isUserMatch = currentUserRole === "admin" || assignedTo.toLowerCase() === currentUsername.toLowerCase()
        if (!isUserMatch && currentUserRole !== "admin") return

        const columnGValue = rowValues[6] // Task Start Date
        const columnKValue = rowValues[10] // Actual Date
        const columnMValue = rowValues[12] // Status (DONE)
        const columnPValue = rowValues[15] // Admin Processed Date (Column P)

        // Skip rows marked as DONE in column M for pending tasks only
        if (columnMValue && columnMValue.toString().trim() === "DONE") {
          return
        }

        const rowDateStr = columnGValue ? String(columnGValue).trim() : ""
        const formattedRowDate = parseGoogleSheetsDateTime(rowDateStr)
        const googleSheetsRowIndex = rowIndex + 1

        // Create stable unique ID using task ID and row index
        const taskId = rowValues[1] || ""
        const stableId = taskId
          ? `task_${taskId}_${googleSheetsRowIndex}`
          : `row_${googleSheetsRowIndex}_${Math.random().toString(36).substring(2, 15)}`

        const rowData = {
          _id: stableId,
          _rowIndex: googleSheetsRowIndex,
          _taskId: taskId,
        }

        const columnHeaders = [
          { id: "col0", label: "Timestamp", type: "string" },
          { id: "col1", label: "Task ID", type: "string" },
          { id: "col2", label: "Firm", type: "string" },
          { id: "col3", label: "Given By", type: "string" },
          { id: "col4", label: "Name", type: "string" },
          { id: "col5", label: "Task Description", type: "string" },
          { id: "col6", label: "Task Start Date", type: "datetime" },
          { id: "col7", label: "Freq", type: "string" },
          { id: "col8", label: "Enable Reminders", type: "string" },
          { id: "col9", label: "Require Attachment", type: "string" },
          { id: "col10", label: "Actual", type: "datetime" },
          { id: "col11", label: "Column L", type: "string" },
          { id: "col12", label: "Status", type: "string" },
          { id: "col13", label: "Remarks", type: "string" },
          { id: "col14", label: "Uploaded Image", type: "string" },
          { id: "col15", label: "Admin Processed", type: "datetime" }, // Column P
        ]

        columnHeaders.forEach((header, index) => {
          const cellValue = rowValues[index]
          if (
            header.type === "datetime" ||
            header.type === "date" ||
            (cellValue && String(cellValue).startsWith("Date("))
          ) {
            rowData[header.id] = cellValue ? parseGoogleSheetsDateTime(String(cellValue)) : ""
          } else if (header.type === "number" && cellValue !== null && cellValue !== "") {
            rowData[header.id] = cellValue
          } else {
            rowData[header.id] = cellValue !== null ? cellValue : ""
          }
        })

        console.log(`Row ${rowIndex}: Task ID = ${rowData.col1}, Google Sheets Row = ${googleSheetsRowIndex}`)

        const hasColumnG = !isEmpty(columnGValue)
        const isColumnKEmpty = isEmpty(columnKValue)

        // For pending tasks, exclude admin processed items (Column P not empty)
        if (hasColumnG && isColumnKEmpty && isEmpty(columnPValue)) {
          const rowDate = parseDateFromDDMMYYYY(formattedRowDate)
          const isToday = formattedRowDate.startsWith(todayStr)
          const isTomorrow = formattedRowDate.startsWith(tomorrowStr)
          const isPastDate = rowDate && rowDate <= today
          if (isToday || isTomorrow || isPastDate) {
            pendingAccounts.push(rowData)
          }
        } 
        // For history, include ALL completed tasks regardless of Column P status
        else if (hasColumnG && !isColumnKEmpty) {
          const isUserHistoryMatch =
            currentUserRole === "admin" || assignedTo.toLowerCase() === currentUsername.toLowerCase()
          if (isUserHistoryMatch) {
            historyRows.push(rowData)
          }
        }
      })

    //  setMembersList(doerName)
      setAccountData(checklist)
      setHistoryData(history)
    //  setLoading(false)
    } catch (error) {
      console.error("Error fetching sheet data:", error)
      setError("Failed to load account data: " + error.message)
     // setLoading(false)
    }
  }, [])

  // useEffect(() => {
  //   fetchSheetData()
  // }, [fetchSheetData])

  // Checkbox handlers with better state management
  const handleSelectItem = useCallback((id, isChecked) => {
    console.log(`Checkbox action: ${id} -> ${isChecked}`)
    setSelectedItems((prev) => {
      const newSelected = new Set(prev)
      if (isChecked) {
        newSelected.add(id)
      } else {
        newSelected.delete(id)
        // Clean up related data when unchecking
        setAdditionalData((prevData) => {
          const newAdditionalData = { ...prevData }
          delete newAdditionalData[id]
          return newAdditionalData
        })
        setRemarksData((prevRemarks) => {
          const newRemarksData = { ...prevRemarks }
          delete newRemarksData[id]
          return newRemarksData
        })
      }
      console.log(`Updated selection: ${Array.from(newSelected)}`)
      return newSelected
    })
  }, [])

  const handleCheckboxClick = useCallback(
    (e, id) => {
      e.stopPropagation()
      const isChecked = e.target.checked
      console.log(`Checkbox clicked: ${id}, checked: ${isChecked}`)
      handleSelectItem(id, isChecked)
    },
    [handleSelectItem],
  )

  const handleSelectAllItems = useCallback(
    (e) => {
      e.stopPropagation()
      const checked = e.target.checked
      console.log(`Select all clicked: ${checked}`)
      if (checked) {
        const allIds = filteredAccountData.map((item) => item.task_id)
        setSelectedItems(new Set(allIds))
        console.log(`Selected all items: ${allIds}`)
      } else {
        setSelectedItems(new Set())
        setAdditionalData({})
        setRemarksData({})
        console.log("Cleared all selections")
      }
    },
    [filteredAccountData],
  )

 const [uploadedImages, setUploadedImages] = useState({});

// Update the handleImageUpload function
const handleImageUpload = async (id, e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  // Create a preview URL for the image
  const previewUrl = URL.createObjectURL(file);
  
  // Update the uploadedImages state
  setUploadedImages(prev => ({
    ...prev,
    [id]: {
      file,
      previewUrl
    }
  }));
  
  // Also update the accountData if needed
  setAccountData(prev => 
    prev.map(item => 
      item.task_id === id 
        ? { ...item, image: file } 
        : item
    )
  );
};

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  const toggleHistory = () => {
    setShowHistory((prev) => !prev)
    resetFilters()
  }

  useEffect(() => {
  setCurrentPagePending(1);
  setCurrentPageHistory(1);
}, [searchTerm, selectedMembers, startDate, endDate, showHistory]);

const LoadingIndicator = () => (
  <div className="text-center py-4 bg-gray-50">
    {isLoadingMore ? (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500 mr-2"></div>
        <span className="text-purple-600 text-sm">Loading more items...</span>
      </div>
    ) : null}
  </div>
);


const hasMoreItems = () => {
  if (showHistory) {
    const totalFilteredItems = history.filter((item) => {
      // Apply same filters as in filteredHistoryData
      const matchesSearch = searchTerm
        ? Object.entries(item).some(([key, value]) => {
            if (['image', 'admin_done'].includes(key)) return false;
            return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
          })
        : true;

      const matchesMember = selectedMembers.length > 0 
        ? selectedMembers.includes(item.name)
        : true;

      let matchesDateRange = true;
      if (startDate || endDate) {
        const itemDate = parseSupabaseDate(item.task_start_date);
        if (!itemDate || isNaN(itemDate.getTime())) return false;

        const itemDateOnly = new Date(
          itemDate.getFullYear(),
          itemDate.getMonth(),
          itemDate.getDate()
        );

        const start = startDate ? new Date(startDate) : null;
        if (start) start.setHours(0, 0, 0, 0);
        
        const end = endDate ? new Date(endDate) : null;
        if (end) end.setHours(23, 59, 59, 999);

        if (start && itemDateOnly < start) matchesDateRange = false;
        if (end && itemDateOnly > end) matchesDateRange = false;
      }

      return matchesSearch && matchesMember && matchesDateRange;
    }).length;

    return currentPageHistory * ITEMS_PER_PAGE < totalFilteredItems;
  } else {
    const totalFilteredItems = checklist.filter((account) =>
      searchTerm
        ? Object.values(account).some(
            (value) =>
              value &&
              value.toString().toLowerCase().includes(searchTerm.toLowerCase())
          )
        : true
    ).length;

    return currentPagePending * ITEMS_PER_PAGE < totalFilteredItems;
  }
};



  // UPDATED: MAIN SUBMIT FUNCTION with date-time formatting
const handleSubmit = async () => {
  const selectedItemsArray = Array.from(selectedItems);
  if (selectedItemsArray.length === 0) {
    alert("Please select at least one item to submit");
    return;
  }

  // Check for missing remarks
  const missingRemarks = selectedItemsArray.filter((id) => {
    const additionalStatus = additionalData[id];
    const remarks = remarksData[id];
    return additionalStatus === "No" && (!remarks || remarks.trim() === "");
  });
  
  if (missingRemarks.length > 0) {
    alert(`Please provide remarks for items marked as "No". ${missingRemarks.length} item(s) are missing remarks.`);
    return;
  }

  // Check for missing required images
  const missingRequiredImages = selectedItemsArray.filter((id) => {
    const item = checklist.find((account) => account.task_id === id);
    const requiresAttachment = item.require_attachment && item.require_attachment.toUpperCase() === "YES";
    const hasImage = uploadedImages[id] || item.image;
    return requiresAttachment && !hasImage;
  });

  if (missingRequiredImages.length > 0) {
    alert(
      `Please upload images for all required attachments. ${missingRequiredImages.length} item(s) are missing required images.`,
    );
    return;
  }

  setIsSubmitting(true);

  // Prepare the submission data
  const submissionData = selectedItemsArray.map((id) => {
    const item = checklist.find((account) => account.task_id === id);
    const imageData = uploadedImages[id];
    
    return {
      taskId: item.task_id,
      department: item.department,
      givenBy: item.given_by,
      name: item.name,
      taskDescription: item.task_description,
      taskStartDate: item.task_start_date,
      frequency: item.frequency,
      enableReminder: item.enable_reminder,
      requireAttachment: item.require_attachment,
      status: additionalData[id] || "",
      remarks: remarksData[id] || "",
      image: imageData ? {
        name: imageData.file.name,
        type: imageData.file.type,
        size: imageData.file.size,
        previewUrl: imageData.previewUrl
      } : item.image ? {
        existingImage: typeof item.image === 'string' ? item.image : 'File object'
      } : null
    };
  });

  console.log("Submission Data:", submissionData);
  await dispatch(updateChecklist(submissionData));

  // Simulate submission delay
  setTimeout(() => {
    setIsSubmitting(false);
    setSuccessMessage(`Successfully logged ${selectedItemsArray.length} task records to console!`);
    
    // Clear selections after submission
    setSelectedItems(new Set());
    setAdditionalData({});
    setRemarksData({});
    setUploadedImages({});

    // Refresh the page after showing success message
    setTimeout(() => {
      window.location.reload();
    }, 1000); // Refresh after 1 second (adjust as needed)
  }, 1500);
};

  // Convert Set to Array for display
  const selectedItemsCount = selectedItems.size

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold tracking-tight text-purple-700">
            {showHistory ? CONFIG.PAGE_CONFIG.historyTitle : CONFIG.PAGE_CONFIG.title}
          </h1>
          <div className="flex space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={showHistory ? "Search history..." : "Search tasks..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={toggleHistory}
              className="rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 py-2 px-4 text-white hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {showHistory ? (
                <div className="flex items-center">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span>Back to Tasks</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <History className="h-4 w-4 mr-1" />
                  <span>View History</span>
                </div>
              )}
            </button>
            {!showHistory && (
              <button
                onClick={handleSubmit}
                disabled={selectedItemsCount === 0 || isSubmitting}
                className="rounded-md bg-gradient-to-r from-purple-600 to-pink-600 py-2 px-4 text-white hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Processing..." : `Submit Selected (${selectedItemsCount})`}
              </button>
            )}

            {/* NEW: Admin Submit Button for History View */}
            {showHistory && userRole === "admin" && selectedHistoryItems.length > 0 && (
              <div className="fixed top-40 right-10 z-50">
                <button
                  onClick={handleMarkMultipleDone}
                  disabled={markingAsDone}
                  className="rounded-md bg-green-600 text-white px-4 py-2 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {markingAsDone ? "Processing..." : `Mark ${selectedHistoryItems.length} Items as Done`}
                </button>
              </div>
            )}
          </div>
        </div>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
              {successMessage}
            </div>
            <button onClick={() => setSuccessMessage("")} className="text-green-500 hover:text-green-700">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="rounded-lg border border-purple-200 shadow-md bg-white overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-4">
            <h2 className="text-purple-700 font-medium">
              {showHistory ? `Completed ${CONFIG.SHEET_NAME} Tasks` : `Pending ${CONFIG.SHEET_NAME} Tasks`}
            </h2>
            <p className="text-purple-600 text-sm">
              {showHistory
                ? `${CONFIG.PAGE_CONFIG.historyDescription} for ${userRole === "admin" ? "all" : "your"} tasks`
                : CONFIG.PAGE_CONFIG.description}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-purple-600">Loading task data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-800 text-center">
              {error}{" "}
              <button className="underline ml-2" onClick={() => window.location.reload()}>
                Try again
              </button>
            </div>
          ) : showHistory ? (
            <>
              {/* History Filters */}
              <div className="p-4 border-b border-purple-100 bg-gray-50">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {getFilteredMembersList().length > 0 && (
                    <div className="flex flex-col">
                      <div className="mb-2 flex items-center">
                        <span className="text-sm font-medium text-purple-700">Filter by Member:</span>
                      </div>
                      <div className="flex flex-wrap gap-3 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-md bg-white">
                        {getFilteredMembersList().map((member, idx) => (
                          <div key={idx} className="flex items-center">
                            <input
                              id={`member-${idx}`}
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              checked={selectedMembers.includes(member)}
                              onChange={() => handleMemberSelection(member)}
                            />
                            <label htmlFor={`member-${idx}`} className="ml-2 text-sm text-gray-700">
                              {member}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <div className="mb-2 flex items-center">
                      <span className="text-sm font-medium text-purple-700">Filter by Date Range:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <label htmlFor="start-date" className="text-sm text-gray-700 mr-1">
                          From
                        </label>
                       <input
  type="date"
  value={startDate}
  onChange={(e) => {
    // Convert to YYYY-MM-DD format if needed
    setStartDate(e.target.value);
  }}
  className="text-sm border border-gray-200 rounded-md p-1"
/>
                      </div>
                      <div className="flex items-center">
                        <label htmlFor="end-date" className="text-sm text-gray-700 mr-1">
                          To
                        </label>
                       <input
  type="date"
  value={endDate}
  onChange={(e) => {
    setEndDate(e.target.value);
  }}
  className="text-sm border border-gray-200 rounded-md p-1"
/>
                      </div>
                    </div>
                  </div>
                  {(selectedMembers.length > 0 || startDate || endDate || searchTerm) && (
                    <button
                      onClick={resetFilters}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>

              {/* NEW: Confirmation Modal */}
              <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                itemCount={confirmationModal.itemCount}
                onConfirm={confirmMarkDone}
                onCancel={() => setConfirmationModal({ isOpen: false, itemCount: 0 })}
              />

              {/* Task Statistics */}
              <div className="p-4 border-b border-purple-100 bg-blue-50">
                <div className="flex flex-col">
                  <h3 className="text-sm font-medium text-blue-700 mb-2">Task Completion Statistics:</h3>
                  <div className="flex flex-wrap gap-4">
                    <div className="px-3 py-2 bg-white rounded-md shadow-sm">
                      <span className="text-xs text-gray-500">Total Completed</span>
                      <div className="text-lg font-semibold text-blue-600">{getTaskStatistics().totalCompleted}</div>
                    </div>
                    {(selectedMembers.length > 0 || startDate || endDate || searchTerm) && (
                      <div className="px-3 py-2 bg-white rounded-md shadow-sm">
                        <span className="text-xs text-gray-500">Filtered Results</span>
                        <div className="text-lg font-semibold text-blue-600">{getTaskStatistics().filteredTotal}</div>
                      </div>
                    )}
                    {selectedMembers.map((member) => (
                      <div key={member} className="px-3 py-2 bg-white rounded-md shadow-sm">
                        <span className="text-xs text-gray-500">{member}</span>
                        <div className="text-lg font-semibold text-indigo-600">
                          {getTaskStatistics().memberStats[member]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* History Table - Optimized for performance */}
              {/* <div className="h-[calc(100vh-300px)] overflow-auto"> */}
              <div ref={tableContainerRef} className="h-[calc(100vh-300px)] overflow-auto" onScroll={handleScroll}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      {/* Admin Select Column Header */}
                      {userRole === "admin" && (
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                          <div className="flex flex-col items-center">
                          <input
  type="checkbox"
  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
  checked={
    filteredHistoryData.filter(item => isEmpty(item.admin_done)).length > 0 &&
    selectedHistoryItems.length === filteredHistoryData.filter(item => isEmpty(item.admin_done)).length
  }
  onChange={(e) => {
    const unprocessedItems = filteredHistoryData.filter(item => isEmpty(item.admin_done));
    if (e.target.checked) {
      // Store only task_id values
      setSelectedHistoryItems(unprocessedItems.map(item => item.task_id));
    } else {
      setSelectedHistoryItems([]);
    }
  }}
/>

                            <span className="text-xs text-gray-400 mt-1">Select</span>
                          </div>
                        </th>
                      )}
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                        Task ID
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                        Department Name
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                        Given By
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                        Name
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                        Task Description
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50 min-w-[140px]">
                        Task Start Date & Time
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                        Freq
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                        Enable Reminders
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                        Require Attachment
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50 min-w-[140px]">
                        Actual Date & Time
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50 min-w-[80px]">
                        Status
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50 min-w-[150px]">
                        Remarks
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                        Attachment
                      </th>
                      {/* NEW: Admin Processed Date Column */}
                      {userRole === "admin" && (
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 min-w-[140px]">
                          Admin Processed Date
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredHistoryData.length > 0 ? (
                      filteredHistoryData.map((history) => (
                        <tr key={history.task_id} className="hover:bg-gray-50">
                          {/* Admin Select Checkbox - Show different states based on Column P */}
                          {userRole === "admin" && (
                            <td className="px-3 py-4 w-12">
                              {!isEmpty(history.admin_done) ? (
                                // Already processed - show checked and disabled checkbox with date info
                                <div className="flex flex-col items-center">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-green-600 bg-green-100"
                                    checked={true}
                                    disabled={true}
                                    title={`Admin processed on: ${history.admin_done}`}
                                  />
                                  <span className="text-xs text-green-600 mt-1 text-center break-words">
                                    Processed
                                  </span>
                                </div>
                              ) : (
                                // Not processed - normal selectable checkbox
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                  checked={selectedHistoryItems.some((item) => item.task_id === history.task_id)}
                                  onChange={() => {
                                    setSelectedHistoryItems((prev) =>
                                      prev.some((item) => item.task_id === history.task_id)
                                        ? prev.filter((item) => item.task_id !== history.task_id)
                                        : [...prev, history],
                                    )
                                  }}
                                />
                              )}
                            </td>
                          )}
                          <td className="px-3 py-4 min-w-[100px]">
                            <div className="text-sm font-medium text-gray-900 break-words">
                              {history.task_id || "—"}
                            </div>
                          </td>
                          <td className="px-3 py-4 min-w-[120px]">
                            <div className="text-sm text-gray-900 break-words">{history.department || "—"}</div>
                          </td>
                          <td className="px-3 py-4 min-w-[100px]">
                            <div className="text-sm text-gray-900 break-words">{history.given_by || "—"}</div>
                          </td>
                          <td className="px-3 py-4 min-w-[100px]">
                            <div className="text-sm text-gray-900 break-words">{history.name || "—"}</div>
                          </td>
                          <td className="px-3 py-4 min-w-[200px]">
                            <div className="text-sm text-gray-900 break-words" title={history.task_description}>
                              {history.task_description || "—"}
                            </div>
                          </td>
                     <td className="px-3 py-4 bg-yellow-50 min-w-[140px]">
  <div className="text-sm text-gray-900 break-words">
    {history.task_start_date ? (() => {
      const date = parseSupabaseDate(history.task_start_date);
      if (!date || isNaN(date.getTime())) return "Invalid date";
      
      // Format as DD/MM/YYYY HH:MM:SS
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');

      return (
        <div>
          <div className="font-medium break-words">
            {`${day}/${month}/${year}`}
          </div>
          <div className="text-xs text-gray-500 break-words">
            {`${hours}:${minutes}:${seconds}`}
          </div>
        </div>
      );
    })() : "—"}
  </div>
</td>
                          <td className="px-3 py-4 min-w-[80px]">
                            <div className="text-sm text-gray-900 break-words">{history.frequency || "—"}</div>
                          </td>
                          <td className="px-3 py-4 min-w-[120px]">
                            <div className="text-sm text-gray-900 break-words">{history.enable_reminder || "—"}</div>
                          </td>
                          <td className="px-3 py-4 min-w-[120px]">
                            <div className="text-sm text-gray-900 break-words">{history.require_attachment || "—"}</div>
                          </td>
                          <td className="px-3 py-4 bg-green-50 min-w-[140px]">
  <div className="text-sm text-gray-900 break-words">
    {history.submission_date ? (() => {
      const dateObj = new Date(history.submission_date);
      const day = ("0" + dateObj.getDate()).slice(-2);
      const month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
      const year = dateObj.getFullYear();
      const hours = ("0" + dateObj.getHours()).slice(-2);
      const minutes = ("0" + dateObj.getMinutes()).slice(-2);
      const seconds = ("0" + dateObj.getSeconds()).slice(-2);

      return (
        <div>
          <div className="font-medium break-words">
            {`${day}/${month}/${year}`}
          </div>
          <div className="text-xs text-gray-500 break-words">
            {`${hours}:${minutes}:${seconds}`}
          </div>
        </div>
      );
    })() : "—"}
  </div>
</td>

                          <td className="px-3 py-4 bg-blue-50 min-w-[80px]">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full break-words ${
                                history.status === "Yes"
                                  ? "bg-green-100 text-green-800"
                                  : history.status=== "No"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {history.status || "—"}
                            </span>
                          </td>
                          <td className="px-3 py-4 bg-purple-50 min-w-[150px]">
                            <div className="text-sm text-gray-900 break-words" title={history.remark}>
                              {history.remark || "—"}
                            </div>
                          </td>
                          <td className="px-3 py-4 min-w-[100px]">
                            {history.image ? (
                              <a
                                href={history.image}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline flex items-center break-words"
                              >
                                <img
                                  src={history.image|| "/placeholder.svg?height=32&width=32"}
                                  alt="Attachment"
                                  className="h-8 w-8 object-cover rounded-md mr-2 flex-shrink-0"
                                />
                                <span className="break-words">View</span>
                              </a>
                            ) : (
                              <span className="text-gray-400">No attachment</span>
                            )}
                          </td>
                          {/* NEW: Admin Processed Date Column */}
                          {userRole === "admin" && (
                            <td className="px-3 py-4 bg-gray-50 min-w-[140px]">
                              {!isEmpty(history.admin_done) ? (
                                <div className="text-sm text-gray-900 break-words">
                                  <div className="font-medium text-green-700">
                                    {history.admin_done.includes(" ") ? history.admin_done.split(" ")[0] : history.admin_done}
                                  </div>
                                  {history.admin_done.includes(" ") && (
                                    <div className="text-xs text-green-600">
                                      {history.admin_done.split(" ")[1]}
                                    </div>
                                  )}
                                  <div className="text-xs text-green-600 mt-1">✓ Processed</div>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm">Not processed</span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={userRole === "admin" ? 15 : 13} className="px-6 py-4 text-center text-gray-500">
                          {searchTerm || selectedMembers.length > 0 || startDate || endDate
                            ? "No historical records matching your filters"
                            : "No completed records found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {isLoadingMore && (
  <div className="text-center py-4 bg-gray-50">
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500 mr-2"></div>
      <span className="text-purple-600 text-sm">Loading more items...</span>
    </div>
  </div>
)}
              </div>
            </>
          ) : (
            /* Regular Tasks Table - Optimized for performance */
            // <div className="h-[calc(100vh-250px)] overflow-auto">
            <div 
  ref={tableContainerRef} 
  className="h-[calc(100vh-250px)] overflow-auto" 
  onScroll={handleScroll}
>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      //  checked={Array.isArray(checklist) && checklist.length > 0 && selectedItems.size === checklist.length}
                      checked={filteredAccountData.length > 0 && selectedItems.size === filteredAccountData.length}

                        onChange={handleSelectAllItems}
                      />
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                      Task ID
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Department Name
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                      Given By
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                      Name
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                      Task Description
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50 min-w-[140px]">
                      Task Start Date & Time
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                      Freq
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Enable Reminders
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Require Attachment
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                      Status
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                      Remarks
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Upload Image
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAccountData.length > 0 ? (
                    filteredAccountData.map((account) => {
                      const isSelected = selectedItems.has(account.task_id)
                      return (
                        <tr key={account.task_id} className={`${isSelected ? "bg-purple-50" : ""} hover:bg-gray-50`}>
                          <td className="px-3 py-4 w-12">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              checked={isSelected}
                              onChange={(e) => handleCheckboxClick(e, account.task_id)}
                            />
                          </td>
                          <td className="px-3 py-4 min-w-[100px]">
                            <div className="text-sm text-gray-900 break-words">{account.task_id || "—"}</div>
                          </td>
                          <td className="px-3 py-4 min-w-[120px]">
                            <div className="text-sm text-gray-900 break-words">{account.department || "—"}</div>
                          </td>
                          <td className="px-3 py-4 min-w-[100px]">
                            <div className="text-sm text-gray-900 break-words">{account.given_by || "—"}</div>
                          </td>
                          <td className="px-3 py-4 min-w-[100px]">
                            <div className="text-sm text-gray-900 break-words">{account.name || "—"}</div>
                          </td>
                          <td className="px-3 py-4 min-w-[200px]">
                            <div className="text-sm text-gray-900 break-words" title={account.task_description}>
                              {account.task_description || "—"}
                            </div>
                          </td>
                          <td className="px-3 py-4 bg-yellow-50 min-w-[140px]">
  <div className="text-sm text-gray-900 break-words">
    {account.task_start_date ? (() => {
      const dateObj = new Date(account.task_start_date);
      const formattedDate = `${
        ("0" + dateObj.getDate()).slice(-2)
      }/${
        ("0" + (dateObj.getMonth() + 1)).slice(-2)
      }/${
        dateObj.getFullYear()
      } ${
        ("0" + dateObj.getHours()).slice(-2)
      }:${
        ("0" + dateObj.getMinutes()).slice(-2)
      }:${
        ("0" + dateObj.getSeconds()).slice(-2)
      }`;

      return (
        <div>
          <div className="font-medium break-words">
            {formattedDate.split(" ")[0]} {/* => DD/MM/YYYY */}
          </div>
          <div className="text-xs text-gray-500 break-words">
            {formattedDate.split(" ")[1]} {/* => HH:MM:SS */}
          </div>
        </div>
      );
    })() : "—"}
  </div>
</td>

                          <td className="px-3 py-4 min-w-[80px]">
                            <div className="text-sm text-gray-900 break-words">{account.frequency || "—"}</div>
                          </td>
                          <td className="px-3 py-4 min-w-[120px]">
                            <div className="text-sm text-gray-900 break-words">{account.enable_reminder || "—"}</div>
                          </td>
                          <td className="px-3 py-4 min-w-[120px]">
                            <div className="text-sm text-gray-900 break-words">{account.require_attachment|| "—"}</div>
                          </td>
                          <td className="px-3 py-4 bg-yellow-50 min-w-[100px]">
                            <select
                              disabled={!isSelected}
                              value={additionalData[account.task_id] || ""}
                              onChange={(e) => {
                                setAdditionalData((prev) => ({ ...prev, [account.task_id]: e.target.value }))
                                if (e.target.value !== "No") {
                                  setRemarksData((prev) => {
                                    const newData = { ...prev }
                                    delete newData[account.task_id]
                                    return newData
                                  })
                                }
                              }}
                              className="border border-gray-300 rounded-md px-2 py-1 w-full disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                            >
                              <option value="">Select...</option>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          </td>
                          <td className="px-3 py-4 bg-orange-50 min-w-[150px]">
                            <input
                              type="text"
                              placeholder="Enter remarks"
                              disabled={!isSelected || !additionalData[account.task_id]}
                              value={remarksData[account.task_id] || ""}
                              onChange={(e) => setRemarksData((prev) => ({ ...prev, [account.task_id]: e.target.value }))}
                              className="border rounded-md px-2 py-1 w-full border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm break-words"
                            />
                          </td>
                        <td className="px-3 py-4 bg-green-50 min-w-[120px]">
  {uploadedImages[account.task_id] || account.image ? (
    <div className="flex items-center">
      <img
        src={
          uploadedImages[account.task_id]?.previewUrl || 
          (typeof account.image === 'string' ? account.image : '')
        }
        alt="Receipt"
        className="h-10 w-10 object-cover rounded-md mr-2 flex-shrink-0"
      />
      <div className="flex flex-col min-w-0">
        <span className="text-xs text-gray-500 break-words">
          {uploadedImages[account.task_id]?.file.name || 
           (account.image instanceof File ? account.image.name : "Uploaded Receipt")}
        </span>
        {uploadedImages[account.task_id] ? (
          <span className="text-xs text-green-600">Ready to upload</span>
        ) : (
          <button
            className="text-xs text-purple-600 hover:text-purple-800 break-words"
            onClick={() => window.open(account.image, "_blank")}
          >
            View Full Image
          </button>
        )}
      </div>
    </div>
  ) : (
    <label
      className={`flex items-center cursor-pointer ${
        account.require_attachment?.toUpperCase() === "YES" 
          ? "text-red-600 font-medium" 
          : "text-purple-600"
      } hover:text-purple-800`}
    >
      <Upload className="h-4 w-4 mr-1 flex-shrink-0" />
      <span className="text-xs break-words">
        {account.require_attachment?.toUpperCase() === "YES"
          ? "Required Upload"
          : "Upload Receipt Image"}
        {account.require_attachment?.toUpperCase() === "YES" && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </span>
      <input
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(e) => handleImageUpload(account.task_id, e)}
        disabled={!isSelected}
      />
    </label>
  )}
</td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
      <td colSpan={13} className="px-6 py-4 text-center text-gray-500">
        {searchTerm
          ? "No tasks matching your search"
          : "No pending tasks found for today, tomorrow, or past due dates"}
      </td>
    </tr>
                  )}
                </tbody>
              </table>
              {isLoadingMore && (
  <div className="text-center py-4 bg-gray-50">
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500 mr-2"></div>
      <span className="text-purple-600 text-sm">Loading more items...</span>
    </div>
  </div>
)}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default AccountDataPage

