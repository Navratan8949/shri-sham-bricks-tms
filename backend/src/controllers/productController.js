const mongoose = require("mongoose");
const Product = require("../models/Product");

const DEFAULT_BRICKS = [
  {
    code: "BRK-RED-01",
    name: "Red Clay Bricks (1st Class - अव्वल लाल ईंट)",
    category: "Clay Bricks",
    grade: "1st Class (A-Grade / अव्वल)",
    unit: "Pieces",
    standardRate: 7.5,
    purchaseRate: 5.2,
    hsnCode: "6901",
    gstRate: 5,
    dimensions: '9" x 4.25" x 2.75"',
    currentStock: 150000,
    minStockAlert: 20000,
    storageLocation: "Chamber Yard 1",
    description: "Standard kiln-burnt high-strength first-class red clay bricks for structural walls.",
    status: "active",
  },
  {
    code: "BRK-RED-02",
    name: "Red Clay Bricks (2nd Class - दोयम ईंट)",
    category: "Clay Bricks",
    grade: "2nd Class (B-Grade / दोयम)",
    unit: "Pieces",
    standardRate: 6.25,
    purchaseRate: 4.5,
    hsnCode: "6901",
    gstRate: 5,
    dimensions: '9" x 4.25" x 2.75"',
    currentStock: 80000,
    minStockAlert: 15000,
    storageLocation: "Chamber Yard 2",
    description: "Medium burnt clay bricks suitable for partition walls and compound walls.",
    status: "active",
  },
  {
    code: "BRK-RED-03",
    name: "Red Clay Bricks (3rd Class / Peela - पीला ईंट)",
    category: "Clay Bricks",
    grade: "3rd Class (Peela / पीला)",
    unit: "Pieces",
    standardRate: 4.8,
    purchaseRate: 3.5,
    hsnCode: "6901",
    gstRate: 5,
    dimensions: '9" x 4.25" x 2.75"',
    currentStock: 45000,
    minStockAlert: 10000,
    storageLocation: "Yard 3 (Peela Stack)",
    description: "Underburnt yellowish bricks suitable for temporary work or filling.",
    status: "active",
  },
  {
    code: "BRK-KNG-01",
    name: "Kangar / Chatka Bricks (खंगार / चटका ईंट)",
    category: "Clay Bricks",
    grade: "Overburnt (Chatka / Kangar)",
    unit: "Pieces",
    standardRate: 5.0,
    purchaseRate: 3.8,
    hsnCode: "6901",
    gstRate: 5,
    dimensions: '9" x 4.25" x 2.75"',
    currentStock: 30000,
    minStockAlert: 5000,
    storageLocation: "Yard 4 (Overburnt)",
    description: "Overburnt hard bricks for road foundations, flooring base and water tanks.",
    status: "active",
  },
  {
    code: "BRK-ROD-01",
    name: "Tukda / Brick Bats (ईंट रोड़ा / टुकड़ा)",
    category: "Clay Bricks",
    grade: "Broken Bats (Roda / टुकड़ा)",
    unit: "Trolley",
    standardRate: 1800,
    purchaseRate: 1200,
    hsnCode: "6901",
    gstRate: 5,
    dimensions: "Mixed Size Broken",
    currentStock: 25,
    minStockAlert: 5,
    storageLocation: "Crushed Yard",
    description: "Broken brick pieces for foundation PCC and leveling.",
    status: "active",
  },
  {
    code: "BRK-FLY-01",
    name: "Fly Ash Bricks (फ्लाई ऐश ईंट)",
    category: "Fly Ash Bricks",
    grade: "1st Class (A-Grade / अव्वल)",
    unit: "Pieces",
    standardRate: 5.5,
    purchaseRate: 4.0,
    hsnCode: "6815",
    gstRate: 5,
    dimensions: '9" x 4" x 3"',
    currentStock: 60000,
    minStockAlert: 10000,
    storageLocation: "Fly Ash Shed",
    description: "Machine-compressed uniform fly-ash cement bricks for green construction.",
    status: "active",
  },
  {
    code: "PVR-ZIG-01",
    name: "Interlocking Paver Blocks 60mm (पेवर ब्लॉक)",
    category: "Pavers",
    grade: "Standard Industrial",
    unit: "Pieces",
    standardRate: 14.5,
    purchaseRate: 10.5,
    hsnCode: "6810",
    gstRate: 12,
    dimensions: "60mm Zig-Zag M-30",
    currentStock: 25000,
    minStockAlert: 5000,
    storageLocation: "Paver Shed 1",
    description: "Heavy duty M-30 grade interlocking concrete paving stones for parking and roads.",
    status: "active",
  },
  {
    code: "PVR-HVY-02",
    name: "Heavy Duty Paver Blocks 80mm (पेवर 80mm)",
    category: "Pavers",
    grade: "Premium Heavy Duty",
    unit: "Pieces",
    standardRate: 18.5,
    purchaseRate: 13.5,
    hsnCode: "6810",
    gstRate: 12,
    dimensions: "80mm I-Shape M-40",
    currentStock: 15000,
    minStockAlert: 3000,
    storageLocation: "Paver Shed 2",
    description: "Extra heavy duty M-40 grade paver blocks for industrial transit and heavy vehicles.",
    status: "active",
  },
  {
    code: "BLK-AAC-01",
    name: "AAC Lightweight Blocks (एएसी ब्लॉक)",
    category: "Concrete Blocks",
    grade: "Standard Industrial",
    unit: "Pieces",
    standardRate: 62.0,
    purchaseRate: 48.0,
    hsnCode: "6810",
    gstRate: 12,
    dimensions: '24" x 8" x 4"',
    currentStock: 8000,
    minStockAlert: 1500,
    storageLocation: "Covered Warehouse",
    description: "Autoclaved Aerated Concrete lightweight thermal insulated wall blocks.",
    status: "active",
  },
  {
    code: "RAW-CLY-01",
    name: "Kiln Clay Soil (भट्ठा चिकनी मिट्टी)",
    category: "Raw Material",
    grade: "Fine Clay Grade",
    unit: "Trolley",
    standardRate: 950,
    purchaseRate: 750,
    hsnCode: "2505",
    gstRate: 5,
    dimensions: "Natural Clay",
    currentStock: 120,
    minStockAlert: 20,
    storageLocation: "Clay Stockpile Ground",
    description: "High plastic sticky clay soil sourced from agricultural fields for green brick molding.",
    status: "active",
  },
  {
    code: "RAW-COL-01",
    name: "Steam Coal / Bhatta Koyla (भट्ठा स्टीम कोयला)",
    category: "Fuel & Burning",
    grade: "High GCV Grade",
    unit: "MT",
    standardRate: 11000,
    purchaseRate: 9800,
    hsnCode: "2701",
    gstRate: 5,
    dimensions: "Lump / Slack Coal",
    currentStock: 85,
    minStockAlert: 15,
    storageLocation: "Coal Bunker / Fuel Yard",
    description: "High calorific value coal for continuous kiln baking and high-heat firing.",
    status: "active",
  },
  {
    code: "RAW-TRS-01",
    name: "Biomass Turi / Rice Husk (धान तूड़ी / भूसा)",
    category: "Fuel & Burning",
    grade: "Standard Agricultural",
    unit: "MT",
    standardRate: 3600,
    purchaseRate: 3100,
    hsnCode: "2302",
    gstRate: 5,
    dimensions: "Loose Dry Husk",
    currentStock: 40,
    minStockAlert: 10,
    storageLocation: "Covered Biomass Shed",
    description: "Agricultural dry paddy husk fuel for eco-friendly top feeding in kiln.",
    status: "active",
  },
  {
    code: "RAW-SND-01",
    name: "River Sand / Reti (रेती / बजरी)",
    category: "Raw Material",
    grade: "Medium Coarse",
    unit: "Brass",
    standardRate: 4200,
    purchaseRate: 3600,
    hsnCode: "2505",
    gstRate: 5,
    dimensions: "Screened Sand",
    currentStock: 35,
    minStockAlert: 8,
    storageLocation: "Sand Depot",
    description: "Washed river sand for fly ash bricks, mortar mixing and paver production.",
    status: "active",
  },
  {
    code: "RAW-CMT-01",
    name: "OPC 53 Grade Cement (सीमेंट कट्टा)",
    category: "Raw Material",
    grade: "53 Grade OPC",
    unit: "Bags",
    standardRate: 395,
    purchaseRate: 345,
    hsnCode: "2523",
    gstRate: 28,
    dimensions: "50 Kg Bag",
    currentStock: 650,
    minStockAlert: 100,
    storageLocation: "Dry Cement Godown",
    description: "High early strength 53-grade Portland cement for concrete blocks and pavers.",
    status: "active",
  },
];

// GET ALL PRODUCTS
const getProducts = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { search, category, status } = req.query;

    const query = { companyId };

    if (status) {
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ name: regex }, { code: regex }, { category: regex }, { hsnCode: regex }];
    }

    let products = await Product.find(query).sort({ createdAt: -1 });

    // Auto-seed defaults if company has 0 products
    if (products.length === 0 && !search && !category && !status) {
      const seeded = await Product.insertMany(
        DEFAULT_BRICKS.map((p) => ({ ...p, companyId }))
      );
      products = seeded;
    }

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET PRODUCT BY ID
const getProductById = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const product = await Product.findOne({ _id: req.params.id, companyId });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE PRODUCT / MATERIAL
const createProduct = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const {
      name,
      code,
      category,
      grade,
      unit,
      standardRate,
      purchaseRate,
      hsnCode,
      gstRate,
      dimensions,
      currentStock,
      minStockAlert,
      storageLocation,
      defaultSupplier,
      description,
      status,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Material / Product name is required" });
    }

    let finalCode = (code || "").trim().toUpperCase();
    if (!finalCode) {
      finalCode = `MAT-${Date.now().toString().slice(-6)}`;
    }

    const product = await Product.create({
      companyId,
      name: name.trim(),
      code: finalCode,
      category: category || "Clay Bricks",
      grade: grade || "1st Class (A-Grade)",
      unit: unit || "Pieces",
      standardRate: Number(standardRate) || 0,
      purchaseRate: Number(purchaseRate) || 0,
      hsnCode: (hsnCode || "6901").trim(),
      gstRate: Number(gstRate) || 5,
      dimensions: (dimensions || '9" x 4.25" x 2.75"').trim(),
      currentStock: Number(currentStock) || 0,
      minStockAlert: Number(minStockAlert) || 1000,
      storageLocation: (storageLocation || "Main Kiln Yard").trim(),
      defaultSupplier: (defaultSupplier || "").trim(),
      description: (description || "").trim(),
      status: status || "active",
    });

    return res.status(201).json({
      success: true,
      message: "Material / Product created successfully",
      data: product,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE PRODUCT / MATERIAL
const updateProduct = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const product = await Product.findOne({ _id: req.params.id, companyId });

    if (!product) {
      return res.status(404).json({ success: false, message: "Material / Product not found" });
    }

    const fields = [
      "name",
      "code",
      "category",
      "grade",
      "unit",
      "standardRate",
      "purchaseRate",
      "hsnCode",
      "gstRate",
      "dimensions",
      "currentStock",
      "minStockAlert",
      "storageLocation",
      "defaultSupplier",
      "description",
      "status",
    ];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        if (
          f === "standardRate" ||
          f === "purchaseRate" ||
          f === "gstRate" ||
          f === "currentStock" ||
          f === "minStockAlert"
        ) {
          product[f] = Number(req.body[f]) || 0;
        } else {
          product[f] = req.body[f];
        }
      }
    });

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE PRODUCT
const deleteProduct = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const product = await Product.findOneAndDelete({ _id: req.params.id, companyId });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};

