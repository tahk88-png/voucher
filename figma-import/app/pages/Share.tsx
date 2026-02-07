import { copyToClipboard } from '@/app/utils/clipboard';
import { useState } from 'react';
import { WarmCard } from '@/app/components/WarmCard';
import { WarmButton } from '@/app/components/WarmButton';
import { useBonusTracking } from '@/app/contexts/BonusTracking';
import { 
  Share2, 
  Copy, 
  Mail,
  MessageCircle,
  Facebook,
  Twitter,
  Linkedin,
  QrCode,
  Link as LinkIcon,
  Check,
  Send,
  Instagram,
  Hash,
  MessageSquare,
  Download
} from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/tabs';
import { toast } from 'sonner';
import { QRCodeDesigner } from '@/app/components/QRCodeDesigner';
import { BulkEmailSender } from '@/app/components/BulkEmailSender';

type ShareItem = {
  id: string;
  type: 'voucher' | 'campaign' | 'gift-card' | 'event';
  name: string;
  code?: string;
  url: string;
};

export function Share() {
  const [selectedItem, setSelectedItem] = useState<ShareItem>({
    id: 'summer-sale',
    type: 'voucher',
    name: 'Summer Sale 25% Off',
    code: 'SUMMER25',
    url: 'https://vouchers.app/v/summer-sale',
  });

  const [copied, setCopied] = useState(false);
  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: `Check out: ${selectedItem.name}`,
    message: `I thought you might be interested in this:\n\n${selectedItem.name}\n\nVisit: ${selectedItem.url}`,
  });

  const availableItems: ShareItem[] = [
    {
      id: 'summer-sale',
      type: 'voucher',
      name: 'Summer Sale 25% Off',
      code: 'SUMMER25',
      url: 'https://vouchers.app/v/summer-sale',
    },
    {
      id: 'winter-campaign',
      type: 'campaign',
      name: 'Winter Collection Launch',
      url: 'https://vouchers.app/c/winter-collection',
    },
    {
      id: 'gift-50',
      type: 'gift-card',
      name: 'Gift Card €50',
      url: 'https://vouchers.app/g/gift-50',
    },
    {
      id: 'fashion-show',
      type: 'event',
      name: 'VIP Fashion Show',
      url: 'https://vouchers.app/e/fashion-show',
    },
  ];

  const handleCopyLink = async () => {
    const success = await copyToClipboard(selectedItem.url);
    if (success) {
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareSocial = async (platform: string) => {
    const text = `Check out: ${selectedItem.name}`;
    let url = '';
    
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(selectedItem.url)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(selectedItem.url)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(selectedItem.url)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + selectedItem.url)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(selectedItem.url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'pinterest':
        url = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(selectedItem.url)}&description=${encodeURIComponent(text)}`;
        break;
      case 'reddit':
        url = `https://reddit.com/submit?url=${encodeURIComponent(selectedItem.url)}&title=${encodeURIComponent(text)}`;
        break;
      case 'tiktok':
        // TikTok doesn't have direct web sharing, copy link instead
        const tiktokSuccess = await copyToClipboard(selectedItem.url);
        if (tiktokSuccess) {
          toast.success('Link copied! Share it on TikTok app');
        }
        return;
      case 'snapchat':
        url = `https://www.snapchat.com/share?url=${encodeURIComponent(selectedItem.url)}`;
        break;
      case 'discord':
        // Discord doesn't have direct web sharing, copy link instead
        const discordSuccess = await copyToClipboard(selectedItem.url);
        if (discordSuccess) {
          toast.success('Link copied! Share it in Discord');
        }
        return;
      case 'sms':
        url = `sms:?&body=${encodeURIComponent(text + ' ' + selectedItem.url)}`;
        window.location.href = url;
        toast.success('Opening SMS app...');
        return;
      case 'messenger':
        url = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(selectedItem.url)}&app_id=YOUR_APP_ID`;
        break;
      case 'instagram':
        // Instagram doesn't have direct web sharing, copy link instead
        const instagramSuccess = await copyToClipboard(selectedItem.url);
        if (instagramSuccess) {
          toast.success('Link copied! Share it on Instagram Story');
        }
        return;
    }
    
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
      toast.success(`Sharing on ${platform}...`);
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('qr-code');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        
        const downloadLink = document.createElement('a');
        downloadLink.download = `${selectedItem.id}-qr-code.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        
        toast.success('QR code downloaded!');
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#2D2721]">Share & Distribute</h1>
        <p className="text-[#6B5744] mt-1">Share your campaigns across multiple channels</p>
      </div>

      {/* Top Row: Item Selection + Copy Link */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Item Selection */}
        <WarmCard padding="lg">
          <h2 className="text-lg font-semibold text-[#2D2721] mb-4">Select Item to Share</h2>
          <div className="space-y-2">
            {availableItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`w-full p-3 rounded-lg text-left transition-all ${
                  selectedItem.id === item.id
                    ? 'bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-white shadow-warm'
                    : 'bg-[#FFF9ED] hover:bg-[#FFE5B4] text-[#2D2721]'
                }`}
              >
                <div className="font-medium">{item.name}</div>
                <div className={`text-xs ${selectedItem.id === item.id ? 'text-white/80' : 'text-[#8B7355]'} capitalize`}>
                  {item.type}
                </div>
              </button>
            ))}
          </div>
        </WarmCard>

        {/* Copy Link */}
        <WarmCard padding="lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center">
              <LinkIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-[#2D2721]">Share Link</h3>
              <p className="text-sm text-[#8B7355]">Copy and paste anywhere</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              value={selectedItem.url}
              readOnly
              className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-[#FFF9ED] h-12 font-mono"
            />
            <WarmButton onClick={handleCopyLink}>
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </WarmButton>
          </div>
        </WarmCard>
      </div>

      {/* Social Media - Full Width */}
      <WarmCard padding="lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center">
            <Share2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-[#2D2721]">Social Media</h3>
            <p className="text-sm text-[#8B7355]">Share on your favorite platforms</p>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
          <WarmButton
            variant="outline"
            onClick={() => handleShareSocial('facebook')}
            className="flex-col h-auto py-4"
          >
            <Facebook className="h-6 w-6 mb-2 text-[#1877F2]" />
            <span className="text-xs">Facebook</span>
          </WarmButton>
          <WarmButton
            variant="outline"
            onClick={() => handleShareSocial('twitter')}
            className="flex-col h-auto py-4"
          >
            <Twitter className="h-6 w-6 mb-2 text-[#1DA1F2]" />
            <span className="text-xs">Twitter</span>
          </WarmButton>
          <WarmButton
            variant="outline"
            onClick={() => handleShareSocial('linkedin')}
            className="flex-col h-auto py-4"
          >
            <Linkedin className="h-6 w-6 mb-2 text-[#0A66C2]" />
            <span className="text-xs">LinkedIn</span>
          </WarmButton>
          <WarmButton
            variant="outline"
            onClick={() => handleShareSocial('whatsapp')}
            className="flex-col h-auto py-4"
          >
            <MessageCircle className="h-6 w-6 mb-2 text-[#25D366]" />
            <span className="text-xs">WhatsApp</span>
          </WarmButton>
          <WarmButton
            variant="outline"
            onClick={() => handleShareSocial('telegram')}
            className="flex-col h-auto py-4"
          >
            <MessageSquare className="h-6 w-6 mb-2 text-[#0088CC]" />
            <span className="text-xs">Telegram</span>
          </WarmButton>
          <WarmButton
            variant="outline"
            onClick={() => handleShareSocial('pinterest')}
            className="flex-col h-auto py-4"
          >
            <Hash className="h-6 w-6 mb-2 text-[#E60023]" />
            <span className="text-xs">Pinterest</span>
          </WarmButton>
          <WarmButton
            variant="outline"
            onClick={() => handleShareSocial('reddit')}
            className="flex-col h-auto py-4"
          >
            <MessageSquare className="h-6 w-6 mb-2 text-[#FF4500]" />
            <span className="text-xs">Reddit</span>
          </WarmButton>
          <WarmButton
            variant="outline"
            onClick={() => handleShareSocial('tiktok')}
            className="flex-col h-auto py-4"
          >
            <MessageSquare className="h-6 w-6 mb-2 text-[#FF0050]" />
            <span className="text-xs">TikTok</span>
          </WarmButton>
          <WarmButton
            variant="outline"
            onClick={() => handleShareSocial('snapchat')}
            className="flex-col h-auto py-4"
          >
            <MessageSquare className="h-6 w-6 mb-2 text-[#FFFC00]" />
            <span className="text-xs">Snapchat</span>
          </WarmButton>
          <WarmButton
            variant="outline"
            onClick={() => handleShareSocial('discord')}
            className="flex-col h-auto py-4"
          >
            <MessageSquare className="h-6 w-6 mb-2 text-[#5865F2]" />
            <span className="text-xs">Discord</span>
          </WarmButton>
          <WarmButton
            variant="outline"
            onClick={() => handleShareSocial('sms')}
            className="flex-col h-auto py-4"
          >
            <MessageSquare className="h-6 w-6 mb-2 text-[#FF0000]" />
            <span className="text-xs">SMS</span>
          </WarmButton>
          <WarmButton
            variant="outline"
            onClick={() => handleShareSocial('messenger')}
            className="flex-col h-auto py-4"
          >
            <MessageSquare className="h-6 w-6 mb-2 text-[#0084FF]" />
            <span className="text-xs">Messenger</span>
          </WarmButton>
          <WarmButton
            variant="outline"
            onClick={() => handleShareSocial('instagram')}
            className="flex-col h-auto py-4"
          >
            <Instagram className="h-6 w-6 mb-2 text-[#E1306C]" />
            <span className="text-xs">Instagram</span>
          </WarmButton>
        </div>
      </WarmCard>

      {/* Bottom Row: Email + QR Code */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email */}
        <WarmCard padding="lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E17B5C] to-[#D16B4C] flex items-center justify-center">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-[#2D2721]">Bulk Email Sender</h3>
              <p className="text-sm text-[#8B7355]">Send to multiple recipients with CSV import</p>
            </div>
          </div>
          <BulkEmailSender
            defaultSubject={`Check out: ${selectedItem.name}`}
            defaultMessage={`I thought you might be interested in this:\\n\\n${selectedItem.name}\\n\\nVisit: ${selectedItem.url}`}
          />
        </WarmCard>

        {/* QR Code Designer */}
        <WarmCard padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F5C98E] to-[#E5B97E] flex items-center justify-center">
              <QrCode className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-[#2D2721]">QR Code Designer</h3>
              <p className="text-sm text-[#8B7355]">Customize and download your QR code</p>
            </div>
          </div>
          <QRCodeDesigner value={selectedItem.url} />
        </WarmCard>
      </div>

      {/* Tips */}
      <WarmCard padding="lg" className="bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4]">
        <h3 className="text-lg font-semibold text-[#2D2721] mb-3">Sharing Tips</h3>
        <ul className="space-y-2 text-sm text-[#6B5744]">
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 text-[#9DB5A5] flex-shrink-0 mt-0.5" />
            <span><strong>Social Media:</strong> Post during peak hours (lunch time & evenings) for maximum engagement</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 text-[#9DB5A5] flex-shrink-0 mt-0.5" />
            <span><strong>Email:</strong> Personalize your message and include a clear call-to-action</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 text-[#9DB5A5] flex-shrink-0 mt-0.5" />
            <span><strong>QR Codes:</strong> Print and display in-store for easy access by customers</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 text-[#9DB5A5] flex-shrink-0 mt-0.5" />
            <span><strong>Link Sharing:</strong> Track performance by creating unique links for different channels</span>
          </li>
        </ul>
      </WarmCard>
    </div>
  );
}