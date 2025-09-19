"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CheckCircle2,
  Upload,
  X,
  Search,
  History,
  ArrowLeft,
  Filter,
} from "lucide-react";
import AdminLayout from "../components/layout/AdminLayout";
import { useDispatch, useSelector } from "react-redux";
import {
  delegation_DoneData,
  delegationData,
} from "../redux/slice/delegationSlice";
import { insertDelegationDoneAndUpdate } from "../redux/api/delegationApi";

// Configuration object - Move all configurations here
const CONFIG = {
  // Google Apps Script URL
  APPS_SCRIPT_URL:
    "https://script.google.com/macros/s/AKfycbzXzqnKmbeXw3i6kySQcBOwxHQA7y8WBFfEe69MPbCR-jux0Zte7-TeSKi8P4CIFkhE/exec",

  // Google Drive folder ID for file uploads
  DRIVE_FOLDER_ID: "1LPsmRqzqvp6b7aY9FS1NfiiK0LV03v03",

  // Sheet names
  SOURCE_SHEET_NAME: "DELEGATION",
  TARGET_SHEET_NAME: "DELEGATION DONE",

  // Page configuration
  PAGE_CONFIG: {
    title: "DELEGATION Tasks",
    historyTitle: "DELEGATION Task History",
    description: "Showing all pending tasks",
    historyDescription:
      "Read-only view of completed tasks with submission history",
  },
};

// Debounce hook for search optimization
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function DelegationDataPage() {
  const [uploadedImages, setUploadedImages] = useState({});
  const [accountData, setAccountData] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [additionalData, setAdditionalData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  // const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null);
  const [remarksData, setRemarksData] = useState({});
  const [historyData, setHistoryData] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [statusData, setStatusData] = useState({});
  const [nextTargetDate, setNextTargetDate] = useState({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [userRole, setUserRole] = useState("");
  const [username, setUsername] = useState("");
  // Add this with your other state declarations
const [dateFilter, setDateFilter] = useState("all");
const filterOptions = [
  { value: "all", label: "All Tasks" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
];

  // Debounced search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { loading, delegation, delegation_done } = useSelector(
    (state) => state.delegation
  );
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(delegationData());
    dispatch(delegation_DoneData());
  }, [dispatch]);

  // NEW: Function to format date to DD/MM/YYYY HH:MM:SS
  const formatDateTimeToDDMMYYYY = useCallback((date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }, []);

  const formatDateToDDMMYYYY = useCallback((date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  // NEW: Function to create a proper datetime object for Google Sheets
  // const createGoogleSheetsDateTime = useCallback((date) => {
  //   // Return a Date object that Google Sheets can properly interpret with time
  //   return new Date(
  //     date.getFullYear(),
  //     date.getMonth(),
  //     date.getDate(),
  //     date.getHours(),
  //     date.getMinutes(),
  //     date.getSeconds()
  //   );
  // }, []);

  // NEW: Function to format datetime for Google Sheets submission
  // const formatDateTimeForGoogleSheets = useCallback((date) => {
  //   // Create a properly formatted datetime string that Google Sheets will recognize
  //   const day = date.getDate().toString().padStart(2, "0");
  //   const month = (date.getMonth() + 1).toString().padStart(2, "0");
  //   const year = date.getFullYear();
  //   const hours = date.getHours().toString().padStart(2, "0");
  //   const minutes = date.getMinutes().toString().padStart(2, "0");
  //   const seconds = date.getSeconds().toString().padStart(2, "0");

  //   return {
  //     formatted: `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`,
  //     dateObject: new Date(
  //       year,
  //       date.getMonth(),
  //       date.getDate(),
  //       date.getHours(),
  //       date.getMinutes(),
  //       date.getSeconds()
  //     ),
  //     iso: date.toISOString(),
  //     googleSheetsValue: `=DATETIME(${year},${month},${day},${hours},${minutes},${seconds})`,
  //   };
  // }, []);

  // Function to format date for Google Sheets submission (date only)
  // const formatDateForGoogleSheets = useCallback((date) => {
  //   const day = date.getDate().toString().padStart(2, "0");
  //   const month = (date.getMonth() + 1).toString().padStart(2, "0");
  //   const year = date.getFullYear();

  //   return {
  //     formatted: `${day}/${month}/${year}`,
  //     dateObject: new Date(year, date.getMonth(), date.getDate()),
  //     iso: date.toISOString().split("T")[0],
  //     googleSheetsValue: `=DATE(${year},${month},${day})`,
  //   };
  // }, []);

  // NEW: Function to convert DD/MM/YYYY HH:MM:SS string to Google Sheets datetime format
  // const convertToGoogleSheetsDateTime = useCallback(
  //   (dateTimeString) => {
  //     if (!dateTimeString || typeof dateTimeString !== "string") return "";

  //     // Handle DD/MM/YYYY HH:MM:SS format
  //     const dateTimeRegex =
  //       /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/;
  //     const match = dateTimeString.match(dateTimeRegex);

  //     if (match) {
  //       const [, day, month, year, hours, minutes, seconds] = match;
  //       const date = new Date(year, month - 1, day, hours, minutes, seconds);
  //       if (!isNaN(date.getTime())) {
  //         return formatDateTimeForGoogleSheets(date);
  //       }
  //     }

  //     // If only date provided, add current time for extend date
  //     if (dateTimeString.includes("/") && !dateTimeString.includes(":")) {
  //       const [day, month, year] = dateTimeString.split("/");
  //       const currentDate = new Date();
  //       const date = new Date(
  //         year,
  //         month - 1,
  //         day,
  //         currentDate.getHours(),
  //         currentDate.getMinutes(),
  //         currentDate.getSeconds()
  //       );
  //       if (!isNaN(date.getTime())) {
  //         return formatDateTimeForGoogleSheets(date);
  //       }
  //     }

  //     // If in YYYY-MM-DD format (from HTML date input), add current time
  //     if (dateTimeString.includes("-") && !dateTimeString.includes(":")) {
  //       const [year, month, day] = dateTimeString.split("-");
  //       const currentDate = new Date();
  //       const date = new Date(
  //         year,
  //         month - 1,
  //         day,
  //         currentDate.getHours(),
  //         currentDate.getMinutes(),
  //         currentDate.getSeconds()
  //       );
  //       if (!isNaN(date.getTime())) {
  //         return formatDateTimeForGoogleSheets(date);
  //       }
  //     }

  //     return {
  //       formatted: dateTimeString,
  //       dateObject: null,
  //       iso: "",
  //       googleSheetsValue: dateTimeString,
  //     };
  //   },
  //   [formatDateTimeForGoogleSheets]
  // );

  // NEW: Function to convert DD/MM/YYYY string to Google Sheets date format
  // const convertToGoogleSheetsDate = useCallback(
  //   (dateString) => {
  //     if (!dateString || typeof dateString !== "string") return "";

  //     // If already in DD/MM/YYYY format
  //     if (dateString.includes("/")) {
  //       const [day, month, year] = dateString.split("/");
  //       const date = new Date(year, month - 1, day);
  //       if (!isNaN(date.getTime())) {
  //         return formatDateForGoogleSheets(date);
  //       }
  //     }

  //     // If in YYYY-MM-DD format (from HTML date input)
  //     if (dateString.includes("-")) {
  //       const [year, month, day] = dateString.split("-");
  //       const date = new Date(year, month - 1, day);
  //       if (!isNaN(date.getTime())) {
  //         return formatDateForGoogleSheets(date);
  //       }
  //     }

  //     return {
  //       formatted: dateString,
  //       dateObject: null,
  //       iso: "",
  //       googleSheetsValue: dateString,
  //     };
  //   },
  //   [formatDateForGoogleSheets]
  // );

  // const isEmpty = useCallback((value) => {
  //   return (
  //     value === null ||
  //     value === undefined ||
  //     (typeof value === "string" && value.trim() === "")
  //   );
  // }, []);

  useEffect(() => {
    const role = localStorage.getItem("role");
    const user = localStorage.getItem("user-name");
    setUserRole(role || "");
    setUsername(user || "");
  }, []);

  // NEW: Parse Google Sheets datetime with support for DD/MM/YYYY HH:MM:SS format
  const parseGoogleSheetsDateTime = useCallback(
    (dateTimeStr) => {
      if (!dateTimeStr) return "";

      // If it's already in DD/MM/YYYY HH:MM:SS format, return as is
      if (
        typeof dateTimeStr === "string" &&
        dateTimeStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{1,2}:\d{1,2}$/)
      ) {
        // Ensure proper padding for DD/MM/YYYY HH:MM:SS format
        const [datePart, timePart] = dateTimeStr.split(" ");
        const [day, month, year] = datePart.split("/");
        const [hours, minutes, seconds] = timePart.split(":");

        const paddedDay = day.padStart(2, "0");
        const paddedMonth = month.padStart(2, "0");
        const paddedHours = hours.padStart(2, "0");
        const paddedMinutes = minutes.padStart(2, "0");
        const paddedSeconds = seconds.padStart(2, "0");

        return `${paddedDay}/${paddedMonth}/${year} ${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
      }

      // If it's only date format DD/MM/YYYY, add default time 00:00:00
      if (
        typeof dateTimeStr === "string" &&
        dateTimeStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)
      ) {
        const parts = dateTimeStr.split("/");
        if (parts.length === 3) {
          const day = parts[0].padStart(2, "0");
          const month = parts[1].padStart(2, "0");
          const year = parts[2];
          return `${day}/${month}/${year} 00:00:00`;
        }
        return dateTimeStr + " 00:00:00";
      }

      // Handle Google Sheets Date() format
      if (typeof dateTimeStr === "string" && dateTimeStr.startsWith("Date(")) {
        const match = /Date\((\d+),(\d+),(\d+)\)/.exec(dateTimeStr);
        if (match) {
          const year = Number.parseInt(match[1], 10);
          const month = Number.parseInt(match[2], 10);
          const day = Number.parseInt(match[3], 10);
          return `${day.toString().padStart(2, "0")}/${(month + 1)
            .toString()
            .padStart(2, "0")}/${year} 00:00:00`;
        }
      }

      // Handle other date formats
      try {
        const date = new Date(dateTimeStr);
        if (!isNaN(date.getTime())) {
          // Check if it has time component
          if (dateTimeStr.includes(":") || dateTimeStr.includes("T")) {
            return formatDateTimeToDDMMYYYY(date);
          } else {
            // If no time component, add 00:00:00
            return formatDateToDDMMYYYY(date) + " 00:00:00";
          }
        }
      } catch (error) {
        console.error("Error parsing datetime:", error);
      }

      // If all else fails, add 00:00:00 if it looks like a date
      if (
        typeof dateTimeStr === "string" &&
        dateTimeStr.includes("/") &&
        !dateTimeStr.includes(":")
      ) {
        return dateTimeStr + " 00:00:00";
      }

      // If all else fails, return the original string
      return dateTimeStr;
    },
    [formatDateTimeToDDMMYYYY, formatDateToDDMMYYYY]
  );

  // const parseGoogleSheetsDate = useCallback(
  //   (dateStr) => {
  //     if (!dateStr) return "";

  //     // If it's already in DD/MM/YYYY format, return as is
  //     if (
  //       typeof dateStr === "string" &&
  //       dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)
  //     ) {
  //       // Ensure proper padding for DD/MM/YYYY format
  //       const parts = dateStr.split("/");
  //       if (parts.length === 3) {
  //         const day = parts[0].padStart(2, "0");
  //         const month = parts[1].padStart(2, "0");
  //         const year = parts[2];
  //         return `${day}/${month}/${year}`;
  //       }
  //       return dateStr;
  //     }

  //     // Handle Google Sheets Date() format
  //     if (typeof dateStr === "string" && dateStr.startsWith("Date(")) {
  //       const match = /Date\((\d+),(\d+),(\d+)\)/.exec(dateStr);
  //       if (match) {
  //         const year = Number.parseInt(match[1], 10);
  //         const month = Number.parseInt(match[2], 10);
  //         const day = Number.parseInt(match[3], 10);
  //         return `${day.toString().padStart(2, "0")}/${(month + 1)
  //           .toString()
  //           .padStart(2, "0")}/${year}`;
  //       }
  //     }

  //     // Handle other date formats
  //     try {
  //       const date = new Date(dateStr);
  //       if (!isNaN(date.getTime())) {
  //         return formatDateToDDMMYYYY(date);
  //       }
  //     } catch (error) {
  //       console.error("Error parsing date:", error);
  //     }

  //     // If all else fails, return the original string
  //     return dateStr;
  //   },
  //   [formatDateToDDMMYYYY]
  // );

  // NEW: Format datetime for display with support for both date and datetime
  const formatDateTimeForDisplay = useCallback(
    (dateTimeStr) => {
      if (!dateTimeStr) return "—";

      // If it's already in proper DD/MM/YYYY HH:MM:SS format, return as is
      if (
        typeof dateTimeStr === "string" &&
        dateTimeStr.match(/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}$/)
      ) {
        return dateTimeStr;
      }

      // If it's in DD/MM/YYYY format only, return as is
      if (
        typeof dateTimeStr === "string" &&
        dateTimeStr.match(/^\d{2}\/\d{2}\/\d{4}$/)
      ) {
        return dateTimeStr;
      }

      // Try to parse and reformat
      return parseGoogleSheetsDateTime(dateTimeStr) || "—";
    },
    [parseGoogleSheetsDateTime]
  );

  // const formatDateForDisplay = useCallback(
  //   (dateStr) => {
  //     if (!dateStr) return "—";

  //     // If it's already in proper DD/MM/YYYY format, return as is
  //     if (
  //       typeof dateStr === "string" &&
  //       dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)
  //     ) {
  //       return dateStr;
  //     }

  //     // Try to parse and reformat
  //     return parseGoogleSheetsDate(dateStr) || "—";
  //   },
  //   [parseGoogleSheetsDate]
  // );

  const parseDateFromDDMMYYYY = useCallback((dateStr) => {
    if (!dateStr || typeof dateStr !== "string") return null;

    // Handle both date and datetime formats
    const datePart = dateStr.split(" ")[0]; // Get only the date part if datetime
    const parts = datePart.split("/");
    if (parts.length !== 3) return null;
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }, []);

  // const sortDateWise = useCallback(
  //   (a, b) => {
  //     const dateStrA = a["col6"] || ""
  //     const dateStrB = b["col6"] || ""
  //     const dateA = parseDateFromDDMMYYYY(dateStrA)
  //     const dateB = parseDateFromDDMMYYYY(dateStrB)
  //     if (!dateA) return 1
  //     if (!dateB) return -1
  //     return dateA.getTime() - dateB.getTime()
  //   },
  //   [parseDateFromDDMMYYYY],
  // )

// Update the resetFilters function to include the date filter
const resetFilters = useCallback(() => {
  setSearchTerm("");
  setStartDate("");
  setEndDate("");
  setDateFilter("all"); // Add this line
}, []);
  // Get color based on data from column R
  const getRowColor = useCallback((colorCode) => {
    if (!colorCode) return "bg-white";

    const code = colorCode.toString().toLowerCase();
    switch (code) {
      case "red":
        return "bg-red-50 border-l-4 border-red-400";
      case "yellow":
        return "bg-yellow-50 border-l-4 border-yellow-400";
      case "green":
        return "bg-green-50 border-l-4 border-green-400";
      case "blue":
        return "bg-blue-50 border-l-4 border-blue-400";
      default:
        return "bg-white";
    }
  }, []);

  // Optimized filtered data with debounced search
// Replace the filteredDelegationTasks function with this updated version
const filteredDelegationTasks = useMemo(() => {
  if (!delegation) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return delegation.filter((task) => {
    // Search filter
    const matchesSearch = debouncedSearchTerm
      ? Object.values(task).some(
          (value) =>
            value &&
            value
              .toString()
              .toLowerCase()
              .includes(debouncedSearchTerm.toLowerCase())
        )
      : true;

    // Date filter
    let matchesDateFilter = true;
    if (dateFilter !== "all" && task.planned_date) {
      const plannedDate = new Date(task.planned_date);
      plannedDate.setHours(0, 0, 0, 0);
      
      switch (dateFilter) {
        case "overdue":
          matchesDateFilter = plannedDate < today;
          break;
        case "today":
          matchesDateFilter = plannedDate.getTime() === today.getTime();
          break;
        case "upcoming":
          matchesDateFilter = plannedDate >= tomorrow;
          break;
        default:
          matchesDateFilter = true;
      }
    }

    return matchesSearch && matchesDateFilter;
  });
}, [delegation, debouncedSearchTerm, dateFilter]);

  // Updated history filtering with user filter based on column H
  const filteredHistoryData = useMemo(() => {
    if (!delegation_done) return [];

    return delegation_done
      .filter((item) => {
        // User filter
        const userMatch =
          userRole === "admin" ||
          (item.name && item.name.toLowerCase() === username.toLowerCase());
        if (!userMatch) return false;

        // Search term filter
        const matchesSearch = debouncedSearchTerm
          ? Object.values(item).some(
              (value) =>
                value &&
                value
                  .toString()
                  .toLowerCase()
                  .includes(debouncedSearchTerm.toLowerCase())
            )
          : true;

        // Date range filter
        let matchesDateRange = true;
        if (startDate || endDate) {
          // Parse the item's date (assuming created_at is in ISO format or similar)
          const itemDate = item.created_at ? new Date(item.created_at) : null;

          if (!itemDate || isNaN(itemDate.getTime())) {
            return false; // Skip items with invalid dates
          }

          // Normalize dates by setting time to start/end of day for comparison
          if (startDate) {
            const startDateObj = new Date(startDate);
            startDateObj.setHours(0, 0, 0, 0);
            if (itemDate < startDateObj) matchesDateRange = false;
          }

          if (endDate) {
            const endDateObj = new Date(endDate);
            endDateObj.setHours(23, 59, 59, 999);
            if (itemDate > endDateObj) matchesDateRange = false;
          }
        }

        return matchesSearch && matchesDateRange;
      })
      .sort((a, b) => {
        // Sort by date descending
        const dateA = a.created_at ? new Date(a.created_at) : null;
        const dateB = b.created_at ? new Date(b.created_at) : null;

        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;

        return dateB.getTime() - dateA.getTime();
      });
  }, [
    delegation_done,
    debouncedSearchTerm,
    startDate,
    endDate,
    userRole,
    username,
  ]);

  // Optimized data fetching with parallel requests
  // const fetchSheetData = useCallback(async () => {
  //   try {
  //     setLoading(true)
  //     setError(null)

  //     // Parallel fetch both sheets for better performance
  //     const [mainResponse, historyResponse] = await Promise.all([
  //       fetch(`${CONFIG.APPS_SCRIPT_URL}?sheet=${CONFIG.SOURCE_SHEET_NAME}&action=fetch`),
  //       fetch(`${CONFIG.APPS_SCRIPT_URL}?sheet=${CONFIG.TARGET_SHEET_NAME}&action=fetch`).catch(() => null),
  //     ])

  //     if (!mainResponse.ok) {
  //       throw new Error(`Failed to fetch data: ${mainResponse.status}`)
  //     }

  //     // Process main data
  //     const mainText = await mainResponse.text()
  //     let data
  //     try {
  //       data = JSON.parse(mainText)
  //     } catch (parseError) {
  //       const jsonStart = mainText.indexOf("{")
  //       const jsonEnd = mainText.lastIndexOf("}")
  //       if (jsonStart !== -1 && jsonEnd !== -1) {
  //         const jsonString = mainText.substring(jsonStart, jsonEnd + 1)
  //         data = JSON.parse(jsonString)
  //       } else {
  //         throw new Error("Invalid JSON response from server")
  //       }
  //     }

  //     // Process history data if available
  //     let processedHistoryData = []
  //     if (historyResponse && historyResponse.ok) {
  //       try {
  //         const historyText = await historyResponse.text()
  //         let historyData
  //         try {
  //           historyData = JSON.parse(historyText)
  //         } catch (parseError) {
  //           const jsonStart = historyText.indexOf("{")
  //           const jsonEnd = historyText.lastIndexOf("}")
  //           if (jsonStart !== -1 && jsonEnd !== -1) {
  //             const jsonString = historyText.substring(jsonStart, jsonEnd + 1)
  //             historyData = JSON.parse(jsonString)
  //           }
  //         }

  //         if (historyData && historyData.table && historyData.table.rows) {
  //           processedHistoryData = historyData.table.rows
  //             .map((row, rowIndex) => {
  //               if (rowIndex === 0) return null

  //               const rowData = {
  //                 _id: Math.random().toString(36).substring(2, 15),
  //                 _rowIndex: rowIndex + 2,
  //               }

  //               const rowValues = row.c ? row.c.map((cell) => (cell && cell.v !== undefined ? cell.v : "")) : []

  //               // Map all columns including column H (col7) for user filtering and column I (col8) for Task
  //               rowData["col0"] = rowValues[0] ? parseGoogleSheetsDateTime(String(rowValues[0])) : ""
  //               rowData["col1"] = rowValues[1] || ""
  //               rowData["col2"] = rowValues[2] || ""
  //               rowData["col3"] = rowValues[3] ? parseGoogleSheetsDateTime(String(rowValues[3])) : "" // Next Target Date with datetime
  //               rowData["col4"] = rowValues[4] || ""
  //               rowData["col5"] = rowValues[5] || ""
  //               rowData["col6"] = rowValues[6] || ""
  //               rowData["col7"] = rowValues[7] || "" // Column H - User name
  //               rowData["col8"] = rowValues[8] || "" // Column I - Task
  //               rowData["col9"] = rowValues[9] || "" // Column J - Given By

  //               return rowData
  //             })
  //             .filter((row) => row !== null)
  //         }
  //       } catch (historyError) {
  //         console.error("Error processing history data:", historyError)
  //       }
  //     }

  //     setHistoryData(processedHistoryData)

  //     // Process main delegation data
  //     const currentUsername = sessionStorage.getItem("username")
  //     const currentUserRole = sessionStorage.getItem("role")

  //     const pendingAccounts = []

  //     let rows = []
  //     if (data.table && data.table.rows) {
  //       rows = data.table.rows
  //     } else if (Array.isArray(data)) {
  //       rows = data
  //     } else if (data.values) {
  //       rows = data.values.map((row) => ({ c: row.map((val) => ({ v: val })) }))
  //     }

  //     rows.forEach((row, rowIndex) => {
  //       if (rowIndex === 0) return // Skip header row

  //       let rowValues = []
  //       if (row.c) {
  //         rowValues = row.c.map((cell) => (cell && cell.v !== undefined ? cell.v : ""))
  //       } else if (Array.isArray(row)) {
  //         rowValues = row
  //       } else {
  //         return
  //       }

  //       const assignedTo = rowValues[4] || "Unassigned"
  //       const isUserMatch = currentUserRole === "admin" || assignedTo.toLowerCase() === currentUsername.toLowerCase()
  //       if (!isUserMatch && currentUserRole !== "admin") return

  //       // Check conditions: Column K not null and Column L null
  //       const columnKValue = rowValues[10]
  //       const columnLValue = rowValues[11]

  //       const hasColumnK = !isEmpty(columnKValue)
  //       const isColumnLEmpty = isEmpty(columnLValue)

  //       if (!hasColumnK || !isColumnLEmpty) {
  //         return
  //       }

  //       const googleSheetsRowIndex = rowIndex + 1
  //       const taskId = rowValues[1] || ""
  //       const stableId = taskId
  //         ? `task_${taskId}_${googleSheetsRowIndex}`
  //         : `row_${googleSheetsRowIndex}_${Math.random().toString(36).substring(2, 15)}`

  //       const rowData = {
  //         _id: stableId,
  //         _rowIndex: googleSheetsRowIndex,
  //         _taskId: taskId,
  //       }

  //       // Map all columns with special handling for datetime columns
  //       for (let i = 0; i < 18; i++) {
  //         if (i === 0 || i === 6 || i === 10) {
  //           // Task Start Date, Planned Date and other datetime columns - parse as datetime
  //           rowData[`col${i}`] = rowValues[i] ? parseGoogleSheetsDateTime(String(rowValues[i])) : ""
  //         } else {
  //           rowData[`col${i}`] = rowValues[i] || ""
  //         }
  //       }

  //       pendingAccounts.push(rowData)
  //     })

  //     setAccountData(pendingAccounts)
  //     setLoading(false)
  //   } catch (error) {
  //     console.error("Error fetching sheet data:", error)
  //     setError("Failed to load account data: " + error.message)
  //     setLoading(false)
  //   }
  // }, [parseGoogleSheetsDateTime, parseGoogleSheetsDate, isEmpty])

  // useEffect(() => {
  //   fetchSheetData()
  // }, [fetchSheetData])

  const handleSelectItem = useCallback((id, isChecked) => {
    setSelectedItems((prev) => {
      const newSelected = new Set(prev);

      if (isChecked) {
        newSelected.add(id);
        setStatusData((prevStatus) => ({ ...prevStatus, [id]: "Done" }));
      } else {
        newSelected.delete(id);
        setAdditionalData((prevData) => {
          const newAdditionalData = { ...prevData };
          delete newAdditionalData[id];
          return newAdditionalData;
        });
        setRemarksData((prevRemarks) => {
          const newRemarksData = { ...prevRemarks };
          delete newRemarksData[id];
          return newRemarksData;
        });
        setStatusData((prevStatus) => {
          const newStatusData = { ...prevStatus };
          delete newStatusData[id];
          return newStatusData;
        });
        setNextTargetDate((prevDate) => {
          const newDateData = { ...prevDate };
          delete newDateData[id];
          return newDateData;
        });
      }

      return newSelected;
    });
  }, []);

  const handleCheckboxClick = useCallback(
    (e, id) => {
      e.stopPropagation();
      const isChecked = e.target.checked;
      handleSelectItem(id, isChecked);
    },
    [handleSelectItem]
  );

  const handleSelectAllItems = useCallback(
    (e) => {
      e.stopPropagation();
      const checked = e.target.checked;

      if (checked) {
        const allIds = delegation.map((item) => item.task_id);
        setSelectedItems(new Set(allIds));

        const newStatusData = {};
        allIds.forEach((id) => {
          newStatusData[id] = "Done";
        });
        setStatusData((prev) => ({ ...prev, ...newStatusData }));
      } else {
        setSelectedItems(new Set());
        setAdditionalData({});
        setRemarksData({});
        setStatusData({});
        setNextTargetDate({});
      }
    },
    [delegation]
  );

  const handleImageUpload = useCallback((id, e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadedImages((prev) => ({
      ...prev,
      [id]: file,
    }));
  }, []);

  const handleStatusChange = useCallback((id, value) => {
    setStatusData((prev) => ({ ...prev, [id]: value }));
    if (value === "Done") {
      setNextTargetDate((prev) => {
        const newDates = { ...prev };
        delete newDates[id];
        return newDates;
      });
    }
  }, []);

  const handleNextTargetDateChange = useCallback((id, value) => {
    setNextTargetDate((prev) => ({ ...prev, [id]: value }));
  }, []);

  const fileToBase64 = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }, []);

  const toggleHistory = useCallback(() => {
    setShowHistory((prev) => !prev);
    resetFilters();
  }, [resetFilters]);

  const handleSubmit = async () => {
  const selectedItemsArray = Array.from(selectedItems);

  if (selectedItemsArray.length === 0) {
    alert("Please select at least one item to submit");
    return;
  }

  const missingStatus = selectedItemsArray.filter((id) => !statusData[id]);
  if (missingStatus.length > 0) {
    alert(
      `Please select a status for all selected items. ${missingStatus.length} item(s) are missing status.`
    );
    return;
  }

  const missingNextDate = selectedItemsArray.filter(
    (id) => statusData[id] === "Extend date" && !nextTargetDate[id]
  );
  if (missingNextDate.length > 0) {
    alert(
      `Please select a next target date for all items with "Extend date" status. ${missingNextDate.length} item(s) are missing target date.`
    );
    return;
  }

  const missingRequiredImages = selectedItemsArray.filter((id) => {
    const item = delegation.find((account) => account.task_id === id);
    const requiresAttachment =
      item.require_attachment &&
      item.require_attachment.toUpperCase() === "YES";
    return requiresAttachment && !uploadedImages[id] && !item.image;
  });

  if (missingRequiredImages.length > 0) {
    alert(
      `Please upload images for all required attachments. ${missingRequiredImages.length} item(s) are missing required images.`
    );
    return;
  }

  setIsSubmitting(true);

  try {
    // Prepare the selected data with proper status mapping
    const selectedData = selectedItemsArray.map((id) => {
      const item = delegation.find((account) => account.task_id === id);
      
      // Map status to database values
      const dbStatus = statusData[id] === "Done" ? "done" : 
                      statusData[id] === "Extend date" ? "extend" : 
                      statusData[id];

      return {
        task_id: item.task_id,
        department: item.department,
        given_by: item.given_by,
        name: item.name,
        task_description: item.task_description,
        task_start_date: item.task_start_date,
        planned_date: item.planned_date,
        status: dbStatus, // Use mapped status
        next_extend_date: statusData[id] === "Extend date" ? nextTargetDate[id] : null,
        reason: remarksData[id] || "",
        image_url: uploadedImages[id] ? null : item.image, // Will be updated after upload
        require_attachment: item.require_attachment,
        // Add submission timestamp
        submission_timestamp: new Date().toISOString()
      };
    });

    console.log("Selected Data for submission:", selectedData);

    // Process each task individually to ensure proper handling
    const submissionPromises = selectedData.map(async (taskData) => {
      const taskImage = uploadedImages[taskData.task_id];
      
      return dispatch(
        insertDelegationDoneAndUpdate({
          selectedDataArray: [taskData], // Send one task at a time
          uploadedImages: taskImage ? { [taskData.task_id]: taskImage } : {},
        })
      );
    });

    // Wait for all submissions to complete
    const results = await Promise.allSettled(submissionPromises);
    
    // Check for any failures
    const failedSubmissions = results.filter(result => result.status === 'rejected');
    
    if (failedSubmissions.length > 0) {
      console.error('Some submissions failed:', failedSubmissions);
      alert(`${failedSubmissions.length} out of ${selectedItemsArray.length} submissions failed. Please check the console for details.`);
    } else {
      setSuccessMessage(
        `Successfully submitted ${selectedItemsArray.length} task records!`
      );
    }

    // Reset form state
    setSelectedItems(new Set());
    setAdditionalData({});
    setRemarksData({});
    setStatusData({});
    setNextTargetDate({});
    
    // Refresh data
    setTimeout(() => {
      dispatch(delegationData());
      dispatch(delegation_DoneData());
    }, 1000);

  } catch (error) {
    console.error('Submission error:', error);
    alert('An error occurred during submission. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};

  const selectedItemsCount = selectedItems.size;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold tracking-tight text-purple-700">
            {showHistory
              ? CONFIG.PAGE_CONFIG.historyTitle
              : CONFIG.PAGE_CONFIG.title}
          </h1>

          <div className="flex space-x-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder={
                  showHistory ? "Search by Task ID..." : "Search tasks..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
<div className="flex items-center gap-2">
  <Filter className="h-4 w-4 text-gray-500" />
  <select
    value={dateFilter}
    onChange={(e) => setDateFilter(e.target.value)}
    className="border border-gray-300 rounded-md px-2 py-1 text-sm"
  >
    {filterOptions.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
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
                {isSubmitting
                  ? "Processing..."
                  : `Submit Selected (${selectedItemsCount})`}
              </button>
            )}
          </div>
        </div>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
              {successMessage}
            </div>
            <button
              onClick={() => setSuccessMessage("")}
              className="text-green-500 hover:text-green-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="rounded-lg border border-purple-200 shadow-md bg-white overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-4">
            <h2 className="text-purple-700 font-medium">
              {showHistory
                ? `Completed ${CONFIG.SOURCE_SHEET_NAME} Tasks`
                : `Pending ${CONFIG.SOURCE_SHEET_NAME} Tasks`}
            </h2>
            <p className="text-purple-600 text-sm">
              {showHistory
                ? `${CONFIG.PAGE_CONFIG.historyDescription} for ${
                    userRole === "admin" ? "all" : "your"
                  } tasks`
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
              <button
                className="underline ml-2"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
            </div>
          ) : showHistory ? (
            <>
              {/* Simplified History Filters - Only Date Range */}
              <div className="p-4 border-b border-purple-100 bg-gray-50">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <div className="mb-2 flex items-center">
                      <span className="text-sm font-medium text-purple-700">
                        Filter by Date Range:
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <label
                          htmlFor="start-date"
                          className="text-sm text-gray-700 mr-1"
                        >
                          From
                        </label>
                        <input
                          id="start-date"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="text-sm border border-gray-200 rounded-md p-1"
                        />
                      </div>
                      <div className="flex items-center">
                        <label
                          htmlFor="end-date"
                          className="text-sm text-gray-700 mr-1"
                        >
                          To
                        </label>
                        <input
                          id="end-date"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="text-sm border border-gray-200 rounded-md p-1"
                        />
                      </div>
                    </div>
                  </div>

                  {(startDate || endDate || searchTerm) && (
                    <button
                      onClick={resetFilters}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>

              {/* History Table with Proper Text Wrapping */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                        Task ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[250px]">
                        Task
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                        Next Target Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                        Remarks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                        Uploaded Image
                      </th>
                      {userRole === "admin" && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                          User
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                        Given By
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredHistoryData.length > 0 ? (
                      filteredHistoryData.map((history, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 min-w-[140px]">
                            <div className="text-sm font-medium text-gray-900 whitespace-normal break-words">
                              {formatDateTimeForDisplay(history.created_at) ||
                                "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 min-w-[100px]">
                            <div className="text-sm text-gray-900 whitespace-normal break-words">
                              {history.task_id || "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 min-w-[250px] max-w-[300px]">
                            <div
                              className="text-sm text-gray-900 whitespace-normal break-words leading-relaxed"
                              title={history.task_description}
                            >
                              {history.task_description || "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 min-w-[100px]">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full whitespace-normal ${
                                history.status === "done"
                                  ? "bg-green-100 text-green-800"
                                  : history.status === "extend"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {history.status || "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4 min-w-[140px]">
                            <div className="text-sm text-gray-900 whitespace-normal break-words">
                              {formatDateTimeForDisplay(
                                history.next_extend_date
                              ) || "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 bg-purple-50 min-w-[200px] max-w-[250px]">
                            <div
                              className="text-sm text-gray-900 whitespace-normal break-words leading-relaxed"
                              title={history.reason}
                            >
                              {history.reason || "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 min-w-[120px]">
                            {history.image_url ? (
                              <a
                                href={history.image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline flex items-center"
                              >
                                <img
                                  src={
                                    history.image_url ||
                                    "/api/placeholder/32/32"
                                  }
                                  alt="Attachment"
                                  className="h-8 w-8 object-cover rounded-md mr-2"
                                />
                                <span className="text-xs whitespace-normal break-words">
                                  View
                                </span>
                              </a>
                            ) : (
                              <span className="text-gray-400 text-xs">
                                No attachment
                              </span>
                            )}
                          </td>
                          {userRole === "admin" && (
                            <td className="px-6 py-4 min-w-[100px]">
                              <div className="text-sm text-gray-900 whitespace-normal break-words">
                                {history.name || "—"}
                              </div>
                            </td>
                          )}
                          <td className="px-6 py-4 min-w-[120px]">
                            <div className="text-sm text-gray-900 whitespace-normal break-words">
                              {history.given_by || "—"}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={userRole === "admin" ? 9 : 8}
                          className="px-6 py-4 text-center text-gray-500"
                        >
                          {searchTerm || startDate || endDate
                            ? "No historical records matching your filters"
                            : "No completed records found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* Regular Tasks Table with Proper Text Wrapping */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[50px]">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        checked={
                          filteredDelegationTasks.length > 0 &&
                          selectedItems.size === filteredDelegationTasks.length
                        }
                        onChange={handleSelectAllItems}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                      Task ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Given By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[250px]">
                      Task Description
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px] ${
                        !accountData["col17"] ? "bg-yellow-50" : ""
                      }`}
                    >
                      Task Start Date
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px] ${
                        !accountData["col17"] ? "bg-green-50" : ""
                      }`}
                    >
                      Planned Date
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px] ${
                        !accountData["col17"] ? "bg-blue-50" : ""
                      }`}
                    >
                      Status
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px] ${
                        !accountData["col17"] ? "bg-indigo-50" : ""
                      }`}
                    >
                      Next Target Date
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px] ${
                        !accountData["col17"] ? "bg-purple-50" : ""
                      }`}
                    >
                      Remarks
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px] ${
                        !accountData["col17"] ? "bg-orange-50" : ""
                      }`}
                    >
                      Upload Image
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDelegationTasks.length > 0 ? (
                    filteredDelegationTasks.map((account, index) => {
                      const isSelected = selectedItems.has(account.task_id);
                      const rowColorClass = getRowColor(account.color_code_for);
                      return (
                        <tr
                          key={index}
                          className={`${
                            isSelected ? "bg-purple-50" : ""
                          } hover:bg-gray-50 ${rowColorClass}`}
                        >
                          <td className="px-6 py-4 min-w-[50px]">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              checked={isSelected}
                              onChange={(e) =>
                                handleCheckboxClick(e, account.task_id)
                              }
                            />
                          </td>
                          <td className="px-6 py-4 min-w-[100px]">
                            <div className="text-sm text-gray-900 whitespace-normal break-words">
                              {account.task_id || "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 min-w-[120px]">
                            <div className="text-sm text-gray-900 whitespace-normal break-words">
                              {account.department || "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 min-w-[120px]">
                            <div className="text-sm text-gray-900 whitespace-normal break-words">
                              {account.given_by || "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 min-w-[120px]">
                            <div className="text-sm text-gray-900 whitespace-normal break-words">
                              {account.name || "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 min-w-[250px] max-w-[300px]">
                            <div
                              className="text-sm text-gray-900 whitespace-normal break-words leading-relaxed"
                              title={account.task_description}
                            >
                              {account.task_description || "—"}
                            </div>
                          </td>
                          <td
                            className={`px-6 py-4 min-w-[140px] ${
                              !account.color_code_for ? "bg-yellow-50" : ""
                            }`}
                          >
                            <div className="text-sm text-gray-900 whitespace-normal break-words">
                              {formatDateTimeForDisplay(
                                account.task_start_date
                              )}
                            </div>
                          </td>
                          <td
                            className={`px-6 py-4 min-w-[140px] ${
                              !account.color_code_for ? "bg-green-50" : ""
                            }`}
                          >
                            <div className="text-sm text-gray-900 whitespace-normal break-words">
                              {formatDateTimeForDisplay(account.planned_date)}
                            </div>
                          </td>
                          <td
                            className={`px-6 py-4 min-w-[120px] ${
                              !account.color_code_for ? "bg-blue-50" : ""
                            }`}
                          >
                            <select
                              disabled={!isSelected}
                              value={statusData[account.task_id] || ""}
                              onChange={(e) =>
                                handleStatusChange(
                                  account.task_id,
                                  e.target.value
                                )
                              }
                              className="border border-gray-300 rounded-md px-2 py-1 w-full disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                            >
                              <option value="">Select</option>
                              <option value="Done">Done</option>
                              <option value="Extend date">Extend date</option>
                            </select>
                          </td>
                          <td
                            className={`px-6 py-4 min-w-[140px] ${
                              !account.task_start_date ? "bg-indigo-50" : ""
                            }`}
                          >
                            <input
                              type="date"
                              disabled={
                                !isSelected ||
                                statusData[account.task_id] !== "Extend date"
                              }
                              value={nextTargetDate[account.task_id] || ""}
                              onChange={(e) => {
                                handleNextTargetDateChange(
                                  account.task_id,
                                  e.target.value
                                );
                              }}
                              className="border border-gray-300 rounded-md px-2 py-1 w-full disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                            />
                          </td>
                          <td
                            className={`px-6 py-4 min-w-[200px] max-w-[250px] ${
                              !account.task_start_date ? "bg-purple-50" : ""
                            }`}
                          >
                            <textarea
                              placeholder="Enter remarks"
                              disabled={!isSelected}
                              value={remarksData[account.task_id] || ""}
                              onChange={(e) =>
                                setRemarksData((prev) => ({
                                  ...prev,
                                  [account.task_id]: e.target.value,
                                }))
                              }
                              className="border rounded-md px-2 py-1 w-full border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm resize-none whitespace-normal"
                              rows="2"
                            />
                          </td>
                          <td
                            className={`px-6 py-4 min-w-[150px] ${
                              !account.task_start_date ? "bg-orange-50" : ""
                            }`}
                          >
                            {uploadedImages[account.task_id] ? (
                              <div className="flex items-center">
                                <img
                                  src={URL.createObjectURL(
                                    uploadedImages[account.task_id]
                                  )}
                                  alt="Receipt"
                                  className="h-10 w-10 object-cover rounded-md mr-2"
                                />
                                <div className="flex flex-col">
                                  <span className="text-xs text-gray-500 whitespace-normal break-words">
                                    {uploadedImages[account.task_id].name}
                                  </span>
                                  <span className="text-xs text-green-600">
                                    Ready to upload
                                  </span>
                                </div>
                              </div>
                            ) : account.image ? (
                              <div className="flex items-center">
                                <img
                                  src={account.image}
                                  alt="Receipt"
                                  className="h-10 w-10 object-cover rounded-md mr-2"
                                />
                                <div className="flex flex-col">
                                  <span className="text-xs text-gray-500 whitespace-normal break-words">
                                    Uploaded Receipt
                                  </span>
                                  <button
                                    className="text-xs text-purple-600 hover:text-purple-800"
                                    onClick={() =>
                                      window.open(account.image, "_blank")
                                    }
                                  >
                                    View Full Image
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <label
                                htmlFor={`file-upload-${account.task_id}`}
                                className={`flex items-center cursor-pointer ${
                                  account.require_attachment?.toUpperCase() ===
                                  "YES"
                                    ? "text-red-600 font-medium"
                                    : "text-purple-600"
                                } hover:text-purple-800`}
                              >
                                <Upload className="h-4 w-4 mr-1" />
                                <span className="text-xs whitespace-normal break-words">
                                  {account.require_attachment?.toUpperCase() ===
                                  "YES"
                                    ? "Required Upload"
                                    : "Upload Image"}
                                  {account.require_attachment?.toUpperCase() ===
                                    "YES" && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </span>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleImageUpload(account.task_id, e)
                                  }
                                  disabled={!isSelected}
                                  id={`file-upload-${account.task_id}`}
                                />
                              </label>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={12}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        {searchTerm
                          ? "No tasks matching your search"
                          : "No pending tasks found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default DelegationDataPage;
