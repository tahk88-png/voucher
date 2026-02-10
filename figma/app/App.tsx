import { Settings } from '@/figma/app/pages/Settings';
import { AdvancedSettings } from '@/figma/app/pages/AdvancedSettings';
import { Login } from '@/figma/app/pages/Login';
import { BrowserRouter, Routes, Route } from '@/lib/router-shim';
import { CountryProvider } from '@/figma/app/contexts/CountryContext';
import { LanguageProvider } from '@/figma/app/contexts/LanguageContext';
import { AdminSettingsProvider } from '@/figma/app/contexts/AdminSettings';
import { BonusTrackingProvider } from '@/figma/app/contexts/BonusTracking';
import { CartProvider } from '@/figma/app/contexts/CartContext';
import { AuthProvider } from '@/figma/app/contexts/AuthContext';
import LandingPage from '@/figma/app/LandingPage';
import { Landing } from '@/figma/app/pages/Landing';
import { MerchantDashboard } from '@/figma/app/pages/MerchantDashboard';
import { UserDashboard } from '@/figma/app/pages/UserDashboard';
import { AdminDashboard } from '@/figma/app/pages/AdminDashboard';
import { Analytics } from '@/figma/app/pages/Analytics';
import { CampaignsList } from '@/figma/app/pages/CampaignsList';
import { CampaignCreate } from '@/figma/app/pages/CampaignCreate';
import { NewsCreate } from '@/figma/app/pages/NewsCreate';
import { CampaignHub } from '@/figma/app/pages/CampaignHub';
import { CampaignDetail } from '@/figma/app/pages/CampaignDetail';
import { CampaignAdminDetail } from '@/figma/app/pages/CampaignAdminDetail';
import { VouchersList } from '@/figma/app/pages/VouchersList';
import { VoucherCreate } from '@/figma/app/pages/VoucherCreate';
import { VoucherPublic } from '@/figma/app/pages/VoucherPublic';
import { VoucherOffers } from '@/figma/app/pages/VoucherOffers';
import { DiscountCodes } from '@/figma/app/pages/DiscountCodes';
import { GiftCardsList } from '@/figma/app/pages/GiftCardsList';
import { GiftCardCreate } from '@/figma/app/pages/GiftCardCreate';
import { GiftCardPublic } from '@/figma/app/pages/GiftCardPublic';
import { EventsList } from '@/figma/app/pages/EventsList';
import { EventCreate } from '@/figma/app/pages/EventCreate';
import { EventPublic } from '@/figma/app/pages/EventPublic';
import { EventDetail } from '@/figma/app/pages/EventDetail';
import { Wallet } from '@/figma/app/pages/Wallet';
import { Referrals } from '@/figma/app/pages/Referrals';
import { Notifications } from '@/figma/app/pages/Notifications';
import { Billing } from '@/figma/app/pages/Billing';
import { BonusAccounting } from '@/figma/app/pages/BonusAccounting';
import { Promotions } from '@/figma/app/pages/Promotions';
import { Share } from '@/figma/app/pages/Share';
import { UserShare } from '@/figma/app/pages/UserShare';
import { StaffRedeem } from '@/figma/app/pages/StaffRedeem';
import { QRCodes } from '@/figma/app/pages/QRCodes';
import { MobileScanner } from '@/figma/app/pages/MobileScanner';
import { ScannerLogin } from '@/figma/app/pages/ScannerLogin';
import { MultiScannerDashboard } from '@/figma/app/pages/MultiScannerDashboard';
import { MerchantOnboarding } from '@/figma/app/pages/MerchantOnboarding';
import { MerchantWallet } from '@/figma/app/pages/MerchantWallet';
import { EmailComposer } from '@/figma/app/pages/EmailComposer';
import { SubscriptionPlans } from '@/figma/app/pages/SubscriptionPlans';
import { SubscriptionSuccess } from '@/figma/app/pages/SubscriptionSuccess';
import { SubscriptionManage } from '@/figma/app/pages/SubscriptionManage';
import { NotFound } from '@/figma/app/pages/NotFound';
import { DashboardLayout } from '@/figma/app/components/DashboardLayout';
import { RentalHub } from '@/figma/app/pages/RentalHub';
import { RentalDetail } from '@/figma/app/pages/RentalDetail';
import { ShopHub } from '@/figma/app/pages/ShopHub';
import { ProductDetail } from '@/figma/app/pages/ProductDetail';
import { MerchantProfilePublic } from '@/figma/app/pages/MerchantProfilePublic';
import { StorefrontEditor } from '@/figma/app/pages/StorefrontEditor';
import { EmailTemplates } from '@/figma/app/pages/EmailTemplates';
import { Cart } from '@/figma/app/pages/Cart';
import { ChatWidget } from '@/figma/app/components/widgets/ChatWidget';
import { FeedbackWidget } from '@/figma/app/components/widgets/FeedbackWidget';
import { Toaster } from '@/figma/app/components/ui/sonner';
import { TermsOfService } from '@/figma/app/pages/TermsOfService';
import { SignDocument } from '@/figma/app/pages/SignDocument';
import { B2BSolutions } from '@/figma/app/pages/B2BSolutions';
import { ProductCreate } from '@/figma/app/pages/ProductCreate';
import { CreateOrder } from '@/figma/app/pages/CreateOrder';
import { IntegrationsSettings } from '@/figma/app/pages/IntegrationsSettings';
import { PublicLayout } from '@/figma/app/components/PublicLayout';
import { PublicCatalogLayout } from '@/figma/app/components/PublicCatalogLayout';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CountryProvider>
          <LanguageProvider>
            <AdminSettingsProvider>
              <BonusTrackingProvider>
                <CartProvider>
                <Routes>
                <Route element={<PublicLayout />}>
                  {/* Public Routes */}
                  <Route path="/" element={<Landing />} />
                  <Route path="/deals" element={<LandingPage />} />
                  <Route path="/b2b-solutions" element={<B2BSolutions />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/sign-document" element={<SignDocument />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/scanner-login" element={<ScannerLogin />} />
                  <Route path="/campaigns" element={<CampaignHub />} />
                  <Route path="/campaign/:id" element={<CampaignDetail />} />

                  {/* Vouchers & Offers */}
                  <Route path="/voucher" element={<VoucherOffers />} />
                  <Route path="/voucher/:id" element={<VoucherPublic />} />

                  <Route path="/gift-card/:id" element={<GiftCardPublic />} />

                  <Route path="/event/:id" element={<EventPublic />} />
                  <Route path="/redeem" element={<StaffRedeem />} />

                  {/* Rental Routes */}
                  <Route path="/rentals" element={<RentalHub />} />
                  <Route path="/rentals/:id" element={<RentalDetail />} />

                  {/* E-Commerce Shop Routes */}
                  <Route path="/shop" element={<ShopHub />} />
                  <Route path="/shop/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/merchant/:id" element={<MerchantProfilePublic />} />

                  {/* 404 Catch All */}
                  <Route path="*" element={<NotFound />} />
                </Route>

                <Route element={<PublicCatalogLayout />}>
                  <Route path="/gift-cards" element={<GiftCardsList />} />
                  <Route path="/events" element={<EventsList />} />
                </Route>

                {/* Authenticated Routes with Dashboard Layout */}
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<MerchantDashboard />} />
                  <Route path="/store-builder" element={<StorefrontEditor />} />
                  <Route path="/integrations" element={<IntegrationsSettings />} />
                  
                  <Route path="/user-dashboard" element={<UserDashboard />} />
                  <Route path="/admin-dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/email-templates" element={<EmailTemplates />} />
                  <Route path="/analytics" element={<Analytics />} />
                  
                  {/* Product & Order Creation */}
                  <Route path="/products/create" element={<ProductCreate />} />
                  <Route path="/orders/create" element={<CreateOrder />} />

                  <Route path="/multi-scanner" element={<MultiScannerDashboard />} />
                  <Route path="/campaigns-list" element={<CampaignsList />} />
                  <Route path="/campaigns/:id/admin" element={<CampaignAdminDetail />} />
                  <Route path="/campaigns/create" element={<CampaignCreate />} />
                  <Route path="/create-campaign" element={<CampaignCreate />} />
                  <Route path="/news/create" element={<NewsCreate />} />
                  <Route path="/vouchers" element={<VouchersList />} />
                  <Route path="/vouchers/create" element={<VoucherCreate />} />
                  <Route path="/discounts" element={<DiscountCodes />} />
                  <Route path="/gift-cards/create" element={<GiftCardCreate />} />
                  <Route path="/events/create" element={<EventCreate />} />
                  <Route path="/events/:id" element={<EventDetail />} />
                  <Route path="/events/:id/edit" element={<EventCreate />} />
                  <Route path="/promotions" element={<Promotions />} />
                  <Route path="/bonus-accounting" element={<BonusAccounting />} />
                  <Route path="/share" element={<Share />} />
                  <Route path="/user-share" element={<UserShare />} />
                  <Route path="/referrals" element={<Referrals />} />
                  <Route path="/wallet" element={<Wallet />} />
                  <Route path="/merchant-wallet" element={<MerchantWallet />} />
                  <Route path="/email-composer" element={<EmailComposer />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/billing" element={<Billing />} />
                  <Route path="/qr-codes" element={<QRCodes />} />
                  <Route path="/mobile-scanner" element={<MobileScanner />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/advanced-settings" element={<AdvancedSettings />} />
                  <Route path="/merchant-onboarding" element={<MerchantOnboarding />} />
                  <Route path="/subscription-plans" element={<SubscriptionPlans />} />
                  <Route path="/subscription-success" element={<SubscriptionSuccess />} />
                  <Route path="/subscription-manage" element={<SubscriptionManage />} />
                </Route>
                
                </Routes>
                <Toaster />
                <ChatWidget />
                <FeedbackWidget />
                </CartProvider>
              </BonusTrackingProvider>
            </AdminSettingsProvider>
          </LanguageProvider>
        </CountryProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

