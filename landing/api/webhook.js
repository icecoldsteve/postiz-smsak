// POST /api/webhook — Mollie calls this with id=tr_xxx after every status change.
// We fetch the payment, and on "paid" log the order so it can be activated.
// (v1: manual activation — Steve receives the order via the function logs and
// can automate later with a database + Postiz API.)

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) return res.status(503).end();

  // Mollie posts application/x-www-form-urlencoded: id=tr_xxx
  let id = (req.body && req.body.id) || '';
  if (!id && typeof req.body === 'string') {
    id = new URLSearchParams(req.body).get('id') || '';
  }
  if (!/^tr_[A-Za-z0-9]+$/.test(id)) return res.status(400).end();

  const mollieRes = await fetch(`https://api.mollie.com/v2/payments/${id}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!mollieRes.ok) return res.status(502).end();

  const payment = await mollieRes.json();
  const { status, metadata, amount } = payment;

  if (status === 'paid') {
    // Visible in Vercel function logs → activate account for metadata.email
    console.log(
      `[ORDER PAID] plan=${metadata && metadata.plan} email=${metadata && metadata.email} amount=${amount && amount.value} EUR payment=${id}`
    );
  } else {
    console.log(`[ORDER ${String(status).toUpperCase()}] payment=${id}`);
  }

  // Always 200 so Mollie stops retrying
  return res.status(200).end();
};
