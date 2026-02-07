# Toast Notifications Migration Guide

## Asendada alert() kutsed toast'idega

### Enne:
```typescript
alert('Voucher published successfully!');
```

### Pärast:
```typescript
import { showSuccess } from '@/lib/toast-helpers';

showSuccess('Voucher published successfully!');
```

## Näited kasutamisest

### Success toast
```typescript
import { showSuccess } from '@/lib/toast-helpers';

showSuccess('Voucher created successfully!');
showSuccess('Credit applied!', 'Success');
```

### Error toast
```typescript
import { showError } from '@/lib/toast-helpers';

showError('Failed to create voucher');
showError('Insufficient credit balance', 'Error');
```

### Info toast
```typescript
import { showInfo } from '@/lib/toast-helpers';

showInfo('Processing your request...');
```

### Loading Button kasutamine
```typescript
import { LoadingButton } from '@/components/ui/loading-button';

<LoadingButton 
  loading={isLoading} 
  loadingText="Publishing..."
  onClick={handlePublish}
>
  Publish Voucher
</LoadingButton>
```

## Failid, mida uuendada

1. `app/merchant/[slug]/vouchers/[id]/publish-button.tsx`
2. `app/merchant/[slug]/vouchers/new/page.tsx`
3. `app/merchant/[slug]/redemptions/confirm-button.tsx`
4. `app/r/[id]/referral-client.tsx`
5. `app/app/[merchantSlug]/checkout-demo/page.tsx`
6. `app/v/[id]/voucher-client.tsx`
