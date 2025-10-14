import supabase from "../../SupabaseClient";

export const fetchUserDetailsApi = async () => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select('*, user_access, leave_date, remark') // Add user_access to the select
      .not("user_name", "is", null)
      .neq("user_name", "");

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


export const fetchDepartmentDataApi = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, department, given_by') 
      .not('department', 'is', null)     // Exclude null departments
      .neq('department', '')             // Exclude empty string departments
      .order('department', { ascending: true });

    if (error) {
      console.log("error when fetching data", error);
      return [];
    }

    // Filter unique combinations of department + given_by
    const uniqueDepartments = Array.from(
      new Map(
        data.map((item) => [`${item.department}-${item.given_by}`, item])
      ).values()
    );

    console.log("fetch successfully", uniqueDepartments);
    return uniqueDepartments;
  } catch (error) {
    console.log("error from supabase", error);
    return [];
  }
};



export const createUserApi = async (newUser) => {
  try {
    // Step 1: Get the current max ID
    const { data: maxIdData, error: maxIdError } = await supabase
      .from("users")
      .select("id")
      .order("id", { ascending: false })
      .limit(1);

    if (maxIdError) {
      console.error("Error fetching last ID:", maxIdError);
      return;
    }

    const lastId = maxIdData?.[0]?.id || 0; // default to 0 if no users yet
    const newId = lastId + 1;

    // Step 2: Insert user with new ID
     const { data, error } = await supabase
      .from("users")
      .insert([
        {
          id: newId,
          user_name: newUser.username,
          password: newUser.password,
          email_id: newUser.email,
          number: newUser.phone,
          role: newUser.role,
          status: newUser.status,
          user_access: newUser.user_access // Add this line
        }
      ]);

    if (error) {
      console.log("Error when posting data:", error);
    } else {
      console.log("Posted successfully", data);
    }

    return data;
  } catch (error) {
    console.log("Error from Supabase:", error);
  }
};

export const updateUserDataApi = async ({ id, updatedUser }) => {
  try {
    const updateData = {
      user_name: updatedUser.user_name,
      password: updatedUser.password,
      email_id: updatedUser.email_id,
      number: updatedUser.number,
      role: updatedUser.role,
      status: updatedUser.status,
      user_access: updatedUser.user_access
    };

    // Add leave data if provided
    if (updatedUser.leave_date !== undefined) {
      updateData.leave_date = updatedUser.leave_date;
    }
    if (updatedUser.remark !== undefined) {
      updateData.remark = updatedUser.remark;
    }

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.log("Error when update data", error);
      throw error;
    }

    console.log("update successfully", data);
    return data;
  } catch (error) {
    console.log("Error from Supabase", error);
    throw error;
  }
};


export const createDepartmentApi = async (newDept) => {
  try {
    // Step 1: Get the current max ID
    const { data: maxIdData, error: maxIdError } = await supabase
      .from("users")
      .select("id")
      .order("id", { ascending: false })
      .limit(1);

    if (maxIdError) {
      console.error("Error fetching last ID:", maxIdError);
      return;
    }

    const lastId = maxIdData?.[0]?.id || 0; // default to 0 if no users yet
    const newId = lastId + 1;

    // Step 2: Insert user with new ID
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          id: newId, // 👈 manually setting the next ID
         department:newDept.name,
         given_by:newDept.givenBy,
        }
      ]);

    if (error) {
      console.log("Error when posting data:", error);
    } else {
      console.log("Posted successfully", data);
    }

    return data;
  } catch (error) {
    console.log("Error from Supabase:", error);
  }
};

export const updateDepartmentDataApi = async ({id, updatedDept}) => {
  console.log(updatedDept);
  
  try {
    if (!updatedDept || !updatedDept.department || !updatedDept.given_by) {
      throw new Error("Missing department or given_by data");
    }

    const { data, error } = await supabase
      .from("users")
      .update({
        department: updatedDept.department,
        given_by: updatedDept.given_by,
      })
      .eq("id", id);

    if (error) {
      console.log("Error when updating data", error);
      throw error;
    }

    console.log("Updated successfully", data);
    return data;
  } catch (error) {
    console.log("Error from Supabase", error);
    throw error;
  }
};


export const deleteUserByIdApi = async (id) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .delete()
      .eq("id", id);

    if (error) {
      console.log("Error deleting user:", error);
      throw error;
    }

    console.log("User deleted successfully:", data);
    return data;
  } catch (error) {
    console.log("Error from Supabase:", error);
    throw error;
  }
};
