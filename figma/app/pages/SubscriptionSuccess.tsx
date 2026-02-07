import { useEffect, useState } from 'react';
import { WarmCard } from '@/figma/app/components/WarmCard';
import { WarmButton } from '@/figma/app/components/WarmButton';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Download, 
  Shield,
  Calendar,
  CreditCard,
  FileText,
  Award,
  Sparkles,
  ArrowRight,
  Mail,
  PartyPopper
} from 'lucide-react';

export function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  // Mock subscription data (would come from Stripe webhook in real app)
  const subscription = {
    plan: 'Professional',
    status: 'trialing',
    price: '€29',
    billingPeriod: 'monthly',
    trialEnd: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    nextBillingDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    certificateNumber: 'CERT-2024-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    merchantId: 'MERCH-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    activatedDate: new Date(),
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/merchant-dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const downloadCertificate = () => {
    // In real app, this would generate a PDF certificate
    const certificateText = `
MERCHANT CERTIFICATE

Certificate Number: ${subscription.certificateNumber}
Merchant ID: ${subscription.merchantId}

This certifies that your business has been approved and subscribed to:

Plan: ${subscription.plan}
Status: Active (Trial Period)
Trial Period: 60 days
Price: ${subscription.price}/${subscription.billingPeriod}

Activated: ${subscription.activatedDate.toLocaleDateString()}
Trial Ends: ${subscription.trialEnd.toLocaleDateString()}
Next Billing: ${subscription.nextBillingDate.toLocaleDateString()}

Thank you for choosing our platform!
    `;

    const blob = new Blob([certificateText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `merchant-certificate-${subscription.certificateNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF5] via-[#FFF9ED] to-[#FFE5B4] py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] shadow-warm-lg mb-6 animate-bounce">
            <CheckCircle2 className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#2D2721] mb-4">
            🎉 Welcome Aboard!
          </h1>
          <p className="text-xl text-[#6B5744]">
            Your subscription is now active. Let's get started!
          </p>
        </div>

        {/* Certificate Card */}
        <WarmCard padding="xl" className="mb-6 border-2 border-[#FFC857]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#2D2721]">Your Merchant Certificate</h2>
              <p className="text-sm text-[#8B7355]">Official subscription confirmation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="p-4 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[14px]">
              <div className="text-sm text-[#8B7355] mb-1">Certificate Number</div>
              <div className="text-lg font-bold text-[#2D2721] font-mono">{subscription.certificateNumber}</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[14px]">
              <div className="text-sm text-[#8B7355] mb-1">Merchant ID</div>
              <div className="text-lg font-bold text-[#2D2721] font-mono">{subscription.merchantId}</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[14px]">
              <div className="text-sm text-[#8B7355] mb-1">Plan</div>
              <div className="text-lg font-bold text-[#2D2721]">{subscription.plan}</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[14px]">
              <div className="text-sm text-[#8B7355] mb-1">Status</div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#9DB5A5] animate-pulse" />
                <span className="text-lg font-bold text-[#9DB5A5]">Active Trial</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-[#9DB5A5]/10 to-[#7FA090]/10 rounded-[16px] border border-[#9DB5A5]/30 mb-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-6 w-6 text-[#FFC857] flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-[#2D2721] mb-2">Trial Period Active</h3>
                <p className="text-sm text-[#6B5744] mb-4">
                  You have <strong>60 days</strong> to explore all features completely free. 
                  Your card will be charged <strong>{subscription.price}</strong> on <strong>{subscription.nextBillingDate.toLocaleDateString()}</strong> unless you cancel.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#9DB5A5]" />
                    <span className="text-[#6B5744]">
                      Trial ends: <strong className="text-[#2D2721]">{subscription.trialEnd.toLocaleDateString()}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-[#FFC857]" />
                    <span className="text-[#6B5744]">
                      First charge: <strong className="text-[#2D2721]">{subscription.price}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <WarmButton className="flex-1" onClick={downloadCertificate}>
              <Download className="h-4 w-4 mr-2" />
              Download Certificate
            </WarmButton>
            <WarmButton variant="outline" className="flex-1" onClick={() => navigate('/subscription-manage')}>
              <Shield className="h-4 w-4 mr-2" />
              Manage Subscription
            </WarmButton>
          </div>
        </WarmCard>

        {/* Next Steps */}
        <WarmCard padding="lg" className="mb-6">
          <h3 className="text-xl font-bold text-[#2D2721] mb-4 flex items-center gap-2">
            <PartyPopper className="h-6 w-6 text-[#FFC857]" />
            What's Next?
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[12px]">
              <div className="w-8 h-8 rounded-full bg-[#FFC857] text-white flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold text-[#2D2721] mb-1">Create Your First Campaign</h4>
                <p className="text-sm text-[#6B5744]">Start attracting customers with a voucher or gift card campaign</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[12px]">
              <div className="w-8 h-8 rounded-full bg-[#9DB5A5] text-white flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold text-[#2D2721] mb-1">Customize Your Profile</h4>
                <p className="text-sm text-[#6B5744]">Add your logo, brand colors, and business information</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[12px]">
              <div className="w-8 h-8 rounded-full bg-[#E17B5C] text-white flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold text-[#2D2721] mb-1">Share & Promote</h4>
                <p className="text-sm text-[#6B5744]">Use QR codes and social media to reach your audience</p>
              </div>
            </div>
          </div>
        </WarmCard>

        {/* Email Confirmation */}
        <WarmCard padding="lg" className="mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center shadow-warm flex-shrink-0">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-[#2D2721] mb-2">Confirmation Email Sent</h3>
              <p className="text-sm text-[#6B5744]">
                We've sent a confirmation email with your certificate and subscription details. 
                Please check your inbox and save it for your records.
              </p>
            </div>
          </div>
        </WarmCard>

        {/* Auto Redirect */}
        <div className="text-center">
          <p className="text-[#8B7355] mb-4">
            Redirecting to your dashboard in {countdown} seconds...
          </p>
          <WarmButton onClick={() => navigate('/merchant-dashboard')}>
            Go to Dashboard Now
            <ArrowRight className="h-4 w-4 ml-2" />
          </WarmButton>
        </div>
      </div>
    </div>
  );
}
