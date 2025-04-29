const { evalSafeExpression } = require('../src/visibility-evaluator');

describe('evalSafeExpression', () => {
  it('should evaluate simple boolean', () => {
    expect(evalSafeExpression('true', {})).toBe(true);
    expect(evalSafeExpression('false', {})).toBe(false);
  });

  it('should evaluate logical NOT', () => {
    expect(evalSafeExpression('!true', {})).toBe(false);
    expect(evalSafeExpression('!context.clientId', { context: { clientId: null } })).toBe(true);
  });

  it('should evaluate comparisons', () => {
    expect(evalSafeExpression('context.institution.code == "ROS"', { context: { institution: { code: 'ROS' } } })).toBe(true);
    expect(evalSafeExpression('context.institution.code != "RAC"', { context: { institution: { code: 'ROS' } } })).toBe(true);
  });

  it('should evaluate logical AND/OR', () => {
    expect(evalSafeExpression('true && false', {})).toBe(false);
    expect(evalSafeExpression('true || false', {})).toBe(true);
    expect(evalSafeExpression('context.a == 1 && context.b == 2', { context: { a: 1, b: 2 } })).toBe(true);
    expect(evalSafeExpression('context.a == 1 || context.b == 2', { context: { a: 1, b: 3 } })).toBe(true);
  });

  it('should evaluate array includes', () => {
    expect(evalSafeExpression("['a','b'].includes(context.x)", { context: { x: 'a' } })).toBe(true);
    expect(evalSafeExpression("['a','b'].includes(context.x)", { context: { x: 'c' } })).toBe(false);
  });

  it('should evaluate with optional chaining', () => {
    expect(evalSafeExpression('context.agentAdditionalInfo?.rn_role == "BankAgent"', { context: { agentAdditionalInfo: { rn_role: 'BankAgent' } } })).toBe(true);
    expect(evalSafeExpression('context.agentAdditionalInfo?.rn_role == "BankAgent"', { context: { agentAdditionalInfo: null } })).toBe(false);
    expect(evalSafeExpression('context.agentAdditionalInfo?.rn_role == "BankAgent"', { context: { } })).toBe(false);
  });

  it('should evaluate custom functions with api namespace', () => {
    const api = {
      hasGrants: (roles) => Array.isArray(roles) && roles.includes('edit')
    };
    expect(evalSafeExpression("api.hasGrants(['edit','view'])", { api })).toBe(true);
    expect(evalSafeExpression("api.hasGrants(['view'])", { api })).toBe(false);
  });

  it('should evaluate complex expressions', () => {
    expect(evalSafeExpression('(context.institution.code == "ROS" || context.institution.code == "RAC") && context.agentAdditionalInfo.rn_role == "Provider"', {
      context: { institution: { code: 'ROS' }, agentAdditionalInfo: { rn_role: 'Provider' } }
    })).toBe(true);
    expect(evalSafeExpression("(['Retailer', 'Outlet'].includes(context.role))", { context: { role: 'Retailer' } })).toBe(true);
    expect(evalSafeExpression('!(context.institution.code == "ROS")', { context: { institution: { code: 'RAC' } } })).toBe(true);
  });

  it('should evaluate combination of context and custom functions', () => {
    const api = {
      hasGrants: (roles) => Array.isArray(roles) && roles.includes('edit')
    };
    expect(evalSafeExpression("context.isAdmin || api.hasGrants(['edit'])", { 
      context: { isAdmin: false },
      api
    })).toBe(true);
  });
}); 