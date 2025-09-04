import supabase from "../../SupabaseClient";

export const fetchChecklistData = async () => {
  try {
    const { data, error } = await supabase
      .from('checklist')
      .select('*')
       .order("task_start_date", { ascending: true }); 

    if (error) {
      console.log("Error when fetching data", error);
      return [];
    }

    const seen = new Set();
    const uniqueRows = data.filter(row => {
      if (seen.has(row.task_description)) return false;
      seen.add(row.task_description);
      return true;
    });

    console.log("Fetched successfully", uniqueRows);
    return uniqueRows;

  } catch (error) {
    console.log("Error from Supabase", error);
    return [];
  }
};



export const fetchDelegationData = async () => {
  try {
    const { data, error } = await supabase
      .from('delegation')
      .select('*')
      .order('task_id', { ascending: true });
      

    if (error) {
      console.log("Error when fetching data", error);
      return [];
    }

    const seen = new Set();
    const uniqueRows = data.filter(row => {
      if (seen.has(row.task_description)) return false;
      seen.add(row.task_description);
      return true;
    });

    console.log("Fetched successfully", uniqueRows);
    return uniqueRows;

  } catch (error) {
    console.log("Error from Supabase", error);
    return [];
  }
};

export const deleteChecklistTasksApi = async (tasks) => {
  for (const task of tasks) {
    const { error } = await supabase
      .from("checklist")
      .delete()
      .eq("name", task.name)
      .eq("task_description", task.task_description)
      .is("submission_date", null); // only delete if submission_date is null

    if (error) throw error;
  }
  return tasks;
};


export const deleteDelegationTasksApi = async (taskIds) => {
  const { error } = await supabase
    .from("delegation")
    .delete()
    .in("task_id", taskIds)
    .is("submission_date", null); // ✅ only delete if submission_date IS NULL

  if (error) throw error;
  return taskIds;
};
