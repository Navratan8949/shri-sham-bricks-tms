require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Company = require("../models/Company");
const SystemSetting = require("../models/SystemSetting");

async function seedSuperAdmin() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in .env");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully.");

    // 1. Ensure Default Company exists
    let company = await Company.findOne({
      $or: [{ code: "SSB" }, { name: "Shri Shyam Bricks" }],
    });

    if (!company) {
      console.log("Creating default Company: Shri Shyam Bricks...");
      company = await Company.create({
        name: "Shri Shyam Bricks",
        code: "SSB",
        email: "admin@shrishyambricks.com",
        phone: "+91 98290 12345",
        address: "Plot No 14, Shri Shyam Kiln Complex, Tonk Road, Sanganer",
        city: "Jaipur",
        state: "Rajasthan",
        status: "active",
      });
      console.log("Company created:", company.name, `(${company.code}) - ID: ${company._id}`);
    } else {
      console.log("Existing Company found:", company.name, `(${company.code}) - ID: ${company._id}`);
      if (company.status !== "active") {
        company.status = "active";
        await company.save();
        console.log("Company status set to active.");
      }
    }

    // 2. Ensure Super Admin User exists
    const email = "admin@shrishyambricks.com".toLowerCase().trim();
    const rawPassword = "admin@123";
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    let user = await User.findOne({ email });

    if (!user) {
      console.log("Creating Super Admin user...");
      user = await User.create({
        name: "Super Admin",
        email,
        phone: "+91 98290 12345",
        password: hashedPassword,
        role: "super_admin",
        companyId: company._id,
        status: "active",
      });
      console.log("Super Admin created successfully!");
    } else {
      console.log("Existing user found with email:", email, "- Updating password and status...");
      user.name = user.name || "Super Admin";
      user.password = hashedPassword;
      user.role = "super_admin";
      user.companyId = company._id;
      user.status = "active";
      await user.save();
      console.log("Super Admin updated successfully!");
    }

    // 3. Ensure System Settings exist
    let settings = await SystemSetting.findOne({ key: "global_settings" });
    if (!settings) {
      console.log("Creating default SystemSetting...");
      await SystemSetting.create({
        key: "global_settings",
        smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
        smtpPort: Number(process.env.SMTP_PORT || 587),
        smtpUser: "",
        smtpPass: "",
        smtpFromEmail: "",
      });
      console.log("Default SystemSetting created.");
    }

    console.log("\n==============================================");
    console.log(" SUPER ADMIN SETUP COMPLETE");
    console.log("==============================================");
    console.log(`Email:    ${email}`);
    console.log(`Password: ${rawPassword}`);
    console.log(`Role:     ${user.role}`);
    console.log(`Company:  ${company.name} (Code: ${company.code})`);
    console.log(`Status:   ${user.status}`);
    console.log("==============================================\n");

    await mongoose.disconnect();
    console.log("Database connection closed.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding Super Admin:", error);
    process.exit(1);
  }
}

seedSuperAdmin();

