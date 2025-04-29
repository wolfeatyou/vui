const { evalSafeExpression } = require('../src/visibility-evaluator');

// Function for checking expected results
function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual === expected) {
        return true;
      } else {
        // Добавляем точку останова для отладки
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    }
  };
}

// Run tests
console.log('Running evalSafeExpression tests...');

// Simple boolean values
console.log('Test: simple boolean values');
// Добавляем точку останова перед первым тестом
expect(evalSafeExpression('true', {})).toBe(true);
expect(evalSafeExpression('false', {})).toBe(false);

// Logical NOT
console.log('Test: logical NOT');
expect(evalSafeExpression('!true', {})).toBe(false);
expect(evalSafeExpression('!context.clientId', { context: { clientId: null } })).toBe(true);

// Comparisons
console.log('Test: comparisons');
expect(evalSafeExpression('context.institution.code == "ROS"', { context: { institution: { code: 'ROS' } } })).toBe(true);
expect(evalSafeExpression('context.institution.code != "RAC"', { context: { institution: { code: 'ROS' } } })).toBe(true);

// Logical operators AND/OR
console.log('Test: logical operators AND/OR');
expect(evalSafeExpression('true && false', {})).toBe(false);
expect(evalSafeExpression('true || false', {})).toBe(true);
expect(evalSafeExpression('context.a == 1 && context.b == 2', { context: { a: 1, b: 2 } })).toBe(true);
expect(evalSafeExpression('context.a == 1 || context.b == 2', { context: { a: 1, b: 3 } })).toBe(true);

// Arrays and includes
console.log('Test: arrays and includes');
expect(evalSafeExpression("['a','b'].includes(context.x)", { context: { x: 'a' } })).toBe(true);
expect(evalSafeExpression("['a','b'].includes(context.x)", { context: { x: 'c' } })).toBe(false);

// Optional chaining
console.log('Test: optional chaining');
expect(evalSafeExpression('context.agentAdditionalInfo?.rn_role == "BankAgent"', { context: { agentAdditionalInfo: { rn_role: 'BankAgent' } } })).toBe(true);
expect(evalSafeExpression('context.agentAdditionalInfo?.rn_role == "BankAgent"', { context: { agentAdditionalInfo: null } })).toBe(false);
expect(evalSafeExpression('context.agentAdditionalInfo?.rn_role == "BankAgent"', { context: { } })).toBe(false);

// Complex expressions
console.log('Test: complex expressions');
expect(evalSafeExpression('(context.institution.code == "ROS" || context.institution.code == "RAC") && context.agentAdditionalInfo.rn_role == "Provider"', {
  context: { institution: { code: 'ROS' }, agentAdditionalInfo: { rn_role: 'Provider' } }
})).toBe(true);
expect(evalSafeExpression("(['Retailer', 'Outlet'].includes(context.role))", { context: { role: 'Retailer' } })).toBe(true);
expect(evalSafeExpression('!(context.institution.code == "ROS")', { context: { institution: { code: 'RAC' } } })).toBe(true);

// Custom functions with api namespace
console.log('Test: custom functions with api namespace');

// Test hasGrants function in api namespace
const api = {
    hasGrants: (roles) => {
        // In a real application, this would check user permissions
        // For testing, we just check if the 'edit' role is in the array
        return Array.isArray(roles) && roles.includes('edit');
    }
};

expect(evalSafeExpression("api.hasGrants(['edit', 'create'])", { api })).toBe(true);
expect(evalSafeExpression("api.hasGrants(['view', 'create'])", { api })).toBe(false);

// Combination of context and custom functions
console.log('Test: combination of context and custom functions');
expect(evalSafeExpression("context.isAdmin || api.hasGrants(['edit'])", { 
  context: { isAdmin: false },
  api
})).toBe(true);

expect(evalSafeExpression("context.isAdmin && api.hasGrants(['view'])", { 
  context: { isAdmin: true },
  api
})).toBe(false);

console.log('All tests passed successfully!'); 