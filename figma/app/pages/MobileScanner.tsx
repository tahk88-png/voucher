import { useState, useRef, useEffect } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { IOSInstallPrompt } from '@app/components/IOSInstallPrompt';
import { 
  Camera, 
  X, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Zap, 
  Gift, 
  Ticket, 
  CreditCard,
  Flashlight,
  FlipHorizontal,
  History,
  Search,
  TrendingUp,
  Clock,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

interface ScanResult {
  type: 'voucher' | 'gift-card' | 'ticket';
  code: string;
  title: string;
  discount?: string;
  balance?: string;
  valid: boolean;
  message: string;
  customer?: string;
  expiresAt?: string;
  timestamp?: string;
  id?: string;
}

export function MobileScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Mock scan results for demo
  const mockScanResults: ScanResult[] = [
    {
      id: '1',
      type: 'voucher',
      code: 'SUMMER2024',
      title: 'Summer Sale 20% Off',
      discount: '20%',
      valid: true,
      message: 'Valid voucher! Apply 20% discount.',
      customer: 'Maria Silva',
      expiresAt: '2024-12-31',
    },
    {
      id: '2',
      type: 'gift-card',
      code: 'GC-12345',
      title: '€50 Gift Card',
      balance: '€42.50',
      valid: true,
      message: 'Gift card is active. Remaining balance: €42.50',
      customer: 'João Santos',
    },
    {
      id: '3',
      type: 'ticket',
      code: 'EVENT-2024-789',
      title: 'Summer Festival Ticket',
      valid: true,
      message: 'Valid event ticket. Enjoy the show!',
      customer: 'Anna Kask',
      expiresAt: '2024-08-15',
    },
    {
      id: '4',
      type: 'voucher',
      code: 'EXPIRED2023',
      title: 'Old Promotion',
      discount: '10%',
      valid: false,
      message: 'This voucher has expired.',
      expiresAt: '2023-12-31',
    },
  ];

  // Statistics
  const todayScans = scanHistory.filter(scan => {
    const today = new Date().toDateString();
    const scanDate = new Date(scan.timestamp || '').toDateString();
    return today === scanDate;
  }).length;

  const validScans = scanHistory.filter(scan => scan.valid).length;
  const invalidScans = scanHistory.filter(scan => !scan.valid).length;

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera API not supported in this browser or context (requires HTTPS).');
      return;
    }

    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
      }

      // Try to enable flashlight if supported
      const track = stream.getVideoTracks()[0];
      if (track && typeof track.getCapabilities === 'function') {
        const capabilities = track.getCapabilities();
        if ((capabilities as any).torch && flashEnabled) {
          await track.applyConstraints({
            advanced: [{ torch: true } as any]
          });
        }
      }
    } catch (error: any) {
      console.error('Camera access error:', error);
      
      let errorMessage = 'Could not access camera.';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings and reload.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera is already in use by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints not satisfied (e.g. no suitable camera found).';
      } else if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
         errorMessage = 'Camera access requires a secure HTTPS connection.';
      }

      setCameraError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const toggleFlashlight = async () => {
    if (!streamRef.current) return;
    
    const track = streamRef.current.getVideoTracks()[0];
    const capabilities = track.getCapabilities();
    
    if (capabilities.torch) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any]
        });
        setFlashEnabled(!flashEnabled);
        toast.success(flashEnabled ? 'Flashlight off' : 'Flashlight on');
      } catch (error) {
        console.error('Flash error:', error);
        toast.error('Flashlight not supported on this device');
      }
    } else {
      toast.error('Flashlight not supported on this device');
    }
  };

  const switchCamera = async () => {
    stopCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    setTimeout(() => startCamera(), 100);
  };

  const handleManualInput = () => {
    const code = prompt('Enter voucher code manually:');
    if (code) {
      simulateScan(code);
    }
  };

  const simulateScan = (code?: string) => {
    // Simulate QR code scan (in real app, this would use a QR scanner library)
    const randomResult = code 
      ? mockScanResults.find(r => r.code.toLowerCase() === code.toLowerCase()) || mockScanResults[3]
      : mockScanResults[Math.floor(Math.random() * mockScanResults.length)];
    
    const resultWithTimestamp = {
      ...randomResult,
      timestamp: new Date().toISOString(),
      id: Date.now().toString()
    };

    setScanResult(resultWithTimestamp);
    
    // Add to history
    setScanHistory(prev => [resultWithTimestamp, ...prev].slice(0, 50)); // Keep last 50 scans
    
    stopCamera();
    
    if (randomResult.valid) {
      toast.success('Voucher validated successfully!');
      // Vibrate on success (if supported)
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
    } else {
      toast.error('Invalid or expired voucher');
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    }
  };

  const resetScan = () => {
    setScanResult(null);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const getTypeIcon = (type: ScanResult['type']) => {
    switch (type) {
      case 'voucher':
        return Ticket;
      case 'gift-card':
        return CreditCard;
      case 'ticket':
        return Gift;
    }
  };

  const getTypeColor = (type: ScanResult['type']) => {
    switch (type) {
      case 'voucher':
        return 'from-[#FFC857] to-[#FFB627]';
      case 'gift-card':
        return 'from-[#E8A87C] to-[#D4936A]';
      case 'ticket':
        return 'from-[#9DB5A5] to-[#7FA090]';
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  // Platform detection
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const platform = isIOS ? 'iOS' : isAndroid ? 'Android' : 'Web';
  
  // iOS-specific: Check if running as PWA
  const isIOSPWA = isIOS && (window.navigator as any).standalone === true;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF5] via-[#FFF9ED] to-[#FFE5B4] pb-safe">
      {/* iOS Install Prompt */}
      <IOSInstallPrompt />
      
      {/* iOS Status Bar Meta (for PWA) */}
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0%; }
          50% { top: 100%; }
        }
        
        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.3);
            opacity: 0;
          }
        }
        
        /* Safe area for iOS notch and home indicator */
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .pb-safe {
            padding-bottom: calc(env(safe-area-inset-bottom) + 1rem);
          }
          .pt-safe {
            padding-top: env(safe-area-inset-top);
          }
        }
        
        /* iOS PWA specific */
        @media (display-mode: standalone) {
          body {
            -webkit-user-select: none;
            -webkit-touch-callout: none;
          }
        }
        
        /* iOS Safari address bar compensation */
        @supports (-webkit-touch-callout: none) {
          .min-h-screen {
            min-height: -webkit-fill-available;
          }
        }
      `}</style>
      
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-[rgba(139,115,85,0.1)] px-4 py-3 pt-safe">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-[#2D2721]">QR Scanner</h1>
              <p className="text-xs text-[#8B7355]">{platform} • {scanHistory.length} scans</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isScanning && !scanResult && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  showHistory 
                    ? 'bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-white shadow-warm' 
                    : 'bg-white border border-[rgba(139,115,85,0.15)] text-[#6B5744]'
                }`}
              >
                <History className="h-5 w-5" />
              </button>
            )}
            {isScanning && (
              <button
                onClick={stopCamera}
                className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Show History */}
        {showHistory && !isScanning && !scanResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#2D2721]">Scan History</h2>
              <WarmButton 
                variant="outline" 
                size="sm"
                onClick={() => setShowHistory(false)}
              >
                <X className="h-4 w-4 mr-1" />
                Close
              </WarmButton>
            </div>

            {scanHistory.length === 0 ? (
              <WarmCard padding="lg">
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-[#D4C5B0] mx-auto mb-3" />
                  <p className="text-[#8B7355]">No scans yet</p>
                  <p className="text-sm text-[#A0947D] mt-1">Your scan history will appear here</p>
                </div>
              </WarmCard>
            ) : (
              <div className="space-y-3">
                {scanHistory.map((scan) => {
                  const Icon = getTypeIcon(scan.type);
                  return (
                    <WarmCard key={scan.id} padding="md" hover>
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-[10px] bg-gradient-to-br ${getTypeColor(scan.type)} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-[#2D2721] truncate">{scan.title}</h4>
                              <p className="text-sm text-[#8B7355] font-mono">{scan.code}</p>
                            </div>
                            <div className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                              scan.valid 
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {scan.valid ? 'Valid' : 'Invalid'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs text-[#A0947D]">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(scan.timestamp)}
                            {scan.customer && (
                              <>
                                <span>•</span>
                                <span>{scan.customer}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </WarmCard>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {!isScanning && !scanResult && !showHistory && (
          <>
            <WarmCard padding="lg">
              <div className="text-center space-y-4">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="w-20 h-20 rounded-[16px] bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center shadow-warm">
                    <Camera className="h-10 w-10 text-white" />
                  </div>
                  {/* Pulse animation */}
                  <div className="absolute inset-0 rounded-[16px] bg-[#9DB5A5] opacity-50 animate-[pulse-ring_2s_ease-out_infinite]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#2D2721] mb-2">Scan QR Code</h2>
                  <p className="text-[#6B5744]">
                    Point your camera at a voucher or gift card QR code to validate it
                  </p>
                </div>

                {/* Platform-specific tips */}
                <div className="bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[12px] p-4 text-left">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-[#FFC857] flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-[#6B5744]">
                      {isIOS && (
                        <p><strong>iOS Tip:</strong> Allow camera access in Safari settings if prompted</p>
                      )}
                      {isAndroid && (
                        <p><strong>Android Tip:</strong> Ensure camera permissions are enabled in Chrome</p>
                      )}
                      {!isIOS && !isAndroid && (
                        <p><strong>Web Tip:</strong> Your browser will request camera access</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <WarmButton className="w-full" size="lg" onClick={startCamera}>
                    <Camera className="h-5 w-5 mr-2" />
                    Start Camera
                  </WarmButton>
                  <div className="grid grid-cols-2 gap-3">
                    <WarmButton 
                      className="w-full" 
                      size="lg" 
                      variant="outline"
                      onClick={handleManualInput}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Manual
                    </WarmButton>
                    <WarmButton 
                      className="w-full" 
                      size="lg" 
                      variant="secondary"
                      onClick={() => simulateScan()}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Demo
                    </WarmButton>
                  </div>
                </div>
              </div>
            </WarmCard>

            {/* Quick Stats */}
            <WarmCard padding="lg">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-[#FFC857]" />
                <h3 className="font-semibold text-[#2D2721]">Today's Activity</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-[#FFF9ED] to-white rounded-xl">
                  <div className="text-3xl font-bold text-[#2D2721] mb-1">{todayScans}</div>
                  <div className="text-xs text-[#8B7355] font-medium">Scanned</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-white rounded-xl">
                  <div className="text-3xl font-bold text-green-600 mb-1">{validScans}</div>
                  <div className="text-xs text-[#8B7355] font-medium">Valid</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-red-50 to-white rounded-xl">
                  <div className="text-3xl font-bold text-red-600 mb-1">{invalidScans}</div>
                  <div className="text-xs text-[#8B7355] font-medium">Invalid</div>
                </div>
              </div>
            </WarmCard>

            {/* Recent Scans Preview */}
            {scanHistory.length > 0 && (
              <WarmCard padding="lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[#2D2721]">Recent Scans</h3>
                  <button 
                    onClick={() => setShowHistory(true)}
                    className="text-sm text-[#FFC857] font-medium hover:text-[#FFB627] transition-colors flex items-center gap-1"
                  >
                    View All
                    <TrendingUp className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {scanHistory.slice(0, 3).map((scan) => {
                    const Icon = getTypeIcon(scan.type);
                    return (
                      <div key={scan.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#FFF9ED] to-white rounded-lg">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getTypeColor(scan.type)} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#2D2721] truncate">{scan.title}</p>
                          <p className="text-xs text-[#8B7355]">{formatTimestamp(scan.timestamp)}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          scan.valid ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {scan.valid ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </WarmCard>
            )}
          </>
        )}

        {/* Camera Error */}
        {cameraError && (
          <WarmCard padding="lg" className="bg-red-50 border-2 border-red-200">
            <div className="flex items-start gap-3">
              <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Camera Error</h3>
                <p className="text-sm text-red-700">{cameraError}</p>
                <WarmButton 
                  size="sm" 
                  variant="outline" 
                  className="mt-3"
                  onClick={handleManualInput}
                >
                  Use Manual Entry Instead
                </WarmButton>
              </div>
            </div>
          </WarmCard>
        )}

        {/* Camera View */}
        {isScanning && (
          <div className="relative">
            <WarmCard padding="none" className="overflow-hidden">
              <div className="relative bg-black aspect-[3/4] flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Scanning Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-64 h-64">
                    {/* Corner markers */}
                    <div className="absolute top-0 left-0 w-16 h-16 border-l-4 border-t-4 border-[#FFC857] rounded-tl-[16px]" />
                    <div className="absolute top-0 right-0 w-16 h-16 border-r-4 border-t-4 border-[#FFC857] rounded-tr-[16px]" />
                    <div className="absolute bottom-0 left-0 w-16 h-16 border-l-4 border-b-4 border-[#FFC857] rounded-bl-[16px]" />
                    <div className="absolute bottom-0 right-0 w-16 h-16 border-r-4 border-b-4 border-[#FFC857] rounded-br-[16px]" />
                    
                    {/* Scanning line animation */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute w-full h-1 bg-[#FFC857] shadow-[0_0_20px_rgba(255,200,87,0.8)] animate-[scan_2s_ease-in-out_infinite]" 
                           style={{ top: '0%' }} />
                    </div>
                  </div>
                </div>

                {/* Camera Controls */}
                <div className="absolute top-4 left-0 right-0 px-4 flex items-center justify-between">
                  <button
                    onClick={toggleFlashlight}
                    className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg transition-all ${
                      flashEnabled 
                        ? 'bg-[#FFC857] text-white' 
                        : 'bg-black/50 text-white'
                    }`}
                  >
                    <Flashlight className="h-5 w-5" />
                  </button>
                  
                  <button
                    onClick={switchCamera}
                    className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white shadow-lg"
                  >
                    <FlipHorizontal className="h-5 w-5" />
                  </button>
                </div>

                {/* Instructions */}
                <div className="absolute bottom-8 left-0 right-0 px-8">
                  <div className="bg-black/70 backdrop-blur-sm rounded-[12px] p-4 text-center">
                    <p className="text-white text-sm font-medium">
                      Position QR code within the frame
                    </p>
                    <p className="text-white/70 text-xs mt-1">
                      Hold steady for automatic scan
                    </p>
                  </div>
                </div>
              </div>
            </WarmCard>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <WarmButton variant="outline" onClick={stopCamera}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </WarmButton>
              <WarmButton onClick={() => simulateScan()}>
                <Zap className="h-4 w-4 mr-2" />
                Test Scan
              </WarmButton>
            </div>
          </div>
        )}

        {/* Scan Result */}
        {scanResult && (
          <div className="space-y-4">
            <WarmCard 
              padding="lg" 
              className={`border-2 ${
                scanResult.valid 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-red-500 bg-red-50'
              }`}
            >
              <div className="text-center space-y-4">
                {/* Status Icon */}
                {scanResult.valid ? (
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                      <CheckCircle className="h-12 w-12 text-white" />
                    </div>
                    {/* Success pulse animation */}
                    <div className="absolute inset-0 rounded-full bg-green-500 opacity-50 animate-[pulse-ring_1s_ease-out_3]" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center mx-auto shadow-lg">
                    <XCircle className="h-12 w-12 text-white" />
                  </div>
                )}

                {/* Result Message */}
                <div>
                  <h2 className={`text-2xl font-bold mb-2 ${
                    scanResult.valid ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {scanResult.valid ? 'Valid!' : 'Invalid'}
                  </h2>
                  <p className={`text-lg ${
                    scanResult.valid ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {scanResult.message}
                  </p>
                </div>
              </div>
            </WarmCard>

            {/* Voucher Details */}
            <WarmCard padding="lg">
              <div className="space-y-4">
                {/* Type & Title */}
                <div className="flex items-start gap-4">
                  {(() => {
                    const Icon = getTypeIcon(scanResult.type);
                    return (
                      <div className={`w-12 h-12 rounded-[12px] bg-gradient-to-br ${getTypeColor(scanResult.type)} flex items-center justify-center flex-shrink-0 shadow-warm`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                    );
                  })()}
                  <div className="flex-1">
                    <h3 className="font-bold text-[#2D2721] text-lg">{scanResult.title}</h3>
                    <p className="text-sm text-[#8B7355] capitalize">{scanResult.type.replace('-', ' ')}</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="space-y-3 pt-4 border-t border-[rgba(139,115,85,0.1)]">
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-[#FFF9ED] to-white rounded-lg">
                    <span className="text-[#6B5744] font-medium">Code:</span>
                    <span className="font-mono font-bold text-[#2D2721]">{scanResult.code}</span>
                  </div>

                  {scanResult.discount && (
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-white rounded-lg">
                      <span className="text-[#6B5744] font-medium">Discount:</span>
                      <span className="font-bold text-green-600 text-xl">{scanResult.discount}</span>
                    </div>
                  )}

                  {scanResult.balance && (
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-white rounded-lg">
                      <span className="text-[#6B5744] font-medium">Balance:</span>
                      <span className="font-bold text-green-600 text-xl">{scanResult.balance}</span>
                    </div>
                  )}

                  {scanResult.customer && (
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-[#FFF9ED] to-white rounded-lg">
                      <span className="text-[#6B5744] font-medium">Customer:</span>
                      <span className="font-semibold text-[#2D2721]">{scanResult.customer}</span>
                    </div>
                  )}

                  {scanResult.expiresAt && (
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-[#FFF9ED] to-white rounded-lg">
                      <span className="text-[#6B5744] font-medium">Expires:</span>
                      <span className={`font-semibold ${
                        scanResult.valid ? 'text-[#2D2721]' : 'text-red-600'
                      }`}>
                        {new Date(scanResult.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {scanResult.timestamp && (
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-[#FFF9ED] to-white rounded-lg">
                      <span className="text-[#6B5744] font-medium">Scanned:</span>
                      <span className="font-medium text-[#8B7355]">{formatTimestamp(scanResult.timestamp)}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-4">
                  {scanResult.valid ? (
                    <>
                      <WarmButton 
                        className="col-span-2"
                        size="lg"
                        onClick={() => {
                          toast.success('Voucher redeemed successfully!');
                          if (navigator.vibrate) {
                            navigator.vibrate([100, 50, 100, 50, 100]);
                          }
                          setTimeout(() => resetScan(), 1000);
                        }}
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Redeem Now
                      </WarmButton>
                    </>
                  ) : (
                    <WarmButton 
                      className="col-span-2"
                      variant="outline"
                      size="lg"
                      onClick={resetScan}
                    >
                      Scan Another
                    </WarmButton>
                  )}
                </div>
              </div>
            </WarmCard>

            {/* Scan Another Button */}
            <WarmButton 
              className="w-full" 
              variant="secondary"
              size="lg"
              onClick={resetScan}
            >
              <Camera className="h-5 w-5 mr-2" />
              Scan Another Code
            </WarmButton>
          </div>
        )}
      </div>
    </div>
  );
}
