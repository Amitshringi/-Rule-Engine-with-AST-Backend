const RuleNode = require("../models/Rule");
const Rule = require("../models/Rule");
const {
  parseExpression,
  saveNodeInPostOrder,
  buildAST,
  evaluateAST,
  combine_rules,
} = require("../util");

// // Create AST from a rule string (more dynamic parsing)
module.exports.createAST = async (req, res) => {
  try {
    // await RuleNode.deleteMany({});
    const ruleName = req.body.name;
    const ruleString = req.body.ruleString;
  
    const root = await parseExpression(ruleString);
    // console.log("Root data", root);

    await saveNodeInPostOrder(root, ruleName);

    res.status(200).json({
      message: "Success",
      data: root,
    });
  } catch (error) {
    console.error(error, "error");
    res.status(400).json({
      message: "failed",
      error: error.message,
    });
  }

 
};



// // Combine multiple ASTs into one
module.exports.combineRules = async (req, res) => {
  try {
    const data = await combine_rules();
    res.status(200).json({
      message: "Success",
      data: data,
    });
  } catch (error) {
    console.error("Error combining rules:", error);
    res.status(500).json({ error: error.message });
  }
};

// // Controller to evaluate a rule
module.exports.evaluateRule = async (req, res) => {
  console.log(req.body.ruleName, "requst by amit");
  try {
        const ruleName= req.body.ruleName;
    const data=req.body.jsonData;

    // const ruleName = "combined_rule_Rule_1_Rule_2_Rule_3";
    // const data = { age: 35, department: "Sales", salary: 60000, experience: 3 };

    const node = await buildAST(ruleName);

    const evaluated = await evaluateAST(node, data);

    res.status(200).json({ data: evaluated });
  } catch (error) {
    console.error("error", error);
    res.status(400).json({
      message: "failed",
      error: error.message,
    });
  }
};



// Controller to fetch rule names
module.exports.getRuleNames = async (req, res) => {
  try {
    // Fetch rule names where rule_name is defined and not null
    const rules = await RuleNode.find({ rule_name: { $ne: null } }, 'rule_name');
    const ruleNames = rules.map(rule => rule.rule_name);
    res.status(200).json(ruleNames);
  } catch (error) {
    console.error("Error fetching rule names:", error);
    res.status(500).json({ message: "Failed to fetch rule names", error: error.message });
  }
};


