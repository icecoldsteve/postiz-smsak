// POST /api/checkout  { plan: "starter"|"professional"|"enterprise", email }
// Creates a Mollie payment and returns { checkoutUrl }.
// Requires env var MOLLIE_API_KEY (test_... or live_...) in Vercel.

const PLANS = {
  starter: { amount: '99.00', description: 'SMSAK Social Scheduler — Starter (1 jaar)' },
  professional: { amount: '299.00', description: 'SMSAK Social Scheduler — Professional (1 jaar)' },
  enterprise: { amount: '999.00', description: 'SMSAK Social Scheduler — Enterprise (1 jaar)' },
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'Betalingen zijn nog niet geactiveerd. Mail social@smsak.be om te bestellen.',
    });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const plan = typeof body.plan === 'string' ? body.plan : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const chosen = Object.prototype.hasOwnProperty.call(PLANS, plan) ? PLANS[plan] : null;
  if (!chosen) return res.status(400).json({ error: 'Onbekende formule.' });
  if (!email || email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'Ongeldig e-mailadres.' });
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const base = `https://${host}`;

  let mollieRes;
  try {
    mollieRes = await fetch('https://api.mollie.com/v2/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: { currency: 'EUR', value: chosen.amount },
        description: chosen.description,
        redirectUrl: `${base}/bedankt`,
        webhookUrl: `${base}/api/webhook`,
        locale: 'nl_BE',
        metadata: { plan, email },
      }),
    });
  } catch (err) {
    console.error('Mollie unreachable:', err && err.message);
    return res.status(502).json({ error: 'Betaalprovider onbereikbaar. Probeer opnieuw of mail social@smsak.be.' });
  }

  if (!mollieRes.ok) {
    const detail = await mollieRes.text();
    console.error('Mollie error:', mollieRes.status, detail);
    return res.status(502).json({ error: 'Betaalprovider gaf een fout. Probeer opnieuw of mail social@smsak.be.' });
  }

  const payment = await mollieRes.json();
  return res.status(200).json({ checkoutUrl: payment._links.checkout.href, paymentId: payment.id });
};
