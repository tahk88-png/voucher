import React from 'react';
import { Text, Button, Section } from '@react-email/components';
import { EmailLayout } from './shared/email-layout';

interface OrgInvitationEmailProps {
  orgName: string;
  role: string;
  inviterName?: string;
  acceptUrl: string;
  expiresInHours: number;
}

export function OrgInvitationEmail({
  orgName,
  role,
  inviterName,
  acceptUrl,
  expiresInHours,
}: OrgInvitationEmailProps) {
  return (
    <EmailLayout preview={`You're invited to join ${orgName}`}>
      <Text style={{ fontSize: '20px', fontWeight: 600, color: '#333', margin: '0 0 16px' }}>
        You&apos;re invited to join {orgName}
      </Text>
      <Text style={{ color: '#555', lineHeight: '1.6' }}>
        {inviterName ? `${inviterName} has` : 'You have been'} invited you to join
        <strong> {orgName}</strong> as <strong>{role}</strong>.
      </Text>
      <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
        <Button
          href={acceptUrl}
          style={{
            backgroundColor: '#d97706',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Accept Invitation
        </Button>
      </Section>
      <Text style={{ color: '#999', fontSize: '13px' }}>
        This invitation expires in {expiresInHours} hours. If you did not expect this
        email, you can safely ignore it.
      </Text>
    </EmailLayout>
  );
}

export function orgInvitationText(props: OrgInvitationEmailProps): string {
  return [
    `You're invited to join ${props.orgName} as ${props.role}.`,
    '',
    `Accept: ${props.acceptUrl}`,
    '',
    `This invitation expires in ${props.expiresInHours} hours.`,
  ].join('\n');
}
