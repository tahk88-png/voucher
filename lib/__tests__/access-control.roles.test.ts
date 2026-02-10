import { describe, expect, it } from 'vitest';
import {
  APP_PERMISSIONS,
  getHighestRole,
  hasPermission,
  resolveDefaultLanding,
  roleFromTenantMembership,
} from '@/lib/access-control/roles';

describe('access-control roles', () => {
  it('maps tenant membership role to app role', () => {
    expect(roleFromTenantMembership('merchant_staff')).toBe('tenant_staff');
    expect(roleFromTenantMembership('merchant_admin')).toBe('tenant_owner');
  });

  it('resolves highest role by priority', () => {
    expect(getHighestRole(['end_user', 'tenant_staff'])).toBe('tenant_staff');
    expect(getHighestRole(['tenant_owner', 'platform_admin'])).toBe('platform_admin');
    expect(getHighestRole([])).toBe('guest');
  });

  it('enforces permission matrix correctly', () => {
    expect(hasPermission('guest', 'shop.checkout')).toBe(false);
    expect(hasPermission('end_user', 'shop.checkout')).toBe(true);
    expect(hasPermission('tenant_staff', 'voucher.redeem')).toBe(true);
    expect(hasPermission('tenant_staff', 'tenant.members.manage')).toBe(false);
    expect(hasPermission('tenant_owner', 'tenant.members.manage')).toBe(true);
  });

  it('grants every permission to platform_admin', () => {
    for (const permission of APP_PERMISSIONS) {
      expect(hasPermission('platform_admin', permission)).toBe(true);
    }
  });

  it('resolves role default landing paths', () => {
    expect(resolveDefaultLanding('end_user')).toBe('/app');
    expect(resolveDefaultLanding('tenant_owner', 'acme')).toBe('/merchant/acme/dashboard');
    expect(resolveDefaultLanding('platform_admin')).toBe('/admin');
  });
});
