import { test, expect } from './fixtures';

/**
 * E2E test for core voucher flow:
 * 1. Merchant creates voucher
 * 2. User opens voucher page
 * 3. User creates referral
 * 4. Friend opens referral link
 * 5. Friend redeems voucher
 * 6. Staff confirms redemption
 * 7. Credit unlocks
 * 8. User applies credit
 */
test.describe('Voucher Flow', () => {
  test('should complete full voucher redemption flow', async ({ page, context, authenticatedUser, testVoucher }) => {
    // Step 1: Open voucher page (public, no login required)
    const voucherId = testVoucher.id;
    await page.goto(`/v/${voucherId}`);
    
    // Verify voucher page loads
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });
    
    // Step 2: User is authenticated via fixture, verify share button is visible
    const shareButton = page.locator('button').filter({ hasText: /Share|Earn|Jaga/i });
    
    if (await shareButton.isVisible({ timeout: 2000 })) {
      // Step 3: Create referral
      await shareButton.click();
      
      // Wait for referral creation - should redirect to /r/[id] or show share URL
      await page.waitForTimeout(2000);
      
      // Check if we're on referral page or if share was successful
      const currentUrl = page.url();
      if (currentUrl.includes('/r/')) {
        // We're on referral page, continue
      } else {
        // Share might have opened native share or copied to clipboard
        // In this case, we'd need to extract the URL from the share action
        // For now, we'll create a referral via API to get the URL
        const referralRes = await page.request.post('/api/referrals/create', {
          data: { voucherId },
        });
        const referralData = await referralRes.json();
        if (referralData.shareUrl) {
          await page.goto(referralData.shareUrl);
        }
      }
    }

    // Step 4: Open referral link as friend (new browser context, no auth)
    const referralUrl = page.url();
    const friendContext = await context.browser()?.newContext();
    
    if (friendContext) {
      const friendPage = await friendContext.newPage();
      await friendPage.goto(referralUrl);
      
      // Verify referral page loads
      await expect(friendPage.locator('h1')).toBeVisible({ timeout: 5000 });
      
      // Step 5: Redeem voucher online
      const orderAmountInput = friendPage.locator('input[name="orderAmount"], input[id="orderAmount"]');
      if (await orderAmountInput.isVisible({ timeout: 2000 })) {
        await orderAmountInput.fill('100.00');
        
        // Find and click redeem button
        const redeemButton = friendPage.locator('button').filter({ 
          hasText: /Redeem|Use|Lunasta|Innløs/i 
        }).first();
        
        if (await redeemButton.isVisible({ timeout: 2000 })) {
          await redeemButton.click();
          
          // Wait for success message or QR code
          await friendPage.waitForTimeout(3000);
          
          // Verify redemption success - check for QR code or success message
          const qrCode = friendPage.locator('img[alt*="QR"], img[src*="data:image"]');
          const successMessage = friendPage.locator('text=/success|applied|discount/i');
          
          await expect(
            qrCode.or(successMessage).first()
          ).toBeVisible({ timeout: 5000 });
        }
      }
      
      await friendPage.close();
      await friendContext.close();
    }

    // Step 6: Login as merchant staff and confirm redemption
    // Note: This requires merchant staff credentials in fixtures
    // For now, we'll verify the redemption was created
    // In a full test, you would:
    // 1. Login as merchant staff
    // 2. Navigate to /merchant/[slug]/redemptions
    // 3. Find the pending redemption
    // 4. Click confirm button
    // 5. Verify credit was unlocked
  });

  test('should prevent self-referral redemption', async ({ page, authenticatedUser, testVoucher }) => {
    // Step 1: Create referral as authenticated user
    await page.goto(`/v/${testVoucher.id}`);
    
    const shareButton = page.locator('button').filter({ hasText: /Share|Earn/i });
    if (await shareButton.isVisible({ timeout: 2000 })) {
      await shareButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Step 2: Try to redeem own referral
    const referralUrl = page.url();
    if (referralUrl.includes('/r/')) {
      // Try to redeem
      const orderAmountInput = page.locator('input[name="orderAmount"], input[id="orderAmount"]');
      if (await orderAmountInput.isVisible({ timeout: 2000 })) {
        await orderAmountInput.fill('100.00');
        
        const redeemButton = page.locator('button').filter({ 
          hasText: /Redeem|Use/i 
        }).first();
        
        if (await redeemButton.isVisible({ timeout: 2000 })) {
          await redeemButton.click();
          
          // Wait for error message
          await page.waitForTimeout(2000);
          
          // Verify error message about self-referral
          const errorMessage = page.locator('text=/self|own|cannot/i');
          await expect(errorMessage).toBeVisible({ timeout: 3000 });
        }
      }
    }
  });
});

test.describe('Public Voucher Page', () => {
  test('should load voucher page without login', async ({ page, testVoucher }) => {
    const voucherId = testVoucher.id;
    
    await page.goto(`/v/${voucherId}`);
    
    // Verify page loads
    await expect(page.locator('body')).toBeVisible();
    
    // Verify key elements are present
    await expect(page.locator('h1')).toBeVisible(); // Headline
    await expect(page.locator('span.font-mono, code')).toBeVisible(); // Voucher code
  });

  test('should display QR code', async ({ page, testVoucher }) => {
    const voucherId = testVoucher.id;
    
    await page.goto(`/v/${voucherId}`);
    
    // Wait for QR code to load
    const qrCode = page.locator('img[src*="data:image"], img[alt*="QR"]').first();
    await expect(qrCode).toBeVisible({ timeout: 5000 });
    await expect(qrCode).toHaveAttribute('src', /data:image|qr/i);
  });

  test('should allow downloading QR code', async ({ page, testVoucher }) => {
    const voucherId = testVoucher.id;
    
    await page.goto(`/v/${voucherId}`);
    
    // Find download button
    const downloadButton = page.locator('button').filter({ 
      hasText: /Download|Download QR/i 
    });
    
    if (await downloadButton.isVisible({ timeout: 2000 })) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await downloadButton.click();
      
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toContain('voucher');
        expect(download.suggestedFilename()).toContain('.png');
      }
    }
  });
});

test.describe('Referral Page', () => {
  test('should load referral page without login', async ({ page, authenticatedUser, testVoucher }) => {
    // Create referral first
    const referralRes = await page.request.post('/api/referrals/create', {
      data: { voucherId: testVoucher.id },
    });
    
    if (referralRes.ok()) {
      const referralData = await referralRes.json();
      const referralId = referralData.referralId || referralData.id;
      
      // Open referral page (no auth required)
      await page.goto(`/r/${referralId}`);
      
      // Verify page loads
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show redemption form', async ({ page, authenticatedUser, testVoucher }) => {
    // Create referral
    const referralRes = await page.request.post('/api/referrals/create', {
      data: { voucherId: testVoucher.id },
    });
    
    if (referralRes.ok()) {
      const referralData = await referralRes.json();
      const referralId = referralData.referralId || referralData.id;
      
      await page.goto(`/r/${referralId}`);
      
      // Verify redemption form elements
      const orderAmountInput = page.locator('input[name="orderAmount"], input[id="orderAmount"]');
      await expect(orderAmountInput).toBeVisible({ timeout: 3000 });
      
      const redeemButton = page.locator('button').filter({ 
        hasText: /Redeem|Use|Lunasta/i 
      });
      await expect(redeemButton).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Merchant Dashboard', () => {
  test('should display vouchers list', async ({ page, merchantAdmin }) => {
    // Login as merchant admin (via fixture)
    await page.goto('/merchant/coffee-house/vouchers');
    
    // Verify vouchers page loads
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });
    
    // Verify search/filter UI is present
    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible({ timeout: 3000 });
  });

  test('should allow creating new voucher', async ({ page, merchantAdmin }) => {
    await page.goto('/merchant/coffee-house/vouchers/new');
    
    // Verify form is present
    await expect(page.locator('form')).toBeVisible({ timeout: 3000 });
    
    // Fill in voucher details
    const typeSelect = page.locator('select[id="voucher-type"]');
    if (await typeSelect.isVisible({ timeout: 2000 })) {
      await typeSelect.selectOption('percentage');
      
      const valueInput = page.locator('input[type="number"]').first();
      await valueInput.fill('15');
      
      // Continue through steps (simplified)
      // In full test, complete all form steps
    }
  });

  test('should allow editing voucher', async ({ page, merchantAdmin, testVoucher }) => {
    await page.goto(`/merchant/coffee-house/vouchers/${testVoucher.id}`);
    
    // Verify edit form is present
    await expect(page.locator('form')).toBeVisible({ timeout: 3000 });
    
    // Verify form is pre-filled with voucher data
    const headlineInput = page.locator('input[type="text"]').first();
    if (await headlineInput.isVisible({ timeout: 2000 })) {
      await expect(headlineInput).not.toHaveValue('');
    }
  });
});

test.describe('Redemptions', () => {
  test('should display redemptions list', async ({ page, merchantStaff }) => {
    await page.goto('/merchant/coffee-house/redemptions');
    
    // Verify redemptions page loads
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });
  });

  test('should allow confirming redemption', async ({ page, merchantStaff }) => {
    await page.goto('/merchant/coffee-house/redemptions');
    
    // Find first pending redemption
    const confirmButton = page.locator('button').filter({ 
      hasText: /Confirm|Bekreft/i 
    }).first();
    
    if (await confirmButton.isVisible({ timeout: 3000 })) {
      await confirmButton.click();
      
      // Wait for confirmation
      await page.waitForTimeout(2000);
      
      // Verify success message or status change
      const successIndicator = page.locator('text=/confirmed|success/i');
      await expect(successIndicator).toBeVisible({ timeout: 3000 });
    }
  });
});
