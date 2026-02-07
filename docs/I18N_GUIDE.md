# Rahvusvaheliseks tegemise juhend

## Toetatud keeled

Platvorm toetab praegu järgmisi keeli:
- **en** - English (inglise)
- **et** - Eesti (eesti)
- **es** - Español (hispaania)
- **fr** - Français (prantsuse)
- **de** - Deutsch (saksa)

## Kuidas see töötab

### 1. URL struktuur

- Inglise (vaikimisi): `/v/[id]` või `/en/v/[id]`
- Eesti: `/et/v/[id]`
- Hispaania: `/es/v/[id]`
- jne.

### 2. Keele valik

Keele valija on kõikjal lehe ülaosas paremal. Kasutaja saab valida keele, mis rakendatakse kogu platvormile.

### 3. Tõlked

Kõik tõlked on `messages/[locale].json` failides. Struktuur on järgmine:

```json
{
  "common": { ... },
  "voucher": { ... },
  "merchant": { ... },
  "wallet": { ... },
  ...
}
```

## Kuidas kasutada tõlkeid

### Server Components

```typescript
import { useTranslations } from 'next-intl';

export default function MyPage() {
  const t = useTranslations('common');
  return <h1>{t('welcome')}</h1>;
}
```

### Client Components

```typescript
'use client';
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('voucher');
  return <button>{t('share')}</button>;
}
```

### Linkide kasutamine

```typescript
import { Link } from '@/routing';

<Link href="/vouchers">Vouchers</Link>
```

See tagab, et link säilitab praeguse keele.

## Uue keele lisamine

1. **Lisa keel konfiguratsiooni**:
   ```typescript
   // i18n.ts
   export const locales = ['en', 'et', 'es', 'fr', 'de', 'fi'] as const;
   ```

2. **Lisa keel routing'usse**:
   ```typescript
   // routing.ts
   locales: ['en', 'et', 'es', 'fr', 'de', 'fi']
   ```

3. **Loo tõlke fail**:
   ```bash
   cp messages/en.json messages/fi.json
   ```

4. **Tõlgi kõik stringid** `messages/fi.json` failis.

5. **Lisa keele nimi**:
   ```typescript
   // components/language-selector.tsx
   const languageNames: Record<string, string> = {
     // ...
     fi: 'Suomi',
   };
   ```

## Valuuta formaatimine

Valuuta formaatimine on automaatselt kohandatud keele järgi:

```typescript
import { formatCurrencyWithLocale } from '@/lib/i18n-utils';

formatCurrencyWithLocale(5000, 'EUR', 'et'); // "50,00 €"
formatCurrencyWithLocale(5000, 'EUR', 'en'); // "€50.00"
```

## Kuupäevade formaatimine

```typescript
import { formatDateWithLocale } from '@/lib/i18n-utils';

formatDateWithLocale(new Date(), 'et'); // "1. jaanuar 2024"
formatDateWithLocale(new Date(), 'en'); // "January 1, 2024"
```

## Märkused

- Vaikimisi keel on inglise (`en`)
- Kui URL-is pole keelt, kasutatakse vaikimisi keelt
- Keel salvestatakse URL-is, seega jagatud lingid säilitavad keele
- Kõik tõlked peaksid olema `messages/[locale].json` failides

## Testimine

1. Muuda keelt keele valijas
2. Kontrolli, et kõik tekstid on tõlgitud
3. Kontrolli, et linkid säilitavad keele
4. Testi erinevate keeltega
