const Material = require("../models/Material");
const DEFAULTS = [
  ["Rodi 10mm", "Ton", 5], ["Rodi 20mm", "Ton", 5], ["Rodi 40mm", "Ton", 5],
  ["Stone Dust", "Ton", 5], ["GSB", "Ton", 5], ["M-Sand", "Ton", 5], ["Bricks", "Pcs", 5]
];

exports.list = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const ops = DEFAULTS.map(([name, unit, gstRate]) => ({
      updateOne: { filter: { companyId, name }, update: { $setOnInsert: { companyId, name, unit, gstRate, defaultRate: 0, status: "active" } }, upsert: true }
    }));
    await Material.bulkWrite(ops);
    const data = await Material.find({ companyId }).sort({ name: 1 });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const data = await Material.create({ ...req.body, companyId: req.user.companyId });
    res.status(201).json({ success: true, data });
  } catch (e) { res.status(400).json({ success: false, message: e.code === 11000 ? "Material already exists" : e.message }); }
};

exports.update = async (req, res) => {
  try {
    const data = await Material.findOneAndUpdate({ _id: req.params.id, companyId: req.user.companyId }, req.body, { new: true, runValidators: true });
    if (!data) return res.status(404).json({ success: false, message: "Material not found" });
    res.json({ success: true, data });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};
