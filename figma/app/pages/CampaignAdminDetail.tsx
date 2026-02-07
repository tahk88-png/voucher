import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WarmCard } from '@/figma/app/components/WarmCard';
import { WarmButton } from '@/figma/app/components/WarmButton';
import { Input } from '@/figma/app/components/ui/input';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Calendar, 
  Users, 
  TrendingUp, 
  CreditCard,
  QrCode,
  Settings,
  Download,
  Share2,
  Copy,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { CurrencyDisplay } from '@/figma/app/components/CurrencyDisplay';

// Mock data types matching our system
type CampaignType = 'voucher' | 'gift_card' | 'discount';

type Campaign = {
  id: string;
  name: string;
  description: string;
  type: CampaignType;
  status: 'active' | 'draft' | 'ended' | 'paused';
  startDate: string;
  endDate: string;
  price: number;
  discountPercentage: number;
  originalPrice: number;
  revenue: number;
  redemptions: number;
  shares: number;
  totalCodes: number;
};

// Mock data generator
const getMockCampaign = (id: string): Campaign => ({
  id,
  name: 'Summer Electronics Sale',
  description: 'Huge discounts on all electronics. Limited time offer.',
  type: 'voucher',
  status: 'active',
  startDate: '2024-06-01',
  endDate: '2024-08-31',
  price: 45,
  originalPrice: 100,
  discountPercentage: 55,
  revenue: 5680,
  redemptions: 234,
  shares: 456,
  totalCodes: 500,
});

export function CampaignAdminDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'codes'>('overview');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      if (id) {
        setCampaign(getMockCampaign(id));
      }
      setLoading(false);
    }, 800);
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-[#6B5744]">Laen andmeid...</div>;
  }

  if (!campaign) {
    return <div className="p-8 text-center text-[#6B5744]">Kampaaniat ei leitud</div>;
  }

  const handleSave = () => {
    toast.success('Muudatused salvestatud!');
  };

  const renderStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-700 border-green-200',
      draft: 'bg-gray-100 text-gray-700 border-gray-200',
      ended: 'bg-red-100 text-red-700 border-red-200',
      paused: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/campaigns-list')}
            className="p-2 rounded-full hover:bg-[#E7DCC7]/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#6B5744]" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#2D2721] flex items-center gap-3">
              {campaign.name}
              {renderStatusBadge(campaign.status)}
            </h1>
            <p className="text-[#6B5744] text-sm">ID: {campaign.id} • {campaign.type.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <WarmButton variant="outline" onClick={() => window.open(`/campaign/${campaign.id}`, '_blank')}>
            <Share2 className="w-4 h-4 mr-2" />
            Vaata avalikku vaadet
          </WarmButton>
          <WarmButton onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Salvesta
          </WarmButton>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#E7DCC7]">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'overview' 
              ? 'border-[#E17B5C] text-[#E17B5C]' 
              : 'border-transparent text-[#6B5744] hover:text-[#2D2721]'
          }`}
        >
          Ülevaade
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'settings' 
              ? 'border-[#E17B5C] text-[#E17B5C]' 
              : 'border-transparent text-[#6B5744] hover:text-[#2D2721]'
          }`}
        >
          Seaded
        </button>
        <button
          onClick={() => setActiveTab('codes')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'codes' 
              ? 'border-[#E17B5C] text-[#E17B5C]' 
              : 'border-transparent text-[#6B5744] hover:text-[#2D2721]'
          }`}
        >
          Koodid ja Vautšerid
        </button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {activeTab === 'overview' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <WarmCard padding="md" className="bg-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-50 rounded-lg text-green-600">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium text-[#6B5744]">Käive</span>
                  </div>
                  <div className="text-2xl font-bold text-[#2D2721]">
                    <CurrencyDisplay amount={campaign.revenue} currency="EUR" />
                  </div>
                </WarmCard>
                <WarmCard padding="md" className="bg-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium text-[#6B5744]">Lunastatud</span>
                  </div>
                  <div className="text-2xl font-bold text-[#2D2721]">
                    {campaign.redemptions} <span className="text-sm font-normal text-gray-400">/ {campaign.totalCodes}</span>
                  </div>
                </WarmCard>
                <WarmCard padding="md" className="bg-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium text-[#6B5744]">Aktiivsus</span>
                  </div>
                  <div className="text-2xl font-bold text-[#2D2721]">
                    {campaign.shares} <span className="text-sm font-normal text-gray-400">jagamist</span>
                  </div>
                </WarmCard>
              </div>

              {/* Performance Chart Placeholder */}
              <WarmCard padding="lg" className="bg-white">
                <h3 className="text-lg font-bold text-[#2D2721] mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#E17B5C]" />
                  Müügi ja lunastamise dünaamika
                </h3>
                <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center border border-dashed border-gray-200 text-gray-400">
                  Graafik kuvatakse siin
                </div>
              </WarmCard>
            </>
          )}

          {activeTab === 'settings' && (
            <WarmCard padding="lg" className="bg-white space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[#2D2721] mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#E17B5C]" />
                  Kampaania seaded
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#6B5744]">Kampaania nimi</label>
                    <Input defaultValue={campaign.name} className="bg-[#FAF7F2]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#6B5744]">Staatus</label>
                    <select className="w-full h-10 px-3 rounded-md border border-input bg-[#FAF7F2] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <option value="active">Aktiivne</option>
                      <option value="paused">Peatatud</option>
                      <option value="draft">Mustand</option>
                      <option value="ended">Lõppenud</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-[#6B5744]">Kirjeldus</label>
                    <textarea 
                      className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-[#FAF7F2] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      defaultValue={campaign.description}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#6B5744]">Alguskuupäev</label>
                    <Input type="date" defaultValue={campaign.startDate} className="bg-[#FAF7F2]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#6B5744]">Lõppkuupäev</label>
                    <Input type="date" defaultValue={campaign.endDate} className="bg-[#FAF7F2]" />
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E7DCC7] pt-6">
                <h3 className="text-lg font-bold text-[#2D2721] mb-4">Hinnastamine ja Limiidid</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#6B5744]">Tavahind (€)</label>
                    <Input type="number" defaultValue={campaign.originalPrice} className="bg-[#FAF7F2]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#6B5744]">Soodushind (€)</label>
                    <Input type="number" defaultValue={campaign.price} className="bg-[#FAF7F2]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#6B5744]">Kogus (tk)</label>
                    <Input type="number" defaultValue={campaign.totalCodes} className="bg-[#FAF7F2]" />
                  </div>
                </div>
              </div>
            </WarmCard>
          )}

          {activeTab === 'codes' && (
            <WarmCard padding="lg" className="bg-white">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#2D2721] flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-[#E17B5C]" />
                  Genereeritud koodid
                </h3>
                <WarmButton size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Eksport
                </WarmButton>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-[#6B5744] uppercase bg-[#FAF7F2]">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Kood</th>
                      <th className="px-4 py-3">Staatus</th>
                      <th className="px-4 py-3">Ostja</th>
                      <th className="px-4 py-3 rounded-r-lg">Lunastatud</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#2D2721]">
                    {[1,2,3,4,5].map((i) => (
                      <tr key={i} className="border-b border-[#E7DCC7]/30 hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono font-medium">SALE20-{Math.random().toString(36).substring(2,6).toUpperCase()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${i % 2 === 0 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {i % 2 === 0 ? 'Lunastatud' : 'Müüdud'}
                          </span>
                        </td>
                        <td className="px-4 py-3">user{i}@example.com</td>
                        <td className="px-4 py-3">{i % 2 === 0 ? '25.01.2026 14:30' : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </WarmCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <WarmCard padding="md" className="bg-[#2D2721] text-white">
            <h3 className="font-bold mb-2">Kampaania tüüp</h3>
            <p className="text-white/80 text-sm mb-4">
              See kampaania on seadistatud kui <strong>{campaign.type}</strong>. 
              {campaign.type === 'voucher' && ' Kliendid saavad osta vautšeri ja lunastada selle kohapeal.'}
              {campaign.type === 'gift_card' && ' Kliendid saavad osta kinkekaardi kindlas väärtuses.'}
            </p>
            <div className="flex items-center gap-2 text-xs bg-white/10 p-2 rounded-lg">
              <AlertCircle className="w-4 h-4 text-[#E17B5C]" />
              Tüübi muutmine pole aktiivsel kampaanial lubatud.
            </div>
          </WarmCard>

          <WarmCard padding="md" className="bg-white">
            <h3 className="font-bold text-[#2D2721] mb-4">Tegevused</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 rounded-md hover:bg-[#FAF7F2] text-[#6B5744] hover:text-[#E17B5C] transition-colors flex items-center gap-2">
                <Copy className="w-4 h-4" />
                Duplitseeri kampaania
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md hover:bg-[#FAF7F2] text-[#6B5744] hover:text-[#E17B5C] transition-colors flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Jaga halduslinki
              </button>
              <div className="h-px bg-[#E7DCC7] my-2" />
              <button className="w-full text-left px-3 py-2 rounded-md hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Kustuta kampaania
              </button>
            </div>
          </WarmCard>
        </div>
      </div>
    </div>
  );
}