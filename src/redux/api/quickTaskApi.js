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

// New function to update checklist task - matches department, name, task_description
export const updateChecklistTaskApi = async (updatedTask, originalTask) => {
  try {
    console.log("Updating with:", { updatedTask, originalTask }); // Debug log
    
    const { data, error } = await supabase
      .from("checklist")
      .update({
        department: updatedTask.department,
        given_by: updatedTask.given_by,
        name: updatedTask.name,
        task_description: updatedTask.task_description,
        // task_start_date: updatedTask.task_start_date,
        // frequency: updatedTask.frequency,
        enable_reminder: updatedTask.enable_reminder,
        require_attachment: updatedTask.require_attachment,
        remark: updatedTask.remark
      })
      .eq("department", originalTask.department)
      .eq("name", originalTask.name)
      .eq("task_description", originalTask.task_description)
      .is("submission_date", null)
      .select();

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    console.log("Update successful:", data);
    return data;

  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};
