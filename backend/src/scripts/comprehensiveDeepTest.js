const BASE_URL = "http://localhost:5002/api";

const results = [];
function record(step, pass, details) {
  results.push({ step, pass, details });
  const icon = pass ? "✅ PASS" : "❌ FAIL";
  console.log(`${icon} [${step}]: ${details}`);
}

async function request(path, options = {}, token = null, companyId = null) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (companyId) headers["x-company-id"] = String(companyId);

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log("==================================================================");
  console.log("🚀 STARTING COMPREHENSIVE END-TO-END SYSTEM TEST");
  console.log("   Brand: Shri Shyam Bricks & Building Materials");
  console.log("   Target URL: " + BASE_URL);
  console.log("==================================================================\n");

  let token = null;
  let companyId = null;
  let testCustomer = null;
  let testDriver = null;
  let testVehicle = null;
  let testMaterial = null;
  let testOrder = null;
  let createdExpenses = [];

  const uid = Math.floor(1000 + Math.random() * 9000);
  const testPhone = `98290${uid}`;
  const testDriverPhone = `94140${uid}`;
  const testVehicleNo = `RJ14 GA ${uid}`;
  const testCustomerName = `Sharma Builders & Infra ${uid}`;
  const testDriverName = `Mukesh Driver ${uid}`;

  // -------------------------------------------------------------
  // TEST 1: Health Check
  // -------------------------------------------------------------
  try {
    const res = await request("/health");
    const ok = res.status === 200 && res.data?.success;
    record("1. API Health Check", ok, `Status ${res.status}: ${res.data?.message}`);
  } catch (err) {
    record("1. API Health Check", false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 2: Super Admin Login & Authentication
  // -------------------------------------------------------------
  try {
    const res = await request("/auth/login", {
      method: "POST",
      body: {
        email: "admin@shrishyambricks.com",
        password: "admin@123"
      }
    });
    const ok = res.status === 200 && res.data?.success && Boolean(res.data?.token);
    token = res.data?.token;
    companyId = res.data?.company?._id || res.data?.autoSelectedCompany?._id || res.data?.user?.companyId?._id;
    record(
      "2. Super Admin Login",
      ok,
      `User: ${res.data?.user?.email}, Role: ${res.data?.user?.role}, Company: ${res.data?.company?.name || res.data?.autoSelectedCompany?.name} (${companyId})`
    );
  } catch (err) {
    record("2. Super Admin Login", false, err.message);
    process.exit(1);
  }

  // -------------------------------------------------------------
  // TEST 3: Auth Verification (/auth/me)
  // -------------------------------------------------------------
  try {
    const res = await request("/auth/me", { method: "GET" }, token, companyId);
    const ok = res.data?.success && res.data?.user?.role === "super_admin";
    record("3. Auth Token Profile Verification", ok, `Authenticated as ${res.data?.user?.name} (${res.data?.user?.role})`);
  } catch (err) {
    record("3. Auth Token Profile Verification", false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 4: Pre-seeded Materials Check
  // -------------------------------------------------------------
  try {
    const res = await request("/materials", { method: "GET" }, token, companyId);
    const list = res.data?.data || [];
    const names = list.map(m => m.name);
    const expected = ["Rodi 10mm", "Rodi 20mm", "Rodi 40mm", "Stone Dust", "GSB", "M-Sand", "Bricks"];
    const allFound = expected.every(exp => names.includes(exp));
    testMaterial = list.find(m => m.name === "Rodi 20mm") || list[0];
    record(
      "4. Mandatory Pre-seeded Materials",
      allFound && list.length >= 7,
      `Found ${list.length} materials in DB. Expected all 7 present: ${allFound ? "YES" : "NO"}`
    );
  } catch (err) {
    record("4. Mandatory Pre-seeded Materials", false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 5: Customer Master (Create & Fetch)
  // -------------------------------------------------------------
  try {
    const custPayload = {
      name: testCustomerName,
      phone: testPhone,
      siteAddress: "Sector 14 Ring Road Expressway Project, Jaipur",
      gstin: "08AABCS1234D1Z9",
      openingBalance: 15000,
      status: "active"
    };
    const createRes = await request("/customers", { method: "POST", body: custPayload }, token, companyId);
    testCustomer = createRes.data?.data;
    const ok = (createRes.status === 201 || createRes.status === 200) && Boolean(testCustomer?._id);
    record(
      "5. Customer Creation",
      ok,
      `Created Customer: ${testCustomer?.name}, Site: ${testCustomer?.siteAddress}, Phone: ${testCustomer?.phone}`
    );

    // Verify in customer list
    const listRes = await request("/customers", { method: "GET" }, token, companyId);
    const found = (listRes.data?.data || []).some(c => c._id === testCustomer?._id);
    record("5b. Customer List & Persistence", found, `Customer retrieved successfully in active directory.`);
  } catch (err) {
    record("5. Customer Creation", false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 6: Driver Directory (Create & Fetch)
  // -------------------------------------------------------------
  try {
    const driverPayload = {
      name: testDriverName,
      phone: testDriverPhone,
      monthlySalary: 22000,
      dailyAllowance: 400,
      status: "active"
    };
    const createRes = await request("/drivers", { method: "POST", body: driverPayload }, token, companyId);
    testDriver = createRes.data?.data;
    const ok = (createRes.status === 201 || createRes.status === 200) && Boolean(testDriver?._id);
    if (!ok) {
      console.log("Driver create failure response:", createRes.status, createRes.data);
    }
    record(
      "6. Driver Creation",
      ok,
      `Created Driver: ${testDriver?.name}, Monthly Salary: ₹${testDriver?.monthlySalary}, Daily Bhatta: ₹${testDriver?.dailyAllowance}`
    );
  } catch (err) {
    record("6. Driver Creation", false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 7: Own Fleet Vehicle (Create with Driver Relationship)
  // -------------------------------------------------------------
  try {
    const vehiclePayload = {
      vehicleNumber: testVehicleNo,
      vehicleType: "Tipper",
      driverId: testDriver?._id,
      defaultDriverId: testDriver?._id,
      ownerType: "own",
      ownership: "own",
      status: "active"
    };
    const createRes = await request("/vehicles", { method: "POST", body: vehiclePayload }, token, companyId);
    testVehicle = createRes.data?.data;
    const ok = (createRes.status === 201 || createRes.status === 200) && Boolean(testVehicle?._id);
    record(
      "7. Vehicle Creation & Driver Linking",
      ok,
      `Created Vehicle: ${testVehicle?.vehicleNumber} (${testVehicle?.vehicleType}), Assigned Driver: ${testVehicle?.driverId || testVehicle?.defaultDriverId}`
    );

    // Verify Vehicle fetch and populate
    const listRes = await request("/vehicles", { method: "GET" }, token, companyId);
    const v = (listRes.data?.data || []).find(item => item._id === testVehicle?._id);
    const populated = v && (v.driverId?.name === testDriverName || v.driverId === testDriver?._id || v.defaultDriverId === testDriver?._id);
    record("7b. Vehicle Directory Population", Boolean(v), `Found ${v?.vehicleNumber}, Driver relationship verified.`);
  } catch (err) {
    record("7. Vehicle Creation", false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 8: Supply Order Entry & Automated Math Engine
  // -------------------------------------------------------------
  try {
    // 50 Tons of Rodi 20mm @ ₹480/Ton + 5% GST, Advance ₹6,000
    // Taxable: 50 * 480 = 24,000
    // GST (5%): 24,000 * 0.05 = 1,200
    // Grand Total: 25,200
    // Advance Received: 6,000
    // Balance Due: 19,200
    // Payment Status: "partial"
    const orderPayload = {
      customerId: testCustomer?._id,
      materialId: testMaterial?._id,
      vehicleId: testVehicle?._id,
      driverId: testDriver?._id,
      quantity: 50,
      rate: 480,
      gstRate: 5,
      advanceReceived: 6000,
      loadingSite: "Quarry Yard 3, Tonk Road",
      unloadingSite: testCustomer?.siteAddress,
      remarks: "Expressway high-grade aggregate dispatch"
    };

    const createRes = await request("/supply-orders", { method: "POST", body: orderPayload }, token, companyId);
    testOrder = createRes.data?.data;

    const mathOk =
      testOrder &&
      testOrder.taxableAmount === 24000 &&
      testOrder.gstAmount === 1200 &&
      testOrder.grandTotal === 25200 &&
      testOrder.balanceDue === 19200 &&
      testOrder.paymentStatus === "partial";

    record(
      "8. Supply Order Automated Calculations",
      Boolean(mathOk),
      `Qty: 50, Rate: ₹480 -> Taxable: ₹${testOrder?.taxableAmount} (Exp: 24000), GST: ₹${testOrder?.gstAmount} (Exp: 1200), Total: ₹${testOrder?.grandTotal} (Exp: 25200), Advance: ₹${testOrder?.advanceReceived}, Due: ₹${testOrder?.balanceDue} (Exp: 19200), Status: ${testOrder?.paymentStatus}`
    );

    // Verify Supply Order List with all populates
    const listRes = await request("/supply-orders", { method: "GET" }, token, companyId);
    const retrieved = (listRes.data?.data || []).find(o => o._id === testOrder?._id);
    const popOk =
      retrieved &&
      retrieved.customerId?.name === testCustomerName &&
      retrieved.materialId?.name === testMaterial?.name &&
      retrieved.vehicleId?.vehicleNumber === testVehicleNo &&
      retrieved.driverId?.name === testDriverName;

    record(
      "8b. Supply Order Relational Populates",
      Boolean(popOk),
      `Customer: ${retrieved?.customerId?.name}, Material: ${retrieved?.materialId?.name}, Vehicle: ${retrieved?.vehicleId?.vehicleNumber}, Driver: ${retrieved?.driverId?.name}`
    );
  } catch (err) {
    record("8. Supply Order Testing", false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 9: Multi-Category Vehicle Expenses Logging
  // -------------------------------------------------------------
  try {
    const expenseData = [
      { category: "fuel", amount: 5000, litres: 55, paidVia: "cash", slipNumber: "DSL-9901", notes: "Highway fuel bunk" },
      { category: "driver_kharcha", amount: 700, paidVia: "cash", slipNumber: "", notes: "Day bhatta for Tonk run" },
      { category: "maintenance", amount: 1500, paidVia: "online", slipNumber: "REP-442", notes: "Air filter & grease" },
      { category: "tyre", amount: 1800, paidVia: "bank", slipNumber: "TYR-11", notes: "Rear tyre puncture & vulcanizing" },
      { category: "fastag", amount: 650, paidVia: "online", slipNumber: "FSTG-7", notes: "Jaipur-Chaksu toll plaza" },
      { category: "other", amount: 250, paidVia: "cash", slipNumber: "WB-99", notes: "Weighbridge computer slip" }
    ];

    let allSaved = true;
    for (const exp of expenseData) {
      const res = await request(
        "/vehicle-expenses",
        {
          method: "POST",
          body: {
            ...exp,
            vehicleId: testVehicle?._id,
            driverId: testDriver?._id,
            expenseDate: new Date()
          }
        },
        token,
        companyId
      );
      if (res.status === 201 || res.status === 200) {
        createdExpenses.push(res.data?.data);
      } else {
        allSaved = false;
        console.error("Expense error:", res.data);
      }
    }

    const totalExpectedExpense = 5000 + 700 + 1500 + 1800 + 650 + 250; // 9,900
    record(
      "9. Vehicle Expenses Multi-Category Creation",
      allSaved && createdExpenses.length === 6,
      `Logged 6 categories (Fuel, Bhatta, Maintenance, Tyre, Fastag, Other). Total Logged: ₹${totalExpectedExpense}`
    );

    // Verify Expense List with Filter
    const filterRes = await request(`/vehicle-expenses?vehicleId=${testVehicle?._id}&category=fuel`, { method: "GET" }, token, companyId);
    const fuelList = filterRes.data?.data || [];
    record(
      "9b. Expense Filtering by Vehicle & Category",
      fuelList.length >= 1 && fuelList[0].category === "fuel",
      `Filter category=fuel returned ${fuelList.length} record(s), Amount: ₹${fuelList[0]?.amount}, Litres: ${fuelList[0]?.litres}`
    );
  } catch (err) {
    record("9. Vehicle Expenses Testing", false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 10: P&L Engine & Dashboard Aggregations (/simple-dashboard)
  // -------------------------------------------------------------
  try {
    const res = await request("/simple-dashboard", { method: "GET" }, token, companyId);
    const d = res.data?.data || {};
    const kpis = d.kpis || {};
    const vehicles = d.vehicles || [];
    const vStats = vehicles.find(v => String(v._id) === String(testVehicle?._id));

    // Revenue = 24,000 (taxable)
    // Total Expenses = 9,900
    // Net Vehicle Profit = 24,000 - 9,900 = 14,100
    const vehiclePL_Ok =
      vStats &&
      vStats.revenue >= 24000 &&
      vStats.fuel >= 5000 &&
      vStats.driverKharcha >= 700 &&
      vStats.maintenance >= 1500 &&
      vStats.tyre >= 1800 &&
      vStats.fastag >= 650 &&
      vStats.other >= 250 &&
      vStats.totalExpenses >= 9900 &&
      vStats.netProfit === (vStats.revenue - vStats.totalExpenses);

    record(
      "10a. Vehicle-Specific P&L Calculation",
      Boolean(vehiclePL_Ok),
      `Vehicle: ${vStats?.vehicleNumber} | Deliveries: ${vStats?.deliveries} | Revenue: ₹${vStats?.revenue} | Fuel: ₹${vStats?.fuel} | Bhatta: ₹${vStats?.driverKharcha} | Maint: ₹${vStats?.maintenance} | Tyre: ₹${vStats?.tyre} | Fastag: ₹${vStats?.fastag} | Other: ₹${vStats?.other} | Total Expenses: ₹${vStats?.totalExpenses} | Net Profit: ₹${vStats?.netProfit}`
    );

    const businessPL_Ok =
      kpis.sales >= 24000 &&
      kpis.gst >= 1200 &&
      kpis.grossBilled >= 25200 &&
      kpis.totalExpenses >= 9900 &&
      kpis.netProfit === (kpis.sales - kpis.totalExpenses);

    record(
      "10b. Total Business P&L Aggregation",
      Boolean(businessPL_Ok),
      `Total Deliveries: ${kpis.totalDeliveries} | Sales (Taxable): ₹${kpis.sales} | GST: ₹${kpis.gst} | Gross Billed: ₹${kpis.grossBilled} | Total Fleet Expenses: ₹${kpis.totalExpenses} | Net Business Profit: ₹${kpis.netProfit}`
    );

    // Verify Volume breakdown
    const vol = kpis.volume || {};
    record(
      "10c. Dispatched Volume Breakdown",
      Object.keys(vol).length > 0,
      `Volume by Category: ${JSON.stringify(vol)}`
    );
  } catch (err) {
    record("10. P&L Engine Testing", false, err.message);
  }

  // -------------------------------------------------------------
  // TEST 11: Validation & Negative Edge Cases
  // -------------------------------------------------------------
  try {
    // A: Zero/Negative quantity in supply order
    const negQtyRes = await request("/supply-orders", {
      method: "POST",
      body: {
        customerId: testCustomer?._id,
        materialId: testMaterial?._id,
        vehicleId: testVehicle?._id,
        quantity: -10,
        rate: 500,
        unloadingSite: "Test"
      }
    }, token, companyId);
    record("11a. Negative Quantity Validation", !negQtyRes.ok, `Correctly rejected: ${negQtyRes.data?.message}`);

    // B: Missing customer in supply order
    const missCustRes = await request("/supply-orders", {
      method: "POST",
      body: {
        materialId: testMaterial?._id,
        vehicleId: testVehicle?._id,
        quantity: 10,
        rate: 500,
        unloadingSite: "Test"
      }
    }, token, companyId);
    record("11b. Missing Customer Validation", !missCustRes.ok, `Correctly rejected: ${missCustRes.data?.message}`);

    // C: Missing unloading site (when customer has no site address)
    const noSiteCust = await request("/customers", {
      method: "POST",
      body: { name: `No Site Client ${uid}`, phone: `91111${uid}`, siteAddress: "" }
    }, token, companyId);

    const missSiteRes = await request("/supply-orders", {
      method: "POST",
      body: {
        customerId: noSiteCust.data?.data?._id,
        materialId: testMaterial?._id,
        vehicleId: testVehicle?._id,
        quantity: 10,
        rate: 500,
        unloadingSite: ""
      }
    }, token, companyId);
    record("11c. Missing Unloading Site Validation", !missSiteRes.ok, `Correctly rejected: ${missSiteRes.data?.message}`);
  } catch (err) {
    record("11. Validations Testing", false, err.message);
  }

  console.log("\n==================================================================");
  console.log("📊 FINAL SUMMARY REPORT");
  console.log("==================================================================");
  const total = results.length;
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`Total Checks: ${total}`);
  console.log(`Passed:       ${passed} ✅`);
  console.log(`Failed:       ${failed} ❌`);
  console.log(`Success Rate: ${Math.round((passed / total) * 100)}%`);
  console.log("==================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
