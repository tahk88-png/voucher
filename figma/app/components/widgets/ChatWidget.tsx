import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, MinusCircle } from 'lucide-react';
import { useAdminSettings } from '@app/contexts/AdminSettings';
import { WarmButton } from '@app/components/WarmButton';

export function ChatWidget() {
  const { chatEnabled } = useAdminSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: 'Tere! Kuidas saame sind täna aidata?' }
  ]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!chatEnabled) return null;

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: inputText }]);
    const userText = inputText;
    setInputText('');

    // Simulate bot response
    setTimeout(() => {
      let response = "Aitäh kirjutamast! Meie klienditugi vastab esimesel võimalusel.";
      if (userText.toLowerCase().includes('hind') || userText.toLowerCase().includes('maksab')) {
        response = "Hinnad sõltuvad valitud paketist ja perioodist. Vaata täpsemalt toote lehelt.";
      } else if (userText.toLowerCase().includes('tarne')) {
        response = "Pakume Smartposti, Omniva ja kullerteenust. Tarne on tasuta ostudel üle 50€.";
      }
      setMessages(prev => [...prev, { role: 'bot', text: response }]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-4">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-[#E7DCC7] w-80 sm:w-96 overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-300">
          {/* Header */}
          <div className="bg-[#2D2721] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00D098] rounded-full border-2 border-[#2D2721]"></div>
              </div>
              <div>
                <h3 className="font-bold text-sm">Klienditugi</h3>
                <p className="text-xs text-white/60">Vastame tavaliselt 5 minutiga</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="h-80 overflow-y-auto p-4 bg-[#FAF7F2] space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-[#E17B5C] text-white rounded-br-sm' 
                      : 'bg-white text-[#2D2721] border border-[#E7DCC7] rounded-bl-sm shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-[#E7DCC7] flex gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Kirjuta siia..."
              className="flex-1 bg-[#FAF7F2] border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#E17B5C] focus:outline-none"
            />
            <button 
              onClick={handleSend}
              className="p-2 bg-[#2D2721] text-white rounded-xl hover:bg-[#3E362E] transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 bg-[#2D2721] hover:bg-[#3E362E] text-white p-4 rounded-full shadow-warm-lg transition-all hover:scale-105"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap font-bold">
            Küsi abi
          </span>
          <div className="absolute top-0 right-0 w-3 h-3 bg-[#E17B5C] rounded-full animate-pulse border-2 border-[#FAF7F2]"></div>
        </button>
      )}
    </div>
  );
}