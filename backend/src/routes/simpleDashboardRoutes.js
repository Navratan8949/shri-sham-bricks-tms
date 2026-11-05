const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { getSummary } = require("../controllers/simpleDashboardController");
router.use(auth);
router.get("/", getSummary);
module.exports = router;
