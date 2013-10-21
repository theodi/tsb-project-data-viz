var tsb = tsb || {};
tsb.common = tsb.common || {};

tsb.common.extractBudgetAreaCode = function(budgetArea) {
  return budgetArea.substr(budgetArea.lastIndexOf('/') + 1);
}