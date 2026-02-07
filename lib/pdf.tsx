import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

// PDF styles for voucher export
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  section: {
    marginBottom: 15,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 14,
    marginBottom: 10,
  },
  qrCode: {
    marginTop: 20,
    alignItems: 'center',
  },
  footer: {
    marginTop: 30,
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
});

/**
 * Generate PDF document for a voucher
 */
export function createVoucherPDF(params: {
  merchantName: string;
  voucherCode: string;
  value: string;
  validUntil?: string;
  qrCodeDataUrl?: string;
}): React.ReactElement {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{params.merchantName}</Text>
          <Text style={styles.subtitle}>Voucher</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Voucher Code</Text>
          <Text style={styles.value}>{params.voucherCode}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Value</Text>
          <Text style={styles.value}>{params.value}</Text>
        </View>

        {params.validUntil && (
          <View style={styles.section}>
            <Text style={styles.label}>Valid Until</Text>
            <Text style={styles.value}>{params.validUntil}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>This voucher is valid only at {params.merchantName}</Text>
        </View>
      </Page>
    </Document>
  );
}

/**
 * Generate PDF buffer from React PDF document
 */
export async function generatePDFBuffer(doc: React.ReactElement): Promise<Buffer> {
  const blob = await pdf(doc).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
