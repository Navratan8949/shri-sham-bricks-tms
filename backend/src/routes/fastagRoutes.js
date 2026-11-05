const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createFastag,
  getFastags,
  getFastagById,
  updateFastag,
  rechargeFastag,
  deductToll,
  deleteFastag,
} = require("../controllers/fastagController");

router.use(authMiddleware);

router.route("/").get(getFastags).post(createFastag);
router.post("/:id/recharge", rechargeFastag);
router.post("/:id/deduct-toll", deductToll);
router.route("/:id").get(getFastagById).put(updateFastag).delete(deleteFastag);

module.exports = router;
