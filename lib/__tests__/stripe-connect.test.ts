import { describe, it, expect } from 'vitest';
import { deriveAccountStatus } from '../stripe';
import type Stripe from 'stripe';

/**
 * Unit tests for the Stripe Connect status derivation helper.
 *
 * `deriveAccountStatus` is the single place where a Stripe `Account`
 * object is mapped to our 4-valued enum + payoutsEnabled boolean. The
 * webhook handler, the onboarding-return redirect, and the admin
 * oversight page all go through this function — so pinning the
 * mapping with explicit examples is worth its weight in prevented
 * "why is the merchant stuck in pending" tickets.
 */

function makeAccount(partial: Partial<Stripe.Account>): Stripe.Account {
  return {
    id: 'acct_test',
    object: 'account',
    capabilities: {},
    details_submitted: false,
    payouts_enabled: false,
    requirements: { disabled_reason: null } as Stripe.Account.Requirements,
    ...partial,
  } as Stripe.Account;
}

describe('deriveAccountStatus', () => {
  it('returns "enabled" when transfers are active and payouts are enabled', () => {
    const account = makeAccount({
      capabilities: { transfers: 'active' },
      payouts_enabled: true,
      details_submitted: true,
    });
    expect(deriveAccountStatus(account)).toEqual({
      status: 'enabled',
      payoutsEnabled: true,
    });
  });

  it('returns "disabled" when Stripe reports a disabled_reason', () => {
    const account = makeAccount({
      capabilities: { transfers: 'active' },
      payouts_enabled: true,
      requirements: {
        disabled_reason: 'requirements.past_due',
      } as Stripe.Account.Requirements,
    });
    expect(deriveAccountStatus(account)).toEqual({
      status: 'disabled',
      payoutsEnabled: false,
    });
  });

  it('returns "restricted" when details submitted but transfers still pending', () => {
    const account = makeAccount({
      capabilities: { transfers: 'pending' },
      payouts_enabled: false,
      details_submitted: true,
    });
    expect(deriveAccountStatus(account)).toEqual({
      status: 'restricted',
      payoutsEnabled: false,
    });
  });

  it('returns "pending" when details not yet submitted', () => {
    const account = makeAccount({
      capabilities: {},
      payouts_enabled: false,
      details_submitted: false,
    });
    expect(deriveAccountStatus(account)).toEqual({
      status: 'pending',
      payoutsEnabled: false,
    });
  });

  it('does NOT mark payouts enabled if transfers capability is inactive', () => {
    // Guard against the subtle bug where `payouts_enabled=true` comes
    // back but the `transfers` capability is still pending — in that
    // case we'd send `transfer_data[destination]` to Stripe and the
    // charge would fail at capture time.
    const account = makeAccount({
      capabilities: { transfers: 'pending' },
      payouts_enabled: true,
      details_submitted: true,
    });
    const derived = deriveAccountStatus(account);
    expect(derived.payoutsEnabled).toBe(false);
    expect(derived.status).toBe('restricted');
  });

  it('prefers "disabled" over any other status when disabled_reason is present', () => {
    const account = makeAccount({
      capabilities: { transfers: 'active' },
      payouts_enabled: true,
      details_submitted: true,
      requirements: {
        disabled_reason: 'other',
      } as Stripe.Account.Requirements,
    });
    expect(deriveAccountStatus(account).status).toBe('disabled');
  });
});
