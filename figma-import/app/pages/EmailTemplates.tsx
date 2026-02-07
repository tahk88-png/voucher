import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WarmCard } from '@/app/components/WarmCard';
import { WarmButton } from '@/app/components/WarmButton';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { 
  ArrowLeft, 
  Mail, 
  LayoutTemplate, 
  Save, 
  Send, 
  Eye, 
  Image as ImageIcon,
  Facebook,
  Instagram,
  Twitter,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

type TemplateType = 'welcome' | 'newsletter';

export function EmailTemplates() {
  const navigate = useNavigate();
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>('welcome');
  
  // Welcome Email State
  const [welcomeData, setWelcomeData] = useState({
    subject: 'Tere tulemast meie platvormile!',
    title: 'Tere tulemast pardale, {name}!',
    body: 'Meil on väga hea meel, et liitusid meie kogukonnaga. Siit leiad parimad pakkumised ja eksklusiivsed võimalused.',
    buttonText: 'Alusta siit',
    footerText: '© 2024 Sinu Platvorm. Kõik õigused kaitstud.'
  });

  // Newsletter State
  const [newsletterData, setNewsletterData] = useState({
    subject: 'Selle nädala parimad pakkumised',
    title: 'Kuu uudised ja pakkumised',
    intro: 'Siin on kokkuvõte selle kuu kõige põnevamatest sündmustest ja pakkumistest.',
    highlightTitle: 'Suvine allahindlus',
    highlightText: 'Kõik suvetooted on nüüd kuni 50% soodsamad. Vaata lähemalt ja leia endale midagi ilusat.',
    buttonText: 'Vaata pakkumisi',
    footerText: 'Soovid uudiskirjast loobuda? Kliki siia.'
  });

  const handleSave = () => {
    toast.success('Mall salvestatud edukalt!');
  };

  const handleSendTest = () => {
    toast.success('Testkiri saadetud sinu e-postile!');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] p-6 pb-20">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin-dashboard')}
              className="p-2 hover:bg-black/5 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-[#2D2721]" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-[#2D2721]">E-posti mallid</h1>
              <p className="text-[#6B5744]">Halda liitumiskirju ja uudiskirja põhjasid</p>
            </div>
          </div>
          <div className="flex gap-2">
            <WarmButton variant="outline" onClick={handleSendTest}>
              <Send className="w-4 h-4 mr-2" />
              Saada test
            </WarmButton>
            <WarmButton onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Salvesta muudatused
            </WarmButton>
          </div>
        </div>

        {/* Template Selector */}
        <div className="flex gap-4 border-b border-[#E7DCC7] pb-1">
          <button
            onClick={() => setActiveTemplate('welcome')}
            className={`pb-3 px-4 text-sm font-bold transition-all border-b-2 ${
              activeTemplate === 'welcome' 
                ? 'border-[#E17B5C] text-[#E17B5C]' 
                : 'border-transparent text-[#6B5744] hover:text-[#2D2721]'
            }`}
          >
            Liitumiskiri (Welcome)
          </button>
          <button
            onClick={() => setActiveTemplate('newsletter')}
            className={`pb-3 px-4 text-sm font-bold transition-all border-b-2 ${
              activeTemplate === 'newsletter' 
                ? 'border-[#E17B5C] text-[#E17B5C]' 
                : 'border-transparent text-[#6B5744] hover:text-[#2D2721]'
            }`}
          >
            Uudiskiri (Newsletter)
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
          
          {/* EDITOR COLUMN */}
          <div className="overflow-y-auto pr-2 space-y-6">
            <WarmCard padding="lg">
              <h3 className="font-bold text-[#2D2721] mb-4 flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-[#E17B5C]" />
                Sisu muutmine
              </h3>
              
              {activeTemplate === 'welcome' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Kirja teema (Subject)</Label>
                    <Input 
                      value={welcomeData.subject} 
                      onChange={(e) => setWelcomeData({...welcomeData, subject: e.target.value})}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pealkiri</Label>
                    <Input 
                      value={welcomeData.title} 
                      onChange={(e) => setWelcomeData({...welcomeData, title: e.target.value})}
                      className="bg-white"
                    />
                    <p className="text-xs text-[#8B7355]">Kasuta {'{name}'} kasutaja nime asendamiseks.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Sisu tekst</Label>
                    <Textarea 
                      value={welcomeData.body} 
                      onChange={(e) => setWelcomeData({...welcomeData, body: e.target.value})}
                      className="bg-white min-h-[120px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nupu tekst</Label>
                    <Input 
                      value={welcomeData.buttonText} 
                      onChange={(e) => setWelcomeData({...welcomeData, buttonText: e.target.value})}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jalus (Footer)</Label>
                    <Input 
                      value={welcomeData.footerText} 
                      onChange={(e) => setWelcomeData({...welcomeData, footerText: e.target.value})}
                      className="bg-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Kirja teema (Subject)</Label>
                    <Input 
                      value={newsletterData.subject} 
                      onChange={(e) => setNewsletterData({...newsletterData, subject: e.target.value})}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pealkiri</Label>
                    <Input 
                      value={newsletterData.title} 
                      onChange={(e) => setNewsletterData({...newsletterData, title: e.target.value})}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sissejuhatus</Label>
                    <Textarea 
                      value={newsletterData.intro} 
                      onChange={(e) => setNewsletterData({...newsletterData, intro: e.target.value})}
                      className="bg-white min-h-[80px]"
                    />
                  </div>
                  <div className="p-4 bg-[#F8F6F1] rounded-xl border border-[#E7DCC7] space-y-4">
                    <h4 className="font-semibold text-[#2D2721] text-sm">Esiletõstetud plokk</h4>
                    <div className="space-y-2">
                      <Label>Ploki pealkiri</Label>
                      <Input 
                        value={newsletterData.highlightTitle} 
                        onChange={(e) => setNewsletterData({...newsletterData, highlightTitle: e.target.value})}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ploki sisu</Label>
                      <Textarea 
                        value={newsletterData.highlightText} 
                        onChange={(e) => setNewsletterData({...newsletterData, highlightText: e.target.value})}
                        className="bg-white min-h-[80px]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Nupu tekst</Label>
                    <Input 
                      value={newsletterData.buttonText} 
                      onChange={(e) => setNewsletterData({...newsletterData, buttonText: e.target.value})}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jalus (Footer)</Label>
                    <Input 
                      value={newsletterData.footerText} 
                      onChange={(e) => setNewsletterData({...newsletterData, footerText: e.target.value})}
                      className="bg-white"
                    />
                  </div>
                </div>
              )}
            </WarmCard>
            
            <WarmCard padding="lg">
                <h3 className="font-bold text-[#2D2721] mb-2 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-[#9DB5A5]" />
                    Stiili juhised
                </h3>
                <p className="text-sm text-[#6B5744] mb-4">
                    Meie kirjad kasutavad automaatselt platvormi brändingut:
                </p>
                <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-[#FAF7F2] border border-[#E7DCC7] rounded"></div>
                        <span>Taust: Soe Beež</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-[#2D2721] rounded"></div>
                        <span>Tekst: Tumehall</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-[#E17B5C] rounded"></div>
                        <span>Aktsent: Terrakota</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-[#9DB5A5] rounded"></div>
                        <span>Teisene: Salveiroheline</span>
                    </div>
                </div>
            </WarmCard>
          </div>

          {/* PREVIEW COLUMN */}
          <div className="bg-[#E5E5E5] rounded-xl p-8 overflow-y-auto flex justify-center border border-gray-200 shadow-inner">
             {/* Email Container (simulates 600px width) */}
             <div className="w-full max-w-[600px] bg-[#FAF7F2] min-h-[600px] shadow-2xl flex flex-col">
                
                {/* Email Header */}
                <div className="bg-[#FAF7F2] p-8 text-center border-b border-[#E7DCC7]">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-[#2D2721] text-white rounded-lg mb-4">
                        <span className="font-bold text-xl">L</span>
                    </div>
                    <h2 className="text-[#2D2721] font-bold text-lg tracking-wider uppercase">Logo Here</h2>
                </div>

                {/* Email Body */}
                <div className="flex-1 p-8 bg-white mx-6 -mt-4 shadow-sm rounded-t-lg">
                    {activeTemplate === 'welcome' ? (
                        <div className="space-y-6 text-center">
                            <h1 className="text-2xl font-serif text-[#2D2721] font-bold">
                                {welcomeData.title.replace('{name}', 'Mari')}
                            </h1>
                            <p className="text-[#6B5744] leading-relaxed">
                                {welcomeData.body}
                            </p>
                            <div className="pt-4 pb-4">
                                <a href="#" className="inline-block bg-[#E17B5C] text-white font-bold py-3 px-8 rounded-full hover:bg-[#D16B4C] transition-colors no-underline">
                                    {welcomeData.buttonText}
                                </a>
                            </div>
                            <div className="border-t border-[#FAF7F2] pt-6 mt-6">
                                <p className="text-sm text-[#8B7355] italic">
                                    "Meie eesmärk on pakkuda parimat kogemust."
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Hero Section */}
                            <div className="w-full h-48 bg-[#9DB5A5]/20 rounded-lg flex items-center justify-center text-[#9DB5A5]">
                                <ImageIcon className="w-12 h-12 opacity-50" />
                                <span className="ml-2">Päisepilt</span>
                            </div>

                            <div className="text-center space-y-4">
                                <h1 className="text-2xl font-serif text-[#2D2721] font-bold">
                                    {newsletterData.title}
                                </h1>
                                <p className="text-[#6B5744] leading-relaxed">
                                    {newsletterData.intro}
                                </p>
                            </div>

                            {/* Highlight Box */}
                            <div className="bg-[#FFF9ED] border border-[#FFC857]/30 p-6 rounded-xl text-center">
                                <h3 className="text-lg font-bold text-[#E17B5C] mb-2">{newsletterData.highlightTitle}</h3>
                                <p className="text-[#6B5744] mb-4 text-sm">{newsletterData.highlightText}</p>
                                <a href="#" className="inline-block bg-[#FFC857] text-[#2D2721] font-bold py-2 px-6 rounded-lg text-sm hover:bg-[#FFB627] transition-colors no-underline">
                                    {newsletterData.buttonText}
                                </a>
                            </div>

                            {/* Grid of items (Visual filler) */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="aspect-square bg-[#FAF7F2] rounded-lg"></div>
                                    <div className="h-4 bg-[#FAF7F2] rounded w-3/4"></div>
                                    <div className="h-3 bg-[#FAF7F2] rounded w-1/2"></div>
                                </div>
                                <div className="space-y-2">
                                    <div className="aspect-square bg-[#FAF7F2] rounded-lg"></div>
                                    <div className="h-4 bg-[#FAF7F2] rounded w-3/4"></div>
                                    <div className="h-3 bg-[#FAF7F2] rounded w-1/2"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Email Footer */}
                <div className="bg-[#2D2721] text-white/60 p-8 text-center text-xs space-y-4">
                    <div className="flex justify-center gap-4 text-white/80 mb-4">
                        <Facebook className="w-4 h-4 cursor-pointer hover:text-white" />
                        <Instagram className="w-4 h-4 cursor-pointer hover:text-white" />
                        <Twitter className="w-4 h-4 cursor-pointer hover:text-white" />
                        <Globe className="w-4 h-4 cursor-pointer hover:text-white" />
                    </div>
                    <p>
                        {activeTemplate === 'welcome' ? welcomeData.footerText : newsletterData.footerText}
                    </p>
                    <p className="opacity-50">
                        Tallinn, Estonia • info@platform.com
                    </p>
                </div>

             </div>
          </div>

        </div>
      </div>
    </div>
  );
}