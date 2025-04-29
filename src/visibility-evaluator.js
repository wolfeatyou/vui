const acorn = require('acorn');

/**
 * Evaluates a safe expression based on the provided context and custom functions.
 * Supports: &&, ||, !, ==, !=, includes, literals, arrays, strings, numbers, optional chaining, true/false/null
 * Also supports custom API functions with namespace, for example api.hasGrants(['edit', 'create'])
 * @param {string} expr - expression to evaluate
 * @param {object} params - object containing context and api objects
 * @returns {boolean}
 */
function evalSafeExpression(expr, params = {}) {
  // Extract context and api from params or use empty objects
  const context = params.context || {};
  const api = params.api || {};
  
  // Build the evaluation context with context and api objects
  const evaluationContext = { context, api };
  
  // Run the parser
  const ast = acorn.parseExpressionAt(expr, 0, { ecmaVersion: 2020 });
  
  // Evaluate the expression with the context
  return evaluate(ast, evaluationContext);
}

function evaluate(node, ctx) {
  switch (node.type) {
    case 'Literal':
      return node.value;
    case 'Identifier':
      if (node.name === 'true') return true;
      if (node.name === 'false') return false;
      if (node.name === 'null') return null;
      
      // Check if the identifier is directly in context
      return ctx[node.name];
      
    case 'MemberExpression': {
      let obj = evaluate(node.object, ctx);
      if (obj == null && node.optional) return undefined;
      if (node.computed) {
        return obj?.[evaluate(node.property, ctx)];
      } else {
        return obj?.[node.property.name];
      }
    }
    case 'ChainExpression':
      return evaluate(node.expression, ctx);
    case 'LogicalExpression':
      if (node.operator === '&&') return evaluate(node.left, ctx) && evaluate(node.right, ctx);
      if (node.operator === '||') return evaluate(node.left, ctx) || evaluate(node.right, ctx);
      break;
    case 'BinaryExpression':
      if (node.operator === '==') return evaluate(node.left, ctx) == evaluate(node.right, ctx);
      if (node.operator === '!=') return evaluate(node.left, ctx) != evaluate(node.right, ctx);
      break;
    case 'UnaryExpression':
      if (node.operator === '!') return !evaluate(node.argument, ctx);
      break;
    case 'ArrayExpression':
      return node.elements.map(el => evaluate(el, ctx));
    case 'CallExpression': {
      const callee = evaluate(node.callee, ctx);
      const args = node.arguments.map(arg => evaluate(arg, ctx));
      
      // Process includes
      if (
        node.callee.type === 'MemberExpression' &&
        node.callee.property.name === 'includes'
      ) {
        const arr = evaluate(node.callee.object, ctx);
        const arg = evaluate(node.arguments[0], ctx);
        return arr.includes(arg);
      }
      
      // Call function if it's a function
      if (typeof callee === 'function') {
        return callee(...args);
      }
      
      // If we get here, it's an unknown type of call
      throw new Error(`Unsupported function call: ${node.callee.type}`);
    }
    case 'ExpressionStatement':
      return evaluate(node.expression, ctx);
    default:
      throw new Error('Unsupported node type: ' + node.type);
  }
}

module.exports = { evalSafeExpression }; 