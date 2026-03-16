import { prisma } from './prisma';

/**
 * Wallet Pass Generation
 *
 * PRODUCTION NOTES:
 * - Apple Wallet: Requires `passkit-generator` npm package + Apple WWDR certificate +
 *   pass type certificate from Apple Developer Portal. The .pkpass file is a signed ZIP
 *   containing pass.json, icons, and a signature manifest.
 * - Google Wallet: Requires Google Cloud service account with Wallet API enabled +
 *   issuer ID from Google Pay & Wallet Console. Uses JWT signed with service account key.
 */

const BASE_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://vouchr.app';

interface PassInput {
  type: 'voucher' | 'ticket' | 'gift_card';
  id: string;
}

interface ApplePassData {
  formatVersion: number;
  passTypeIdentifier: string;
  serialNumber: string;
  teamIdentifier: string;
  organizationName: string;
  description: string;
  logoText: string;
  foregroundColor: string;
  backgroundColor: string;
  barcode: {
    message: string;
    format: string;
    messageEncoding: string;
  };
  [key: string]: unknown;
}

interface GooglePassData {
  iss: string;
  aud: string;
  typ: string;
  iat: number;
  payload: {
    genericObjects: Array<{
      id: string;
      classId: string;
      state: string;
      header: { defaultValue: { language: string; value: string } };
      subheader: { defaultValue: { language: string; value: string } };
      barcode: { type: string; value: string };
      hexBackgroundColor: string;
      textModulesData: Array<{ id: string; header: string; body: string }>;
      [key: string]: unknown;
    }>;
  };
}

/**
 * Fetches voucher/ticket/gift_card data from DB and normalizes it for pass generation.
 */
export async function getPassData(type: PassInput['type'], id: string) {
  switch (type) {
    case 'voucher': {
      const voucher = await prisma.voucher.findUnique({
        where: { id },
        include: { merchant: { select: { name: true, slug: true } } },
      });
      if (!voucher) throw new Error('Voucher not found');
      return {
        title: `${voucher.value}${voucher.type === 'percentage' ? '%' : ` ${voucher.currency}`} Off`,
        subtitle: voucher.merchant.name,
        description: `Discount voucher from ${voucher.merchant.name}`,
        validFrom: voucher.validFrom,
        validTo: voucher.validTo,
        redemptionUrl: `${BASE_URL}/redeem/voucher/${id}`,
        merchantName: voucher.merchant.name,
        value: `${voucher.value} ${voucher.type === 'percentage' ? '%' : voucher.currency}`,
        itemId: id,
        itemType: 'voucher' as const,
      };
    }

    case 'ticket': {
      const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: {
          event: { select: { name: true, eventDate: true, eventEndDate: true, location: true } },
          merchant: { select: { name: true } },
        },
      });
      if (!ticket) throw new Error('Ticket not found');
      return {
        title: ticket.event.name,
        subtitle: ticket.ticketType || 'General Admission',
        description: `Ticket for ${ticket.event.name}`,
        validFrom: ticket.event.eventDate,
        validTo: ticket.event.eventEndDate,
        redemptionUrl: `${BASE_URL}/redeem/ticket/${ticket.qrToken}`,
        merchantName: ticket.merchant.name,
        value: ticket.ticketNumber,
        venue: ticket.event.location,
        itemId: id,
        itemType: 'ticket' as const,
      };
    }

    case 'gift_card': {
      const giftCard = await prisma.giftCard.findUnique({
        where: { id },
        include: { merchant: { select: { name: true } } },
      });
      if (!giftCard) throw new Error('Gift card not found');
      return {
        title: `${(giftCard.amount / 100).toFixed(2)} ${giftCard.currency} Gift Card`,
        subtitle: giftCard.merchant.name,
        description: `Gift card from ${giftCard.merchant.name}`,
        validFrom: giftCard.validFrom,
        validTo: giftCard.validTo,
        redemptionUrl: `${BASE_URL}/redeem/gift-card/${giftCard.code}`,
        merchantName: giftCard.merchant.name,
        value: `${(giftCard.amount / 100).toFixed(2)} ${giftCard.currency}`,
        itemId: id,
        itemType: 'gift_card' as const,
      };
    }

    default:
      throw new Error(`Unknown pass type: ${type}`);
  }
}

/**
 * Generates an Apple Wallet .pkpass-compatible JSON structure.
 *
 * PRODUCTION: Use `passkit-generator` to create a signed .pkpass file:
 *   const pass = new PKPass(buffers, certs, passData);
 *   const buffer = pass.getAsBuffer();
 */
export function generateApplePass(data: Awaited<ReturnType<typeof getPassData>>): ApplePassData {
  const serialNumber = `vouchr-${data.itemType}-${data.itemId}-${Date.now()}`;

  const basePass: ApplePassData = {
    formatVersion: 1,
    passTypeIdentifier: 'pass.app.vouchr',
    serialNumber,
    teamIdentifier: 'TEAM_ID_HERE',
    organizationName: data.merchantName,
    description: data.description,
    logoText: data.merchantName,
    foregroundColor: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(60, 65, 76)',
    barcode: {
      message: data.redemptionUrl,
      format: 'PKBarcodeFormatQR',
      messageEncoding: 'iso-8859-1',
    },
  };

  if (data.itemType === 'ticket') {
    return {
      ...basePass,
      eventTicket: {
        primaryFields: [
          { key: 'event', label: 'EVENT', value: data.title },
        ],
        secondaryFields: [
          { key: 'type', label: 'TYPE', value: data.subtitle },
          ...(data.venue ? [{ key: 'venue', label: 'VENUE', value: data.venue }] : []),
        ],
        auxiliaryFields: [
          { key: 'ticket', label: 'TICKET #', value: data.value },
        ],
      },
      relevantDate: data.validFrom.toISOString(),
    };
  }

  if (data.itemType === 'gift_card') {
    return {
      ...basePass,
      storeCard: {
        primaryFields: [
          { key: 'balance', label: 'BALANCE', value: data.value },
        ],
        secondaryFields: [
          { key: 'merchant', label: 'MERCHANT', value: data.merchantName },
        ],
        auxiliaryFields: data.validTo
          ? [{ key: 'expires', label: 'EXPIRES', value: data.validTo.toISOString().split('T')[0] }]
          : [],
      },
    };
  }

  // Voucher / coupon
  return {
    ...basePass,
    coupon: {
      primaryFields: [
        { key: 'offer', label: 'DISCOUNT', value: data.value },
      ],
      secondaryFields: [
        { key: 'merchant', label: 'MERCHANT', value: data.merchantName },
      ],
      auxiliaryFields: [
        { key: 'valid', label: 'VALID UNTIL', value: data.validTo.toISOString().split('T')[0] },
      ],
    },
    expirationDate: data.validTo.toISOString(),
  };
}

/**
 * Generates a Google Wallet pass JWT-like object.
 *
 * PRODUCTION: Sign this payload with a Google service account key using `google-auth-library`:
 *   const jwt = new google.auth.JWT(serviceAccountEmail, null, privateKey, ['https://www.googleapis.com/auth/wallet_object.issuer']);
 *   const token = await jwt.fetchAccessToken();
 *   // Then call Google Wallet API to create the pass object
 */
export function generateGooglePassJwt(data: Awaited<ReturnType<typeof getPassData>>): GooglePassData {
  const objectId = `vouchr-${data.itemType}-${data.itemId}`;

  const textModules: GooglePassData['payload']['genericObjects'][0]['textModulesData'] = [
    { id: 'merchant', header: 'Merchant', body: data.merchantName },
    { id: 'value', header: 'Value', body: data.value },
  ];

  if (data.validTo) {
    textModules.push({
      id: 'expiry',
      header: 'Valid Until',
      body: data.validTo.toISOString().split('T')[0],
    });
  }

  return {
    iss: 'wallet-service-account@vouchr.iam.gserviceaccount.com',
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    payload: {
      genericObjects: [
        {
          id: `ISSUER_ID.${objectId}`,
          classId: `ISSUER_ID.vouchr_${data.itemType}`,
          state: 'ACTIVE',
          header: {
            defaultValue: { language: 'en', value: data.title },
          },
          subheader: {
            defaultValue: { language: 'en', value: data.subtitle },
          },
          barcode: {
            type: 'QR_CODE',
            value: data.redemptionUrl,
          },
          hexBackgroundColor: '#3c414c',
          textModulesData: textModules,
        },
      ],
    },
  };
}
