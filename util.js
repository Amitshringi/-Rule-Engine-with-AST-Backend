// Recursive function to save each node in post-order and return the node's MongoDB ID
const RuleNode = require("./models/Rule");

class TreeNode {
  constructor(operator = null, left = null, right = null, value = null) {
    this.operator = operator; // Logical operator: AND, OR
    this.left = left; // Left child node
    this.right = right; // Right child node
    this.value = value; // Comparison expression, e.g., "E > 30"
  }
}

module.exports.saveNodeInPostOrder = async (node, ruleName = null) => {
  if (!node) return null;

  // Save left and right child nodes first (post-order traversal)
  const leftNodeId = await this.saveNodeInPostOrder(node.left);
  const rightNodeId = await this.saveNodeInPostOrder(node.right);

  // Create a new RuleNode document and set its fields
  const ruleNode = new RuleNode({
    rule_name: ruleName, // Only set for the root node
    operator: node.operator,
    leftNode_id: leftNodeId,
    rightNode_id: rightNodeId,
    value: node.value,
  });

  // Save the node to MongoDB and return its ID
  const savedNode = await ruleNode.save();

  console.log("Saved node:", savedNode);
  return savedNode._id;
};

module.exports.parseExpression = async (expression) => {
  // Trim the expression to remove any extra whitespace
  const comparisonMatch = expression.match(
    /^\s*([A-Za-z]+)\s*([><=]+)\s*('[^']*'|\d+)\s*$/
  );
  if (comparisonMatch) {
    return { value: expression.trim() };
  }

  // Find the main operator (AND or OR) at the outermost level of the expression
  let operator = null;
  let operatorIndex = -1;
  let openParentheses = 0;

  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];
    if (char === "(") {
      openParentheses++;
    } else if (char === ")") {
      openParentheses--;
    } else if (
      openParentheses === 0 &&
      (expression.slice(i, i + 3) === "AND" ||
        expression.slice(i, i + 2) === "OR")
    ) {
      operator = expression.slice(i, i + 3) === "AND" ? "AND" : "OR";
      operatorIndex = i;
      break;
    }
  }

  // If we found an operator, split the expression around it and create subtrees
  if (operator && operatorIndex !== -1) {
    const leftExpr = expression.slice(0, operatorIndex).trim();
    const rightExpr = expression.slice(operatorIndex + operator.length).trim();
    return {
      operator,
      left: await this.parseExpression(leftExpr),
      right: await this.parseExpression(rightExpr),
    };
  }

  // If no operator is found, remove surrounding parentheses and try again
  if (expression.startsWith("(") && expression.endsWith(")")) {
    return await this.parseExpression(expression.slice(1, -1).trim());
  }


  
};

module.exports.findParentNode = async (ruleName) => {
  const rootNode = await RuleNode.findOne({ rule_name: ruleName });

  return rootNode;
};

module.exports.buildASTFromNode = async (nodeId) => {
  const node = await RuleNode.findById(nodeId);

  if (!node) return null;

  // Leaf node with a value (comparison like "age > 30")
  if (node.value) {
    return { value: node.value };
  }

  // Internal node with an operator and references to left and right children
  const leftChild = node.leftNode_id
    ? await this.buildASTFromNode(node.leftNode_id)
    : null;
  const rightChild = node.rightNode_id
    ? await this.buildASTFromNode(node.rightNode_id)
    : null;

  return {
    operator: node.operator,
    left: leftChild,
    right: rightChild,
  };
};

// Main function to start building AST from rule_name
module.exports.buildAST = async (ruleName) => {
  // Fetch the root node based on the rule_name
  const rootNode = await RuleNode.findOne({ rule_name: ruleName });

  if (!rootNode) {
    throw new Error(`Rule with name '${ruleName}' not found.`);
  }

  // Recursively build the AST starting from the root node
  return this.buildASTFromNode(rootNode._id);
};

module.exports.evaluateComparison = async (comparison, data) => {
  // Extract field, operator, and value from the comparison string
  const match = comparison.match(/^(\w+)\s*(>|<|>=|<=|=|!=)\s*(.+)$/);
  if (!match) {
    throw new Error(`Invalid comparison: ${comparison}`);
  }

  const [, field, operator, value] = match;

  // Convert value to the correct type (number if it’s a number, otherwise a string)
  const dataValue = data[field];
  const comparisonValue = isNaN(value)
    ? value.replace(/^['"]|['"]$/g, "")
    : Number(value);

  // Evaluate based on the operator
  switch (operator) {
    case ">":
      return dataValue > comparisonValue;
    case "<":
      return dataValue < comparisonValue;
    case ">=":
      return dataValue >= comparisonValue;
    case "<=":
      return dataValue <= comparisonValue;
    case "=":
      return dataValue === comparisonValue;
    case "!=":
      return dataValue !== comparisonValue;
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
};

// Recursive function to evaluate the AST
module.exports.evaluateAST = async (node, data) => {
  // Leaf node with a comparison
  if (node.value) {
    return this.evaluateComparison(node.value, data);
  }

  // Internal node with an operator
  const leftResult = await this.evaluateAST(node.left, data);
  const rightResult = await this.evaluateAST(node.right, data);

  if (node.operator === "AND") {
    return leftResult && rightResult;
  } else if (node.operator === "OR") {
    return leftResult || rightResult;
  }

  throw new Error(`Unsupported operator in AST: ${node.operator}`);
};

module.exports.fetchAllParentRules = async () => {
  return await RuleNode.find({
    $and: [{ rule_name: { $ne: null } }, { is_combined: false }],
  });
};

module.exports.fetchAllCombinedRule = async () => {
  return await RuleNode.find({ is_combined: true });
};

module.exports.isCombinedRuleAlreadyExits = async (rules) => {
  let allCombinedRule = await this.fetchAllCombinedRule();
  let combinedRulename = "combined_rule";
  for (let i = 0; i < rules.length; i++) {
    combinedRulename = combinedRulename + "_" + rules[i].rule_name;
  }
  return allCombinedRule.find((ele) => ele.rule_name == combinedRulename);
};

// Helper function to create a new AST node
module.exports.createASTNode = async (
  ruleName,
  operator,
  leftNodeId,
  rightNodeId,
  value,
  isCombined
) => {
  const newNode = new RuleNode({
    rule_name: ruleName,
    operator,
    leftNode_id: leftNodeId,
    rightNode_id: rightNodeId,
    value,
    is_combined: isCombined,
  });
  return await newNode.save();
};

// Function to combine multiple rules into a single AST with a root node labeled 'combined_rule'
module.exports.combine_rules = async () => {
  const rules = await this.fetchAllParentRules();
  const isCombinedRuleExists = await this.isCombinedRuleAlreadyExits(rules);
  if (isCombinedRuleExists) {
    throw new Error(`All rules are already combined.`);
  }


  // If only one rule exists, return it directly
  if (rules.length === 1) {
    return rules[0];
  }

  let combinedNode = null;
  let combinedRulename = "combined_rule";
  for (let i = 0; i < rules.length; i++) {
    combinedRulename = combinedRulename + "_" + rules[i].rule_name;
    if (i === 0) {
      // Set the first rule as the base for combining
      combinedNode = rules[i];
    } else {
      // For subsequent rules, combine with the previous combinedNode using an OR operator
      const combinedRoot = await this.createASTNode(
        i === rules.length - 1 ? combinedRulename : null, // Rule name for the combined root node
        "OR", // Most frequent operator to minimize checks
        combinedNode._id, // Left child
        rules[i]._id, // Right child
        null, // No specific comparison value at the root
        i === rules.length - 1 ? true : null
      );

      combinedNode = combinedRoot;
     
    }
  }

  return combinedNode;
};
