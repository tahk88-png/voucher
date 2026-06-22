/**
 * EU VIES API — VAT number validation for B2B reverse charge.
 *
 * Uses the official European Commission VIES SOAP service.
 * Required for B2B VAT exemption: validate customer VAT number before
 * applying reverse charge (0% VAT).
 *
 * Endpoint: https://ec.europa.eu/taxation_customs/vies/services/checkVatService
 */

import { captureException } from '@/lib/error-tracking';

export type ViesValidationResult = {
  valid: boolean;
  countryCode: string;
  vatNumber: string;
  name?: string;
  address?: string;
  requestDate: string;
  error?: string;
};

const VIES_WSDL_URL =
  'https://ec.europa.eu/taxation_customs/vies/services/checkVatService';

/**
 * Validate an EU VAT number via the VIES SOAP API.
 *
 * @param fullVatNumber e.g. "DE123456789", "EE101234567"
 * @returns Validation result with company name/address if valid
 */
export async function validateVatNumber(
  fullVatNumber: string
): Promise<ViesValidationResult> {
  const cleaned = fullVatNumber.replace(/[\s.-]/g, '').toUpperCase();
  const countryCode = cleaned.slice(0, 2);
  const vatNumber = cleaned.slice(2);

  if (!/^[A-Z]{2}$/.test(countryCode) || vatNumber.length < 2) {
    return {
      valid: false,
      countryCode,
      vatNumber,
      requestDate: new Date().toISOString(),
      error: 'Invalid VAT number format',
    };
  }

  const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:urn="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
  <soapenv:Body>
    <urn:checkVat>
      <urn:countryCode>${countryCode}</urn:countryCode>
      <urn:vatNumber>${vatNumber}</urn:vatNumber>
    </urn:checkVat>
  </soapenv:Body>
</soapenv:Envelope>`;

  try {
    const response = await fetch(VIES_WSDL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        SOAPAction: '',
      },
      body: soapBody,
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`VIES HTTP ${response.status}`);
    }

    const xml = await response.text();

    const valid = extractXmlValue(xml, 'valid') === 'true';
    const name = extractXmlValue(xml, 'name') || undefined;
    const address = extractXmlValue(xml, 'address') || undefined;
    const requestDate =
      extractXmlValue(xml, 'requestDate') || new Date().toISOString();

    return { valid, countryCode, vatNumber, name, address, requestDate };
  } catch (error) {
    captureException(error instanceof Error ? error : new Error(String(error)), {
      context: 'vies_vat_validation',
      vatNumber: `${countryCode}***`,
    });

    return {
      valid: false,
      countryCode,
      vatNumber,
      requestDate: new Date().toISOString(),
      error:
        error instanceof Error
          ? error.message
          : 'VIES service unavailable',
    };
  }
}

/**
 * Check if a country code is an EU member state.
 */
export function isEuCountry(countryCode: string): boolean {
  return EU_COUNTRY_CODES.has(countryCode.toUpperCase());
}

const EU_COUNTRY_CODES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
]);

/** Simple XML value extractor (avoid XML parser dependency). */
function extractXmlValue(xml: string, tag: string): string | null {
  // Match both namespaced and non-namespaced tags
  const regex = new RegExp(`<(?:\\w+:)?${tag}>([^<]*)</(?:\\w+:)?${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}
