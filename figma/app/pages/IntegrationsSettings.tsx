import { useState } from 'react';
import { WarmButton } from '@app/components/WarmButton';
import { ImageWithFallback } from '@app/components/figma/ImageWithFallback';
import { Switch } from '@app/components/ui/switch';
import { Input } from '@app/components/ui/input';
import { Label } from '@app/components/ui/label';
import { 
  Globe, 
  Server, 
  CreditCard, 
  Truck, 
  FileText, 
  Key, 
  Webhook, 
  ShieldCheck, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Building2,
  Lock,
  ExternalLink,
  AlertCircle,
  Briefcase,
  BarChart3,
  Megaphone,
  Tag,
  Share2,
  PieChart,
  Target,
  Instagram,
  Youtube,
  Linkedin
} from 'lucide-react';
import { toast } from 'sonner';

export function IntegrationsSettings() {
  const [activeTab, setActiveTab] = useState<'integrations' | 'api' | 'domain' | 'b2b'>('integrations');

  return (
    <div className="flex flex-col h-screen bg-[#FAF7F2] overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white border-b border-[#E7DCC7] flex items-center px-8 shrink-0">
        <h1 className="text-xl font-bold text-[#2D2721] flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-[#E17B5C]" />
          Seaded ja Integratsioonid
        </h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-[#E7DCC7] flex flex-col shrink-0">
          <nav className="p-4 space-y-1">
            <NavButton 
              active={activeTab === 'integrations'} 
              onClick={() => setActiveTab('integrations')}
              icon={Server}
              label="Integratsioonid"
            />
            <NavButton 
              active={activeTab === 'api'} 
              onClick={() => setActiveTab('api')}
              icon={Key}
              label="API ja Arendus"
            />
            <NavButton 
              active={activeTab === 'domain'} 
              onClick={() => setActiveTab('domain')}
              icon={Globe}
              label="Domeen"
            />
            <NavButton 
              active={activeTab === 'b2b'} 
              onClick={() => setActiveTab('b2b')}
              icon={Briefcase}
              label="B2B Seaded"
            />
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto">
            
            {activeTab === 'integrations' && <IntegrationsTab />}
            {activeTab === 'api' && <ApiTab />}
            {activeTab === 'domain' && <DomainTab />}
            {activeTab === 'b2b' && <B2BTab />}

          </div>
        </main>
      </div>
    </div>
  );
}

// --- Sub-components ---

function NavButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        active 
          ? 'bg-[#FFF9ED] text-[#E17B5C] border border-[#E17B5C]/20' 
          : 'text-[#6B5744] hover:bg-[#FAF7F2] hover:text-[#2D2721]'
      }`}
    >
      <Icon className={`w-4 h-4 ${active ? 'text-[#E17B5C]' : 'text-[#8B7355]'}`} />
      {label}
    </button>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// --- TABS ---

function IntegrationsTab() {
  const [integrations, setIntegrations] = useState([
    { id: 'swed', name: 'Swedbank', type: 'payment', active: true, icon: CreditCard, desc: 'Makselingid ja pangatehingute import.' },
    { id: 'lhv', name: 'LHV Pank', type: 'payment', active: false, icon: CreditCard, desc: 'Otsene ühendus LHV Connect kaudu.' },
    { id: 'montonio', name: 'Montonio', type: 'payment', active: false, icon: CreditCard, desc: 'Makse- ja järelmaksulahendused.' },
    
    { id: 'omniva', name: 'Omniva', type: 'logistics', active: true, icon: Truck, desc: 'Pakiautomaatide asukohad ja siltide trükk.' },
    { id: 'itella', name: 'SmartPost Itella', type: 'logistics', active: false, icon: Truck, desc: 'Pakkide saatmine SmartPosti kaudu.' },
    
    { id: 'smart', name: 'SmartAccounts', type: 'accounting', active: true, icon: FileText, desc: 'Müügiarvete automaatne saatmine.' },
    { id: 'merit', name: 'Merit Aktiva', type: 'accounting', active: false, icon: FileText, desc: 'Raamatupidamise sünkroniseerimine.' },

    { id: 'ga4', name: 'Google Analytics 4', type: 'marketing', active: false, icon: BarChart3, desc: 'Jälgi poe külastatavust ja müüke.' },
    { id: 'gads', name: 'Google Ads', type: 'marketing', active: false, icon: Megaphone, desc: 'Reklaamivõrgustiku ühendus ja konversioonid.' },
    { id: 'gtm', name: 'Google Tag Manager', type: 'marketing', active: false, icon: Tag, desc: 'Halda kõiki oma skripte ühest kohast.' },
    { id: 'meta', name: 'Meta Pixel (Facebook)', type: 'marketing', active: false, icon: Share2, desc: 'Facebooki ja Instagrami reklaamide jälgimine.' },

    { id: 'insta', name: 'Instagram Feed', type: 'social', active: false, icon: Instagram, desc: 'Kuva oma viimaseid postitusi poe avalehel.' },
    { id: 'fb_shop', name: 'Facebook Shop', type: 'social', active: false, icon: Share2, desc: 'Sünkroniseeri tooted automaatselt Facebooki kataloogi.' },
    { id: 'youtube', name: 'YouTube', type: 'social', active: false, icon: Youtube, desc: 'Lisa tootelehtedele videoid otse oma kanalist.' },
  ]);

  const toggleIntegration = (id: string) => {
    setIntegrations(integrations.map(i => {
      if (i.id === id) {
        const newState = !i.active;
        toast(newState ? 'Integratsioon aktiveeritud' : 'Integratsioon peatatud', {
          description: `${i.name} on nüüd ${newState ? 'ühendatud' : 'lahti ühendatud'}.`
        });
        return { ...i, active: newState };
      }
      return i;
    }));
  };

  const groups = [
    { title: 'Turundus ja Analüütika', type: 'marketing' },
    { title: 'Sotsiaalmeedia ja Sisu', type: 'social' },
    { title: 'Pangad ja Maksed', type: 'payment' },
    { title: 'Logistika ja Tarne', type: 'logistics' },
    { title: 'Raamatupidamine', type: 'accounting' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-[#2D2721] mb-2">Teenuste Liidestamine</h2>
        <p className="text-[#6B5744]">Halda väliseid teenuseid, mis panevad sinu äri toimima.</p>
      </div>

      {groups.map(group => (
        <div key={group.type}>
          <h3 className="text-sm font-bold text-[#8B7355] uppercase tracking-wider mb-4 border-b border-[#E7DCC7] pb-2">{group.title}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {integrations.filter(i => i.type === group.type).map(item => (
              <div key={item.id} className={`p-5 rounded-xl border-2 transition-all flex items-start gap-4 ${item.active ? 'bg-white border-[#00D098]/30 shadow-sm' : 'bg-[#FAF7F2] border-transparent'}`}>
                <div className={`p-3 rounded-lg ${item.active ? 'bg-[#E6F4EA] text-[#00D098]' : 'bg-[#E7DCC7] text-[#6B5744]'}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-[#2D2721]">{item.name}</h4>
                    <Switch checked={item.active} onCheckedChange={() => toggleIntegration(item.id)} />
                  </div>
                  <p className="text-sm text-[#6B5744] leading-relaxed">{item.desc}</p>
                  {item.active && (
                    <div className="mt-3 flex items-center gap-2 text-xs font-bold text-[#00D098]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00D098] animate-pulse"></div>
                      Aktiivne ühendus
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ApiTab() {
  const [keys, setKeys] = useState([
    { id: 1, name: 'Tootearendus PROD', prefix: 'pk_live_...', created: '20.03.2024', lastUsed: 'Täna, 14:30' },
    { id: 2, name: 'Testkeskkond', prefix: 'pk_test_...', created: '15.02.2024', lastUsed: 'Eile, 09:15' },
  ]);

  const copyToClipboard = () => {
    toast.success('API võti kopeeritud lõikelauale');
  };

  const createKey = () => {
    toast.success('Uus API võti genereeritud!');
    setKeys([...keys, { 
      id: Math.random(), 
      name: 'Uus Võti', 
      prefix: 'pk_live_...', 
      created: 'Just nüüd', 
      lastUsed: '-' 
    }]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#2D2721] mb-2">API Võtmed</h2>
          <p className="text-[#6B5744]">Halda ligipääsu GiftHubi arendajate liidestele.</p>
        </div>
        <WarmButton onClick={createKey} className="gap-2">
          <Plus className="w-4 h-4" /> Loo uus võti
        </WarmButton>
      </div>

      <div className="bg-white rounded-xl border border-[#E7DCC7] overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#FAF7F2] text-[#8B7355] font-bold border-b border-[#E7DCC7]">
            <tr>
              <th className="p-4">Nimi</th>
              <th className="p-4">Võtme prefiks</th>
              <th className="p-4">Loodud</th>
              <th className="p-4">Viimati kasutatud</th>
              <th className="p-4 text-right">Tegevused</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7DCC7]">
            {keys.map(key => (
              <tr key={key.id} className="group hover:bg-[#FAF7F2]/50">
                <td className="p-4 font-bold text-[#2D2721]">{key.name}</td>
                <td className="p-4 font-mono text-[#6B5744] bg-gray-50 rounded w-fit px-2 py-1">{key.prefix}••••••••</td>
                <td className="p-4 text-[#6B5744]">{key.created}</td>
                <td className="p-4 text-[#6B5744]">{key.lastUsed}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={copyToClipboard} className="p-2 hover:bg-[#E7DCC7]/30 rounded text-[#8B7355] transition-colors" title="Kopeeri">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-red-50 rounded text-[#8B7355] hover:text-red-500 transition-colors" title="Kustuta">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-[#2D2721] text-[#E7DCC7] p-6 rounded-xl flex items-start gap-4">
        <Webhook className="w-6 h-6 mt-1 text-[#FFC857]" />
        <div>
          <h3 className="font-bold text-white mb-2">Webhooks</h3>
          <p className="text-sm opacity-80 mb-4">Seadista teavitused sündmuste kohta (nt. `order.created`, `rental.ended`) oma välisele serverile.</p>
          <WarmButton variant="outline" className="border-[#E7DCC7]/20 text-white hover:bg-white/10 hover:text-white">
             Seadista Webhooke
          </WarmButton>
        </div>
      </div>
    </div>
  );
}

function DomainTab() {
  const [domain, setDomain] = useState('pood.minubränd.ee');
  const [status, setStatus] = useState<'pending' | 'active'>('pending');

  const verifyDomain = () => {
    setStatus('active');
    toast.success('Domeen edukalt verifitseeritud!');
  };

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in duration-500">
       <div>
        <h2 className="text-2xl font-bold text-[#2D2721] mb-2">Domeeni Seaded</h2>
        <p className="text-[#6B5744]">Ühenda oma olemasolev domeen GiftHubi poega.</p>
      </div>

      <div className="bg-white p-8 rounded-xl border border-[#E7DCC7] shadow-sm">
         <div className="flex items-end gap-4 mb-8">
            <div className="flex-1 space-y-2">
               <Label>Sinu domeen</Label>
               <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B7355]" />
                  <Input 
                    value={domain} 
                    onChange={(e) => setDomain(e.target.value)} 
                    className="pl-10 font-mono text-base"
                  />
               </div>
            </div>
            <WarmButton onClick={verifyDomain} className="mb-[2px] shadow-warm">
               Salvesta ja Kontrolli
            </WarmButton>
         </div>

         <div className="bg-[#FAF7F2] rounded-lg p-6 border border-[#E7DCC7]">
            <h4 className="font-bold text-[#2D2721] mb-4 flex items-center gap-2">
               <div className={`w-2.5 h-2.5 rounded-full ${status === 'active' ? 'bg-[#00D098]' : 'bg-[#FFC857] animate-pulse'}`}></div>
               DNS Kirjed {status === 'active' ? '(Korras)' : '(Ootab kinnitust)'}
            </h4>
            
            <div className="space-y-4">
               <div className="flex items-center justify-between p-3 bg-white border border-[#E7DCC7] rounded text-sm">
                  <div className="flex items-center gap-4">
                     <span className="font-bold w-16 text-[#8B7355]">CNAME</span>
                     <span className="font-mono text-[#2D2721]">www</span>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className="font-mono text-[#6B5744]">cname.gifthub.ee</span>
                     {status === 'active' ? <Check className="w-4 h-4 text-[#00D098]" /> : <RefreshCw className="w-4 h-4 text-[#FFC857] animate-spin" />}
                  </div>
               </div>
               
               <div className="flex items-center justify-between p-3 bg-white border border-[#E7DCC7] rounded text-sm">
                  <div className="flex items-center gap-4">
                     <span className="font-bold w-16 text-[#8B7355]">A</span>
                     <span className="font-mono text-[#2D2721]">@</span>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className="font-mono text-[#6B5744]">76.76.21.21</span>
                     {status === 'active' ? <Check className="w-4 h-4 text-[#00D098]" /> : <RefreshCw className="w-4 h-4 text-[#FFC857] animate-spin" />}
                  </div>
               </div>
            </div>

            <div className="mt-6 flex items-start gap-3 text-sm text-[#6B5744] bg-white/50 p-3 rounded">
               <AlertCircle className="w-5 h-5 text-[#E17B5C] shrink-0" />
               <p>DNS muudatuste levimine võib võtta aega kuni 24 tundi. SSL sertifikaat genereeritakse automaatselt pärast DNS kirjete kinnitamist.</p>
            </div>
         </div>
      </div>
    </div>
  );
}

function B2BTab() {
   return (
      <div className="max-w-3xl space-y-8 animate-in fade-in duration-500">
         <div>
            <h2 className="text-2xl font-bold text-[#2D2721] mb-2">B2B ja Ärikliendi Seaded</h2>
            <p className="text-[#6B5744]">Kohanda poe käitumist äriklientide ja hulgimüügi jaoks.</p>
         </div>

         <div className="bg-white rounded-xl border border-[#E7DCC7] divide-y divide-[#E7DCC7] shadow-sm">
            <div className="p-6 flex items-center justify-between">
               <div>
                  <h4 className="font-bold text-[#2D2721]">Ärikliendi registreerimine</h4>
                  <p className="text-sm text-[#6B5744] mt-1">Luba ettevõtetel registreerida ja küsi KMKR numbrit.</p>
               </div>
               <Switch defaultChecked />
            </div>

            <div className="p-6 flex items-center justify-between">
               <div>
                  <h4 className="font-bold text-[#2D2721]">Kuva hindu käibemaksuta</h4>
                  <p className="text-sm text-[#6B5744] mt-1">Sisselogitud äriklientidele näidatakse hindu ilma KM-ta.</p>
               </div>
               <Switch defaultChecked />
            </div>

            <div className="p-6 flex items-center justify-between">
               <div>
                  <h4 className="font-bold text-[#2D2721]">Automaatne krediidilimiit</h4>
                  <p className="text-sm text-[#6B5744] mt-1">Määra vaikimisi krediidilimiit uutele äriklientidele (0 = keelatud).</p>
               </div>
               <div className="flex items-center gap-2">
                  <Input className="w-24 text-right" defaultValue="500" />
                  <span className="text-sm font-bold text-[#2D2721]">€</span>
               </div>
            </div>

             <div className="p-6 flex items-center justify-between">
               <div>
                  <h4 className="font-bold text-[#2D2721]">Hinnakirjad</h4>
                  <p className="text-sm text-[#6B5744] mt-1">Võimalda kliendipõhiseid hinnakirju ja allahindlusi.</p>
               </div>
               <div className="flex items-center gap-2">
                  <span className="text-xs bg-[#E17B5C] text-white px-2 py-1 rounded">PRO</span>
                  <Switch />
               </div>
            </div>
         </div>

         <div className="bg-[#FAF7F2] border border-[#E7DCC7] p-6 rounded-xl">
             <h3 className="font-bold text-[#2D2721] mb-4 flex items-center gap-2">
               <ShieldCheck className="w-5 h-5 text-[#00D098]" />
               Ärikliendi valideerimine
             </h3>
             <div className="space-y-4">
               <p className="text-sm text-[#6B5744]">
                  Kasutame <strong>Äriregistri API-t</strong>, et kontrollida ettevõtete tausta ja KMKR kehtivust automaatselt.
               </p>
               <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-sm">
                     <Switch defaultChecked />
                     <span>Automaatne taustakontroll</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                     <Switch defaultChecked />
                     <span>Blokeeri võlgnevustega ettevõtted</span>
                  </div>
               </div>
             </div>
         </div>
      </div>
   );
}