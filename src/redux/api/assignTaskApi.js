import supabase from "../../SupabaseClient";

export const fetchUniqueDepartmentDataApi = async (user_name) => {
  try {
    // 1. Get the logged-in user's role + access
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role, user_access")
      .eq("user_name", user_name)
      .single();

    if (userError || !userData) {
      console.error("Error fetching user role:", userError);
      return [];
    }

    // 2. If admin → show all departments
    if (userData.role === "admin") {
      const { data, error } = await supabase
        .from("users")
        .select("department")
        .not("department", "is", null)
        .order("department", { ascending: true });

      if (error) {
        console.error("Error fetching departments:", error);
        return [];
      }

      const uniqueDepartments = [...new Set(data.map((d) => d.department))];
      console.log("Admin departments:", uniqueDepartments);
      return uniqueDepartments;
    }

    // 3. If user → show only their own department
    if (userData.role === "user") {
      const { data, error } = await supabase
        .from("users")
        .select("department")
        .ilike("department", userData.user_access) // ✅ match exact department
        .not("department", "is", null);

      if (error) {
        console.error("Error fetching restricted department:", error);
        return [];
      }

      const uniqueDepartments = [...new Set(data.map((d) => d.department))];
      console.log("User restricted department:", uniqueDepartments);
      return uniqueDepartments;
    }

    return [];
  } catch (error) {
    console.error("Error from Supabase:", error);
    return [];
  }
};




export const fetchUniqueGivenByDataApi = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('given_by')
      .not('given_by', 'is', null)
      .order('given_by', { ascending: true });


    const uniqueGivenBy = [...new Set(data.map(d => d.given_by))];

    if (!error) {
      console.log("fetch succefully", uniqueGivenBy)

    } else {
      console.log("error when fetching data", error)
    }
    return uniqueGivenBy;
  } catch (error) {
    console.log("error from supabase", error);

  }
}

export const fetchUniqueDoerNameDataApi = async (department) => {
  try {
    console.log("Department passed:", department);

    const { data, error } = await supabase
      .from("users")
      .select("user_name, role, user_access")
      .or(`user_access.ilike.%${department}%,role.eq.admin`) // ✅ match department OR admin role
      .eq("status", "active")
      .eq("role", "user") // only active users
      .order("user_name", { ascending: true });

    const uniqueDoerName = [...new Set(data?.map((d) => d.user_name))];

    if (!error) {
      console.log("Fetched successfully", uniqueDoerName);
    } else {
      console.log("Error when fetching data", error);
    }
    return uniqueDoerName;
  } catch (error) {
    console.log("Error from Supabase", error);
  }
};



export const pushAssignTaskApi = async (generatedTasks) => {
  const submitTable =
    generatedTasks[0]?.frequency === "one-time" ? "delegation" : "checklist";


  const tasksData = generatedTasks.map((task) => ({
    department: task.department,
    given_by: task.givenBy,
    name: task.doer,
    task_description: task.description,
    task_start_date: task.dueDate,
    frequency: task.frequency,
    enable_reminder: task.enableReminders ? "Yes" : "No",
    require_attachment: task.requireAttachment ? "Yes" : "No",
  }));


  try {
    const { data, error } = await supabase
      .from(submitTable)
      .insert(tasksData);

    if (!error) {
      console.log("post succefully", data)

    } else {
      console.log("error when posting data", error)
    }
    return data;
  } catch (error) {
    console.log("error from supabase", error);

  }
}


