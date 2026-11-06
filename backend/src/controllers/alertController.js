const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const SupplyOrder = require("../models/SupplyOrder");
const Customer = require("../models/Customer");
const SystemSetting = require("../models/SystemSetting");
const Company = require("../models/Company");
const { SendVerificationCode } = require("../utils/sendMail");

const DOC_NAMES = {
  rc: "RC (पंजीकरण)",
  insurance: "Insurance (बीमा)",
  fitness: "Fitness (फिटनेस)",
  permit: "Permit (परमिट)",
  puc: "PUC (प्रदूषण)",
  roadTax: "Road Tax (रोड टैक्स)",
};

/**
 * Audit and fetch all alerts for the company
 */
const getAlertsData = async (companyId) => {
  const now = new Date();
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // 1. Audit Vehicles RTO Documents
  const vehicles = await Vehicle.find({ companyId, status: "active" })
    .populate("driverId", "name phone")
    .lean();

  const vehicleAlerts = [];
  vehicles.forEach((v) => {
    const checks = [
      { key: "rc", name: DOC_NAMES.rc, date: v.rcExpiryDate },
      { key: "insurance", name: DOC_NAMES.insurance, date: v.insuranceExpiryDate },
      { key: "fitness", name: DOC_NAMES.fitness, date: v.fitnessExpiryDate },
      { key: "permit", name: DOC_NAMES.permit, date: v.permitExpiryDate },
      { key: "puc", name: DOC_NAMES.puc, date: v.pucExpiryDate },
      { key: "roadTax", name: DOC_NAMES.roadTax, date: v.roadTaxExpiryDate },
    ];

    checks.forEach((c) => {
      if (!c.date) return;
      const d = new Date(c.date);
      const diffMs = d - now;
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (d < now) {
        vehicleAlerts.push({
          vehicleId: v._id,
          vehicleNumber: v.vehicleNumber,
          driverName: v.driverId?.name || "No Driver",
          docKey: c.key,
          docName: c.name,
          expiryDate: d,
          daysExpired: Math.abs(days),
          daysRemaining: days,
          status: "expired",
          severity: "critical",
        });
      } else if (d <= in30Days) {
        vehicleAlerts.push({
          vehicleId: v._id,
          vehicleNumber: v.vehicleNumber,
          driverName: v.driverId?.name || "No Driver",
          docKey: c.key,
          docName: c.name,
          expiryDate: d,
          daysRemaining: days,
          status: "expiring_soon",
          severity: days <= 7 ? "critical" : "warning",
        });
      }
    });
  });

  // 2. Audit Drivers DL Expiries
  const drivers = await Driver.find({ companyId, status: "active" })
    .populate("assignedVehicleId", "vehicleNumber")
    .lean();

  const driverAlerts = [];
  drivers.forEach((d) => {
    if (!d.licenseExpiryDate) return;
    const expDate = new Date(d.licenseExpiryDate);
    const diffMs = expDate - now;
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (expDate < now) {
      driverAlerts.push({
        driverId: d._id,
        driverName: d.name,
        phone: d.phone,
        licenseNumber: d.licenseNumber || "DL Not Recorded",
        assignedVehicle: d.assignedVehicleId?.vehicleNumber || "Unassigned",
        expiryDate: expDate,
        daysExpired: Math.abs(days),
        daysRemaining: days,
        status: "expired",
        severity: "critical",
      });
    } else if (expDate <= in30Days) {
      driverAlerts.push({
        driverId: d._id,
        driverName: d.name,
        phone: d.phone,
        licenseNumber: d.licenseNumber || "DL Not Recorded",
        assignedVehicle: d.assignedVehicleId?.vehicleNumber || "Unassigned",
        expiryDate: expDate,
        daysRemaining: days,
        status: "expiring_soon",
        severity: days <= 7 ? "critical" : "warning",
      });
    }
  });

  // 3. Customer Outstanding Dues
  const unpaidOrders = await SupplyOrder.find({
    companyId,
    balanceDue: { $gt: 0 },
  })
    .populate("customerId", "name phone")
    .sort({ balanceDue: -1 })
    .lean();

  const customerDueMap = {};
  let totalDueAmount = 0;

  unpaidOrders.forEach((o) => {
    const cId = o.customerId?._id?.toString() || "unknown";
    const cName = o.customerId?.name || "Unknown Customer";
    const cPhone = o.customerId?.phone || "";
    const due = Math.round(Number(o.balanceDue || 0));
    totalDueAmount += due;

    if (!customerDueMap[cId]) {
      customerDueMap[cId] = {
        customerId: cId,
        customerName: cName,
        phone: cPhone,
        totalDue: 0,
        orderCount: 0,
      };
    }
    customerDueMap[cId].totalDue += due;
    customerDueMap[cId].orderCount += 1;
  });

  const customerDues = Object.values(customerDueMap).sort(
    (a, b) => b.totalDue - a.totalDue
  );

  // 4. SMTP Configuration Status
  const sysSettings = await SystemSetting.findOne({ key: "global_settings" }).lean();
  const smtpUser = sysSettings?.smtpUser || process.env.SMTP_USER || "";
  const hasSmtpPass = Boolean(
    sysSettings?.smtpPass || (process.env.SMTP_PASS && !process.env.SMTP_PASS.includes("your-"))
  );
  const isSmtpConfigured = Boolean(
    smtpUser &&
      !smtpUser.includes("example.com") &&
      hasSmtpPass
  );

  const criticalCount =
    vehicleAlerts.filter((a) => a.severity === "critical").length +
    driverAlerts.filter((a) => a.severity === "critical").length;

  const warningCount =
    vehicleAlerts.filter((a) => a.severity === "warning").length +
    driverAlerts.filter((a) => a.severity === "warning").length;

  return {
    criticalCount,
    warningCount,
    vehicleAlerts,
    driverAlerts,
    customerDues: customerDues.slice(0, 8),
    totalDueAmount,
    totalUnpaidOrders: unpaidOrders.length,
    smtpStatus: {
      isConfigured: isSmtpConfigured,
      smtpHost: sysSettings?.smtpHost || process.env.SMTP_HOST || "smtp.gmail.com",
      smtpPort: sysSettings?.smtpPort || Number(process.env.SMTP_PORT || 465),
      smtpUser: isSmtpConfigured ? smtpUser : "",
      smtpFromEmail: sysSettings?.smtpFromEmail || process.env.SMTP_FROM_EMAIL || smtpUser || "",
    },
  };
};

/**
 * GET /api/alerts
 */
exports.getAlerts = async (req, res) => {
  try {
    const data = await getAlertsData(req.user.companyId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get alerts error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load alerts",
      error: error.message,
    });
  }
};

/**
 * POST /api/alerts/send-email
 * Dispatch complete alert audit summary to Gmail via SMTP
 */
exports.sendAlertEmail = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const company = await Company.findById(companyId);
    const sysSettings = await SystemSetting.findOne({ key: "global_settings" }).lean();
    
    // Safely resolve recipient without throwing if req.body is undefined
    const recipient =
      (req.body && req.body.recipientEmail) ||
      sysSettings?.smtpUser ||
      process.env.SMTP_USER ||
      req.user?.email;

    const isSmtpConfigured = Boolean(
      (sysSettings?.smtpHost && sysSettings?.smtpUser && sysSettings?.smtpPass) ||
      (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
    );

    if (!isSmtpConfigured) {
      return res.status(400).json({
        success: false,
        message: "Gmail SMTP is not configured yet. Please configure your Gmail ID and App Password in Settings & SMTP (/settings).",
      });
    }

    if (!recipient) {
      return res.status(400).json({
        success: false,
        message: "No recipient email address specified or configured.",
      });
    }

    const alerts = await getAlertsData(companyId);
    const companyName = company?.name || "Shri Shyam Bricks & Building Materials";
    const todayStr = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const formatINR = (val) => "₹ " + Number(val || 0).toLocaleString("en-IN");

    // Build Vehicle Alerts HTML Rows
    const vehicleRows = alerts.vehicleAlerts.map(
      (a) => `
      <tr style="border-bottom: 1px solid #fee2e2; background: ${a.status === "expired" ? "#fef2f2" : "#fffbeb"};">
        <td style="padding: 10px 12px; font-weight: bold; font-family: monospace; color: #1e293b;">${a.vehicleNumber}</td>
        <td style="padding: 10px 12px; font-weight: 600; color: #334155;">${a.docName}</td>
        <td style="padding: 10px 12px; color: #64748b;">${new Date(a.expiryDate).toLocaleDateString("en-IN")}</td>
        <td style="padding: 10px 12px;">
          ${
            a.status === "expired"
              ? `<span style="background: #ef4444; color: #ffffff; padding: 3px 8px; border-radius: 999px; font-weight: bold; font-size: 11px;">EXPIRED (${a.daysExpired}d ago)</span>`
              : `<span style="background: #f59e0b; color: #ffffff; padding: 3px 8px; border-radius: 999px; font-weight: bold; font-size: 11px;">EXPIRES IN ${a.daysRemaining}d</span>`
          }
        </td>
      </tr>
    `
    ).join("");

    // Build Driver Alerts HTML Rows
    const driverRows = alerts.driverAlerts.map(
      (a) => `
      <tr style="border-bottom: 1px solid #fee2e2; background: ${a.status === "expired" ? "#fef2f2" : "#fffbeb"};">
        <td style="padding: 10px 12px; font-weight: bold; color: #1e293b;">${a.driverName}</td>
        <td style="padding: 10px 12px; font-family: monospace; color: #475569;">${a.licenseNumber}</td>
        <td style="padding: 10px 12px; color: #64748b;">${new Date(a.expiryDate).toLocaleDateString("en-IN")}</td>
        <td style="padding: 10px 12px;">
          ${
            a.status === "expired"
              ? `<span style="background: #ef4444; color: #ffffff; padding: 3px 8px; border-radius: 999px; font-weight: bold; font-size: 11px;">DL EXPIRED (${a.daysExpired}d ago)</span>`
              : `<span style="background: #f59e0b; color: #ffffff; padding: 3px 8px; border-radius: 999px; font-weight: bold; font-size: 11px;">EXPIRES IN ${a.daysRemaining}d</span>`
          }
        </td>
      </tr>
    `
    ).join("");

    // Build Customer Due Rows
    const dueRows = alerts.customerDues.map(
      (c) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 12px; font-weight: bold; color: #1e293b;">${c.customerName}</td>
        <td style="padding: 10px 12px; color: #64748b; font-family: monospace;">${c.phone || "—"}</td>
        <td style="padding: 10px 12px; font-weight: bold; color: #dc2626;">${formatINR(c.totalDue)}</td>
        <td style="padding: 10px 12px; color: #64748b;">${c.orderCount} Orders</td>
      </tr>
    `
    ).join("");

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1c1917 0%, #431407 100%); padding: 24px; border-radius: 12px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #fdba74;">
            ${companyName}
          </h1>
          <p style="margin: 6px 0 0; font-size: 13px; color: #fed7aa; font-weight: 600;">
            Fleet RTO Compliance &amp; Dues Alert Digest • ${todayStr}
          </p>
        </div>

        <!-- Metric Cards -->
        <div style="display: table; width: 100%; margin-top: 20px; border-spacing: 10px 0;">
          <div style="display: table-cell; width: 33%; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 14px; text-align: center;">
            <p style="font-size: 26px; font-weight: 900; color: #dc2626; margin: 0;">${alerts.criticalCount}</p>
            <p style="font-size: 11px; font-weight: 700; color: #991b1b; text-transform: uppercase; margin: 4px 0 0;">Critical / Expired</p>
          </div>
          <div style="display: table-cell; width: 33%; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 14px; text-align: center;">
            <p style="font-size: 26px; font-weight: 900; color: #d97706; margin: 0;">${alerts.warningCount}</p>
            <p style="font-size: 11px; font-weight: 700; color: #92400e; text-transform: uppercase; margin: 4px 0 0;">Expiring Soon (&lt;30d)</p>
          </div>
          <div style="display: table-cell; width: 33%; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px; text-align: center;">
            <p style="font-size: 20px; font-weight: 900; color: #16a34a; margin: 0;">${formatINR(alerts.totalDueAmount)}</p>
            <p style="font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; margin: 4px 0 0;">Total Pending Due</p>
          </div>
        </div>

        <!-- Section 1: Vehicle Documents -->
        ${
          alerts.vehicleAlerts.length > 0
            ? `
          <div style="margin-top: 28px;">
            <h3 style="font-size: 14px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin: 0 0 10px; letter-spacing: 0.5px;">
              🚛 Vehicle RTO Documents Due / Expired (${alerts.vehicleAlerts.length})
            </h3>
            <div style="border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
              <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
                <thead>
                  <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569;">
                    <th style="padding: 10px 12px;">Truck Number</th>
                    <th style="padding: 10px 12px;">Document</th>
                    <th style="padding: 10px 12px;">Expiry Date</th>
                    <th style="padding: 10px 12px;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${vehicleRows}
                </tbody>
              </table>
            </div>
          </div>
        `
            : ""
        }

        <!-- Section 2: Driver Licenses -->
        ${
          alerts.driverAlerts.length > 0
            ? `
          <div style="margin-top: 28px;">
            <h3 style="font-size: 14px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin: 0 0 10px; letter-spacing: 0.5px;">
              👤 Driver Driving Licenses Due / Expired (${alerts.driverAlerts.length})
            </h3>
            <div style="border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
              <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
                <thead>
                  <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569;">
                    <th style="padding: 10px 12px;">Driver Name</th>
                    <th style="padding: 10px 12px;">DL Number</th>
                    <th style="padding: 10px 12px;">Expiry Date</th>
                    <th style="padding: 10px 12px;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${driverRows}
                </tbody>
              </table>
            </div>
          </div>
        `
            : ""
        }

        <!-- Section 3: Customer Outstanding Dues -->
        ${
          alerts.customerDues.length > 0
            ? `
          <div style="margin-top: 28px;">
            <h3 style="font-size: 14px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin: 0 0 10px; letter-spacing: 0.5px;">
              💰 Top Outstanding Customer Dues (बाकी राशि)
            </h3>
            <div style="border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
              <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
                <thead>
                  <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569;">
                    <th style="padding: 10px 12px;">Customer Name</th>
                    <th style="padding: 10px 12px;">Phone</th>
                    <th style="padding: 10px 12px;">Pending Due</th>
                    <th style="padding: 10px 12px;">Dispatches</th>
                  </tr>
                </thead>
                <tbody>
                  ${dueRows}
                </tbody>
              </table>
            </div>
          </div>
        `
            : ""
        }

        <!-- Footer -->
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px;">
          <p style="margin: 0;">Sent via Shri Shyam Bricks Automated Alert Control Tower</p>
          <p style="margin: 3px 0 0;">Logged in as: ${req.user.name} (${req.user.email})</p>
        </div>
      </div>
    `;

    const subject =
      alerts.criticalCount > 0
        ? `🚨 [CRITICAL ALERT] ${alerts.criticalCount} Documents Expired — ${companyName} (${todayStr})`
        : `⚠️ [ALERT] Fleet Documents & Payment Digest — ${companyName} (${todayStr})`;

    await SendVerificationCode(
      recipient,
      emailHtml,
      subject,
      `Fleet Alert Digest: ${alerts.criticalCount} Critical Expired, ${alerts.warningCount} Expiring Soon, Total Due: ${formatINR(alerts.totalDueAmount)}`,
      company
    );

    return res.status(200).json({
      success: true,
      message: `Alert digest email sent successfully to ${recipient}`,
    });
  } catch (error) {
    console.error("Send alert email error:", error);
    return res.status(500).json({
      success: false,
      message: error.message.includes("SMTP is not configured")
        ? "Gmail SMTP is not configured yet. Please enter your Gmail ID and App Password in Settings & SMTP (/settings)."
        : error.message.includes("Invalid login") || error.message.includes("Username and Password not accepted")
        ? "Gmail login failed. Please verify your Gmail ID and 16-character App Password in Settings & SMTP (/settings)."
        : "Failed to send alert email: " + error.message,
      error: error.message,
    });
  }
};

/**
 * POST /api/alerts/configure-smtp
 * Save Gmail SMTP settings and send instant verification email
 */
exports.configureSmtp = async (req, res) => {
  try {
    const { smtpUser, smtpPass, smtpFromEmail, testRecipient } = req.body;

    if (!smtpUser || !smtpUser.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Valid Gmail email address is required (e.g. yourname@gmail.com)",
      });
    }

    if (!smtpPass || !smtpPass.trim()) {
      return res.status(400).json({
        success: false,
        message: "Google 16-character App Password is required",
      });
    }

    let settings = await SystemSetting.findOne({ key: "global_settings" });
    if (!settings) {
      settings = new SystemSetting({ key: "global_settings" });
    }

    settings.smtpHost = "smtp.gmail.com";
    settings.smtpPort = 465;
    settings.smtpUser = smtpUser.trim();
    settings.smtpPass = smtpPass.trim().replace(/\s+/g, ""); // remove spaces from 16-char app pass
    settings.smtpFromEmail = (smtpFromEmail || smtpUser).trim();

    await settings.save();

    // Send a test email to verify Gmail credentials
    const recipient = testRecipient || smtpUser.trim();
    const testHtml = `
      <div style="font-family: Arial, sans-serif; padding: 24px; border: 1px solid #bbf7d0; border-radius: 12px; background: #f0fdf4;">
        <h2 style="color: #16a34a; margin-top: 0;">🎉 Gmail SMTP Connected Successfully!</h2>
        <p style="color: #166534; font-size: 14px;">
          Your Gmail SMTP integration is now active on <strong>Shri Shyam Bricks &amp; Building Materials</strong>.
        </p>
        <p style="color: #334155; font-size: 13px;">
          All automated fleet compliance warnings, document expiry reminders, and payment due alerts will now be dispatched directly to your inbox.
        </p>
        <hr style="border: none; border-top: 1px solid #bbf7d0; margin: 18px 0;" />
        <small style="color: #64748b;">Sender: ${settings.smtpUser} • Connected at ${new Date().toLocaleString("en-IN")}</small>
      </div>
    `;

    await SendVerificationCode(
      recipient,
      testHtml,
      "✅ Shri Shyam Bricks: Gmail SMTP Integration Verified",
      "Gmail SMTP Connected Successfully!"
    );

    return res.status(200).json({
      success: true,
      message: `Gmail SMTP connected and verification test email sent to ${recipient}!`,
    });
  } catch (error) {
    console.error("Configure SMTP error:", error);
    return res.status(400).json({
      success: false,
      message: "SMTP authentication failed: " + error.message,
    });
  }
};

