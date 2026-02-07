import { useState } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { RichTextEditor } from '@app/components/RichTextEditor';
import { 
  Send, 
  Save, 
  Eye, 
  Users, 
  Mail, 
  Clock, 
  ChevronRight,
  Sparkles,
  LayoutTemplate,
  Braces,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Input } from '@app/components/ui/input';
import { Label } from '@app/components/ui/label';
import { Textarea } from '@app/components/ui/textarea';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@app/components/ui/select';

const TEMPLATES = [
  {
    id: 'welcome',
    name: 'Tervitus',
    subject: 'Tere tulemast GiftHubi perre!',
    content: `
      <h2>Tere {{Eesnimi}},</h2>
      <p>Meil on suur rõõm tervitada sind meie püsiklientide seas.</p>
      <p>Kingitusena anname sulle esimeselt ostult <strong>10% soodustust</strong> koodiga <code>TERE10</code>.</p>
      <p>Parimate soovidega,<br>Sinu Bränd</p>
    `
  },
  {
    id: 'sale',
    name: 'Allahindlus',
    subject: 'Suur Suveallahindlus algas!',
    content: `
      <h2>Hei {{Eesnimi}}!</h2>
      <p>Kauaoodatud suveallahindlus on lõpuks käes.</p>
      <div style="background-color: #FFF9ED; padding: 20px; text-align: center; margin: 20px 0;">
        <h3 style="color: #E17B5C; margin: 0;">Kuni -50% kõik tooted</h3>
      </div>
      <p>Kiirusta, sest parimad palad kaovad kiiresti!</p>
      <p><a href="#">Vaata pakkumisi</a></p>
    `
  },
  {
    id: 'voucher',
    name: 'Kinkekaardi meeldetuletus',
    subject: 'Sinu kinkekaart aegub peagi',
    content: `
      <p>Hea klient,</p>
      <p>Tuletame meelde, et sinu kinkekaart väärtuses <strong>{{Summa}}</strong> aegub 7 päeva pärast.</p>
      <p>Kasuta seda meie e-poes või esinduses.</p>
    `
  }
];

export function EmailComposer() {
  const [subject, setSubject] = useState('Eksklusiivne pakkumine just Sulle');
  const [recipientType, setRecipientType] = useState('all-subscribers');
  const [manualRecipients, setManualRecipients] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [content, setContent] = useState(`
    <h2>Tere hea klient,</h2>
    <p>Meil on hea meel teatada meie uuest suvekollektsioonist!</p>
    <p>Lojaalse kliendina saad sina <strong>varajase ligipääsu</strong>.</p>
    <blockquote>"Uus kollektsioon on inspireeritud Vahemere soojusest."</blockquote>
    <p>Vajuta allolevale lingile, et näha oma pakkumist:</p>
    <p><a href="#">Vaata pakkumist</a></p>
    <p>Parimate soovidega,<br>GiftHub Tiim</p>
  `);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  const handleSend = () => {
    let recipientCount = 0;
    
    switch (recipientType) {
      case 'all-subscribers': recipientCount = 1240; break;
      case 'vip': recipientCount = 156; break;
      case 'recent': recipientCount = 85; break;
      case 'manual': 
        recipientCount = manualRecipients.split(/[,\n]/).filter(e => e.trim().includes('@')).length;
        break;
    }

    if (recipientType === 'manual' && recipientCount === 0) {
      toast.error('Palun sisesta vähemalt üks kehtiv e-posti aadress');
      return;
    }

    const message = isScheduled 
       ? `Kampaania ajastatud: ${new Date(scheduleDate).toLocaleString('et-EE')} (${recipientCount} klienti)`
       : `Kiri saadetud edukalt ${recipientCount} kliendile!`;

    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Saadan kampaaniat...',
        success: message,
        error: 'Saatmine ebaõnnestus'
      }
    );
  };

  const handleSaveDraft = () => {
    toast.success('Mustand salvestatud');
  };

  const loadTemplate = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (template) {
       setSubject(template.subject);
       setContent(template.content);
       toast.success(`Mall "${template.name}" laetud`);
    }
  };

  const insertVariable = (variable: string) => {
     setContent(prev => prev + ` {{${variable}}} `);
     toast.info(`Muutuja {{${variable}}} lisatud`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-[#8B7355] mb-1">
            <span>Kampaaniad</span>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-[#2D2721]">Uus E-kiri</span>
          </div>
          <h1 className="text-3xl font-bold text-[#2D2721]">E-kirja Koostaja</h1>
        </div>
        <div className="flex gap-2">
          <WarmButton variant="outline" onClick={handleSaveDraft}>
            <Save className="h-4 w-4 mr-2" />
            Salvesta
          </WarmButton>
          <WarmButton onClick={handleSend} className="bg-[#2D2721] text-white hover:bg-[#3E362E] shadow-lg">
            <Send className="h-4 w-4 mr-2" />
            {isScheduled ? 'Ajasta Kampaania' : 'Saada Kampaania'}
          </WarmButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor Area */}
        <div className="lg:col-span-2 space-y-6">
          <WarmCard padding="lg">
            <div className="space-y-4 mb-6">
              
              {/* Template Selector & Variables */}
              <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-[#E7DCC7]">
                 <Select onValueChange={loadTemplate}>
                    <SelectTrigger className="w-[180px] bg-[#FAF7F2]">
                       <LayoutTemplate className="w-4 h-4 mr-2 text-[#8B7355]" />
                       <SelectValue placeholder="Vali mall" />
                    </SelectTrigger>
                    <SelectContent>
                       {TEMPLATES.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                       ))}
                    </SelectContent>
                 </Select>

                 <div className="h-6 w-px bg-[#E7DCC7]"></div>

                 <div className="flex gap-2">
                    <button onClick={() => insertVariable('Eesnimi')} className="px-2 py-1.5 text-xs font-medium bg-[#FFF9ED] text-[#E17B5C] border border-[#FFC857]/30 rounded hover:bg-[#FFE5B4] transition-colors flex items-center gap-1">
                       <Braces className="w-3 h-3" /> Eesnimi
                    </button>
                    <button onClick={() => insertVariable('Kupongi kood')} className="px-2 py-1.5 text-xs font-medium bg-[#FFF9ED] text-[#E17B5C] border border-[#FFC857]/30 rounded hover:bg-[#FFE5B4] transition-colors flex items-center gap-1">
                       <Braces className="w-3 h-3" /> Kood
                    </button>
                 </div>
              </div>

              <div>
                <Label>Teema</Label>
                <div className="relative mt-2">
                  <Input 
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)}
                    className="pl-10 text-lg font-medium h-12 border-[#E7DCC7] focus:border-[#FFC857]" 
                    placeholder="Sisesta kaasahaarav pealkiri..."
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8B7355]" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <Label>Sisu</Label>
              <div className="flex bg-[#F0EBE5] rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('edit')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    activeTab === 'edit' ? 'bg-white text-[#2D2721] shadow-sm' : 'text-[#6B5744] hover:text-[#2D2721]'
                  }`}
                >
                  Toimetaja
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    activeTab === 'preview' ? 'bg-white text-[#2D2721] shadow-sm' : 'text-[#6B5744] hover:text-[#2D2721]'
                  }`}
                >
                  Eelvaade
                </button>
              </div>
            </div>

            {activeTab === 'edit' ? (
              <RichTextEditor 
                content={content} 
                onChange={setContent} 
                placeholder="Alusta kirjutamist..."
              />
            ) : (
              <div className="border border-[rgba(139,115,85,0.1)] rounded-xl overflow-hidden bg-white min-h-[400px] shadow-inner">
                <div className="bg-[#F9F7F5] border-b border-[rgba(139,115,85,0.1)] p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-[#E17B5C]" />
                     <div className="w-3 h-3 rounded-full bg-[#FFC857]" />
                     <div className="w-3 h-3 rounded-full bg-[#9DB5A5]" />
                  </div>
                  <div className="text-xs text-[#8B7355] font-mono bg-white/50 px-3 py-1 rounded border border-[#E7DCC7]">
                    E-kirja Eelvaade
                  </div>
                </div>
                <div className="p-8 prose prose-warm max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
              </div>
            )}
          </WarmCard>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <WarmCard padding="lg">
            <h3 className="font-bold text-[#2D2721] mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#E17B5C]" />
              Sihtgrupp
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label className="text-xs mb-1.5 block text-[#6B5744] font-bold uppercase">Kellele saadame?</Label>
                <Select value={recipientType} onValueChange={setRecipientType}>
                  <SelectTrigger className="border-[#E7DCC7]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-subscribers">Kõik tellijad (1,240)</SelectItem>
                    <SelectItem value="vip">VIP Kliendid (156)</SelectItem>
                    <SelectItem value="recent">Hiljutised ostjad (30p)</SelectItem>
                    <SelectItem value="manual">Käsitsi sisestamine</SelectItem>
                  </SelectContent>
                </Select>

                {recipientType === 'manual' && (
                  <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                    <Label className="text-xs mb-1.5 block text-[#6B5744]">
                      E-posti aadressid (eralda komaga)
                    </Label>
                    <Textarea 
                      placeholder="klient1@naide.ee, klient2@naide.ee..." 
                      value={manualRecipients}
                      onChange={(e) => setManualRecipients(e.target.value)}
                      className="min-h-[100px] text-sm font-mono bg-white border-[#E7DCC7]"
                    />
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-[#8B7355]">
                        Mitu saajat korraga.
                      </p>
                      <p className="text-xs font-medium text-[#2D2721]">
                        {manualRecipients.split(/[,\n]/).filter(e => e.trim().includes('@')).length} kehtivat
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-xs mb-1.5 block text-[#6B5744] font-bold uppercase">Saatja Nimi</Label>
                <Input defaultValue="GiftHub Official" className="bg-white border-[#E7DCC7]" />
              </div>

              <div>
                <Label className="text-xs mb-1.5 block text-[#6B5744] font-bold uppercase">Vastuse aadress</Label>
                <Input defaultValue="hello@gifthub.eu" className="bg-white border-[#E7DCC7]" />
              </div>
            </div>
          </WarmCard>

          <WarmCard padding="lg" className={`transition-all duration-300 ${isScheduled ? 'bg-[#FFF9ED] border-[#FFC857]' : ''}`}>
            <h3 className="font-bold text-[#2D2721] mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#FFC857]" />
              Ajastamine
            </h3>
            
            <div className="space-y-4">
              <div 
                 onClick={() => setIsScheduled(false)}
                 className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${!isScheduled ? 'bg-white border-[#FFC857] shadow-sm' : 'border-transparent hover:bg-[#FAF7F2]'}`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${!isScheduled ? 'border-[#FFC857]' : 'border-[#E7DCC7]'}`}>
                   {!isScheduled && <div className="w-2 h-2 bg-[#FFC857] rounded-full"></div>}
                </div>
                <span className={`text-sm font-medium ${!isScheduled ? 'text-[#2D2721]' : 'text-[#6B5744]'}`}>Saada kohe</span>
              </div>

              <div 
                 onClick={() => setIsScheduled(true)}
                 className={`flex flex-col gap-2 p-3 rounded-lg cursor-pointer transition-colors border ${isScheduled ? 'bg-white border-[#FFC857] shadow-sm' : 'border-transparent hover:bg-[#FAF7F2]'}`}
              >
                <div className="flex items-center gap-3">
                   <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isScheduled ? 'border-[#FFC857]' : 'border-[#E7DCC7]'}`}>
                      {isScheduled && <div className="w-2 h-2 bg-[#FFC857] rounded-full"></div>}
                   </div>
                   <span className={`text-sm font-medium ${isScheduled ? 'text-[#2D2721]' : 'text-[#6B5744]'}`}>Ajasta hilisemaks</span>
                </div>
                
                {isScheduled && (
                   <div className="pl-7 animate-in slide-in-from-top-1">
                      <Input 
                         type="datetime-local" 
                         value={scheduleDate}
                         onChange={(e) => setScheduleDate(e.target.value)}
                         className="bg-[#FAF7F2] border-[#E7DCC7] text-sm h-9"
                      />
                   </div>
                )}
              </div>
            </div>
          </WarmCard>

          <WarmCard padding="lg" gradient>
            <div className="flex gap-3">
              <div className="p-2 bg-white/30 rounded-lg h-fit">
                <Sparkles className="h-5 w-5 text-[#2D2721]" />
              </div>
              <div>
                <h4 className="font-bold text-[#2D2721] text-sm">Pro Vihje</h4>
                <p className="text-xs text-[#6B5744] mt-1 leading-relaxed">
                  Personaliseeritud teemaread (nt kasutades eesnime) avatakse 26% tõenäolisemalt!
                </p>
              </div>
            </div>
          </WarmCard>
        </div>
      </div>
    </div>
  );
}