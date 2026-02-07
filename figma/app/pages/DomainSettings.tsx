import { useState } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { Input } from '@app/components/ui/input';
import { Label } from '@app/components/ui/label';
import { Switch } from '@app/components/ui/switch';
import { 
  Globe, 
  CheckCircle2, 
  RefreshCw, 
  Copy, 
  AlertTriangle, 
  Lock,
  ExternalLink,
  Server
} from 'lucide-react';
import { toast } from 'sonner';

export function DomainSettings() {
  const [customDomain, setCustomDomain] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [useCustomDomain, setUseCustomDomain] = useState(false);

  const handleVerify = () => {
    if (!customDomain) return;
    setIsChecking(true);
    
    // Simulate DNS check
    setTimeout(() => {
      setIsChecking(false);
      if (customDomain.includes('.')) {
        setIsVerified(true);
        toast.success('Domeeni DNS kirjed leitud ja kinnitatud!');
      } else {
        toast.error('Vigane domeeninimi. Palun kontrolli sisestust.');
      }
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Kopeeritud lõikelauale');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#2D2721]">Domeen ja Integratsioon</h2>
          <p className="text-[#6B5744]">Seadista oma pood töötama oma domeenil (White-Label).</p>
        </div>
        <WarmButton variant="outline" onClick={() => window.open('/b2b-solutions', '_blank')}>
          <ExternalLink className="w-4 h-4 mr-2" />
          Loe lahenduse kohta
        </WarmButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <WarmCard padding="lg" className="bg-white">
             <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                 <div className="bg-[#E6F4EA] p-2 rounded-full">
                   <Globe className="w-6 h-6 text-[#00D098]" />
                 </div>
                 <div>
                   <h3 className="font-bold text-[#2D2721]">Oma domeen</h3>
                   <p className="text-sm text-[#6B5744]">Suuna kliendid otse aadressile {customDomain || 'shop.sinufirma.ee'}</p>
                 </div>
               </div>
               <Switch checked={useCustomDomain} onCheckedChange={setUseCustomDomain} />
             </div>

             {useCustomDomain && (
               <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                 <div className="grid gap-2">
                   <Label htmlFor="domain">Domeeninimi</Label>
                   <div className="flex gap-2">
                     <Input 
                        id="domain" 
                        placeholder="nt. pood.minufirma.ee" 
                        value={customDomain}
                        onChange={(e) => {
                          setCustomDomain(e.target.value);
                          setIsVerified(false);
                        }}
                        className={isVerified ? "border-[#00D098] bg-[#E6F4EA]/20" : ""}
                     />
                     <WarmButton onClick={handleVerify} disabled={isChecking || !customDomain}>
                       {isChecking ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Kontrolli DNS-i'}
                     </WarmButton>
                   </div>
                   {isVerified && (
                     <div className="flex items-center gap-2 text-sm text-[#00D098] font-medium mt-1">
                       <CheckCircle2 className="w-4 h-4" /> Domeen on korrektselt suunatud
                     </div>
                   )}
                 </div>

                 <div className="bg-[#FAF7F2] border border-[#E7DCC7] rounded-lg p-4 space-y-4">
                   <h4 className="font-bold text-[#2D2721] flex items-center gap-2">
                     <Server className="w-4 h-4" />
                     DNS Seadistamine
                   </h4>
                   <p className="text-sm text-[#6B5744]">
                     Palun lisa oma domeenihaldusesse (Zone, GoDaddy vm) järgmine CNAME kirje:
                   </p>
                   
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="bg-white p-3 rounded border border-[#E7DCC7]">
                       <div className="text-xs text-[#8B7355] uppercase font-bold mb-1">Tüüp</div>
                       <div className="font-mono text-[#2D2721]">CNAME</div>
                     </div>
                     <div className="bg-white p-3 rounded border border-[#E7DCC7] group relative cursor-pointer" onClick={() => copyToClipboard('shop')}>
                       <div className="text-xs text-[#8B7355] uppercase font-bold mb-1">Nimi (Host)</div>
                       <div className="font-mono text-[#2D2721]">{customDomain.split('.')[0] || 'shop'}</div>
                       <Copy className="w-3 h-3 text-[#8B7355] absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                     </div>
                     <div className="bg-white p-3 rounded border border-[#E7DCC7] group relative cursor-pointer" onClick={() => copyToClipboard('cname.platvorm.ee')}>
                       <div className="text-xs text-[#8B7355] uppercase font-bold mb-1">Väärtus (Target)</div>
                       <div className="font-mono text-[#2D2721]">cname.platvorm.ee</div>
                       <Copy className="w-3 h-3 text-[#8B7355] absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                     </div>
                   </div>

                   <div className="flex items-start gap-2 text-xs text-[#8B7355]">
                     <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                     <span>Muudatuste jõustumine võib võtta aega kuni 24 tundi, sõltuvalt teenusepakkujast.</span>
                   </div>
                 </div>
               </div>
             )}
          </WarmCard>

          <WarmCard padding="lg" className="bg-white">
            <h3 className="font-bold text-[#2D2721] mb-4">SSL Sertifikaat</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#E6F4EA] flex items-center justify-center">
                <Lock className="w-6 h-6 text-[#00D098]" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-[#2D2721]">Automaatne HTTPS kaitse</div>
                <p className="text-sm text-[#6B5744]">Kõik ühendused sinu white-label poega on krüpteeritud ja turvalised.</p>
              </div>
              <div className="px-3 py-1 bg-[#E6F4EA] text-[#00D098] text-xs font-bold rounded-full uppercase">Aktiivne</div>
            </div>
          </WarmCard>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <WarmCard padding="md" className="bg-[#2D2721] text-white">
            <h3 className="font-bold mb-2">B2B Enterprise</h3>
            <p className="text-sm text-gray-300 mb-4">
              Sinu praegune pakett toetab 1 kohandatud domeeni. Lisa võimsust juurde?
            </p>
            <WarmButton size="sm" className="w-full bg-[#E17B5C] hover:bg-[#CC6A4D] text-white border-none">
              Uuenda paketti
            </WarmButton>
          </WarmCard>

          <WarmCard padding="md" className="bg-white">
            <h3 className="font-bold text-[#2D2721] mb-4">Vaja abi seadistamisel?</h3>
            <ul className="space-y-3 text-sm text-[#6B5744]">
              <li className="flex items-center gap-2 hover:text-[#E17B5C] cursor-pointer">
                <ExternalLink className="w-4 h-4" /> Kuidas lisada CNAME Zone.ee-s?
              </li>
              <li className="flex items-center gap-2 hover:text-[#E17B5C] cursor-pointer">
                <ExternalLink className="w-4 h-4" /> GoDaddy DNS juhend
              </li>
              <li className="flex items-center gap-2 hover:text-[#E17B5C] cursor-pointer">
                <ExternalLink className="w-4 h-4" /> Veaparanus ja diagnostika
              </li>
            </ul>
          </WarmCard>
        </div>

      </div>
    </div>
  );
}