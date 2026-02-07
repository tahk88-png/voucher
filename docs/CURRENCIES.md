# How to Add a New Merchant Currency

Merchants can use any ISO 4217 currency code. The system supports all currencies that JavaScript's `Intl.NumberFormat` supports.

## Adding Currency Support

1. **Set merchant currency**:
   When creating or updating a merchant, set the `defaultCurrency` field to the ISO 4217 code (e.g., "EUR", "GBP", "JPY").

2. **Currency formatting**:
   The `formatCurrency` function in `lib/utils.ts` automatically formats currencies using the browser's locale-aware formatting:
   ```typescript
   formatCurrency(5000, 'EUR') // "€50.00" (in en-US locale)
   formatCurrency(5000, 'JPY') // "¥50" (no decimals for JPY)
   ```

3. **Database storage**:
   All monetary amounts are stored in minor units (cents for USD, pence for GBP, etc.):
   - USD: $5.00 = 500 (minor units)
   - EUR: €5.00 = 500 (minor units)
   - JPY: ¥50 = 50 (no minor units)

4. **Voucher creation**:
   When creating a voucher, specify the currency:
   ```json
   {
     "type": "fixed_amount",
     "value": 500,  // in minor units
     "currency": "EUR"
   }
   ```

## Supported Currencies

All ISO 4217 currencies are supported. Common examples:
- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- JPY (Japanese Yen)
- CAD (Canadian Dollar)
- AUD (Australian Dollar)
- CHF (Swiss Franc)
- CNY (Chinese Yuan)

## Currency Conversion

The platform does NOT handle currency conversion. Each merchant operates in a single currency. If you need multi-currency support with conversion, you would need to:
1. Add a currency conversion service (e.g., ExchangeRate API)
2. Store exchange rates
3. Convert amounts at redemption time
