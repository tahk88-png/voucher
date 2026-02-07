import { useState } from 'react';
import { WarmCard } from '@/figma/app/components/WarmCard';
import { WarmButton } from '@/figma/app/components/WarmButton';
import { Input } from '@/figma/app/components/ui/input';
import { Label } from '@/figma/app/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/figma/app/components/ui/tabs';
import { 
  ShieldCheck, 
  Upload, 
  Camera, 
  Smartphone, 
  Fingerprint, 
  CheckCircle2, 
  Loader2,
  FileText,
  UserSquare2
} from 'lucide-react';
import { toast } from 'sonner';

interface IDVerificationProps {
  onVerified: () => void;
}

export function IDVerification({ onVerified }: IDVerificationProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [personalCode, setPersonalCode] = useState('');

  const handleManualVerification = () => {
    if (!docFile || !selfieFile) {
      toast.error('Palun lae üles nii dokument kui ka selfie.');
      return;
    }

    setIsVerifying(true);
    // Simulate API call
    setTimeout(() => {
      setIsVerifying(false);
      toast.success('Isik tuvastatud!');
      onVerified();
    }, 2500);
  };

  const handleSmartID = () => {
    if (personalCode.length !== 11) {
      toast.error('Palun sisesta korrektne isikukood (11 numbrit).');
      return;
    }

    setIsVerifying(true);
    toast.info('Kontrollkood: 1234. Palun kinnita Smart-ID äpis.');
    
    // Simulate polling
    setTimeout(() => {
      setIsVerifying(false);
      toast.success('Smart-ID kinnitatud!');
      onVerified();
    }, 4000);
  };

  const handleMobileID = () => {
    if (personalCode.length !== 11) {
      toast.error('Palun sisesta korrektne isikukood.');
      return;
    }
    
    setIsVerifying(true);
    toast.info('Kontrollkood: 5678. Ootan Mobile-ID kinnitust...');
    
    setTimeout(() => {
      setIsVerifying(false);
      toast.success('Mobile-ID kinnitatud!');
      onVerified();
    }, 4000);
  };

  return (
    <WarmCard padding="lg" className="bg-white border-2 border-[#E17B5C]/20 shadow-warm-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-[#E17B5C]/10 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-[#E17B5C]" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-[#2D2721]">Isikutuvastus</h3>
          <p className="text-sm text-[#6B5744]">Renditeenuse kasutamiseks on vajalik isiku kinnitamine.</p>
        </div>
      </div>

      <Tabs defaultValue="smart-id" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-[#FAF7F2] p-1 rounded-xl">
          <TabsTrigger value="smart-id" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Fingerprint className="w-4 h-4" /> Smart-ID
          </TabsTrigger>
          <TabsTrigger value="mobile-id" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Smartphone className="w-4 h-4" /> Mobile-ID
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Upload className="w-4 h-4" /> Dokument
          </TabsTrigger>
        </TabsList>

        {/* Smart-ID Tab */}
        <TabsContent value="smart-id" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="smart-id-code">Isikukood</Label>
            <Input 
              id="smart-id-code" 
              placeholder="38001010000" 
              value={personalCode}
              onChange={(e) => setPersonalCode(e.target.value)}
              className="bg-[#FAF7F2] text-lg tracking-widest"
              maxLength={11}
            />
          </div>
          <WarmButton 
            fullWidth 
            onClick={handleSmartID} 
            disabled={isVerifying}
            className="bg-[#00D098] hover:bg-[#00B080] text-white border-none"
          >
            {isVerifying ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Ootan kinnitust...</>
            ) : (
              'Saada Smart-ID päring'
            )}
          </WarmButton>
          <p className="text-xs text-center text-[#8B7355] mt-2">
            Pärast nupule vajutamist saadetakse sinu telefoni kontrollkood.
          </p>
        </TabsContent>

        {/* Mobile-ID Tab */}
        <TabsContent value="mobile-id" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mobile-id-code">Isikukood</Label>
            <Input 
              id="mobile-id-code" 
              placeholder="38001010000" 
              value={personalCode}
              onChange={(e) => setPersonalCode(e.target.value)}
              className="bg-[#FAF7F2] text-lg tracking-widest"
              maxLength={11}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefoninumber</Label>
            <Input 
              id="phone" 
              placeholder="+372 5..." 
              className="bg-[#FAF7F2]"
            />
          </div>
          <WarmButton 
            fullWidth 
            onClick={handleMobileID} 
            disabled={isVerifying}
            className="bg-[#2D2721] text-white"
          >
            {isVerifying ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Ootan kinnitust...</>
            ) : (
              'Saada Mobile-ID päring'
            )}
          </WarmButton>
        </TabsContent>

        {/* Document Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Document Upload */}
            <div className={`
              border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer
              ${docFile ? 'border-[#00D098] bg-[#00D098]/5' : 'border-[#E7DCC7] hover:border-[#E17B5C] bg-[#FAF7F2]'}
            `}>
              <input 
                type="file" 
                id="doc-upload" 
                className="hidden" 
                accept="image/*"
                onChange={(e) => setDocFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="doc-upload" className="cursor-pointer w-full flex flex-col items-center">
                {docFile ? (
                  <>
                    <FileText className="w-8 h-8 text-[#00D098] mb-2" />
                    <span className="text-sm font-bold text-[#2D2721] truncate max-w-[120px]">{docFile.name}</span>
                    <span className="text-xs text-[#00D098]">Üles laetud</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-8 h-8 text-[#8B7355] mb-2" />
                    <span className="text-sm font-bold text-[#2D2721]">Dokument</span>
                    <span className="text-xs text-[#8B7355]">Pass või ID-kaart</span>
                  </>
                )}
              </label>
            </div>

            {/* Selfie Upload */}
            <div className={`
              border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer
              ${selfieFile ? 'border-[#00D098] bg-[#00D098]/5' : 'border-[#E7DCC7] hover:border-[#E17B5C] bg-[#FAF7F2]'}
            `}>
              <input 
                type="file" 
                id="selfie-upload" 
                className="hidden" 
                accept="image/*" 
                capture="user"
                onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="selfie-upload" className="cursor-pointer w-full flex flex-col items-center">
                {selfieFile ? (
                  <>
                    <UserSquare2 className="w-8 h-8 text-[#00D098] mb-2" />
                    <span className="text-sm font-bold text-[#2D2721] truncate max-w-[120px]">{selfieFile.name}</span>
                    <span className="text-xs text-[#00D098]">Üles laetud</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-[#8B7355] mb-2" />
                    <span className="text-sm font-bold text-[#2D2721]">Sinu pilt</span>
                    <span className="text-xs text-[#8B7355]">Tee selfie</span>
                  </>
                )}
              </label>
            </div>
          </div>

          <WarmButton 
            fullWidth 
            onClick={handleManualVerification} 
            disabled={isVerifying || !docFile || !selfieFile}
          >
            {isVerifying ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Kontrollin andmeid...</>
            ) : (
              'Kinnita ja jätka'
            )}
          </WarmButton>
        </TabsContent>
      </Tabs>
    </WarmCard>
  );
}