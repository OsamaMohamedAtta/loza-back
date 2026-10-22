const { getPlans, getConfigProblems } = require('../payment.config')

// GET /payment/plans - public. Prices come only from the server configuration.
const getPlansController = (req, res) => {
    const plans = getPlans();
    res.json({
        available: getConfigProblems().length === 0 && plans.every(plan => plan.available),
        plans: plans.map(({ amountMinor, ...plan }) => plan)
    });
}

module.exports = getPlansController;
