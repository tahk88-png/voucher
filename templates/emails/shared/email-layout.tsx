/**
 * Shared email layout using @react-email/components.
 *
 * Provides consistent structure across all transactional emails:
 * - HTML/body boilerplate
 * - Brand header
 * - Content container
 * - Footer with unsubscribe
 */

import React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Preview,
} from '@react-email/components';

interface EmailLayoutProps {
  preview?: string;
  children: React.ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      {preview && <Preview>{preview}</Preview>}
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Brand header */}
          <Section style={headerStyle}>
            <Text style={logoStyle}>Vouchr</Text>
          </Section>

          {/* Content */}
          <Section style={contentStyle}>{children}</Section>

          {/* Footer */}
          <Hr style={hrStyle} />
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              This email was sent by Vouchr. If you have questions, reply to this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle: React.CSSProperties = {
  backgroundColor: '#f6f6f6',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  margin: 0,
  padding: 0,
};

const containerStyle: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '20px 0',
};

const headerStyle: React.CSSProperties = {
  padding: '20px 30px',
  textAlign: 'center' as const,
};

const logoStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#d97706', // amber-600
  margin: 0,
};

const contentStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '30px',
};

const hrStyle: React.CSSProperties = {
  borderColor: '#e5e5e5',
  margin: '20px 0',
};

const footerStyle: React.CSSProperties = {
  padding: '0 30px',
};

const footerTextStyle: React.CSSProperties = {
  color: '#999',
  fontSize: '12px',
  textAlign: 'center' as const,
};
