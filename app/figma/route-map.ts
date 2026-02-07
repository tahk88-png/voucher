import type { ComponentType } from 'react';
import { Landing } from '@/figma/app/pages/Landing';
import LandingPage from '@/figma/app/LandingPage';
import { Login } from '@/figma/app/pages/Login';
import { CampaignHub } from '@/figma/app/pages/CampaignHub';
import { CampaignDetail } from '@/figma/app/pages/CampaignDetail';
import { VoucherOffers } from '@/figma/app/pages/VoucherOffers';
import { VoucherPublic } from '@/figma/app/pages/VoucherPublic';
import { GiftCardPublic } from '@/figma/app/pages/GiftCardPublic';
import { EventPublic } from '@/figma/app/pages/EventPublic';
import { StaffRedeem } from '@/figma/app/pages/StaffRedeem';
import { RentalHub } from '@/figma/app/pages/RentalHub';
import { RentalDetail } from '@/figma/app/pages/RentalDetail';
import { ShopHub } from '@/figma/app/pages/ShopHub';
import { ProductDetail } from '@/figma/app/pages/ProductDetail';
import { Cart } from '@/figma/app/pages/Cart';
import { MerchantProfilePublic } from '@/figma/app/pages/MerchantProfilePublic';
import { B2BSolutions } from '@/figma/app/pages/B2BSolutions';
import { TermsOfService } from '@/figma/app/pages/TermsOfService';
import { SignDocument } from '@/figma/app/pages/SignDocument';
import { ScannerLogin } from '@/figma/app/pages/ScannerLogin';

import { MerchantDashboard } from '@/figma/app/pages/MerchantDashboard';
import { StorefrontEditor } from '@/figma/app/pages/StorefrontEditor';
import { IntegrationsSettings } from '@/figma/app/pages/IntegrationsSettings';
import { UserDashboard } from '@/figma/app/pages/UserDashboard';
import { AdminDashboard } from '@/figma/app/pages/AdminDashboard';
import { EmailTemplates } from '@/figma/app/pages/EmailTemplates';
import { Analytics } from '@/figma/app/pages/Analytics';
import { ProductCreate } from '@/figma/app/pages/ProductCreate';
import { CreateOrder } from '@/figma/app/pages/CreateOrder';
import { MultiScannerDashboard } from '@/figma/app/pages/MultiScannerDashboard';
import { CampaignsList } from '@/figma/app/pages/CampaignsList';
import { CampaignAdminDetail } from '@/figma/app/pages/CampaignAdminDetail';
import { CampaignCreate } from '@/figma/app/pages/CampaignCreate';
import { NewsCreate } from '@/figma/app/pages/NewsCreate';
import { VouchersList } from '@/figma/app/pages/VouchersList';
import { VoucherCreate } from '@/figma/app/pages/VoucherCreate';
import { DiscountCodes } from '@/figma/app/pages/DiscountCodes';
import { GiftCardsList } from '@/figma/app/pages/GiftCardsList';
import { GiftCardCreate } from '@/figma/app/pages/GiftCardCreate';
import { EventsList } from '@/figma/app/pages/EventsList';
import { EventCreate } from '@/figma/app/pages/EventCreate';
import { EventDetail } from '@/figma/app/pages/EventDetail';
import { Promotions } from '@/figma/app/pages/Promotions';
import { BonusAccounting } from '@/figma/app/pages/BonusAccounting';
import { Share } from '@/figma/app/pages/Share';
import { UserShare } from '@/figma/app/pages/UserShare';
import { Referrals } from '@/figma/app/pages/Referrals';
import { Wallet } from '@/figma/app/pages/Wallet';
import { MerchantWallet } from '@/figma/app/pages/MerchantWallet';
import { EmailComposer } from '@/figma/app/pages/EmailComposer';
import { Notifications } from '@/figma/app/pages/Notifications';
import { Billing } from '@/figma/app/pages/Billing';
import { QRCodes } from '@/figma/app/pages/QRCodes';
import { MobileScanner } from '@/figma/app/pages/MobileScanner';
import { Settings } from '@/figma/app/pages/Settings';
import { AdvancedSettings } from '@/figma/app/pages/AdvancedSettings';
import { MerchantOnboarding } from '@/figma/app/pages/MerchantOnboarding';
import { SubscriptionPlans } from '@/figma/app/pages/SubscriptionPlans';
import { SubscriptionSuccess } from '@/figma/app/pages/SubscriptionSuccess';
import { SubscriptionManage } from '@/figma/app/pages/SubscriptionManage';
import { NotFound } from '@/figma/app/pages/NotFound';
import { CommunicationHub } from '@/figma/app/pages/CommunicationHub';
import { FinanceManager } from '@/figma/app/pages/FinanceManager';
import { LogisticsManager } from '@/figma/app/pages/LogisticsManager';
import { OrderManager } from '@/figma/app/pages/OrderManager';
import { ProductManage } from '@/figma/app/pages/ProductManage';
import { RentalManage } from '@/figma/app/pages/RentalManage';
import { WarehousePage } from '@/figma/app/pages/WarehousePage';
import { ComponentShowcase } from '@/figma/app/pages/ComponentShowcase';
import { DomainSettings } from '@/figma/app/pages/DomainSettings';

export type FigmaRoute = {
  title: string;
  path: string;
  component: ComponentType;
  layout?: 'dashboard' | 'public-catalog';
};

export const FIGMA_ROUTES: FigmaRoute[] = [
  { title: 'Home', path: '/home', component: Landing },
  { title: 'Landing', path: '/', component: Landing },
  { title: 'Deals Landing', path: '/deals', component: LandingPage },
  { title: 'B2B Solutions', path: '/b2b-solutions', component: B2BSolutions },
  { title: 'Terms of Service', path: '/terms', component: TermsOfService },
  { title: 'Sign Document', path: '/sign-document', component: SignDocument },
  { title: 'Login', path: '/login', component: Login },
  { title: 'Scanner Login', path: '/scanner-login', component: ScannerLogin },
  { title: 'Campaign Hub', path: '/campaigns', component: CampaignHub },
  { title: 'Campaign Detail', path: '/campaign/:id', component: CampaignDetail },
  { title: 'Voucher Offers', path: '/voucher', component: VoucherOffers },
  { title: 'Voucher Public', path: '/voucher/:id', component: VoucherPublic },
  { title: 'Gift Card Public', path: '/gift-card/:id', component: GiftCardPublic },
  { title: 'Event Public', path: '/event/:id', component: EventPublic },
  { title: 'Staff Redeem', path: '/redeem', component: StaffRedeem },
  { title: 'Rental Hub', path: '/rentals', component: RentalHub },
  { title: 'Rental Detail', path: '/rentals/:id', component: RentalDetail },
  { title: 'Shop Hub', path: '/shop', component: ShopHub },
  { title: 'Product Detail', path: '/shop/:id', component: ProductDetail },
  { title: 'Cart', path: '/cart', component: Cart },
  { title: 'Merchant Public Profile', path: '/merchant/:id', component: MerchantProfilePublic },

  { title: 'Merchant Dashboard', path: '/dashboard', component: MerchantDashboard, layout: 'dashboard' },
  { title: 'Storefront Editor', path: '/store-builder', component: StorefrontEditor, layout: 'dashboard' },
  { title: 'Integrations', path: '/integrations', component: IntegrationsSettings, layout: 'dashboard' },
  { title: 'User Dashboard', path: '/user-dashboard', component: UserDashboard, layout: 'dashboard' },
  { title: 'Admin Dashboard', path: '/admin-dashboard', component: AdminDashboard, layout: 'dashboard' },
  { title: 'Email Templates', path: '/admin/email-templates', component: EmailTemplates, layout: 'dashboard' },
  { title: 'Analytics', path: '/analytics', component: Analytics, layout: 'dashboard' },
  { title: 'Product Create', path: '/products/create', component: ProductCreate, layout: 'dashboard' },
  { title: 'Order Create', path: '/orders/create', component: CreateOrder, layout: 'dashboard' },
  { title: 'Multi Scanner', path: '/multi-scanner', component: MultiScannerDashboard, layout: 'dashboard' },
  { title: 'Campaigns List', path: '/campaigns-list', component: CampaignsList, layout: 'dashboard' },
  { title: 'Campaign Admin Detail', path: '/campaigns/:id/admin', component: CampaignAdminDetail, layout: 'dashboard' },
  { title: 'Campaign Create', path: '/campaigns/create', component: CampaignCreate, layout: 'dashboard' },
  { title: 'Campaign Create Alias', path: '/create-campaign', component: CampaignCreate, layout: 'dashboard' },
  { title: 'News Create', path: '/news/create', component: NewsCreate, layout: 'dashboard' },
  { title: 'Vouchers List', path: '/vouchers', component: VouchersList, layout: 'dashboard' },
  { title: 'Voucher Create', path: '/vouchers/create', component: VoucherCreate, layout: 'dashboard' },
  { title: 'Discount Codes', path: '/discounts', component: DiscountCodes, layout: 'dashboard' },
  { title: 'Gift Cards List', path: '/gift-cards', component: GiftCardsList, layout: 'public-catalog' },
  { title: 'Gift Card Create', path: '/gift-cards/create', component: GiftCardCreate, layout: 'dashboard' },
  { title: 'Events List', path: '/events', component: EventsList, layout: 'public-catalog' },
  { title: 'Event Create', path: '/events/create', component: EventCreate, layout: 'dashboard' },
  { title: 'Event Detail', path: '/events/:id', component: EventDetail, layout: 'dashboard' },
  { title: 'Event Edit', path: '/events/:id/edit', component: EventCreate, layout: 'dashboard' },
  { title: 'Promotions', path: '/promotions', component: Promotions, layout: 'dashboard' },
  { title: 'Bonus Accounting', path: '/bonus-accounting', component: BonusAccounting, layout: 'dashboard' },
  { title: 'Share', path: '/share', component: Share, layout: 'dashboard' },
  { title: 'User Share', path: '/user-share', component: UserShare, layout: 'dashboard' },
  { title: 'Referrals', path: '/referrals', component: Referrals, layout: 'dashboard' },
  { title: 'Wallet', path: '/wallet', component: Wallet, layout: 'dashboard' },
  { title: 'Merchant Wallet', path: '/merchant-wallet', component: MerchantWallet, layout: 'dashboard' },
  { title: 'Email Composer', path: '/email-composer', component: EmailComposer, layout: 'dashboard' },
  { title: 'Notifications', path: '/notifications', component: Notifications, layout: 'dashboard' },
  { title: 'Billing', path: '/billing', component: Billing, layout: 'dashboard' },
  { title: 'QR Codes', path: '/qr-codes', component: QRCodes, layout: 'dashboard' },
  { title: 'Mobile Scanner', path: '/mobile-scanner', component: MobileScanner, layout: 'dashboard' },
  { title: 'Settings', path: '/settings', component: Settings, layout: 'dashboard' },
  { title: 'Advanced Settings', path: '/advanced-settings', component: AdvancedSettings, layout: 'dashboard' },
  { title: 'Merchant Onboarding', path: '/merchant-onboarding', component: MerchantOnboarding, layout: 'dashboard' },
  { title: 'Subscription Plans', path: '/subscription-plans', component: SubscriptionPlans, layout: 'dashboard' },
  { title: 'Subscription Success', path: '/subscription-success', component: SubscriptionSuccess, layout: 'dashboard' },
  { title: 'Subscription Manage', path: '/subscription-manage', component: SubscriptionManage, layout: 'dashboard' },
  { title: 'Communication Hub', path: '/extra/communication-hub', component: CommunicationHub, layout: 'dashboard' },
  { title: 'Finance Manager', path: '/extra/finance-manager', component: FinanceManager, layout: 'dashboard' },
  { title: 'Logistics Manager', path: '/extra/logistics-manager', component: LogisticsManager, layout: 'dashboard' },
  { title: 'Order Manager', path: '/extra/order-manager', component: OrderManager, layout: 'dashboard' },
  { title: 'Product Manage', path: '/extra/product-manage', component: ProductManage, layout: 'dashboard' },
  { title: 'Rental Manage', path: '/extra/rental-manage', component: RentalManage, layout: 'dashboard' },
  { title: 'Warehouse', path: '/extra/warehouse', component: WarehousePage, layout: 'dashboard' },
  { title: 'Component Showcase', path: '/extra/components', component: ComponentShowcase, layout: 'dashboard' },
  { title: 'Domain Settings', path: '/extra/domain-settings', component: DomainSettings, layout: 'dashboard' },

  { title: 'Not Found', path: '*', component: NotFound },
];

export function matchFigmaRoute(pathname: string): { route: FigmaRoute; params: Record<string, string> } | null {
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  for (const route of FIGMA_ROUTES) {
    if (route.path === '*') continue;
    const routeSegments = route.path.split('/').filter(Boolean);
    const pathSegments = cleanPath.split('/').filter(Boolean);
    if (routeSegments.length !== pathSegments.length) continue;
    const params: Record<string, string> = {};
    let matched = true;
    for (let i = 0; i < routeSegments.length; i += 1) {
      const routeSegment = routeSegments[i];
      const pathSegment = pathSegments[i];
      if (routeSegment.startsWith(':')) {
        params[routeSegment.slice(1)] = pathSegment;
        continue;
      }
      if (routeSegment !== pathSegment) {
        matched = false;
        break;
      }
    }
    if (matched) {
      return { route, params };
    }
  }
  return null;
}
