// Every premium subscription is valid for 6 months from the payment date.
const SUBSCRIPTION_MONTHS = 6;

function computeSubscriptionExpiry(fromDate = new Date()) {
  const d = new Date(fromDate);
  d.setMonth(d.getMonth() + SUBSCRIPTION_MONTHS);
  return d;
}

module.exports = { computeSubscriptionExpiry, SUBSCRIPTION_MONTHS };
