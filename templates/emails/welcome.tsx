import React from 'react';

interface WelcomeEmailProps {
  name: string;
  loginUrl: string;
}

export function WelcomeEmail({ name, loginUrl }: WelcomeEmailProps) {
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto', padding: '32px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2D2721' }}>
          Welcome to GiftHub!
        </div>
      </div>

      <p style={{ color: '#2D2721', fontSize: '16px', lineHeight: '1.6' }}>
        Hi {name || 'there'},
      </p>

      <p style={{ color: '#6B5744', fontSize: '15px', lineHeight: '1.6' }}>
        Your account is all set. Here&apos;s what you can do:
      </p>

      <div style={{ margin: '24px 0', padding: '20px', background: '#FFF9ED', borderRadius: '12px', border: '1px solid rgba(139,115,85,0.15)' }}>
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🎁</span>
          <span style={{ color: '#2D2721', fontWeight: '600' }}>Browse &amp; buy vouchers</span>
        </div>
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🔗</span>
          <span style={{ color: '#2D2721', fontWeight: '600' }}>Share referral links &amp; earn credits</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>💰</span>
          <span style={{ color: '#2D2721', fontWeight: '600' }}>Use credits on your next purchase</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a href={loginUrl}
          style={{ display: 'inline-block', background: '#FFC857', color: '#2D2721', fontWeight: '600', padding: '14px 32px', borderRadius: '12px', textDecoration: 'none', fontSize: '16px' }}>
          Get Started
        </a>
      </div>

      <p style={{ color: '#9B8A78', fontSize: '13px', textAlign: 'center' }}>
        Questions? Just reply to this email.
      </p>
    </div>
  );
}

export function welcomeEmailText({ name, loginUrl }: WelcomeEmailProps): string {
  return `Welcome to GiftHub!

Hi ${name || 'there'},

Your account is all set. Here's what you can do:
- Browse & buy vouchers from local merchants
- Share referral links & earn credits
- Use credits on your next purchase

Get started: ${loginUrl}

Questions? Just reply to this email.`;
}
