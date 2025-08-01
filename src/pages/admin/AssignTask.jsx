import { useState, useEffect } from "react"
import { BellRing, FileCheck, Calendar, Clock } from "lucide-react"
import AdminLayout from "../../components/layout/AdminLayout"

// Calendar Component (defined outside)
const CalendarComponent = ({ date, onChange, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate()
  }
  
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay()
  }
  
  const handleDateClick = (day) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    onChange(selectedDate)
    onClose()
  }
  
  const renderDays = () => {
    const days = []
    const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth())
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth())
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>)
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected =
        date &&
        date.getDate() === day &&
        date.getMonth() === currentMonth.getMonth() &&
        date.getFullYear() === currentMonth.getFullYear()
      
      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(day)}
          className={`h-8 w-8 rounded-full flex items-center justify-center text-sm ${
            isSelected ? "bg-purple-600 text-white" : "hover:bg-purple-100 text-gray-700"
          }`}
        >
          {day}
        </button>
      )
    }
    
    return days
  }
  
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }
  
  return (
    <div className="p-2 bg-white border border-gray-200 rounded-md shadow-md">
      <div className="flex justify-between items-center mb-2">
        <button type="button" onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-full">
          &lt;
        </button>
        <div className="text-sm font-medium">
          {currentMonth.toLocaleString("default", { month: "long" })} {currentMonth.getFullYear()}
        </div>
        <button type="button" onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-full">
          &gt;
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="h-8 w-8 flex items-center justify-center text-xs text-gray-500">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">{renderDays()}</div>
    </div>
  )
}

// Helper functions for date manipulation
const formatDate = (date) => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const addDays = (date, days) => {
  const newDate = new Date(date)
  newDate.setDate(newDate.getDate() + days)
  return newDate
}

const addMonths = (date, months) => {
  const newDate = new Date(date)
  newDate.setMonth(newDate.getMonth() + months)
  return newDate
}

const addYears = (date, years) => {
  const newDate = new Date(date)
  newDate.setFullYear(newDate.getFullYear() + years)
  return newDate
}

export default function AssignTask() {
  const [date, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState("09:00") // Add time state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedTasks, setGeneratedTasks] = useState([])
  const [showCalendar, setShowCalendar] = useState(false)
  const [accordionOpen, setAccordionOpen] = useState(false)
  
  // Add new state variables for dropdown options
  const [departmentOptions, setDepartmentOptions] = useState([])
  const [givenByOptions, setGivenByOptions] = useState([])
  const [doerOptions, setDoerOptions] = useState([])

  const frequencies = [
    { value: "one-time", label: "One Time (No Recurrence)" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "fortnightly", label: "Fortnightly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
    { value: "end-of-1st-week", label: "End of 1st Week" },
    { value: "end-of-2nd-week", label: "End of 2nd Week" },
    { value: "end-of-3rd-week", label: "End of 3rd Week" },
    { value: "end-of-4th-week", label: "End of 4th Week" },
    { value: "end-of-last-week", label: "End of Last Week" },
  ]

  const [formData, setFormData] = useState({
    department: "",
    givenBy: "",
    doer: "",
    title: "",
    description: "",
    frequency: "daily",
    enableReminders: true,
    requireAttachment: false,
  })

  // Your existing fetchMasterSheetOptions function...
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name, e) => {
    setFormData(prev => ({ ...prev, [name]: e.target.checked }))
  }

  // Function to fetch options from master sheet
// Function to fetch options from master sheet
const fetchMasterSheetOptions = async () => {
  try {
    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbygIvQKoBIOy0xmUddkJw_L2KUO8475ldRIt8Si1ZuBingQaROb5zD__cmt8_rZYz4AWA/exec"
    const masterSheetName = 'master';
    
    // Correct way to call the Apps Script URL
    const url = `${APPS_SCRIPT_URL}?sheet=${masterSheetName}`;
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch master data: ${response.status}`)
    }

    // Since this is an Apps Script response, it should return JSON directly
    const data = await response.json()
    
    console.log("Raw data from Apps Script:", data); // Debug log

    // Check if data has the expected structure
    if (!data || !Array.isArray(data) && (!data.table || !data.table.rows)) {
      console.log("No master data found or unexpected data structure:", data)
      return
    }

    // Extract options from columns A, B, and C
    const departments = []
    const givenBy = []
    const doers = []

    // Handle different response formats
    let rows = [];
    if (Array.isArray(data)) {
      // If data is a direct array
      rows = data;
    } else if (data.table && data.table.rows) {
      // If data has Google Sheets visualization format
      rows = data.table.rows;
    }

    // Process all rows
    rows.forEach((row, index) => {
      // Skip header row if it exists
      if (index === 0 && (
        (Array.isArray(row) && row[0] === 'Department') ||
        (row.c && row.c[0] && row.c[0].v === 'Department')
      )) {
        return;
      }

      // Handle array format
      if (Array.isArray(row)) {
        // Column A - Departments
        if (row[0] && row[0].toString().trim() !== "") {
          departments.push(row[0].toString().trim())
        }
        // Column B - Given By
        if (row[1] && row[1].toString().trim() !== "") {
          givenBy.push(row[1].toString().trim())
        }
        // Column C - Doers
        if (row[2] && row[2].toString().trim() !== "") {
          doers.push(row[2].toString().trim())
        }
      } 
      // Handle Google Sheets visualization format
      else if (row.c) {
        // Column A - Departments
        if (row.c && row.c[0] && row.c[0].v) {
          const value = row.c[0].v.toString().trim()
          if (value !== "") {
            departments.push(value)
          }
        }
        // Column B - Given By
        if (row.c && row.c[1] && row.c[1].v) {
          const value = row.c[1].v.toString().trim()
          if (value !== "") {
            givenBy.push(value)
          }
        }
        // Column C - Doers
        if (row.c && row.c[2] && row.c[2].v) {
          const value = row.c[2].v.toString().trim()
          if (value !== "") {
            doers.push(value)
          }
        }
      }
    })

    // Remove duplicates and sort
    setDepartmentOptions([...new Set(departments)].sort())
    setGivenByOptions([...new Set(givenBy)].sort())
    setDoerOptions([...new Set(doers)].sort())

    console.log("Master sheet options loaded successfully", {
      departments: [...new Set(departments)],
      givenBy: [...new Set(givenBy)],
      doers: [...new Set(doers)]
    })
  } catch (error) {
    console.error("Error fetching master sheet options:", error)
    // Set default options if fetch fails 
    setDepartmentOptions(['Department 1', 'Department 2'])
    setGivenByOptions(['User 1', 'User 2'])
    setDoerOptions(['Doer 1', 'Doer 2'])
  }
}

  // Update date display format
  const getFormattedDate = (date) => {
    if (!date) return "Select a date"
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Add function to format date and time together
  const formatDateTimeToSubmit = (date, time) => {
    if (!date || !time) return ""
    
    const d = new Date(date)
    const day = d.getDate().toString().padStart(2, '0')
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const year = d.getFullYear()
    
    // Convert time to seconds format
    const [hours, minutes] = time.split(':')
    const seconds = "00" // Default seconds to 00
    
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
  }

  useEffect(() => {
    fetchMasterSheetOptions()
  }, [])

  // Your existing handleChange, handleSwitchChange functions...

// Add a function to get the last task ID
const getLastTaskId = async (sheetName) => {
  try {
    // const url = `https://docs.google.com/spreadsheets/d/10AxkKvrYLodX2OgOjqtqMezGsTgx_vf8mV5HPfDpJXE/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`
    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbygIvQKoBIOy0xmUddkJw_L2KUO8475ldRIt8Si1ZuBingQaROb5zD__cmt8_rZYz4AWA/exec"
    // const url = await fetch(`${APPS_SCRIPT_URL}?sheet=${sheetName}`);
    const url = `${APPS_SCRIPT_URL}?sheet=${sheetName}`;


    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet data: ${response.status}`)
    }

    const text = await response.text()
    const jsonStart = text.indexOf('{')
    const jsonEnd = text.lastIndexOf('}')
    const jsonString = text.substring(jsonStart, jsonEnd + 1)
    const data = JSON.parse(jsonString)

    if (!data.table || !data.table.rows.length === 0) {
      return 0 // Start from 1 if no tasks exist
    }

    // Get the last task ID from column B (index 1)
    let lastTaskId = 0
    data.table.rows.forEach(row => {
      if (row.c && row.c[1] && row.c[1].v) {
        const taskId = parseInt(row.c[1].v)
        if (!isNaN(taskId) && taskId > lastTaskId) {
          lastTaskId = taskId
        }
      }
    })

    return lastTaskId
  } catch (error) {
    console.error('Error fetching last task ID:', error)
    return 0
  }
}

// Add this date formatting helper function
const formatDateToDDMMYYYY = (date) => {
  const d = new Date(date)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

// Update the generateTasks function to properly format the date as a string
// Function to fetch working days from the Working Day Calendar sheet
// Function to fetch working days from the Working Day Calendar sheet
const fetchWorkingDays = async () => {
  try {
    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbygIvQKoBIOy0xmUddkJw_L2KUO8475ldRIt8Si1ZuBingQaROb5zD__cmt8_rZYz4AWA/exec"
    const sheetName = 'Working Day Calender';
    const url = `${APPS_SCRIPT_URL}?sheet=${encodeURIComponent(sheetName)}`;

    console.log("Fetching working days from:", url);

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch working days: ${response.status}`)
    }

    const data = await response.json()
    console.log("Raw response from Apps Script:", data);

    if (!data) {
      console.log("No data received from Apps Script")
      return []
    }

    // Extract dates from the response
    const workingDays = []
    
    // Handle array format (direct from Apps Script)
    if (Array.isArray(data)) {
      data.forEach((row, index) => {
        // Skip header row
        if (index === 0 && (row[0] === 'Working Dates' || row[0] === 'Date' || row[0] === 'Working Days')) {
          return;
        }

        if (row[0]) {
          let dateValue = row[0];
          let formattedDate = null;

          // If it's already a DD/MM/YYYY string, use it directly
          if (typeof dateValue === 'string' && dateValue.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            const parts = dateValue.split('/');
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            formattedDate = `${day}/${month}/${year}`;
          }
          // Handle Date object
          else if (dateValue instanceof Date || (typeof dateValue === 'string' && !isNaN(Date.parse(dateValue)))) {
            const date = new Date(dateValue);
            formattedDate = formatDateToDDMMYYYY(date);
          }

          if (formattedDate && formattedDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            workingDays.push(formattedDate);
          }
        }
      });
    }
    // Handle object format (Google Sheets API format)
    else if (data.table && data.table.rows) {
      data.table.rows.forEach((row, index) => {
        // Skip header row
        if (index === 0 && row.c && row.c[0] && row.c[0].v && 
            (row.c[0].v === 'Working Dates' || row.c[0].v === 'Date' || row.c[0].v === 'Working Days')) {
          return;
        }

        if (row.c && row.c[0] && row.c[0].v) {
          let dateValue = row.c[0].v;
          let formattedDate = null;

          // Handle Google Sheets Date(year,month,day) format
          if (typeof dateValue === 'string' && dateValue.startsWith('Date(')) {
            const match = /Date\((\d+),(\d+),(\d+)\)/.exec(dateValue)
            if (match) {
              const year = parseInt(match[1], 10)
              const month = parseInt(match[2], 10) // 0-indexed in Google's format
              const day = parseInt(match[3], 10)
              
              formattedDate = `${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${year}`
            }
          }
          // Handle DD/MM/YYYY string
          else if (typeof dateValue === 'string' && dateValue.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            const parts = dateValue.split('/');
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            formattedDate = `${day}/${month}/${year}`;
          }
          // Handle Date object or parseable string
          else if (dateValue instanceof Date || (typeof dateValue === 'string' && !isNaN(Date.parse(dateValue)))) {
            const date = new Date(dateValue);
            formattedDate = formatDateToDDMMYYYY(date);
          }

          if (formattedDate && formattedDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            workingDays.push(formattedDate);
          }
        }
      });
    }

    console.log(`Fetched ${workingDays.length} working days:`, workingDays.slice(0, 10));
    
    if (workingDays.length === 0) {
      console.error("No working days found. Check if your Apps Script is returning data correctly.");
      console.log("Expected data format: Array of rows where first column contains dates in DD/MM/YYYY format");
    }
    
    return workingDays.sort((a, b) => {
      // Sort dates chronologically
      const [dayA, monthA, yearA] = a.split('/').map(Number);
      const [dayB, monthB, yearB] = b.split('/').map(Number);
      const dateA = new Date(yearA, monthA - 1, dayA);
      const dateB = new Date(yearB, monthB - 1, dayB);
      return dateA - dateB;
    });

  } catch (error) {
    console.error("Error fetching working days:", error)
    return [] // Return empty array if fetch fails
  }
}

// Function to find the next working day
const findNextWorkingDay = (date, workingDays, usedWorkingDays) => {
  // Format the date to DD/MM/YYYY for comparison
  const formattedDate = formatDateToDDMMYYYY(date)
  
  // Check if the current date is a working day and not already used
  if (workingDays.includes(formattedDate) && !usedWorkingDays.includes(formattedDate)) {
    usedWorkingDays.push(formattedDate) // Mark as used
    return date
  }
  
  // Find the next available working day that hasn't been used
  let nextDate = new Date(date)
  let attempts = 0
  const maxAttempts = 100 // Prevent infinite loops by setting a limit
  
  while (attempts < maxAttempts) {
    // Move to the next day
    nextDate = addDays(nextDate, 1)
    const nextDateFormatted = formatDateToDDMMYYYY(nextDate)
    
    if (workingDays.includes(nextDateFormatted) && !usedWorkingDays.includes(nextDateFormatted)) {
      usedWorkingDays.push(nextDateFormatted) // Mark as used
      return nextDate
    }
    
    attempts++
  }
  
  // If no working day found within the limit, return the original date
  return date
}

// Updated generateTasks function that checks against working days and prevents duplicates
const generateTasks = async () => {
  if (!date || !formData.doer || !formData.title || !formData.frequency) {
    alert("Please fill in all required fields.")
    return
  }

  // Fetch working days from the sheet
  const workingDays = await fetchWorkingDays()
  if (workingDays.length === 0) {
    alert("Could not retrieve working days. Task generation will proceed without validating working days.")
  }

  const tasks = []
  const startDate = new Date(date)
  
  // Find the last available working day
  const lastWorkingDay = workingDays.length > 0 
    ? new Date(workingDays[workingDays.length - 1].split('/').reverse().join('-'))
    : addYears(startDate, 2) // Fallback if no working days
  
  const endDate = workingDays.length > 0 
    ? lastWorkingDay 
    : addYears(startDate, 2) // Default to 2 years if no working days
  
  let currentDate = new Date(startDate)
  
  // Keep track of used working days to prevent duplicates
  const usedWorkingDays = []

  // For one-time tasks
  if (formData.frequency === "one-time") {
    let taskDate = workingDays.length > 0 
      ? findNextWorkingDay(currentDate, workingDays, usedWorkingDays) 
      : currentDate
      
    // Only add if within working days range
    if (taskDate <= endDate) {
      tasks.push({
        title: formData.title,
        description: formData.description,
        department: formData.department,
        givenBy: formData.givenBy,
        doer: formData.doer,
        dueDate: formatDateTimeToSubmit(taskDate, selectedTime), // Use new format with time
        status: "pending",
        frequency: formData.frequency,
        enableReminders: formData.enableReminders,
        requireAttachment: formData.requireAttachment,
      })
    }
  } else {
    // For recurring tasks
    while (currentDate <= endDate) {
      // Find the next valid working day
      let taskDate = workingDays.length > 0 
        ? findNextWorkingDay(currentDate, workingDays, usedWorkingDays) 
        : currentDate

      // Only add if within working days range
      if (taskDate > endDate) break

      const formattedTaskDate = formatDateTimeToSubmit(taskDate, selectedTime) // Use new format with time
      if (!tasks.some(task => task.dueDate === formattedTaskDate)) {
        tasks.push({
          title: formData.title,
          description: formData.description,
          department: formData.department,
          givenBy: formData.givenBy,
          doer: formData.doer,
          dueDate: formattedTaskDate,
          status: "pending",
          frequency: formData.frequency,
          enableReminders: formData.enableReminders,
          requireAttachment: formData.requireAttachment,
        })
      }

      // Date increment based on frequency
      switch (formData.frequency) {
        case "daily":
          currentDate = addDays(currentDate, 1)
          break
        case "weekly":
          currentDate = addDays(currentDate, 7)
          break
        case "fortnightly":
          currentDate = addDays(currentDate, 14)
          break
        case "monthly":
          currentDate = addMonths(currentDate, 1)
          break
        case "quarterly":
          currentDate = addMonths(currentDate, 3)
          break
        case "yearly":
          currentDate = addYears(currentDate, 1)
          break
        default:
          currentDate = addDays(currentDate, 1)
      }
    }
  }

  if (tasks.length === 0) {
    alert("No tasks were generated within the available working days range.")
  }

  setGeneratedTasks(tasks)
  setAccordionOpen(true)
}

// Update handleSubmit function to avoid re-formatting an already formatted date
// Update handleSubmit function to handle one-time tasks differently
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    if (generatedTasks.length === 0) {
      alert("Please generate tasks first by clicking Preview Generated Tasks");
      setIsSubmitting(false);
      return;
    }

    // Submit to department sheet (or DELEGATION for one-time tasks)
    const submitSheetName = formData.frequency === "one-time" ? "DELEGATION" : formData.department;
    
    // Get last task IDs for both sheets
    const [deptLastId, checklistLastId] = await Promise.all([
      getLastTaskId(submitSheetName),
      getLastTaskId("CHECKLIST")
    ]);

    // Prepare data for both sheets - use current date with time for timestamp
    const currentDateTime = formatDateTimeToSubmit(new Date(), new Date().toTimeString().slice(0, 5));
    const allTasksData = generatedTasks.map((task, index) => ({
      timestamp: currentDateTime,
      taskId: (deptLastId + 1 + index).toString(),
      department: task.department,
      givenBy: task.givenBy,
      doer: task.doer,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate, // This already includes date and time
      frequency: task.frequency,
      enableReminders: task.enableReminders ? 'Yes' : 'No',
      requireAttachment: task.requireAttachment ? 'Yes' : 'No',
    }));

    // Submit to department sheet
    const deptPayload = new FormData();
    deptPayload.append('sheetName', submitSheetName);
    deptPayload.append('action', 'insert');
    deptPayload.append('rowData', JSON.stringify(allTasksData));
    deptPayload.append('batchInsert', 'true');

    const deptResponse = await fetch('https://script.google.com/macros/s/AKfycbygIvQKoBIOy0xmUddkJw_L2KUO8475ldRIt8Si1ZuBingQaROb5zD__cmt8_rZYz4AWA/exec', {
      method: 'POST',
      body: deptPayload
    });

    // Submit first task to CHECKLIST sheet
    const firstTask = generatedTasks[0];
    const checklistTaskData = {
      timestamp: currentDateTime,
      taskId: (checklistLastId + 1).toString(),
      department: firstTask.department,
      givenBy: firstTask.givenBy,
      doer: firstTask.doer,
      title: firstTask.title,
      description: firstTask.description,
      dueDate: firstTask.dueDate, // This already includes date and time
      frequency: firstTask.frequency,
      enableReminders: firstTask.enableReminders ? 'Yes' : 'No',
      requireAttachment: firstTask.requireAttachment ? 'Yes' : 'No',
    };

    const checklistPayload = new FormData();
    checklistPayload.append('sheetName', 'Checklist');
    checklistPayload.append('action', 'insert');
    checklistPayload.append('rowData', JSON.stringify(checklistTaskData));

    const checklistResponse = await fetch('https://script.google.com/macros/s/AKfycbygIvQKoBIOy0xmUddkJw_L2KUO8475ldRIt8Si1ZuBingQaROb5zD__cmt8_rZYz4AWA/exec', {
      method: 'POST',
      body: checklistPayload
    });

    if (!deptResponse.ok || !checklistResponse.ok) {
      throw new Error('Failed to submit to one or more sheets');
    }

    alert(`Successfully submitted ${generatedTasks.length} tasks to ${submitSheetName} sheet and first task to CHECKLIST!`);

    // Reset form
    setFormData({
      department: "",
      givenBy: "",
      doer: "",
      title: "",
      description: "",
      frequency: "daily",
      enableReminders: true,
      requireAttachment: false,
    });
    setSelectedDate(null);
    setSelectedTime("09:00"); // Reset time
    setGeneratedTasks([]);
    setAccordionOpen(false);
  } catch (error) {
    console.error('Submission error:', error);
    alert("Failed to assign tasks. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
}

  return (
    <AdminLayout>
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight mb-6 text-purple-500">Assign New Task</h1>
      <div className="rounded-lg border border-purple-200 bg-white shadow-md overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-purple-100">
            <h2 className="text-xl font-semibold text-purple-700">Task Details</h2>
            <p className="text-purple-600">Fill in the details to assign a new task to a staff member.</p>
          </div>
          <div className="p-6 space-y-4">
            {/* Department Name Dropdown */}
            <div className="space-y-2">
              <label htmlFor="department" className="block text-sm font-medium text-purple-700">
                Department Name
              </label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">Select Department</option>
                {departmentOptions.map((dept, index) => (
                  <option key={index} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Given By Dropdown */}
            <div className="space-y-2">
              <label htmlFor="givenBy" className="block text-sm font-medium text-purple-700">
                Given By
              </label>
              <select
                id="givenBy"
                name="givenBy"
                value={formData.givenBy}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">Select Given By</option>
                {givenByOptions.map((person, index) => (
                  <option key={index} value={person}>
                    {person}
                  </option>
                ))}
              </select>
            </div>

            {/* Doer's Name Dropdown */}
            <div className="space-y-2">
              <label htmlFor="doer" className="block text-sm font-medium text-purple-700">
                Doer's Name
              </label>
              <select
                id="doer"
                name="doer"
                value={formData.doer}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">Select Doer</option>
                {doerOptions.map((doer, index) => (
                  <option key={index} value={doer}>
                    {doer}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-medium text-purple-700">
                Task Title
              </label>
              <input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter task title"
                required
                className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-purple-700">
                Task Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter task description"
                rows={4}
                className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Date, Time and Frequency */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-purple-700">Task Start Date</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="w-full flex justify-start items-center rounded-md border border-purple-200 p-2 text-left focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <Calendar className="mr-2 h-4 w-4 text-purple-500" />
                    {date ? getFormattedDate(date) : "Select a date"}
                  </button>
                  {showCalendar && (
                    <div className="absolute z-10 mt-1">
                      <CalendarComponent 
                        date={date} 
                        onChange={setSelectedDate} 
                        onClose={() => setShowCalendar(false)} 
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="time" className="block text-sm font-medium text-purple-700">
                  Start Time
                </label>
                <div className="relative">
                  <input
                    type="time"
                    id="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <Clock className="absolute right-2 top-2 h-4 w-4 text-purple-500 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="frequency" className="block text-sm font-medium text-purple-700">
                  Frequency
                </label>
                <select
                  id="frequency"
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                  className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  {frequencies.map((freq) => (
                    <option key={freq.value} value={freq.value}>
                      {freq.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Additional Options */}
            <div className="space-y-4 pt-2 border-t border-purple-100">
              <h3 className="text-lg font-medium text-purple-700 pt-2">Additional Options</h3>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label htmlFor="enable-reminders" className="text-purple-700 font-medium">
                    Enable Reminders
                  </label>
                  <p className="text-sm text-purple-600">Send reminders before task due date</p>
                </div>
                <div className="flex items-center space-x-2">
                  <BellRing className="h-4 w-4 text-purple-500" />
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="enable-reminders"
                      checked={formData.enableReminders}
                      onChange={(e) => handleSwitchChange("enableReminders", e)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label htmlFor="require-attachment" className="text-purple-700 font-medium">
                    Require Attachment
                  </label>
                  <p className="text-sm text-purple-600">User must upload a file when completing task</p>
                </div>
                <div className="flex items-center space-x-2">
                  <FileCheck className="h-4 w-4 text-purple-500" />
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="require-attachment"
                      checked={formData.requireAttachment}
                      onChange={(e) => handleSwitchChange("requireAttachment", e)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Preview and Submit Buttons */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={generateTasks}
                className="w-full rounded-md border border-purple-200 bg-purple-50 py-2 px-4 text-purple-700 hover:bg-purple-100 hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                Preview Generated Tasks
              </button>

              {generatedTasks.length > 0 && (
                <div className="w-full">
                  <div className="border border-purple-200 rounded-md">
                    <button
                      type="button"
                      onClick={() => setAccordionOpen(!accordionOpen)}
                      className="w-full flex justify-between items-center p-4 text-purple-700 hover:bg-purple-50 focus:outline-none"
                    >
                      <span className="font-medium">{generatedTasks.length} Tasks Generated</span>
                      <svg
                        className={`w-5 h-5 transition-transform ${accordionOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {accordionOpen && (
                      <div className="p-4 border-t border-purple-200">
                        <div className="max-h-60 overflow-y-auto space-y-2">
                          {generatedTasks.slice(0, 20).map((task, index) => (
                            <div key={index} className="text-sm p-2 border rounded-md border-purple-200 bg-purple-50">
                              <div className="font-medium text-purple-700">{task.title}</div>
                              <div className="text-xs text-purple-600">Due: {task.dueDate}</div>
                              <div className="flex space-x-2 mt-1">
                                {task.enableReminders && (
                                  <span className="inline-flex items-center text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                    <BellRing className="h-3 w-3 mr-1" /> Reminders
                                  </span>
                                )}
                                {task.requireAttachment && (
                                  <span className="inline-flex items-center text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                    <FileCheck className="h-3 w-3 mr-1" /> Attachment Required
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                          {generatedTasks.length > 20 && (
                            <div className="text-sm text-center text-purple-600 py-2">
                              ...and {generatedTasks.length - 20} more tasks
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-t border-purple-100">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  department: "",
                  givenBy: "",
                  doer: "",
                  title: "",
                  description: "",
                  frequency: "daily",
                  enableReminders: true,
                  requireAttachment: false,
                })
                setSelectedDate(null)
                setSelectedTime("09:00")
                setGeneratedTasks([])
                setAccordionOpen(false)
              }}
              className="rounded-md border border-purple-200 py-2 px-4 text-purple-700 hover:border-purple-300 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-gradient-to-r from-purple-600 to-pink-600 py-2 px-4 text-white hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              {isSubmitting ? "Assigning..." : "Assign Task"}
            </button>
          </div>
        </form>
      </div>
      
      {/* Calendar Component Definition */}
      
    </div>
  </AdminLayout>
  )
}