const Stripe = require("stripe");

const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;

let stripeClient = null;

const getStripe = () => {
  if (!stripeSecretKey) {
    const error = new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in server/.env.",
    );
    error.statusCode = 500;
    throw error;
  }

  if (!stripeClient) {
    stripeClient = Stripe(stripeSecretKey);
  }

  return stripeClient;
};

module.exports = {
  getStripe,
  isStripeConfigured: Boolean(stripeSecretKey),
};
