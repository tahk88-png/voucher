import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WarmCard } from '@/app/components/WarmCard';
import { WarmButton } from '@/app/components/WarmButton';
import { 
  Camera, 
  Smartphone, 
  User, 
  Lock, 
  AlertCircle, 
  CheckCircle,
  Zap,
  QrCode,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

export function ScannerLogin() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    deviceId: '',
    eventId: ''
  });

  // Mock events for demo
  const events = [
    { id: 'evt-1', name: 'Summer Music Festival 2024', date: '2024-08-15', scanners: 15 },
    { id: 'evt-2', name: 'Tech Conference Europe', date: '2024-09-22', scanners: 8 },
    { id: 'evt-3', name: 'Food & Wine Expo', date: '2024-10-10', scanners: 12 },
    { id: 'evt-4', name: 'Christmas Market', date: '2024-12-01', scanners: 20 },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      // Store scanner session
      localStorage.setItem('scannerSession', JSON.stringify({
        email: formData.email,
        deviceId: formData.deviceId,
        eventId: formData.eventId,
        loginTime: new Date().toISOString(),
        scannerId: `SCN-${Date.now()}`
      }));

      toast.success('Scanner login successful!');
      navigate('/mobile-scanner');
      setIsLoading(false);
    }, 1500);
  };

  // Platform detection
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const platform = isIOS ? 'iOS' : isAndroid ? 'Android' : 'Web';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF5] via-[#FFF9ED] to-[#FFE5B4] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-[20px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center mx-auto shadow-warm">
            <Camera className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#2D2721]">Scanner Login</h1>
            <p className="text-[#6B5744] mt-2">
              Event Staff • QR Validation System
            </p>
          </div>
        </div>

        {/* Platform Badge */}
        <WarmCard padding="md" className="bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] border-none">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5" />
              <div>
                <div className="font-semibold">Device Platform</div>
                <div className="text-sm opacity-90">{platform}</div>
              </div>
            </div>
            <CheckCircle className="h-6 w-6" />
          </div>
        </WarmCard>

        {/* Login Form */}
        <WarmCard padding="lg">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-[#2D2721] mb-2">
                <User className="h-4 w-4 inline mr-2" />
                Staff Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="scanner@event.com"
                required
                className="w-full px-4 py-3 rounded-[12px] border border-[rgba(139,115,85,0.2)] focus:border-[#FFC857] focus:ring-2 focus:ring-[#FFC857]/20 transition-all bg-white text-[#2D2721]"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-[#2D2721] mb-2">
                <Lock className="h-4 w-4 inline mr-2" />
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-[12px] border border-[rgba(139,115,85,0.2)] focus:border-[#FFC857] focus:ring-2 focus:ring-[#FFC857]/20 transition-all bg-white text-[#2D2721]"
              />
            </div>

            {/* Device ID */}
            <div>
              <label className="block text-sm font-semibold text-[#2D2721] mb-2">
                <QrCode className="h-4 w-4 inline mr-2" />
                Device/Scanner ID
              </label>
              <input
                type="text"
                value={formData.deviceId}
                onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                placeholder="e.g. Scanner-01, Gate-A, Entrance-1"
                required
                className="w-full px-4 py-3 rounded-[12px] border border-[rgba(139,115,85,0.2)] focus:border-[#FFC857] focus:ring-2 focus:ring-[#FFC857]/20 transition-all bg-white text-[#2D2721]"
              />
              <p className="text-xs text-[#8B7355] mt-1">
                Enter a unique identifier for this scanner device
              </p>
            </div>

            {/* Event Selection */}
            <div>
              <label className="block text-sm font-semibold text-[#2D2721] mb-2">
                <Shield className="h-4 w-4 inline mr-2" />
                Select Event
              </label>
              <select
                value={formData.eventId}
                onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-[12px] border border-[rgba(139,115,85,0.2)] focus:border-[#FFC857] focus:ring-2 focus:ring-[#FFC857]/20 transition-all bg-white text-[#2D2721]"
              >
                <option value="">-- Select Event --</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name} ({event.date}) - {event.scanners} scanners
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <WarmButton 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Logging in...
                </>
              ) : (
                <>
                  <Camera className="h-5 w-5 mr-2" />
                  Start Scanning
                </>
              )}
            </WarmButton>
          </form>
        </WarmCard>

        {/* Info Box */}
        <WarmCard padding="md" className="bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4]">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-[#FFC857] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-[#6B5744]">
              <p className="font-semibold mb-1">Multi-Scanner Support</p>
              <p>Multiple staff members can scan simultaneously at the same event. All scans are synced in real-time.</p>
            </div>
          </div>
        </WarmCard>

        {/* Download Apps */}
        <div className="space-y-3">
          <p className="text-center text-sm font-semibold text-[#6B5744]">
            Download Native Apps for Better Performance
          </p>
          <div className="grid grid-cols-2 gap-3">
            <WarmButton 
              variant="outline" 
              className="w-full"
              onClick={() => toast.info('Redirecting to App Store...')}
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              App Store
            </WarmButton>
            <WarmButton 
              variant="outline" 
              className="w-full"
              onClick={() => toast.info('Redirecting to Play Store...')}
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
              Google Play
            </WarmButton>
          </div>
        </div>

        {/* Demo Credentials */}
        <WarmCard padding="sm" className="bg-gradient-to-r from-green-50 to-white border border-green-200">
          <div className="text-xs text-center text-[#6B5744]">
            <p className="font-semibold mb-1">Demo Credentials</p>
            <p>Email: <span className="font-mono">scanner@demo.com</span></p>
            <p>Password: <span className="font-mono">demo123</span></p>
          </div>
        </WarmCard>

        {/* Back to Home */}
        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-[#8B7355] hover:text-[#6B5744] transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
