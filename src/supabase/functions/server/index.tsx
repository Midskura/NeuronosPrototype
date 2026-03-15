import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store_robust.tsx";
import { db, splitForInsert, mergeFromRow } from "./db.ts";
import * as accountingHandlers from "./accounting-handlers.tsx";
import * as newAccounting from "./accounting-new-api.ts";
import * as coaSeeder from "./seed_coa_balance_sheet.tsx";
import * as coaSeederIS from "./seed_coa_income_statement.tsx";
import * as catalogHandlers from "./catalog-handlers.tsx";
import { seedComprehensiveData } from "./seed_data.tsx";

const app = new Hono();

// Initialize Supabase client for storage
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Only initialize Supabase client if credentials are available
let supabase: any = null;
if (supabaseUrl && supabaseServiceKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("✅ Supabase client initialized for storage");
  } catch (error) {
    console.error("Error initializing Supabase client:", error);
  }
}

// Initialize storage bucket for comment attachments
const COMMENT_ATTACHMENTS_BUCKET = "make-c142e950-comment-attachments";

// Create bucket on startup if it doesn't exist (don't block server startup)
if (supabase) {
  (async () => {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some((bucket: any) => bucket.name === COMMENT_ATTACHMENTS_BUCKET);
      
      if (!bucketExists) {
        const { error } = await supabase.storage.createBucket(COMMENT_ATTACHMENTS_BUCKET, {
          public: false,
          fileSizeLimit: 52428800, // 50MB limit
        });
        
        if (error) {
          // Ignore "already exists" error (409)
          if ((error as any).statusCode === "409" || error.message?.includes("already exists")) {
            console.log("✅ Comment attachments bucket already exists (caught error):", COMMENT_ATTACHMENTS_BUCKET);
          } else {
            console.error("Error creating comment attachments bucket:", error);
          }
        } else {
          console.log("✅ Created comment attachments bucket:", COMMENT_ATTACHMENTS_BUCKET);
        }
      } else {
        console.log("✅ Comment attachments bucket already exists:", COMMENT_ATTACHMENTS_BUCKET);
      }
    } catch (error) {
      console.error("Error initializing storage bucket:", error);
    }
  })();
}

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-c142e950/health", (c) => {
  return c.json({ status: "ok" });
});

// ==================== AUTH & USERS API ====================

// Login endpoint [RELATIONAL]
app.post("/make-server-c142e950/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    const { data: user, error } = await db.from("users").select("*").eq("email", email).maybeSingle();
    if (error) throw error;
    
    if (!user) {
      console.log(`Login failed: User not found for email ${email}`);
      return c.json({ success: false, error: "Invalid email or password" }, 401);
    }
    
    if (user.password !== password) {
      console.log(`Login failed: Invalid password for email ${email}`);
      return c.json({ success: false, error: "Invalid email or password" }, 401);
    }
    
    if (!user.is_active) {
      console.log(`Login failed: User account is inactive for email ${email}`);
      return c.json({ success: false, error: "Account is inactive" }, 401);
    }
    
    const { password: _, ...userWithoutPassword } = user;
    console.log(`Login successful: ${user.email} (${user.department} ${user.role})`);
    
    return c.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    console.error("Error during login:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get current user (session check) [RELATIONAL]
app.get("/make-server-c142e950/auth/me", async (c) => {
  try {
    const userId = c.req.query("user_id");
    if (!userId) {
      return c.json({ success: false, error: "User ID required" }, 400);
    }
    
    const { data: user, error } = await db.from("users").select("*").eq("id", userId).maybeSingle();
    if (error) throw error;
    
    if (!user) {
      return c.json({ success: false, error: "User not found" }, 404);
    }
    
    const { password: _, ...userWithoutPassword } = user;
    return c.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get all users (with optional filters) [RELATIONAL]
app.get("/make-server-c142e950/users", async (c) => {
  try {
    const department = c.req.query("department");
    const role = c.req.query("role");
    const service_type = c.req.query("service_type");
    const operations_role = c.req.query("operations_role");
    
    let query = db.from("users").select("*").eq("is_active", true);
    if (department) query = query.eq("department", department);
    if (role) query = query.eq("role", role);
    if (service_type) query = query.eq("service_type", service_type);
    if (operations_role) query = query.eq("operations_role", operations_role);
    query = query.order("name", { ascending: true });
    
    const { data: users, error } = await query;
    if (error) throw error;
    
    const usersWithoutPasswords = (users || []).map((u: any) => {
      const { password: _, ...rest } = u;
      return rest;
    });
    
    console.log(`Fetched ${usersWithoutPasswords.length} users (department: ${department || 'all'}, role: ${role || 'all'}, service_type: ${service_type || 'all'}, operations_role: ${operations_role || 'all'})`);
    
    return c.json({ success: true, data: usersWithoutPasswords });
  } catch (error) {
    console.error("Error fetching users:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== NEW ACCOUNTING API ====================

app.get("/make-server-c142e950/accounts", (c) => newAccounting.getAccounts(c));
app.post("/make-server-c142e950/accounts", (c) => newAccounting.saveAccount(c));
app.delete("/make-server-c142e950/accounts/:id", (c) => newAccounting.deleteAccount(c));

app.get("/make-server-c142e950/transactions", (c) => newAccounting.getTransactions(c));
app.post("/make-server-c142e950/transactions", (c) => newAccounting.saveTransaction(c));

// Seed Chart of Accounts (Balance Sheet)
app.post("/make-server-c142e950/seed/coa-balance-sheet", async (c) => {
  try {
    const result = await coaSeeder.seedBalanceSheet();
    return c.json(result);
  } catch (error) {
    console.error("Error seeding COA:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Seed Chart of Accounts (Income Statement)
app.post("/make-server-c142e950/seed/coa-income-statement", async (c) => {
  try {
    const result = await coaSeederIS.seedIncomeStatement();
    return c.json(result);
  } catch (error) {
    console.error("Error seeding Income Statement COA:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Seed initial users (development only - call once to set up test users)
app.post("/make-server-c142e950/users/seed", async (c) => {
  try {
    // First, clear existing users to avoid duplicates
    // Clear existing users before re-seeding
    await db.from("users").delete().neq("id", "");
    
    const seedUsers = [
      {
        id: "user-bd-rep-001",
        email: "bd.rep@neuron.ph",
        password: "password123", // In production, hash this!
        name: "Juan Dela Cruz",
        department: "Business Development",
        role: "rep",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-bd-manager-001",
        email: "bd.manager@neuron.ph",
        password: "password123",
        name: "Maria Santos",
        department: "Business Development",
        role: "manager",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-pd-rep-001",
        email: "pd.rep@neuron.ph",
        password: "password123",
        name: "Pedro Reyes",
        department: "Pricing",
        role: "rep",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-pd-manager-001",
        email: "pd.manager@neuron.ph",
        password: "password123",
        name: "Ana Garcia",
        department: "Pricing",
        role: "manager",
        created_at: new Date().toISOString(),
        is_active: true
      },
      // ===== FORWARDING TEAM =====
      {
        id: "user-ops-fwd-manager-001",
        email: "fwd.manager@neuron.ph",
        password: "password123",
        name: "Carlos Mendoza",
        department: "Operations",
        role: "manager",
        service_type: "Forwarding",
        operations_role: "Manager",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-ops-fwd-supervisor-001",
        email: "fwd.supervisor1@neuron.ph",
        password: "password123",
        name: "Maria Santos",
        department: "Operations",
        role: "rep",
        service_type: "Forwarding",
        operations_role: "Supervisor",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-ops-fwd-supervisor-002",
        email: "fwd.supervisor2@neuron.ph",
        password: "password123",
        name: "Ricardo Cruz",
        department: "Operations",
        role: "rep",
        service_type: "Forwarding",
        operations_role: "Supervisor",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-ops-fwd-handler-001",
        email: "fwd.handler1@neuron.ph",
        password: "password123",
        name: "Juan Dela Cruz",
        department: "Operations",
        role: "rep",
        service_type: "Forwarding",
        operations_role: "Handler",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-ops-fwd-handler-002",
        email: "fwd.handler2@neuron.ph",
        password: "password123",
        name: "Anna Reyes",
        department: "Operations",
        role: "rep",
        service_type: "Forwarding",
        operations_role: "Handler",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-ops-fwd-handler-003",
        email: "fwd.handler3@neuron.ph",
        password: "password123",
        name: "Miguel Torres",
        department: "Operations",
        role: "rep",
        service_type: "Forwarding",
        operations_role: "Handler",
        created_at: new Date().toISOString(),
        is_active: true
      },
      // ===== BROKERAGE TEAM =====
      {
        id: "user-ops-brk-manager-001",
        email: "brk.manager@neuron.ph",
        password: "password123",
        name: "Linda Villanueva",
        department: "Operations",
        role: "manager",
        service_type: "Brokerage",
        operations_role: "Manager",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-ops-brk-supervisor-001",
        email: "brk.supervisor1@neuron.ph",
        password: "password123",
        name: "Roberto Gonzales",
        department: "Operations",
        role: "rep",
        service_type: "Brokerage",
        operations_role: "Supervisor",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-ops-brk-supervisor-002",
        email: "brk.supervisor2@neuron.ph",
        password: "password123",
        name: "Elena Martinez",
        department: "Operations",
        role: "rep",
        service_type: "Brokerage",
        operations_role: "Supervisor",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-ops-brk-handler-001",
        email: "brk.handler1@neuron.ph",
        password: "password123",
        name: "Paolo Fernandez",
        department: "Operations",
        role: "rep",
        service_type: "Brokerage",
        operations_role: "Handler",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-ops-brk-handler-002",
        email: "brk.handler2@neuron.ph",
        password: "password123",
        name: "Cristina Lopez",
        department: "Operations",
        role: "rep",
        service_type: "Brokerage",
        operations_role: "Handler",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-ops-brk-handler-003",
        email: "brk.handler3@neuron.ph",
        password: "password123",
        name: "Daniel Ramos",
        department: "Operations",
        role: "rep",
        service_type: "Brokerage",
        operations_role: "Handler",
        created_at: new Date().toISOString(),
        is_active: true
      },
      // ===== TRUCKING TEAM =====
      {
        id: "user-ops-trk-manager-001",
        email: "trk.manager@neuron.ph",
        password: "password123",
        name: "Antonio Dela Rosa",
        department: "Operations",
        role: "manager",
        service_type: "Trucking",
        operations_role: "Manager",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-ops-trk-supervisor-001",
        email: "trk.supervisor1@neuron.ph",
        password: "password123",
        name: "Josephine Garcia",
        department: "Operations",
        role: "rep",
        service_type: "Trucking",
        operations_role: "Supervisor",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-ops-trk-supervisor-002",
        email: "trk.supervisor2@neuron.ph",
        password: "password123",
        name: "Ramon Vasquez",
        department: "Operations",
        role: "rep",
        service_type: "Trucking",
        operations_role: "Supervisor",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-ops-trk-handler-001",
        email: "trk.handler1@neuron.ph",
        password: "password123",
        name: "Benjamin Santos",
        department: "Operations",
        role: "rep",
        service_type: "Trucking",
        operations_role: "Handler",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-ops-trk-handler-002",
        email: "trk.handler2@neuron.ph",
        password: "password123",
        name: "Isabella Cruz",
        department: "Operations",
        role: "rep",
        service_type: "Trucking",
        operations_role: "Handler",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-ops-trk-handler-003",
        email: "trk.handler3@neuron.ph",
        password: "password123",
        name: "Gabriel Morales",
        department: "Operations",
        role: "rep",
        service_type: "Trucking",
        operations_role: "Handler",
        created_at: new Date().toISOString(),
        is_active: true
      },
      // ===== MARINE INSURANCE TEAM =====
      {
        id: "user-ops-mar-manager-001",
        email: "mar.manager@neuron.ph",
        password: "password123",
        name: "Patricia Alvarez",
        department: "Operations",
        role: "manager",
        service_type: "Marine Insurance",
        operations_role: "Manager",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-ops-mar-supervisor-001",
        email: "mar.supervisor1@neuron.ph",
        password: "password123",
        name: "Fernando Aquino",
        department: "Operations",
        role: "rep",
        service_type: "Marine Insurance",
        operations_role: "Supervisor",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-ops-mar-supervisor-002",
        email: "mar.supervisor2@neuron.ph",
        password: "password123",
        name: "Sandra Flores",
        department: "Operations",
        role: "rep",
        service_type: "Marine Insurance",
        operations_role: "Supervisor",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-ops-mar-handler-001",
        email: "mar.handler1@neuron.ph",
        password: "password123",
        name: "Luis Mendez",
        department: "Operations",
        role: "rep",
        service_type: "Marine Insurance",
        operations_role: "Handler",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-ops-mar-handler-002",
        email: "mar.handler2@neuron.ph",
        password: "password123",
        name: "Carmen Rivera",
        department: "Operations",
        role: "rep",
        service_type: "Marine Insurance",
        operations_role: "Handler",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-ops-mar-handler-003",
        email: "mar.handler3@neuron.ph",
        password: "password123",
        name: "Oscar Diaz",
        department: "Operations",
        role: "rep",
        service_type: "Marine Insurance",
        operations_role: "Handler",
        created_at: new Date().toISOString(),
        is_active: true
      },
      // ===== OTHERS TEAM =====
      {
        id: "user-ops-oth-manager-001",
        email: "oth.manager@neuron.ph",
        password: "password123",
        name: "Victoria Castro",
        department: "Operations",
        role: "manager",
        service_type: "Others",
        operations_role: "Manager",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-ops-oth-supervisor-001",
        email: "oth.supervisor1@neuron.ph",
        password: "password123",
        name: "Rodrigo Salazar",
        department: "Operations",
        role: "rep",
        service_type: "Others",
        operations_role: "Supervisor",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-ops-oth-supervisor-002",
        email: "oth.supervisor2@neuron.ph",
        password: "password123",
        name: "Margarita Herrera",
        department: "Operations",
        role: "rep",
        service_type: "Others",
        operations_role: "Supervisor",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-ops-oth-handler-001",
        email: "oth.handler1@neuron.ph",
        password: "password123",
        name: "Alfredo Jimenez",
        department: "Operations",
        role: "rep",
        service_type: "Others",
        operations_role: "Handler",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-ops-oth-handler-002",
        email: "oth.handler2@neuron.ph",
        password: "password123",
        name: "Teresa Castillo",
        department: "Operations",
        role: "rep",
        service_type: "Others",
        operations_role: "Handler",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-ops-oth-handler-003",
        email: "oth.handler3@neuron.ph",
        password: "password123",
        name: "Francisco Navarro",
        department: "Operations",
        role: "rep",
        service_type: "Others",
        operations_role: "Handler",
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: "user-exec-001",
        email: "executive@neuron.ph",
        password: "password123",
        name: "Sofia Rodriguez",
        department: "Executive",
        role: "director",
        created_at: new Date().toISOString(),
        is_active: true
      }
    ];
    
    // Save each user to relational DB [RELATIONAL]
    const { error: upsertError } = await db.from("users").upsert(seedUsers, { onConflict: "id" });
    if (upsertError) throw upsertError;
    for (const user of seedUsers) {
      console.log(`Seeded user: ${user.email} (${user.department} ${user.role})`);
    }
    
    return c.json({ 
      success: true, 
      message: `Seeded ${seedUsers.length} users successfully`,
      summary: {
        users: seedUsers.length
      },
      users: seedUsers.map(u => ({ email: u.email, department: u.department, role: u.role }))
    });
  } catch (error) {
    console.error("Error seeding users:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Seed client handler preferences (development only)
app.post("/make-server-c142e950/client-handler-preferences/seed", async (c) => {
  try {
    // Clear existing preferences [RELATIONAL]
    await db.from("client_handler_preferences").delete().neq("id", "");
    
    const now = new Date().toISOString();
    
    const seedPreferences = [
      {
        id: "pref-001",
        customer_id: "CUST-001", // Pacific Electronics Manufacturing Corp.
        service_type: "Forwarding",
        preferred_manager_id: "user-ops-fwd-manager-001",
        preferred_manager_name: "Carlos Mendoza",
        preferred_supervisor_id: "user-ops-fwd-supervisor-001",
        preferred_supervisor_name: "Maria Santos",
        preferred_handler_id: "user-ops-fwd-handler-001",
        preferred_handler_name: "Juan Dela Cruz",
        created_at: now,
        updated_at: now
      },
      {
        id: "pref-002",
        customer_id: "CUST-002", // Manila Fashion Distributors Inc.
        service_type: "Brokerage",
        preferred_manager_id: "user-ops-brk-manager-001",
        preferred_manager_name: "Linda Villanueva",
        preferred_supervisor_id: "user-ops-brk-supervisor-001",
        preferred_supervisor_name: "Roberto Gonzales",
        preferred_handler_id: "user-ops-brk-handler-002",
        preferred_handler_name: "Cristina Lopez",
        created_at: now,
        updated_at: now
      },
      {
        id: "pref-003",
        customer_id: "CUST-003", // Cebu Food Products Corporation
        service_type: "Forwarding",
        preferred_manager_id: "user-ops-fwd-manager-001",
        preferred_manager_name: "Carlos Mendoza",
        preferred_supervisor_id: "user-ops-fwd-supervisor-002",
        preferred_supervisor_name: "Ricardo Cruz",
        preferred_handler_id: "user-ops-fwd-handler-002",
        preferred_handler_name: "Anna Reyes",
        created_at: now,
        updated_at: now
      },
      {
        id: "pref-004",
        customer_id: "CUST-004", // AutoParts Solutions Philippines
        service_type: "Trucking",
        preferred_manager_id: "user-ops-trk-manager-001",
        preferred_manager_name: "Antonio Dela Rosa",
        preferred_supervisor_id: "user-ops-trk-supervisor-001",
        preferred_supervisor_name: "Josephine Garcia",
        preferred_handler_id: "user-ops-trk-handler-001",
        preferred_handler_name: "Benjamin Santos",
        created_at: now,
        updated_at: now
      },
      {
        id: "pref-005",
        customer_id: "CUST-005", // BuildRight Construction Supplies
        service_type: "Forwarding",
        preferred_manager_id: "user-ops-fwd-manager-001",
        preferred_manager_name: "Carlos Mendoza",
        preferred_supervisor_id: "user-ops-fwd-supervisor-001",
        preferred_supervisor_name: "Maria Santos",
        preferred_handler_id: "user-ops-fwd-handler-003",
        preferred_handler_name: "Miguel Torres",
        created_at: now,
        updated_at: now
      },
      {
        id: "pref-006",
        customer_id: "CUST-006", // MedSupply Pharmaceuticals Inc.
        service_type: "Marine Insurance",
        preferred_manager_id: "user-ops-mar-manager-001",
        preferred_manager_name: "Patricia Alvarez",
        preferred_supervisor_id: "user-ops-mar-supervisor-001",
        preferred_supervisor_name: "Fernando Aquino",
        preferred_handler_id: "user-ops-mar-handler-001",
        preferred_handler_name: "Luis Mendez",
        created_at: now,
        updated_at: now
      },
      {
        id: "pref-007",
        customer_id: "CUST-001", // Pacific Electronics - Brokerage service
        service_type: "Brokerage",
        preferred_manager_id: "user-ops-brk-manager-001",
        preferred_manager_name: "Linda Villanueva",
        preferred_supervisor_id: "user-ops-brk-supervisor-002",
        preferred_supervisor_name: "Elena Martinez",
        preferred_handler_id: "user-ops-brk-handler-001",
        preferred_handler_name: "Paolo Fernandez",
        created_at: now,
        updated_at: now
      },
      {
        id: "pref-008",
        customer_id: "CUST-002", // Manila Fashion - Trucking service
        service_type: "Trucking",
        preferred_manager_id: "user-ops-trk-manager-001",
        preferred_manager_name: "Antonio Dela Rosa",
        preferred_supervisor_id: "user-ops-trk-supervisor-002",
        preferred_supervisor_name: "Ramon Vasquez",
        preferred_handler_id: "user-ops-trk-handler-002",
        preferred_handler_name: "Isabella Cruz",
        created_at: now,
        updated_at: now
      }
    ];
    
    // Save each preference [RELATIONAL]
    const { error: prefErr } = await db.from("client_handler_preferences").upsert(seedPreferences, { onConflict: "id" });
    if (prefErr) throw prefErr;
    for (const pref of seedPreferences) {
      console.log(`Seeded handler preference: ${pref.customer_id} - ${pref.service_type}`);
    }
    
    return c.json({ 
      success: true, 
      message: `Seeded ${seedPreferences.length} client handler preferences successfully`,
      count: seedPreferences.length
    });
  } catch (error) {
    console.error("Error seeding client handler preferences:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Clear all users (development only) [RELATIONAL]
app.delete("/make-server-c142e950/auth/clear-users", async (c) => {
  try {
    const { data: allUsers } = await db.from("users").select("id, email");
    const { error } = await db.from("users").delete().neq("id", "");
    if (error) throw error;
    
    return c.json({ 
      success: true, 
      message: `Cleared ${allUsers?.length || 0} users successfully` 
    });
  } catch (error) {
    console.error("Error clearing users:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== CLIENT HANDLER PREFERENCES API ====================

// Create or update a client handler preference [RELATIONAL]
app.post("/make-server-c142e950/client-handler-preferences", async (c) => {
  try {
    const body = await c.req.json();
    const { customer_id, service_type, preferred_manager_id, preferred_manager_name, preferred_supervisor_id, preferred_supervisor_name, preferred_handler_id, preferred_handler_name } = body;
    
    if (!customer_id || !service_type || !preferred_manager_id || !preferred_supervisor_id || !preferred_handler_id) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }
    
    // Check if preference already exists for this customer+service
    const { data: existing } = await db.from("client_handler_preferences")
      .select("*").eq("customer_id", customer_id).eq("service_type", service_type).maybeSingle();
    
    const now = new Date().toISOString();
    const preferenceId = existing?.id || `pref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const preference = {
      id: preferenceId, customer_id, service_type,
      preferred_manager_id, preferred_manager_name,
      preferred_supervisor_id, preferred_supervisor_name,
      preferred_handler_id, preferred_handler_name,
      created_at: existing?.created_at || now, updated_at: now
    };
    
    const { error } = await db.from("client_handler_preferences").upsert(preference, { onConflict: "id" });
    if (error) throw error;
    
    console.log(`${existing ? 'Updated' : 'Created'} handler preference for customer ${customer_id}, service ${service_type}`);
    
    return c.json({ success: true, data: preference });
  } catch (error) {
    console.error("Error saving client handler preference:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get a specific client handler preference [RELATIONAL]
app.get("/make-server-c142e950/client-handler-preferences/:customer_id/:service_type", async (c) => {
  try {
    const customer_id = c.req.param("customer_id");
    const service_type = c.req.param("service_type");
    
    const { data: preference, error } = await db.from("client_handler_preferences")
      .select("*").eq("customer_id", customer_id).eq("service_type", service_type).maybeSingle();
    if (error) throw error;
    
    return c.json({ success: true, data: preference || null });
  } catch (error) {
    console.error("Error fetching client handler preference:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get all client handler preferences [RELATIONAL]
app.get("/make-server-c142e950/client-handler-preferences", async (c) => {
  try {
    const { data: preferences, error } = await db.from("client_handler_preferences")
      .select("*").order("customer_id", { ascending: true });
    if (error) throw error;
    
    console.log(`Fetched ${preferences?.length || 0} handler preferences`);
    return c.json({ success: true, data: preferences || [] });
  } catch (error) {
    console.error("Error fetching client handler preferences:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete a client handler preference [RELATIONAL]
app.delete("/make-server-c142e950/client-handler-preferences/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { error } = await db.from("client_handler_preferences").delete().eq("id", id);
    if (error) throw error;
    
    console.log(`Deleted handler preference: ${id}`);
    return c.json({ success: true, message: "Preference deleted successfully" });
  } catch (error) {
    console.error("Error deleting client handler preference:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== TICKET TYPES API ====================

// Seed ticket types (auto-run on startup if none exist)
app.post("/make-server-c142e950/ticket-types/seed", async (c) => {
  try {
    // Check if ticket types already exist
    // [RELATIONAL]
    const { data: existingTypes } = await db.from("ticket_types").select("*");
    
    if (existingTypes && existingTypes.length > 0) {
      console.log(`Ticket types already exist (${existingTypes.length}). Skipping seed.`);
      return c.json({ 
        success: true, 
        message: `${existingTypes.length} ticket types already exist`,
        data: existingTypes 
      });
    }
    
    const ticketTypes = [
      {
        id: "QUOTATION_PRICING",
        name: "Quotation Pricing Request",
        description: "Request pricing for a customer quotation",
        default_from_department: "Business Development",
        default_to_department: "Pricing",
        default_due_hours: 24,
        created_at: new Date().toISOString()
      },
      {
        id: "QUOTATION_REVISION",
        name: "Quotation Revision",
        description: "Customer requested changes to existing quotation pricing",
        default_from_department: "Business Development",
        default_to_department: "Pricing",
        default_due_hours: 12,
        created_at: new Date().toISOString()
      },
      {
        id: "CUSTOMER_CLARIFICATION",
        name: "Customer Clarification Needed",
        description: "Need additional information or clarification from customer",
        default_from_department: "Pricing",
        default_to_department: "Business Development",
        default_due_hours: 24,
        created_at: new Date().toISOString()
      },
      {
        id: "DOCUMENT_REQUEST",
        name: "Document Request",
        description: "Request missing or additional documents",
        default_from_department: "Pricing",
        default_to_department: "Business Development",
        default_due_hours: 48,
        created_at: new Date().toISOString()
      },
      {
        id: "URGENT_ISSUE",
        name: "Urgent Issue",
        description: "Critical issue requiring immediate attention",
        default_from_department: null,
        default_to_department: null,
        default_due_hours: 4,
        created_at: new Date().toISOString()
      },
      {
        id: "GENERAL_REQUEST",
        name: "General Request",
        description: "General request or question between departments",
        default_from_department: null,
        default_to_department: null,
        default_due_hours: 48,
        created_at: new Date().toISOString()
      }
    ];
    
    // Save each ticket type [RELATIONAL]
    const { error: ttErr } = await db.from("ticket_types").upsert(ticketTypes, { onConflict: "id" });
    if (ttErr) throw ttErr;
    for (const ticketType of ticketTypes) {
      console.log(`Seeded ticket type: ${ticketType.id}`);
    }
    
    return c.json({ 
      success: true, 
      message: `Seeded ${ticketTypes.length} ticket types successfully`,
      data: ticketTypes
    });
  } catch (error) {
    console.error("Error seeding ticket types:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get all ticket types [RELATIONAL]
app.get("/make-server-c142e950/ticket-types", async (c) => {
  try {
    const { data: ticketTypes, error } = await db.from("ticket_types").select("*").order("name");
    if (error) throw error;
    
    return c.json({ success: true, data: ticketTypes || [] });
  } catch (error) {
    console.error("Error fetching ticket types:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== TICKETS API ====================

// Create a new ticket [RELATIONAL]
app.post("/make-server-c142e950/tickets", async (c) => {
  try {
    const ticket = await c.req.json();
    
    if (!ticket.id) {
      const deptMap: Record<string, string> = {
        "Business Development": "BD", "Pricing": "PRC", "Operations": "OPS",
        "Finance": "FIN", "Executive": "EXEC", "Administration": "ADM"
      };
      const deptPrefix = deptMap[ticket.from_department] || "GEN";
      
      // Counter from relational counters table
      const counterKey = `ticket_counter:${deptPrefix}`;
      const { data: counterRow } = await db.from("counters").select("*").eq("key", counterKey).maybeSingle();
      const newValue = (counterRow?.value || 0) + 1;
      await db.from("counters").upsert({ key: counterKey, value: newValue }, { onConflict: "key" });
      
      ticket.id = `${deptPrefix}-${newValue.toString().padStart(4, '0')}`;
    }
    
    ticket.created_at = new Date().toISOString();
    ticket.updated_at = new Date().toISOString();
    if (!ticket.status) ticket.status = "Open";
    if (!ticket.priority) ticket.priority = "Normal";
    
    if (!ticket.due_date && ticket.ticket_type) {
      const { data: ticketType } = await db.from("ticket_types").select("*").eq("id", ticket.ticket_type).maybeSingle();
      if (ticketType?.default_due_hours) {
        const dueDate = new Date();
        dueDate.setHours(dueDate.getHours() + ticketType.default_due_hours);
        ticket.due_date = dueDate.toISOString();
      }
    }
    
    ticket.assigned_to = ticket.assigned_to || null;
    ticket.assigned_to_name = ticket.assigned_to_name || null;
    ticket.assigned_at = ticket.assigned_at || null;
    ticket.resolved_at = null;
    ticket.closed_at = null;
    ticket.linked_entity_type = ticket.linked_entity_type || null;
    ticket.linked_entity_id = ticket.linked_entity_id || null;
    ticket.linked_entity_name = ticket.linked_entity_name || null;
    ticket.linked_entity_status = ticket.linked_entity_status || null;
    ticket.title = ticket.subject || ticket.title || "";
    
    const { error } = await db.from("tickets").insert(ticket);
    if (error) throw error;
    
    await logTicketActivity(
      ticket.id, "ticket_created", ticket.created_by, ticket.created_by_name,
      ticket.from_department, null, null,
      { subject: ticket.subject, priority: ticket.priority, to_department: ticket.to_department }
    );
    
    console.log(`Created ticket: ${ticket.id} - ${ticket.subject} (${ticket.from_department} → ${ticket.to_department})${ticket.linked_entity_type ? ` [Linked to ${ticket.linked_entity_type}: ${ticket.linked_entity_id}]` : ''}`);
    return c.json({ success: true, data: ticket });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get all tickets with role-based filtering [RELATIONAL]
app.get("/make-server-c142e950/tickets", async (c) => {
  try {
    const user_id = c.req.query("user_id");
    const role = c.req.query("role");
    const department = c.req.query("department");
    const status = c.req.query("status");
    const priority = c.req.query("priority");
    const search = c.req.query("search");
    
    let query = db.from("tickets").select("*");
    if (role === "rep" && user_id) {
      query = query.or(`assigned_to.eq.${user_id},created_by.eq.${user_id}`);
    } else if (role === "manager" && department) {
      query = query.or(`to_department.eq.${department},from_department.eq.${department}`);
    }
    if (status) query = query.eq("status", status);
    if (priority) query = query.eq("priority", priority);
    if (search) query = query.or(`id.ilike.%${search}%,subject.ilike.%${search}%,description.ilike.%${search}%`);
    query = query.order("created_at", { ascending: false });
    
    const { data: tickets, error } = await query;
    if (error) throw error;
    
    console.log(`Fetched ${tickets?.length || 0} tickets for user ${user_id} (${role} in ${department})`);
    return c.json({ success: true, data: tickets || [] });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get single ticket by ID with comments [RELATIONAL]
app.get("/make-server-c142e950/tickets/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { data: ticket, error } = await db.from("tickets").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!ticket) return c.json({ success: false, error: "Ticket not found" }, 404);
    
    const { data: comments } = await db.from("comments")
      .select("*").eq("entity_type", "ticket").eq("entity_id", id)
      .order("created_at", { ascending: true });
    
    return c.json({ success: true, data: { ...ticket, comments: comments || [] } });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update ticket status [RELATIONAL]
app.patch("/make-server-c142e950/tickets/:id/status", async (c) => {
  try {
    const id = c.req.param("id");
    const { status, user_id, user_name, user_department } = await c.req.json();
    
    const { data: ticket, error: fetchErr } = await db.from("tickets").select("*").eq("id", id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!ticket) return c.json({ success: false, error: "Ticket not found" }, 404);
    
    const oldStatus = ticket.status;
    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (status === "Resolved" && oldStatus !== "Resolved") updateData.resolved_at = new Date().toISOString();
    if (status === "Closed" && oldStatus !== "Closed") updateData.closed_at = new Date().toISOString();
    
    const { error } = await db.from("tickets").update(updateData).eq("id", id);
    if (error) throw error;
    
    if (user_id && user_name && user_department && oldStatus !== status) {
      await logTicketActivity(id, "status_changed", user_id, user_name, user_department, oldStatus, status);
    }
    
    const { data: updated } = await db.from("tickets").select("*").eq("id", id).maybeSingle();
    console.log(`Updated ticket ${id} status: ${oldStatus} → ${status}`);
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating ticket status:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update ticket priority [RELATIONAL]
app.patch("/make-server-c142e950/tickets/:id/priority", async (c) => {
  try {
    const id = c.req.param("id");
    const { priority } = await c.req.json();
    
    const { data: ticket } = await db.from("tickets").select("id").eq("id", id).maybeSingle();
    if (!ticket) return c.json({ success: false, error: "Ticket not found" }, 404);
    
    const { error } = await db.from("tickets").update({ priority, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    
    const { data: updated } = await db.from("tickets").select("*").eq("id", id).maybeSingle();
    console.log(`Updated ticket ${id} priority to: ${priority}`);
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating ticket priority:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Assign ticket to user [RELATIONAL]
app.patch("/make-server-c142e950/tickets/:id/assign", async (c) => {
  try {
    const id = c.req.param("id");
    const { assigned_to, assigned_to_name } = await c.req.json();
    
    const { data: ticket } = await db.from("tickets").select("*").eq("id", id).maybeSingle();
    if (!ticket) return c.json({ success: false, error: "Ticket not found" }, 404);
    
    const updateData: any = { assigned_to, assigned_to_name, assigned_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    if (ticket.status === "Open") updateData.status = "Assigned";
    
    const { error } = await db.from("tickets").update(updateData).eq("id", id);
    if (error) throw error;
    
    const { data: updated } = await db.from("tickets").select("*").eq("id", id).maybeSingle();
    console.log(`Assigned ticket ${id} to: ${assigned_to_name} (${assigned_to})`);
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error assigning ticket:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update ticket due date [RELATIONAL]
app.patch("/make-server-c142e950/tickets/:id/due-date", async (c) => {
  try {
    const id = c.req.param("id");
    const { due_date } = await c.req.json();
    
    const { data: ticket } = await db.from("tickets").select("id").eq("id", id).maybeSingle();
    if (!ticket) return c.json({ success: false, error: "Ticket not found" }, 404);
    
    const { error } = await db.from("tickets").update({ due_date, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    
    const { data: updated } = await db.from("tickets").select("*").eq("id", id).maybeSingle();
    console.log(`Updated ticket ${id} due date to: ${due_date}`);
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating ticket due date:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete ticket [RELATIONAL]
app.delete("/make-server-c142e950/tickets/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    // Delete comments for this ticket first (polymorphic comments table)
    await db.from("comments").delete().eq("entity_type", "ticket").eq("entity_id", id);
    // Delete activity log entries for this ticket
    await db.from("activity_log").delete().eq("entity_type", "ticket").eq("entity_id", id);
    
    const { error } = await db.from("tickets").delete().eq("id", id);
    if (error) throw error;
    
    console.log(`Deleted ticket: ${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== TICKET COMMENTS API ====================

// Generic activity logger for all system activities (dual storage)
async function logActivity(
  entity_type: string,
  entity_id: string,
  entity_name: string,
  action_type: string,
  user_id: string,
  user_name: string,
  user_department: string,
  old_value: string | null = null,
  new_value: string | null = null,
  metadata: any = {}
) {
  try {
    const timestamp = Date.now();
    const activity_id = `${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
    const activity = {
      id: activity_id,
      entity_type,
      entity_id,
      entity_name,
      action_type,
      user_id,
      user_name,
      user_department,
      old_value,
      new_value,
      metadata,
      created_at: new Date().toISOString()
    };
    
    // Write to relational activity_log table [RELATIONAL]
    await db.from("activity_log").insert(activity);
    
    console.log(`Activity logged: ${entity_type} ${entity_id} - ${action_type} by ${user_name}`);
  } catch (error) {
    console.error("Error logging activity:", error);
    // Don't throw - activity logging should not break the main flow
  }
}

// Helper function to log ticket activity (wrapper for backward compatibility)
async function logTicketActivity(
  ticket_id: string,
  action_type: string,
  user_id: string,
  user_name: string,
  user_department: string,
  old_value: string | null = null,
  new_value: string | null = null,
  metadata: any = {}
) {
  // Get ticket name for better display [RELATIONAL]
  let ticket_name = ticket_id;
  try {
    const { data: ticket } = await db.from("tickets").select("subject").eq("id", ticket_id).maybeSingle();
    if (ticket?.subject) ticket_name = ticket.subject;
  } catch (error) {
    // If we can't get ticket name, just use ID
  }
  
  await logActivity(
    "ticket",
    ticket_id,
    ticket_name,
    action_type,
    user_id,
    user_name,
    user_department,
    old_value,
    new_value,
    metadata
  );
}

// Add comment to ticket [RELATIONAL]
app.post("/make-server-c142e950/tickets/:id/comments", async (c) => {
  try {
    const ticket_id = c.req.param("id");
    const commentData = await c.req.json();
    
    const { data: ticket } = await db.from("tickets").select("id").eq("id", ticket_id).maybeSingle();
    if (!ticket) return c.json({ success: false, error: "Ticket not found" }, 404);
    
    const comment_id = `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const comment = {
      id: comment_id,
      entity_type: "ticket",
      entity_id: ticket_id,
      user_id: commentData.user_id,
      user_name: commentData.user_name,
      user_department: commentData.user_department,
      content: commentData.content,
      created_at: new Date().toISOString()
    };
    
    const { error: commentErr } = await db.from("comments").insert(comment);
    if (commentErr) throw commentErr;
    
    // Update ticket timestamp
    await db.from("tickets").update({ updated_at: new Date().toISOString() }).eq("id", ticket_id);
    
    // Also add ticket_id to the returned comment for backward compatibility
    const returnComment = { ...comment, ticket_id };
    
    // Log activity: comment added
    await logTicketActivity(
      ticket_id,
      "comment_added",
      commentData.user_id,
      commentData.user_name,
      commentData.user_department,
      null,
      null,
      { comment_preview: commentData.content.substring(0, 100) }
    );
    
    console.log(`Added comment ${comment_id} to ticket ${ticket_id} by ${commentData.user_name}`);
    
    return c.json({ success: true, data: returnComment });
  } catch (error) {
    console.error("Error adding comment:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get all comments for a ticket [RELATIONAL]
app.get("/make-server-c142e950/tickets/:id/comments", async (c) => {
  try {
    const ticket_id = c.req.param("id");
    
    const { data: ticket } = await db.from("tickets").select("id").eq("id", ticket_id).maybeSingle();
    if (!ticket) return c.json({ success: false, error: "Ticket not found" }, 404);
    
    const { data: comments, error } = await db.from("comments")
      .select("*").eq("entity_type", "ticket").eq("entity_id", ticket_id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    
    // Add ticket_id field for backward compatibility
    const enriched = (comments || []).map((c: any) => ({ ...c, ticket_id }));
    return c.json({ success: true, data: enriched });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get activity log for a ticket [RELATIONAL]
app.get("/make-server-c142e950/tickets/:id/activity", async (c) => {
  try {
    const ticket_id = c.req.param("id");
    const user_role = c.req.query("role");
    const user_department = c.req.query("department");
    
    if (user_role === "rep") {
      return c.json({ success: false, error: "Access denied: Activity log is not available for Employee/Rep roles" }, 403);
    }
    
    const { data: ticket } = await db.from("tickets").select("*").eq("id", ticket_id).maybeSingle();
    if (!ticket) return c.json({ success: false, error: "Ticket not found" }, 404);
    
    let query = db.from("activity_log").select("*")
      .eq("entity_type", "ticket").eq("entity_id", ticket_id)
      .order("created_at", { ascending: false });
    
    if (user_role === "manager" && user_department) {
      // Filter: show if user dept matches, or ticket involves dept
      // Since this is complex OR logic involving ticket fields, filter in-app
    }
    
    const { data: activities, error } = await query;
    if (error) throw error;
    
    let filtered = activities || [];
    if (user_role === "manager" && user_department) {
      filtered = filtered.filter((a: any) =>
        a.user_department === user_department ||
        ticket.from_department === user_department ||
        ticket.to_department === user_department
      );
    }
    
    console.log(`Fetched ${filtered.length} activities for ticket ${ticket_id} (role: ${user_role})`);
    return c.json({ success: true, data: filtered });
  } catch (error) {
    console.error("Error fetching ticket activities:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== GLOBAL ACTIVITY LOG API ====================

// Get system-wide activity log [RELATIONAL]
app.get("/make-server-c142e950/activity-log", async (c) => {
  try {
    const user_role = c.req.query("role");
    const user_department = c.req.query("department");
    const entity_type = c.req.query("entity_type");
    const action_type = c.req.query("action_type");
    const user_id = c.req.query("user_id");
    const date_from = c.req.query("date_from");
    const date_to = c.req.query("date_to");
    const limitVal = c.req.query("limit") ? parseInt(c.req.query("limit")!) : 50;
    const offsetVal = c.req.query("offset") ? parseInt(c.req.query("offset")!) : 0;
    
    if (user_role === "rep") {
      return c.json({ success: false, error: "Access denied: Activity log is not available for Employee/Rep roles" }, 403);
    }
    
    let query = db.from("activity_log").select("*", { count: "exact" });
    
    if (user_role === "manager" && user_department) {
      query = query.eq("user_department", user_department);
    }
    if (entity_type && entity_type !== "all") query = query.eq("entity_type", entity_type);
    if (action_type && action_type !== "all") query = query.eq("action_type", action_type);
    if (user_id) query = query.eq("user_id", user_id);
    if (date_from) query = query.gte("created_at", date_from);
    if (date_to) query = query.lte("created_at", new Date(new Date(date_to).setHours(23, 59, 59, 999)).toISOString());
    
    query = query.order("created_at", { ascending: false }).range(offsetVal, offsetVal + limitVal - 1);
    
    const { data: activities, error, count } = await query;
    if (error) throw error;
    
    const total = count || 0;
    console.log(`Fetched ${activities?.length || 0}/${total} activities for ${user_role} in ${user_department}`);
    
    return c.json({ success: true, data: activities || [], total, limit: limitVal, offset: offsetVal });
  } catch (error) {
    console.error("Error fetching activity log:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== QUOTATIONS API ====================

// Known columns in the quotations table (everything else goes into details JSONB)
const QUOTATION_COLS = [
  "id", "quotation_number", "quotation_type", "customer_id", "customer_name",
  "contact_id", "contact_name", "consignee_id", "services", "services_metadata",
  "pricing", "vendors", "status", "validity_date", "created_by", "created_by_name",
  "assigned_to", "contract_status", "contract_start_date", "contract_end_date",
  "renewal_terms", "auto_renew", "contract_notes", "parent_contract_id",
  "total_selling", "total_buying", "currency", "notes", "internal_notes", "tags",
  "created_at", "updated_at", "details",
  // 002 additions:
  "quote_number", "quotation_name", "contact_person_id", "submitted_at",
  "converted_at", "project_id", "quotation_date", "expiry_date"
];

// Quotation helpers [RELATIONAL]
async function getQuotationMerged(id: string) {
  const { data: row, error } = await db.from("quotations").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return row ? mergeFromRow(row) : null;
}
async function saveQuotation(q: any) {
  const row = splitForInsert(q, QUOTATION_COLS);
  const { error } = await db.from("quotations").upsert(row, { onConflict: "id" });
  if (error) throw error;
}

// Create a new quotation [RELATIONAL]
app.post("/make-server-c142e950/quotations", async (c) => {
  try {
    const quotation = await c.req.json();
    
    // Generate unique ID if not provided
    if (!quotation.id) {
      quotation.id = `QUO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Set timestamps
    quotation.created_at = quotation.created_at || new Date().toISOString();
    quotation.updated_at = new Date().toISOString();
    
    // Set default status if not provided
    if (!quotation.status) {
      quotation.status = "Draft";
    }
    
    // [RELATIONAL] Split into columns + details JSONB
    const row = splitForInsert(quotation, QUOTATION_COLS);
    const { error } = await db.from("quotations").insert(row);
    if (error) throw error;
    
    console.log(`Created quotation: ${quotation.id} with status: ${quotation.status}`);
    return c.json({ success: true, data: quotation });
  } catch (error) {
    console.error("Error creating quotation:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get all quotations (with optional status filter)
app.get("/make-server-c142e950/quotations", async (c) => {
  try {
    const status = c.req.query("status");
    const department = c.req.query("department");
    const customer_id = c.req.query("customer_id");
    const contact_id = c.req.query("contact_id");
    const search = c.req.query("search");
    const created_by = c.req.query("created_by");
    const date_from = c.req.query("date_from");
    const date_to = c.req.query("date_to");
    const sort_by = c.req.query("sort_by") || "updated_at"; // updated_at, created_at, quote_number
    const sort_order = c.req.query("sort_order") || "desc"; // asc or desc
    const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : undefined;
    const offset = c.req.query("offset") ? parseInt(c.req.query("offset")!) : 0;
    
    // [RELATIONAL] Build query with server-side filters
    let query = db.from("quotations").select("*");
    if (customer_id) query = query.eq("customer_id", customer_id);
    if (contact_id) query = query.eq("contact_person_id", contact_id);
    if (created_by) query = query.eq("created_by", created_by);
    if (status) query = query.eq("status", status);
    if (date_from) query = query.gte("created_at", date_from);
    if (date_to) query = query.lte("created_at", new Date(new Date(date_to).setHours(23, 59, 59, 999)).toISOString());
    if (search) {
      query = query.or(`quote_number.ilike.%${search}%,quotation_name.ilike.%${search}%,customer_name.ilike.%${search}%,id.ilike.%${search}%`);
    }
    
    const { data: rows, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;
    
    // Merge details JSONB back and apply in-memory migrations
    const migrateStatus = (s: string): string => {
      const map: Record<string, string> = { "Quotation": "Priced", "Approved": "Accepted by Client", "Rejected": "Rejected by Client" };
      return map[s] || s;
    };
    const migrateToDualPricing = (q: any): any => {
      if (q.charge_categories?.length > 0 && (!q.buying_price || q.buying_price.length === 0)) {
        return { ...q, buying_price: q.charge_categories, selling_price: q.charge_categories.map((cat: any) => ({ ...cat, line_items: cat.line_items.map((item: any) => ({ ...item, base_cost: item.price, amount_added: 0, percentage_added: 0, final_price: item.price })) })) };
      }
      return q;
    };
    
    let filtered = (rows || []).map((r: any) => {
      const merged = mergeFromRow(r);
      const migrated = migrateToDualPricing(merged);
      return { ...migrated, status: migrateStatus(migrated.status) };
    });
    
    // NOTE: Department-based visibility filtering has been removed
    // The frontend now handles all tab filtering logic for better flexibility
    // This allows the frontend to control what quotations appear in which tabs
    // based on the two-layer status system (business view + technical workflow)
    
    // Get total count before pagination
    const total = filtered.length;
    
    // Sort
    filtered.sort((a: any, b: any) => {
      let aVal, bVal;
      
      switch (sort_by) {
        case "created_at":
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        case "quote_number":
          aVal = a.quote_number || "";
          bVal = b.quote_number || "";
          break;
        case "updated_at":
        default:
          aVal = new Date(a.updated_at).getTime();
          bVal = new Date(b.updated_at).getTime();
          break;
      }
      
      if (sort_order === "asc") {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
    
    // Apply pagination
    const paginated = limit ? filtered.slice(offset, offset + limit) : filtered;
    
    console.log(`Fetched ${paginated.length}/${total} quotations (offset: ${offset}, limit: ${limit || 'all'}) for department: ${department}, status: ${status}, search: ${search}`);
    
    return c.json({ 
      success: true, 
      data: paginated,
      pagination: {
        total,
        offset,
        limit: limit || total,
        hasMore: limit ? (offset + limit) < total : false
      }
    });
  } catch (error) {
    console.error("Error fetching quotations:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get single quotation by ID [RELATIONAL]
app.get("/make-server-c142e950/quotations/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { data: row, error } = await db.from("quotations").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!row) return c.json({ success: false, error: "Quotation not found" }, 404);
    
    const quotation = mergeFromRow(row);
    
    // Status migration
    const statusMap: Record<string, string> = { "Quotation": "Priced", "Approved": "Accepted by Client", "Rejected": "Rejected by Client" };
    if (statusMap[quotation.status]) quotation.status = statusMap[quotation.status];
    
    // Dual-pricing migration
    if (quotation.charge_categories?.length > 0 && (!quotation.buying_price || quotation.buying_price.length === 0)) {
      quotation.buying_price = quotation.charge_categories;
      quotation.selling_price = quotation.charge_categories.map((cat: any) => ({
        ...cat, line_items: cat.line_items.map((item: any) => ({ ...item, base_cost: item.price, amount_added: 0, percentage_added: 0, final_price: item.price }))
      }));
      // Persist migration back
      const updateRow = splitForInsert(quotation, QUOTATION_COLS);
      await db.from("quotations").update(updateRow).eq("id", id);
    }
    
    return c.json({ success: true, data: quotation });
  } catch (error) {
    console.error("Error fetching quotation:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update quotation [RELATIONAL]
app.put("/make-server-c142e950/quotations/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    
    const { data: existingRow, error: fetchErr } = await db.from("quotations").select("*").eq("id", id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existingRow) return c.json({ success: false, error: "Quotation not found" }, 404);
    
    const existing = mergeFromRow(existingRow);
    const updated = { ...existing, ...updates, id, created_at: existing.created_at, updated_at: new Date().toISOString() };
    
    // Split and save
    const row = splitForInsert(updated, QUOTATION_COLS);
    const { error } = await db.from("quotations").update(row).eq("id", id);
    if (error) throw error;
    
    console.log(`Updated quotation: ${id}, new status: ${updated.status}`);

    // 🔄 WRITE-THROUGH SYNC: Update linked Project [RELATIONAL]
    try {
      let projectId = updated.project_id;
      if (!projectId) {
        const { data: linkedProject } = await db.from("projects").select("id").or(`quotation_id.eq.${id}`).maybeSingle();
        if (linkedProject) projectId = linkedProject.id;
      }

      if (projectId) {
        const { data: projRow } = await db.from("projects").select("*").eq("id", projectId).maybeSingle();
        if (projRow) {
          const project = mergeFromRow(projRow);
          console.log(`🔄 Syncing changes to linked Project: ${projectId}`);
          
          project.quotation = updated;
          project.services = updated.services || project.services;
          project.services_metadata = updated.services_metadata || project.services_metadata;
          project.charge_categories = updated.charge_categories || project.charge_categories;
          project.total = updated.financial_summary?.grand_total ?? project.total;
          project.currency = updated.currency || project.currency;
          if (updated.movement) project.movement = updated.movement;
          if (updated.category) project.category = updated.category;
          if (updated.incoterm) project.incoterm = updated.incoterm;
          if (updated.carrier) project.carrier = updated.carrier;
          if (updated.pol_aol) project.pol_aol = updated.pol_aol;
          if (updated.pod_aod) project.pod_aod = updated.pod_aod;
          if (updated.commodity) project.commodity = updated.commodity;
          project.updated_at = new Date().toISOString();
          
          // Re-split project for save (need PROJECT_COLS - defined in projects section)
          // For now, just update the details JSONB
          const { details: projDetails, ...projCols } = projRow;
          const mergedProjDetails = { ...(projDetails || {}), ...project };
          await db.from("projects").update({ details: mergedProjDetails, updated_at: project.updated_at }).eq("id", projectId);
          console.log(`✅ Project ${projectId} synchronized with Quotation ${id}`);
        }
      }
    } catch (syncError) {
      console.error("⚠️ Error syncing project with quotation update:", syncError);
    }
    
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating quotation:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Submit inquiry to pricing [RELATIONAL]
app.post("/make-server-c142e950/quotations/:id/submit", async (c) => {
  try {
    const id = c.req.param("id");
    const { data: row, error: fetchErr } = await db.from("quotations").select("*").eq("id", id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!row) return c.json({ success: false, error: "Quotation not found" }, 404);
    
    const now = new Date().toISOString();
    await db.from("quotations").update({ status: "Pending Pricing", submitted_at: now, updated_at: now }).eq("id", id);
    
    const quotation = mergeFromRow(row);
    quotation.status = "Pending Pricing";
    quotation.submitted_at = now;
    quotation.updated_at = now;
    
    console.log(`Submitted quotation ${id} to Pricing`);
    return c.json({ success: true, data: quotation });
  } catch (error) {
    console.error("Error submitting quotation:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Convert to full quotation [RELATIONAL]
app.post("/make-server-c142e950/quotations/:id/convert", async (c) => {
  try {
    const id = c.req.param("id");
    const pricingData = await c.req.json();
    
    const { data: row, error: fetchErr } = await db.from("quotations").select("*").eq("id", id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!row) return c.json({ success: false, error: "Quotation not found" }, 404);
    
    const quotation = mergeFromRow(row);
    const converted = { ...quotation, ...pricingData, status: "Quotation", converted_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    
    const updateRow = splitForInsert(converted, QUOTATION_COLS);
    const { error } = await db.from("quotations").update(updateRow).eq("id", id);
    if (error) throw error;
    
    console.log(`Converted quotation ${id} to full Quotation`);
    return c.json({ success: true, data: converted });
  } catch (error) {
    console.error("Error converting quotation:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete quotation [RELATIONAL]
app.delete("/make-server-c142e950/quotations/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { error } = await db.from("quotations").delete().eq("id", id);
    if (error) throw error;
    console.log(`Deleted quotation: ${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting quotation:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Migrate quotation statuses [RELATIONAL]
app.post("/make-server-c142e950/quotations/migrate-statuses", async (c) => {
  try {
    const statusMap: Record<string, string> = { "Quotation": "Priced", "Approved": "Accepted by Client", "Rejected": "Rejected by Client" };
    let migratedCount = 0;
    
    for (const [oldStatus, newStatus] of Object.entries(statusMap)) {
      const { data: affected } = await db.from("quotations").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("status", oldStatus).select("id");
      migratedCount += affected?.length || 0;
    }
    
    const { count } = await db.from("quotations").select("*", { count: "exact", head: true });
    const skippedCount = (count || 0) - migratedCount;
    
    console.log(`Migration complete: ${migratedCount} quotations migrated, ${skippedCount} skipped`);
    return c.json({ success: true, message: `Migration complete: ${migratedCount} quotations migrated, ${skippedCount} skipped`, migrated: migratedCount, skipped: skippedCount });
  } catch (error) {
    console.error("Error migrating quotation statuses:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update quotation status [RELATIONAL]
app.patch("/make-server-c142e950/quotations/:id/status", async (c) => {
  try {
    const id = c.req.param("id");
    const { status, user_id, user_name, user_department, sent_to_client_at } = await c.req.json();
    
    const { data: row, error: fetchErr } = await db.from("quotations").select("*").eq("id", id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!row) return c.json({ success: false, error: "Quotation not found" }, 404);
    
    const quotation = mergeFromRow(row);
    const oldStatus = quotation.status;
    quotation.status = status;
    quotation.updated_at = new Date().toISOString();
    
    if (status === "Sent to Client" && sent_to_client_at) {
      quotation.sent_to_client_at = sent_to_client_at;
      if (quotation.validity_period) {
        const validityDays = parseInt(quotation.validity_period);
        if (!isNaN(validityDays)) {
          const expiresAt = new Date(sent_to_client_at);
          expiresAt.setDate(expiresAt.getDate() + validityDays);
          quotation.expires_at = expiresAt.toISOString();
        }
      }
    }
    if (status === "Accepted by Client") quotation.client_accepted_at = new Date().toISOString();
    else if (status === "Rejected by Client") quotation.client_rejected_at = new Date().toISOString();
    
    const updateRow = splitForInsert(quotation, QUOTATION_COLS);
    const { error } = await db.from("quotations").update(updateRow).eq("id", id);
    if (error) throw error;
    
    if (user_id && user_name && user_department && oldStatus !== status) {
      await logActivity("quotation", id, quotation.quote_number || quotation.quotation_name || id, "status_changed", user_id, user_name, user_department, oldStatus, status);
    }
    
    console.log(`Updated quotation ${id} status: ${oldStatus} → ${status}`);
    return c.json({ success: true, data: quotation });
  } catch (error) {
    console.error("Error updating quotation status:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Create new version of quotation (revise) [RELATIONAL]
app.post("/make-server-c142e950/quotations/:id/revise", async (c) => {
  try {
    const id = c.req.param("id");
    const { revision_reason, user_id, user_name, user_department } = await c.req.json();
    
    const { data: row, error: fetchErr } = await db.from("quotations").select("*").eq("id", id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!row) return c.json({ success: false, error: "Quotation not found" }, 404);
    
    const quotation = mergeFromRow(row);
    
    if (!quotation.current_version) {
      quotation.current_version = 1;
      quotation.versions = [{ version: 1, created_at: quotation.created_at, created_by_user_id: quotation.created_by, created_by_user_name: user_name, charge_categories: quotation.charge_categories, financial_summary: quotation.financial_summary, sent_to_client_at: quotation.sent_to_client_at, revision_reason: "Initial quotation" }];
    }
    
    quotation.status = "Needs Revision";
    quotation.revision_requested_at = new Date().toISOString();
    quotation.pending_revision_reason = revision_reason;
    quotation.updated_at = new Date().toISOString();
    
    const updateRow = splitForInsert(quotation, QUOTATION_COLS);
    const { error } = await db.from("quotations").update(updateRow).eq("id", id);
    if (error) throw error;
    
    if (user_id && user_name && user_department) {
      await logActivity("quotation", id, quotation.quote_number || quotation.quotation_name || id, "revision_requested", user_id, user_name, user_department, null, null, { revision_reason });
    }
    
    console.log(`Quotation ${id} marked for revision: ${revision_reason}`);
    return c.json({ success: true, data: quotation });
  } catch (error) {
    console.error("Error requesting quotation revision:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== CONTRACT ACTIVATION API ====================

// Activate a contract quotation — mirrors accept-and-create-project but simpler:
// no separate entity is created; we just flip contract_status to Active.
app.post("/make-server-c142e950/quotations/:id/activate-contract", async (c) => {
  try {
    const quotation_id = c.req.param("id");

    // [RELATIONAL] Get quotation
    const { data: row, error: fetchErr } = await db.from("quotations").select("*").eq("id", quotation_id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!row) return c.json({ success: false, error: "Quotation not found" }, 404);
    
    const quotation = mergeFromRow(row);

    if (quotation.quotation_type !== "contract") {
      return c.json({ success: false, error: "Only contract quotations can be activated" }, 400);
    }
    if (quotation.status !== "Accepted by Client") {
      return c.json({ success: false, error: "Can only activate contracts from quotations with 'Accepted by Client' status" }, 400);
    }
    if (quotation.contract_status === "Active") {
      return c.json({ success: false, error: "Contract is already active" }, 400);
    }

    const now = new Date().toISOString();
    const updatedQuotation = { ...quotation, status: "Converted to Contract", contract_status: "Active", contract_activated_at: now, updated_at: now };
    
    const updateRow = splitForInsert(updatedQuotation, QUOTATION_COLS);
    await db.from("quotations").update(updateRow).eq("id", quotation_id);

    // Record activity event
    await recordContractActivity(
      quotation_id, "contract_activated", "Contract activated",
      quotation.created_by || "Unknown"
    );

    console.log(`Contract ${quotation.quote_number} activated successfully`);

    return c.json({
      success: true,
      data: { quotation: updatedQuotation },
    });
  } catch (error) {
    console.log(`Error activating contract: ${error}`);
    return c.json({ success: false, error: `Failed to activate contract: ${error}` }, 500);
  }
});

// ==================== PROJECTS API ====================

// Known columns in the projects table (everything else → details JSONB)
const PROJECT_COLS = [
  "id", "project_number", "quotation_id", "customer_id", "customer_name",
  "consignee_id", "status", "services", "service_type",
  "manager_id", "manager_name", "supervisor_id", "supervisor_name",
  "handler_id", "handler_name", "created_by", "created_by_name",
  "notes", "tags", "metadata",
  "created_at", "updated_at", "details"
];
async function getProjectMerged(id: string) {
  const { data: row, error } = await db.from("projects").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return row ? mergeFromRow(row) : null;
}
async function saveProject(project: any) {
  const row = splitForInsert(project, PROJECT_COLS);
  const { error } = await db.from("projects").upsert(row, { onConflict: "id" });
  if (error) throw error;
}

// Accept quotation and create project in one atomic operation
app.post("/make-server-c142e950/quotations/:id/accept-and-create-project", async (c) => {
  try {
    const quotation_id = c.req.param("id");
    const { bd_owner_user_id, bd_owner_user_name, ops_assigned_user_id, ops_assigned_user_name, special_instructions } = await c.req.json();
    
    // [RELATIONAL] Get quotation
    const { data: qRow, error: qErr } = await db.from("quotations").select("*").eq("id", quotation_id).maybeSingle();
    if (qErr) throw qErr;
    if (!qRow) return c.json({ success: false, error: "Quotation not found" }, 404);
    
    const quotation = mergeFromRow(qRow);
    
    if (quotation.status !== "Accepted by Client") {
      return c.json({ success: false, error: "Can only create projects from quotations with 'Accepted by Client' status" }, 400);
    }
    if (quotation.project_id) {
      return c.json({ success: false, error: "Project already exists for this quotation" }, 400);
    }
    
    // Debug: Log services metadata from quotation
    console.log(`Quotation ${quotation.quote_number} has ${quotation.services_metadata?.length || 0} service specifications`);
    
    // [RELATIONAL] Generate project number via counters table
    const year = new Date().getFullYear();
    const counterKey = `project_counter:${year}`;
    const { data: counterRow } = await db.from("counters").select("*").eq("key", counterKey).maybeSingle();
    const newCounterVal = (counterRow?.value || 0) + 1;
    await db.from("counters").upsert({ key: counterKey, value: newCounterVal }, { onConflict: "key" });
    
    const sequenceNumber = newCounterVal.toString().padStart(3, '0');
    const project_number = `PROJ-${year}-${sequenceNumber}`;
    const project_id = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create project from quotation data
    const project = {
      id: project_id,
      project_number,
      quotation_id: quotation.id,
      quotation_number: quotation.quote_number,
      quotation_name: quotation.quotation_name,
      
      // Inherit from quotation
      customer_id: quotation.customer_id,
      customer_name: quotation.customer_name,
      contact_person_id: quotation.contact_person_id,
      contact_person_name: quotation.contact_person_name,
      services: quotation.services || [],
      services_metadata: quotation.services_metadata || [],
      charge_categories: quotation.charge_categories || [],
      currency: quotation.currency,
      total: quotation.financial_summary?.grand_total || 0,
      
      // Shipment details
      movement: quotation.movement,
      category: quotation.category,
      pol_aol: quotation.pol_aol,
      pod_aod: quotation.pod_aod,
      commodity: quotation.commodity,
      incoterm: quotation.incoterm,
      carrier: quotation.carrier,
      volume: quotation.volume,
      gross_weight: quotation.gross_weight,
      chargeable_weight: quotation.chargeable_weight,
      dimensions: quotation.dimensions,
      collection_address: quotation.collection_address,
      
      // Project-specific fields (optional)
      shipment_ready_date: null,
      requested_etd: null,
      special_instructions: special_instructions || "",
      
      // Simplified status (Active/Completed)
      status: "Active",
      booking_status: "Not Booked",
      
      // Bidirectional linking
      linkedBookings: [],
      
      // Ownership
      bd_owner_user_id: bd_owner_user_id || quotation.created_by,
      bd_owner_user_name: bd_owner_user_name || "",
      ops_assigned_user_id: ops_assigned_user_id || null,
      ops_assigned_user_name: ops_assigned_user_name || null,
      
      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null
    };
    
    // [RELATIONAL] Save project using details JSONB overflow
    const projectRow = splitForInsert(project, PROJECT_COLS);
    const { error: projInsErr } = await db.from("projects").insert(projectRow);
    if (projInsErr) throw projInsErr;

    // ==================================================================================
    // ⚡️ AUTO-GENERATE BILLINGS (UNASSIGNED)
    // ==================================================================================
    // Filter charge categories to exclude Reimbursable/Disbursement
    const filteredCategories = (quotation.charge_categories || []).filter((cat: any) => {
      const name = (cat.category_name || cat.name || "").toLowerCase();
      return !name.includes("reimbursable") && !name.includes("disbursement");
    });

    const generatedVouchers: any[] = [];
    const creationTimestamp = new Date().toISOString();
    
    for (const cat of filteredCategories) {
      for (const item of (cat.line_items || [])) {
        // Generate unique ID for this specific line item billing
        const billingId = `BILL-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const itemAmount = item.amount || (item.price * item.quantity);
        
        // Tagging: Default to UNASSIGNED (Project Level Only)
        // Format: PROJECT-{project_number}
        // When a service booking is created later, it will "claim" these based on service tag
        const targetedBookingId = `PROJECT-${project_number}`;
        
        const newBilling = {
          id: billingId,
          billingId, // Legacy support
          bookingId: targetedBookingId, 
          bookingType: item.service || item.service_tag || "general", // CRITICAL: Prioritize 'service' from V3 builder
          
          // Timestamps
          createdAt: creationTimestamp,
          updatedAt: creationTimestamp,
          created_at: creationTimestamp,
          
          // Source tracking
          source: "project",
          project_number: project_number,
          projectNumber: project_number,
          quotationNumber: quotation.quote_number,
          
          // Granular Details
          purpose: item.description || "Service Charge",
          description: `${cat.category_name || cat.name} - ${item.description}`,
          
          // Financials
          amount: itemAmount,
          currency: quotation.currency || "PHP",
          quantity: item.quantity || 1,
          unit: item.unit || "",
          
          // Status
          status: "draft",
          transaction_type: "billing",
          billing_status: "unbilled",
          
          // Notes
          notes: `Auto-generated from project ${project_number}`
        };
        
        // [RELATIONAL] Save billing as evoucher with details JSONB
        const evRow = splitForInsert(newBilling, EVOUCHER_COLS);
        await db.from("evouchers").insert(evRow);
        generatedVouchers.push(newBilling);
      }
    }
    console.log(`✓ Auto-generated ${generatedVouchers.length} billings for Project ${project_number}`);

    // [RELATIONAL] Update quotation: mark as converted and link to project
    quotation.project_id = project_id;
    quotation.project_number = project_number;
    quotation.status = "Converted to Project";
    quotation.converted_to_project_at = new Date().toISOString();
    quotation.updated_at = new Date().toISOString();
    const quoUpdateRow = splitForInsert(quotation, QUOTATION_COLS);
    await db.from("quotations").update(quoUpdateRow).eq("id", quotation.id);
    
    // Log activity
    if (bd_owner_user_id && bd_owner_user_name) {
      await logActivity(
        "project",
        project_id,
        project_number,
        "project_created",
        bd_owner_user_id,
        bd_owner_user_name,
        "Business Development",
        null,
        null,
        { quotation_id: quotation.id, quotation_number: quotation.quote_number }
      );
    }
    
    console.log(`✓ Accepted quotation ${quotation.quote_number} and created project ${project_number}`);
    console.log(`   Services metadata copied: ${project.services_metadata?.length || 0} services`);
    
    return c.json({ 
      success: true, 
      data: {
        quotation,
        project
      }
    });
  } catch (error) {
    console.error("Error accepting quotation and creating project:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Create a new project from approved quotation [RELATIONAL]
app.post("/make-server-c142e950/projects", async (c) => {
  try {
    const projectData = await c.req.json();
    
    const { data: qRow } = await db.from("quotations").select("*").eq("id", projectData.quotation_id).maybeSingle();
    if (!qRow) return c.json({ success: false, error: "Quotation not found" }, 404);
    const quotation = mergeFromRow(qRow);
    
    if (quotation.status !== "Accepted by Client") {
      return c.json({ success: false, error: "Can only create projects from approved quotations" }, 400);
    }
    if (quotation.project_id) {
      return c.json({ success: false, error: "Project already exists for this quotation" }, 400);
    }
    
    const year = new Date().getFullYear();
    const counterKey = `project_counter:${year}`;
    const { data: ctrRow } = await db.from("counters").select("*").eq("key", counterKey).maybeSingle();
    const ctrVal = (ctrRow?.value || 0) + 1;
    await db.from("counters").upsert({ key: counterKey, value: ctrVal }, { onConflict: "key" });
    
    const project_number = `PROJ-${year}-${ctrVal.toString().padStart(3, '0')}`;
    const project_id = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create project from quotation data
    const project = {
      id: project_id,
      project_number,
      quotation_id: quotation.id,
      quotation_number: quotation.quote_number,
      quotation_name: quotation.quotation_name, // ✨ Inherit quotation name
      
      // Inherit from quotation
      customer_id: quotation.customer_id,
      customer_name: quotation.customer_name,
      contact_person_id: quotation.contact_person_id,
      contact_person_name: quotation.contact_person_name,
      services: quotation.services || [],
      services_metadata: quotation.services_metadata || [], // Preserve detailed service specs
      charge_categories: quotation.charge_categories || [],
      currency: quotation.currency,
      total: quotation.financial_summary?.grand_total || 0,
      
      // Shipment details
      movement: quotation.movement,
      category: quotation.category,
      pol_aol: quotation.pol_aol,
      pod_aod: quotation.pod_aod,
      commodity: quotation.commodity,
      incoterm: quotation.incoterm,
      carrier: quotation.carrier,
      volume: quotation.volume,
      gross_weight: quotation.gross_weight,
      chargeable_weight: quotation.chargeable_weight,
      dimensions: quotation.dimensions,
      collection_address: quotation.collection_address,
      
      // Project-specific fields
      shipment_ready_date: projectData.shipment_ready_date || null,
      requested_etd: projectData.requested_etd || null,
      special_instructions: projectData.special_instructions || "",
      
      // Simplified status (Active/Completed)
      status: "Active",
      booking_status: "Not Booked",
      
      // Bidirectional linking
      linkedBookings: [],
      
      // Ownership
      bd_owner_user_id: projectData.bd_owner_user_id || quotation.created_by,
      bd_owner_user_name: projectData.bd_owner_user_name || "",
      ops_assigned_user_id: projectData.ops_assigned_user_id || null,
      ops_assigned_user_name: projectData.ops_assigned_user_name || null,
      
      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null
    };
    
    // [RELATIONAL] Save project
    await saveProject(project);
    
    // Update quotation to mark as converted
    quotation.project_id = project_id;
    quotation.status = "Converted to Project";
    quotation.converted_to_project_at = new Date().toISOString();
    quotation.updated_at = new Date().toISOString();
    const quRow = splitForInsert(quotation, QUOTATION_COLS);
    await db.from("quotations").update(quRow).eq("id", quotation.id);
    
    // Log activity
    if (projectData.bd_owner_user_id && projectData.bd_owner_user_name) {
      await logActivity(
        "project",
        project_id,
        project_number,
        "project_created",
        projectData.bd_owner_user_id,
        projectData.bd_owner_user_name,
        "Business Development",
        null,
        null,
        { quotation_id: quotation.id, quotation_number: quotation.quote_number }
      );
    }
    
    console.log(`Created project: ${project_number} from quotation ${quotation.quote_number}`);
    
    return c.json({ success: true, data: project });
  } catch (error) {
    console.error("Error creating project:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get all projects [RELATIONAL]
app.get("/make-server-c142e950/projects", async (c) => {
  try {
    const status = c.req.query("status");
    const customer_id = c.req.query("customer_id");
    const search = c.req.query("search");
    
    let query = db.from("projects").select("*");
    if (status) query = query.eq("status", status);
    if (customer_id) query = query.eq("customer_id", customer_id);
    query = query.order("created_at", { ascending: false });
    
    const { data: rows, error } = await query;
    if (error) throw error;
    
    let projects = (rows || []).map((r: any) => mergeFromRow(r));
    
    // In-memory filters for fields stored in details JSONB
    const bd_owner_user_id = c.req.query("bd_owner_user_id");
    const ops_assigned_user_id = c.req.query("ops_assigned_user_id");
    if (bd_owner_user_id) projects = projects.filter((p: any) => p.bd_owner_user_id === bd_owner_user_id);
    if (ops_assigned_user_id) projects = projects.filter((p: any) => p.ops_assigned_user_id === ops_assigned_user_id);
    if (search) {
      const s = search.toLowerCase();
      projects = projects.filter((p: any) => p.project_number?.toLowerCase().includes(s) || p.customer_name?.toLowerCase().includes(s) || p.quotation_number?.toLowerCase().includes(s));
    }
    
    // Hydrate with latest quotation data
    try {
      const qIds = [...new Set(projects.map((p: any) => p.quotation_id || p.quotation?.id).filter(Boolean))];
      if (qIds.length > 0) {
        const { data: qRows } = await db.from("quotations").select("*").in("id", qIds);
        const qMap = new Map<string, any>();
        (qRows || []).forEach((qr: any) => { const q = mergeFromRow(qr); qMap.set(q.id, q); });
        
        projects = projects.map((p: any) => {
          const qId = p.quotation_id || p.quotation?.id;
          if (qId && qMap.has(qId)) {
            const lq = qMap.get(qId);
            return { ...p, quotation: lq, customer_name: lq.customer_name || p.customer_name, services: lq.services || p.services, charge_categories: lq.charge_categories || p.charge_categories, currency: lq.currency || p.currency, quotation_name: lq.quotation_name || p.quotation_name, quotation_number: lq.quote_number || p.quotation_number };
          }
          return p;
        });
      }
    } catch (err) { console.error("Error hydrating projects:", err); }
    
    console.log(`Fetched ${projects.length} projects`);
    return c.json({ success: true, data: projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get single project by ID [RELATIONAL]
app.get("/make-server-c142e950/projects/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const project = await getProjectMerged(id);
    if (!project) return c.json({ success: false, error: "Project not found" }, 404);

    // Hydrate with latest quotation
    const quotationId = project.quotation_id || project.quotation?.id;
    if (quotationId) {
      const { data: qRow } = await db.from("quotations").select("*").eq("id", quotationId).maybeSingle();
      if (qRow) {
        const lq = mergeFromRow(qRow);
        project.quotation = lq;
        if (lq.customer_id) project.customer_id = lq.customer_id;
        if (lq.customer_name) project.customer_name = lq.customer_name;
        if (lq.services) project.services = lq.services;
        if (lq.charge_categories) project.charge_categories = lq.charge_categories;
        if (lq.currency) project.currency = lq.currency;
        if (lq.services_metadata) project.services_metadata = lq.services_metadata;
        if (lq.movement) project.movement = lq.movement;
        if (lq.financial_summary) project.total = lq.financial_summary.grand_total;
      }
    }

    // Hydrate linked bookings with fresh status from bookings table
    if (project.linkedBookings?.length > 0) {
      const bookingIds = project.linkedBookings.map((l: any) => l.bookingId).filter(Boolean);
      if (bookingIds.length > 0) {
        const { data: bRows } = await db.from("bookings").select("id, status").in("id", bookingIds);
        const bMap = new Map((bRows || []).map((b: any) => [b.id, b.status]));
        project.linkedBookings.forEach((link: any) => {
          if (bMap.has(link.bookingId)) link.status = bMap.get(link.bookingId);
        });
      }
    }
    
    return c.json({ success: true, data: project });
  } catch (error) {
    console.error("Error fetching project:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get project by project number [RELATIONAL]
app.get("/make-server-c142e950/projects/by-number/:projectNumber", async (c) => {
  try {
    const projectNumber = c.req.param("projectNumber");
    const { data: row } = await db.from("projects").select("*").eq("project_number", projectNumber).maybeSingle();
    if (!row) return c.json({ success: false, error: `Project ${projectNumber} not found` }, 404);
    console.log(`Fetched project by number: ${projectNumber}`);
    return c.json({ success: true, data: mergeFromRow(row) });
  } catch (error) {
    console.error("Error fetching project by number:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update project [RELATIONAL]
app.patch("/make-server-c142e950/projects/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    const project = await getProjectMerged(id);
    if (!project) return c.json({ success: false, error: "Project not found" }, 404);
    
    const updated = { ...project, ...updates, id, created_at: project.created_at, updated_at: new Date().toISOString() };
    await saveProject(updated);
    console.log(`Updated project: ${id}`);
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating project:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Link booking to project (for bidirectional tracking)
app.post("/make-server-c142e950/projects/:id/link-booking", async (c) => {
  try {
    const id = c.req.param("id");
    const { bookingId, bookingNumber, serviceType, status, createdBy } = await c.req.json();
    
    // Validate required fields
    if (!bookingId || !bookingNumber || !serviceType) {
      return c.json({ 
        success: false, 
        error: "Missing required fields: bookingId, bookingNumber, and serviceType are required" 
      }, 400);
    }
    
    const project = await getProjectMerged(id);
    if (!project) return c.json({ success: false, error: "Project not found" }, 404);
    
    if (!project.linkedBookings) project.linkedBookings = [];
    if (project.linkedBookings.some((b: any) => b.bookingId === bookingId)) {
      return c.json({ success: true, data: project });
    }
    const serviceTypeExists = project.linkedBookings.some((b: any) => b.serviceType === serviceType);
    if (serviceTypeExists) {
      const eb = project.linkedBookings.find((b: any) => b.serviceType === serviceType);
      return c.json({ success: false, error: `A ${serviceType} booking (${eb?.bookingNumber || 'unknown'}) already exists for this project.` }, 400);
    }
    
    project.linkedBookings.push({ bookingId, bookingNumber, serviceType, status, createdAt: new Date().toISOString(), createdBy });
    const totalServices = project.services?.length || 0;
    const bookedServices = new Set(project.linkedBookings.map((b: any) => b.serviceType)).size;
    project.booking_status = bookedServices === 0 ? "No Bookings Yet" : bookedServices >= totalServices ? "Fully Booked" : "Partially Booked";
    project.updated_at = new Date().toISOString();
    await saveProject(project);
    
    console.log(`Linked booking ${bookingNumber} to project ${project.project_number} - Status: ${project.booking_status}`);
    
    return c.json({ success: true, data: project });
  } catch (error) {
    console.error("Error linking booking to project:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Unlink booking from project
app.post("/make-server-c142e950/projects/:id/unlink-booking", async (c) => {
  try {
    const id = c.req.param("id");
    const { bookingId } = await c.req.json();
    
    const project = await getProjectMerged(id);
    if (!project) return c.json({ success: false, error: "Project not found" }, 404);
    
    if (project.linkedBookings) {
      project.linkedBookings = project.linkedBookings.filter((b: any) => b.bookingId !== bookingId);
      const totalServices = project.services?.length || 0;
      const bookedServices = new Set(project.linkedBookings.map((b: any) => b.serviceType)).size;
      project.booking_status = bookedServices === 0 ? "No Bookings Yet" : bookedServices >= totalServices ? "Fully Booked" : "Partially Booked";
      project.updated_at = new Date().toISOString();
      await saveProject(project);
      console.log(`Unlinked booking ${bookingId} from project ${project.project_number} - Status: ${project.booking_status}`);
    }
    
    return c.json({ success: true, data: project });
  } catch (error) {
    console.error("Error unlinking booking from project:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Clean up orphaned booking references [RELATIONAL]
app.post("/make-server-c142e950/projects/:id/cleanup-orphaned-bookings", async (c) => {
  try {
    const id = c.req.param("id");
    const project = await getProjectMerged(id);
    if (!project) return c.json({ success: false, error: "Project not found" }, 404);
    
    if (!project.linkedBookings || project.linkedBookings.length === 0) {
      return c.json({ success: true, data: project, message: "No linked bookings to clean up" });
    }
    
    const originalCount = project.linkedBookings.length;
    const bookingIds = project.linkedBookings.map((b: any) => b.bookingId).filter(Boolean);
    
    // Check which bookings exist in the bookings table
    const { data: existingRows } = await db.from("bookings").select("id").in("id", bookingIds);
    const existingSet = new Set((existingRows || []).map((r: any) => r.id));
    
    const verifiedBookings: any[] = [];
    const orphanedBookings: string[] = [];
    for (const booking of project.linkedBookings) {
      if (existingSet.has(booking.bookingId)) {
        verifiedBookings.push(booking);
      } else {
        orphanedBookings.push(booking.bookingId);
      }
    }
    
    project.linkedBookings = verifiedBookings;
    const totalServices = project.services?.length || 0;
    const bookedServices = new Set(verifiedBookings.map((b: any) => b.serviceType)).size;
    project.booking_status = bookedServices === 0 ? "No Bookings Yet" : bookedServices >= totalServices ? "Fully Booked" : "Partially Booked";
    project.updated_at = new Date().toISOString();
    await saveProject(project);
    
    console.log(
      `✅ Cleaned up project ${project.project_number}: ` +
      `Removed ${orphanedBookings.length} orphaned booking(s), ` +
      `${verifiedBookings.length} valid booking(s) remain. ` +
      `Status: ${project.booking_status}`
    );
    
    return c.json({ 
      success: true, 
      data: project,
      message: `Removed ${orphanedBookings.length} orphaned booking reference(s)`,
      details: {
        originalCount,
        verifiedCount: verifiedBookings.length,
        orphanedCount: orphanedBookings.length,
        orphanedBookings
      }
    });
  } catch (error) {
    console.error("Error cleaning up orphaned bookings:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Generate invoice (billing) from project pricing - supports Service-Specific filtering
app.post("/make-server-c142e950/projects/:id/generate-invoice", async (c) => {
  try {
    const projectId = c.req.param("id");
    const { bookingId, bookingType, filterByService } = await c.req.json();
    
    const project = await getProjectMerged(projectId);
    if (!project) return c.json({ success: false, error: "Project not found" }, 404);
    
    if (!project.charge_categories || project.charge_categories.length === 0) {
      return c.json({ success: false, error: "Project has no pricing data to generate invoice from" }, 400);
    }
    
    // Generate billing ID (Base ID - though we might not use it if generating multiple)
    // const baseBillingId = `BILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    // const timestamp = new Date().toISOString(); // Unused in granular model

    let filteredCategories = project.charge_categories;
    let billingDescription = `Invoice for ${project.quotation_name || project.project_number}`;

    // FILTER LOGIC: If bookingType is provided and filtering is requested
    if (bookingType) {
      console.log(`Filtering charges for service: ${bookingType}`);
      
      // 1. Map through categories and filter line items
      filteredCategories = project.charge_categories.map((cat: any) => {
        // Filter line items that match the service tag
        const filteredItems = (cat.line_items || []).filter((item: any) => {
          // Normalize strings for comparison
          const itemService = (item.service_tag || item.service || "").toLowerCase();
          const targetService = bookingType.toLowerCase();
          
          return itemService === targetService;
        });

        if (filteredItems.length === 0) return null;

        return {
          ...cat,
          line_items: filteredItems
        };
      }).filter(Boolean); // Remove null categories
    }
    
    if (filteredCategories.length === 0) {
      return c.json({ success: false, error: `No charges found tagged for service: ${bookingType}` }, 400);
    }
    
    // GRANULAR BILLING GENERATION (Explosion Model)
    // Create one EVoucher per Line Item
    const generatedVouchers: any[] = [];
    const creationTimestamp = new Date().toISOString();
    
    for (const cat of filteredCategories) {
      for (const item of (cat.line_items || [])) {
        // Generate unique ID for this specific line item billing
        const billingId = `BILL-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const itemAmount = item.amount || (item.price * item.quantity);

        // SMART ROUTING LOGIC
        // Default to provided bookingId or Project Fallback
        let targetedBookingId = bookingId || `PROJECT-${project.project_number}`;
        
        // If not explicitly provided, try to find the matching service booking
        if (!bookingId && project.linkedBookings && project.linkedBookings.length > 0) {
          const itemServiceTag = (item.service_tag || item.service || "").toLowerCase();
          
          if (itemServiceTag) {
            const matchingBooking = project.linkedBookings.find((b: any) => 
              (b.serviceType || "").toLowerCase() === itemServiceTag
            );
            
            if (matchingBooking) {
              targetedBookingId = matchingBooking.bookingId;
              // console.log(`Smart Routing: Assigned item "${item.description}" (${itemServiceTag}) to booking ${matchingBooking.bookingId}`);
            }
          }
        }
        
        const newBilling = {
          id: billingId,
          billingId, // Legacy support
          bookingId: targetedBookingId,
          bookingType: bookingType || (item.service_tag || "general"), // Use item tag if available
          
          // Timestamps
          createdAt: creationTimestamp,
          updatedAt: creationTimestamp,
          created_at: creationTimestamp,
          
          // Source tracking
          source: "project",
          project_number: project.project_number,
          projectNumber: project.project_number,
          quotationNumber: project.quotation_number,
          
          // Granular Details
          purpose: item.description || "Service Charge", // This fixes the "Service Charge" label issue
          description: `${cat.category_name || cat.name} - ${item.description}`,
          
          // Financials
          amount: itemAmount,
          currency: project.currency || "PHP",
          quantity: item.quantity || 1,
          unit: item.unit || "",
          
          // Status
          status: "draft",
          transaction_type: "billing",
          billing_status: "unbilled", // Explicitly unbilled
          
          // Notes
          notes: `Auto-generated from project ${project.project_number}`
        };
        
        // [RELATIONAL] Save billing as evoucher
        const evR = splitForInsert(newBilling, EVOUCHER_COLS);
        await db.from("evouchers").insert(evR);
        generatedVouchers.push(newBilling);
      }
    }
    
    console.log(`✓ Generated ${generatedVouchers.length} granular invoices for ${bookingType || "Project"}`);
    
    return c.json({ success: true, data: generatedVouchers });
  } catch (error) {
    console.error("Error generating invoice from project:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete project [RELATIONAL]
app.delete("/make-server-c142e950/projects/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const project = await getProjectMerged(id);
    if (!project) return c.json({ success: false, error: "Project not found" }, 404);
    
    if (project.linkedBookings?.length > 0) {
      return c.json({ success: false, error: "Cannot delete project with linked bookings. Delete all bookings first." }, 400);
    }
    
    await db.from("projects").delete().eq("id", id);
    
    // Revert quotation status
    if (project.quotation_id) {
      const { data: qRow } = await db.from("quotations").select("*").eq("id", project.quotation_id).maybeSingle();
      if (qRow) {
        const q = mergeFromRow(qRow);
        q.project_id = null;
        q.status = "Accepted by Client";
        delete q.converted_to_project_at;
        q.updated_at = new Date().toISOString();
        const uRow = splitForInsert(q, QUOTATION_COLS);
        await db.from("quotations").update(uRow).eq("id", project.quotation_id);
      }
    }
    
    console.log(`Deleted project: ${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Backfill quotation_name for existing projects [RELATIONAL]
app.post("/make-server-c142e950/projects/backfill-names", async (c) => {
  try {
    const { data: pRows } = await db.from("projects").select("*");
    let updated = 0, skipped = 0;
    
    for (const pRow of (pRows || [])) {
      const project = mergeFromRow(pRow);
      if (project.quotation_name) { skipped++; continue; }
      if (project.quotation_id) {
        const { data: qRow } = await db.from("quotations").select("*").eq("id", project.quotation_id).maybeSingle();
        const q = qRow ? mergeFromRow(qRow) : null;
        if (q?.quotation_name) {
          project.quotation_name = q.quotation_name;
          project.updated_at = new Date().toISOString();
          await saveProject(project);
          updated++;
        } else { skipped++; }
      } else { skipped++; }
    }
    return c.json({ success: true, data: { updated, skipped, total: pRows?.length || 0 } });
  } catch (error) {
    console.error("Error backfilling project names:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Migrate services_metadata from camelCase to snake_case for all projects and quotations
app.post("/make-server-c142e950/migrate-services-metadata", async (c) => {
  try {
    // Helper function to migrate service details
    const migrateServiceDetails = (service: any) => {
      if (!service || !service.service_details) return service;
      
      const details = service.service_details;
      const serviceType = service.service_type;
      
      // Create new details object with snake_case fields
      let newDetails: any = {};
      
      if (serviceType === "Brokerage") {
        newDetails = {
          subtype: details.subtype || details.brokerageType,
          shipment_type: details.shipment_type || details.shipmentType,
          type_of_entry: details.type_of_entry || details.typeOfEntry,
          pod: details.pod,
          mode: details.mode,
          cargo_type: details.cargo_type || details.cargoType,
          commodity: details.commodity || details.commodityDescription,
          declared_value: details.declared_value || details.declaredValue,
          delivery_address: details.delivery_address || details.deliveryAddress,
          country_of_origin: details.country_of_origin || details.countryOfOrigin,
          preferential_treatment: details.preferential_treatment || details.preferentialTreatment,
          psic: details.psic,
          aeo: details.aeo
        };
        
        // Remove undefined values
        Object.keys(newDetails).forEach(key => {
          if (newDetails[key] === undefined) delete newDetails[key];
        });
      } else if (serviceType === "Forwarding") {
        // Handle compound fields
        let aol = details.aol;
        let pol = details.pol;
        let aod = details.aod;
        let pod = details.pod;
        
        if (details.aolPol && !aol && !pol) {
          const parts = details.aolPol.split('→').map((s: string) => s.trim());
          aol = parts[0];
          pol = parts[1];
        }
        if (details.aodPod && !aod && !pod) {
          const parts = details.aodPod.split('→').map((s: string) => s.trim());
          aod = parts[0];
          pod = parts[1];
        }
        
        newDetails = {
          incoterms: details.incoterms,
          cargo_type: details.cargo_type || details.cargoType,
          commodity: details.commodity || details.commodityDescription,
          delivery_address: details.delivery_address || details.deliveryAddress,
          mode: details.mode,
          aol: aol,
          pol: pol,
          aod: aod,
          pod: pod
        };
        
        // Remove undefined values
        Object.keys(newDetails).forEach(key => {
          if (newDetails[key] === undefined) delete newDetails[key];
        });
      } else if (serviceType === "Trucking") {
        newDetails = {
          pull_out: details.pull_out || details.pullOut,
          delivery_address: details.delivery_address || details.deliveryAddress,
          truck_type: details.truck_type || details.truckType,
          delivery_instructions: details.delivery_instructions || details.deliveryInstructions
        };
        
        // Remove undefined values
        Object.keys(newDetails).forEach(key => {
          if (newDetails[key] === undefined) delete newDetails[key];
        });
      } else if (serviceType === "Marine Insurance") {
        // Handle compound fields
        let aol = details.aol;
        let pol = details.pol;
        let aod = details.aod;
        let pod = details.pod;
        
        if (details.aolPol && !aol && !pol) {
          const parts = details.aolPol.split('→').map((s: string) => s.trim());
          aol = parts[0];
          pol = parts[1];
        }
        if (details.aodPod && !aod && !pod) {
          const parts = details.aodPod.split('→').map((s: string) => s.trim());
          aod = parts[0];
          pod = parts[1];
        }
        
        newDetails = {
          commodity_description: details.commodity_description || details.commodityDescription,
          hs_code: details.hs_code || details.hsCode,
          aol: aol,
          pol: pol,
          aod: aod,
          pod: pod,
          invoice_value: details.invoice_value || details.invoiceValue
        };
        
        // Remove undefined values
        Object.keys(newDetails).forEach(key => {
          if (newDetails[key] === undefined) delete newDetails[key];
        });
      } else if (serviceType === "Others") {
        newDetails = {
          service_description: details.service_description || details.serviceDescription
        };
        
        // Remove undefined values
        Object.keys(newDetails).forEach(key => {
          if (newDetails[key] === undefined) delete newDetails[key];
        });
      } else {
        // Unknown service type, keep as is
        newDetails = details;
      }
      
      return {
        ...service,
        service_details: newDetails
      };
    };
    
    // [RELATIONAL] Migrate all projects
    const { data: pRows } = await db.from("projects").select("*");
    let projectsUpdated = 0, projectsSkipped = 0;
    for (const pRow of (pRows || [])) {
      const project = mergeFromRow(pRow);
      if (project.services_metadata && Array.isArray(project.services_metadata)) {
        project.services_metadata = project.services_metadata.map(migrateServiceDetails);
        project.updated_at = new Date().toISOString();
        await saveProject(project);
        projectsUpdated++;
      } else { projectsSkipped++; }
    }
    
    // [RELATIONAL] Migrate all quotations
    const { data: qRows } = await db.from("quotations").select("*");
    let quotationsUpdated = 0, quotationsSkipped = 0;
    for (const qRow of (qRows || [])) {
      const quotation = mergeFromRow(qRow);
      if (quotation.services_metadata && Array.isArray(quotation.services_metadata)) {
        quotation.services_metadata = quotation.services_metadata.map(migrateServiceDetails);
        quotation.updated_at = new Date().toISOString();
        const uRow = splitForInsert(quotation, QUOTATION_COLS);
        await db.from("quotations").update(uRow).eq("id", quotation.id);
        quotationsUpdated++;
      } else { quotationsSkipped++; }
    }
    
    console.log(`Migration complete!`);
    console.log(`  Projects: ${projectsUpdated} updated, ${projectsSkipped} skipped`);
    console.log(`  Quotations: ${quotationsUpdated} updated, ${quotationsSkipped} skipped`);
    
    return c.json({ 
      success: true, 
      data: { 
        projects: { updated: projectsUpdated, skipped: projectsSkipped, total: projects.length },
        quotations: { updated: quotationsUpdated, skipped: quotationsSkipped, total: quotations.length }
      }
    });
  } catch (error) {
    console.error("Error migrating services_metadata:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== BOOKINGS API ====================

// Known columns in the bookings table
const BOOKING_COLS = [
  "id", "booking_number", "service_type", "project_id", "contract_id",
  "customer_id", "customer_name", "consignee_id", "status",
  "manager_id", "manager_name", "supervisor_id", "supervisor_name",
  "handler_id", "handler_name", "created_by",
  "containers", "bls", "sets", "shipments",
  "details", "total_revenue", "total_cost", "applied_rates",
  "notes", "tags", "created_at", "updated_at", "movement_type", "mode"
];
async function getBookingMerged(id: string) {
  const { data: row, error } = await db.from("bookings").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return row ? mergeFromRow(row) : null;
}
async function saveBooking(booking: any) {
  const row = splitForInsert(booking, BOOKING_COLS);
  const { error } = await db.from("bookings").upsert(row, { onConflict: "id" });
  if (error) throw error;
}

// Known columns in evouchers table
const EVOUCHER_COLS = [
  "id", "evoucher_number", "transaction_type", "source_module", "voucher_type",
  "booking_id", "project_id", "project_number", "contract_id",
  "customer_id", "customer_name", "vendor_name", "vendor_id",
  "amount", "currency", "payment_method", "credit_terms", "description", "purpose",
  "status", "submitted_at", "approved_at", "posted_at",
  "approvers", "journal_entry_id", "draft_transaction_id",
  "gl_category", "gl_sub_category", "liquidation",
  "attachments", "notes", "created_by", "created_by_name",
  "created_at", "updated_at",
  // 002 additions:
  "service_type", "ledger_entry_id", "reference_number", "details"
];
async function getEvoucherMerged(id: string) {
  const { data: row, error } = await db.from("evouchers").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return row ? mergeFromRow(row) : null;
}
async function saveEvoucher(ev: any) {
  // Normalize KV field aliases → relational column names
  if (ev.voucher_number && !ev.evoucher_number) ev.evoucher_number = ev.voucher_number;
  const row = splitForInsert(ev, EVOUCHER_COLS);
  const { error } = await db.from("evouchers").upsert(row, { onConflict: "id" });
  if (error) throw error;
}

// Create a new booking [RELATIONAL]
app.post("/make-server-c142e950/bookings", async (c) => {
  try {
    const booking = await c.req.json();
    if (!booking.id) booking.id = `BKG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    booking.created_at = booking.created_at || new Date().toISOString();
    booking.updated_at = new Date().toISOString();
    if (!booking.status) booking.status = "Draft";
    
    await saveBooking(booking);
    console.log(`Created booking: ${booking.id} with status: ${booking.status}`);
    return c.json({ success: true, data: booking });
  } catch (error) {
    console.error("Error creating booking:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get all bookings (with optional filters)
app.get("/make-server-c142e950/bookings", async (c) => {
  try {
    const status = c.req.query("status");
    const search = c.req.query("search");
    const customer_id = c.req.query("customer_id");
    const created_by = c.req.query("created_by");
    const contract_id = c.req.query("contract_id"); // ✨ CONTRACT: filter by linked contract
    const date_from = c.req.query("date_from");
    const date_to = c.req.query("date_to");
    const sort_by = c.req.query("sort_by") || "updated_at";
    const sort_order = c.req.query("sort_order") || "desc";
    const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : undefined;
    const offset = c.req.query("offset") ? parseInt(c.req.query("offset")!) : 0;
    
    // [RELATIONAL] All booking types now in single bookings table
    let query = db.from("bookings").select("*");
    if (contract_id) query = query.eq("contract_id", contract_id);
    if (customer_id) query = query.eq("customer_id", customer_id);
    if (created_by) query = query.eq("created_by", created_by);
    if (date_from) query = query.gte("created_at", date_from);
    if (date_to) query = query.lte("created_at", new Date(new Date(date_to).setHours(23,59,59,999)).toISOString());
    
    const { data: bRows, error: bErr } = await query;
    if (bErr) throw bErr;
    
    let filtered = (bRows || []).map((r: any) => mergeFromRow(r));
    
    // Filter by search query (searches tracking_number and booking_name)
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((b: any) => 
        b.tracking_number?.toLowerCase().includes(searchLower) ||
        b.booking_name?.toLowerCase().includes(searchLower) ||
        b.id?.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by status if provided
    if (status) {
      filtered = filtered.filter((b: any) => b.status === status);
    }
    
    const total = filtered.length;
    
    // Sort
    filtered.sort((a: any, b: any) => {
      let aVal, bVal;
      switch (sort_by) {
        case "created_at":
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        case "updated_at":
        default:
          aVal = new Date(a.updated_at).getTime();
          bVal = new Date(b.updated_at).getTime();
          break;
      }
      return sort_order === "asc" 
        ? (aVal > bVal ? 1 : aVal < bVal ? -1 : 0)
        : (aVal < bVal ? 1 : aVal > bVal ? -1 : 0);
    });
    
    const paginated = limit ? filtered.slice(offset, offset + limit) : filtered;
    
    console.log(`Fetched ${paginated.length}/${total} bookings (offset: ${offset}, limit: ${limit || 'all'})`);
    
    return c.json({ 
      success: true, 
      data: paginated,
      pagination: {
        total,
        offset,
        limit: limit || total,
        hasMore: limit ? (offset + limit) < total : false
      }
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get single booking by ID [RELATIONAL]
app.get("/make-server-c142e950/bookings/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const booking = await getBookingMerged(id);
    if (!booking) return c.json({ success: false, error: "Booking not found" }, 404);
    console.log(`Fetched booking: ${id}`);
    return c.json({ success: true, data: booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update booking [RELATIONAL]
app.patch("/make-server-c142e950/bookings/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    const existing = await getBookingMerged(id);
    if (!existing) return c.json({ success: false, error: "Booking not found" }, 404);
    const updated = { ...existing, ...updates, id, created_at: existing.created_at, updated_at: new Date().toISOString() };
    await saveBooking(updated);
    console.log(`Updated booking: ${id}`);
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating booking:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete booking [RELATIONAL]
app.delete("/make-server-c142e950/bookings/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { error } = await db.from("bookings").delete().eq("id", id);
    if (error) throw error;
    console.log(`Deleted booking: ${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== EXPENSES API ====================

// Create a new expense
app.post("/make-server-c142e950/expenses", async (c) => {
  try {
    const expense = await c.req.json();
    
    // Generate unique ID if not provided
    if (!expense.id) {
      expense.id = `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Set timestamps
    expense.created_at = expense.created_at || new Date().toISOString();
    expense.updated_at = new Date().toISOString();
    
    // Set default status if not provided
    if (!expense.status) {
      expense.status = "Pending";
    }
    
    // [RELATIONAL] Save expense
    const { error } = await db.from("expenses").insert(expense);
    if (error) throw error;
    console.log(`Created expense: ${expense.id} with status: ${expense.status}`);
    return c.json({ success: true, data: expense });
  } catch (error) {
    console.error("Error creating expense:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get all expenses [RELATIONAL]
app.get("/make-server-c142e950/expenses", async (c) => {
  try {
    const bookingId = c.req.query("bookingId") || c.req.query("booking_id");
    const status = c.req.query("status");
    const search = c.req.query("search");
    const created_by = c.req.query("created_by");
    const date_from = c.req.query("date_from");
    const date_to = c.req.query("date_to");
    const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : undefined;
    const offset = c.req.query("offset") ? parseInt(c.req.query("offset")!) : 0;
    
    let query = db.from("expenses").select("*");
    if (bookingId) query = query.eq("booking_id", bookingId);
    if (status) query = query.eq("status", status);
    if (created_by) query = query.eq("created_by", created_by);
    if (date_from) query = query.gte("created_at", date_from);
    if (date_to) query = query.lte("created_at", new Date(new Date(date_to).setHours(23,59,59,999)).toISOString());
    query = query.order("updated_at", { ascending: false });
    
    const { data: rows, error } = await query;
    if (error) throw error;
    
    let filtered = rows || [];
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((e: any) => e.description?.toLowerCase().includes(s) || e.id?.toLowerCase().includes(s) || e.category?.toLowerCase().includes(s));
    }
    const total = filtered.length;
    const paginated = limit ? filtered.slice(offset, offset + limit) : filtered;
    return c.json({ success: true, data: paginated, pagination: { total, offset, limit: limit || total, hasMore: limit ? (offset + limit) < total : false } });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get single expense [RELATIONAL]
app.get("/make-server-c142e950/expenses/:id", async (c) => {
  try {
    const { data: expense, error } = await db.from("expenses").select("*").eq("id", c.req.param("id")).maybeSingle();
    if (error) throw error;
    if (!expense) return c.json({ success: false, error: "Expense not found" }, 404);
    return c.json({ success: true, data: expense });
  } catch (error) { return c.json({ success: false, error: String(error) }, 500); }
});

// Update expense [RELATIONAL]
app.patch("/make-server-c142e950/expenses/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    updates.updated_at = new Date().toISOString();
    const { data: updated, error } = await db.from("expenses").update(updates).eq("id", id).select().maybeSingle();
    if (error) throw error;
    if (!updated) return c.json({ success: false, error: "Expense not found" }, 404);
    return c.json({ success: true, data: updated });
  } catch (error) { return c.json({ success: false, error: String(error) }, 500); }
});

// Delete expense [RELATIONAL]
app.delete("/make-server-c142e950/expenses/:id", async (c) => {
  try {
    const { error } = await db.from("expenses").delete().eq("id", c.req.param("id"));
    if (error) throw error;
    return c.json({ success: true });
  } catch (error) { return c.json({ success: false, error: String(error) }, 500); }
});

// ==================== SEED DATA API ====================

// Seed all entity types with test data
app.post("/make-server-c142e950/entities/seed", async (c) => {
  try {
    const results = {
      customers: [],
      contacts: [],
      quotations: [],
      bookings: [],
      expenses: [],
      projects: []
    };
    
    // === SEED CUSTOMERS ===
    const customers = [
      {
        id: "customer-1",
        company_name: "ABC Logistics Corp",
        industry: "Logistics",
        status: "Active",
        registered_address: "123 Ayala Avenue, Makati City",
        email: "info@abclogistics.ph",
        phone: "+63 2 8123 4567",
        created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "customer-2",
        company_name: "XYZ Manufacturing Inc",
        industry: "Manufacturing",
        status: "Active",
        registered_address: "456 Ortigas Avenue, Pasig City",
        email: "contact@xyzmanufacturing.ph",
        phone: "+63 2 8234 5678",
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "customer-3",
        company_name: "Global Trading Solutions",
        industry: "Trading",
        status: "Active",
        registered_address: "789 BGC, Taguig City",
        email: "hello@globaltrading.ph",
        phone: "+63 2 8345 6789",
        created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "customer-4",
        company_name: "Pacific Import Export",
        industry: "Import/Export",
        status: "Prospect",
        registered_address: "321 Roxas Boulevard, Manila",
        email: "info@pacificimport.ph",
        phone: "+63 2 8456 7890",
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "customer-5",
        company_name: "Metro Retail Group",
        industry: "Retail",
        status: "Active",
        registered_address: "654 Shaw Boulevard, Mandaluyong",
        email: "procurement@metroretail.ph",
        phone: "+63 2 8567 8901",
        created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    for (const customer of customers) {
      await db.from("customers").upsert(customer, { onConflict: "id" });
      results.customers.push(customer);
    }
    
    // === SEED CONTACTS ===
    // ⚠️ REMOVED: Contact seed data has been removed to prevent fake data pollution
    // Users should create real contacts through the UI instead
    
    // === SEED QUOTATIONS ===
    const quotations = [
      {
        id: "QUO-1734500000-abc123",
        quote_number: "QUO-1734500000-abc123",
        quotation_name: "Container Shipment - Manila to Cebu",
        customer_id: "customer-1",
        customer_name: "ABC Logistics Corp",
        contact_person_id: "contact-1",
        contact_person_name: "Juan Dela Cruz",
        status: "Draft",
        origin: "Manila",
        destination: "Cebu",
        cargo_type: "General Cargo",
        container_size: "20ft",
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "QUO-1734400000-def456",
        quote_number: "QUO-1734400000-def456",
        quotation_name: "Air Freight - Manila to Singapore",
        customer_id: "customer-2",
        customer_name: "XYZ Manufacturing Inc",
        contact_person_id: "contact-3",
        contact_person_name: "Pedro Reyes",
        status: "Pending Pricing",
        origin: "Manila",
        destination: "Singapore",
        cargo_type: "Electronics",
        weight: "500kg",
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "QUO-1734300000-ghi789",
        quote_number: "QUO-1734300000-ghi789",
        quotation_name: "Sea Freight - Davao to Hong Kong",
        customer_id: "customer-3",
        customer_name: "Global Trading Solutions",
        contact_person_id: "contact-4",
        contact_person_name: "Ana Garcia",
        status: "Quotation",
        origin: "Davao",
        destination: "Hong Kong",
        cargo_type: "Agricultural Products",
        container_size: "40ft",
        ocean_freight_rate: 1200,
        local_charges: 300,
        total_price: 1500,
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "QUO-1734200000-jkl012",
        quote_number: "QUO-1734200000-jkl012",
        quotation_name: "LCL Shipment - Manila to Japan",
        customer_id: "customer-1",
        customer_name: "ABC Logistics Corp",
        contact_person_id: "contact-2",
        contact_person_name: "Maria Santos",
        status: "Rejected",
        origin: "Manila",
        destination: "Tokyo",
        cargo_type: "Consumer Goods",
        weight: "2000kg",
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "QUO-1734100000-mno345",
        quote_number: "QUO-1734100000-mno345",
        quotation_name: "Express Delivery - Manila to Cebu",
        customer_id: "customer-5",
        customer_name: "Metro Retail Group",
        contact_person_id: "contact-6",
        contact_person_name: "Sofia Rodriguez",
        status: "Draft",
        origin: "Manila",
        destination: "Cebu",
        cargo_type: "Retail Products",
        weight: "100kg",
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "QUO-1734050000-pqr678",
        quote_number: "QUO-1734050000-pqr678",
        quotation_name: "Bulk Cargo - Subic to Vietnam",
        customer_id: "customer-2",
        customer_name: "XYZ Manufacturing Inc",
        contact_person_id: "contact-3",
        contact_person_name: "Pedro Reyes",
        status: "Quotation",
        origin: "Subic",
        destination: "Ho Chi Minh",
        cargo_type: "Raw Materials",
        weight: "5000kg",
        ocean_freight_rate: 2500,
        local_charges: 600,
        total_price: 3100,
        created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "QUO-1734000000-stu901",
        quote_number: "QUO-1734000000-stu901",
        quotation_name: "Refrigerated Container - Manila to USA",
        customer_id: "customer-3",
        customer_name: "Global Trading Solutions",
        contact_person_id: "contact-4",
        contact_person_name: "Ana Garcia",
        status: "Pending Pricing",
        origin: "Manila",
        destination: "Los Angeles",
        cargo_type: "Perishable Goods",
        container_size: "20ft Reefer",
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "QUO-1733900000-vwx234",
        quote_number: "QUO-1733900000-vwx234",
        quotation_name: "Multimodal Transport - Cebu to Europe",
        customer_id: "customer-4",
        customer_name: "Pacific Import Export",
        contact_person_id: "contact-5",
        contact_person_name: "Carlos Mendoza",
        status: "Draft",
        origin: "Cebu",
        destination: "Rotterdam",
        cargo_type: "Mixed Cargo",
        container_size: "40ft HC",
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    for (const quotation of quotations) {
      const qRow = splitForInsert(quotation, QUOTATION_COLS);
      await db.from("quotations").upsert(qRow, { onConflict: "id" });
      results.quotations.push(quotation);
    }
    
    // === SEED BOOKINGS ===
    const bookings = [
      {
        id: "BKG-1734600000-aaa111",
        tracking_number: "ABCL-2024-001",
        booking_name: "Container to Cebu - ABC Logistics",
        customer_id: "customer-1",
        customer_name: "ABC Logistics Corp",
        quotation_id: "QUO-1734300000-ghi789",
        status: "In Transit",
        origin: "Manila",
        destination: "Cebu",
        departure_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "BKG-1734500000-bbb222",
        tracking_number: "XYZM-2024-045",
        booking_name: "Air Freight to Singapore - XYZ Manufacturing",
        customer_id: "customer-2",
        customer_name: "XYZ Manufacturing Inc",
        quotation_id: "QUO-1734050000-pqr678",
        status: "Delivered",
        origin: "Manila",
        destination: "Singapore",
        departure_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        eta: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
        delivery_date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "BKG-1734400000-ccc333",
        tracking_number: "GLTS-2024-089",
        booking_name: "Sea Freight to Hong Kong - Global Trading",
        customer_id: "customer-3",
        customer_name: "Global Trading Solutions",
        quotation_id: "QUO-1734300000-ghi789",
        status: "Completed",
        origin: "Davao",
        destination: "Hong Kong",
        departure_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        eta: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
        delivery_date: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "BKG-1734300000-ddd444",
        tracking_number: "METR-2024-012",
        booking_name: "Express Delivery - Metro Retail",
        customer_id: "customer-5",
        customer_name: "Metro Retail Group",
        status: "Processing",
        origin: "Manila",
        destination: "Cebu",
        departure_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        eta: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: "BKG-1734200000-eee555",
        tracking_number: "PACI-2024-034",
        booking_name: "Import Cargo - Pacific Import Export",
        customer_id: "customer-4",
        customer_name: "Pacific Import Export",
        status: "Draft",
        origin: "Shanghai",
        destination: "Manila",
        departure_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        eta: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    for (const booking of bookings) {
      await saveBooking(booking);
      results.bookings.push(booking);
    }
    
    // === SEED EXPENSES ===
    const expenses = [
      {
        id: "EXP-1734700000-xxx111",
        expense_name: "Ocean Freight Charges",
        booking_id: "BKG-1734600000-aaa111",
        category: "Transportation",
        amount: 1200,
        currency: "USD",
        status: "Approved",
        vendor: "Maersk Line",
        description: "Ocean freight from Manila to Cebu",
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "EXP-1734600000-yyy222",
        expense_name: "Local Port Charges",
        booking_id: "BKG-1734600000-aaa111",
        category: "Port Fees",
        amount: 300,
        currency: "USD",
        status: "Approved",
        vendor: "Manila Port Authority",
        description: "Local handling and port fees",
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "EXP-1734500000-zzz333",
        expense_name: "Customs Clearance",
        booking_id: "BKG-1734500000-bbb222",
        category: "Customs",
        amount: 450,
        currency: "USD",
        status: "Paid",
        vendor: "ABC Customs Broker",
        description: "Import customs clearance Singapore",
        created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "EXP-1734400000-www444",
        expense_name: "Trucking Service",
        booking_id: "BKG-1734400000-ccc333",
        category: "Transportation",
        amount: 180,
        currency: "USD",
        status: "Paid",
        vendor: "FastTrack Logistics",
        description: "Inland transport from port to warehouse",
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "EXP-1734300000-vvv555",
        expense_name: "Warehouse Storage",
        booking_id: "BKG-1734300000-ddd444",
        category: "Storage",
        amount: 120,
        currency: "USD",
        status: "Pending",
        vendor: "Metro Warehouse Inc",
        description: "7 days storage fee",
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "EXP-1734200000-uuu666",
        expense_name: "Insurance Premium",
        booking_id: "BKG-1734500000-bbb222",
        category: "Insurance",
        amount: 250,
        currency: "USD",
        status: "Approved",
        vendor: "Marine Insurance Co",
        description: "Cargo insurance coverage",
        created_at: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    for (const expense of expenses) {
      await db.from("expenses").upsert(expense, { onConflict: "id" });
      results.expenses.push(expense);
    }
    
    // === SEED PROJECTS ===
    const projects = [
      {
        id: "PRJ-2024-001",
        project_number: "PRJ-2024-001",
        quotation_id: "QUO-1734300000-ghi789",
        quotation_number: "QUO-1734300000-ghi789",
        quotation_name: "Manila to Cebu Electronics Export",
        customer_id: "customer-1",
        customer_name: "ABC Logistics Corp",
        contact_person_name: "Juan Dela Cruz",
        status: "Active",
        booking_status: "No Bookings Yet",
        bd_owner_user_id: "user-bd-rep-001",
        bd_owner_user_name: "Juan Dela Cruz",
        bd_owner_email: "bd.rep@neuron.ph",
        ops_assigned_user_id: "user-ops-rep-001",
        ops_assigned_user_name: "Carlos Mendoza",
        // Route information
        movement: "EXPORT",
        category: "SEA FREIGHT",
        shipment_type: "FCL",
        pol_aol: "Manila",
        pod_aod: "Cebu",
        carrier: "Maersk",
        transit_days: 3,
        incoterm: "FOB",
        commodity: "Electronics",
        // Service list
        services: ["Forwarding"],
        services_metadata: [
          {
            service_type: "Forwarding",
            service_details: {
              mode: "Ocean",
              incoterms: "FOB",
              cargo_type: "General",
              commodity: "Electronics",
              pol: "Manila",
              pod: "Cebu"
            }
          }
        ],
        // Cargo details
        volume_cbm: 28.5,
        volume_containers: "2x20' STD",
        volume_packages: 40,
        gross_weight: 12500,
        chargeable_weight: 12500,
        cargo_type: "General",
        stackability: "Stackable",
        // Project details
        client_po_number: "PO-ABC-2024-158",
        client_po_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        shipment_ready_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        requested_etd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        special_instructions: "Handle with care - fragile electronics",
        // Financial
        currency: "PHP",
        total: 85000,
        // Tracking
        linkedBookings: [],
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "PRJ-2024-002",
        project_number: "PRJ-2024-002",
        quotation_id: "QUO-1734050000-pqr678",
        quotation_number: "QUO-1734050000-pqr678",
        quotation_name: "Subic to Ho Chi Minh Raw Materials",
        customer_id: "customer-2",
        customer_name: "XYZ Manufacturing Inc",
        contact_person_name: "Maria Santos",
        status: "Active",
        booking_status: "Partially Booked",
        bd_owner_user_id: "user-bd-manager-001",
        bd_owner_user_name: "Maria Santos",
        bd_owner_email: "bd.manager@neuron.ph",
        ops_assigned_user_id: null,
        ops_assigned_user_name: null,
        // Route information
        movement: "EXPORT",
        category: "SEA FREIGHT",
        shipment_type: "FCL",
        pol_aol: "Subic",
        pod_aod: "Ho Chi Minh",
        carrier: "ONE Line",
        transit_days: 5,
        incoterm: "CIF",
        commodity: "Raw Materials",
        // Service list
        services: ["Forwarding", "Trucking"],
        services_metadata: [
          {
            service_type: "Forwarding",
            service_details: {
              mode: "Ocean",
              incoterms: "CIF",
              cargo_type: "General",
              commodity: "Raw Materials",
              pol: "Subic",
              pod: "Ho Chi Minh"
            }
          },
          {
            service_type: "Trucking",
            service_details: {
              pull_out: "Factory A, Subic Bay Freeport Zone",
              delivery_address: "Subic Port Terminal",
              truck_type: "10W"
            }
          }
        ],
        // Cargo details
        volume_cbm: 67.2,
        volume_containers: "1x40' HC",
        volume_packages: 80,
        gross_weight: 22000,
        chargeable_weight: 22000,
        cargo_type: "General",
        stackability: "Stackable",
        // Project details
        client_po_number: "PO-XYZ-2024-089",
        client_po_date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
        shipment_ready_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        requested_etd: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        special_instructions: "Coordinate with factory for pickup schedule",
        // Financial
        currency: "PHP",
        total: 120000,
        // Tracking - One service booked (Forwarding)
        linkedBookings: [
          {
            bookingId: "FOR-2024-001",
            bookingNumber: "FOR-2024-001",
            serviceType: "Forwarding",
            status: "Draft",
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            createdBy: "Carlos Mendoza"
          }
        ],
        created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "PRJ-2024-003",
        project_number: "PRJ-2024-003",
        quotation_id: "QUO-1734000000-abc123",
        quotation_number: "QUO-1734000000-abc123",
        quotation_name: "Manila to Singapore Textile Air Freight",
        customer_id: "customer-3",
        customer_name: "Global Trading Solutions",
        contact_person_name: "Robert Lee",
        status: "Completed",
        booking_status: "Fully Booked",
        bd_owner_user_id: "user-bd-rep-001",
        bd_owner_user_name: "Juan Dela Cruz",
        bd_owner_email: "bd.rep@neuron.ph",
        ops_assigned_user_id: "user-ops-rep-001",
        ops_assigned_user_name: "Carlos Mendoza",
        // Route information
        movement: "EXPORT",
        category: "AIR FREIGHT",
        shipment_type: "Consolidation",
        pol_aol: "Manila",
        pod_aod: "Singapore",
        carrier: "Singapore Airlines",
        transit_days: 1,
        incoterm: "EXW",
        commodity: "Textile Products",
        // Service list
        services: ["Forwarding"],
        services_metadata: [
          {
            service_type: "Forwarding",
            service_details: {
              mode: "Air",
              incoterms: "EXW",
              cargo_type: "General",
              commodity: "Textile Products",
              aol: "Manila",
              aod: "Singapore",
              pol: "Manila",
              pod: "Singapore"
            }
          }
        ],
        // Cargo details
        volume_cbm: 2.5,
        gross_weight: 500,
        chargeable_weight: 500,
        cargo_type: "General",
        stackability: "Stackable",
        // Project details
        client_po_number: "PO-GTS-2024-042",
        client_po_date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        shipment_ready_date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        requested_etd: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
        actual_etd: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
        eta: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        actual_delivery_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        // Financial
        currency: "PHP",
        total: 65000,
        // Tracking - Fully booked
        linkedBookings: [
          {
            bookingId: "FOR-2024-099",
            bookingNumber: "FOR-2024-099",
            serviceType: "Forwarding",
            status: "Completed",
            createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
            createdBy: "Carlos Mendoza"
          }
        ],
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    for (const project of projects) {
      await saveProject(project);
      results.projects.push(project);
    }
    
    console.log(`Seeded ${results.customers.length} customers, ${results.contacts.length} contacts, ${results.quotations.length} quotations, ${results.bookings.length} bookings, ${results.expenses.length} expenses, ${results.projects.length} projects`);
    
    return c.json({
      success: true,
      message: "Successfully seeded all entity data",
      data: {
        customers: results.customers.length,
        contacts: results.contacts.length,
        quotations: results.quotations.length,
        bookings: results.bookings.length,
        expenses: results.expenses.length,
        projects: results.projects.length,
        total: results.customers.length + results.contacts.length + results.quotations.length + results.bookings.length + results.expenses.length + results.projects.length
      }
    });
  } catch (error) {
    console.error("Error seeding entity data:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== OPERATIONS MODULE API ====================

// Helper function to generate booking ID
function generateBookingId(type: string): string {
  const prefix = type.toUpperCase().substring(0, 3);
  const year = new Date().getFullYear();
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${year}-${random}`;
}

// Helper function to unlink a booking from its project [RELATIONAL]
async function unlinkBookingFromProject(booking: any, bookingId: string): Promise<void> {
  const projectIdentifier = booking.projectId || booking.projectNumber;
  if (!projectIdentifier) return;
  
  let project;
  if (booking.projectId) {
    project = await getProjectMerged(booking.projectId);
  } else if (booking.projectNumber) {
    const { data: row } = await db.from("projects").select("*").eq("project_number", booking.projectNumber).maybeSingle();
    project = row ? mergeFromRow(row) : null;
  }
  
  if (project?.linkedBookings) {
    const initialLength = project.linkedBookings.length;
    project.linkedBookings = project.linkedBookings.filter((b: any) => b.bookingId !== bookingId);
    if (project.linkedBookings.length !== initialLength) {
      const totalServices = project.services?.length || 0;
      const bookedServices = new Set(project.linkedBookings.map((b: any) => b.serviceType)).size;
      project.booking_status = bookedServices === 0 ? "No Bookings Yet" : bookedServices >= totalServices ? "Fully Booked" : "Partially Booked";
      project.updated_at = new Date().toISOString();
      await saveProject(project);
      console.log(`✓ Unlinked booking ${bookingId} from project ${project.project_number}`);
    }
  }
}

// ==================== FORWARDING BOOKINGS ====================

// Helper: service-type booking CRUD helpers [RELATIONAL]
async function getServiceBookings(serviceType: string, assignedUserId?: string | null) {
  let query = db.from("bookings").select("*").eq("service_type", serviceType);
  const { data: rows, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  let bookings = (rows || []).map((r: any) => mergeFromRow(r));
  if (assignedUserId) {
    bookings = bookings.filter((b: any) => b.assigned_manager_id === assignedUserId || b.assigned_supervisor_id === assignedUserId || b.assigned_handler_id === assignedUserId);
  }
  return bookings;
}

async function claimBillingsForBooking(bookingId: string, projectNumber: string, serviceType: string, matchTags: string[]) {
  try {
    const { data: billings } = await db.from("evouchers").select("*")
      .eq("project_number", projectNumber)
      .eq("transaction_type", "billing");
    let claimedCount = 0;
    for (const bRow of (billings || [])) {
      const billing = mergeFromRow(bRow);
      if (billing.bookingId !== `PROJECT-${projectNumber}` && billing.bookingId) continue;
      const tag = (billing.bookingType || "").toLowerCase();
      if (matchTags.some(t => tag.includes(t))) {
        billing.bookingId = bookingId;
        billing.updatedAt = new Date().toISOString();
        await saveEvoucher(billing);
        claimedCount++;
      }
    }
    console.log(`✓ ${serviceType} Booking ${bookingId} claimed ${claimedCount} billings from Project ${projectNumber}`);
  } catch (err) { console.error(`Error in Smart Routing (${serviceType}):`, err); }
}

async function deleteBookingCascade(bookingId: string) {
  // Delete associated evouchers/billings and expenses
  await db.from("evouchers").delete().or(`booking_id.eq.${bookingId},details->>bookingId.eq.${bookingId}`);
  await db.from("expenses").delete().or(`booking_id.eq.${bookingId}`);
}

// Get all forwarding bookings [RELATIONAL]
app.get("/make-server-c142e950/forwarding-bookings", async (c) => {
  try {
    const assigned_to_user_id = c.req.query("assigned_to_user_id");
    let bookings = await getServiceBookings("Forwarding", assigned_to_user_id);
    
    // Filter by assigned user if provided (Operations team filtering)
    if (assigned_to_user_id) {
      bookings = bookings.filter((b: any) => 
        b.assigned_manager_id === assigned_to_user_id ||
        b.assigned_supervisor_id === assigned_to_user_id ||
        b.assigned_handler_id === assigned_to_user_id
      );
    }
    
    // Sort by createdAt descending (newest first)
    bookings.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    console.log(`Fetched ${bookings.length} forwarding bookings${assigned_to_user_id ? ` for user ${assigned_to_user_id}` : ''}`);
    
    return c.json({ success: true, data: bookings });
  } catch (error) {
    console.error("Error fetching forwarding bookings:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get single forwarding booking [RELATIONAL]
app.get("/make-server-c142e950/forwarding-bookings/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const booking = await getBookingMerged(id);
    if (!booking) return c.json({ success: false, error: "Booking not found" }, 404);
    return c.json({ success: true, data: booking });
  } catch (error) {
    console.error("Error fetching forwarding booking:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Create forwarding booking
app.post("/make-server-c142e950/forwarding-bookings", async (c) => {
  try {
    const bookingData = await c.req.json();
    
    // Generate booking ID if not provided
    const bookingId = bookingData.bookingId || generateBookingId("FWD");
    
    const timestamp = new Date().toISOString();
    
    const newBooking = {
      ...bookingData,
      bookingId,
      serviceType: "Forwarding",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    
    newBooking.service_type = "Forwarding";
    await saveBooking(newBooking);
    
    if (bookingData.projectNumber) {
      await claimBillingsForBooking(bookingId, bookingData.projectNumber, "Forwarding", ["forwarding", "freight", "sea", "air"]);
    }

    console.log(`Created forwarding booking ${bookingId}`);
    
    return c.json({ success: true, data: newBooking });
  } catch (error) {
    console.error("Error creating forwarding booking:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update forwarding booking [RELATIONAL]
app.put("/make-server-c142e950/forwarding-bookings/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    const existing = await getBookingMerged(id);
    if (!existing) return c.json({ success: false, error: "Booking not found" }, 404);
    const updated = { ...existing, ...updates, bookingId: id, id: existing.id || id, createdAt: existing.createdAt, updatedAt: new Date().toISOString() };
    await saveBooking(updated);
    console.log(`Updated forwarding booking ${id}`);
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating forwarding booking:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete forwarding booking [RELATIONAL]
app.delete("/make-server-c142e950/forwarding-bookings/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const existing = await getBookingMerged(id);
    if (!existing) return c.json({ success: false, error: "Booking not found" }, 404);
    await unlinkBookingFromProject(existing, id);
    await deleteBookingCascade(id);
    await db.from("bookings").delete().eq("id", id);
    console.log(`Deleted forwarding booking ${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting forwarding booking:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== TRUCKING BOOKINGS [RELATIONAL] ====================

app.get("/make-server-c142e950/trucking-bookings", async (c) => {
  try {
    const bookings = await getServiceBookings("Trucking", c.req.query("assigned_to_user_id"));
    return c.json({ success: true, data: bookings });
  } catch (error) { return c.json({ success: false, error: String(error) }, 500); }
});

app.get("/make-server-c142e950/trucking-bookings/:id", async (c) => {
  try {
    const booking = await getBookingMerged(c.req.param("id"));
    if (!booking) return c.json({ success: false, error: "Booking not found" }, 404);
    return c.json({ success: true, data: booking });
  } catch (error) { return c.json({ success: false, error: String(error) }, 500); }
});

app.post("/make-server-c142e950/trucking-bookings", async (c) => {
  try {
    const bookingData = await c.req.json();
    const { data: ctrRow } = await db.from("counters").select("*").eq("key", "trucking_booking_counter").maybeSingle();
    const newCounter = (ctrRow?.value || 0) + 1;
    await db.from("counters").upsert({ key: "trucking_booking_counter", value: newCounter }, { onConflict: "key" });
    const year = new Date().getFullYear();
    const bookingId = `TRK-${year}-${String(newCounter).padStart(3, '0')}`;
    const timestamp = new Date().toISOString();
    const newBooking = { ...bookingData, bookingId, id: bookingId, serviceType: "Trucking", service_type: "Trucking", createdAt: timestamp, updatedAt: timestamp };
    await saveBooking(newBooking);
    if (bookingData.projectNumber) await claimBillingsForBooking(bookingId, bookingData.projectNumber, "Trucking", ["trucking", "transport", "delivery", "pickup", "inland"]);
    console.log(`Created trucking booking ${bookingId}`);
    return c.json({ success: true, data: newBooking });
  } catch (error) { return c.json({ success: false, error: String(error) }, 500); }
});

app.put("/make-server-c142e950/trucking-bookings/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    const existing = await getBookingMerged(id);
    if (!existing) return c.json({ success: false, error: "Booking not found" }, 404);
    const updated = { ...existing, ...updates, bookingId: id, id: existing.id || id, createdAt: existing.createdAt, updatedAt: new Date().toISOString() };
    await saveBooking(updated);
    return c.json({ success: true, data: updated });
  } catch (error) { return c.json({ success: false, error: String(error) }, 500); }
});

app.delete("/make-server-c142e950/trucking-bookings/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const existing = await getBookingMerged(id);
    if (!existing) return c.json({ success: false, error: "Booking not found" }, 404);
    await unlinkBookingFromProject(existing, id);
    await deleteBookingCascade(id);
    await db.from("bookings").delete().eq("id", id);
    return c.json({ success: true });
  } catch (error) { return c.json({ success: false, error: String(error) }, 500); }
});

// ==================== MARINE INSURANCE BOOKINGS [RELATIONAL] ====================

app.get("/make-server-c142e950/marine-insurance-bookings", async (c) => {
  try {
    const bookings = await getServiceBookings("Marine Insurance", c.req.query("assigned_to_user_id"));
    return c.json({ success: true, data: bookings });
  } catch (error) { return c.json({ success: false, error: String(error) }, 500); }
});

app.get("/make-server-c142e950/marine-insurance-bookings/:id", async (c) => {
  try {
    const booking = await getBookingMerged(c.req.param("id"));
    if (!booking) return c.json({ success: false, error: "Booking not found" }, 404);
    return c.json({ success: true, data: booking });
  } catch (error) { return c.json({ success: false, error: String(error) }, 500); }
});

app.post("/make-server-c142e950/marine-insurance-bookings", async (c) => {
  try {
    const bookingData = await c.req.json();
    const { data: ctrRow } = await db.from("counters").select("*").eq("key", "marine_insurance_booking_counter").maybeSingle();
    const newCounter = (ctrRow?.value || 0) + 1;
    await db.from("counters").upsert({ key: "marine_insurance_booking_counter", value: newCounter }, { onConflict: "key" });
    const bookingId = `INS-${new Date().getFullYear()}-${String(newCounter).padStart(3, '0')}`;
    const timestamp = new Date().toISOString();
    const newBooking = { ...bookingData, bookingId, id: bookingId, serviceType: "Marine Insurance", service_type: "Marine Insurance", createdAt: timestamp, updatedAt: timestamp };
    await saveBooking(newBooking);
    if (bookingData.projectNumber) await claimBillingsForBooking(bookingId, bookingData.projectNumber, "Marine Insurance", ["marine", "insurance", "premium", "policy"]);
    return c.json({ success: true, data: newBooking });
  } catch (error) { return c.json({ success: false, error: String(error) }, 500); }
});

app.put("/make-server-c142e950/marine-insurance-bookings/:id", async (c) => {
  try {
    const id = c.req.param("id"); const updates = await c.req.json();
    const existing = await getBookingMerged(id);
    if (!existing) return c.json({ success: false, error: "Booking not found" }, 404);
    const updated = { ...existing, ...updates, bookingId: id, id: existing.id || id, createdAt: existing.createdAt, updatedAt: new Date().toISOString() };
    await saveBooking(updated);
    return c.json({ success: true, data: updated });
  } catch (error) { return c.json({ success: false, error: String(error) }, 500); }
});

app.delete("/make-server-c142e950/marine-insurance-bookings/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const existing = await getBookingMerged(id);
    if (!existing) return c.json({ success: false, error: "Booking not found" }, 404);
    await unlinkBookingFromProject(existing, id);
    await deleteBookingCascade(id);
    await db.from("bookings").delete().eq("id", id);
    return c.json({ success: true });
  } catch (error) { return c.json({ success: false, error: String(error) }, 500); }
});

// ==================== BROKERAGE BOOKINGS [RELATIONAL] ====================

app.get("/make-server-c142e950/brokerage-bookings", async (c) => {
  try {
    const bookings = await getServiceBookings("Brokerage", c.req.query("assigned_to_user_id"));
    return c.json({ success: true, data: bookings });
  } catch (error) { return c.json({ success: false, error: String(error) }, 500); }
});

app.get("/make-server-c142e950/brokerage-bookings/:id", async (c) => {
  try {
    const booking = await getBookingMerged(c.req.param("id"));
    if (!booking) return c.json({ success: false, error: "Booking not found" }, 404);
    return c.json({ success: true, data: booking });
  } catch (error) { return c.json({ success: false, error: String(error) }, 500); }
});

app.post("/make-server-c142e950/brokerage-bookings", async (c) => {
  try {
    const bookingData = await c.req.json();
    const { data: ctrRow } = await db.from("counters").select("*").eq("key", "brokerage_booking_counter").maybeSingle();
    const newCounter = (ctrRow?.value || 0) + 1;
    await db.from("counters").upsert({ key: "brokerage_booking_counter", value: newCounter }, { onConflict: "key" });
    const bookingId = `BRK-${new Date().getFullYear()}-${String(newCounter).padStart(3, '0')}`;
    const timestamp = new Date().toISOString();
    const newBooking = { ...bookingData, bookingId, id: bookingId, serviceType: "Brokerage", service_type: "Brokerage", createdAt: timestamp, updatedAt: timestamp };
    await saveBooking(newBooking);
    if (bookingData.projectNumber) await claimBillingsForBooking(bookingId, bookingData.projectNumber, "Brokerage", ["brokerage", "customs", "duties", "tax", "processing"]);
    return c.json({ success: true, data: newBooking });
  } catch (error) { return c.json({ success: false, error: String(error) }, 500); }
});

app.put("/make-server-c142e950/brokerage-bookings/:id", async (c) => {
  try {
    const id = c.req.param("id"); const updates = await c.req.json();
    const existing = await getBookingMerged(id);
    if (!existing) return c.json({ success: false, error: "Booking not found" }, 404);
    const updated = { ...existing, ...updates, bookingId: id, id: existing.id || id, createdAt: existing.createdAt, updatedAt: new Date().toISOString() };
    await saveBooking(updated);
    return c.json({ success: true, data: updated });
  } catch (error) { return c.json({ success: false, error: String(error) }, 500); }
});

app.delete("/make-server-c142e950/brokerage-bookings/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const existing = await getBookingMerged(id);
    if (!existing) return c.json({ success: false, error: "Booking not found" }, 404);
    await unlinkBookingFromProject(existing, id);
    await deleteBookingCascade(id);
    await db.from("bookings").delete().eq("id", id);
    return c.json({ success: true });
  } catch (error) { return c.json({ success: false, error: String(error) }, 500); }
});

// ==================== OTHERS BOOKINGS [RELATIONAL] ====================

app.get("/make-server-c142e950/others-bookings", async (c) => {
  try {
    const bookings = await getServiceBookings("Others", c.req.query("assigned_to_user_id"));
    return c.json({ success: true, data: bookings });
  } catch (error) { return c.json({ success: false, error: String(error) }, 500); }
});

app.get("/make-server-c142e950/others-bookings/:id", async (c) => {
  try {
    const booking = await getBookingMerged(c.req.param("id"));
    if (!booking) return c.json({ success: false, error: "Booking not found" }, 404);
    return c.json({ success: true, data: booking });
  } catch (error) { return c.json({ success: false, error: String(error) }, 500); }
});

app.post("/make-server-c142e950/others-bookings", async (c) => {
  try {
    const bookingData = await c.req.json();
    const { data: ctrRow } = await db.from("counters").select("*").eq("key", "others_booking_counter").maybeSingle();
    const newCounter = (ctrRow?.value || 0) + 1;
    await db.from("counters").upsert({ key: "others_booking_counter", value: newCounter }, { onConflict: "key" });
    const bookingId = `OTH-${new Date().getFullYear()}-${String(newCounter).padStart(3, '0')}`;
    const timestamp = new Date().toISOString();
    const newBooking = { ...bookingData, bookingId, id: bookingId, serviceType: "Others", service_type: "Others", createdAt: timestamp, updatedAt: timestamp };
    await saveBooking(newBooking);
    return c.json({ success: true, data: newBooking });
  } catch (error) { return c.json({ success: false, error: String(error) }, 500); }
});

app.put("/make-server-c142e950/others-bookings/:id", async (c) => {
  try {
    const id = c.req.param("id"); const updates = await c.req.json();
    const existing = await getBookingMerged(id);
    if (!existing) return c.json({ success: false, error: "Booking not found" }, 404);
    const updated = { ...existing, ...updates, bookingId: id, id: existing.id || id, createdAt: existing.createdAt, updatedAt: new Date().toISOString() };
    await saveBooking(updated);
    return c.json({ success: true, data: updated });
  } catch (error) { return c.json({ success: false, error: String(error) }, 500); }
});

app.delete("/make-server-c142e950/others-bookings/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const existing = await getBookingMerged(id);
    if (!existing) return c.json({ success: false, error: "Booking not found" }, 404);
    await unlinkBookingFromProject(existing, id);
    await deleteBookingCascade(id);
    await db.from("bookings").delete().eq("id", id);
    return c.json({ success: true });
  } catch (error) { return c.json({ success: false, error: String(error) }, 500); }
});

// ==================== REPAIR TOOLS ====================

// Rescan and claim billings for a booking (Fix for missing billings)
app.post("/make-server-c142e950/bookings/:id/rescan-billings", async (c) => {
  try {
    const bookingId = c.req.param("id");
    const { projectNumber, bookingType } = await c.req.json();
    
    if (!projectNumber) {
      return c.json({ success: false, error: "projectNumber is required" }, 400);
    }
    
    const type = (bookingType || "").toLowerCase();
    
    // [RELATIONAL] Get evouchers for this project
    const { data: evRows } = await db.from("evouchers").select("*").eq("project_number", projectNumber).eq("transaction_type", "billing");
    const candidates = (evRows || []).map((r: any) => mergeFromRow(r)).filter((v: any) => 
      v.bookingId === `PROJECT-${projectNumber}` || !v.bookingId || v.bookingId === bookingId
    );
    
    let claimedCount = 0;
    for (const billing of candidates) {
      const tag = (billing.bookingType || "").toLowerCase();
      let match = false;
      if (type.includes("forwarding") && (tag.includes("forwarding") || tag.includes("freight") || tag.includes("sea") || tag.includes("air"))) match = true;
      else if (type.includes("brokerage") && (tag.includes("brokerage") || tag.includes("customs") || tag.includes("duties") || tag.includes("tax"))) match = true;
      else if (type.includes("trucking") && (tag.includes("trucking") || tag.includes("transport") || tag.includes("delivery") || tag.includes("pickup"))) match = true;
      else if (type.includes("marine") && (tag.includes("marine") || tag.includes("insurance") || tag.includes("premium") || tag.includes("policy"))) match = true;
      else if (type.includes("others") && tag.includes("others")) match = true;
      
      if (match && billing.bookingId !== bookingId) {
        billing.bookingId = bookingId;
        billing.updatedAt = new Date().toISOString();
        await saveEvoucher(billing);
        claimedCount++;
      }
    }
    
    console.log(`✓ Manual Rescan: Booking ${bookingId} claimed ${claimedCount} billings from Project ${projectNumber}`);
    
    return c.json({ success: true, claimedCount });
  } catch (error) {
    console.error("Error rescanning billings:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== BILLINGS [RELATIONAL] (stored in evouchers table) ====================

app.get("/make-server-c142e950/billings", async (c) => {
  try {
    const bookingId = c.req.query("bookingId");
    if (!bookingId) return c.json({ success: false, error: "bookingId parameter required" }, 400);
    const { data: rows } = await db.from("evouchers").select("*").order("created_at", { ascending: false });
    const billings = (rows || []).map((r: any) => mergeFromRow(r)).filter((b: any) => b.bookingId === bookingId || b.booking_id === bookingId);
    return c.json({ success: true, data: billings });
  } catch (error) { return c.json({ success: false, error: String(error) }, 500); }
});

app.post("/make-server-c142e950/billings", async (c) => {
  try {
    const billingData = await c.req.json();
    const billingId = `BILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = new Date().toISOString();
    const newBilling = { ...billingData, id: billingId, billingId, transaction_type: "billing", createdAt: timestamp, updatedAt: timestamp, created_at: timestamp };
    await saveEvoucher(newBilling);
    return c.json({ success: true, data: newBilling });
  } catch (error) { return c.json({ success: false, error: String(error) }, 500); }
});

app.put("/make-server-c142e950/billings/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    const existing = await getEvoucherMerged(id);
    if (!existing) return c.json({ success: false, error: "Billing not found" }, 404);
    const updated = { ...existing, ...updates, billingId: id, createdAt: existing.createdAt, updatedAt: new Date().toISOString() };
    await saveEvoucher(updated);
    return c.json({ success: true, data: updated });
  } catch (error) { return c.json({ success: false, error: String(error) }, 500); }
});

app.delete("/make-server-c142e950/billings/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { error } = await db.from("evouchers").delete().eq("id", id);
    if (error) throw error;
    return c.json({ success: true });
  } catch (error) { return c.json({ success: false, error: String(error) }, 500); }
});

// ==================== EXPENSES (Operations module duplicate - already handled above) ====================
// NOTE: Duplicate route definitions removed — the primary /expenses endpoints above handle both
// Accounting and Operations module requests. These would never be reached anyway due to Hono's
// first-match routing.

// ==================== E-VOUCHERS API ====================

// Helper function to generate E-Voucher number (EVRN-YEAR-XXX) [RELATIONAL]
async function generateEVoucherNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `EVRN-${year}-`;
  
  // Get all evouchers for current year
  const { data: allRows } = await db.from("evouchers").select("*");
  const allEVouchers = (allRows || []).map((r: any) => mergeFromRow(r));
  const currentYearEVouchers = allEVouchers.filter((ev: any) => 
    ev.voucher_number && ev.voucher_number.startsWith(prefix)
  );
  
  // Find highest number
  let maxNumber = 0;
  currentYearEVouchers.forEach((ev: any) => {
    const match = ev.voucher_number.match(/EVRN-\d{4}-(\d{3})/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNumber) maxNumber = num;
    }
  });
  
  // Increment and format
  const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
  return `${prefix}${nextNumber}`;
}

// Helper function to generate type-specific E-Voucher number (EVRN-XX-YEAR-XXX)
async function generateTypedEVoucherNumber(voucherType: string): Promise<string> {
  const year = new Date().getFullYear();
  
  // Map voucher types to prefixes
  const typePrefixes: Record<string, string> = {
    'budget_request': 'BR',
    'expense': 'EX',
    'collection': 'CO',
    'billing': 'BI'
  };
  
  const typeCode = typePrefixes[voucherType] || 'GN'; // GN = General
  const prefix = `EVRN-${typeCode}-${year}-`;
  
  // [RELATIONAL] Get all existing E-Vouchers of this type to find the max number
  const { data: allRows2 } = await db.from("evouchers").select("*");
  const allEVouchers2 = (allRows2 || []).map((r: any) => mergeFromRow(r));
  let maxNumber = 0;
  
  allEVouchers2.forEach((voucher: any) => {
    if (voucher.voucher_number && voucher.voucher_number.startsWith(prefix)) {
      const numPart = voucher.voucher_number.split('-').pop();
      const num = parseInt(numPart || '0', 10);
      if (num > maxNumber) maxNumber = num;
    }
  });
  
  // Increment and format
  const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
  return `${prefix}${nextNumber}`;
}

// Helper function to add history entry
async function addEVoucherHistory(evoucherId: string, action: string, userId: string, userName: string, userRole: string, previousStatus?: string, newStatus?: string, notes?: string) {
  const historyId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const historyEntry = {
    id: historyId,
    evoucher_id: evoucherId,
    action,
    previous_status: previousStatus,
    new_status: newStatus,
    performed_by: userId,
    performed_by_name: userName,
    performed_by_role: userRole,
    notes,
    created_at: new Date().toISOString()
  };
  
  // [RELATIONAL] Store in activity_log table instead of KV evoucher_history prefix
  await db.from("activity_log").insert({
    id: historyId,
    entity_type: "evoucher",
    entity_id: evoucherId,
    action_type: action,
    old_value: previousStatus || null,
    new_value: newStatus || null,
    user_id: userId,
    user_name: userName,
    user_department: userRole,
    metadata: notes ? { notes } : {},
    created_at: new Date().toISOString()
  });
  return historyEntry;
}

// Cleanup Billing E-Vouchers [RELATIONAL]
app.post("/make-server-c142e950/evouchers/cleanup-billings", async (c) => {
  try {
    const { data: billings } = await db.from("evouchers").select("id").eq("transaction_type", "billing");
    if (!billings?.length) return c.json({ success: true, message: "No billing e-vouchers found to delete", count: 0 });
    const { error } = await db.from("evouchers").delete().eq("transaction_type", "billing");
    if (error) throw error;
    return c.json({ success: true, message: `Successfully deleted ${billings.length} billing e-vouchers`, count: billings.length });
  } catch (error) { return c.json({ success: false, error: String(error) }, 500); }
});

// Create new E-Voucher (draft)
app.post("/make-server-c142e950/evouchers", async (c) => {
  try {
    let evoucherData;
    
    // Safely parse JSON with better error handling
    try {
      const text = await c.req.text();
      console.log('Received E-Voucher request body length:', text.length);
      
      if (!text || text.trim() === '') {
        return c.json({ success: false, error: "Request body is empty" }, 400);
      }
      
      evoucherData = JSON.parse(text);
    } catch (parseError) {
      console.error("Error parsing E-Voucher request JSON:", parseError);
      return c.json({ 
        success: false, 
        error: `Invalid JSON in request body: ${parseError instanceof Error ? parseError.message : String(parseError)}` 
      }, 400);
    }
    
    // Generate type-specific E-Voucher number
    const voucherType = evoucherData.voucher_type || evoucherData.transaction_type || "expense";
    const voucherNumber = await generateTypedEVoucherNumber(voucherType);
    const id = `EV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const now = new Date().toISOString();
    
    // Ensure amount field exists (handle both 'amount' and 'total_amount')
    const amount = evoucherData.amount ?? evoucherData.total_amount ?? 0;
    
    const evoucher = {
      id,
      voucher_number: voucherNumber,
      status: evoucherData.status || "draft", // Allow setting status on creation
      posted_to_ledger: false,
      // Voucher type (new field)
      voucher_type: voucherType,
      // Universal transaction fields (with defaults for backward compatibility)
      transaction_type: voucherType, // Keep for backward compatibility
      source_module: evoucherData.source_module || "accounting",
      // Ensure required fields have defaults
      request_date: evoucherData.request_date || now,
      currency: evoucherData.currency || "PHP",
      amount: amount, // Standardize on 'amount' field
      approvers: evoucherData.approvers || [],
      workflow_history: evoucherData.workflow_history || [],
      ...evoucherData,
      amount: amount, // Set again after spread to ensure it's not overwritten
      created_at: now,
      updated_at: now
    };
    
    await saveEvoucher(evoucher);
    
    // Add history entry
    await addEVoucherHistory(
      id,
      "Created E-Voucher",
      evoucherData.requestor_id || "system",
      evoucherData.requestor_name || "System",
      evoucherData.requestor_department || "User",
      undefined,
      "draft"
    );
    
    console.log(`✅ Created E-Voucher ${voucherNumber} (${id}) [Type: ${evoucher.transaction_type}, Module: ${evoucher.source_module}]`);
    
    return c.json({ success: true, data: evoucher });
  } catch (error) {
    console.error("Error creating E-Voucher:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get all E-Vouchers (with filters)
app.get("/make-server-c142e950/evouchers", async (c) => {
  try {
    const status = c.req.query("status");
    const transactionType = c.req.query("transaction_type");
    const sourceModule = c.req.query("source_module");
    const requestorId = c.req.query("requestor_id");
    const dateFrom = c.req.query("date_from");
    const dateTo = c.req.query("date_to");
    const search = c.req.query("search");
    
    console.log(`🔍 [GET /evouchers] Fetching with filters:`, {
      status: status || 'all',
      transactionType: transactionType || 'all',
      sourceModule: sourceModule || 'all',
      requestorId,
      dateFrom,
      dateTo,
      search
    });
    
    const { data: evRows } = await db.from("evouchers").select("*").order("created_at", { ascending: false });
    let evouchers = (evRows || []).map((r: any) => mergeFromRow(r));
    
    console.log(`📦 [GET /evouchers] Found ${evouchers.length} total E-Vouchers before filtering`);
    
    // Apply filters
    if (status && status !== "all") {
      evouchers = evouchers.filter((ev: any) => ev.status === status);
      console.log(`📦 [GET /evouchers] After status filter: ${evouchers.length} E-Vouchers`);
    }
    
    if (transactionType && transactionType !== "all") {
      const beforeCount = evouchers.length;
      evouchers = evouchers.filter((ev: any) => ev.transaction_type === transactionType);
      console.log(`📦 [GET /evouchers] After transaction_type filter (${transactionType}): ${evouchers.length} E-Vouchers (was ${beforeCount})`);
    }
    
    if (sourceModule && sourceModule !== "all") {
      const beforeCount = evouchers.length;
      evouchers = evouchers.filter((ev: any) => ev.source_module === sourceModule);
      console.log(`📦 [GET /evouchers] After source_module filter (${sourceModule}): ${evouchers.length} E-Vouchers (was ${beforeCount})`);
    }
    
    if (requestorId) {
      evouchers = evouchers.filter((ev: any) => ev.requestor_id === requestorId);
    }
    
    if (dateFrom) {
      evouchers = evouchers.filter((ev: any) => 
        new Date(ev.request_date || ev.created_at) >= new Date(dateFrom)
      );
    }
    
    if (dateTo) {
      evouchers = evouchers.filter((ev: any) => 
        new Date(ev.request_date || ev.created_at) <= new Date(dateTo)
      );
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      evouchers = evouchers.filter((ev: any) =>
        ev.voucher_number?.toLowerCase().includes(searchLower) ||
        ev.purpose?.toLowerCase().includes(searchLower) ||
        ev.vendor_name?.toLowerCase().includes(searchLower) ||
        ev.requestor_name?.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by created_at descending
    evouchers.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    console.log(`✅ [GET /evouchers] Returning ${evouchers.length} E-Vouchers`);
    if (evouchers.length > 0) {
      console.log(`📋 [GET /evouchers] First E-Voucher sample:`, {
        id: evouchers[0].id,
        voucher_number: evouchers[0].voucher_number,
        transaction_type: evouchers[0].transaction_type,
        source_module: evouchers[0].source_module,
        status: evouchers[0].status
      });
    }
    
    return c.json({ success: true, data: evouchers });
  } catch (error) {
    console.error("Error fetching E-Vouchers:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get pending approvals (Accounting Staff only)
app.get("/make-server-c142e950/evouchers/pending", async (c) => {
  try {
    const { data: pendRows } = await db.from("evouchers").select("*").eq("status", "pending");
    const pending = (pendRows || []).map((r: any) => mergeFromRow(r));
    
    // Sort by submitted_at ascending (oldest first)
    pending.sort((a: any, b: any) => 
      new Date(a.submitted_at || a.created_at).getTime() - 
      new Date(b.submitted_at || b.created_at).getTime()
    );
    
    console.log(`Fetched ${pending.length} pending E-Vouchers for approval`);
    
    return c.json({ success: true, data: pending });
  } catch (error) {
    console.error("Error fetching pending E-Vouchers:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get user's own E-Vouchers
app.get("/make-server-c142e950/evouchers/my-evouchers", async (c) => {
  try {
    const requestorId = c.req.query("requestor_id");
    
    if (!requestorId) {
      return c.json({ success: false, error: "requestor_id required" }, 400);
    }
    
    const { data: reqRows } = await db.from("evouchers").select("*");
    const myEVouchers = (reqRows || []).map((r: any) => mergeFromRow(r)).filter((ev: any) => ev.requestor_id === requestorId);
    
    // Sort by created_at descending
    myEVouchers.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    console.log(`Fetched ${myEVouchers.length} E-Vouchers for user ${requestorId}`);
    
    return c.json({ success: true, data: myEVouchers });
  } catch (error) {
    console.error("Error fetching user E-Vouchers:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get single E-Voucher by ID
app.get("/make-server-c142e950/evouchers/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const evoucher = await getEvoucherMerged(id);
    if (!evoucher) return c.json({ success: false, error: "E-Voucher not found" }, 404);
    return c.json({ success: true, data: evoucher });
  } catch (error) {
    console.error("Error fetching E-Voucher:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get E-Voucher history
app.get("/make-server-c142e950/evouchers/:id/history", async (c) => {
  try {
    const id = c.req.param("id");
    const { data: histRows } = await db.from("activity_log").select("*").eq("entity_type", "evoucher").eq("entity_id", id).order("created_at", { ascending: true });
    const history = histRows || [];
    
    // Sort by created_at ascending (oldest first)
    history.sort((a: any, b: any) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    return c.json({ success: true, data: history });
  } catch (error) {
    console.error("Error fetching E-Voucher history:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update E-Voucher (draft only)
app.put("/make-server-c142e950/evouchers/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    
    const existing = await getEvoucherMerged(id);
    if (!existing) return c.json({ success: false, error: "E-Voucher not found" }, 404);
    if (existing.status !== "draft") return c.json({ success: false, error: "Only draft E-Vouchers can be edited" }, 400);
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
    await saveEvoucher(updated);
    
    console.log(`Updated E-Voucher ${existing.voucher_number} (${id})`);
    
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating E-Voucher:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Submit E-Voucher for approval
app.post("/make-server-c142e950/evouchers/:id/submit", async (c) => {
  try {
    const id = c.req.param("id");
    
    let requestBody;
    try {
      const text = await c.req.text();
      console.log('Received submit request body length:', text.length);
      
      if (!text || text.trim() === '') {
        return c.json({ success: false, error: "Request body is empty" }, 400);
      }
      
      requestBody = JSON.parse(text);
    } catch (parseError) {
      console.error("Error parsing submit request JSON:", parseError);
      return c.json({ 
        success: false, 
        error: `Invalid JSON in request body: ${parseError instanceof Error ? parseError.message : String(parseError)}` 
      }, 400);
    }
    
    const { user_id, user_name, user_role } = requestBody;
    const existing = await getEvoucherMerged(id);
    if (!existing) return c.json({ success: false, error: "E-Voucher not found" }, 404);
    if (existing.status !== "draft") return c.json({ success: false, error: "Only draft E-Vouchers can be submitted" }, 400);
    if (existing.transaction_type === "collection") {
      try {
        const result = await accountingHandlers.processCollectionPosting(id, user_id, user_name);
        return c.json({ success: true, data: result.evoucher });
      } catch (postError) { return c.json({ success: false, error: `Failed to post collection: ${postError}` }, 500); }
    }
    const updated = { ...existing, status: "pending", submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    await saveEvoucher(updated);
    
    // Add history entry
    await addEVoucherHistory(
      id,
      "Submitted for Approval",
      user_id,
      user_name,
      user_role,
      "draft",
      "pending"
    );
    
    console.log(`E-Voucher ${existing.voucher_number} submitted for approval`);
    
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error submitting E-Voucher:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Approve E-Voucher (does NOT post to ledger - separate step)
app.post("/make-server-c142e950/evouchers/:id/approve", async (c) => {
  try {
    const id = c.req.param("id");
    const { user_id, user_name, user_role, notes } = await c.req.json();
    const existing = await getEvoucherMerged(id);
    if (!existing) return c.json({ success: false, error: "E-Voucher not found" }, 404);
    // Accept multiple statuses for approval
    if (existing.status !== "pending" && existing.status !== "Submitted" && existing.status !== "Draft") {
      return c.json({ 
        success: false, 
        error: "Only pending/submitted/draft E-Vouchers can be approved" 
      }, 400);
    }
    
    // Update E-Voucher to approved status (but NOT posted to ledger yet)
    const updated = {
      ...existing,
      status: "Approved",
      approved_at: new Date().toISOString(),
      approved_by: user_id,
      approved_by_name: user_name,
      updated_at: new Date().toISOString()
    };
    
    await saveEvoucher(updated);
    
    await addEVoucherHistory(id, "Approved by Accounting", user_id, user_name, user_role, existing.status, "Approved", notes);

    const draftTxn = await accountingHandlers.createDraftTransaction(updated);
    if (draftTxn) {
      updated.draft_transaction_id = draftTxn.id;
      await saveEvoucher(updated);
    }
    
    console.log(`E-Voucher ${existing.voucher_number} approved by ${user_name}`);
    
    return c.json({ 
      success: true, 
      data: updated
    });
  } catch (error) {
    console.error("Error approving E-Voucher:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Post E-Voucher to Ledger (separate step after approval)
// Routes to correct module based on transaction_type
app.post("/make-server-c142e950/evouchers/:id/post-to-ledger", async (c) => {
  try {
    const id = c.req.param("id");
    
    const existing = await getEvoucherMerged(id);
    if (!existing) return c.json({ success: false, error: "E-Voucher not found" }, 404);
    const transactionType = existing.transaction_type || "expense";
    
    // Dispatch to appropriate handler
    // NOTE: We must NOT consume the body here, as the handlers will consume it.
    
    if (transactionType === "collection") {
      return accountingHandlers.postEVoucherToCollections(c);
    } else if (transactionType === "billing") {
      // Dead route cleanup (Phase 3 — Invoice Ledger Integration Blueprint):
      // postEVoucherToBillings handler never existed. Invoices now create JE directly via createInvoice.
      return c.json({ success: false, error: "Billing E-Voucher posting is not supported. Use the Invoice Builder instead." }, 400);
    } else {
      // Default to Ledger (Expenses/Journal Entries)
      // This handler supports the "Strict Gatekeeper" workflow with Debit/Credit account selection
      return accountingHandlers.postEVoucherToLedger(c);
    }
  } catch (error) {
    console.error("Error dispatching E-Voucher post:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Reject E-Voucher
app.post("/make-server-c142e950/evouchers/:id/reject", async (c) => {
  try {
    const id = c.req.param("id");
    const { user_id, user_name, user_role, rejection_reason } = await c.req.json();
    
    const existing = await getEvoucherMerged(id);
    if (!existing) return c.json({ success: false, error: "E-Voucher not found" }, 404);
    if (existing.status !== "pending") return c.json({ success: false, error: "Only pending E-Vouchers can be rejected" }, 400);
    const updated = { ...existing, status: "rejected", rejected_at: new Date().toISOString(), rejected_by: user_id, rejected_by_name: user_name, rejection_reason, updated_at: new Date().toISOString() };
    await saveEvoucher(updated);
    
    // Add history entry
    await addEVoucherHistory(
      id,
      "Rejected",
      user_id,
      user_name,
      user_role,
      "pending",
      "rejected",
      rejection_reason
    );
    
    console.log(`E-Voucher ${existing.voucher_number} rejected by ${user_name}`);
    
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error rejecting E-Voucher:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Cancel E-Voucher
app.post("/make-server-c142e950/evouchers/:id/cancel", async (c) => {
  try {
    const id = c.req.param("id");
    const { user_id, user_name, user_role } = await c.req.json();
    
    const existing = await getEvoucherMerged(id);
    if (!existing) return c.json({ success: false, error: "E-Voucher not found" }, 404);
    if (existing.status !== "draft" && existing.status !== "rejected") return c.json({ success: false, error: "Only draft or rejected E-Vouchers can be cancelled" }, 400);
    const previousStatus = existing.status;
    const updated = { ...existing, status: "cancelled", cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    await saveEvoucher(updated);
    
    // Add history entry
    await addEVoucherHistory(
      id,
      "Cancelled",
      user_id,
      user_name,
      user_role,
      previousStatus,
      "cancelled"
    );
    
    console.log(`E-Voucher ${existing.voucher_number} cancelled by ${user_name}`);
    
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error cancelling E-Voucher:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete E-Voucher
app.delete("/make-server-c142e950/evouchers/:id", accountingHandlers.deleteExpense);

// Auto-Approve (Create & Approve in one step - Accounting Staff only)
app.post("/make-server-c142e950/evouchers/auto-approve", async (c) => {
  try {
    const evoucherData = await c.req.json();
    const { user_id, user_name, user_role } = evoucherData;
    
    // Generate E-Voucher number
    const voucherNumber = await generateEVoucherNumber();
    const id = `EV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create expense entry immediately
    const expenseId = `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const expense = {
      id: expenseId,
      expense_name: evoucherData.purpose,
      booking_id: evoucherData.project_number,
      category: evoucherData.expense_category || evoucherData.gl_sub_category,
      amount: evoucherData.amount,
      currency: evoucherData.currency,
      status: "Approved",
      vendor: evoucherData.vendor_name,
      description: evoucherData.description || evoucherData.purpose,
      request_date: evoucherData.request_date || new Date().toISOString(),
      created_from_evoucher_id: id,
      created_by: user_id,
      is_adjustment: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await db.from("expenses").insert(expense);
    
    const evoucher = {
      id, voucher_number: voucherNumber, status: "posted", posted_to_ledger: true,
      ledger_expense_id: expenseId, approved_at: new Date().toISOString(),
      approved_by: user_id, approved_by_name: user_name, submitted_at: new Date().toISOString(),
      ...evoucherData, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    };
    await saveEvoucher(evoucher);
    
    // Add history entries
    await addEVoucherHistory(
      id,
      "Created with Auto-Approve",
      user_id,
      user_name,
      user_role,
      undefined,
      "posted",
      "Created and approved in one step by Accounting Staff"
    );
    
    console.log(`Auto-approved E-Voucher ${voucherNumber} (${id}) → Expense ${expenseId}`);
    
    return c.json({ 
      success: true, 
      data: evoucher,
      expense_id: expenseId
    });
  } catch (error) {
    console.error("Error auto-approving E-Voucher:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== ACCOUNTING MODULE API (CLEAN & CONSOLIDATED) ====================
// All accounting transactions MUST come from approved E-Vouchers
// Direct creation bypassing E-Vouchers is NOT allowed

// EXPENSES - Read-only, populated from posted E-Vouchers
app.get("/make-server-c142e950/accounting/expenses", accountingHandlers.getExpenses);
app.get("/make-server-c142e950/accounting/expenses/:id", accountingHandlers.getExpenseById);
app.delete("/make-server-c142e950/accounting/expenses/:id", accountingHandlers.deleteExpense);

// COLLECTIONS - Read-only, populated from posted E-Vouchers
app.get("/make-server-c142e950/accounting/collections", accountingHandlers.getCollections);
app.get("/make-server-c142e950/accounting/collections/:id", accountingHandlers.getCollectionById);
app.post("/make-server-c142e950/evouchers/:id/post-to-collections", accountingHandlers.postEVoucherToCollections);
app.delete("/make-server-c142e950/accounting/collections/:id", accountingHandlers.deleteCollection);

// INVOICES (Formerly Billings) - Read-only, populated from posted E-Vouchers
app.get("/make-server-c142e950/accounting/billings", accountingHandlers.getInvoices); // Legacy Route
app.get("/make-server-c142e950/accounting/billings/:id", accountingHandlers.getInvoiceById); // Legacy Route
app.get("/make-server-c142e950/accounting/invoices", accountingHandlers.getInvoices); // New Route
app.get("/make-server-c142e950/accounting/invoices/:id", accountingHandlers.getInvoiceById); // New Route
app.post("/make-server-c142e950/accounting/invoices", accountingHandlers.createInvoice); // New Route: Create Invoice from Items

// BILLING ITEMS (The Atoms)
app.get("/make-server-c142e950/accounting/billing-items", accountingHandlers.getBillings);
app.post("/make-server-c142e950/accounting/billing-items", accountingHandlers.createBillingItem);
app.post("/make-server-c142e950/accounting/billings/batch", accountingHandlers.batchUpsertBillings);
app.post("/make-server-c142e950/accounting/import-quotation-charges", accountingHandlers.importQuotationCharges);

// ==================== COMPREHENSIVE SEED DATA ====================
// This creates realistic data showing the BD → PD → BD → OPS relay race in action

app.post("/make-server-c142e950/seed/comprehensive", async (c) => {
  try {
    console.log("Starting comprehensive seed...");
    
    const result = await seedComprehensiveData();
    
    return c.json({ 
      success: true, 
      message: "Comprehensive seed completed successfully!",
      summary: result.summary
    });
  } catch (error) {
    console.error("Error during comprehensive seed:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Clear all seed data (for testing)
app.delete("/make-server-c142e950/seed/clear", async (c) => {
  try {
    console.log("Clearing all seed data... [RELATIONAL]");
    // Delete in correct FK order
    await db.from("evouchers").delete().neq("id", "");
    await db.from("expenses").delete().neq("id", "");
    await db.from("bookings").delete().neq("id", "");
    await db.from("projects").delete().neq("id", "");
    await db.from("quotations").delete().neq("id", "");
    // Don't clear customers — they may have FK refs elsewhere
    // await db.from("customers").delete().neq("id", "");
    console.log("Cleared all seed data from relational tables");
    return c.json({ success: true, message: "Seed data cleared successfully", summary: { cleared: "all relational tables" } });
  } catch (error) {
    console.error("Error clearing seed data:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== ORPHAN CLEANUP [RELATIONAL] ====================
// With FK constraints in place, orphan cleanup is largely unnecessary.
// This endpoint is kept for backward compatibility but does minimal work.

app.post("/make-server-c142e950/maintenance/cleanup-orphaned-billings", async (c) => {
  try {
    // [RELATIONAL] With FK constraints, orphans are handled by the DB.
    return c.json({ success: true, message: "Relational schema uses FK constraints — no orphan cleanup needed", orphanedCount: 0, remediatedCount: 0 });
    /* LEGACY KV CLEANUP CODE BELOW — disabled
    // Build a set of ALL valid entity IDs (bookings + projects)
    const BOOKING_PREFIXES = [
      "forwarding_booking:",
      "brokerage_booking:",
      "trucking_booking:",
      "marine_insurance_booking:",
      "others_booking:",
    ];
    
    const [allBookings, allProjects] = await Promise.all([
      Promise.all(BOOKING_PREFIXES.map(p => kv.getByPrefix(p).catch(() => []))).then(r => r.flat()),
      kv.getByPrefix("project:").catch(() => []),
    ]);
    
    const validIds = new Set<string>();
    // Build project KV ID → project_number translation map for remediation
    const projectIdToNumber = new Map<string, string>();
    
    // Add all booking IDs
    for (const b of allBookings) {
      if (b.bookingId) validIds.add(b.bookingId);
      if (b.id) validIds.add(b.id);
    }
    
    // Add all project IDs and project numbers
    for (const p of allProjects) {
      if (p.id) validIds.add(p.id);
      if (p.project_number) {
        validIds.add(p.project_number);
        // Map raw KV ID → human-readable project_number for remediation
        if (p.id && p.id !== p.project_number) {
          projectIdToNumber.set(p.id, p.project_number);
        }
      }
      // Also add PROJECT-{number} format used by auto-generated billings
      if (p.project_number) validIds.add(`PROJECT-${p.project_number}`);
    }
    
    console.log(`Found ${validIds.size} valid entity IDs (${allBookings.length} bookings, ${allProjects.length} projects, ${projectIdToNumber.size} KV IDs to remediate)`);
    
    // Scan all billing items
    const [billings, billingItems] = await Promise.all([
      kv.getByPrefix("billing:"),
      kv.getByPrefix("billing_item:"),
    ]);
    
    let orphanedCount = 0;
    let remediatedCount = 0;
    const orphanDetails: string[] = [];
    const remediationDetails: string[] = [];
    
    // Helper: remediate a billing item whose booking_id is a raw KV project ID
    const remediateIfNeeded = async (b: any, prefix: string): Promise<boolean> => {
      const refId = b.booking_id || b.bookingId || "";
      const translatedPN = projectIdToNumber.get(refId);
      if (translatedPN) {
        const key = b.id || b.billingId;
        const updated = { ...b, booking_id: translatedPN, project_number: translatedPN };
        await kv.set(`${prefix}${key}`, updated);
        remediationDetails.push(`${prefix}${key}: ${refId} → ${translatedPN}`);
        remediatedCount++;
        return true;
      }
      return false;
    };
    
    // Check billing: prefix (excluding invoices which have invoice_number)
    for (const b of billings) {
      if (b.invoice_number) continue; // Skip invoices
      
      const refId = b.booking_id || b.bookingId || b.project_number || b.projectNumber || "";
      if (!refId) {
        const key = b.billingId || b.id;
        await kv.del(`billing:${key}`);
        orphanDetails.push(`billing:${key} (no reference)`);
        orphanedCount++;
        continue;
      }
      
      if (!validIds.has(refId)) {
        // Try remediation first (raw KV ID → project_number)
        const wasRemediated = await remediateIfNeeded(b, "billing:");
        if (!wasRemediated) {
          const key = b.billingId || b.id;
          await kv.del(`billing:${key}`);
          orphanDetails.push(`billing:${key} → ${refId}`);
          orphanedCount++;
        }
      } else {
        // Valid ref but might be a raw KV ID — remediate to use human-readable project_number
        await remediateIfNeeded(b, "billing:");
      }
    }
    
    // Check billing_item: prefix
    for (const b of billingItems) {
      const refId = b.booking_id || b.bookingId || b.project_number || b.projectNumber || "";
      if (!refId || !validIds.has(refId)) {
        const wasRemediated = await remediateIfNeeded(b, "billing_item:");
        if (!wasRemediated) {
          const key = b.id || b.billingId;
          await kv.del(`billing_item:${key}`);
          orphanDetails.push(`billing_item:${key} → ${refId || "(none)"}`);
          orphanedCount++;
        }
      } else {
        // Valid ref but might be a raw KV ID — remediate
        await remediateIfNeeded(b, "billing_item:");
      }
    }
    
    console.log(`🧹 Cleaned up ${orphanedCount} orphaned billing items, remediated ${remediatedCount} with KV ID → project_number`);
    if (orphanDetails.length > 0) {
      console.log(`Orphan details: ${orphanDetails.join(", ")}`);
    }
    if (remediationDetails.length > 0) {
      console.log(`Remediation details: ${remediationDetails.join(", ")}`);
    }
    
    return c.json({ 
      success: true, 
      message: `Cleaned up ${orphanedCount} orphaned billing items, remediated ${remediatedCount} records`,
      orphanedCount,
      remediatedCount,
      details: orphanDetails,
      remediationDetails,
      totalScanned: billings.length + billingItems.length,
    });
    END LEGACY KV CLEANUP CODE */
  } catch (error) {
    console.error("Error during orphan cleanup:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== CUSTOMERS API ====================

// Get all customers [RELATIONAL]
app.get("/make-server-c142e950/customers", async (c) => {
  try {
    const { data: customers, error } = await db.from("customers").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    
    console.log(`Fetched ${customers?.length || 0} customers`);
    return c.json({ success: true, data: customers || [] });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get single customer by ID [RELATIONAL]
app.get("/make-server-c142e950/customers/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { data: customer, error } = await db.from("customers").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    
    if (!customer) {
      return c.json({ success: false, error: "Customer not found" }, 404);
    }
    
    // Fetch contacts and quotations via indexed FK lookups (parallel)
    const [contactsRes, quotationsRes] = await Promise.all([
      db.from("contacts").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
      db.from("quotations").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
    ]);
    
    console.log(`Fetched customer ${id} with ${contactsRes.data?.length || 0} contacts and ${quotationsRes.data?.length || 0} quotations`);
    
    return c.json({ 
      success: true, 
      data: {
        ...customer,
        contacts: contactsRes.data || [],
        quotations: quotationsRes.data || []
      }
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Create customer [RELATIONAL]
app.post("/make-server-c142e950/customers", async (c) => {
  try {
    const data = await c.req.json();
    
    const timestamp = Date.now();
    const id = `CUST-${timestamp}`;
    
    const customer = {
      id,
      name: data.name,
      industry: data.industry || null,
      registered_address: data.registered_address || null,
      status: data.status || "Prospect",
      lead_source: data.lead_source || null,
      owner_id: data.owner_id || null,
      credit_terms: data.credit_terms || "Net 30",
      phone: data.phone || null,
      email: data.email || null,
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      created_by: data.created_by || null,
      updated_at: new Date().toISOString(),
    };
    
    const { error } = await db.from("customers").insert(customer);
    if (error) throw error;
    
    console.log(`Created customer: ${id} - ${customer.name}`);
    return c.json({ success: true, data: customer });
  } catch (error) {
    console.error("Error creating customer:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update customer [RELATIONAL]
app.put("/make-server-c142e950/customers/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await c.req.json();
    
    const { data: existing, error: fetchErr } = await db.from("customers").select("*").eq("id", id).maybeSingle();
    if (fetchErr) throw fetchErr;
    
    if (!existing) {
      return c.json({ success: false, error: "Customer not found" }, 404);
    }
    
    const customer = {
      ...existing,
      ...data,
      id,
      created_at: existing.created_at,
      updated_at: new Date().toISOString(),
    };
    
    const { error } = await db.from("customers").update(customer).eq("id", id);
    if (error) throw error;
    
    console.log(`Updated customer: ${id}`);
    return c.json({ success: true, data: customer });
  } catch (error) {
    console.error("Error updating customer:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete customer [RELATIONAL]
app.delete("/make-server-c142e950/customers/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const { data: existing } = await db.from("customers").select("id").eq("id", id).maybeSingle();
    if (!existing) {
      return c.json({ success: false, error: "Customer not found" }, 404);
    }
    
    const { error } = await db.from("customers").delete().eq("id", id);
    if (error) throw error;
    
    console.log(`Deleted customer: ${id}`);
    return c.json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Seed customers
app.post("/make-server-c142e950/customers/seed", async (c) => {
  try {
    // Clear existing customers [RELATIONAL]
    await db.from("customers").delete().neq("id", "");
    
    const seedCustomers = [
      {
        id: "CUST-001",
        name: "Manila Electronics Corp",
        industry: "Electronics",
        registered_address: "123 Ayala Avenue, Makati City",
        status: "Active",
        lead_source: "Referral",
        owner_id: "user-bd-rep-001",
        credit_terms: "Net 30",
        phone: "+63 2 8123 4567",
        email: "procurement@mec.com.ph",
        notes: null,
        created_at: new Date().toISOString(),
        created_by: "user-bd-rep-001",
        updated_at: new Date().toISOString(),
      },
      {
        id: "CUST-002",
        name: "Pacific Trading Inc",
        industry: "General Merchandise",
        registered_address: "456 Roxas Boulevard, Pasay City",
        status: "Active",
        lead_source: "Cold Outreach",
        owner_id: "user-bd-rep-001",
        credit_terms: "Net 45",
        phone: "+63 2 8234 5678",
        email: "operations@pacifictrade.ph",
        notes: null,
        created_at: new Date().toISOString(),
        created_by: "user-bd-rep-001",
        updated_at: new Date().toISOString(),
      },
      {
        id: "CUST-003",
        name: "Global Garments Ltd",
        industry: "Garments",
        registered_address: "789 Ortigas Center, Pasig City",
        status: "Active",
        lead_source: "Website Inquiry",
        owner_id: "user-bd-manager-001",
        credit_terms: "Net 30",
        phone: "+63 2 8345 6789",
        email: "logistics@globalgarments.ph",
        notes: null,
        created_at: new Date().toISOString(),
        created_by: "user-bd-manager-001",
        updated_at: new Date().toISOString(),
      },
      {
        id: "CUST-004",
        name: "Prime Pharmaceuticals",
        industry: "Pharmaceutical",
        registered_address: "321 BGC, Taguig City",
        status: "Prospect",
        lead_source: "Trade Show",
        owner_id: "user-bd-rep-001",
        credit_terms: "Net 15",
        phone: "+63 2 8456 7890",
        email: "supply@primepharma.ph",
        notes: null,
        created_at: new Date().toISOString(),
        created_by: "user-bd-rep-001",
        updated_at: new Date().toISOString(),
      },
      {
        id: "CUST-005",
        name: "Metro Food Distributors",
        industry: "Food & Beverage",
        registered_address: "654 Quezon Avenue, Quezon City",
        status: "Active",
        lead_source: "Referral",
        owner_id: "user-bd-manager-001",
        credit_terms: "Net 30",
        phone: "+63 2 8567 8901",
        email: "procurement@metrofood.ph",
        notes: null,
        created_at: new Date().toISOString(),
        created_by: "user-bd-manager-001",
        updated_at: new Date().toISOString(),
      },
    ];
    
    // [RELATIONAL]
    const { error: custSeedErr } = await db.from("customers").upsert(seedCustomers, { onConflict: "id" });
    if (custSeedErr) throw custSeedErr;
    for (const customer of seedCustomers) {
      console.log(`Seeded customer: ${customer.id} - ${customer.name}`);
    }
    
    return c.json({ 
      success: true, 
      message: "Customers seeded successfully",
      data: seedCustomers 
    });
  } catch (error) {
    console.error("Error seeding customers:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Clear all customers [RELATIONAL]
app.delete("/make-server-c142e950/customers/clear", async (c) => {
  try {
    const { data: existing } = await db.from("customers").select("id");
    const count = existing?.length || 0;
    
    const { error } = await db.from("customers").delete().neq("id", "");
    if (error) throw error;
    
    console.log(`Cleared ${count} customers`);
    return c.json({ success: true, message: `Cleared ${count} customers`, count });
  } catch (error) {
    console.error("Error clearing customers:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== CONSIGNEES API ====================
// Routes: GET/POST /consignees, GET/PATCH/DELETE /consignees/:id

// Get all consignees [RELATIONAL]
app.get("/make-server-c142e950/consignees", async (c) => {
  try {
    const customer_id = c.req.query("customer_id");
    let query = db.from("consignees").select("*");
    if (customer_id) query = query.eq("customer_id", customer_id);
    query = query.order("created_at", { ascending: false });

    const { data: consignees, error } = await query;
    if (error) throw error;

    console.log(`Fetched ${consignees?.length || 0} consignees${customer_id ? ` for customer ${customer_id}` : ""}`);
    return c.json({ success: true, data: consignees || [] });
  } catch (error) {
    console.error("Error fetching consignees:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get single consignee by ID [RELATIONAL]
app.get("/make-server-c142e950/consignees/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { data: consignee, error } = await db.from("consignees").select("*").eq("id", id).maybeSingle();
    if (error) throw error;

    if (!consignee) {
      return c.json({ success: false, error: "Consignee not found" }, 404);
    }
    return c.json({ success: true, data: consignee });
  } catch (error) {
    console.error("Error fetching consignee:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Create consignee [RELATIONAL]
app.post("/make-server-c142e950/consignees", async (c) => {
  try {
    const data = await c.req.json();
    if (!data.customer_id || !data.name) {
      return c.json({ success: false, error: "customer_id and name are required" }, 400);
    }

    const id = `CSG-${Date.now()}`;
    const consignee = {
      id,
      customer_id: data.customer_id,
      name: data.name,
      address: data.address || null,
      tin: data.tin || null,
      contact_person: data.contact_person || null,
      email: data.email || null,
      phone: data.phone || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await db.from("consignees").insert(consignee);
    if (error) throw error;

    console.log(`Created consignee: ${id} - ${consignee.name} (customer: ${consignee.customer_id})`);
    return c.json({ success: true, data: consignee });
  } catch (error) {
    console.error("Error creating consignee:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update consignee [RELATIONAL]
app.patch("/make-server-c142e950/consignees/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await c.req.json();

    const { data: existing, error: fetchErr } = await db.from("consignees").select("*").eq("id", id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) {
      return c.json({ success: false, error: "Consignee not found" }, 404);
    }

    const consignee = {
      ...existing,
      ...data,
      id,
      customer_id: existing.customer_id,
      created_at: existing.created_at,
      updated_at: new Date().toISOString(),
    };

    const { error } = await db.from("consignees").update(consignee).eq("id", id);
    if (error) throw error;

    console.log(`Updated consignee: ${id}`);
    return c.json({ success: true, data: consignee });
  } catch (error) {
    console.error("Error updating consignee:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete consignee [RELATIONAL]
app.delete("/make-server-c142e950/consignees/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { data: existing } = await db.from("consignees").select("id").eq("id", id).maybeSingle();
    if (!existing) {
      return c.json({ success: false, error: "Consignee not found" }, 404);
    }

    const { error } = await db.from("consignees").delete().eq("id", id);
    if (error) throw error;

    console.log(`Deleted consignee: ${id}`);
    return c.json({ success: true, message: "Consignee deleted successfully" });
  } catch (error) {
    console.error("Error deleting consignee:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== CONTACTS API ====================

// Get all contacts [RELATIONAL] — uses LEFT JOIN for company enrichment
app.get("/make-server-c142e950/contacts", async (c) => {
  try {
    const customer_id = c.req.query("customer_id");
    
    // Use a join to enrich with customer name in a single query
    let query = db.from("contacts").select("*, customers(name)");
    if (customer_id) query = query.eq("customer_id", customer_id);
    query = query.order("created_at", { ascending: false });
    
    const { data: contacts, error } = await query;
    if (error) throw error;
    
    // Flatten the join: { customers: { name } } → company field
    const enrichedContacts = (contacts || []).map((c: any) => ({
      ...c,
      company: c.customers?.name || '',
      customers: undefined, // remove nested object
    }));
    
    console.log(`Fetched ${enrichedContacts.length} contacts${customer_id ? ` for customer ${customer_id}` : ''}`);
    return c.json({ success: true, data: enrichedContacts });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get single contact by ID [RELATIONAL]
app.get("/make-server-c142e950/contacts/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { data: contact, error } = await db.from("contacts").select("*, customers(name)").eq("id", id).maybeSingle();
    if (error) throw error;
    
    if (!contact) {
      return c.json({ success: false, error: "Contact not found" }, 404);
    }
    
    const enrichedContact = {
      ...contact,
      company: contact.customers?.name || '',
      customers: undefined,
    };
    
    return c.json({ success: true, data: enrichedContact });
  } catch (error) {
    console.error("Error fetching contact:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Create contact [RELATIONAL]
app.post("/make-server-c142e950/contacts", async (c) => {
  try {
    const data = await c.req.json();
    
    const id = `CONTACT-${Date.now()}`;
    const now = new Date().toISOString();
    const dateOnly = now.split('T')[0];
    
    const contact = {
      id,
      first_name: data.first_name || null,
      last_name: data.last_name || null,
      title: data.title || null,
      email: data.email || null,
      phone: data.phone || null,
      customer_id: data.customer_id || null,
      owner_id: data.owner_id || null,
      lifecycle_stage: data.lifecycle_stage || "Lead",
      lead_status: data.lead_status || "New",
      company: data.company || "",
      status: data.status || "Lead",
      last_activity: now,
      created_date: dateOnly,
      notes: data.notes || null,
      created_at: now,
      created_by: data.created_by || null,
      updated_at: now,
    };
    
    const { error } = await db.from("contacts").insert(contact);
    if (error) throw error;
    
    const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    console.log(`Created contact: ${id} - ${fullName}${contact.customer_id ? ` for customer ${contact.customer_id}` : ''}`);
    
    return c.json({ success: true, data: contact });
  } catch (error) {
    console.error("Error creating contact:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update contact [RELATIONAL]
app.put("/make-server-c142e950/contacts/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await c.req.json();
    
    const { data: existing, error: fetchErr } = await db.from("contacts").select("*").eq("id", id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) {
      return c.json({ success: false, error: "Contact not found" }, 404);
    }
    
    const contact = {
      ...existing,
      ...data,
      id,
      created_at: existing.created_at,
      updated_at: new Date().toISOString(),
    };
    
    const { error } = await db.from("contacts").update(contact).eq("id", id);
    if (error) throw error;
    
    console.log(`Updated contact: ${id}`);
    return c.json({ success: true, data: contact });
  } catch (error) {
    console.error("Error updating contact:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ⚠️ IMPORTANT: Specific routes must come BEFORE parameterized routes
// Clear all contacts [RELATIONAL]
app.delete("/make-server-c142e950/contacts/clear", async (c) => {
  try {
    const { data: existing } = await db.from("contacts").select("id");
    const count = existing?.length || 0;
    
    const { error } = await db.from("contacts").delete().neq("id", "");
    if (error) throw error;
    
    console.log(`Cleared ${count} contacts`);
    return c.json({ success: true, message: `Cleared ${count} contacts`, count });
  } catch (error) {
    console.error("Error clearing contacts:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Migrate contacts from old schema (name field) to new schema (first_name, last_name) [RELATIONAL]
app.post("/make-server-c142e950/contacts/migrate-names", async (c) => {
  try {
    // In the relational schema, contacts already have first_name/last_name columns.
    // This endpoint is kept for backward compat but is largely a no-op now.
    const { data: contacts } = await db.from("contacts").select("*");
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const contact of (contacts || [])) {
      if ((contact as any).name && (!contact.first_name || !contact.last_name)) {
        const nameParts = ((contact as any).name || "").trim().split(' ');
        const first_name = nameParts[0] || '';
        const last_name = nameParts.slice(1).join(' ') || '';
        
        await db.from("contacts").update({ first_name, last_name, updated_at: new Date().toISOString() }).eq("id", contact.id);
        console.log(`Migrated contact ${contact.id}: "${(contact as any).name}" → first_name: "${first_name}", last_name: "${last_name}"`);
        migratedCount++;
      } else {
        skippedCount++;
      }
    }
    
    console.log(`Migration complete: ${migratedCount} migrated, ${skippedCount} skipped`);
    return c.json({ 
      success: true, 
      message: `Migrated ${migratedCount} contacts from old schema to new schema`,
      migrated: migratedCount, skipped: skippedCount
    });
  } catch (error) {
    console.error("Error migrating contacts:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete contact [RELATIONAL]
app.delete("/make-server-c142e950/contacts/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { data: existing } = await db.from("contacts").select("id").eq("id", id).maybeSingle();
    if (!existing) {
      return c.json({ success: false, error: "Contact not found" }, 404);
    }
    
    const { error } = await db.from("contacts").delete().eq("id", id);
    if (error) throw error;
    
    console.log(`Deleted contact: ${id}`);
    return c.json({ success: true, message: "Contact deleted successfully" });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ⚠️ REMOVED: Seed contacts endpoint
// Contact seed data endpoint has been removed to prevent fake data pollution
// Users should create real contacts through the UI instead

// ==================== TASKS API ====================

// Get all tasks [RELATIONAL]
app.get("/make-server-c142e950/tasks", async (c) => {
  try {
    const customerId = c.req.query("customer_id");
    const contactId = c.req.query("contact_id");
    const status = c.req.query("status");
    const ownerId = c.req.query("owner_id");
    
    let query = db.from("tasks").select("*");
    if (customerId) query = query.eq("customer_id", customerId);
    if (contactId) query = query.eq("contact_id", contactId);
    if (status) query = query.eq("status", status);
    if (ownerId) query = query.eq("owner_id", ownerId);
    query = query.order("due_date", { ascending: true }).order("created_at", { ascending: false });
    
    const { data: tasks, error } = await query;
    if (error) throw error;
    
    console.log(`Fetched ${tasks?.length || 0} tasks`);
    return c.json({ success: true, data: tasks || [] });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get single task by ID [RELATIONAL]
app.get("/make-server-c142e950/tasks/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { data: task, error } = await db.from("tasks").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!task) return c.json({ success: false, error: "Task not found" }, 404);
    return c.json({ success: true, data: task });
  } catch (error) {
    console.error("Error fetching task:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Create task [RELATIONAL]
app.post("/make-server-c142e950/tasks", async (c) => {
  try {
    const data = await c.req.json();
    const id = `TASK-${Date.now()}`;
    
    const task = {
      id, title: data.title, type: data.type, due_date: data.due_date,
      priority: data.priority || "Medium", status: data.status || "Pending",
      cancel_reason: data.cancel_reason || null, remarks: data.remarks || null,
      contact_id: data.contact_id || null, customer_id: data.customer_id || null,
      owner_id: data.owner_id,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    
    const { error } = await db.from("tasks").insert(task);
    if (error) throw error;
    
    console.log(`Created task: ${id} - ${task.title}`);
    return c.json({ success: true, data: task });
  } catch (error) {
    console.error("Error creating task:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update task [RELATIONAL]
app.put("/make-server-c142e950/tasks/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await c.req.json();
    
    const { data: existing, error: fetchErr } = await db.from("tasks").select("*").eq("id", id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) return c.json({ success: false, error: "Task not found" }, 404);
    
    const task = { ...existing, ...data, id, created_at: existing.created_at, updated_at: new Date().toISOString() };
    
    const { error } = await db.from("tasks").update(task).eq("id", id);
    if (error) throw error;
    
    console.log(`Updated task: ${id}`);
    return c.json({ success: true, data: task });
  } catch (error) {
    console.error("Error updating task:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete task [RELATIONAL]
app.delete("/make-server-c142e950/tasks/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { data: existing } = await db.from("tasks").select("id").eq("id", id).maybeSingle();
    if (!existing) return c.json({ success: false, error: "Task not found" }, 404);
    
    const { error } = await db.from("tasks").delete().eq("id", id);
    if (error) throw error;
    
    console.log(`Deleted task: ${id}`);
    return c.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== ACTIVITIES API ====================

// Get all activities [RELATIONAL]
app.get("/make-server-c142e950/activities", async (c) => {
  try {
    const customerId = c.req.query("customer_id");
    const contactId = c.req.query("contact_id");
    const userId = c.req.query("user_id");
    
    let query = db.from("activities").select("*");
    if (customerId) query = query.eq("customer_id", customerId);
    if (contactId) query = query.eq("contact_id", contactId);
    if (userId) query = query.eq("user_id", userId);
    query = query.order("date", { ascending: false });
    
    const { data: activities, error } = await query;
    if (error) throw error;
    
    console.log(`Fetched ${activities?.length || 0} activities`);
    return c.json({ success: true, data: activities || [] });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get single activity by ID [RELATIONAL]
app.get("/make-server-c142e950/activities/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { data: activity, error } = await db.from("activities").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!activity) return c.json({ success: false, error: "Activity not found" }, 404);
    return c.json({ success: true, data: activity });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Create activity [RELATIONAL]
app.post("/make-server-c142e950/activities", async (c) => {
  try {
    const data = await c.req.json();
    const id = `ACTIVITY-${Date.now()}`;
    
    const activity = {
      id, type: data.type, description: data.description,
      date: data.date || new Date().toISOString(),
      contact_id: data.contact_id || null, customer_id: data.customer_id || null,
      task_id: data.task_id || null, user_id: data.user_id,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      attachments: data.attachments || [],
    };
    
    const { error } = await db.from("activities").insert(activity);
    if (error) throw error;
    
    console.log(`Created activity: ${id} - ${activity.type}`);
    return c.json({ success: true, data: activity });
  } catch (error) {
    console.error("Error creating activity:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete activity [RELATIONAL]
app.delete("/make-server-c142e950/activities/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { data: existing } = await db.from("activities").select("id").eq("id", id).maybeSingle();
    if (!existing) return c.json({ success: false, error: "Activity not found" }, 404);
    
    const { error } = await db.from("activities").delete().eq("id", id);
    if (error) throw error;
    
    console.log(`Deleted activity: ${id}`);
    return c.json({ success: true, message: "Activity deleted successfully" });
  } catch (error) {
    console.error("Error deleting activity:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== BUDGET REQUESTS API ====================

// Get all budget requests [RELATIONAL]
app.get("/make-server-c142e950/budget-requests", async (c) => {
  try {
    const customerId = c.req.query("customer_id");
    const status = c.req.query("status");
    
    let query = db.from("budget_requests").select("*");
    if (customerId) query = query.eq("customer_id", customerId);
    if (status) query = query.eq("status", status);
    query = query.order("created_at", { ascending: false });
    
    const { data: budgetRequests, error } = await query;
    if (error) throw error;
    
    console.log(`Fetched ${budgetRequests?.length || 0} budget requests`);
    return c.json({ success: true, data: budgetRequests || [] });
  } catch (error) {
    console.error("Error fetching budget requests:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get single budget request by ID [RELATIONAL]
app.get("/make-server-c142e950/budget-requests/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { data: budgetRequest, error } = await db.from("budget_requests").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!budgetRequest) return c.json({ success: false, error: "Budget request not found" }, 404);
    return c.json({ success: true, data: budgetRequest });
  } catch (error) {
    console.error("Error fetching budget request:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Create budget request [RELATIONAL]
app.post("/make-server-c142e950/budget-requests", async (c) => {
  try {
    const data = await c.req.json();
    const id = `BR-${Date.now()}`;
    
    const budgetRequest = {
      id, type: data.type, amount: data.amount, justification: data.justification,
      status: data.status || "Pending", customer_id: data.customer_id || null,
      requested_by: data.requested_by, approved_by: data.approved_by || null,
      approved_at: data.approved_at || null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    
    const { error } = await db.from("budget_requests").insert(budgetRequest);
    if (error) throw error;
    
    console.log(`Created budget request: ${id} - ${budgetRequest.type} - ${budgetRequest.amount}`);
    return c.json({ success: true, data: budgetRequest });
  } catch (error) {
    console.error("Error creating budget request:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update budget request [RELATIONAL]
app.put("/make-server-c142e950/budget-requests/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await c.req.json();
    
    const { data: existing, error: fetchErr } = await db.from("budget_requests").select("*").eq("id", id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) return c.json({ success: false, error: "Budget request not found" }, 404);
    
    const budgetRequest = { ...existing, ...data, id, created_at: existing.created_at, updated_at: new Date().toISOString() };
    
    const { error } = await db.from("budget_requests").update(budgetRequest).eq("id", id);
    if (error) throw error;
    
    console.log(`Updated budget request: ${id} - Status: ${budgetRequest.status}`);
    return c.json({ success: true, data: budgetRequest });
  } catch (error) {
    console.error("Error updating budget request:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== EXPENSES API ====================

// Get all expenses [RELATIONAL]
app.get("/make-server-c142e950/expenses", async (c) => {
  try {
    const dateFrom = c.req.query("date_from");
    const dateTo = c.req.query("date_to");
    const category = c.req.query("category");
    const vendorId = c.req.query("vendor_id");
    const projectNumber = c.req.query("project_number");
    const status = c.req.query("status");
    
    let query = db.from("expenses").select("*");
    if (category) query = query.eq("category", category);
    if (vendorId) query = query.eq("vendor_id", vendorId);
    if (projectNumber) query = query.eq("project_number", projectNumber);
    if (status) query = query.eq("status", status);
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo);
    query = query.order("created_at", { ascending: false });
    
    const { data: rows, error } = await query;
    if (error) throw error;
    
    const expenses = (rows || []).map((r: any) => ({ ...r, expense_category: r.category }));
    console.log(`Fetched ${expenses.length} expenses`);
    return c.json({ success: true, data: expenses });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get single expense by ID [RELATIONAL]
app.get("/make-server-c142e950/expenses/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { data: expense, error } = await db.from("expenses").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!expense) return c.json({ success: false, error: "Expense not found" }, 404);
    return c.json({ success: true, data: { ...expense, expense_category: expense.category } });
  } catch (error) {
    console.error("Error fetching expense:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Create expense [RELATIONAL]
app.post("/make-server-c142e950/expenses", async (c) => {
  try {
    const data = await c.req.json();
    const id = data.id || `EXP-${Date.now()}`;
    
    const expense: any = {
      id, booking_id: data.booking_id || null, project_id: data.project_id || null,
      project_number: data.project_number || null, evoucher_id: data.evoucher_id || null,
      customer_name: data.customer_name || null, description: data.description || null,
      category: data.expense_category || data.category || null,
      charge_type: data.charge_type || null, service_type: data.service_type || null,
      amount: data.amount || 0, quantity: data.quantity || 1, unit_price: data.unit_price || 0,
      currency: data.currency || "PHP", unit_type: data.unit_type || null,
      is_taxed: data.is_taxed || false, tax_code: data.tax_code || null,
      status: data.status || "active", vendor_name: data.vendor_name || null,
      receipt_number: data.receipt_number || null, booking_number: data.booking_number || null,
      service_tag: data.service_tag || null, notes: data.notes || null,
      created_by: data.created_by || null,
      created_at: data.created_at || new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    
    const { error } = await db.from("expenses").insert(expense);
    if (error) throw error;
    
    console.log(`Created expense: ${id} - ${expense.description} - ${expense.amount}`);
    return c.json({ success: true, data: { ...expense, expense_category: expense.category } });
  } catch (error) {
    console.error("Error creating expense:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update expense [RELATIONAL]
app.put("/make-server-c142e950/expenses/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await c.req.json();
    
    const { data: existing, error: fetchErr } = await db.from("expenses").select("*").eq("id", id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) return c.json({ success: false, error: "Expense not found" }, 404);
    
    const updateData: any = { ...data, updated_at: new Date().toISOString() };
    if (data.expense_category) { updateData.category = data.expense_category; delete updateData.expense_category; }
    delete updateData.id; delete updateData.created_at;
    
    const { error } = await db.from("expenses").update(updateData).eq("id", id);
    if (error) throw error;
    
    const { data: updated } = await db.from("expenses").select("*").eq("id", id).maybeSingle();
    console.log(`Updated expense: ${id} - ${updated?.description}`);
    return c.json({ success: true, data: { ...updated, expense_category: updated?.category } });
  } catch (error) {
    console.error("Error updating expense:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete expense [RELATIONAL]
app.delete("/make-server-c142e950/expenses/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { data: existing } = await db.from("expenses").select("id").eq("id", id).maybeSingle();
    if (!existing) return c.json({ success: false, error: "Expense not found" }, 404);
    
    const { error } = await db.from("expenses").delete().eq("id", id);
    if (error) throw error;
    
    console.log(`Deleted expense: ${id}`);
    return c.json({ success: true, message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get expense summary by category [RELATIONAL]
app.get("/make-server-c142e950/expenses/summary/by-category", async (c) => {
  try {
    const dateFrom = c.req.query("date_from");
    const dateTo = c.req.query("date_to");
    
    let query = db.from("expenses").select("*");
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo);
    
    const { data: expenses, error } = await query;
    if (error) throw error;
    
    const summary: Record<string, { category: string; total: number; count: number }> = {};
    (expenses || []).forEach((exp: any) => {
      const category = exp.category || "Uncategorized";
      if (!summary[category]) {
        summary[category] = { category, total: 0, count: 0 };
      }
      summary[category].total += Number(exp.amount) || 0;
      summary[category].count += 1;
    });
    
    const result = Object.values(summary).sort((a, b) => b.total - a.total);
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching expense summary:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== VENDORS API ====================

// Get all vendors (optionally filter by type)
app.get("/make-server-c142e950/vendors", async (c) => {
  try {
    const type = c.req.query("type");
    const search = c.req.query("search");
    
    // [RELATIONAL] service_providers table — vendors have type mapped to provider_type
    let query = db.from("service_providers").select("*");
    if (type && type !== "All") query = query.eq("provider_type", type);
    if (search) {
      query = query.or(`company_name.ilike.%${search}%,country.ilike.%${search}%,contact_person.ilike.%${search}%`);
    }
    query = query.order("company_name", { ascending: true });
    
    const { data: rows, error } = await query;
    if (error) throw error;
    
    // Map relational fields back to KV-compatible names for frontend
    const vendors = (rows || []).map((r: any) => ({
      ...r,
      type: r.provider_type,
      services_offered: r.services || [],
    }));
    
    console.log(`Fetched ${vendors.length} vendors`);
    return c.json({ success: true, data: vendors });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get single vendor by ID [RELATIONAL]
app.get("/make-server-c142e950/vendors/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { data: row, error } = await db.from("service_providers").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!row) return c.json({ success: false, error: "Vendor not found" }, 404);
    
    const vendor = { ...row, type: row.provider_type, services_offered: row.services || [] };
    return c.json({ success: true, data: vendor });
  } catch (error) {
    console.error("Error fetching vendor:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Create vendor [RELATIONAL]
app.post("/make-server-c142e950/vendors", async (c) => {
  try {
    const data = await c.req.json();
    const id = `VENDOR-${Date.now()}`;
    const now = new Date().toISOString();
    
    const row = {
      id, provider_type: data.type || "Local Agent",
      company_name: data.company_name, country: data.country,
      territory: data.territory || "", wca_number: data.wca_number || "",
      contact_person: data.contact_person || "", contact_email: data.contact_email || "",
      contact_phone: data.contact_phone || "", address: data.address || "",
      services: data.services_offered || [], total_shipments: 0,
      notes: data.notes || "", created_at: now, updated_at: now,
    };
    
    const { error } = await db.from("service_providers").insert(row);
    if (error) throw error;
    
    // Return in KV-compatible shape
    const vendor = { ...row, type: row.provider_type, services_offered: row.services };
    console.log(`Created vendor: ${id} - ${vendor.company_name}`);
    return c.json({ success: true, data: vendor });
  } catch (error) {
    console.error("Error creating vendor:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update vendor [RELATIONAL]
app.put("/make-server-c142e950/vendors/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await c.req.json();
    
    const { data: existing, error: fetchErr } = await db.from("service_providers").select("*").eq("id", id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) return c.json({ success: false, error: "Vendor not found" }, 404);
    
    // Map incoming KV-style fields to relational columns
    const updateData: any = { ...data, updated_at: new Date().toISOString() };
    if (data.type) { updateData.provider_type = data.type; delete updateData.type; }
    if (data.services_offered) { updateData.services = data.services_offered; delete updateData.services_offered; }
    delete updateData.id;
    
    const { error } = await db.from("service_providers").update(updateData).eq("id", id);
    if (error) throw error;
    
    // Re-fetch and return in KV-compatible shape
    const { data: updated } = await db.from("service_providers").select("*").eq("id", id).maybeSingle();
    const vendor = { ...updated, type: updated?.provider_type, services_offered: updated?.services || [] };
    
    console.log(`Updated vendor: ${id}`);
    return c.json({ success: true, data: vendor });
  } catch (error) {
    console.error("Error updating vendor:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete vendor [RELATIONAL]
app.delete("/make-server-c142e950/vendors/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { data: existing } = await db.from("service_providers").select("id").eq("id", id).maybeSingle();
    if (!existing) return c.json({ success: false, error: "Vendor not found" }, 404);
    
    const { error } = await db.from("service_providers").delete().eq("id", id);
    if (error) throw error;
    
    console.log(`Deleted vendor: ${id}`);
    return c.json({ success: true, message: "Vendor deleted successfully" });
  } catch (error) {
    console.error("Error deleting vendor:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Seed vendors
app.post("/make-server-c142e950/vendors/seed", async (c) => {
  try {
    // Clear existing vendors [RELATIONAL]
    await db.from("service_providers").delete().neq("id", "");
    
    const now = new Date().toISOString();
    
    const seedVendors = [
      {
        id: "VENDOR-001",
        type: "Overseas Agent",
        company_name: "Global Freight Solutions",
        country: "Singapore",
        territory: "Southeast Asia",
        wca_number: "WCA-SG-001",
        contact_person: "Michael Tan",
        contact_email: "michael.tan@globalfreight.sg",
        contact_phone: "+65 6123 4567",
        address: "123 Marina Bay, Singapore 018956",
        services_offered: ["Forwarding", "Brokerage"],
        total_shipments: 156,
        notes: "Preferred partner for Singapore shipments",
        created_at: now,
        updated_at: now,
      },
      {
        id: "VENDOR-002",
        type: "Overseas Agent",
        company_name: "Pacific Logistics Network",
        country: "China",
        territory: "East Asia",
        wca_number: "WCA-CN-045",
        contact_person: "Li Wei",
        contact_email: "liwei@pacificlog.cn",
        contact_phone: "+86 21 1234 5678",
        address: "456 Pudong Avenue, Shanghai 200120, China",
        services_offered: ["Forwarding", "Trucking"],
        total_shipments: 234,
        notes: "Strong consolidation services from Shanghai",
        created_at: now,
        updated_at: now,
      },
      {
        id: "VENDOR-003",
        type: "Local Agent",
        company_name: "Manila Port Services",
        country: "Philippines",
        territory: "Metro Manila",
        wca_number: "",
        contact_person: "Juan Reyes",
        contact_email: "juan.reyes@manilaport.ph",
        contact_phone: "+63 2 8123 4567",
        address: "Port Area, Manila 1018, Philippines",
        services_offered: ["Brokerage", "Trucking"],
        total_shipments: 89,
        notes: "Excellent port handling and local customs clearance",
        created_at: now,
        updated_at: now,
      },
      {
        id: "VENDOR-004",
        type: "Subcontractor",
        company_name: "FastTrack Customs Brokers",
        country: "Philippines",
        territory: "Nationwide",
        wca_number: "",
        contact_person: "Maria Santos",
        contact_email: "maria@fasttrackph.com",
        contact_phone: "+63 917 123 4567",
        address: "Makati City, Metro Manila, Philippines",
        services_offered: ["Brokerage"],
        total_shipments: 312,
        notes: "BOC-accredited broker, fast processing",
        created_at: now,
        updated_at: now,
      },
      {
        id: "VENDOR-005",
        type: "Overseas Agent",
        company_name: "American Express Cargo",
        country: "United States",
        territory: "North America",
        wca_number: "WCA-US-112",
        contact_person: "John Miller",
        contact_email: "jmiller@amexcargo.com",
        contact_phone: "+1 310 555 1234",
        address: "Los Angeles, CA 90001, USA",
        services_offered: ["Forwarding", "Marine Insurance"],
        total_shipments: 67,
        notes: "West Coast operations, good for consolidations",
        created_at: now,
        updated_at: now,
      },
      {
        id: "VENDOR-006",
        type: "Subcontractor",
        company_name: "Metro Trucking Solutions",
        country: "Philippines",
        territory: "Luzon",
        wca_number: "",
        contact_person: "Roberto Cruz",
        contact_email: "roberto@metrotruck.ph",
        contact_phone: "+63 918 234 5678",
        address: "Valenzuela City, Metro Manila, Philippines",
        services_offered: ["Trucking"],
        total_shipments: 445,
        notes: "Large fleet, 24/7 operations",
        created_at: now,
        updated_at: now,
      },
      {
        id: "VENDOR-007",
        type: "Local Agent",
        company_name: "Cebu Logistics Hub",
        country: "Philippines",
        territory: "Visayas",
        wca_number: "",
        contact_person: "Anna Garcia",
        contact_email: "anna@cebuhub.ph",
        contact_phone: "+63 32 234 5678",
        address: "Cebu City 6000, Philippines",
        services_offered: ["Forwarding", "Trucking", "Brokerage"],
        total_shipments: 178,
        notes: "Comprehensive Visayas coverage",
        created_at: now,
        updated_at: now,
      },
      {
        id: "VENDOR-008",
        type: "Overseas Agent",
        company_name: "Tokyo International Freight",
        country: "Japan",
        territory: "Northeast Asia",
        wca_number: "WCA-JP-078",
        contact_person: "Takeshi Yamamoto",
        contact_email: "yamamoto@tokyofreight.jp",
        contact_phone: "+81 3 1234 5678",
        address: "Tokyo 100-0001, Japan",
        services_offered: ["Forwarding", "Marine Insurance"],
        total_shipments: 92,
        notes: "Premium service, strong airline connections",
        created_at: now,
        updated_at: now,
      },
    ];
    
    // Map to relational columns and upsert [RELATIONAL]
    const relationalRows = seedVendors.map((v: any) => ({
      id: v.id, provider_type: v.type, company_name: v.company_name,
      country: v.country, territory: v.territory, wca_number: v.wca_number,
      contact_person: v.contact_person, contact_email: v.contact_email,
      contact_phone: v.contact_phone, address: v.address,
      services: v.services_offered || [], total_shipments: v.total_shipments || 0,
      notes: v.notes, created_at: v.created_at, updated_at: v.updated_at,
    }));
    const { error: seedErr } = await db.from("service_providers").upsert(relationalRows, { onConflict: "id" });
    if (seedErr) throw seedErr;
    for (const vendor of seedVendors) {
      console.log(`Seeded vendor: ${vendor.id} - ${vendor.company_name}`);
    }
    
    return c.json({ 
      success: true, 
      message: "Vendors seeded successfully",
      data: seedVendors 
    });
  } catch (error) {
    console.error("Error seeding vendors:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Clear all vendors
app.delete("/make-server-c142e950/vendors/clear", async (c) => {
  try {
    const { data: existingVendors } = await db.from("network_partners").select("id").eq("partner_type", "vendor");
    const count = existingVendors?.length || 0;
    if (count > 0) await db.from("network_partners").delete().eq("partner_type", "vendor");
    
    console.log(`Cleared ${count} vendors`);
    
    return c.json({ 
      success: true, 
      message: `Cleared ${count} vendors`,
      count 
    });
  } catch (error) {
    console.error("Error clearing vendors:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== BD REPORTS API ====================

// Get available report templates
app.get("/make-server-c142e950/reports/templates", async (c) => {
  try {
    const templates = [
      {
        id: "quotation-performance",
        name: "Quotation Performance Report",
        description: "Overview of quotation metrics, win rates, and conversion statistics",
        icon: "📊",
        category: "Performance"
      },
      {
        id: "customer-activity",
        name: "Customer Activity Report",
        description: "Customer engagement, quotations, and lifetime value analysis",
        icon: "👥",
        category: "Customers"
      },
      {
        id: "rep-performance",
        name: "BD Rep Performance Report",
        description: "Individual and team performance metrics and comparisons",
        icon: "🎯",
        category: "Performance"
      },
      {
        id: "pipeline-health",
        name: "Pipeline Health Report",
        description: "Pipeline stages, conversion rates, and velocity metrics",
        icon: "💼",
        category: "Pipeline"
      },
      {
        id: "budget-requests",
        name: "Budget Request Report",
        description: "Overview of budget requests, approvals, and spending",
        icon: "📈",
        category: "Finance"
      }
    ];

    return c.json({ success: true, data: templates });
  } catch (error) {
    console.error("Error fetching report templates:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Generate report based on configuration
app.post("/make-server-c142e950/reports/generate", async (c) => {
  try {
    const config = await c.req.json();
    const { templateId, dataSource, columns, filters, groupBy, aggregations, sortBy, dateRange } = config;

    // Fetch data based on dataSource
    let rawData: any[] = [];
    
    if (dataSource === "quotations" || templateId === "quotation-performance" || templateId === "pipeline-health") {
      const { data: qRows } = await db.from("quotations").select("*");
      rawData = (qRows || []).map((r: any) => mergeFromRow(r));
    } else if (dataSource === "customers" || templateId === "customer-activity") {
      const { data: cRows } = await db.from("customers").select("*");
      rawData = cRows || [];
    } else if (dataSource === "budget_requests" || templateId === "budget-requests") {
      const { data: brRows } = await db.from("budget_requests").select("*");
      rawData = brRows || [];
    } else if (dataSource === "contacts") {
      const { data: ctRows } = await db.from("contacts").select("*");
      rawData = ctRows || [];
    } else if (dataSource === "activities") {
      const { data: actRows } = await db.from("activity_log").select("*");
      rawData = actRows || [];
    }

    // Apply filters
    let filteredData = rawData;
    if (filters && filters.length > 0) {
      filteredData = rawData.filter(item => {
        return filters.every((filter: any) => {
          const { field, operator, value } = filter;
          const fieldValue = item[field];

          switch (operator) {
            case "equals":
              return fieldValue === value;
            case "not_equals":
              return fieldValue !== value;
            case "contains":
              return String(fieldValue || "").toLowerCase().includes(String(value).toLowerCase());
            case "greater_than":
              return Number(fieldValue) > Number(value);
            case "less_than":
              return Number(fieldValue) < Number(value);
            case "in":
              return Array.isArray(value) && value.includes(fieldValue);
            case "between":
              return Number(fieldValue) >= Number(value[0]) && Number(fieldValue) <= Number(value[1]);
            case "date_after":
              return new Date(fieldValue) > new Date(value);
            case "date_before":
              return new Date(fieldValue) < new Date(value);
            case "date_between":
              return new Date(fieldValue) >= new Date(value[0]) && new Date(fieldValue) <= new Date(value[1]);
            default:
              return true;
          }
        });
      });
    }

    // Apply date range filter if provided
    if (dateRange && dateRange.field && dateRange.start && dateRange.end) {
      filteredData = filteredData.filter(item => {
        const date = new Date(item[dateRange.field]);
        return date >= new Date(dateRange.start) && date <= new Date(dateRange.end);
      });
    }

    // Calculate metrics based on template
    let metrics: any = {};
    let chartData: any = {};

    if (templateId === "quotation-performance") {
      const total = filteredData.length;
      const wonCount = filteredData.filter(q => q.status === "Won").length;
      const lostCount = filteredData.filter(q => q.status === "Lost").length;
      const sentCount = filteredData.filter(q => q.status === "Sent to Client").length;
      const draftCount = filteredData.filter(q => q.status === "Draft").length;
      
      const totalValue = filteredData.reduce((sum, q) => sum + (q.total_amount || 0), 0);
      const avgValue = total > 0 ? totalValue / total : 0;
      const winRate = (wonCount + lostCount) > 0 ? (wonCount / (wonCount + lostCount)) * 100 : 0;

      metrics = {
        total_quotations: total,
        won_count: wonCount,
        lost_count: lostCount,
        sent_count: sentCount,
        draft_count: draftCount,
        total_value: totalValue,
        average_value: avgValue,
        win_rate: winRate.toFixed(1)
      };

      // Chart data: Status distribution
      chartData.statusDistribution = [
        { name: "Won", value: wonCount },
        { name: "Lost", value: lostCount },
        { name: "Sent", value: sentCount },
        { name: "Draft", value: draftCount }
      ];

      // Chart data: Monthly trend
      const monthlyData: any = {};
      filteredData.forEach(q => {
        const month = new Date(q.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        monthlyData[month] = (monthlyData[month] || 0) + 1;
      });
      chartData.monthlyTrend = Object.entries(monthlyData).map(([month, count]) => ({
        month,
        count
      }));

    } else if (templateId === "customer-activity") {
      // Get all quotations and contacts for calculations
      const { data: qRowsR } = await db.from("quotations").select("*");
      const allQuotations = (qRowsR || []).map((r: any) => mergeFromRow(r));
      const { data: ctRowsR } = await db.from("contacts").select("*");
      const allContacts = ctRowsR || [];
      
      metrics = {
        total_customers: filteredData.length,
        total_quotations: allQuotations.length,
        active_customers: filteredData.filter((c: any) => {
          const customerQuotations = allQuotations.filter((q: any) => q.customer_id === c.id);
          return customerQuotations.length > 0;
        }).length
      };

      // Top customers by quotation count
      const customerQuotationCounts: any = {};
      allQuotations.forEach((q: any) => {
        customerQuotationCounts[q.customer_id] = (customerQuotationCounts[q.customer_id] || 0) + 1;
      });
      
      chartData.topCustomers = Object.entries(customerQuotationCounts)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 10)
        .map(([customerId, count]) => {
          const customer = filteredData.find((c: any) => c.id === customerId);
          return {
            name: customer?.company_name || "Unknown",
            count
          };
        });

    } else if (templateId === "rep-performance") {
      const { data: qRowsRP } = await db.from("quotations").select("*");
      const allQuotations = (qRowsRP || []).map((r: any) => mergeFromRow(r));
      const { data: uRowsRP } = await db.from("users").select("*");
      const allUsers = uRowsRP || [];
      const bdUsers = allUsers.filter((u: any) => u.department === "Business Development");

      const repStats: any = {};
      bdUsers.forEach((user: any) => {
        const userQuotations = allQuotations.filter((q: any) => q.created_by === user.id);
        const wonQuotations = userQuotations.filter((q: any) => q.status === "Won");
        const lostQuotations = userQuotations.filter((q: any) => q.status === "Lost");
        const totalDecided = wonQuotations.length + lostQuotations.length;
        const winRate = totalDecided > 0 ? (wonQuotations.length / totalDecided) * 100 : 0;

        repStats[user.id] = {
          name: user.name,
          total_quotations: userQuotations.length,
          won_count: wonQuotations.length,
          win_rate: winRate,
          total_value: userQuotations.reduce((sum: number, q: any) => sum + (q.total_amount || 0), 0)
        };
      });

      metrics = {
        total_reps: bdUsers.length,
        total_quotations: allQuotations.length,
        avg_quotations_per_rep: bdUsers.length > 0 ? allQuotations.length / bdUsers.length : 0
      };

      chartData.repPerformance = Object.values(repStats);

    } else if (templateId === "pipeline-health") {
      const statusCounts: any = {
        "Draft": 0,
        "Inquiry Submitted": 0,
        "Sent to Client": 0,
        "Won": 0,
        "Lost": 0
      };

      const statusValues: any = {
        "Draft": 0,
        "Inquiry Submitted": 0,
        "Sent to Client": 0,
        "Won": 0,
        "Lost": 0
      };

      filteredData.forEach(q => {
        if (statusCounts.hasOwnProperty(q.status)) {
          statusCounts[q.status]++;
          statusValues[q.status] += (q.total_amount || 0);
        }
      });

      const totalValue = Object.values(statusValues).reduce((sum: number, val: any) => sum + val, 0);

      metrics = {
        total_pipeline_value: totalValue,
        active_opportunities: statusCounts["Sent to Client"] + statusCounts["Inquiry Submitted"],
        won_count: statusCounts["Won"],
        lost_count: statusCounts["Lost"]
      };

      chartData.pipelineStages = Object.entries(statusCounts).map(([stage, count]) => ({
        stage,
        count,
        value: statusValues[stage]
      }));

    } else if (templateId === "budget-requests") {
      const approved = filteredData.filter(br => br.status === "Approved").length;
      const pending = filteredData.filter(br => br.status === "Pending").length;
      const rejected = filteredData.filter(br => br.status === "Rejected").length;
      const totalAmount = filteredData.reduce((sum, br) => sum + (br.amount || 0), 0);

      metrics = {
        total_requests: filteredData.length,
        approved_count: approved,
        pending_count: pending,
        rejected_count: rejected,
        total_amount: totalAmount,
        approval_rate: (approved + rejected) > 0 ? (approved / (approved + rejected)) * 100 : 0
      };

      chartData.statusDistribution = [
        { name: "Approved", value: approved },
        { name: "Pending", value: pending },
        { name: "Rejected", value: rejected }
      ];
    }

    // Select columns if specified
    let tableData = filteredData;
    if (columns && columns.length > 0) {
      tableData = filteredData.map(item => {
        const row: any = {};
        columns.forEach((col: string) => {
          row[col] = item[col];
        });
        return row;
      });
    }

    // Apply sorting
    if (sortBy && sortBy.length > 0) {
      tableData.sort((a: any, b: any) => {
        for (const sort of sortBy) {
          const { field, direction } = sort;
          const aVal = a[field];
          const bVal = b[field];
          
          if (aVal < bVal) return direction === "asc" ? -1 : 1;
          if (aVal > bVal) return direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return c.json({
      success: true,
      data: {
        metrics,
        chartData,
        tableData: tableData.slice(0, 1000), // Limit to 1000 rows for performance
        totalRows: filteredData.length
      }
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get user's saved reports
app.get("/make-server-c142e950/reports/saved", async (c) => {
  try {
    const userId = c.req.query("user_id");
    
    if (!userId) {
      return c.json({ success: false, error: "User ID required" }, 400);
    }

    const { data: srRows } = await db.from("saved_reports").select("*").eq("user_id", userId);
    const savedReports = srRows || [];
    
    return c.json({ success: true, data: savedReports });
  } catch (error) {
    console.error("Error fetching saved reports:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Save report configuration
app.post("/make-server-c142e950/reports/save", async (c) => {
  try {
    const { userId, name, description, config } = await c.req.json();
    
    if (!userId || !name || !config) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }

    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const savedReport = {
      id: reportId,
      user_id: userId,
      name,
      description: description || "",
      config,
      created_at: new Date().toISOString(),
      last_run: null
    };

    // Insert only known columns; return full object for API compat
    await db.from("saved_reports").insert({
      id: reportId,
      user_id: userId,
      name,
      report_type: config?.templateId || null,
      config,
    });
    
    return c.json({ success: true, data: savedReport });
  } catch (error) {
    console.error("Error saving report:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete saved report
app.delete("/make-server-c142e950/reports/saved/:id", async (c) => {
  try {
    const reportId = c.req.param("id");
    const userId = c.req.query("user_id");
    
    if (!userId) {
      return c.json({ success: false, error: "User ID required" }, 400);
    }

    await db.from("saved_reports").delete().eq("id", reportId).eq("user_id", userId);
    
    return c.json({ success: true, message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error deleting saved report:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Export report to CSV/Excel/PDF
app.post("/make-server-c142e950/reports/export", async (c) => {
  try {
    const { format, data, filename } = await c.req.json();
    
    if (format === "csv") {
      // Generate CSV
      if (!data || data.length === 0) {
        return c.json({ success: false, error: "No data to export" }, 400);
      }

      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(","),
        ...data.map((row: any) => 
          headers.map(header => {
            const value = row[header];
            // Escape quotes and wrap in quotes if contains comma
            const stringValue = String(value || "");
            if (stringValue.includes(",") || stringValue.includes('"')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }).join(",")
        )
      ];

      const csvContent = csvRows.join("\n");
      
      return c.json({
        success: true,
        data: {
          content: csvContent,
          filename: filename || "report.csv",
          mimeType: "text/csv"
        }
      });
    } else if (format === "excel") {
      // For Excel, we'll return CSV with .xlsx extension
      // In a production app, you'd use a library like xlsx
      if (!data || data.length === 0) {
        return c.json({ success: false, error: "No data to export" }, 400);
      }

      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join("\t"), // Tab-separated for Excel
        ...data.map((row: any) => 
          headers.map(header => String(row[header] || "")).join("\t")
        )
      ];

      const content = csvRows.join("\n");
      
      return c.json({
        success: true,
        data: {
          content,
          filename: filename || "report.xlsx",
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }
      });
    } else if (format === "pdf") {
      // For PDF, return a simple text representation
      // In production, use a PDF generation library
      return c.json({
        success: true,
        data: {
          content: JSON.stringify(data, null, 2),
          filename: filename || "report.pdf",
          mimeType: "application/pdf",
          note: "PDF generation requires additional library - returning JSON for now"
        }
      });
    } else {
      return c.json({ success: false, error: "Invalid export format" }, 400);
    }
  } catch (error) {
    console.error("Error exporting report:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== CONTROL CENTER REPORTS API ====================

// Helper function to apply filter operators
function applyFilterOperator(fieldValue: any, operator: string, filterValue: any): boolean {
  switch (operator) {
    case 'equals':
      return fieldValue === filterValue;
    case 'not_equals':
      return fieldValue !== filterValue;
    case 'contains':
      return String(fieldValue || '').toLowerCase().includes(String(filterValue).toLowerCase());
    case 'starts_with':
      return String(fieldValue || '').toLowerCase().startsWith(String(filterValue).toLowerCase());
    case 'greater_than':
      return Number(fieldValue) > Number(filterValue);
    case 'less_than':
      return Number(fieldValue) < Number(filterValue);
    case 'greater_than_or_equal':
      return Number(fieldValue) >= Number(filterValue);
    case 'less_than_or_equal':
      return Number(fieldValue) <= Number(filterValue);
    case 'date_after':
      return new Date(fieldValue) > new Date(filterValue);
    case 'date_before':
      return new Date(fieldValue) < new Date(filterValue);
    default:
      return true;
  }
}

// Generate report from Control Center (cross-entity queries)
app.post("/make-server-c142e950/reports/control-center", async (c) => {
  try {
    const { selectedFields, filters, groupBy, aggregations } = await c.req.json();
    
    console.log('[Control Center] Received config:', {
      selectedFields: selectedFields?.length || 0,
      filters: filters?.length || 0,
      groupBy: groupBy?.length || 0,
      aggregations: aggregations?.length || 0
    });

    // If no fields selected, return empty result
    if (!selectedFields || selectedFields.length === 0) {
      return c.json({
        success: true,
        data: [],
        columns: []
      });
    }

    // Determine which entities are involved
    const entitiesInvolved = new Set<string>();
    selectedFields.forEach((f: any) => entitiesInvolved.add(f.entity));
    if (filters) {
      filters.forEach((f: any) => entitiesInvolved.add(f.entity));
    }

    console.log('[Control Center] Entities involved:', Array.from(entitiesInvolved));

    // Fetch all required entities from KV store
    const entityData: Record<string, any[]> = {};
    for (const entity of entitiesInvolved) {
      const tableMap: Record<string, string> = { quotations: 'quotations', customers: 'customers', contacts: 'contacts', activities: 'activity_log', budget_requests: 'budget_requests' };
      const tableName = tableMap[entity];
      if (tableName) {
        const { data: rows } = await db.from(tableName).select("*");
        entityData[entity] = tableName === 'quotations' ? (rows || []).map((r: any) => mergeFromRow(r)) : (rows || []);
        console.log(`[Control Center] Loaded ${entityData[entity].length} records from ${entity}`);
      }
    }

    // Determine primary entity (the one with most selected fields)
    const fieldCounts: Record<string, number> = {};
    selectedFields.forEach((f: any) => {
      fieldCounts[f.entity] = (fieldCounts[f.entity] || 0) + 1;
    });
    const primaryEntity = Object.entries(fieldCounts).sort(([, a], [, b]) => b - a)[0][0];
    console.log('[Control Center] Primary entity:', primaryEntity, 'Field counts:', fieldCounts);

    // Start with primary entity data
    let results = entityData[primaryEntity] || [];
    console.log('[Control Center] Starting with', results.length, 'records from primary entity');

    // Apply filters
    if (filters && filters.length > 0) {
      results = results.filter((item: any) => {
        return filters.every((filter: any) => {
          // For filters on the primary entity, apply directly
          if (filter.entity === primaryEntity) {
            const fieldValue = item[filter.field];
            return applyFilterOperator(fieldValue, filter.operator, filter.value);
          }
          
          // For filters on related entities, we need to do a lookup
          // This is a simplified version - in production you'd handle complex joins
          if (filter.entity === 'customers' && primaryEntity === 'quotations') {
            const customer = entityData.customers?.find((c: any) => c.id === item.customer_id);
            if (!customer) return false;
            return applyFilterOperator(customer[filter.field], filter.operator, filter.value);
          }
          
          if (filter.entity === 'contacts' && primaryEntity === 'quotations') {
            const contact = entityData.contacts?.find((c: any) => c.id === item.contact_person_id);
            if (!contact) return false;
            return applyFilterOperator(contact[filter.field], filter.operator, filter.value);
          }
          
          // Default: don't filter if we can't match the relationship
          return true;
        });
      });
      console.log('[Control Center] After filtering:', results.length, 'records');
    }

    // Build result rows with cross-entity field mapping
    const resultRows = results.map((item: any) => {
      const row: any = {};
      
      selectedFields.forEach((field: any) => {
        const columnName = field.displayLabel;
        
        if (field.entity === primaryEntity) {
          // Direct field from primary entity
          row[columnName] = item[field.field];
        } else if (field.entity === 'customers' && primaryEntity === 'quotations') {
          // Join to customers
          const customer = entityData.customers?.find((c: any) => c.id === item.customer_id);
          row[columnName] = customer ? customer[field.field] : null;
        } else if (field.entity === 'contacts' && primaryEntity === 'quotations') {
          // Join to contacts
          const contact = entityData.contacts?.find((c: any) => c.id === item.contact_person_id);
          row[columnName] = contact ? contact[field.field] : null;
        } else if (field.entity === 'quotations' && primaryEntity === 'customers') {
          // Can't easily do one-to-many in this simple structure
          // Would need aggregation logic here
          row[columnName] = null;
        } else {
          row[columnName] = null;
        }
      });
      
      return row;
    });

    console.log('[Control Center] Built', resultRows.length, 'result rows');

    // Handle grouping and aggregations
    let finalResults = resultRows;
    if (groupBy && groupBy.length > 0 && aggregations && aggregations.length > 0) {
      // Group by specified fields
      const grouped: Record<string, any[]> = {};
      
      resultRows.forEach((row: any) => {
        const groupKey = groupBy.map((g: any) => row[g.label]).join('|');
        if (!grouped[groupKey]) {
          grouped[groupKey] = [];
        }
        grouped[groupKey].push(row);
      });

      // Calculate aggregations for each group
      finalResults = Object.entries(grouped).map(([groupKey, rows]) => {
        const result: any = {};
        
        // Add group by fields
        groupBy.forEach((g: any, index: number) => {
          result[g.label] = groupKey.split('|')[index];
        });
        
        // Add aggregations
        aggregations.forEach((agg: any) => {
          const field = selectedFields.find((f: any) => f.entity === agg.entity && f.field === agg.field);
          const columnName = field?.displayLabel;
          
          if (columnName) {
            const values = rows.map((r: any) => Number(r[columnName]) || 0);
            
            if (agg.function === 'SUM') {
              result[agg.name] = values.reduce((sum, val) => sum + val, 0);
            } else if (agg.function === 'AVG') {
              result[agg.name] = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
            } else if (agg.function === 'COUNT') {
              result[agg.name] = rows.length;
            } else if (agg.function === 'MIN') {
              result[agg.name] = Math.min(...values);
            } else if (agg.function === 'MAX') {
              result[agg.name] = Math.max(...values);
            }
          }
        });
        
        return result;
      });

      console.log('[Control Center] After grouping/aggregation:', finalResults.length, 'rows');
    }

    // Extract column names from first row
    const columns = finalResults.length > 0 ? Object.keys(finalResults[0]) : [];

    return c.json({
      success: true,
      data: finalResults.slice(0, 1000), // Limit to 1000 rows
      columns: columns
    });

  } catch (error) {
    console.error("[Control Center] Error generating report:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ============================================================================
// ADMIN ENDPOINTS - MIGRATION
// ============================================================================

/**
 * Test migration - verify team members exist for all service types
 * GET /admin/test-migration
 */
app.get("/make-server-c142e950/admin/test-migration", async (c) => {
  try {
    console.log("🧪 Testing migration prerequisites...");

    const serviceTypes = ["Forwarding", "Brokerage", "Trucking", "Marine Insurance", "Others"];
    const results = [];

    for (const serviceType of serviceTypes) {
      // Fetch all users [RELATIONAL]
      const { data: uRowsMig } = await db.from("users").select("*");
      const allUsers = uRowsMig || [];
      
      const manager = allUsers.find(
        (u: any) => u.department === "Operations" && 
                   u.service_type === serviceType && 
                   u.operations_role === "Manager"
      );

      const supervisors = allUsers.filter(
        (u: any) => u.department === "Operations" && 
                   u.service_type === serviceType && 
                   u.operations_role === "Supervisor"
      );

      const handlers = allUsers.filter(
        (u: any) => u.department === "Operations" && 
                   u.service_type === serviceType && 
                   u.operations_role === "Handler"
      );

      results.push({
        serviceType,
        manager: manager ? manager.name : null,
        supervisorCount: supervisors.length,
        handlerCount: handlers.length,
        ready: !!manager && supervisors.length > 0 && handlers.length > 0,
      });
    }

    const allReady = results.every(r => r.ready);

    return c.json({
      success: true,
      ready: allReady,
      results,
      message: allReady 
        ? "✅ All service types have complete teams. Ready to migrate!" 
        : "⚠️ Some service types are missing team members. Please create users first.",
    });
  } catch (error) {
    console.error("Error testing migration:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

/**
 * Migrate booking assignments - assign default teams to existing bookings
 * POST /admin/migrate-booking-assignments
 */
app.post("/make-server-c142e950/admin/migrate-booking-assignments", async (c) => {
  try {
    console.log("🚀 Starting booking assignments migration...\n");

    const serviceConfigs = [
      { name: "Forwarding", prefix: "forwarding-booking:" },
      { name: "Brokerage", prefix: "brokerage-booking:" },
      { name: "Trucking", prefix: "trucking-booking:" },
      { name: "Marine Insurance", prefix: "marine-insurance-booking:" },
      { name: "Others", prefix: "others-booking:" },
    ];

    const migrationResults = [];
    let totalMigrated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const config of serviceConfigs) {
      console.log(`\n🔄 Migrating ${config.name} bookings...`);

      // Get default team for this service type [RELATIONAL]
      const { data: uRowsMig2 } = await db.from("users").select("*");
      const allUsers = uRowsMig2 || [];
      
      const manager = allUsers.find(
        (u: any) => u.department === "Operations" && 
                   u.service_type === config.name && 
                   u.operations_role === "Manager"
      );

      const supervisor = allUsers.find(
        (u: any) => u.department === "Operations" && 
                   u.service_type === config.name && 
                   u.operations_role === "Supervisor"
      );

      const handler = allUsers.find(
        (u: any) => u.department === "Operations" && 
                   u.service_type === config.name && 
                   u.operations_role === "Handler"
      );

      if (!manager || !supervisor || !handler) {
        const missingRoles = [];
        if (!manager) missingRoles.push("Manager");
        if (!supervisor) missingRoles.push("Supervisor");
        if (!handler) missingRoles.push("Handler");
        
        const error = `Missing team members for ${config.name}: ${missingRoles.join(", ")}`;
        console.error(`❌ ${error}`);
        
        migrationResults.push({
          serviceType: config.name,
          success: false,
          error,
          migrated: 0,
          skipped: 0,
        });
        
        totalErrors++;
        continue;
      }

      // Get all bookings for this service type [RELATIONAL]
      const { data: bkRows } = await db.from("bookings").select("*").eq("service_type", config.name.toLowerCase().replace(/ /g, '_'));
      const bookings = (bkRows || []).map((r: any) => mergeFromRow(r));
      let migrated = 0;
      let skipped = 0;

      console.log(`📊 Found ${bookings.length} ${config.name} bookings`);

      for (const booking of bookings) {
        try {
          // Skip if already has assignments
          if (booking.assigned_manager_id && booking.assigned_supervisor_id && booking.assigned_handler_id) {
            skipped++;
            continue;
          }

          // Update booking with team assignments
          const updatedBooking = {
            ...booking,
            assigned_manager_id: manager.id,
            assigned_manager_name: manager.name,
            assigned_supervisor_id: supervisor.id,
            assigned_supervisor_name: supervisor.name,
            assigned_handler_id: handler.id,
            assigned_handler_name: handler.name,
            updatedAt: new Date().toISOString(),
          };

          await saveBooking(updatedBooking);
          migrated++;
          console.log(`  ✅ Migrated ${booking.bookingId}`);
        } catch (error) {
          console.error(`  ❌ Error migrating ${booking.bookingId}:`, error);
          totalErrors++;
        }
      }

      console.log(`✅ ${config.name}: Migrated ${migrated}/${bookings.length} bookings (${skipped} already had assignments)`);

      migrationResults.push({
        serviceType: config.name,
        success: true,
        total: bookings.length,
        migrated,
        skipped,
      });

      totalMigrated += migrated;
      totalSkipped += skipped;
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`Successfully migrated:      ${totalMigrated}`);
    console.log(`Already had assignments:    ${totalSkipped}`);
    console.log(`Errors:                     ${totalErrors}`);
    console.log("=".repeat(60));

    const overallSuccess = totalErrors === 0;

    if (overallSuccess) {
      console.log("\n✅ Migration completed successfully!");
    } else {
      console.log("\n⚠️  Migration completed with errors. Please review the logs.");
    }

    return c.json({
      success: overallSuccess,
      summary: {
        totalMigrated,
        totalSkipped,
        totalErrors,
      },
      details: migrationResults,
    });
  } catch (error) {
    console.error("Error in migration:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== INQUIRY/QUOTATION/PROJECT COMMENTS API ====================

// Get comments for an inquiry (also works for quotations and projects via shared inquiry_id)
app.get("/make-server-c142e950/comments", async (c) => {
  try {
    const inquiry_id = c.req.query("inquiry_id");
    
    if (!inquiry_id) {
      return c.json({ success: false, error: "inquiry_id parameter required" }, 400);
    }
    
    // Get all comments for this inquiry
    const { data: commentRows } = await db.from("comments").select("*").eq("entity_type", "inquiry").eq("entity_id", inquiry_id);
    const comments = commentRows || [];
    
    // Sort by created_at ascending (oldest first)
    comments.sort((a: any, b: any) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    console.log(`Fetched ${comments.length} comments for inquiry ${inquiry_id}`);
    
    return c.json({ success: true, data: comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Upload file attachment for comment
app.post("/make-server-c142e950/comments/upload", async (c) => {
  try {
    // Check if Supabase storage is available
    if (!supabase) {
      return c.json({ success: false, error: "File storage is not configured" }, 503);
    }
    
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const inquiry_id = formData.get("inquiry_id") as string;
    
    if (!file) {
      return c.json({ success: false, error: "No file provided" }, 400);
    }
    
    if (!inquiry_id) {
      return c.json({ success: false, error: "inquiry_id required" }, 400);
    }
    
    // Check file size (50MB limit)
    if (file.size > 52428800) {
      return c.json({ success: false, error: "File size exceeds 50MB limit" }, 400);
    }
    
    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${inquiry_id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(COMMENT_ATTACHMENTS_BUCKET)
      .upload(fileName, uint8Array, {
        contentType: file.type,
        upsert: false,
      });
    
    if (error) {
      console.error("Error uploading file:", error);
      return c.json({ success: false, error: `Upload failed: ${error.message}` }, 500);
    }
    
    // Generate signed URL (valid for 1 year)
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from(COMMENT_ATTACHMENTS_BUCKET)
      .createSignedUrl(fileName, 31536000); // 1 year in seconds
    
    if (urlError) {
      console.error("Error creating signed URL:", urlError);
      return c.json({ success: false, error: "Failed to create download URL" }, 500);
    }
    
    console.log(`Uploaded file ${file.name} (${file.size} bytes) for inquiry ${inquiry_id}`);
    
    return c.json({ 
      success: true, 
      data: {
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_path: fileName,
        file_url: signedUrlData.signedUrl,
      }
    });
  } catch (error) {
    console.error("Error in file upload:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Add comment to inquiry/quotation/project (with optional file attachments)
app.post("/make-server-c142e950/comments", async (c) => {
  try {
    const { inquiry_id, user_id, user_name, department, message, attachments } = await c.req.json();
    
    // Validate required fields
    if (!inquiry_id || !user_id || !user_name || !department) {
      return c.json({ 
        success: false, 
        error: "Missing required fields: inquiry_id, user_id, user_name, department" 
      }, 400);
    }
    
    // Validate that either message or attachments exist
    if (!message?.trim() && (!attachments || attachments.length === 0)) {
      return c.json({ success: false, error: "Either message or attachments must be provided" }, 400);
    }
    
    const now = new Date().toISOString();
    const commentId = `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const comment = {
      id: commentId,
      inquiry_id,
      user_id,
      user_name,
      department,
      message: message?.trim() || "",
      attachments: attachments || [], // Array of { file_name, file_size, file_type, file_url }
      created_at: now,
    };
    
    await db.from("comments").insert({ ...comment, entity_type: "inquiry", entity_id: inquiry_id });
    
    const attachmentInfo = attachments && attachments.length > 0 
      ? ` with ${attachments.length} attachment(s)` 
      : "";
    console.log(`Added comment ${commentId} to inquiry ${inquiry_id} by ${user_name} (${department})${attachmentInfo}`);
    
    return c.json({ success: true, data: comment });
  } catch (error) {
    console.error("Error adding comment:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== BOOKING COMMENTS API ====================

// Get comments for a booking
app.get("/make-server-c142e950/bookings/:booking_id/comments", async (c) => {
  try {
    const booking_id = c.req.param("booking_id");
    
    if (!booking_id) {
      return c.json({ success: false, error: "booking_id parameter required" }, 400);
    }
    
    // Get all comments for this booking
    const { data: bkCommentRows } = await db.from("comments").select("*").eq("entity_type", "booking").eq("entity_id", booking_id);
    const comments = bkCommentRows || [];
    
    // Sort comments by created_at (most recent first)
    const sortedComments = comments.sort((a: any, b: any) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    console.log(`Fetched ${comments.length} comments for booking ${booking_id}`);
    
    return c.json({ success: true, data: sortedComments });
  } catch (error) {
    console.error("Error fetching booking comments:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Upload file attachment for booking comment
app.post("/make-server-c142e950/bookings/comments/upload", async (c) => {
  try {
    // Check if Supabase storage is available
    if (!supabase) {
      return c.json({ success: false, error: "File storage is not configured" }, 503);
    }
    
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const booking_id = formData.get("booking_id") as string;
    
    if (!file || !booking_id) {
      return c.json({ success: false, error: "Missing file or booking_id" }, 400);
    }
    
    // Generate unique file name
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomId}.${fileExt}`;
    const filePath = `bookings/${booking_id}/${fileName}`;
    
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(COMMENT_ATTACHMENTS_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });
    
    if (uploadError) {
      console.error("Error uploading file to storage:", uploadError);
      return c.json({ success: false, error: `Storage upload failed: ${uploadError.message}` }, 500);
    }
    
    // Get signed URL (valid for 1 year)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(COMMENT_ATTACHMENTS_BUCKET)
      .createSignedUrl(filePath, 31536000); // 1 year in seconds
    
    if (signedUrlError) {
      console.error("Error creating signed URL:", signedUrlError);
      return c.json({ success: false, error: `Failed to create signed URL: ${signedUrlError.message}` }, 500);
    }
    
    console.log(`Uploaded file ${file.name} for booking ${booking_id}`);
    
    return c.json({
      success: true,
      data: {
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_url: signedUrlData.signedUrl,
      }
    });
  } catch (error) {
    console.error("Error in booking comment file upload:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Add comment to booking (with optional file attachments)
app.post("/make-server-c142e950/bookings/:booking_id/comments", async (c) => {
  try {
    const booking_id = c.req.param("booking_id");
    const { user_id, user_name, department, message, attachments } = await c.req.json();
    
    // Validate required fields
    if (!booking_id || !user_id || !user_name || !department) {
      return c.json({ 
        success: false, 
        error: "Missing required fields: booking_id, user_id, user_name, department" 
      }, 400);
    }
    
    // Validate that either message or attachments exist
    if (!message?.trim() && (!attachments || attachments.length === 0)) {
      return c.json({ success: false, error: "Either message or attachments must be provided" }, 400);
    }
    
    const now = new Date().toISOString();
    const commentId = `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const comment = {
      id: commentId,
      booking_id,
      user_id,
      user_name,
      department,
      message: message?.trim() || "",
      attachments: attachments || [], // Array of { file_name, file_size, file_type, file_url }
      created_at: now,
    };
    
    // Store comment using dual-key pattern: booking_comment:{booking_id}:{comment_id}
    await db.from("comments").insert({ ...comment, entity_type: "booking", entity_id: booking_id });
    
    const attachmentInfo = attachments && attachments.length > 0 
      ? ` with ${attachments.length} attachment(s)` 
      : "";
    console.log(`Added comment ${commentId} to booking ${booking_id} by ${user_name} (${department})${attachmentInfo}`);
    
    return c.json({ success: true, data: comment });
  } catch (error) {
    console.error("Error adding booking comment:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== PROJECT ATTACHMENTS API ====================

const PROJECT_ATTACHMENTS_BUCKET = "make-c142e950-project-attachments";

// Initialize project attachments bucket
if (supabase) {
  (async () => {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some((bucket: any) => bucket.name === PROJECT_ATTACHMENTS_BUCKET);
      
      if (!bucketExists) {
        const { error } = await supabase.storage.createBucket(PROJECT_ATTACHMENTS_BUCKET, {
          public: false,
          fileSizeLimit: 52428800, // 50MB limit
        });
        
        if (error) {
          // Ignore "already exists" error (409)
          if ((error as any).statusCode === "409" || error.message?.includes("already exists")) {
            console.log("✅ Project attachments bucket already exists (caught error):", PROJECT_ATTACHMENTS_BUCKET);
          } else {
            console.error("Error creating project attachments bucket:", error);
          }
        } else {
          console.log("✅ Created project attachments bucket:", PROJECT_ATTACHMENTS_BUCKET);
        }
      } else {
        console.log("✅ Project attachments bucket already exists:", PROJECT_ATTACHMENTS_BUCKET);
      }
    } catch (error) {
      console.error("Error initializing project attachments bucket:", error);
    }
  })();
}

// Get all attachments for a project
app.get("/make-server-c142e950/projects/:id/attachments", async (c) => {
  try {
    const projectId = c.req.param("id");
    
    // Get all attachments for this project
    const { data: attRows } = await db.from("attachments").select("*").eq("entity_type", "project").eq("entity_id", projectId);
    const allAttachments = attRows || [];
    
    // Sort by upload date (newest first)
    const sortedAttachments = allAttachments.sort((a: any, b: any) => 
      new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    );
    
    return c.json({ success: true, data: sortedAttachments });
  } catch (error) {
    console.error("Error fetching project attachments:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Upload attachment to project
app.post("/make-server-c142e950/projects/:id/attachments", async (c) => {
  try {
    const projectId = c.req.param("id");
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const uploadedBy = formData.get("uploaded_by") as string;
    
    if (!file) {
      return c.json({ success: false, error: "No file provided" }, 400);
    }
    
    if (!supabase) {
      return c.json({ success: false, error: "Storage not configured" }, 500);
    }
    
    // Generate unique file name
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const fileExtension = file.name.split(".").pop();
    const storagePath = `${projectId}/${timestamp}-${randomId}.${fileExtension}`;
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(PROJECT_ATTACHMENTS_BUCKET)
      .upload(storagePath, uint8Array, {
        contentType: file.type,
        upsert: false,
      });
    
    if (uploadError) {
      console.error("Error uploading file to storage:", uploadError);
      return c.json({ success: false, error: uploadError.message }, 500);
    }
    
    // Generate signed URL (valid for 1 year)
    const { data: urlData, error: urlError } = await supabase.storage
      .from(PROJECT_ATTACHMENTS_BUCKET)
      .createSignedUrl(storagePath, 31536000); // 1 year in seconds
    
    if (urlError || !urlData) {
      console.error("Error generating signed URL:", urlError);
      return c.json({ success: false, error: "Failed to generate file URL" }, 500);
    }
    
    // Save attachment metadata to KV store
    const attachmentId = `${timestamp}-${randomId}`;
    const attachment = {
      id: attachmentId,
      project_id: projectId,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      file_url: urlData.signedUrl,
      storage_path: storagePath,
      uploaded_by: uploadedBy || "Unknown",
      uploaded_at: new Date().toISOString(),
    };
    
    await db.from("attachments").insert({ ...attachment, entity_type: "project", entity_id: projectId });
    
    console.log(`✅ Uploaded attachment ${file.name} to project ${projectId}`);
    
    return c.json({ success: true, data: attachment });
  } catch (error) {
    console.error("Error uploading project attachment:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete attachment from project
app.delete("/make-server-c142e950/projects/:id/attachments/:attachmentId", async (c) => {
  try {
    const projectId = c.req.param("id");
    const attachmentId = c.req.param("attachmentId");
    
    // Get attachment metadata
    const { data: attachment } = await db.from("attachments").select("*").eq("id", attachmentId).eq("entity_type", "project").eq("entity_id", projectId).maybeSingle();
    
    if (!attachment) {
      return c.json({ success: false, error: "Attachment not found" }, 404);
    }
    
    if (!supabase) {
      return c.json({ success: false, error: "Storage not configured" }, 500);
    }
    
    // Delete from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from(PROJECT_ATTACHMENTS_BUCKET)
      .remove([attachment.storage_path]);
    
    if (deleteError) {
      console.error("Error deleting file from storage:", deleteError);
      // Continue with metadata deletion even if storage delete fails
    }
    
    // Delete metadata from KV store
    await db.from("attachments").delete().eq("id", attachmentId).eq("entity_type", "project").eq("entity_id", projectId);
    
    console.log(`✅ Deleted attachment ${attachment.file_name} from project ${projectId}`);
    
    return c.json({ success: true, message: "Attachment deleted successfully" });
  } catch (error) {
    console.error("Error deleting project attachment:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== CONTRACT ATTACHMENTS API ====================
// Mirrors the Project Attachments pattern above.
// Uses the same storage bucket but separate KV prefix: contract_attachment:{id}:{attachmentId}

// Get all attachments for a contract
app.get("/make-server-c142e950/contracts/:id/attachments", async (c) => {
  try {
    const contractId = c.req.param("id");
    
    const { data: cAttRows } = await db.from("attachments").select("*").eq("entity_type", "contract").eq("entity_id", contractId);
    const allAttachments = cAttRows || [];
    
    const sortedAttachments = allAttachments.sort((a: any, b: any) => 
      new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    );
    
    return c.json({ success: true, data: sortedAttachments });
  } catch (error) {
    console.error("Error fetching contract attachments:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Upload attachment to contract
app.post("/make-server-c142e950/contracts/:id/attachments", async (c) => {
  try {
    const contractId = c.req.param("id");
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const uploadedBy = formData.get("uploaded_by") as string;
    
    if (!file) {
      return c.json({ success: false, error: "No file provided" }, 400);
    }
    
    if (!supabase) {
      return c.json({ success: false, error: "Storage not configured" }, 500);
    }
    
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const fileExtension = file.name.split(".").pop();
    const storagePath = `contracts/${contractId}/${timestamp}-${randomId}.${fileExtension}`;
    
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    const { error: uploadError } = await supabase.storage
      .from(PROJECT_ATTACHMENTS_BUCKET)
      .upload(storagePath, uint8Array, {
        contentType: file.type,
        upsert: false,
      });
    
    if (uploadError) {
      console.error("Error uploading contract attachment to storage:", uploadError);
      return c.json({ success: false, error: uploadError.message }, 500);
    }
    
    const { data: urlData, error: urlError } = await supabase.storage
      .from(PROJECT_ATTACHMENTS_BUCKET)
      .createSignedUrl(storagePath, 31536000);
    
    if (urlError || !urlData) {
      console.error("Error generating signed URL for contract attachment:", urlError);
      return c.json({ success: false, error: "Failed to generate file URL" }, 500);
    }
    
    const attachmentId = `${timestamp}-${randomId}`;
    const attachment = {
      id: attachmentId,
      contract_id: contractId,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      file_url: urlData.signedUrl,
      storage_path: storagePath,
      uploaded_by: uploadedBy || "Unknown",
      uploaded_at: new Date().toISOString(),
    };
    
    await db.from("attachments").insert({ ...attachment, entity_type: "contract", entity_id: contractId });
    
    console.log(`✅ Uploaded attachment ${file.name} to contract ${contractId}`);
    
    return c.json({ success: true, data: attachment });
  } catch (error) {
    console.error("Error uploading contract attachment:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete attachment from contract
app.delete("/make-server-c142e950/contracts/:id/attachments/:attachmentId", async (c) => {
  try {
    const contractId = c.req.param("id");
    const attachmentId = c.req.param("attachmentId");
    
    const { data: attachment } = await db.from("attachments").select("*").eq("id", attachmentId).eq("entity_type", "contract").eq("entity_id", contractId).maybeSingle();
    
    if (!attachment) {
      return c.json({ success: false, error: "Attachment not found" }, 404);
    }
    
    if (!supabase) {
      return c.json({ success: false, error: "Storage not configured" }, 500);
    }
    
    const { error: deleteError } = await supabase.storage
      .from(PROJECT_ATTACHMENTS_BUCKET)
      .remove([attachment.storage_path]);
    
    if (deleteError) {
      console.error("Error deleting contract attachment from storage:", deleteError);
    }
    
    await db.from("attachments").delete().eq("id", attachmentId).eq("entity_type", "contract").eq("entity_id", contractId);
    
    console.log(`✅ Deleted attachment ${attachment.file_name} from contract ${contractId}`);
    
    return c.json({ success: true, message: "Attachment deleted successfully" });
  } catch (error) {
    console.error("Error deleting contract attachment:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== VENDOR LINE ITEMS API ====================

// Get vendor line items
app.get("/make-server-c142e950/vendors/:vendorId/line-items", async (c) => {
  try {
    const vendorId = c.req.param("vendorId");
    const key = `vendor_line_items:${vendorId}`;
    
    const { data: row } = await db.from("counters").select("value").eq("key", key).maybeSingle();
    if (row?.value) {
      const lineItems = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
      return c.json({ success: true, data: lineItems });
    }
    return c.json({ success: true, data: null });
  } catch (error) {
    console.error(`Error retrieving line items for vendor:`, error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Save all vendor line items (bulk replace)
app.post("/make-server-c142e950/vendors/:vendorId/line-items", async (c) => {
  try {
    const vendorId = c.req.param("vendorId");
    const body = await c.req.json();
    const lineItems = body.line_items;
    
    if (!Array.isArray(lineItems)) {
      return c.json({ success: false, error: "line_items must be an array" }, 400);
    }
    
    const key = `vendor_line_items:${vendorId}`;
    await db.from("counters").upsert({ key, value: lineItems }, { onConflict: "key" });
    
    console.log(`✅ Saved ${lineItems.length} line items for vendor ${vendorId}`);
    return c.json({ success: true, message: "Line items saved successfully", data: lineItems });
  } catch (error) {
    console.error(`Error saving line items for vendor:`, error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update a single line item
app.put("/make-server-c142e950/vendors/:vendorId/line-items/:itemId", async (c) => {
  try {
    const vendorId = c.req.param("vendorId");
    const itemId = c.req.param("itemId");
    const body = await c.req.json();
    const updatedItem = body.line_item;
    
    if (!updatedItem) {
      return c.json({ success: false, error: "line_item is required" }, 400);
    }
    
    const key = `vendor_line_items:${vendorId}`;
    const { data: liRow } = await db.from("counters").select("value").eq("key", key).maybeSingle();
    const lineItems = (liRow?.value ? (typeof liRow.value === 'string' ? JSON.parse(liRow.value) : liRow.value) : []) as any[];
    const itemIndex = lineItems.findIndex((item: any) => item.id === itemId);
    if (itemIndex === -1) return c.json({ success: false, error: "Line item not found" }, 404);
    lineItems[itemIndex] = updatedItem;
    await db.from("counters").upsert({ key, value: lineItems }, { onConflict: "key" });
    
    console.log(`✅ Updated line item ${itemId} for vendor ${vendorId}`);
    return c.json({ success: true, message: "Line item updated successfully", data: updatedItem });
  } catch (error) {
    console.error(`Error updating line item:`, error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete a line item
app.delete("/make-server-c142e950/vendors/:vendorId/line-items/:itemId", async (c) => {
  try {
    const vendorId = c.req.param("vendorId");
    const itemId = c.req.param("itemId");
    
    const key = `vendor_line_items:${vendorId}`;
    const { data: liRow2 } = await db.from("counters").select("value").eq("key", key).maybeSingle();
    const lineItems = (liRow2?.value ? (typeof liRow2.value === 'string' ? JSON.parse(liRow2.value) : liRow2.value) : []) as any[];
    const filteredItems = lineItems.filter((item: any) => item.id !== itemId);
    if (filteredItems.length === lineItems.length) return c.json({ success: false, error: "Line item not found" }, 404);
    await db.from("counters").upsert({ key, value: filteredItems }, { onConflict: "key" });
    
    console.log(`✅ Deleted line item ${itemId} from vendor ${vendorId}`);
    return c.json({ success: true, message: "Line item deleted successfully" });
  } catch (error) {
    console.error(`Error deleting line item:`, error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== VENDOR CHARGE CATEGORIES API (NEW FORMAT) ====================

// Get vendor charge categories (NEW FORMAT - Phase 3)
app.get("/make-server-c142e950/vendors/:vendorId/charge-categories", async (c) => {
  try {
    const vendorId = c.req.param("vendorId");
    const key = `vendor_charge_categories:${vendorId}`;
    
    const { data: ccRow } = await db.from("counters").select("value").eq("key", key).maybeSingle();
    if (ccRow?.value) {
      const chargeCategories = typeof ccRow.value === 'string' ? JSON.parse(ccRow.value) : ccRow.value;
      return c.json({ success: true, data: chargeCategories });
    }
    return c.json({ success: true, data: null });
  } catch (error) {
    console.error(`Error retrieving charge categories for vendor:`, error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Save all vendor charge categories (bulk replace)
app.post("/make-server-c142e950/vendors/:vendorId/charge-categories", async (c) => {
  try {
    const vendorId = c.req.param("vendorId");
    const body = await c.req.json();
    const chargeCategories = body.charge_categories;
    
    if (!Array.isArray(chargeCategories)) {
      return c.json({ success: false, error: "charge_categories must be an array" }, 400);
    }
    
    const key = `vendor_charge_categories:${vendorId}`;
    await db.from("counters").upsert({ key, value: chargeCategories }, { onConflict: "key" });
    
    console.log(`✅ Saved ${chargeCategories.length} charge categories for vendor ${vendorId}`);
    return c.json({ success: true, message: "Charge categories saved successfully", data: chargeCategories });
  } catch (error) {
    console.error(`Error saving charge categories for vendor:`, error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== ACCOUNTING - CHART OF ACCOUNTS API ====================

// DEPRECATED: Use newAccounting.getAccounts() instead
// app.get("/make-server-c142e950/accounts", async (c) => ...

// Get single account
app.get("/make-server-c142e950/accounts/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { data: account } = await db.from("accounts").select("*").eq("id", id).maybeSingle();
    
    if (!account) {
      return c.json({ success: false, error: "Account not found" }, 404);
    }
    
    return c.json({ success: true, data: account });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Create account
app.post("/make-server-c142e950/accounts", async (c) => {
  try {
    const data = await c.req.json();
    
    // Check for duplicate code
    const { data: dupCheck } = await db.from("accounts").select("id").eq("code", data.code).maybeSingle();
    if (dupCheck) {
      return c.json({ success: false, error: "Account code already exists" }, 400);
    }

    const id = `ACC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const account = {
      ...data,
      id,
      balance: 0, // Initial balance is 0
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    await db.from("accounts").insert(account);
    console.log(`Created account: ${account.code} - ${account.name}`);
    
    return c.json({ success: true, data: account });
  } catch (error) {
    console.error("Error creating account:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update account
app.patch("/make-server-c142e950/accounts/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    
    const { data: existing } = await db.from("accounts").select("*").eq("id", id).maybeSingle();
    if (!existing) return c.json({ success: false, error: "Account not found" }, 404);
    if (existing.is_system && (updates.code !== existing.code || updates.type !== existing.type)) {
       // Allow it for now but log warning
       console.warn(`System account ${existing.code} modified`);
    }

    const updated = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      updated_at: new Date().toISOString(),
    };
    
    await db.from("accounts").update(updated).eq("id", id);
    console.log(`Updated account: ${id}`);
    
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating account:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete account
app.delete("/make-server-c142e950/accounts/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const { data: existing } = await db.from("accounts").select("*").eq("id", id).maybeSingle();
    if (!existing) return c.json({ success: false, error: "Account not found" }, 404);
    if (existing.is_system) return c.json({ success: false, error: "Cannot delete system account" }, 400);
    await db.from("accounts").delete().eq("id", id);
    
    console.log(`Deleted account: ${id}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Seed default accounts
app.post("/make-server-c142e950/accounts/seed", async (c) => {
  try {
    // Check if accounts exist
    const { data: existingAccts } = await db.from("accounts").select("id");
    if (existingAccts && existingAccts.length > 0) {
      return c.json({ success: true, message: "Accounts already seeded", count: existingAccts.length });
    }

    const defaults = [
      { code: "1000", name: "Cash on Hand", type: "Asset", subtype: "Cash", is_system: true },
      { code: "1010", name: "Cash in Bank - BDO", type: "Asset", subtype: "Bank", is_system: false },
      { code: "1020", name: "Cash in Bank - BPI", type: "Asset", subtype: "Bank", is_system: false },
      { code: "1200", name: "Accounts Receivable", type: "Asset", subtype: "Accounts Receivable", is_system: true },
      { code: "1210", name: "Undeposited Funds", type: "Asset", subtype: "Other Current Asset", is_system: true },
      { code: "1500", name: "Inventory Asset", type: "Asset", subtype: "Inventory", is_system: false },
      
      { code: "2000", name: "Accounts Payable", type: "Liability", subtype: "Accounts Payable", is_system: true },
      { code: "2100", name: "VAT Payable", type: "Liability", subtype: "Other Current Liability", is_system: true },
      
      { code: "3000", name: "Opening Balance Equity", type: "Equity", subtype: "Equity", is_system: true },
      { code: "3900", name: "Retained Earnings", type: "Equity", subtype: "Retained Earnings", is_system: true },
      
      { code: "4000", name: "Service Income", type: "Income", subtype: "Service Income", is_system: false },
      { code: "4100", name: "Freight Income", type: "Income", subtype: "Service Income", is_system: false },
      
      { code: "5000", name: "Cost of Goods Sold", type: "Expense", subtype: "Cost of Goods Sold", is_system: false },
      { code: "5100", name: "Freight Expense", type: "Expense", subtype: "Cost of Goods Sold", is_system: false },
      
      { code: "6000", name: "Advertising", type: "Expense", subtype: "Expense", is_system: false },
      { code: "6100", name: "Bank Service Charges", type: "Expense", subtype: "Expense", is_system: false },
      { code: "6200", name: "Office Supplies", type: "Expense", subtype: "Expense", is_system: false },
      { code: "6300", name: "Rent Expense", type: "Expense", subtype: "Expense", is_system: false },
      { code: "6400", name: "Salaries & Wages", type: "Expense", subtype: "Expense", is_system: false },
    ];
    
    const created = [];
    for (const def of defaults) {
       const id = `ACC-SEED-${def.code}`;
       const acc = { 
         ...def, 
         id, 
         balance: 0, 
         is_active: true, 
         created_at: new Date().toISOString(), 
         updated_at: new Date().toISOString() 
       };
       await db.from("accounts").upsert(acc, { onConflict: "id" });
       created.push(acc);
    }
    
    return c.json({ success: true, message: "Seeded default accounts", data: created });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Route handling for Accounting Module
app.get("/make-server-c142e950/expenses", accountingHandlers.getExpenses);
app.get("/make-server-c142e950/expenses/:id", accountingHandlers.getExpenseById);
app.delete("/make-server-c142e950/expenses/:id", accountingHandlers.deleteExpense);

app.get("/make-server-c142e950/collections", accountingHandlers.getCollections);
app.get("/make-server-c142e950/collections/:id", accountingHandlers.getCollectionById);
app.post("/make-server-c142e950/evouchers/:id/post-to-collections", accountingHandlers.postEVoucherToCollections);
app.delete("/make-server-c142e950/collections/:id", accountingHandlers.deleteCollection);

app.get("/make-server-c142e950/billings", accountingHandlers.getBillings);
app.get("/make-server-c142e950/billings/:id", accountingHandlers.getBillingById);
// Dead route removed: postEVoucherToBillings (handler never existed — see Invoice Ledger Integration Blueprint Phase 3)
app.patch("/make-server-c142e950/billings/:id/payment", accountingHandlers.updateBillingPayment);
app.delete("/make-server-c142e950/billings/:id", accountingHandlers.deleteBilling);
app.post("/make-server-c142e950/statements/:ref/finalize", accountingHandlers.finalizeStatement);

app.post("/make-server-c142e950/journal-entries", accountingHandlers.createJournalEntry);
app.post("/make-server-c142e950/evouchers/:id/post-to-ledger", accountingHandlers.postEVoucherToLedger);


// ==================== NEW ACCOUNTING MODULE API (Refactored) ====================
// Uses accounting-handlers.tsx for better filtering (Project Number, etc.)

// Billings
app.get("/make-server-c142e950/accounting/billings", accountingHandlers.getBillings);
app.get("/make-server-c142e950/accounting/billings/:id", accountingHandlers.getBillingById);

// Expenses
app.get("/make-server-c142e950/accounting/expenses", accountingHandlers.getExpenses);
app.get("/make-server-c142e950/accounting/expenses/:id", accountingHandlers.getExpenseById);
app.delete("/make-server-c142e950/accounting/expenses/:id", accountingHandlers.deleteExpense);

// Collections
app.get("/make-server-c142e950/accounting/collections", accountingHandlers.getCollections);
app.get("/make-server-c142e950/accounting/collections/:id", accountingHandlers.getCollectionById);
app.delete("/make-server-c142e950/accounting/collections/:id", accountingHandlers.deleteCollection);

// Journal Entries
app.post("/make-server-c142e950/accounting/journal-entries", accountingHandlers.createJournalEntry);

// Posting Actions
app.post("/make-server-c142e950/accounting/evouchers/:id/post-to-ledger", accountingHandlers.postEVoucherToLedger);
app.post("/make-server-c142e950/accounting/evouchers/:id/post-to-collections", accountingHandlers.postEVoucherToCollections);

// ==================== NETWORK PARTNERS API ====================

// Get all partners (optionally filter by type, country, service)
app.get("/make-server-c142e950/partners", async (c) => {
  try {
    const type = c.req.query("type");
    const country = c.req.query("country");
    const service = c.req.query("service");
    const search = c.req.query("search");
    
    const { data: partnerRows } = await db.from("network_partners").select("*");
    let partners = partnerRows || [];
    
    // Apply filters
    if (type && type !== "all") {
      partners = partners.filter((p: any) => p.partner_type === type);
    }
    
    if (country) {
      partners = partners.filter((p: any) => p.country === country);
    }
    
    if (service) {
      partners = partners.filter((p: any) => p.services && p.services.includes(service));
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      partners = partners.filter((p: any) => 
        p.company_name?.toLowerCase().includes(searchLower) ||
        p.contact_person?.toLowerCase().includes(searchLower) ||
        p.emails?.some((e: string) => e.toLowerCase().includes(searchLower)) ||
        p.id?.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by company name
    partners.sort((a: any, b: any) => a.company_name.localeCompare(b.company_name));
    
    console.log(`Fetched ${partners.length} partners`);
    
    return c.json({ success: true, data: partners });
  } catch (error) {
    console.error("Error fetching partners:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get single partner by ID
app.get("/make-server-c142e950/partners/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { data: partner } = await db.from("network_partners").select("*").eq("id", id).maybeSingle();
    if (!partner) return c.json({ success: false, error: "Partner not found" }, 404);
    return c.json({ success: true, data: partner });
  } catch (error) {
    console.error("Error fetching partner:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Create partner
app.post("/make-server-c142e950/partners", async (c) => {
  try {
    const data = await c.req.json();
    
    // Generate partner ID (or use provided one if migrating)
    const id = data.id || `np-${Date.now()}`;
    
    const partner = {
      ...data,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    await db.from("network_partners").insert(partner);
    console.log(`Created partner: ${id} - ${partner.company_name}`);
    
    return c.json({ success: true, data: partner });
  } catch (error) {
    console.error("Error creating partner:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update partner
app.put("/make-server-c142e950/partners/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await c.req.json();
    
    const { data: existing } = await db.from("network_partners").select("*").eq("id", id).maybeSingle();
    if (!existing) return c.json({ success: false, error: "Partner not found" }, 404);
    const partner = { ...existing, ...data, id, updated_at: new Date().toISOString() };
    await db.from("network_partners").update(partner).eq("id", id);
    
    console.log(`Updated partner: ${id}`);
    
    return c.json({ success: true, data: partner });
  } catch (error) {
    console.error("Error updating partner:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete partner
app.delete("/make-server-c142e950/partners/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    await db.from("network_partners").delete().eq("id", id);
    console.log(`Deleted partner: ${id}`);
    
    return c.json({ success: true, message: "Partner deleted successfully" });
  } catch (error) {
    console.error("Error deleting partner:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Seed partners (bulk create)
app.post("/make-server-c142e950/partners/seed", async (c) => {
  try {
    const partners = await c.req.json();
    
    if (!Array.isArray(partners)) {
      return c.json({ success: false, error: "Expected array of partners" }, 400);
    }
    
    let count = 0;
    for (const p of partners) {
      await db.from("network_partners").upsert(p, { onConflict: "id" });
      count++;
    }
    
    console.log(`Seeded ${count} partners`);
    
    return c.json({ success: true, count, message: `Successfully seeded ${count} partners` });
  } catch (error) {
    console.error("Error seeding partners:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get charge categories for a partner
app.get("/make-server-c142e950/vendors/:id/charge-categories", async (c) => {
  try {
    const id = c.req.param("id");
    
    const { data: partner } = await db.from("network_partners").select("*").eq("id", id).maybeSingle();
    if (partner) return c.json({ success: true, data: partner.charge_categories || [] });
    return c.json({ success: false, error: "Partner/Vendor not found" }, 404);
  } catch (error) {
    console.error("Error fetching partner charge categories:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Save charge categories for a partner
app.post("/make-server-c142e950/vendors/:id/charge-categories", async (c) => {
  try {
    const id = c.req.param("id");
    const { charge_categories } = await c.req.json();
    
    const { data: partner } = await db.from("network_partners").select("*").eq("id", id).maybeSingle();
    if (partner) {
      await db.from("network_partners").update({ charge_categories, updated_at: new Date().toISOString() }).eq("id", id);
      return c.json({ success: true, data: charge_categories });
    }
    return c.json({ success: false, error: "Partner/Vendor not found" }, 404);
  } catch (error) {
    console.error("Error saving partner charge categories:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== TRANSACTION VIEW SETTINGS API ====================

// Get visible accounts for transactions module
app.get("/make-server-c142e950/settings/transaction-view", async (c) => {
  try {
    const { data: settingsRow } = await db.from("counters").select("*").eq("key", "settings:transaction-view").maybeSingle();
    const settings = settingsRow?.value ? (typeof settingsRow.value === 'object' ? settingsRow.value : JSON.parse(settingsRow.value)) : { visibleAccountIds: [] };
    return c.json({ success: true, data: settings });
  } catch (error) {
    console.error("Error fetching transaction view settings:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Save visible accounts for transactions module
app.post("/make-server-c142e950/settings/transaction-view", async (c) => {
  try {
    const body = await c.req.json();
    
    // minimal validation
    if (!body || !Array.isArray(body.visibleAccountIds)) {
       return c.json({ success: false, error: "Invalid body: visibleAccountIds array required" }, 400);
    }
    
    await db.from("counters").upsert({ key: "settings:transaction-view", value: body }, { onConflict: "key" });
    console.log(`Updated transaction view settings: ${body.visibleAccountIds.length} accounts visible`);
    
    return c.json({ success: true, data: body });
  } catch (error) {
    console.error("Error saving transaction view settings:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== CONTRACT QUOTATION: Active Contract Detection ====================

// GET active contracts for a customer (used by Operations booking panels)
app.get("/make-server-c142e950/contracts/active", async (c) => {
  try {
    const customer_name = c.req.query("customer_name");
    if (!customer_name) {
      return c.json({ success: false, error: "customer_name query parameter is required" }, 400);
    }

    // Fetch all quotations and filter for active contracts matching this customer
    const { data: qRowsBanner } = await db.from("quotations").select("*");
    const allQuotations = (qRowsBanner || []).map((r: any) => mergeFromRow(r));
    const customerNameLower = customer_name.toLowerCase().trim();

    const activeContracts = allQuotations.filter((q: any) => {
      // Must be a contract quotation
      if (q.quotation_type !== "contract") return false;

      // Must match customer name (case-insensitive)
      const qCustomer = (q.customer_name || "").toLowerCase().trim();
      if (qCustomer !== customerNameLower) return false;

      // Must be Active — Draft, For Signing, Pending, etc. are not linkable to bookings
      const status = q.contract_status || q.status || "Draft";
      if (status !== "Active") return false;

      // Check validity period — contract must currently be valid or not yet started
      if (q.contract_validity_end) {
        const endDate = new Date(q.contract_validity_end);
        endDate.setHours(23, 59, 59, 999);
        if (endDate < new Date()) return false; // Already ended
      }

      return true;
    });

    // Return slim contract data for the banner
    const contracts = activeContracts.map((q: any) => ({
      id: q.id,
      quote_number: q.quote_number,
      quotation_name: q.quotation_name,
      contract_status: q.contract_status || "Draft",
      contract_validity_start: q.contract_validity_start,
      contract_validity_end: q.contract_validity_end,
      services: q.services || [],
      customer_name: q.customer_name,
    }));

    // ✨ PHASE 5: Auto-detect expiring contracts (within 30 days)
    const now = new Date();
    for (const contract of contracts) {
      if (contract.contract_validity_end && contract.contract_status === "Active") {
        const endDate = new Date(contract.contract_validity_end);
        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 30 && daysLeft > 0) {
          contract.contract_status = "Expiring";
          // Persist the status change
          const full = await getQuotationMerged(contract.id);
          if (full && full.contract_status === "Active") {
            await saveQuotation({ ...full, contract_status: "Expiring", updatedAt: now.toISOString() });
            console.log(`Contract ${contract.quote_number} auto-flagged as Expiring (${daysLeft}d remaining)`);
          }
        }
      }
    }

    console.log(`Contract detection: found ${contracts.length} active contract(s) for customer "${customer_name}"`);

    return c.json({ success: true, contracts });
  } catch (error) {
    console.error("Error checking active contracts:", error);
    return c.json({ success: false, error: `Error checking active contracts: ${String(error)}` }, 500);
  }
});

// ==================== CONTRACT QUOTATION: Link Booking to Contract (Phase 3) ====================

/**
 * Link a booking to a contract. Mirrors POST /projects/:id/link-booking pattern.
 * Unlike projects, contracts allow MULTIPLE bookings per service type.
 *
 * @see /docs/blueprints/CONTRACT_FLOWCHART_INTEGRATION_BLUEPRINT.md - Phase 3, Task 3.3
 */
app.post("/make-server-c142e950/contracts/:id/link-booking", async (c) => {
  try {
    const id = c.req.param("id");
    const { bookingId, bookingNumber, serviceType, status } = await c.req.json();

    if (!bookingId || !bookingNumber || !serviceType) {
      return c.json({
        success: false,
        error: "Missing required fields: bookingId, bookingNumber, and serviceType are required",
      }, 400);
    }

    const contract = await getQuotationMerged(id);
    if (!contract) {
      return c.json({ success: false, error: "Contract not found" }, 404);
    }
    if (contract.quotation_type !== "contract") {
      return c.json({ success: false, error: "Referenced quotation is not a contract" }, 400);
    }

    // Initialize linkedBookings if needed
    if (!contract.linkedBookings) {
      contract.linkedBookings = [];
    }

    // Check if already linked (by bookingId) — idempotent
    const alreadyLinked = contract.linkedBookings.some((b: any) => b.bookingId === bookingId);
    if (alreadyLinked) {
      return c.json({ success: true, data: contract });
    }

    // NOTE: Unlike projects, contracts allow MULTIPLE bookings per service type
    // (e.g., 50 Brokerage bookings under one annual contract)

    contract.linkedBookings.push({
      bookingId,
      bookingNumber,
      serviceType,
      status,
      createdAt: new Date().toISOString(),
    });

    contract.updated_at = new Date().toISOString();
    await saveQuotation(contract);

    // Record activity
    await recordContractActivity(
      id, "booking_linked",
      `${serviceType} booking ${bookingNumber} linked`,
      undefined, { bookingId, bookingNumber, serviceType }
    );

    console.log(`Linked booking ${bookingNumber} to contract ${contract.quote_number} (total: ${contract.linkedBookings.length})`);

    return c.json({ success: true, data: contract });
  } catch (error) {
    console.error("Error linking booking to contract:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Unlink booking from contract
app.post("/make-server-c142e950/contracts/:id/unlink-booking", async (c) => {
  try {
    const id = c.req.param("id");
    const { bookingId } = await c.req.json();

    const contract = await getQuotationMerged(id);
    if (!contract) return c.json({ success: false, error: "Contract not found" }, 404);
    if (contract.linkedBookings) {
      contract.linkedBookings = contract.linkedBookings.filter(
        (b: any) => b.bookingId !== bookingId
      );
      contract.updated_at = new Date().toISOString();
      await saveQuotation(contract);
    }

    return c.json({ success: true, data: contract });
  } catch (error) {
    console.error("Error unlinking booking from contract:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// REMOVED: Legacy generate-billing endpoint + server-side rate engine (Phase 5E cleanup)
// Rate card generation now runs client-side via BookingRateCardButton → rateCardToBilling.ts
// See /docs/blueprints/CONTRACT_BILLINGS_REWORK_BLUEPRINT.md — Phase 5E

/*
function serverGetQuantityForUnit(unit: string, quantities: any): number {
  switch (unit) {
    case "per_container": return quantities.containers ?? quantities.quantity ?? 1;
    case "per_shipment": return quantities.shipments ?? 1;
    case "per_bl": return quantities.bls ?? 1;
    case "per_set": return quantities.sets ?? quantities.quantity ?? 1;
    default: return quantities.containers ?? quantities.quantity ?? 1;
  }
}

function serverResolveModeColumn(columns: string[], bookingMode: string): string | null {
  const mode = (bookingMode || "").toUpperCase().trim();
  const direct = columns.find((col: string) => col.toUpperCase() === mode);
  if (direct) return direct;
  const partial = columns.find((col: string) => col.toUpperCase().includes(mode));
  if (partial) return partial;
  if (mode === "AIR") {
    const airCol = columns.find((col: string) => col.toUpperCase().includes("AIR"));
    if (airCol) return airCol;
  }
  return columns.length > 0 ? columns[0] : null;
}

function serverCalculateRates(matrix: any, modeColumn: string, quantities: any): any[] {
  const applied: any[] = [];
  const resolvedCol = matrix.columns.includes(modeColumn)
    ? modeColumn
    : serverResolveModeColumn(matrix.columns, modeColumn);
  if (!resolvedCol) return applied;

  for (const row of (matrix.rows || [])) {
    const rate = row.rates?.[resolvedCol];
    if (!rate || rate <= 0) continue;
    const qty = serverGetQuantityForUnit(row.unit, quantities);
    if (qty <= 0) continue;

    let subtotal: number;
    let ruleApplied: string;
    const rule = row.succeeding_rule;
    if (rule && rule.after_qty > 0 && qty > rule.after_qty) {
      const baseQty = rule.after_qty;
      const succQty = qty - baseQty;
      subtotal = baseQty * rate + succQty * rule.rate;
      ruleApplied = `${baseQty} x P${rate.toLocaleString()} + ${succQty} x P${rule.rate.toLocaleString()}`;
    } else {
      subtotal = qty * rate;
      ruleApplied = `${qty} x P${rate.toLocaleString()}`;
    }

    applied.push({
      particular: row.particular,
      rate,
      quantity: qty,
      subtotal,
      rule_applied: ruleApplied,
    });
  }
  return applied;
}

// POST: Generate billing drafts for a contract booking
app.post("/make-server-c142e950/contracts/:contractId/generate-billing", async (c) => {
  try {
    const contractId = c.req.param("contractId");
    const body = await c.req.json();
    const { booking_id, service_type, mode, quantities } = body;

    if (!booking_id || !service_type) {
      return c.json({ success: false, error: "booking_id and service_type are required" }, 400);
    }

    // Fetch the contract quotation
    const contract = await getQuotationMerged(contractId);
    if (!contract) {
      return c.json({ success: false, error: `Contract ${contractId} not found` }, 404);
    }
    if (contract.quotation_type !== "contract") {
      return c.json({ success: false, error: "Referenced quotation is not a contract" }, 400);
    }

    // Find the rate matrix for this service type
    const matrices = contract.rate_matrices || [];
    const matrix = matrices.find((m: any) => m.service_type.toLowerCase() === service_type.toLowerCase());
    if (!matrix) {
      return c.json({ success: false, error: `No rate matrix found for service type "${service_type}" in contract` }, 404);
    }

    // Resolve mode column
    const modeColumn = serverResolveModeColumn(matrix.columns, mode || "FCL");
    if (!modeColumn) {
      return c.json({ success: false, error: `Could not resolve mode column for "${mode}"` }, 400);
    }

    // Calculate applied rates
    const bookingQuantities = quantities || { containers: 1, shipments: 1 };
    const appliedRates = serverCalculateRates(matrix, modeColumn, bookingQuantities);
    const total = appliedRates.reduce((sum: number, r: any) => sum + r.subtotal, 0);

    if (appliedRates.length === 0) {
      return c.json({ success: false, error: "No applicable rates found for the given mode and quantities" }, 400);
    }

    // Check for existing billings for this booking to avoid duplicates
    const { data: abRows } = await db.from("evouchers").select("*").eq("contract_id", contractId);
    const alreadyBilled = (abRows || []).filter((b: any) => b.source_booking_id === booking_id);
    if (alreadyBilled.length > 0) {
      return c.json({
        success: false,
        error: `Billing already exists for booking ${booking_id} under this contract`,
        existing_billings: alreadyBilled.map((b: any) => b.id),
      }, 409);
    }

    // Generate billing drafts — one evoucher per applied rate line
    const creationTimestamp = new Date().toISOString();
    const generatedBillings: any[] = [];

    for (const appliedRate of appliedRates) {
      const billingId = `BILL-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

      const billing = {
        id: billingId,
        billingId,
        bookingId: booking_id,
        bookingType: service_type,

        createdAt: creationTimestamp,
        updatedAt: creationTimestamp,
        created_at: creationTimestamp,

        source: "contract",
        source_type: "contract_rate",
        contract_id: contractId,
        contract_number: contract.quote_number,
        source_booking_id: booking_id,

        purpose: appliedRate.particular,
        description: `${appliedRate.particular} — ${appliedRate.rule_applied}`,
        particular: appliedRate.particular,
        applied_rate: appliedRate.rate,
        applied_quantity: appliedRate.quantity,
        rule_applied: appliedRate.rule_applied,
        mode_column: modeColumn,

        amount: appliedRate.subtotal,
        currency: contract.currency || "PHP",
        quantity: appliedRate.quantity,
        unit: "",

        customer_name: contract.customer_name,
        customer_id: contract.customer_id,

        status: "draft",
        transaction_type: "billing",
        billing_status: "unbilled",

        notes: `Auto-generated from contract ${contract.quote_number} for booking ${booking_id}`,
      };

      // [RELATIONAL] Insert billing into evouchers table
      await saveEvoucher(billing);
      generatedBillings.push(billing);
      await new Promise(r => setTimeout(r, 2));
    }

    // Update the booking with applied rates [RELATIONAL]
    const { data: bkToUpdate } = await db.from("bookings").select("*").eq("id", booking_id).maybeSingle();
    if (bkToUpdate) {
      const merged = mergeFromRow(bkToUpdate);
      const updBk = { ...merged, contract_applied_rates: appliedRates, contract_billing_total: total, contract_billing_generated_at: creationTimestamp, updatedAt: creationTimestamp };
      await saveBooking(updBk);
    }

    // Record activity
    await recordContractActivity(
      contractId, "billing_generated",
      `Billing generated for ${service_type} booking ${booking_id} — ${generatedBillings.length} line(s), total ${contract.currency || "PHP"} ${total.toLocaleString()}`,
      undefined, { booking_id, service_type, total, line_count: generatedBillings.length }
    );

    console.log(`Generated ${generatedBillings.length} contract billings for booking ${booking_id} (contract: ${contract.quote_number}, total: ${total})`);

    return c.json({
      success: true,
      billings: generatedBillings,
      total,
      applied_rates: appliedRates,
      mode_column: modeColumn,
    });
  } catch (error) {
    console.error("Error generating contract billing:", error);
    return c.json({ success: false, error: `Error generating contract billing: ${String(error)}` }, 500);
  }
});
*/

// GET: Fetch billings for a specific contract
app.get("/make-server-c142e950/contracts/:contractId/billings", async (c) => {
  try {
    const contractId = c.req.param("contractId");

    const { data: evRows } = await db.from("evouchers").select("*").eq("contract_id", contractId);
    const allBillings = (evRows || []).map((r: any) => mergeFromRow(r));
    const contractBillings = allBillings
      .filter((b: any) => b.contract_id === contractId)
      .sort((a: any, b: any) => new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime());

    const totalBilled = contractBillings.reduce((sum: number, b: any) => sum + (b.amount || 0), 0);
    const draftCount = contractBillings.filter((b: any) => b.billing_status === "unbilled" || b.status === "draft").length;
    const billedCount = contractBillings.filter((b: any) => b.billing_status === "billed").length;
    const collectedCount = contractBillings.filter((b: any) => b.billing_status === "collected").length;

    const totalCollected = contractBillings
      .filter((b: any) => b.billing_status === "collected")
      .reduce((sum: number, b: any) => sum + (b.amount || 0), 0);
    const totalOutstanding = totalBilled - totalCollected;

    return c.json({
      success: true,
      billings: contractBillings,
      summary: {
        total_billed: totalBilled,
        total_outstanding: totalOutstanding,
        total_collected: totalCollected,
        draft_count: draftCount,
        billed_count: billedCount,
        collected_count: collectedCount,
        total_count: contractBillings.length,
      },
    });
  } catch (error) {
    console.error("Error fetching contract billings:", error);
    return c.json({ success: false, error: `Error fetching contract billings: ${String(error)}` }, 500);
  }
});

// POST: Renew a contract (Phase 5.4 - Contract Lifecycle)
app.post("/make-server-c142e950/contracts/:contractId/renew", async (c) => {
  try {
    const contractId = c.req.param("contractId");
    const body = await c.req.json();
    const { new_validity_start, new_validity_end } = body;

    if (!new_validity_start || !new_validity_end) {
      return c.json({ success: false, error: "new_validity_start and new_validity_end are required" }, 400);
    }

    const existing = await getQuotationMerged(contractId);
    if (!existing) return c.json({ success: false, error: `Contract ${contractId} not found` }, 404);
    await saveQuotation({ ...existing, contract_status: "Renewed", updatedAt: new Date().toISOString() });

    // Create new contract as a copy
    const newId = `QUO-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const newQuoteNumber = `CQ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

    const renewedContract = {
      ...existing,
      id: newId,
      quote_number: newQuoteNumber,
      quotation_name: `${existing.quotation_name || ""} (Renewed)`.trim(),
      contract_status: "Draft",
      status: "Draft",
      contract_validity_start: new_validity_start,
      contract_validity_end: new_validity_end,
      renewed_from_id: contractId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    await saveQuotation(renewedContract);

    // Record activity on the original contract
    await recordContractActivity(
      contractId, "contract_renewed",
      `Contract renewed — new contract ${newQuoteNumber} created`,
      undefined, { new_contract_id: newId, new_quote_number: newQuoteNumber }
    );

    console.log(`Contract ${existing.quote_number} renewed to ${newQuoteNumber}`);

    return c.json({
      success: true,
      original_contract_id: contractId,
      new_contract: renewedContract,
    });
  } catch (error) {
    console.error("Error renewing contract:", error);
    return c.json({ success: false, error: `Error renewing contract: ${String(error)}` }, 500);
  }
});

// ==================== CONTRACT ACTIVITY LOG API ====================
// DRY helper: record an activity event for a contract

async function recordContractActivity(
  contractId: string,
  eventType: string,
  description: string,
  user?: string,
  metadata?: Record<string, any>
) {
  const timestamp = Date.now();
  const event = {
    id: `${timestamp}-${Math.random().toString(36).substring(2, 8)}`,
    contract_id: contractId,
    event_type: eventType,
    description,
    user: user || "System",
    user_name: user || "System",
    metadata: metadata || {},
    created_at: new Date(timestamp).toISOString(),
  };
  await db.from("contract_activity").insert({
    id: event.id,
    contract_id: contractId,
    event_type: eventType,
    description,
    user_name: user || "System",
    metadata: metadata || {},
    created_at: event.created_at,
  });
  return event;
}

// GET: Fetch all activity events for a contract
app.get("/make-server-c142e950/contracts/:id/activity", async (c) => {
  try {
    const contractId = c.req.param("id");
    const { data: evtRows } = await db.from("contract_activity").select("*").eq("contract_id", contractId);
    const allEvents = evtRows || [];

    const sorted = allEvents.sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return c.json({ success: true, data: sorted });
  } catch (error) {
    console.error("Error fetching contract activity:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// POST: Record a manual activity event for a contract
app.post("/make-server-c142e950/contracts/:id/activity", async (c) => {
  try {
    const contractId = c.req.param("id");
    const body = await c.req.json();
    const { event_type, description, user, metadata } = body;

    if (!event_type || !description) {
      return c.json({ success: false, error: "event_type and description are required" }, 400);
    }

    const event = await recordContractActivity(contractId, event_type, description, user, metadata);
    return c.json({ success: true, data: event });
  } catch (error) {
    console.error("Error recording contract activity:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// PATCH: Update contract status (interactive status changes from ContractStatusSelector)
app.patch("/make-server-c142e950/contracts/:id/status", async (c) => {
  try {
    const contractId = c.req.param("id");
    const body = await c.req.json();
    const { status, user } = body;

    const validStatuses = ["Draft", "Active", "Expiring", "Expired", "Renewed"];
    if (!status || !validStatuses.includes(status)) {
      return c.json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, 400);
    }

    const existing = await getQuotationMerged(contractId);
    if (!existing) {
      return c.json({ success: false, error: `Contract ${contractId} not found` }, 404);
    }

    const oldStatus = existing.contract_status || "Draft";
    const now = new Date().toISOString();

    const updated = {
      ...existing,
      contract_status: status,
      updated_at: now,
      updatedAt: now,
      ...(status === "Active" && !existing.contract_activated_at && {
        contract_activated_at: now,
        status: "Converted to Contract",
      }),
    };

    await saveQuotation(updated);

    await recordContractActivity(
      contractId,
      "status_changed",
      `Status changed from ${oldStatus} to ${status}`,
      user || "Unknown",
      { old_status: oldStatus, new_status: status }
    );

    console.log(`Contract ${existing.quote_number} status: ${oldStatus} → ${status}`);

    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating contract status:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET: Fetch all contracts for a customer (for CustomerDetail)
app.get("/make-server-c142e950/contracts/by-customer/:customerName", async (c) => {
  try {
    const customerName = decodeURIComponent(c.req.param("customerName"));
    const { data: qRowsCust } = await db.from("quotations").select("*");
    const allQuotations = (qRowsCust || []).map((r: any) => mergeFromRow(r));
    const customerNameLower = customerName.toLowerCase().trim();

    const contracts = allQuotations
      .filter((q: any) => {
        if (q.quotation_type !== "contract") return false;
        const qCustomer = (q.customer_name || "").toLowerCase().trim();
        return qCustomer === customerNameLower;
      })
      .sort((a: any, b: any) => new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime())
      .map((q: any) => ({
        id: q.id,
        quote_number: q.quote_number,
        quotation_name: q.quotation_name,
        contract_status: q.contract_status || "Draft",
        contract_validity_start: q.contract_validity_start,
        contract_validity_end: q.contract_validity_end,
        services: q.services || [],
        customer_name: q.customer_name,
        rate_matrices_count: (q.rate_matrices || []).length,
      }));

    return c.json({ success: true, contracts });
  } catch (error) {
    console.error("Error fetching customer contracts:", error);
    return c.json({ success: false, error: `Error fetching customer contracts: ${String(error)}` }, 500);
  }
});

// ==================== EXPENSE & CHARGE CATALOG API ====================

// List catalog items (with optional search, service_type, type filters)
app.get("/make-server-c142e950/catalog/items", (c) => catalogHandlers.listCatalogItems(c));

// Get single catalog item
app.get("/make-server-c142e950/catalog/items/:id", (c) => catalogHandlers.getCatalogItem(c));

// Create catalog item
app.post("/make-server-c142e950/catalog/items", (c) => catalogHandlers.createCatalogItem(c));

// Update catalog item
app.put("/make-server-c142e950/catalog/items/:id", (c) => catalogHandlers.updateCatalogItem(c));

// Soft-delete (deactivate) catalog item
app.delete("/make-server-c142e950/catalog/items/:id", (c) => catalogHandlers.deleteCatalogItem(c));

// List catalog categories
app.get("/make-server-c142e950/catalog/categories", (c) => catalogHandlers.listCatalogCategories(c));

// Create catalog category
app.post("/make-server-c142e950/catalog/categories", (c) => catalogHandlers.createCatalogCategory(c));

// Seed catalog with common Philippine freight forwarding items (idempotent)
app.post("/make-server-c142e950/catalog/seed", (c) => catalogHandlers.seedCatalogItems(c));

// Audit matrix: pivot table of bookings × catalog items
app.get("/make-server-c142e950/catalog/audit/matrix", (c) => catalogHandlers.auditMatrix(c));

// Audit summary: per-catalog-item aggregation
app.get("/make-server-c142e950/catalog/audit/summary", (c) => catalogHandlers.auditSummary(c));

console.log("Neuron OS server starting... (v2)");
Deno.serve(app.fetch);