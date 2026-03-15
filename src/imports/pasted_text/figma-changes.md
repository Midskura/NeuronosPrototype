 Part A — Changes for Figma Make

 Change 1: Add JWT verification middleware (after line 78, after the CORS block)

 Add this block immediately after the existing app.use("/*", cors({...})) block and before the health check endpoint: 

 // JWT verification middleware — verifies every request has a valid Supabase session
 app.use("/make-server-c142e950/*", async (c, next) => {
   // Skip health check
   if (c.req.path === "/make-server-c142e950/health") return next();

   const authHeader = c.req.header("Authorization");
   if (!authHeader?.startsWith("Bearer ")) {
     return c.json({ success: false, error: "Missing authorization token" }, 401);
   }

   const token = authHeader.slice(7);

   // Verify JWT using the existing supabase service client
   // supabase.auth.getUser(token) validates the token without a second client
   if (!supabase) {
     return c.json({ success: false, error: "Server not configured" }, 500);
   }

   const { data: { user }, error } = await supabase.auth.getUser(token);
   if (error || !user) {
     return c.json({ success: false, error: "Invalid or expired token" }, 401);
   }

   // Fetch the profile row to get TEXT id, canonical role, and department
   const { data: profile } = await db.from("users")
     .select("id, role, department")
     .eq("auth_id", user.id)
     .maybeSingle();

   if (!profile) {
     return c.json({ success: false, error: "User profile not found" }, 403);
   }

   // Attach verified identity to context — handlers read from here, NOT query params
   c.set("callerId", profile.id);
   c.set("callerRole", profile.role);
   c.set("callerDepartment", profile.department);

   return next();
 });

 ---
 Change 2: Delete the /auth/login endpoint (lines 89–119)

 Delete the entire block:
 // Login endpoint [RELATIONAL]
 app.post("/make-server-c142e950/auth/login", async (c) => {
   ...
 });

 The frontend (useUser.tsx) already uses supabase.auth.signInWithPassword() directly. This endpoint is unused and is  
 the only reason the password column still exists.

 ---
 Change 3: Update /auth/me to use JWT context (line 122)

 Current:
 app.get("/make-server-c142e950/auth/me", async (c) => {
   try {
     const userId = c.req.query("user_id");
     if (!userId) {
       return c.json({ success: false, error: "User ID required" }, 400);
     }
     const { data: user, error } = await db.from("users").select("*").eq("id", userId).maybeSingle();

 Replace with:
 app.get("/make-server-c142e950/auth/me", async (c) => {
   try {
     const userId = c.get("callerId");
     if (!userId) {
       return c.json({ success: false, error: "User ID required" }, 400);
     }
     const { data: user, error } = await db.from("users").select("*").eq("id", userId).maybeSingle();

 Also remove the const { password: _, ...userWithoutPassword } = user; password strip — after Step 5 runs the column  
 won't exist. Change to just return c.json({ success: true, data: user });.

 ---
 Change 4: Update GET /tickets to use JWT context (lines 1063–1065)

 Current:
 const user_id = c.req.query("user_id");
 const role = c.req.query("role");
 const department = c.req.query("department");

 Replace with:
 const user_id = c.get("callerId");
 const role = c.get("callerRole");
 const department = c.get("callerDepartment");

 Keep all the existing filtering logic below unchanged — it still uses user_id, role, department the same way.        

 ---
 Change 5: Update GET /tickets/:id/activity to use JWT context (lines 1384–1385)

 Current:
 const user_role = c.req.query("role");
 const user_department = c.req.query("department");

 Replace with:
 const user_role = c.get("callerRole");
 const user_department = c.get("callerDepartment");

 ---
 Change 6: Update GET /activity-log to use JWT context (lines 1428–1432)

 Current:
 const user_role = c.req.query("role");
 const user_department = c.req.query("department");
 ...
 const user_id = c.req.query("user_id");

 Replace with:
 const user_role = c.get("callerRole");
 const user_department = c.get("callerDepartment");
 ...
 const user_id = c.get("callerId");

 ---
 Change 7: Protect all 5 destructive endpoints with a director guard

 Add this check at the top of each of these handlers (before any db calls):

 if (c.get("callerRole") !== "director") {
   return c.json({ success: false, error: "Insufficient permissions — director role required" }, 403);
 }

 Apply to these 5 endpoints:
 - DELETE /make-server-c142e950/auth/clear-users (line 787)
 - DELETE /make-server-c142e950/seed/clear (line 5063)
 - DELETE /make-server-c142e950/customers/clear (line 5472)
 - DELETE /make-server-c142e950/contacts/clear (line 5742)
 - DELETE /make-server-c142e950/vendors/clear (line 6554)
