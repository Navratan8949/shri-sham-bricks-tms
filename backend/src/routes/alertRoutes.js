const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const alertController = require("../controllers/alertController");

router.use(auth);

// GET active alerts (Vehicles, Drivers, Customer Dues, SMTP status)
router.get("/", alertController.getAlerts);

// POST send alert digest email via Gmail SMTP
router.post("/send-email", alertController.sendAlertEmail);

// POST configure Gmail SMTP & send verification email
router.post("/configure-smtp", alertController.configureSmtp);

module.exports = router;

