const roles = {
  admin: ["super_admin"],
  operations: ["super_admin"],
  write: ["super_admin"],
  finance: ["super_admin"],
  read: ["super_admin"],
};

const f = (name, label, type = "text", extra = {}) => ({
  name,
  label,
  type,
  ...extra,
});
const select = (name, label, options, extra = {}) =>
  f(name, label, "select", {
    options: options.map((v) =>
      typeof v === "object" && v !== null && v.value
        ? v
        : {
            label: String(v).replaceAll("_", " "),
            value: v,
          },
    ),
    ...extra,
  });
const ref = (name, label, resource, extra = {}) =>
  f(name, label, "select", { ref: resource, ...extra });
const status = (extra = {}) =>
  select("status", "Status", ["active", "inactive"], {
    defaultValue: "active",
    ...extra,
  });

export const resources = {
  companies: {
    key: "companies",
    title: "Company Settings & Profile",
    singular: "Company",
    endpoint: "/companies",
    fields: [
      f("logo", "Logo", "file", { accept: "image/png,image/jpeg,image/webp" }),
      f("name", "Company Name", "text", { required: true }),
      f("code", "Company Code", "text", { required: true }),
      f("email", "Official Email", "email", {
        placeholder: "shrishyambricksco@gmail.com",
      }),
      f("phone", "Official Phone / Helpline", "text", {
        placeholder: "+91 98290 12345",
      }),
      f("address", "Official Registered Address", "textarea", {
        placeholder: "Plot No 14, Shri Shyam Kiln Complex, Tonk Road, Sanganer",
      }),
      f("city", "City", "text", { placeholder: "Jaipur" }),
      f("state", "State", "text", { placeholder: "Rajasthan" }),
      f("gstNumber", "GST Number"),
      f("panNumber", "PAN Number"),
      status(),
    ],
    searchKeys: ["name", "code", "city", "gstNumber", "panNumber"],
    filterKeys: ["status"],
    roles: ["super_admin"],
    canCreate: ["super_admin"],
    canEdit: ["super_admin"],
    canDelete: ["super_admin"],
  },
  drivers: {
    key: "drivers",
    title: "Drivers",
    singular: "Driver",
    endpoint: "/drivers",
    fields: [
      f("name", "Full Name", "text", {
        required: true,
        placeholder: "Enter driver name",
      }),
      f("phone", "Mobile Number", "text", {
        required: true,
        placeholder: "10 digit mobile",
      }),
      f("alternatePhone", "Alternate Mobile", "text", {
        placeholder: "Alternate mobile number",
      }),
      ref("assignedVehicleId", "Assigned Vehicle", "vehicles", {
        placeholder: "-- Select Vehicle --",
      }),
      f("address", "Current Address", "textarea", {
        placeholder: "Current address...",
      }),
      // Identity & License
      f("licenseNumber", "License Number", "text", {
        section: "Identity & License",
        placeholder: "Enter license number",
      }),
      f("licenseExpiryDate", "License Expiry", "date"),
      f("aadhaarNumber", "Aadhar Number", "text", {
        placeholder: "12-digit Aadhar number",
      }),
      // Payroll & Employment
      f("monthlySalary", "Monthly Salary", "number", {
        required: true,
        section: "Payroll & Employment",
        placeholder: "0.00",
        defaultValue: 10000,
      }),
      select(
        "dutyStatus",
        "Duty Status",
        ["On Duty", "Off Duty", "On Leave", "Resigned"],
        { required: true, defaultValue: "On Duty" },
      ),
      f("dateOfJoining", "Joining Date", "date"),
      // Documents & Photos
      f("photo", "Photo", "file", {
        section: "Documents & Photos",
        accept: "image/*",
      }),
      f("licenseScan", "License Scan", "file", {
        accept: "application/pdf,image/*",
      }),
      f("aadharScan", "Aadhar Scan", "file", {
        accept: "application/pdf,image/*",
      }),
      f("notes", "Notes", "textarea", {
        placeholder: "Any background notes...",
      }),
    ],
    searchKeys: [
      "name",
      "phone",
      "alternatePhone",
      "licenseNumber",
      "aadhaarNumber",
    ],
    filterKeys: ["dutyStatus", "status"],
    roles: roles.read,
    canCreate: roles.write,
    canEdit: roles.write,
    canDelete: roles.write,
  },
  vehicles: {
    key: "vehicles",
    title: "Vehicles",
    singular: "Vehicle",
    endpoint: "/vehicles",
    fields: [
      select(
        "ownerType",
        "Vehicle Ownership",
        [
          { label: "🏢 Company Fleet (Own Truck)", value: "own" },
          { label: "🚚 Market Lorry (Vendor Truck)", value: "market" },
        ],
        { defaultValue: "own" },
      ),
      f("vehicleNumber", "Vehicle Number", "text", {
        required: true,
        placeholder: "MH01AB1234",
      }),
      f("vendorName", "Vendor / Transporter Name", "text", {
        placeholder: "e.g. Syndiket Trp / Tarun Logistics / Suresh Jat",
        helperText: "Enter truck owner, broker, or transporter name",
      }),
      f("ownerPhone", "Vendor / Owner Mobile", "text", {
        placeholder: "10-digit mobile number",
        helperText: "Owner or driver mobile number",
      }),
      f("vehicleName", "Vehicle Name", "text", {
        required: false,
        placeholder: "e.g. Tata 407",
      }),
      ref("driverId", "Assigned Driver", "drivers", {
        placeholder: "-- Select Assigned Driver --",
        helperText: "Primary driver assigned to this truck (auto-fills on trip creation)",
      }),
      select(
        "vehicleType",
        "Vehicle Type",
        [
          "Truck",
          "Container",
          "Trailer",
          "Tanker",
          "Open Body",
          "Other Commercial",
        ],
        { required: true },
      ),
      f("model", "Model", "text", { placeholder: "e.g. 2022" }),
      f("chassisNumber", "Chassis Number", "text", {
        placeholder: "Chassis Number",
      }),
      f("engineNumber", "Engine Number", "text", {
        placeholder: "Engine Number",
      }),
      f("ownerName", "Owner Name", "text", { placeholder: "Owner Name" }),
      f("payloadCapacity", "Capacity (Ton)", "number", {
        placeholder: "Capacity in Tons",
      }),
      select("fuelType", "Fuel Type", [
        "Diesel",
        "Petrol",
        "CNG",
        "Electric",
        "Other",
      ]),
      // Document & Compliance Expiry Dates
      f("rcExpiryDate", "RC Expiry Date", "date", {
        section: "Compliance & Document Details",
      }),
      f("insuranceExpiryDate", "Insurance Expiry", "date"),
      f("permitExpiryDate", "Permit Expiry", "date"),
      f("fitnessExpiryDate", "Fitness Expiry", "date"),
      f("pucExpiryDate", "PUC Expiry", "date"),
      f("rcDocument", "RC Book Scan / Copy", "file", {
        accept: "application/pdf,image/*",
        helperText: "Upload RC scan (PDF, JPG, PNG)",
      }),
      select("status", "Status", ["Active", "Inactive", "Under Maintenance"], {
        required: true,
        defaultValue: "Active",
      }),
      f("notes", "Notes", "textarea", { placeholder: "Any notes..." }),
    ],
    searchKeys: [
      "vehicleNumber",
      "vehicleName",
      "vehicleType",
      "model",
      "chassisNumber",
      "engineNumber",
      "ownerName",
      "vendorName",
      "ownerPhone",
    ],
    filterKeys: ["ownerType", "vehicleType", "fuelType", "status"],
    roles: roles.read,
    canCreate: roles.write,
    canEdit: roles.write,
    canDelete: roles.admin,
  },
  customers: {
    key: "customers",
    title: "Customer Master",
    singular: "Customer / Party",
    endpoint: "/customers",
    fields: [
      f("name", "Party / Customer Name", "text", {
        required: true,
        placeholder: "e.g. V-Trans / Western Carriers / Reliance Industries",
      }),
      f("contactPerson", "Key Contact Person", "text", {
        placeholder: "e.g. Mr. Rajesh Sharma (Logistics Head)",
      }),
      f("phone", "Primary Mobile", "text", {
        required: true,
        placeholder: "10-digit mobile number for WhatsApp & calls",
      }),
      f("alternatePhone", "Alternate Mobile / Phone", "text", {
        placeholder: "Office landline or alternate contact",
      }),
      f("email", "Billing Email", "email", {
        placeholder: "accounts@clientcompany.com",
      }),
      f("city", "City / Base Hub", "text", {
        required: true,
        placeholder: "e.g. Jaipur / Tonk / Ajmer / Sikar",
      }),
      f("state", "State", "text", {
        placeholder: "e.g. Rajasthan / Haryana / NCR",
      }),
      f("address", "Registered Address / Site", "textarea", {
        placeholder: "Office / Site delivery address for billing and bilty...",
      }),
      f("pincode", "PIN Code", "text", {
        placeholder: "6-digit PIN code",
      }),
      f("gstNumber", "GSTIN (GST Number)", "text", {
        placeholder: "15-digit GSTIN (e.g. 08AAAAA0000A1Z5)",
      }),
      f("panNumber", "PAN Number", "text", {
        placeholder: "10-digit PAN (e.g. AAAAA0000A)",
      }),
      f("bankName", "Bank Name", "text", {
        placeholder: "e.g. HDFC Bank, ICICI, SBI",
        advanced: true,
      }),
      f("accountNumber", "Bank Account No", "text", {
        placeholder: "Customer account number",
        advanced: true,
      }),
      f("ifscCode", "IFSC Code", "text", {
        placeholder: "Bank IFSC code",
        advanced: true,
      }),
      f("notes", "Remarks & Instructions", "textarea", {
        placeholder:
          "Delivery guidelines, container preferences, reporting requirements...",
      }),
    ],
    searchKeys: [
      "name",
      "contactPerson",
      "phone",
      "city",
      "state",
      "gstNumber",
    ],
    filterKeys: ["city", "state"],
    roles: roles.read,
    canCreate: roles.write,
    canEdit: roles.write,
    canDelete: roles.write,
  },
  vendors: {
    key: "vendors",
    title: "Vendors",
    singular: "Vendor",
    endpoint: "/vendors",
    fields: [
      f("vendorName", "Vendor Name", "text", {
        required: true,
        placeholder: "e.g. Syndiket Trp / Tarun Logistics / Anshu Cargo",
      }),
      f("phone", "Vendor Mobile", "text", {
        required: true,
        placeholder: "10-digit mobile number",
      }),
      f("city", "City / Base Hub", "text", {
        placeholder: "e.g. Jaipur / Tonk / Sanganer / Alwar",
      }),
      f("state", "State", "text", {
        placeholder: "e.g. Rajasthan",
      }),
      f("address", "Office Address", "textarea", {
        placeholder: "Vendor office or yard address...",
      }),
      status(),
      f("remarks", "Remarks / Notes", "textarea", {
        placeholder: "Vendor notes and terms...",
      }),
    ],
    searchKeys: ["vendorCode", "vendorName", "vendorType", "phone", "city"],
    filterKeys: ["vendorType", "status"],
    roles: roles.read,
    canCreate: roles.write,
    canEdit: roles.write,
    canDelete: roles.write,
  },
  fuels: {
    key: "fuels",
    title: "Fuel",
    singular: "Fuel Entry",
    endpoint: "/fuels",
    fields: [
      ref("vehicleId", "Vehicle", "vehicles", { required: true }),
      ref("driverId", "Driver", "drivers"),
      f("fuelDate", "Fuel Date", "date", { required: true }),
      select("fuelType", "Fuel Type", ["diesel", "petrol", "cng", "other"], {
        required: true,
      }),
      f("quantity", "Quantity (Liters)", "number", { required: true }),
      f("ratePerLiter", "Rate / Liter (₹)", "number", { required: true }),
      f("odometerReading", "Odometer Reading (KM)", "number", {
        hint: "Mileage (KM/L)",
        helperText: "Odometer reading at fuel station for KM/L fuel audit",
      }),
      f("fuelStationVendor", "Fuel Station / Vendor Name", "text", {
        hint: "e.g. Indian Oil / HPCL / BPCL / Reliance / Nayara",
        helperText: "Name of the fuel pump / station where fuel was filled",
      }),
      ref("tripId", "Trip / Challan", "trips", {
        hint: "Optional link to current trip",
      }),
      f("receiptNumber", "Receipt / Voucher Number"),
      select("paymentMode", "Payment Mode", [
        "cash",
        "driver_advance",
        "credit",
        "card",
        "upi",
        "company_account",
        "other",
      ]),
      f("notes", "Notes / Remarks", "textarea"),
    ],
    searchKeys: ["fuelType", "fuelStationVendor", "receiptNumber", "notes"],
    filterKeys: ["fuelType", "paymentMode"],
    roles: roles.read,
    canCreate: roles.write,
    canEdit: roles.write,
    canDelete: roles.write,
    dateKey: "fuelDate",
  },
  tyres: {
    key: "tyres",
    title: "Tyres",
    singular: "Tyre",
    endpoint: "/tyres",
    fields: [
      f("tyreNumber", "Tyre Number", "text", { required: true }),
      f("brand", "Brand", "text", { required: true }),
      f("tyreSize", "Tyre Size", "text", { required: true }),
      select("tyreType", "Tyre Type", ["new", "used", "retreaded"]),
      f("purchaseDate", "Purchase Date", "date"),
      f("purchasePrice", "Purchase Price", "number"),
      select("status", "Status", [
        "in_stock",
        "fitted",
        "removed",
        "repair",
        "retread",
        "scrapped",
      ]),
      ref("vehicleId", "Vehicle", "vehicles"),
      select("position", "Axle Position", [
        "front_left",
        "front_right",
        "rear_left",
        "rear_right",
        "rear_inner_left",
        "rear_outer_left",
        "rear_inner_right",
        "rear_outer_right",
        "spare",
      ]),
      f("fittingDate", "Fitting Date", "date"),
      f("fittingOdometer", "Fitting Odometer", "number"),
      f("remarks", "Remarks", "textarea"),
    ],
    searchKeys: ["tyreNumber", "brand", "tyreSize", "position"],
    filterKeys: ["tyreType", "status"],
    roles: roles.read,
    canCreate: roles.write,
    canEdit: roles.write,
    canDelete: roles.write,
    dateKey: "purchaseDate",
  },
  fastags: {
    key: "fastags",
    title: "FASTag Management",
    singular: "FASTag",
    endpoint: "/fastags",
    fields: [
      ref("vehicleId", "Assigned Tipper / Vehicle", "vehicles", {
        required: true,
        placeholder: "Select vehicle",
      }),
      f("tagId", "FASTag ID / Barcode", "text", {
        required: true,
        placeholder: "e.g. 607417-001-987654",
      }),
      select(
        "provider",
        "FASTag Issuer Bank / Provider",
        [
          "IDFC FIRST Bank",
          "ICICI Bank",
          "State Bank of India (SBI)",
          "Paytm Payments Bank",
          "Axis Bank",
          "Kotak Mahindra Bank",
          "Bank of Baroda",
          "HDFC Bank",
          "Airtel Payments Bank",
          "Punjab National Bank (PNB)",
          "Canara Bank",
          "Union Bank of India",
          "Bank of India",
          "Indian Bank",
          "Central Bank of India",
          "IndusInd Bank",
          "Yes Bank",
          "Federal Bank",
          "RBL Bank",
          "Bandhan Bank",
          "IDBI Bank",
          "India Post Payments Bank (IPPB)",
          "Fino Payments Bank",
          "Other",
        ],
        { required: true, defaultValue: "IDFC FIRST Bank" },
      ),
      f("accountNumber", "Wallet / Account Number", "text", {
        placeholder: "FASTag wallet / account number",
      }),
      f("currentBalance", "Current Balance (₹)", "number", {
        required: true,
        placeholder: "0.00",
        defaultValue: 1000,
      }),
      f("minBalanceThreshold", "Low Balance Warning Limit (₹)", "number", {
        placeholder: "500",
        defaultValue: 500,
      }),
      select(
        "status",
        "Tag Status",
        ["active", "low_balance", "blacklisted", "inactive", "closed"],
        { required: true, defaultValue: "active" },
      ),
      f("lastRechargeDate", "Last Recharge Date", "date"),
      f("lastRechargeAmount", "Last Recharge Amount (₹)", "number", {
        placeholder: "0.00",
      }),
      f("rechargeAmount", "Add Quick Recharge (+₹)", "number", {
        placeholder: "Enter amount to add to balance",
        helperText: "Auto-adds to balance & marks tag active",
      }),
      f("deductAmount", "Record Toll Deduction (-₹)", "number", {
        placeholder: "Enter toll fee to deduct",
        helperText: "Auto-deducts from balance & updates toll totals",
      }),
      f("monthlyTollExpense", "Avg Monthly Toll (₹)", "number", {
        placeholder: "0.00",
      }),
      f("remarks", "Remarks / Windshield Placement", "textarea", {
        placeholder: "Tag placement details, replacement notes...",
      }),
    ],
    searchKeys: ["tagId", "accountNumber", "provider", "remarks"],
    filterKeys: ["provider", "status"],
    roles: roles.read,
    canCreate: roles.write,
    canEdit: roles.write,
    canDelete: roles.write,
    dateKey: "lastRechargeDate",
  },
  maintenances: {
    key: "maintenances",
    title: "Maintenance",
    singular: "Maintenance",
    endpoint: "/maintenances",
    fields: [
      ref("vehicleId", "Vehicle", "vehicles", { required: true }),
      f("maintenanceDate", "Maintenance Date", "date", { required: true }),
      f("odometerReading", "Odometer Reading (KM)", "number", {
        required: true,
        placeholder: "Current speedometer KM",
        helperText:
          "Mandatory: Enter vehicle speedometer reading at time of service",
      }),
      select(
        "serviceType",
        "Service Type",
        [
          "general_service",
          "engine_oil",
          "engine_service",
          "brake_service",
          "clutch_work",
          "battery",
          "suspension",
          "electrical",
          "body_work",
          "tyre_work",
          "repair",
          "other",
        ],
        { required: true },
      ),
      f("description", "Work Description", "textarea", {
        placeholder: "Describe the repairs, oil grade, parts replaced, etc.",
      }),
      f("partsCost", "Parts Cost (₹)", "number", { placeholder: "0" }),
      f("labourCost", "Labour / Mechanic Cost (₹)", "number", {
        placeholder: "0",
      }),
      f("totalCost", "Total Service Cost (₹)", "number", {
        autoCalculated: true,
        placeholder: "0",
        helperText: "Auto-calculated: Parts Cost + Labour Cost",
      }),
      f("nextServiceDate", "Next Due Service Date", "date"),
      f("nextServiceOdometer", "Next Service Odometer (KM)", "number", {
        placeholder: "e.g. Current Odometer + 10,000 KM",
      }),
      select("paymentMode", "Payment Mode", [
        "cash",
        "driver_advance",
        "credit",
        "card",
        "upi",
        "company_account",
        "other",
      ]),
      f("invoiceNumber", "Garage Bill / Memo No", "text", {
        placeholder: "e.g. Garage Bill / Invoice No (BILL-4821)",
        helperText:
          "External bill or cash memo number issued by the garage/workshop",
      }),
      select("status", "Status", ["completed", "pending", "cancelled"]),
      f("remarks", "Remarks", "textarea"),
    ],
    searchKeys: ["serviceType", "description", "invoiceNumber"],
    filterKeys: ["serviceType", "paymentMode", "status"],
    roles: roles.read,
    canCreate: roles.write,
    canEdit: roles.write,
    canDelete: roles.write,
    dateKey: "maintenanceDate",
  },
  "vehicle-documents": {
    key: "vehicle-documents",
    title: "Vehicle Documents",
    singular: "Vehicle Document",
    endpoint: "/vehicle-documents",
    fields: [
      ref("vehicleId", "Vehicle / Truck", "vehicles", { required: true }),
      f("truckNumber", "Vehicle / Lorry No", "text", {
        placeholder: "Auto-synced from selected Vehicle",
      }),
      f("vendorName", "Vendor Name", "text", {
        placeholder: "Vendor name (for Market Lorry)",
      }),
      select(
        "documentType",
        "Document Type",
        [
          { label: "RC Book (Registration Certificate)", value: "rc" },
          { label: "Commercial Vehicle Insurance", value: "insurance" },
          { label: "Fitness Certificate", value: "fitness" },
          { label: "Permit (National / State)", value: "permit" },
          { label: "National Permit (All India)", value: "national_permit" },
          { label: "PUC (Pollution Certificate)", value: "puc" },
          { label: "Driver License (DL Copy)", value: "driver_license" },
          { label: "Vendor / Owner PAN Card", value: "pan_card" },
          { label: "TDS 194C Exemption Declaration", value: "tds_declaration" },
          { label: "Bank Details / Passbook / Cheque", value: "bank_passbook" },
          { label: "Other Document", value: "other" },
        ],
        { required: true },
      ),
      f("documentNumber", "Document Number", "text", { required: true }),
      f("issueDate", "Issue Date", "date"),
      f("expiryDate", "Expiry Date", "date", { required: true }),
      f("issuingAuthority", "Issuing Authority"),
      f("documentFile", "Document File (Scan / Photo)", "file", {
        accept: "image/png,image/jpeg,image/webp,application/pdf",
        helperText: "Upload RC, DL, Insurance, or Permit scan",
      }),
      select("status", "Status", ["active", "expired", "cancelled"], {
        defaultValue: "active",
      }),
      f("remarks", "Remarks", "textarea"),
    ],
    searchKeys: ["documentNumber", "documentType", "issuingAuthority"],
    filterKeys: ["documentType", "status"],
    roles: roles.read,
    canCreate: roles.write,
    canEdit: roles.write,
    canDelete: roles.write,
    dateKey: "expiryDate",
  },
  "customer-invoices": {
    key: "customer-invoices",
    title: "Customer Invoices",
    singular: "Customer Invoice",
    endpoint: "/customer-invoices",
    fields: [
      f("invoiceNumber", "INVOICE NO", "text", {
        placeholder: "Auto-generated (e.g. INV-SSBC-26-001)",
      }),
      f("invoiceDate", "BILL DATE", "date", { required: true }),
      ref("vehicleId", "LORRY / VEHICLE NO", "vehicles", { required: true }),
      f("customerName", "PARTY / BUILDER NAME", "text", {
        required: true,
        placeholder: "e.g. Manglam Buildtech Projects Ltd",
      }),
      f("containerSize", "BRICK GRADE / MATERIAL", "text", {
        placeholder: "1st Class Red Bricks, Fly Ash, Clay Pavers",
      }),
      f("quantity", "QUANTITY (PCS)", "number", {
        required: true,
        placeholder: "4000",
        helperText: "Total bricks supplied",
      }),
      f("freightRate", "BRICK RATE (₹/PC)", "number", {
        required: true,
        placeholder: "6.50",
        helperText: "Rate per piece (₹)",
      }),
      f("taxableAmount", "TAXABLE VALUE (₹)", "number", {
        helperText: "Auto: Quantity × Rate (₹)",
      }),
      f("taxPercent", "GST (%)", "number", {
        placeholder: "5",
        helperText: "GST % (e.g. 5% or 12%)",
      }),
      f("grandTotal", "GRAND TOTAL (₹)", "number", {
        helperText: "Total bill value including GST (₹)",
      }),
      f("advanceReceived", "ADVANCE / PAID (₹)", "number", {
        placeholder: "0",
        helperText: "Payment received from party",
      }),
      f("outstandingAmount", "BALANCE DUE (₹)", "number", {
        helperText: "Pending balance to be collected",
      }),
      f("fromLocation", "FROM (KILN)", "text", {
        placeholder: "e.g. Shri Shyam Kiln Complex, Tonk Road",
      }),
      f("toLocation", "TO (SITE)", "text", {
        placeholder: "e.g. Manglam Grand City Site, Jaipur",
      }),
      f("bankAccountName", "BANK ACCOUNT", "text", {
        placeholder: "e.g. HDFC / SBI / PNB",
      }),
      select("paymentStatus", "Payment Status", ["unpaid", "partial", "paid"]),
      select("status", "Status", ["draft", "issued", "cancelled"]),
      ref("tripId", "TRIP NO", "trips", { advanced: true }),
      ref("partyId", "PARTY MASTER LINK", "customers", { advanced: true }),
      f("remarks", "REMARKS / NOTES", "textarea", { advanced: true }),
    ],
    searchKeys: [
      "customerName",
      "invoiceNumber",
      "fromLocation",
      "toLocation",
      "bankAccountName",
      "containerSize",
    ],
    filterKeys: ["paymentStatus", "status"],
    roles: roles.finance,
    canCreate: roles.finance,
    canEdit: roles.finance,
    canDelete: roles.admin,
    dateKey: "invoiceDate",
  },
  "vendor-bills": {
    key: "vendor-bills",
    title: "Market Lorry AC",
    singular: "Market Lorry Entry",
    endpoint: "/vendor-bills",
    fields: [
      f("billDate", "DATE", "date", { required: true }),
      ref("vehicleId", "LORRY NO", "vehicles", {
        required: true,
        placeholder: "Select Lorry No (or + Add)",
      }),
      f("partyName", "PARTY NAME", "text", {
        placeholder: "e.g. Rajputana Builders / Sharma Construction",
      }),
      ref("vendorId", "VENDOR / OWNER", "vendors", {
        required: true,
        placeholder: "Select Vendor / Owner (or SELF)",
      }),
      f("containerSize", "BRICK GRADE / TRUCK", "text", {
        placeholder: "1st Class Red / Tipper 14 Wheeler",
      }),
      f("fromLocation", "FROM", "text", {
        placeholder: "e.g. Jaipur Kiln Depot / Tonk Road",
      }),
      f("toLocation", "TO", "text", {
        placeholder: "e.g. Ajmer Road / Sikar Site",
      }),
      f("deliveryDate", "DELIVERY", "date"),
      f("podDate", "POD", "text", {
        placeholder: "e.g. 21/01/2026 or Delivered",
      }),
      f("hireRate", "RATE (₹)", "number", {
        required: true,
        helperText: "Market Lorry Total Freight Rate (₹)",
      }),
      f("advanceDiesel", "ADV DIESEL (₹)", "number", {
        helperText: "Diesel Slip / Fuel Amount (e.g. 12000)",
      }),
      f("advanceCash", "ADV CASH (₹)", "number", {
        helperText: "Cash / Bank Advance (e.g. 15700)",
      }),
      f("paidAmount", "ADV / TOTAL PAID (₹)", "number", {
        helperText:
          "Total Paid (Advance + Balance). Poore payment ke liye yahan 40000 dalein ya Payment Status 'paid' karein.",
      }),
      f("advanceDate", "ADV / PAYMENT DATE", "date"),
      f("outstandingAmount", "BALANCE DUE (₹)", "number", {
        readOnly: true,
        helperText: "Auto: RATE - TOTAL PAID",
      }),
      f("billNumber", "Bill / Voucher No", "text", {
        advanced: true,
        placeholder: "Auto-generated",
      }),
      select("paymentStatus", "Payment Status", ["unpaid", "partial", "paid"], {
        advanced: true,
      }),
      select("status", "Bill Status", ["draft", "issued", "cancelled"], {
        advanced: true,
      }),
      ref("tripId", "TRIP NO", "trips", { advanced: true }),
      ref("advanceMemoId", "ADVANCE MEMO", "advance-memos", { advanced: true }),
      f("remarks", "REMARKS", "textarea", { advanced: true }),
    ],
    searchKeys: [
      "vehicleNumber",
      "partyName",
      "containerSize",
      "fromLocation",
      "toLocation",
      "billNumber",
    ],
    filterKeys: ["paymentStatus", "status"],
    roles: roles.finance,
    canCreate: roles.finance,
    canEdit: roles.finance,
    canDelete: roles.admin,
    dateKey: "billDate",
  },
  expenses: {
    key: "expenses",
    title: "Driver Expenses",
    singular: "Driver Expense",
    endpoint: "/expenses",
    fields: [
      f("expenseNumber", "Expense Number", "text", { required: true }),
      f("expenseDate", "Expense Date", "date", { required: true }),
      ref("driverId", "Driver (Search / Select)", "drivers", {
        required: true,
      }),
      ref("vehicleId", "Vehicle / Truck Number", "vehicles", {
        required: true,
      }),
      ref("tripId", "Trip Number (Optional)", "trips"),
      select(
        "category",
        "Expense Category",
        [
          "toll",
          "driver_bata",
          "urea",
          "rto_police",
          "loading_hammali",
          "weighbridge",
          "puncture_repair",
          "parking",
          "enroute_maintenance",
          "driver_advance",
          "tea_refreshment",
          "miscellaneous",
          "other",
        ],
        {
          required: true,
          helperText:
            "Note: Diesel slips are tracked in the dedicated 'Diesel & Fuel Slips' module for accurate liters and mileage.",
        },
      ),
      f("amount", "Expense Amount (₹)", "number", { required: true }),
      select(
        "paymentMode",
        "Paid Via",
        [
          "cash",
          "upi",
          "bank_transfer",
          "driver_advance_adjusted",
          "cheque",
          "other",
        ],
        { required: true },
      ),
      f("description", "Description / Expense Details", "textarea"),
      f("receiptNumber", "Bill / Slip / Receipt No."),
      f("vendorName", "Dhabha / Toll Plaza / Vendor Name"),
      f("attachment", "Attachment / Bill Photo"),
      select("status", "Status", ["active", "cancelled"], {
        defaultValue: "active",
      }),
      f("remarks", "Remarks", "textarea"),
    ],
    searchKeys: [
      "expenseNumber",
      "category",
      "description",
      "referenceNumber",
      "vendorName",
      "receiptNumber",
    ],
    filterKeys: ["category", "paymentMode", "status"],
    roles: roles.finance,
    canCreate: roles.finance,
    canEdit: roles.finance,
    canDelete: roles.finance,
    dateKey: "expenseDate",
  },
  "office-expenses": {
    key: "office-expenses",
    title: "Office Expenses",
    singular: "Office Expense",
    endpoint: "/office-expenses",
    fields: [
      f("expenseNumber", "Voucher / Expense No.", "text", { required: true }),
      f("expenseDate", "Expense Date", "date", { required: true }),
      f("staffName", "Staff / Person Name", "text", {
        placeholder: "e.g. Ramesh Bhai, Staff Clerk, Landlord",
      }),
      f("department", "Department / Role", "text", {
        placeholder: "e.g. Administration, Accounts, Pantry, Operations",
      }),
      f("paidTo", "Paid To / Beneficiary", "text", {
        placeholder: "Person, Landlord, Vendor or Shop name",
      }),
      select(
        "category",
        "Expense Category",
        [
          "salary",
          "staff_advance",
          "tea_refreshment",
          "pantry_kitchen",
          "office_rent",
          "electricity",
          "internet",
          "telephone",
          "stationery",
          "office_maintenance",
          "courier_postage",
          "software_subscription",
          "audit_accounting",
          "travel",
          "advertisement",
          "bank_charges",
          "legal",
          "tax",
          "miscellaneous",
          "other",
        ],
        { required: true },
      ),
      f("amount", "Amount (₹)", "number", { required: true }),
      select(
        "paymentMode",
        "Paid Via",
        ["cash", "upi", "bank_transfer", "cheque", "other"],
        { required: true },
      ),
      f("referenceNumber", "UPI Ref / Transaction / Cheque No."),
      f("receiptNumber", "Bill / Cash Memo / Voucher No."),
      f("description", "Description / Purpose", "textarea"),
      f("vendorName", "Shop / Vendor Name"),
      f("attachment", "Attachment / Bill Photo"),
      select("status", "Status", ["active", "cancelled"], {
        defaultValue: "active",
      }),
      f("remarks", "Remarks", "textarea"),
    ],
    searchKeys: [
      "expenseNumber",
      "staffName",
      "paidTo",
      "category",
      "description",
      "referenceNumber",
      "vendorName",
      "receiptNumber",
    ],
    filterKeys: ["category", "paymentMode", "status"],
    roles: roles.finance,
    canCreate: roles.finance,
    canEdit: roles.finance,
    canDelete: roles.finance,
    dateKey: "expenseDate",
  },
  trips: {
    key: "trips",
    title: "Trips",
    singular: "Trip",
    endpoint: "/trips",
    fields: [
      f("tripNumber", "Trip / Challan Number", "text", { required: true }),
      f("containerNumber", "Container Number", "text", {
        placeholder: "e.g. MSKU-582194-0",
        helperText: "Assigned marine container number",
      }),
      select("containerSize", "Container Size / Type", [
        "20_ft",
        "40_ft",
        "40_ft_hc",
        "45_ft",
        "open_top",
        "flat_rack",
        "other",
      ]),
      f("customsSealNumber", "Customs Bottle Seal No", "text", {
        placeholder: "e.g. BOTTLE-892184",
      }),
      f("shippingLine", "Shipping Line / Carrier", "text", {
        placeholder: "e.g. Maersk / MSC / Hapag",
      }),
      ref("vehicleId", "Vehicle / Truck Number", "vehicles", {
        required: true,
      }),
      ref("driverId", "Driver Name & Mobile", "drivers", {
        required: true,
      }),
      f("dispatchDate", "Dispatch / Loading Date", "date", {
        required: true,
      }),
      f("transitDays", "Transit Duration (Days)", "number", {
        placeholder: "e.g. 2, 3, 5 days",
      }),
      f("expectedDeliveryDate", "Expected Delivery Date", "date"),
      f("fromCity", "Loading Point / Origin", "text", {
        required: true,
        placeholder: "e.g. Jaipur Kiln Yard / Sanganer / Tonk",
      }),
      f("toCity", "Unloading Point / Destination", "text", {
        required: true,
        placeholder: "e.g. Ajmer Road Site / Jagatpura / Mansarovar",
      }),
      f("tripStartDate", "Trip Start", "date", { advanced: true }),
      f("deliveryDate", "Delivery Date", "date", { advanced: true }),
      f("startingOdometer", "Starting Odometer", "number", { advanced: true }),
      f("endingOdometer", "Ending Odometer", "number", { advanced: true }),
      f("partyName", "Customer / Party Name", "text", {
        placeholder: "e.g. V-Trans / TCI Freight",
      }),
      select("ownerType", "Vehicle Ownership", ["owned", "market"]),
      f("ownerName", "Lorry Owner / Transporter Name", "text", {
        placeholder: "e.g. SHRI SHYAM BRICKS / Transporter",
      }),
      f("rate", "Total Trip Freight (₹)", "number", {
        placeholder: "0",
      }),
      f("advanceAmount", "Advance Paid to Driver (₹)", "number", {
        placeholder: "0",
      }),
      f("advanceDate", "Advance Payment Date", "date", {
        advanced: true,
      }),
      f("balanceAmount", "Balance Freight Payable (₹)", "number", {
        placeholder: "0",
      }),
      f("podDate", "POD / Delivery Date", "date", {
        advanced: true,
      }),
      select(
        "status",
        "Status",
        [
          "planned",
          "dispatched",
          "in_transit",
          "delivered",
          "completed",
          "cancelled",
        ],
        { advanced: true },
      ),
    ],
    searchKeys: [
      "tripNumber",
      "containerNumber",
      "customsSealNumber",
      "shippingLine",
      "fromCity",
      "toCity",
      "status",
    ],
    filterKeys: ["status"],
    roles: ["super_admin"],
    canCreate: ["super_admin"],
    canEdit: ["super_admin"],
    canDelete: ["super_admin"],
    dateKey: "dispatchDate",
    rowActions: [
      {
        label: "LR / Bilty",
        icon: "FileText",
        hrefTemplate:
          "/lr-bilties?autoOpenAdd=true&vehicleId={vehicleId}&driverId={driverId}",
      },
    ],
  },

  "driver-trip-settlements": {
    key: "driver-trip-settlements",
    title: "Company Lorry Settlement",
    singular: "Company Lorry Entry",
    endpoint: "/driver-trip-settlements",
    fields: [
      f("settlementDate", "DATE", "date", { required: true }),
      ref("vehicleId", "LORRY NO", "vehicles", { required: true }),
      f("driverPhone", "DRIVER NO", "text", {
        placeholder: "Driver mobile number",
      }),
      ref("driverId", "DRIVER NAME", "drivers", { required: true }),
      f("partyName", "PARTY NAME", "text", {
        placeholder: "e.g. TCI SRICITY / VANAYA TRP",
      }),
      f("containerSize", "MC", "text", { placeholder: "22F, 20F, 40F, 32S" }),
      f("fromLocation", "FROM", "text", {
        placeholder: "e.g. BHIWANDI / SRICITY",
      }),
      f("toLocation", "TO", "text", {
        placeholder: "e.g. PONDICHERY / AHMADABAD",
      }),
      f("deliveryDate", "DELIVERY", "date"),
      f("podDate", "POD", "text", {
        placeholder: "e.g. 22/08/2026 or Delivered",
      }),
      f("startKm", "SKM", "number", {
        placeholder: "0",
        helperText: "Starting odometer KM",
      }),
      f("returnKm", "RKM", "number", {
        placeholder: "0",
        helperText: "Return odometer KM",
      }),
      f("totalKm", "TKM", "number", {
        readOnly: true,
        helperText: "Auto: RKM - SKM",
      }),
      f("rs", "RS", "number", {
        placeholder: "0",
        helperText: "Rate per KM / RS",
      }),
      f("advanceGiven", "ADV (₹)", "number", {
        required: true,
        placeholder: "0",
        helperText: "Advance given to lorry/driver",
      }),
      f("advanceDate", "ADV DATE", "date"),
      f("dieselExpense", "DISAL (₹)", "number", {
        placeholder: "0",
        helperText: "Diesel expense",
      }),
      f("dieselDate", "DISAL DATE", "date"),
      f("tollExpense", "TOLL (₹)", "number", {
        placeholder: "0",
        helperText: "Toll charges",
      }),
      f("tollDate", "TOLL DATE", "date"),
      f("accountAdvance", "AC (₹)", "number", {
        placeholder: "0",
        helperText: "Driver A/C / Daily Allowance",
      }),
      f("acDate", "AC DATE", "date"),
      f("totalDriverExpenditure", "TOTAL (₹)", "number", {
        readOnly: true,
        helperText: "Auto: DISAL + TOLL + AC",
      }),
      f("netPayableToDriver", "BALANCE (₹)", "number", {
        readOnly: true,
        helperText: "Auto: ADV - TOTAL",
      }),
      f("ureaExpense", "URIY/ (₹)", "number", {
        placeholder: "0",
        helperText: "Urea expense",
      }),
      f("policeRTOExpense", "RTO (₹)", "number", {
        placeholder: "0",
        helperText: "RTO / Border expense",
      }),
      f("extraExpense", "EXTRA (₹)", "number", {
        placeholder: "0",
        helperText: "Extra / repair expense",
      }),
      f("extraDate", "EXTRA DATE", "date"),
      f("finalAmount", "FINAL (₹)", "number", {
        readOnly: true,
        helperText: "Auto: TOTAL + EXTRA",
      }),
      ref("tripId", "TRIP NO", "trips", { advanced: true }),
      ref("advanceMemoId", "ADVANCE MEMO", "advance-memos", { advanced: true }),
      select(
        "settlementStatus",
        "STATUS / OK",
        ["draft", "verified", "paid_settled"],
        { advanced: true },
      ),
      select(
        "paymentMode",
        "Settlement Mode",
        ["cash", "upi", "bank_transfer", "adjusted"],
        { advanced: true },
      ),
      f("remarks", "REMARK", "textarea", { advanced: true }),
    ],
    searchKeys: ["voucherNumber", "partyName", "fromLocation", "toLocation"],
    filterKeys: ["settlementStatus", "paymentMode"],
    roles: roles.finance,
    canCreate: roles.finance,
    canEdit: roles.finance,
    canDelete: roles.admin,
    dateKey: "settlementDate",
  },
  products: {
    key: "products",
    title: "Material & Products Master (सामग्री रिकॉर्ड्स)",
    singular: "Material / Product",
    endpoint: "/products",
    fields: [
      f("name", "Material / Item Name", "text", {
        required: true,
        placeholder: "e.g. Red Clay Bricks (1st Class - अव्वल लाल ईंट)",
      }),
      f("code", "Item Code / SKU", "text", {
        placeholder: "e.g. BRK-RED-01, RAW-COL-01",
      }),
      select("category", "Material Category", [
        "Clay Bricks",
        "Fly Ash Bricks",
        "Concrete Blocks",
        "Pavers",
        "Fire Bricks",
        "Raw Material",
        "Fuel & Burning",
        "Other Materials",
      ]),
      select("grade", "Quality Grade / Class", [
        "1st Class (A-Grade / अव्वल)",
        "2nd Class (B-Grade / दोयम)",
        "3rd Class (Peela / पीला)",
        "Overburnt (Chatka / Kangar)",
        "Broken Bats (Tukda / Roda)",
        "Standard Industrial Grade",
        "Premium Heavy Duty",
        "Fine Clay Grade",
        "High GCV Coal Grade",
        "Standard Agricultural",
      ]),
      f("dimensions", "Dimensions / Size / Specs", "text", {
        placeholder: 'e.g. 9" x 4.25" x 2.75" or 60mm Zig-Zag',
      }),
      select("unit", "Unit of Measure (UOM)", [
        "Pieces",
        "Thousand",
        "MT",
        "Trolley",
        "Truckload",
        "Brass",
        "Bags",
        "Quintal",
      ]),
      f("standardRate", "Selling Rate / Standard Rate (₹)", "number", {
        required: true,
        placeholder: "7.50",
      }),
      f("purchaseRate", "Purchase / Cost Rate (₹)", "number", {
        placeholder: "5.20",
      }),
      f("currentStock", "Current Stock", "number", {
        placeholder: "0",
      }),
      f("minStockAlert", "Min Stock Alert Level", "number", {
        placeholder: "1000",
      }),
      f("storageLocation", "Kiln Yard / Storage Location", "text", {
        placeholder: "e.g. Chamber Yard 1, Coal Bunker, Sand Depot",
      }),
      f("defaultSupplier", "Default Supplier / Vendor", "text", {
        placeholder: "e.g. Mining Vendor, Coal Depot, Sand Supplier",
      }),
      f("hsnCode", "HSN / SAC Code", "text", { placeholder: "6901" }),
      f("gstRate", "GST Rate (%)", "number", { placeholder: "5" }),
      f("description", "Description & Instructions", "textarea"),
      status(),
    ],
    searchKeys: [
      "name",
      "code",
      "category",
      "grade",
      "dimensions",
      "storageLocation",
      "hsnCode",
    ],
    filterKeys: ["category", "grade", "unit", "status"],
    roles: roles.read,
    canCreate: roles.write,
    canEdit: roles.write,
    canDelete: roles.write,
  },
  "supply-orders": {
    key: "supply-orders",
    title: "Supply Orders (Brick Demand)",
    singular: "Supply Order",
    endpoint: "/supply-orders",
    fields: [
      f("soNumber", "ORDER NO", "text", {
        placeholder: "Auto-generated (e.g. SSB-SO-1001)",
      }),
      f("soDate", "ORDER DATE", "date", { required: true }),
      ref("partyId", "CUSTOMER / PARTY", "customers", { required: true }),
      f("partyName", "Customer / Party Name", "text", { required: true }),
      f("partyPhone", "Customer Mobile", "text", {
        placeholder: "10-digit mobile",
      }),
      ref("productId", "BRICK PRODUCT", "products"),
      f("productName", "Product / Brick Type", "text", {
        required: true,
        placeholder: "e.g. Red Clay Bricks (1st Class)",
      }),
      f("quantity", "ORDERED QTY", "number", {
        required: true,
        placeholder: "e.g. 10000",
      }),
      select("unit", "Unit", ["Pieces", "Thousand", "MT", "Truckload"]),
      f("rate", "RATE PER PIECE (₹)", "number", {
        required: true,
        placeholder: "7.50",
      }),
      f("totalAmount", "TOTAL AMOUNT (₹)", "number", {
        readOnly: true,
        helperText: "Auto: Qty × Rate",
      }),
      f("advanceReceived", "ADVANCE RECEIVED (₹)", "number", {
        placeholder: "0",
      }),
      select(
        "advancePaymentMode",
        "ADVANCE PAYMENT MODE",
        ["cash", "upi", "bank", "cheque", "none"],
        {
          defaultValue: "cash",
        },
      ),
      f("balanceAmount", "BALANCE DUE (₹)", "number", {
        readOnly: true,
      }),
      select("freightType", "FREIGHT TERMS", ["FOR", "EX_KILN"], {
        defaultValue: "FOR",
      }),
      f("deliverySite", "DELIVERY SITE ADDRESS", "text", {
        required: true,
        placeholder: "Construction site location / address",
      }),
      f("destinationCity", "DESTINATION CITY", "text", {
        placeholder: "e.g. Gurgaon / Delhi",
      }),
      f("siteContactPerson", "SITE IN-CHARGE / MUNSHI", "text", {
        placeholder: "Site Supervisor / Contractor Name",
      }),
      f("siteContactPhone", "SITE IN-CHARGE MOBILE", "text", {
        placeholder: "10-digit mobile number",
      }),
      f("expectedDeliveryDate", "DELIVERY DEADLINE", "date"),
      ref("vehicleId", "ASSIGNED VEHICLE", "vehicles"),
      ref("driverId", "ASSIGNED DRIVER", "drivers"),
      select(
        "status",
        "ORDER STATUS",
        ["pending", "partially_dispatched", "completed", "cancelled"],
        { defaultValue: "pending" },
      ),
      select("paymentStatus", "Payment Status", ["unpaid", "partial", "paid"], {
        defaultValue: "unpaid",
      }),
      f("dispatchedQuantity", "DISPATCHED QTY", "number", { readOnly: true }),
      f("pendingQuantity", "PENDING QTY", "number", { readOnly: true }),
      f("remarks", "REMARKS", "textarea"),
    ],
    searchKeys: [
      "soNumber",
      "partyName",
      "partyPhone",
      "deliverySite",
      "productName",
    ],
    filterKeys: ["status", "paymentStatus"],
    roles: roles.operations,
    canCreate: roles.write,
    canEdit: roles.write,
    canDelete: roles.admin,
    dateKey: "soDate",
  },
  "lr-bilties": {
    key: "lr-bilties",
    title: "LR / Bilty Register",
    singular: "LR / Bilty",
    endpoint: "/lr-bilties",
    fields: [
      f("lrNumber", "LR / BILTY NO", "text", {
        required: true,
        placeholder: "e.g. LR-1001",
      }),
      f("lrDate", "LR DATE", "date", { required: true }),
      ref("partyId", "CONSIGNOR / PARTY", "customers", { required: true }),
      f("consigneeName", "CONSIGNEE (RECEIVER)", "text", {
        required: true,
        placeholder: "Site receiver / party name",
      }),
      f("consigneeAddress", "DELIVERY SITE ADDRESS", "text", {
        placeholder: "Site delivery address",
      }),
      ref("vehicleId", "TRUCK / LORRY NO", "vehicles", { required: true }),
      ref("driverId", "DRIVER", "drivers"),
      f("article", "COMMODITY / BRICKS", "text", {
        placeholder: "e.g. Red Clay Bricks 1st Class",
      }),
      f("quantity", "QUANTITY", "number", { placeholder: "10000" }),
      f("unit", "UNIT", "text", { placeholder: "Pieces / Nos" }),
      f("freightRate", "FREIGHT RATE (₹)", "number"),
      f("advanceAmount", "ADVANCE PAID (₹)", "number"),
      f("balanceAmount", "BALANCE FREIGHT (₹)", "number"),
      select("freightBy", "FREIGHT TERMS", ["TBB", "PAID", "TO_PAY"], {
        defaultValue: "TBB",
      }),
      select("status", "BILTY STATUS", [
        "created",
        "dispatched",
        "delivered",
        "cancelled",
      ]),
      f("remarks", "REMARKS", "textarea"),
    ],
    searchKeys: ["lrNumber", "partyName", "consigneeName", "truckNumber"],
    filterKeys: ["status", "freightBy"],
    roles: roles.operations,
    canCreate: roles.write,
    canEdit: roles.write,
    canDelete: roles.admin,
    dateKey: "lrDate",
  },
};

export const groups = [
  {
    label: "Kiln Operations",
    items: [
      ["dashboard", "Dashboard", "LayoutDashboard"],
      ["vehicles", "Vehicles & Tippers", "Truck"],
      ["drivers", "Drivers Master", "User"],
      ["customers", "Party & Builders", "Users"],
      ["products", "Materials & Bricks", "Package"],
      ["supply-orders", "Supply Orders", "ClipboardList"],
      ["trips", "Trip Dispatch", "Route"],
      ["lr-bilties", "LR / Bilty", "FileText"],
      ["customer-invoices", "Customer Invoices", "ReceiptText"],
    ],
  },
  {
    label: "Market Fleet & Fuel",
    items: [
      ["vendor-bills", "Vendor Hire Bills", "WalletCards"],
      ["fuels", "Diesel & Fuel Slips", "Fuel"],
      ["fastags", "FASTag Management", "CreditCard"],
      ["tyres", "Tyre Management", "CircleDot"],
      // ["maintenances", "Repairs & Service", "Wrench"], // Hidden as client requested
    ],
  },
  {
    label: "Accounts & Financials",
    items: [
      ["expenses", "Driver Expenses", "ReceiptIndianRupee"],
      // ["loans", "Driver & Worker Loans", "HandCoins"], // Hidden as client requested
      ["office-expenses", "Kiln Office Expenses", "Building2"],
      ["profit-loss", "P&L Balance Sheet", "TrendingUp"],
      ["reports", "Business Reports", "FileBarChart2"],
    ],
  },
  {
    label: "Settings",
    items: [["settings", "Kiln Hub Settings", "SlidersHorizontal"]],
  },
];

export const reportConfigs = [
  {
    key: "profit",
    title: "Profit & Loss (P&L)",
    group: "Accounts",
    endpoint: "/accounts/profit-loss",
    kind: "table",
  },
  {
    key: "accounts-dashboard",
    title: "Accounts Dashboard",
    group: "Accounts",
    endpoint: "/accounts/dashboard",
    kind: "kpi",
  },
  {
    key: "customer-outstanding",
    title: "Customer Outstanding",
    group: "Accounts",
    endpoint: "/accounts/customer-outstanding",
    kind: "table",
  },
  {
    key: "vendor-outstanding",
    title: "Vendor Outstanding",
    group: "Accounts",
    endpoint: "/accounts/vendor-outstanding",
    kind: "table",
  },
  {
    key: "account-expenses",
    title: "Accounts Expenses",
    group: "Accounts",
    endpoint: "/accounts/expenses",
    kind: "table",
  },
  {
    key: "trip-dashboard",
    title: "Trip Dashboard",
    group: "Operations",
    endpoint: "/trip-reports/dashboard",
    kind: "kpi",
  },
  {
    key: "trip-profitability",
    title: "Trip Profitability",
    group: "Operations",
    endpoint: "/trip-reports/profitability",
    kind: "table",
  },
  {
    key: "vehicle-report",
    title: "Vehicle Report",
    group: "Operations",
    endpoint: "/trip-reports/vehicles",
    kind: "table",
  },
  {
    key: "driver-report",
    title: "Driver Report",
    group: "Operations",
    endpoint: "/driver-reports",
    kind: "table",
  },
  {
    key: "fuel-report",
    title: "Fuel Report",
    group: "Fleet",
    endpoint: "/fuel-reports",
    kind: "table",
  },
  {
    key: "fuel-efficiency",
    title: "Vehicle Fuel Efficiency",
    group: "Fleet",
    endpoint: "/fuel-reports/vehicle-efficiency",
    kind: "table",
  },
  /* Temporarily hidden - Maintenance reports
  {
    key: "maintenance-report",
    title: "Maintenance Report",
    group: "Fleet",
    endpoint: "/maintenance-reports",
    kind: "table",
  },
  {
    key: "vehicle-maintenance",
    title: "Vehicle Maintenance",
    group: "Fleet",
    endpoint: "/maintenance-reports/vehicle-maintenance",
    kind: "table",
  },
  */
  {
    key: "tyre-report",
    title: "Tyre Report",
    group: "Fleet",
    endpoint: "/tyre-reports",
    kind: "table",
  },
  {
    key: "vehicle-tyres",
    title: "Vehicle Tyres",
    group: "Fleet",
    endpoint: "/tyre-reports/vehicle-tyres",
    kind: "table",
  },
  {
    key: "expense-report",
    title: "Expense Report",
    group: "Expenses",
    endpoint: "/expense-reports",
    kind: "table",
  },
  {
    key: "expense-categories",
    title: "Expense Categories",
    group: "Expenses",
    endpoint: "/expense-reports/categories",
    kind: "table",
  },
];
