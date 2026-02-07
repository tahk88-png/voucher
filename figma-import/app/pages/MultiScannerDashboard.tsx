import { useState, useEffect } from 'react';
import { WarmCard } from '@/app/components/WarmCard';
import { WarmButton } from '@/app/components/WarmButton';
import { 
  Users, 
  Camera, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock,
  Zap,
  TrendingUp,
  Monitor,
  Smartphone,
  Eye,
  AlertTriangle,
  RefreshCw,
  BarChart3
} from 'lucide-react';

interface Scanner {
  id: string;
  deviceId: string;
  userName: string;
  status: 'active' | 'idle' | 'offline';
  totalScans: number;
  validScans: number;
  invalidScans: number;
  lastScan: string;
  platform: 'iOS' | 'Android' | 'Web';
  location?: string;
  loginTime: string;
}

export function MultiScannerDashboard() {
  const [scanners, setScanners] = useState<Scanner[]>([
    {
      id: 'SCN-001',
      deviceId: 'Gate-A-Scanner-1',
      userName: 'Maria Silva',
      status: 'active',
      totalScans: 247,
      validScans: 239,
      invalidScans: 8,
      lastScan: '2s ago',
      platform: 'iOS',
      location: 'Main Entrance - Gate A',
      loginTime: '09:00'
    },
    {
      id: 'SCN-002',
      deviceId: 'VIP-Entrance-1',
      userName: 'João Santos',
      status: 'active',
      totalScans: 156,
      validScans: 154,
      invalidScans: 2,
      lastScan: '5s ago',
      platform: 'Android',
      location: 'VIP Entrance',
      loginTime: '09:15'
    },
    {
      id: 'SCN-003',
      deviceId: 'Gate-B-Scanner-1',
      userName: 'Anna Kask',
      status: 'idle',
      totalScans: 189,
      validScans: 182,
      invalidScans: 7,
      lastScan: '5m ago',
      platform: 'iOS',
      location: 'Side Entrance - Gate B',
      loginTime: '09:00'
    },
    {
      id: 'SCN-004',
      deviceId: 'Backstage-Scanner',
      userName: 'Erik Tamm',
      status: 'active',
      totalScans: 92,
      validScans: 91,
      invalidScans: 1,
      lastScan: '1s ago',
      platform: 'Android',
      location: 'Backstage Access',
      loginTime: '10:00'
    },
    {
      id: 'SCN-005',
      deviceId: 'Gate-C-Scanner-1',
      userName: 'Liis Mägi',
      status: 'idle',
      totalScans: 134,
      validScans: 129,
      invalidScans: 5,
      lastScan: '12m ago',
      platform: 'iOS',
      location: 'Emergency Exit - Gate C',
      loginTime: '09:30'
    },
    {
      id: 'SCN-006',
      deviceId: 'Info-Desk-Scanner',
      userName: 'Dmitri Ivanov',
      status: 'offline',
      totalScans: 45,
      validScans: 44,
      invalidScans: 1,
      lastScan: '45m ago',
      platform: 'Web',
      location: 'Information Desk',
      loginTime: '09:00'
    },
  ]);

  const [autoRefresh, setAutoRefresh] = useState(true);

  // Simulate real-time updates
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setScanners(prev => prev.map(scanner => {
        if (scanner.status === 'active') {
          const shouldUpdate = Math.random() > 0.5;
          if (shouldUpdate) {
            const isValid = Math.random() > 0.1; // 90% success rate
            return {
              ...scanner,
              totalScans: scanner.totalScans + 1,
              validScans: isValid ? scanner.validScans + 1 : scanner.validScans,
              invalidScans: !isValid ? scanner.invalidScans + 1 : scanner.invalidScans,
              lastScan: 'just now'
            };
          }
        }
        return scanner;
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Calculate totals
  const totalScans = scanners.reduce((sum, s) => sum + s.totalScans, 0);
  const totalValid = scanners.reduce((sum, s) => sum + s.validScans, 0);
  const totalInvalid = scanners.reduce((sum, s) => sum + s.invalidScans, 0);
  const activeScannersCount = scanners.filter(s => s.status === 'active').length;
  const successRate = ((totalValid / totalScans) * 100).toFixed(1);

  const getStatusColor = (status: Scanner['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
    }
  };

  const getStatusLabel = (status: Scanner['status']) => {
    switch (status) {
      case 'active': return 'Active';
      case 'idle': return 'Idle';
      case 'offline': return 'Offline';
    }
  };

  const getPlatformIcon = (platform: Scanner['platform']) => {
    switch (platform) {
      case 'iOS': return '🍎';
      case 'Android': return '🤖';
      case 'Web': return '🌐';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2721]">Multi-Scanner Dashboard</h1>
          <p className="text-[#6B5744] mt-1">Real-time monitoring of all active scanners</p>
        </div>
        <div className="flex items-center gap-3">
          <WarmButton
            variant={autoRefresh ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Live' : 'Paused'}
          </WarmButton>
          <WarmButton variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Export
          </WarmButton>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WarmCard padding="lg" hover>
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-[#9DB5A5]">
              <Activity className="h-4 w-4" />
              Live
            </div>
          </div>
          <div className="text-3xl font-bold text-[#2D2721] mb-1">{activeScannersCount}/{scanners.length}</div>
          <div className="text-sm text-[#8B7355]">Active Scanners</div>
        </WarmCard>

        <WarmCard padding="lg" hover>
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center shadow-warm">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-[#9DB5A5]">
              <TrendingUp className="h-4 w-4" />
              +12%
            </div>
          </div>
          <div className="text-3xl font-bold text-[#2D2721] mb-1">{totalScans}</div>
          <div className="text-sm text-[#8B7355]">Total Scans</div>
        </WarmCard>

        <WarmCard padding="lg" hover>
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-warm">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="text-sm font-medium text-green-600">
              {successRate}%
            </div>
          </div>
          <div className="text-3xl font-bold text-[#2D2721] mb-1">{totalValid}</div>
          <div className="text-sm text-[#8B7355]">Valid Scans</div>
        </WarmCard>

        <WarmCard padding="lg" hover>
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-warm">
              <XCircle className="h-6 w-6 text-white" />
            </div>
            <div className="text-sm font-medium text-red-600">
              {((totalInvalid / totalScans) * 100).toFixed(1)}%
            </div>
          </div>
          <div className="text-3xl font-bold text-[#2D2721] mb-1">{totalInvalid}</div>
          <div className="text-sm text-[#8B7355]">Invalid Scans</div>
        </WarmCard>
      </div>

      {/* Scanners Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {scanners.map((scanner) => (
          <WarmCard key={scanner.id} padding="lg" hover>
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-[12px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm text-white font-bold text-sm">
                      {scanner.userName.split(' ').map(n => n[0]).join('')}
                    </div>
                    {/* Status Indicator */}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(scanner.status)} rounded-full border-2 border-white shadow-sm ${
                      scanner.status === 'active' ? 'animate-pulse' : ''
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#2D2721]">{scanner.userName}</h3>
                    <p className="text-sm text-[#8B7355]">{scanner.deviceId}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        scanner.status === 'active' ? 'bg-green-100 text-green-700' :
                        scanner.status === 'idle' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {getStatusLabel(scanner.status)}
                      </span>
                      <span className="text-xs text-[#8B7355]">
                        {getPlatformIcon(scanner.platform)} {scanner.platform}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#2D2721]">{scanner.totalScans}</div>
                  <div className="text-xs text-[#8B7355]">scans</div>
                </div>
              </div>

              {/* Location */}
              {scanner.location && (
                <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-[#FFF9ED] to-white rounded-lg">
                  <Monitor className="h-4 w-4 text-[#FFC857] flex-shrink-0" />
                  <span className="text-sm text-[#6B5744]">{scanner.location}</span>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-gradient-to-br from-green-50 to-white rounded-lg">
                  <div className="text-lg font-bold text-green-600">{scanner.validScans}</div>
                  <div className="text-xs text-[#8B7355]">Valid</div>
                </div>
                <div className="text-center p-2 bg-gradient-to-br from-red-50 to-white rounded-lg">
                  <div className="text-lg font-bold text-red-600">{scanner.invalidScans}</div>
                  <div className="text-xs text-[#8B7355]">Invalid</div>
                </div>
                <div className="text-center p-2 bg-gradient-to-br from-[#FFF9ED] to-white rounded-lg">
                  <div className="text-lg font-bold text-[#FFC857]">
                    {((scanner.validScans / scanner.totalScans) * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-[#8B7355]">Success</div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-[rgba(139,115,85,0.1)]">
                <div className="flex items-center gap-2 text-sm text-[#8B7355]">
                  <Clock className="h-4 w-4" />
                  <span>Last scan: {scanner.lastScan}</span>
                </div>
                <button className="text-sm text-[#FFC857] hover:text-[#FFB627] font-medium transition-colors flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  View
                </button>
              </div>
            </div>
          </WarmCard>
        ))}
      </div>

      {/* Alert for Offline Scanners */}
      {scanners.some(s => s.status === 'offline') && (
        <WarmCard padding="lg" className="bg-gradient-to-br from-red-50 to-white border-2 border-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Offline Scanners Detected</h3>
              <p className="text-sm text-red-700 mb-3">
                {scanners.filter(s => s.status === 'offline').length} scanner(s) have gone offline. Please check their connection.
              </p>
              <div className="space-y-1">
                {scanners.filter(s => s.status === 'offline').map(scanner => (
                  <div key={scanner.id} className="text-sm text-red-600">
                    • {scanner.userName} ({scanner.deviceId})
                  </div>
                ))}
              </div>
            </div>
          </div>
        </WarmCard>
      )}

      {/* Real-time Activity Feed */}
      <WarmCard padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#2D2721]">Real-time Activity Feed</h2>
          <div className="flex items-center gap-2 text-sm text-[#9DB5A5]">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live
          </div>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {scanners
            .filter(s => s.status === 'active')
            .slice(0, 10)
            .map((scanner, idx) => (
              <div 
                key={`${scanner.id}-${idx}`}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-[#FFF9ED] to-white rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center text-white text-xs font-bold">
                    {scanner.userName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#2D2721]">
                      {scanner.userName} scanned a ticket
                    </div>
                    <div className="text-xs text-[#8B7355]">
                      {scanner.deviceId} • {scanner.lastScan}
                    </div>
                  </div>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            ))}
        </div>
      </WarmCard>
    </div>
  );
}
