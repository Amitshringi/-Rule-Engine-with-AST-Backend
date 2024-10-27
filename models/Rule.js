// models/RuleNode.js
const mongoose = require("mongoose");

//Schema
const ruleNodeSchema = new mongoose.Schema({
  rule_name: { type: String, default: null }, // Only for root node
  operator: { type: String, default: null },
  leftNode_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RuleNode",
    default: null,
  },
  rightNode_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RuleNode",
    default: null,
  },
  value: { type: String, default: null },
  is_combined: { type: Boolean, default: false },
});

const RuleNode = mongoose.model("RuleNode", ruleNodeSchema);
module.exports = RuleNode;

