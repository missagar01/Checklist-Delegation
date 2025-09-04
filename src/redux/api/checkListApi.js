import supabase from "../../SupabaseClient";

export const fetchChechListDataSortByDate = async () => {
const role=localStorage.getItem('role');
const username=localStorage.getItem('user-name')

  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    
    const endOfTomorrow = new Date();
    endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
    endOfTomorrow.setHours(23, 59, 59, 999);
    const endOfTomorrowISO = endOfTomorrow.toISOString();

    const endOfToday = new Date();
endOfToday.setHours(23, 59, 59, 999);
const endOfTodayISO = endOfToday.toISOString();

    let query = supabase
      .from('checklist')
      .select('*')
      .lte('task_start_date', endOfTodayISO)
      .order('task_start_date', { ascending: true })
      .is("submission_date", null)
      .is("status", null)

    // Apply role filter
    if (role === 'user' && username) {
      query = query.eq('name', username);
    }

    const { data, error } = await query;

    if (error) {
      console.log("Error when fetching data", error);
      return [];
    }

    console.log("Fetched successfully", data);
    return data;

  } catch (error) {
    console.log("Error from Supabase", error);
    return [];
  }
};


export const fetchChechListDataForHistory = async () => {
const role=localStorage.getItem('role');
const username=localStorage.getItem('user-name')

  const today = new Date();
  const startOfToday = new Date(today.setHours(0, 0, 0, 0)).toISOString(); // Today 00:00:00

  const endOfTomorrow = new Date();
  endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
  endOfTomorrow.setHours(23, 59, 59, 999); // Tomorrow 23:59:59
  const endOfTomorrowISO = endOfTomorrow.toISOString();

  try {
    let query = supabase
      .from('checklist')
      .select('*')
      .order('task_start_date', { ascending: true })
      .lte('task_start_date', endOfTomorrowISO)
      .not('submission_date', 'is', null)
      .not('status', 'is', null);

    if (role === 'user' && username) {
      query = query.eq('name', username);
    }

    const { data, error } = await query;

    if (error) {
      console.log("Error when fetching data", error);
      return [];
    }

    console.log("Fetched successfully", data);
    return data;

  } catch (error) {
    console.log("Error from Supabase", error);
    return [];
  }
};



export const updateChecklistData = async (submissionData) => {
  try {
    // Validate input data
    if (!Array.isArray(submissionData) || submissionData.length === 0) {
      throw new Error('Invalid submission data');
    }

    const updates = await Promise.all(submissionData.map(async (item) => {
      let imageUrl = null;

      // Handle image upload if it exists
      if (item.image && item.image.previewUrl) {
        try {
          // 1. Convert blob URL to actual file
          const response = await fetch(item.image.previewUrl);
          const blob = await response.blob();
          const file = new File([blob], item.image.name, { type: item.image.type });

          // 2. Generate unique file path
          const fileExt = item.image.name.split('.').pop();
          const fileName = `${crypto.randomUUID()}.${fileExt}`;
          const filePath = `task-${item.taskId}/${fileName}`;

          // 3. Upload to Supabase storage
          const { error: uploadError } = await supabase.storage
            .from('checklist')
            .upload(filePath, file, {
              cacheControl: '3600',
              contentType: item.image.type,
              upsert: false
            });

          if (uploadError) throw uploadError;

          // 4. Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('checklist')
            .getPublicUrl(filePath);

          if (!publicUrl) throw new Error('Failed to generate public URL');
          
          imageUrl = publicUrl;
          console.log('Image uploaded successfully:', imageUrl);
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }
      }

      // Prepare update object
      return {
        task_id: item.taskId,
        status: item.status , // Convert to boolean if needed
        remark: item.remarks,
        submission_date: new Date().toISOString(),
        image: imageUrl,
        // // Add other fields as needed
        // department: item.department,
        // task_description: item.taskDescription,
        // given_by: item.givenBy
      };
    }));

    // 5. Update checklist table
    const { data, error } = await supabase
      .from('checklist')
      .upsert(updates, { onConflict: ['task_id'] });

    if (error) throw error;

    console.log('Checklist updated successfully:', data);
    return data;

  } catch (error) {
    console.error('Error in updateChecklistData:', error);
    throw new Error(`Failed to update checklist: ${error.message}`);
  }
};


export const postChecklistAdminDoneAPI = async (selectedHistoryItems) => {
  try {
    if (!selectedHistoryItems || selectedHistoryItems.length === 0) {
      console.log("No items selected for marking as done");
      return { error: "No items selected" };
    }

    // Get current timestamp for admin_done column
    // const currentDate = new Date();
    // const formattedDate = currentDate.toISOString(); // Or format as needed

    // Prepare the updates
    const updates = selectedHistoryItems.map(item => ({
      task_id: item.task_id, // Assuming each item has an 'id' field
      admin_done: "Done",
      // You can add other fields to update if needed
    }));

    // Perform the update in Supabase
    const { data, error } = await supabase
      .from('checklist')
      .upsert(updates) // Using upsert to update existing records
      .select();

    if (error) {
      console.error("Error updating checklist items:", error);
      return { error };
    }

    console.log("Successfully updated items:", data);
    return { data };
    
  } catch (error) {
    console.error("Error in supabase operation:", error);
    return { error };
  }
};