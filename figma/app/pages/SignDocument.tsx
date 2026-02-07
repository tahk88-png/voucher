import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { WarmCard } from '@/figma/app/components/WarmCard';
import { WarmButton } from '@/figma/app/components/WarmButton';
import { SEOHead } from '@/figma/app/components/SEOHead';
import { FileText, CheckCircle2, Shield, Smartphone, Loader2, ArrowLeft, Download } from 'lucide-react';
import { toast } from 'sonner';

export function SignDocument() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const docId = searchParams.get('id') || 'DOC-2024-001';
  const docType = searchParams.get('type') || 'Rendileping';
  
  const [step, setStep] = useState<'review' | 'signing' | 'success'>('review');
  const [verificationCode, setVerificationCode] = useState('');
  
  // Simulate signing process
  const startSigning = () => {
    // Generate random 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setVerificationCode(code);
    setStep('signing');
    
    // Simulate API delay for waiting user confirmation on phone
    setTimeout(() => {
      setStep('success');
      toast.success('Dokument edukalt allkirjastatud!');
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
      <SEOHead title="Dokumendi allkirjastamine" />
      
      <div className="max-w-2xl w-full">
        {/* Header (only show in review step to keep focus during signing) */}
        {step === 'review' && (
          <div className="mb-6 flex items-center gap-2">
             <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white text-[#6B5744] transition-colors">
                <ArrowLeft className="w-5 h-5" />
             </button>
             <h1 className="text-xl font-bold text-[#2D2721]">Allkirjastamine</h1>
          </div>
        )}

        <WarmCard padding="xl" className="relative overflow-hidden">
          
          {/* STEP 1: REVIEW */}
          {step === 'review' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-start gap-4 p-4 bg-white border border-[#E7DCC7] rounded-xl shadow-sm">
                <div className="p-3 bg-[#FFF9ED] rounded-lg">
                  <FileText className="w-8 h-8 text-[#FFC857]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#2D2721]">{docType} #{docId}</h2>
                  <p className="text-sm text-[#6B5744] mt-1">Palun tutvu dokumendi sisuga enne allkirjastamist.</p>
                  <div className="flex gap-3 mt-3">
                     <button className="text-xs font-bold text-[#E17B5C] hover:underline flex items-center gap-1">
                        <Download className="w-3 h-3" /> Lae alla PDF
                     </button>
                  </div>
                </div>
              </div>

              {/* Document Preview Placeholder */}
              <div className="h-64 bg-white border border-[#E7DCC7] rounded-xl p-6 overflow-y-auto text-sm text-[#6B5744] font-mono leading-relaxed shadow-inner">
                <p className="font-bold text-[#2D2721] mb-4">1. LEPINGU POOLED</p>
                <p className="mb-4">Käesolev leping on sõlmitud GiftHub (edaspidi Teenusepakkuja) ja Kliendi vahel...</p>
                <p className="font-bold text-[#2D2721] mb-4">2. TEENUSE TINGIMUSED</p>
                <p className="mb-4">Klient kohustub kasutama renditud vara heaperemehelikult ning tagastama selle kokkulepitud ajal.</p>
                <p className="mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.</p>
                <p className="mb-4">Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
                <div className="h-20 flex items-center justify-center text-[#E7DCC7] italic">
                   -- Lõpp --
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#FFF9ED] cursor-pointer transition-colors">
                  <input type="checkbox" className="mt-1 w-4 h-4 rounded border-[#E7DCC7] text-[#E17B5C] focus:ring-[#E17B5C]" />
                  <span className="text-sm text-[#2D2721]">Olen tutvunud tingimustega ja nõustun nendega täies mahus.</span>
                </label>
                
                <WarmButton fullWidth size="lg" onClick={startSigning}>
                   Allkirjasta digitaalselt
                </WarmButton>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-xs text-[#8B7355] mt-4">
                 <Shield className="w-3 h-3" /> Turvaline ühendus (SSL)
              </div>
            </div>
          )}

          {/* STEP 2: SIGNING (Smart-ID simulation) */}
          {step === 'signing' && (
            <div className="text-center py-8 animate-in zoom-in-95 duration-300">
               <div className="w-20 h-20 bg-[#E17B5C]/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                  <Smartphone className="w-10 h-10 text-[#E17B5C] animate-pulse" />
                  <div className="absolute -right-2 -top-2 bg-white rounded-full p-1 shadow-sm">
                     <Loader2 className="w-5 h-5 text-[#E17B5C] animate-spin" />
                  </div>
               </div>
               
               <h2 className="text-2xl font-bold text-[#2D2721] mb-2">Kontrolli oma telefoni</h2>
               <p className="text-[#6B5744] mb-8">Saatsime allkirjastamise päringu sinu Smart-ID rakendusse.</p>
               
               <div className="bg-[#FAF7F2] p-6 rounded-2xl inline-block border-2 border-[#E7DCC7] mb-8">
                  <div className="text-sm text-[#8B7355] uppercase tracking-widest font-bold mb-2">Kontrollkood</div>
                  <div className="text-5xl font-mono font-bold text-[#2D2721] tracking-widest">{verificationCode}</div>
               </div>
               
               <p className="text-sm text-[#8B7355] animate-pulse">Ootan kinnitust...</p>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 'success' && (
            <div className="text-center py-8 animate-in zoom-in-95 duration-500">
               <div className="w-20 h-20 bg-[#00D098]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-[#00D098]" />
               </div>
               
               <h2 className="text-2xl font-bold text-[#2D2721] mb-2">Dokument allkirjastatud!</h2>
               <p className="text-[#6B5744] mb-8">Sinu leping on edukalt sõlmitud ja saadetud e-postile.</p>
               
               <div className="space-y-3">
                  <WarmButton fullWidth onClick={() => navigate('/dashboard')}>
                     Mine töölauale
                  </WarmButton>
                  <WarmButton variant="outline" fullWidth onClick={() => navigate('/')}>
                     Tagasi avalehele
                  </WarmButton>
               </div>
            </div>
          )}

        </WarmCard>
      </div>
    </div>
  );
}