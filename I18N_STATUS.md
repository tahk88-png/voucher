# Rahvusvaheliseks tegemise staatus

## ✅ Valmis

1. **i18n konfiguratsioon**
   - ✅ 5 keelt: en, et, es, fr, de
   - ✅ Routing konfiguratsioon
   - ✅ Middleware locale detection'iga

2. **Tõlked**
   - ✅ Inglise (en) - täielik
   - ✅ Eesti (et) - täielik
   - ✅ Hispaania (es) - täielik
   - ✅ Prantsuse (fr) - täielik
   - ✅ Saksa (de) - täielik

3. **Komponendid**
   - ✅ Language selector
   - ✅ Locale-aware layout
   - ✅ i18n utilities (valuuta, kuupäevad)

4. **Dokumentatsioon**
   - ✅ I18N_GUIDE.md - täielik juhend

## ⚠️ Vajab täiendamist

### 1. Olemasolevate lehtede migreerimine

Praegu on palju lehti, mis ei kasuta tõlkeid. Need tuleb järk-järgult migreerida:

**Prioriteet 1 (kõrge):**
- `app/login/page.tsx`
- `app/app/page.tsx`
- `app/v/[id]/voucher-client.tsx`
- `app/r/[id]/referral-client.tsx`

**Prioriteet 2 (keskmine):**
- `app/merchant/[slug]/dashboard/page.tsx`
- `app/merchant/[slug]/vouchers/page.tsx`
- `app/merchant/[slug]/vouchers/new/page.tsx`
- `app/app/[merchantSlug]/wallet/page.tsx`

**Prioriteet 3 (madal):**
- Kõik ülejäänud lehed

### 2. Kuidas migreerida lehte

1. **Lisa `useTranslations` hook**:
   ```typescript
   import { useTranslations } from 'next-intl';
   
   const t = useTranslations('voucher');
   ```

2. **Asenda hardcoded stringid**:
   ```typescript
   // Enne:
   <h1>Vouchers</h1>
   
   // Pärast:
   <h1>{t('vouchers')}</h1>
   ```

3. **Kasuta `Link` komponenti `@/routing`'ist**:
   ```typescript
   import { Link } from '@/routing';
   ```

### 3. URL struktuur

Praegu:
- `/v/[id]` - töötab (inglise keel)
- `/et/v/[id]` - töötab (eesti keel)
- `/es/v/[id]` - töötab (hispaania keel)

Kõik lehed peaksid toetama locale prefix'it.

## 📝 Järgmised sammud

1. **Migreeri kõige kasutatavamad lehed** (login, voucher, referral)
2. **Testi kõik keeled**
3. **Lisa puuduvad tõlked** (kui vaja)
4. **Paranda URL struktuuri** (kui vaja)

## 🎯 Eesmärk

Kõik lehed peaksid:
- ✅ Kasutama tõlkeid
- ✅ Toetama kõiki 5 keelt
- ✅ Säilitama keele URL-is
- ✅ Näitama keele valijat

## 💡 Märkused

- Vaikimisi keel on inglise
- Kui URL-is pole keelt, kasutatakse vaikimisi keelt
- Keel salvestatakse URL-is, seega jagatud lingid säilitavad keele
- Kõik tõlked on `messages/[locale].json` failides
