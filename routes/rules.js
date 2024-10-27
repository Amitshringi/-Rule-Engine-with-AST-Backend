const express = require("express");
const {
  createAST,
  combineRules,
  evaluateRule,
  getRuleNames,
  // Import the controller for evaluating rules
} = require("../controllers/ruleControllers");
const Rule = require("../models/Rule");

const router = express.Router();

// Route to create a rule
router.post("/create", createAST);

// Route to get all rules
router.get("/", async (req, res) => {
  try {
    const rules = await Rule.find({ rule_name: { $ne: null } }); // Fetch all rules from the database
    res.json(rules); // Send the rules as a JSON response
  } catch (error) {
    console.error("Error fetching rules:", error);
    res.status(500).json({ error: "Failed to fetch rules" });
  }
});

// Route to combine multiple rules
router.post('/combine', combineRules);

// Route to evaluate a rule with user data
router.post("/evaluate", evaluateRule);

router.get('/names', getRuleNames);



module.exports = router;
