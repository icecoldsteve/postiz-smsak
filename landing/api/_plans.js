// Gedeeld door checkout en webhook. Bestanden met _ in /api worden geen functie.
module.exports = {
  PLANS: {
    starter: { amount: '99.00', description: 'SMSAK Social Scheduler — Starter (1 jaar)' },
    professional: { amount: '299.00', description: 'SMSAK Social Scheduler — Professional (1 jaar)' },
    enterprise: { amount: '999.00', description: 'SMSAK Social Scheduler — Enterprise (1 jaar)' },
  },
  // redirectUrl en webhookUrl komen nooit uit de Host-header van de aanvrager.
  BASE_URL: (process.env.PUBLIC_BASE_URL || 'https://scheduler-smsak.vercel.app').replace(/\/+$/, ''),
};
