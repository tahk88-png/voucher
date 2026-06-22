/**
 * End-to-end verification of the BNPL off-session installment charge path
 * against Stripe **test mode**, driven by a Stripe test clock.
 *
 * It mirrors production exactly:
 *   1. create a Customer under a test clock (the "user");
 *   2. attach a saved, off-session-capable card (as /api/bnpl/create does);
 *   3. charge installment 1 on-session (user present) — like the create route;
 *   4. advance the test clock ~1 month to the installment-2 due date;
 *   5. charge installment 2 OFF-session using the SAME
 *      `buildInstallmentChargeParams` helper the cron uses.
 *
 * The point is to prove the cron's charge actually settles money now that the
 * plan carries a customer + saved payment method and the real currency —
 * previously it created an unconfirmed PaymentIntent that never charged.
 *
 * Run: npx tsx scripts/verify-bnpl-testclock.ts
 * Requires STRIPE_SECRET_KEY (sk_test_...) in .env / .env.local / the env.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import Stripe from 'stripe';
import { buildInstallmentChargeParams, calculateInstallments } from '../lib/bnpl';

// ── Minimal .env loader (the project has no dotenv dep; Prisma loads its own) ──
function loadEnvKey(key: string): string | undefined {
  if (process.env[key]) return process.env[key];
  for (const file of ['.env.local', '.env']) {
    try {
      const text = readFileSync(join(process.cwd(), file), 'utf8');
      for (const line of text.split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && m[1] === key) {
          return m[2].replace(/^["']|["']$/g, '').trim();
        }
      }
    } catch {
      /* file may not exist */
    }
  }
  return undefined;
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
}

const DAY = 24 * 60 * 60;

async function waitForClockReady(stripe: Stripe, clockId: string): Promise<void> {
  for (let i = 0; i < 30; i++) {
    const clock = await stripe.testHelpers.testClocks.retrieve(clockId);
    if (clock.status === 'ready') return;
    if (clock.status === 'internal_failure') {
      throw new Error('Test clock advance failed (internal_failure)');
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('Test clock did not become ready in time');
}

async function main() {
  const secretKey = loadEnvKey('STRIPE_SECRET_KEY');
  assert(secretKey, 'STRIPE_SECRET_KEY not found in env/.env');
  assert(
    secretKey.startsWith('sk_test_'),
    `refusing to run against a non-test key (got ${secretKey.slice(0, 8)}...)`
  );
  // Reject obvious placeholders (the repo ships `.env` with sk_test_change_me)
  // so the failure is actionable instead of a raw "Invalid API Key" from Stripe.
  assert(
    !/^sk_test_(change_me|replace_me|placeholder|your_key|xxx|example)/i.test(secretKey),
    `STRIPE_SECRET_KEY is a placeholder (${secretKey}). Set a real sk_test_… key ` +
      `in .env or pass it inline:  STRIPE_SECRET_KEY=sk_test_… npx tsx scripts/verify-bnpl-testclock.ts`
  );

  const stripe = new Stripe(secretKey, { apiVersion: '2023-10-16', typescript: true });

  // A sample plan: $120.00 financed over 3 months, 0% interest → 3 × $40.00.
  const totalCents = 12000;
  const currency = 'usd';
  const calc = calculateInstallments(totalCents, '3x');
  console.log(
    `Plan: ${calc.installments.length}× ${currency} (installment amounts: ` +
      `${calc.installments.map((i) => i.amountCents).join(', ')} cents)\n`
  );

  let clockId: string | undefined;
  try {
    const t0 = Math.floor(Date.now() / 1000);
    const clock = await stripe.testHelpers.testClocks.create({ frozen_time: t0 });
    clockId = clock.id;
    console.log(`① Created test clock ${clock.id} frozen at ${new Date(t0 * 1000).toISOString()}`);

    // The "user" customer lives on the test clock.
    const customer = await stripe.customers.create({
      test_clock: clock.id,
      metadata: { purpose: 'bnpl-testclock-verification' },
    });
    console.log(`② Created customer ${customer.id}`);

    // Collect + attach an off-session-capable card (mirrors /api/bnpl/create).
    const pm = await stripe.paymentMethods.create({
      type: 'card',
      card: { token: 'tok_visa' },
    });
    await stripe.paymentMethods.attach(pm.id, { customer: customer.id });
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: pm.id },
    });
    console.log(`③ Attached + defaulted payment method ${pm.id}`);

    // Installment 1: charged on-session at plan creation.
    const pi1 = await stripe.paymentIntents.create({
      amount: calc.installments[0].amountCents,
      currency,
      customer: customer.id,
      payment_method: pm.id,
      payment_method_types: ['card'],
      confirm: true,
      off_session: false,
      setup_future_usage: 'off_session',
      metadata: { type: 'bnpl_installment', installmentNumber: '1' },
    });
    console.log(`④ Installment 1 (on-session): ${pi1.status} — ${pi1.amount} ${pi1.currency}`);
    assert(pi1.status === 'succeeded', `installment 1 expected succeeded, got ${pi1.status}`);

    // Advance the clock ~1 month — the installment-2 due date arrives.
    console.log('⑤ Advancing test clock +35 days…');
    await stripe.testHelpers.testClocks.advance(clock.id, { frozen_time: t0 + 35 * DAY });
    await waitForClockReady(stripe, clock.id);
    console.log('   clock ready.');

    // Installment 2: charged OFF-session by the cron, via the shared helper.
    const params = buildInstallmentChargeParams({
      amountCents: calc.installments[1].amountCents,
      currency,
      stripeCustomerId: customer.id,
      stripePaymentMethodId: pm.id,
      planId: 'plan_verify',
      installmentNumber: 2,
      userId: 'user_verify',
      merchantId: 'merchant_verify',
    });
    // Prove the helper produced the right wiring (the old cron got these wrong).
    assert(params.currency === currency, `helper currency ${params.currency} != ${currency}`);
    assert(params.off_session === true, 'helper must charge off_session');
    assert(params.confirm === true, 'helper must confirm');
    assert(params.customer === customer.id, 'helper must target the saved customer');

    const pi2 = await stripe.paymentIntents.create(params, {
      idempotencyKey: `bnpl_installment_plan_verify_2`,
    });
    console.log(`⑥ Installment 2 (off-session): ${pi2.status} — ${pi2.amount} ${pi2.currency}`);
    assert(pi2.status === 'succeeded', `installment 2 expected succeeded, got ${pi2.status}`);

    // Idempotency: replaying the same key must NOT create a second charge.
    const pi2replay = await stripe.paymentIntents.create(params, {
      idempotencyKey: `bnpl_installment_plan_verify_2`,
    });
    assert(pi2replay.id === pi2.id, 'idempotency key should return the same PaymentIntent');
    console.log(`⑦ Idempotent replay returned the same PaymentIntent (${pi2replay.id})`);

    console.log('\n✅ PASS — off-session installment charge settles end-to-end under a test clock.');
  } finally {
    if (clockId) {
      await stripe.testHelpers.testClocks.del(clockId).catch(() => {});
      console.log(`\n🧹 Cleaned up test clock ${clockId} (cascades to its customer).`);
    }
  }
}

main().catch((err) => {
  console.error('\n❌ FAIL —', err instanceof Error ? err.message : err);
  process.exit(1);
});
