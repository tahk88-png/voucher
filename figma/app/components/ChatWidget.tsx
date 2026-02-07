import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import { WarmCard } from '@/figma/app/components/WarmCard';
import { WarmButton } from '@/figma/app/components/WarmButton';
import { Input } from '@/figma/app/components/ui/input';
import { useAdminSettings } from '@/figma/app/contexts/AdminSettings';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export function ChatWidget() {
  const { chatEnabled } = useAdminSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Tere! 👋 Kuidas saan sind aidata?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [hasResponded, setHasResponded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Hide widget if user has responded or if admin disabled it
  if (!chatEnabled || hasResponded) {
    return null;
  }

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setHasResponded(true);

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Tänan! Meie meeskond võtab sinuga peagi ühendust. 🙏',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 w-14 h-14 rounded-full bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] shadow-warm-lg hover:shadow-warm-xl transition-all flex items-center justify-center group z-50"
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-3 px-4 py-3 bg-white rounded-[16px] shadow-warm-lg hover:shadow-warm-xl transition-all border border-[rgba(139,115,85,0.1)]"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-[#2D2721] text-sm">Live Chat</div>
            <div className="text-xs text-[#8B7355]">Click to expand</div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 w-[360px] max-w-[calc(100vw-3rem)] z-50">
      <WarmCard padding="none" className="shadow-warm-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] rounded-t-[16px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-white">Live Chat</div>
              <div className="text-xs text-white/80">Vastame kiiresti</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Minimize chat"
            >
              <Minimize2 className="h-4 w-4 text-white" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close chat"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="h-[400px] overflow-y-auto p-4 bg-[#FEFCF8] space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-[12px] ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] text-white'
                    : 'bg-white border border-[rgba(139,115,85,0.1)] text-[#2D2721]'
                }`}
              >
                <div className="text-sm">{message.text}</div>
                <div
                  className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-white/70' : 'text-[#8B7355]'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString('et-EE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-[rgba(139,115,85,0.1)] rounded-b-[16px]">
          <div className="flex items-center gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Kirjuta oma sõnum..."
              className="flex-1"
            />
            <WarmButton
              onClick={handleSend}
              size="sm"
              disabled={!inputValue.trim()}
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </WarmButton>
          </div>
        </div>
      </WarmCard>
    </div>
  );
}
