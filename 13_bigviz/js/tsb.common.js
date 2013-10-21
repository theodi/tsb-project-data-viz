var tsb = tsb || {};
tsb.common = tsb.common || {};

tsb.common.extractBudgetAreaCode = function(budgetArea) {
  return budgetArea.substr(budgetArea.lastIndexOf('/') + 1);
}

tsb.common.inital = function(list, n) {
  return list.slice(0, n);
}

tsb.common.randomInRange = function(a, b) {
  return a + Math.random() * (b - a);
}
