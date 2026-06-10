const http = require('http');

async function request(method, path, body = null, token = null) {
  const url = `http://localhost:8080/api/v1${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const res = await fetch(url, options);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch(e) { json = text; }
  
  if (!res.ok) {
    throw new Error(`API Error ${res.status} on ${method} ${path}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function runTest() {
  try {
    console.log("=== Starting E2E Test ===");
    
    // 1. Login Admin
    console.log("1. Logging in as Admin...");
    let adminLogin;
    try {
      adminLogin = await request("POST", "/auth/login", {
        identifier: "admin@sgm.co.id",
        password: "admin123"
      });
    } catch(e) {
      // If default admin is wrong, try another known default if any
      throw new Error("Failed to login Admin. Did you seed the DB? " + e.message);
    }
    const adminToken = adminLogin.data.access_token;
    console.log("   Admin login successful!");

    // 2. Get/Create Branch
    console.log("2. Checking for branches...");
    let branchesReq = await request("GET", "/admin/branches", null, adminToken);
    let branch = branchesReq.data && branchesReq.data.length > 0 ? branchesReq.data[0] : null;
    if (!branch) {
      console.log("   No branch found. Creating one...");
      const newBranch = await request("POST", "/admin/branches", {
        name: "Cabang Test",
        code: "C-TEST",
        latitude: -6.200000,
        longitude: 106.816666,
        radius_meters: 100,
        work_start: "08:00:00",
        work_end: "17:00:00",
        late_tolerance_minutes: 15,
        require_selfie: true
      }, adminToken);
      branch = newBranch.data;
    }
    console.log(`   Using branch: ${branch.name}`);

    // 3. Create Employee
    console.log("3. Creating an employee...");
    const employeeNIK = "EMP" + Math.floor(Math.random() * 100000);
    const empData = await request("POST", "/admin/employees", {
      nik: employeeNIK,
      name: "Test Employee",
      email: `${employeeNIK}@test.com`,
      password: "password123",
      role: "karyawan", // Wait, enum might be different. Let's use 'karyawan'
      position: "Staff",
      branch_id: branch.id,
      leave_balance: 12
    }, adminToken);
    console.log(`   Employee created with NIK: ${employeeNIK}`);

    // 4. Login Employee
    console.log("4. Logging in as Employee...");
    const empLogin = await request("POST", "/auth/login", {
      identifier: employeeNIK,
      password: "password123"
    });
    const empToken = empLogin.data.access_token;
    console.log("   Employee login successful!");

    // 5. Regular Check In
    console.log("5. Performing regular Check-In...");
    const checkIn = await request("POST", "/attendance/check-in", {
      latitude: branch.latitude,
      longitude: branch.longitude,
      selfie_url: "http://example.com/selfie.jpg",
      type: "check_in"
    }, empToken);
    console.log("   Check-In successful!");

    // 6. Regular Check Out
    console.log("6. Performing regular Check-Out...");
    const checkOut = await request("POST", "/attendance/check-out", {
      latitude: branch.latitude,
      longitude: branch.longitude,
      type: "check_out"
    }, empToken);
    console.log("   Check-Out successful!");

    // 7. Visit Check In (Outside radius)
    console.log("7. Performing Visit Check-In (Kunjungan)...");
    const visitIn = await request("POST", "/attendance/check-in", {
      latitude: -6.100000, // far away
      longitude: 106.100000,
      selfie_url: "http://example.com/visit.jpg",
      type: "visit_in",
      notes: "Kunjungan ke klien A"
    }, empToken);
    console.log("   Visit Check-In successful!");

    // 8. Visit Check Out
    console.log("8. Performing Visit Check-Out...");
    const visitOut = await request("POST", "/attendance/check-out", {
      latitude: -6.100000,
      longitude: 106.100000,
      type: "visit_out",
      notes: "Selesai kunjungan"
    }, empToken);
    console.log("   Visit Check-Out successful!");

    // 9. Leave Request
    console.log("9. Submitting Leave Request (Ijin)...");
    const typesRes = await request("GET", "/leaves/types", null, empToken);
    if (!typesRes.data || typesRes.data.length === 0) {
      throw new Error("No Leave Types found in database! Please seed them.");
    }
    const leaveTypeId = typesRes.data[0].id;
    
    const leaveReq = await request("POST", "/leaves", {
      leave_type_id: leaveTypeId,
      start_date: "2026-10-01",
      end_date: "2026-10-02",
      reason: "Acara keluarga",
      attachment_url: ""
    }, empToken);
    const leaveId = leaveReq.data.id;
    console.log("   Leave Request successful!");

    // 10. Overtime Request
    console.log("10. Submitting Overtime Request (Lembur)...");
    const otReq = await request("POST", "/overtimes", {
      date: "2026-10-05",
      estimated_start: "18:00",
      estimated_end: "20:00",
      reason: "Pekerjaan mendesak"
    }, empToken);
    const otId = otReq.data.id;
    console.log("   Overtime Request successful!");

    // 11. Admin Approves Requests
    console.log("11. Admin Approving Requests...");
    await request("PUT", `/admin/leaves/${leaveId}/status`, {
      status: "approved",
      notes: "Oke, disetujui."
    }, adminToken);
    console.log("   Leave Approved!");

    await request("PUT", `/admin/overtimes/${otId}/status`, {
      status: "approved",
      notes: "Lembur disetujui."
    }, adminToken);
    console.log("   Overtime Approved!");

    console.log("=== All Tests Passed Successfully! ===");

  } catch (err) {
    console.error("TEST FAILED:", err.message);
    process.exit(1);
  }
}

runTest();
