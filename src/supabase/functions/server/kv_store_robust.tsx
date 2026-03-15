import { createClient } from "npm:@supabase/supabase-js@2";

const client = () => createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
);

const TABLE_NAME = "kv_store_c142e950";

// Set stores a key-value pair in the database.
export const set = async (key: string, value: any): Promise<void> => {
  const supabase = client();
  const { error } = await supabase.from(TABLE_NAME).upsert({
    key,
    value
  });
  if (error) {
    throw new Error(error.message);
  }
};

// Get retrieves a key-value pair from the database.
export const get = async (key: string): Promise<any> => {
  const supabase = client();
  const { data, error } = await supabase.from(TABLE_NAME).select("value").eq("key", key).maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data?.value;
};

// Delete deletes a key-value pair from the database.
export const del = async (key: string): Promise<void> => {
  const supabase = client();
  const { error } = await supabase.from(TABLE_NAME).delete().eq("key", key);
  if (error) {
    throw new Error(error.message);
  }
};

// Sets multiple key-value pairs in the database.
export const mset = async (keys: string[], values: any[]): Promise<void> => {
  const supabase = client();
  const { error } = await supabase.from(TABLE_NAME).upsert(keys.map((k, i) => ({ key: k, value: values[i] })));
  if (error) {
    throw new Error(error.message);
  }
};

// Gets multiple key-value pairs from the database.
export const mget = async (keys: string[]): Promise<any[]> => {
  const supabase = client();
  const { data, error } = await supabase.from(TABLE_NAME).select("value").in("key", keys);
  if (error) {
    throw new Error(error.message);
  }
  return data?.map((d: any) => d.value) ?? [];
};

// Deletes multiple key-value pairs from the database.
export const mdel = async (keys: string[]): Promise<void> => {
  const supabase = client();
  const { error } = await supabase.from(TABLE_NAME).delete().in("key", keys);
  if (error) {
    throw new Error(error.message);
  }
};

// Search for key-value pairs by prefix (Robust / Paginated)
export const getByPrefix = async (prefix: string): Promise<any[]> => {
  const supabase = client();
  const chunkSize = 500;
  let allValues: any[] = [];
  let from = 0;
  let fetchMore = true;

  // console.log(`Starting paginated fetch for prefix: ${prefix}`);

  while (fetchMore) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("key, value")
      .like("key", prefix + "%")
      .range(from, from + chunkSize - 1)
      .order("key", { ascending: true });

    if (error) {
      console.error(`Error fetching prefix ${prefix} at range ${from}-${from+chunkSize-1}:`, error);
      throw new Error(error.message);
    }

    if (data && data.length > 0) {
      const values = data.map((d: any) => d.value);
      allValues = allValues.concat(values);
      
      // console.log(`Fetched ${values.length} items (Total: ${allValues.length})`);

      if (data.length < chunkSize) {
        fetchMore = false;
      } else {
        from += chunkSize;
      }
    } else {
      fetchMore = false;
    }
  }
  
  return allValues;
};
