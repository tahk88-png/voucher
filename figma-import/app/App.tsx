import { Settings } from '@/app/pages/Settings';
import { AdvancedSettings } from '@/app/pages/AdvancedSettings';
import { Login } from '@/app/pages/Login';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CountryProvider } from '@/app/contexts/CountryContext';
import { LanguageProvider } from '@/app/contexts/LanguageContext';
import { AdminSettingsProvider } from '@/app/contexts/AdminSettings';
import { BonusTrackingProvider } from '@/app/contexts/BonusTracking';
import { CartProvider } from '@/app/contexts/CartContext';
import LandingPage from '@/app/LandingPage';
import { Landing } from '@/app/pages/Landing';
import { MerchantDashboard } from '@/app/pages/MerchantDashboard';
import { UserDashboard } from '@/app/pages/UserDashboard';
import { AdminDashboard } from '@/app/pages/AdminDashboard';
import { Analytics } from '@/app/pages/Analytics';
import { CampaignsList } from '@/app/pages/CampaignsList';
import { CampaignCreate } from '@/app/pages/CampaignCreate';
import { NewsCreate } from '@/app/pages/NewsCreate';
import { CampaignHub } from '@/app/pages/CampaignHub';
import { CampaignDetail } from '@/app/pages/CampaignDetail';
import { CampaignAdminDetail } from '@/app/pages/CampaignAdminDetail';
import { VouchersList } from '@/app/pages/VouchersList';
import { VoucherCreate } from '@/app/pages/VoucherCreate';
import { VoucherPublic } from '@/app/pages/VoucherPublic';
import { VoucherOffers } from '@/app/pages/VoucherOffers';
import { DiscountCodes } from '@/app/pages/DiscountCodes';
import { GiftCardsList } from '@/app/pages/GiftCardsList';
import { GiftCardCreate } from '@/app/pages/GiftCardCreate';
import { GiftCardPublic } from '@/app/pages/GiftCardPublic';
import { EventsList } from '@/app/pages/EventsList';
import { EventCreate } from '@/app/pages/EventCreate';
import { EventPublic } from '@/app/pages/EventPublic';
import { EventDetail } from '@/app/pages/EventDetail';
import { Wallet } from '@/app/pages/Wallet';
import { Referrals } from '@/app/pages/Referrals';
import { Notifications } from '@/app/pages/Notifications';
import { Billing } from '@/app/pages/Billing';
import { BonusAccounting } from '@/app/pages/BonusAccounting';
import { Promotions } from '@/app/pages/Promotions';
import { Share } from '@/app/pages/Share';
import { UserShare } from '@/app/pages/UserShare';
import { StaffRedeem } from '@/app/pages/StaffRedeem';
import { QRCodes } from '@/app/pages/QRCodes';
import { MobileScanner } from '@/app/pages/MobileScanner';
import { ScannerLogin } from '@/app/pages/ScannerLogin';
import { MultiScannerDashboard } from '@/app/pages/MultiScannerDashboard';
import { MerchantOnboarding } from '@/app/pages/MerchantOnboarding';
import { MerchantWallet } from '@/app/pages/MerchantWallet';
import { EmailComposer } from '@/app/pages/EmailComposer';
import { SubscriptionPlans } from '@/app/pages/SubscriptionPlans';
import { SubscriptionSuccess } from '@/app/pages/SubscriptionSuccess';
import { SubscriptionManage } from '@/app/pages/SubscriptionManage';
import { NotFound } from '@/app/pages/NotFound';
import { DashboardLayout } from '@/app/components/DashboardLayout';
import { RentalHub } from '@/app/pages/RentalHub';
import { RentalDetail } from '@/app/pages/RentalDetail';
import { ShopHub } from '@/app/pages/ShopHub';
import { ProductDetail } from '@/app/pages/ProductDetail';
import { MerchantProfilePublic } from '@/app/pages/MerchantProfilePublic';
import { StorefrontEditor } from '@/app/pages/StorefrontEditor';
import { EmailTemplates } from '@/app/pages/EmailTemplates';
import { Cart } from '@/app/pages/Cart';
import { ChatWidget } from '@/app/components/widgets/ChatWidget';
import { FeedbackWidget } from '@/app/components/widgets/FeedbackWidget';
import { Toaster } from '@/app/components/ui/sonner';
import { TermsOfService } from '@/app/pages/TermsOfService';
import { SignDocument } from '@/app/pages/SignDocument';
import { B2BSolutions } from '@/app/pages/B2BSolutions';
import { ProductCreate } from '@/app/pages/ProductCreate';
import { CreateOrder } from '@/app/pages/CreateOrder';
import { IntegrationsSettings } from '@/app/pages/IntegrationsSettings';

export default function App() {
  return (
    <BrowserRouter>
      <CountryProvider>
        <LanguageProvider>
          <AdminSettingsProvider>
            <BonusTrackingProvider>
              <CartProvider>
                <Routes>
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
                  <Route path="/gift-cards" element={<GiftCardsList />} />
                  <Route path="/gift-cards/create" element={<GiftCardCreate />} />
                  <Route path="/events" element={<EventsList />} />
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
                
                {/* 404 Catch All */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
              <ChatWidget />
              <FeedbackWidget />
              </CartProvider>
            </BonusTrackingProvider>
          </AdminSettingsProvider>
        </LanguageProvider>
      </CountryProvider>
    </BrowserRouter>
  );
}