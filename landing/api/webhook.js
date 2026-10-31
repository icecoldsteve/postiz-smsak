// POST /api/webhook — Mollie calls this with id=tr_xxx after every status change.
// The body is never trusted: we refetch the payment from Mollie with our own key
// and only act on what Mollie says. v1 has no database: a paid order shows up as
// one [ORDER PAID] line in the Vercel function logs and Steve activates it by hand.
//
// Idempotency without a database: Mollie calls again on every later change
// (refund, chargeback) and may retry. The payment id is the order key, and a
// payment that was (partly) refunded or charged back is logged as such, never
// again as a fresh [ORDER PAID].

const { PLANS } = require('./_plans');

function amountOf(a) {
  return a && a.currency === 'EUR' ? Number(a.value) : 0;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) return res.status(503).end();

  // Mollie posts application/x-www-form-urlencoded: id=tr_xxx
  let id = (req.body && typeof req.body === 'object' && req.body.id) || '';
  if (!id && typeof req.body === 'string') {
    id = new URLSearchParams(req.body).get('id') || '';
  }
  if (typeof id !== 'string' || !/^tr_[A-Za-z0-9]{1,64}$/.test(id)) return res.status(400).end();

  let payment;
  try {
    const mollieRes = await fetch(`https://api.mollie.com/v2/payments/${id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    // Unknown id (404): answer 200 like Mollie advises, so nobody can probe ids.
    if (mollieRes.status === 404) return res.status(200).end();
    if (!mollieRes.ok) return res.status(502).end(); // Mollie retries later
    payment = await mollieRes.json();
  } catch (err) {
    console.error('Mollie unreachable in webhook:', err && err.message);
    return res.status(502).end();
  }

  const { status, metadata } = payment || {};
  const plan = metadata && typeof metadata.plan === 'string' ? metadata.plan : '';
  const expected = Object.prototype.hasOwnProperty.call(PLANS, plan) ? PLANS[plan] : null;
  const paid = amountOf(payment.amount);
  const refunded = amountOf(payment.amountRefunded);
  const chargedBack = amountOf(payment.amountChargedBack);

  if (status === 'paid' && (refunded > 0 || chargedBack > 0)) {
    console.log(`[ORDER REFUNDED] payment=${id} plan=${plan} refunded=${refunded} chargedBack=${chargedBack} EUR — niet (meer) activeren`);
  } else if (status === 'paid' && (!expected || paid !== Number(expected.amount))) {
    // Not a scheduler order from /api/checkout (other product on the same Mollie account, or tampered).
    console.log(`[ORDER MISMATCH] payment=${id} plan=${plan || '-'} amount=${paid} EUR — niet automatisch activeren`);
  } else if (status === 'paid') {
    console.log(
      `[ORDER PAID] payment=${id} plan=${plan} amount=${expected.amount} EUR email=${metadata.email} paidAt=${payment.paidAt || '-'} (één keer activeren per payment-id)`
    );
  } else {
    console.log(`[ORDER ${String(status).toUpperCase()}] payment=${id}`);
  }

  // Always 200 so Mollie stops retrying
  return res.status(200).end();
};
