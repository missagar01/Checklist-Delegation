// checkListApi.js
// const BASE_URL = "http://localhost:5050/api/checklist";
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/checklist`;

// =======================================================
// 1️⃣ Fetch Pending Checklist (AWS Backend)
// =======================================================
export const fetchChechListDataSortByDate = async (page = 1) => {
  const username = localStorage.getItem("user-name");
  const role = localStorage.getItem("role");

  const response = await fetch(
    `${BASE_URL}/pending?page=${page}&username=${username}&role=${role}`
  );

  return await response.json();
};


// =======================================================
// 2️⃣ Fetch Checklist History (AWS Backend)
// =======================================================
export const fetchChechListDataForHistory = async (page = 1) => {
  const username = localStorage.getItem("user-name");
  const role = localStorage.getItem("role");

  const response = await fetch(
    `${BASE_URL}/history?page=${page}&username=${username}&role=${role}`
  );

  return (await response.json()).data || [];
};


// =======================================================
// 3️⃣ Submit Checklist (AWS Backend)
// =======================================================
export const updateChecklistData = async (submissionData) => {
  try {
    const response = await fetch(`${BASE_URL}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submissionData),
    });

    if (!response.ok) {
      throw new Error("Update failed");
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.error("❌ Error Updating Checklist:", error);
    throw error;
  }
};

// =======================================================
// 4️⃣ Admin Done API (AWS Backend)
// =======================================================
export const postChecklistAdminDoneAPI = async (selectedItems) => {
  try {
    const response = await fetch(`${BASE_URL}/admin-done`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selectedItems),
    });

    const json = await response.json();
    return json;
  } catch (error) {
    console.error("❌ Error Marking Admin Done:", error);
    return { error };
  }
};
