import { useState } from 'react';
import { WarmCard } from '@/app/components/WarmCard';
import { WarmButton } from '@/app/components/WarmButton';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Switch } from '@/app/components/ui/switch';
import { 
  Mail, 
  Edit3, 
  Eye, 
  Check, 
  Clock, 
  MessageSquare,
  Zap,
  Bold,
  Italic,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Trash2,
  RefreshCw,
  Save,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

// Pre-defined templates relevant for Rental & E-commerce
const TEMPLATES = [
  { 
    id: 'order_conf', 
    name: 'Tellimuse kinnitus', 
    subject: 'Teie tellimus #{order_id} on kinnitatud', 
    active: true, 
    type: 'transactional',
    description: 'Saadetakse kohe pärast edukat ostu.',
    variables: ['{order_id}', '{client_name}', '{order_items}', '{total_amount}']
  },
  { 
    id: 'rental_start', 
    name: 'Rendi alguse meeldetuletus', 
    subject: 'Teie rent algab homme!', 
    active: true, 
    type: 'automation',
    description: 'Saadetakse 24h enne rendiperioodi algust.',
    variables: ['{client_name}', '{start_date}', '{pickup_location}']
  },
  { 
    id: 'rental_end', 
    name: 'Tagastuse meeldetuletus', 
    subject: 'Rendi tagastamine: {return_date}', 
    active: true, 
    type: 'automation',
    description: 'Saadetakse 24h enne rendi lõppu.',
    variables: ['{client_name}', '{return_date}', '{return_location}']
  },
  { 
    id: 'invoice', 
    name: 'Arve saatmine', 
    subject: 'Arve #{invoice_id} - Minu Pood', 
    active: true, 
    type: 'transactional',
    description: 'Saadetakse koos tellimuse kinnitusega või eraldi.',
    variables: ['{invoice_id}', '{client_name}', '{due_date}', '{amount}']
  },
  { 
    id: 'abandoned_cart', 
    name: 'Hüljatud ostukorv', 
    subject: 'Kas unustasite midagi ostukorvi?', 
    active: false, 
    type: 'marketing',
    description: 'Saadetakse 2h pärast ostukorvi hülgamist.',
    variables: ['{client_name}', '{cart_items}', '{recovery_link}']
  },
  { 
    id: 'feedback', 
    name: 'Tagasiside küsimine', 
    subject: 'Kuidas jäite rahule?', 
    active: false, 
    type: 'marketing',
    description: 'Saadetakse 3 päeva pärast tellimuse täitmist.',
    variables: ['{client_name}', '{order_id}']
  },
];

export function CommunicationHub() {
  const [activeTemplate, setActiveTemplate] = useState(TEMPLATES[0]);
  const [editMode, setEditMode] = useState(false);
  const [subject, setSubject] = useState(activeTemplate.subject);
  // Mock content state - in real app would come from template
  const [content, setContent] = useState(`Tere, {client_name}!

Täname tellimuse eest. Siin on teie tellimuse kinnitus.

Tellimus: #{order_id}
Summa: {total_amount}

Tooted:
{order_items}

Parimate soovidega,
Minu Pood`);

  const handleTemplateChange = (tmpl: any) => {
    setActiveTemplate(tmpl);
    setSubject(tmpl.subject);
    setEditMode(false);
    // Reset mock content based on type (simplified logic)
    if (tmpl.id === 'rental_start') {
       setContent(`Tere, {client_name}!

Tuletame meelde, et teie rendiperiood algab homme: {start_date}.
Ootame teid aadressil: {pickup_location}.

Palun võtke kaasa isikut tõendav dokument.`);
    } else if (tmpl.id === 'abandoned_cart') {
       setContent(`Tere, {client_name}!

Märkasime, et jätsite ostukorvi lõpetamata. Teie tooted ootavad teid!

Ostukorvi sisu:
{cart_items}

Jätka ostu siit: {recovery_link}`);
    } else {
       setContent(`Tere, {client_name}!

Täname tellimuse eest. Siin on teie tellimuse kinnitus.

Tellimus: #{order_id}
Summa: {total_amount}

Tooted:
{order_items}

Parimate soovidega,
Minu Pood`);
    }
  };

  const handleSave = () => {
    toast.success('Muudatused salvestatud!');
    setEditMode(false);
  };

  const handleSendTest = () => {
    toast.message('Testkiri saadetud', { description: `Saadetud aadressile: kaupmees@minupood.ee` });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#2D2721] mb-2">Teavitused ja E-kirjad</h2>
          <p className="text-[#6B5744]">Seadista automaatsed kirjad ja suhtlus kliendiga.</p>
        </div>
        <div className="flex gap-2">
           <WarmButton variant="outline" className="gap-2" onClick={handleSendTest}>
              <Send className="w-4 h-4" /> Saada testkiri
           </WarmButton>
           <WarmButton className="gap-2">
              <Plus className="w-4 h-4" /> Uus mall
           </WarmButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0 items-start">
         
         {/* Left: Template List */}
         <div className="lg:col-span-4 space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[calc(100vh-200px)]">
            <h3 className="font-bold text-[#2D2721] flex items-center gap-2 px-1">
               <Mail className="w-4 h-4" /> Aktiivsed mallid
            </h3>
            
            <div className="space-y-3">
               {TEMPLATES.map((tmpl) => (
                  <div 
                    key={tmpl.id}
                    onClick={() => handleTemplateChange(tmpl)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative ${
                       activeTemplate.id === tmpl.id 
                       ? 'bg-[#FFF9ED] border-[#FFC857] shadow-md' 
                       : 'bg-white border-[#E7DCC7] hover:border-[#FFC857] hover:bg-[#FAF7F2]'
                    }`}
                  >
                     <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-[#2D2721] text-sm">{tmpl.name}</span>
                        {tmpl.active && <span className="w-2 h-2 rounded-full bg-[#00D098] mt-1.5"></span>}
                     </div>
                     <div className="text-xs text-[#6B5744] opacity-80 mb-3 truncate pr-4">{tmpl.subject}</div>
                     
                     <div className="flex items-center justify-between">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded ${
                           tmpl.type === 'transactional' ? 'bg-[#E6F4EA] text-[#00D098]' : 
                           tmpl.type === 'marketing' ? 'bg-[#FFF9ED] text-[#E17B5C]' :
                           'bg-[#FAF7F2] text-[#8B7355]'
                        }`}>
                           {tmpl.type}
                        </span>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* Right: Editor Area */}
         <div className="lg:col-span-8 h-full">
            <WarmCard padding="lg" className="bg-white h-full min-h-[600px] flex flex-col shadow-sm border border-[#E7DCC7]">
               
               {/* Editor Header */}
               <div className="border-b border-[#FAF7F2] pb-6 mb-6">
                  <div className="flex items-center justify-between mb-6">
                     <div>
                        <h3 className="font-bold text-2xl text-[#2D2721] mb-1">{activeTemplate.name}</h3>
                        <p className="text-sm text-[#6B5744]">{activeTemplate.description}</p>
                     </div>
                     <div className="flex items-center gap-3 bg-[#FAF7F2] px-3 py-1.5 rounded-lg border border-[#E7DCC7]">
                        <span className="text-sm font-bold text-[#2D2721]">Staatus:</span>
                        <div className="flex items-center gap-2">
                           <Switch checked={activeTemplate.active} />
                           <span className={`text-sm ${activeTemplate.active ? 'text-[#00D098] font-bold' : 'text-[#6B5744]'}`}>
                              {activeTemplate.active ? 'Aktiivne' : 'Mitteaktiivne'}
                           </span>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="grid grid-cols-[80px_1fr] items-center gap-4">
                        <Label className="text-right text-[#8B7355]">Teema:</Label>
                        <Input 
                           value={subject} 
                           onChange={(e) => setSubject(e.target.value)}
                           className="bg-white border-[#E7DCC7] focus:border-[#FFC857] font-medium" 
                        />
                     </div>
                     
                     {/* Variables Helper */}
                     <div className="grid grid-cols-[80px_1fr] items-start gap-4">
                        <Label className="text-right text-[#8B7355] pt-1.5">Muutujad:</Label>
                        <div className="flex flex-wrap gap-2">
                           {activeTemplate.variables.map(v => (
                              <button 
                                 key={v}
                                 onClick={() => {
                                    setContent(content + ' ' + v);
                                    toast.info(`Lisatud muutuja: ${v}`);
                                 }}
                                 className="text-xs bg-[#FAF7F2] border border-[#E7DCC7] px-2 py-1 rounded hover:bg-[#FFF9ED] hover:border-[#FFC857] transition-colors text-[#6B5744] font-mono"
                              >
                                 {v}
                              </button>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>

               {/* Editor Toolbar */}
               <div className="flex items-center gap-1 mb-2 p-1 bg-[#FAF7F2] rounded-lg border border-[#E7DCC7] w-fit">
                  <button className="p-1.5 hover:bg-white rounded text-[#6B5744] hover:text-[#2D2721]" title="Bold"><Bold className="w-4 h-4" /></button>
                  <button className="p-1.5 hover:bg-white rounded text-[#6B5744] hover:text-[#2D2721]" title="Italic"><Italic className="w-4 h-4" /></button>
                  <div className="w-px h-4 bg-[#E7DCC7] mx-1"></div>
                  <button className="p-1.5 hover:bg-white rounded text-[#6B5744] hover:text-[#2D2721]" title="Link"><LinkIcon className="w-4 h-4" /></button>
                  <div className="w-px h-4 bg-[#E7DCC7] mx-1"></div>
                  <button className="p-1.5 hover:bg-white rounded text-[#6B5744] hover:text-[#2D2721]" title="Align Left"><AlignLeft className="w-4 h-4" /></button>
                  <button className="p-1.5 hover:bg-white rounded text-[#6B5744] hover:text-[#2D2721]" title="Align Center"><AlignCenter className="w-4 h-4" /></button>
               </div>

               {/* Content Area */}
               <div className="flex-1 relative">
                  <Textarea 
                     value={content}
                     onChange={(e) => setContent(e.target.value)}
                     className="w-full h-full min-h-[300px] p-6 font-mono text-sm leading-relaxed resize-none bg-[#FAFAFA] border-[#E7DCC7] focus:ring-[#FFC857]"
                     placeholder="Kirjuta oma e-maili sisu siia..."
                  />
                  {/* Visual Preview Overlay (toggleable in real app) */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur border border-[#E7DCC7] rounded-lg p-2 shadow-sm text-xs text-[#8B7355] pointer-events-none">
                     Eelvaade (Tekst)
                  </div>
               </div>

               {/* Actions Footer */}
               <div className="pt-6 mt-4 border-t border-[#FAF7F2] flex justify-between items-center">
                  <WarmButton variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                     <Trash2 className="w-4 h-4 mr-2" /> Taasta algseaded
                  </WarmButton>
                  <div className="flex gap-3">
                     <WarmButton variant="outline" onClick={() => setContent(content)}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Tühista
                     </WarmButton>
                     <WarmButton onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" /> Salvesta muudatused
                     </WarmButton>
                  </div>
               </div>

            </WarmCard>
         </div>

      </div>
    </div>
  );
}