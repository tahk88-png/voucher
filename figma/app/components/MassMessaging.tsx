import { useState } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { Input } from '@app/components/ui/input';
import { Label } from '@app/components/ui/label';
import { Textarea } from '@app/components/ui/textarea';
import { Progress } from '@app/components/ui/progress';
import {
  Mail,
  MessageSquare,
  Bell,
  Sparkles,
  Send,
  CheckCircle2,
  Users,
  Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';

interface MassMessagingProps {
  userSegments: { name: string; count: number }[];
}

export function MassMessaging({ userSegments }: MassMessagingProps) {
  const [activeTab, setActiveTab] = useState<'email' | 'sms' | 'push'>('email');
  const [selectedSegments, setSelectedSegments] = useState<string[]>(['All Users']);
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);

  const [emailContent, setEmailContent] = useState({
    subject: '',
    body: '',
  });

  const [smsContent, setSmsContent] = useState({
    message: '',
  });

  const [pushContent, setPushContent] = useState({
    title: '',
    body: '',
    action: '',
  });

  const toggleSegment = (segmentName: string) => {
    setSelectedSegments(prev =>
      prev.includes(segmentName)
        ? prev.filter(s => s !== segmentName)
        : [...prev, segmentName]
    );
  };

  const selectedRecipientsCount = selectedSegments.reduce((sum, segmentName) => {
    const segment = userSegments.find(s => s.name === segmentName);
    return sum + (segment?.count || 0);
  }, 0);

  const sendMessage = async () => {
    let content = '';
    if (activeTab === 'email' && !emailContent.subject) {
      toast.error('Please enter email subject');
      return;
    }
    if (activeTab === 'sms' && !smsContent.message) {
      toast.error('Please enter SMS message');
      return;
    }
    if (activeTab === 'push' && !pushContent.title) {
      toast.error('Please enter notification title');
      return;
    }

    setIsSending(true);
    setSendingProgress(0);

    // Simulate sending
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setSendingProgress(i);
    }

    setIsSending(false);
    const messageType = activeTab === 'email' ? 'Email' : activeTab === 'sms' ? 'SMS' : 'Push notification';
    toast.success(`${messageType} sent to ${selectedRecipientsCount.toLocaleString()} recipients!`);
  };

  const smsCharCount = smsContent.message.length;
  const smsLimit = 160;

  return (
    <WarmCard padding="xl" className="border-2 border-[#FFC857]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-[18px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#2D2721]">Mass Messaging Center</h2>
          <p className="text-[#8B7355]">Send emails, SMS, and push notifications to users</p>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2 mb-6 p-1 bg-[#FFF9ED] rounded-[12px]">
        <button
          onClick={() => setActiveTab('email')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-[10px] font-semibold transition-all ${
            activeTab === 'email'
              ? 'bg-white text-[#2D2721] shadow-warm'
              : 'text-[#8B7355] hover:text-[#2D2721]'
          }`}
        >
          <Mail className="h-5 w-5" />
          <span>Email</span>
        </button>
        <button
          onClick={() => setActiveTab('sms')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-[10px] font-semibold transition-all ${
            activeTab === 'sms'
              ? 'bg-white text-[#2D2721] shadow-warm'
              : 'text-[#8B7355] hover:text-[#2D2721]'
          }`}
        >
          <MessageSquare className="h-5 w-5" />
          <span>SMS</span>
        </button>
        <button
          onClick={() => setActiveTab('push')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-[10px] font-semibold transition-all ${
            activeTab === 'push'
              ? 'bg-white text-[#2D2721] shadow-warm'
              : 'text-[#8B7355] hover:text-[#2D2721]'
          }`}
        >
          <Bell className="h-5 w-5" />
          <span>Push</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Form */}
        <div className="space-y-4">
          {/* Email Form */}
          {activeTab === 'email' && (
            <>
              <div>
                <Label htmlFor="email-subject">Email Subject *</Label>
                <Input
                  id="email-subject"
                  placeholder="Enter email subject"
                  value={emailContent.subject}
                  onChange={(e) => setEmailContent({ ...emailContent, subject: e.target.value })}
                  className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                />
              </div>
              <div>
                <Label htmlFor="email-body">Email Body *</Label>
                <Textarea
                  id="email-body"
                  placeholder="Enter email content..."
                  value={emailContent.body}
                  onChange={(e) => setEmailContent({ ...emailContent, body: e.target.value })}
                  className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white min-h-[200px]"
                />
              </div>
            </>
          )}

          {/* SMS Form */}
          {activeTab === 'sms' && (
            <>
              <div>
                <Label htmlFor="sms-message">SMS Message *</Label>
                <Textarea
                  id="sms-message"
                  placeholder="Enter SMS message (max 160 characters)..."
                  value={smsContent.message}
                  onChange={(e) => setSmsContent({ message: e.target.value.slice(0, 160) })}
                  className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white min-h-[150px]"
                  maxLength={160}
                />
                <div className={`text-sm mt-2 ${smsCharCount > 140 ? 'text-[#E17B5C]' : 'text-[#8B7355]'}`}>
                  {smsCharCount}/{smsLimit} characters
                </div>
              </div>
              <div className="p-4 rounded-lg bg-[#FFF9ED] border border-[rgba(139,115,85,0.1)]">
                <div className="text-xs font-semibold text-[#8B7355] mb-2 flex items-center gap-2">
                  <Lightbulb className="h-3.5 w-3.5 text-[#FFC857]" />
                  SMS Best Practices:
                </div>
                <ul className="text-xs text-[#6B5744] space-y-1">
                  <li>Keep it short and clear</li>
                  <li>Include a clear call-to-action</li>
                  <li>Add opt-out instructions (Reply STOP)</li>
                  <li>Avoid special characters that may not display correctly</li>
                </ul>
              </div>
            </>
          )}

          {/* Push Notification Form */}
          {activeTab === 'push' && (
            <>
              <div>
                <Label htmlFor="push-title">Notification Title *</Label>
                <Input
                  id="push-title"
                  placeholder="Enter notification title"
                  value={pushContent.title}
                  onChange={(e) => setPushContent({ ...pushContent, title: e.target.value })}
                  className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                />
              </div>
              <div>
                <Label htmlFor="push-body">Notification Body *</Label>
                <Textarea
                  id="push-body"
                  placeholder="Enter notification content..."
                  value={pushContent.body}
                  onChange={(e) => setPushContent({ ...pushContent, body: e.target.value })}
                  className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white min-h-[120px]"
                />
              </div>
              <div>
                <Label htmlFor="push-action">Action URL (Optional)</Label>
                <Input
                  id="push-action"
                  placeholder="e.g., /campaigns/special-offer"
                  value={pushContent.action}
                  onChange={(e) => setPushContent({ ...pushContent, action: e.target.value })}
                  className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                />
              </div>
            </>
          )}

          <WarmButton
            onClick={sendMessage}
            disabled={isSending}
            className="w-full h-12"
          >
            {isSending ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-5 w-5 mr-2" />
                Send {activeTab === 'email' ? 'Email' : activeTab === 'sms' ? 'SMS' : 'Notification'}
              </>
            )}
          </WarmButton>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <Label>Preview</Label>
          
          {activeTab === 'email' && (
            <div className="space-y-3">
              {emailContent.subject ? (
                <>
                  <div className="p-4 rounded-lg bg-[#FFF9ED] border border-[rgba(139,115,85,0.1)]">
                    <div className="text-xs text-[#8B7355] mb-1">Subject:</div>
                    <div className="font-semibold text-[#2D2721]">{emailContent.subject}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-white border border-[rgba(139,115,85,0.1)] min-h-[200px]">
                    <div className="text-xs text-[#8B7355] mb-2">Body:</div>
                    <div className="text-sm text-[#2D2721] whitespace-pre-wrap">{emailContent.body || 'Email body will appear here...'}</div>
                  </div>
                </>
              ) : (
                <div className="h-[300px] rounded-lg bg-[#FFF9ED] border-2 border-dashed border-[rgba(139,115,85,0.2)] flex items-center justify-center">
                  <div className="text-center">
                    <Mail className="h-12 w-12 text-[#E5E5E5] mx-auto mb-3" />
                    <p className="text-sm text-[#8B7355]">Email preview will appear here</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sms' && (
            <div>
              {smsContent.message ? (
                <div className="max-w-[280px] mx-auto">
                  <div className="p-4 rounded-[20px] bg-[#9DB5A5] text-white shadow-lg">
                    <div className="text-xs opacity-70 mb-2">SMS Preview</div>
                    <div className="text-sm">{smsContent.message}</div>
                  </div>
                  <div className="text-xs text-center text-[#8B7355] mt-2">
                    This is how your SMS will appear on mobile devices
                  </div>
                </div>
              ) : (
                <div className="h-[300px] rounded-lg bg-[#FFF9ED] border-2 border-dashed border-[rgba(139,115,85,0.2)] flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-[#E5E5E5] mx-auto mb-3" />
                    <p className="text-sm text-[#8B7355]">SMS preview will appear here</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'push' && (
            <div>
              {pushContent.title ? (
                <div className="max-w-[350px] mx-auto">
                  <div className="p-4 rounded-[16px] bg-white border border-[rgba(139,115,85,0.2)] shadow-warm">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center flex-shrink-0">
                        <Bell className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[#2D2721] mb-1">{pushContent.title}</div>
                        <div className="text-sm text-[#6B5744]">{pushContent.body || 'Notification body...'}</div>
                      </div>
                    </div>
                    {pushContent.action && (
                      <div className="text-xs text-[#FFC857] font-semibold">Tap to open</div>
                    )}
                  </div>
                  <div className="text-xs text-center text-[#8B7355] mt-2">
                    This is how your push notification will appear
                  </div>
                </div>
              ) : (
                <div className="h-[300px] rounded-lg bg-[#FFF9ED] border-2 border-dashed border-[rgba(139,115,85,0.2)] flex items-center justify-center">
                  <div className="text-center">
                    <Bell className="h-12 w-12 text-[#E5E5E5] mx-auto mb-3" />
                    <p className="text-sm text-[#8B7355]">Push notification preview will appear here</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Audience Selection */}
      <div className="mt-6 pt-6 border-t border-[rgba(139,115,85,0.1)]">
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-5 w-5 text-[#6B5744]" />
          <h3 className="font-semibold text-[#2D2721]">Select Audience</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
          {userSegments.map((segment) => (
            <button
              key={segment.name}
              onClick={() => toggleSegment(segment.name)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                selectedSegments.includes(segment.name)
                  ? 'border-[#FFC857] bg-[#FFC857]/10'
                  : 'border-[rgba(139,115,85,0.1)] bg-white hover:border-[rgba(139,115,85,0.3)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  selectedSegments.includes(segment.name)
                    ? 'border-[#FFC857] bg-[#FFC857]'
                    : 'border-[rgba(139,115,85,0.3)]'
                }`}>
                  {selectedSegments.includes(segment.name) && (
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  )}
                </div>
              </div>
              <div className="text-xl font-bold text-[#2D2721] mb-1">{segment.count.toLocaleString()}</div>
              <div className="text-xs text-[#8B7355] truncate">{segment.name}</div>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4]">
          <div>
            <div className="text-sm text-[#8B7355] mb-1">Total Recipients</div>
            <div className="text-2xl font-bold text-[#2D2721]">{selectedRecipientsCount.toLocaleString()}</div>
          </div>
          {activeTab === 'sms' && (
            <div className="text-right">
              <div className="text-sm text-[#8B7355] mb-1">Estimated Cost</div>
              <div className="text-xl font-bold text-[#2D2721]">EUR {(selectedRecipientsCount * 0.05).toFixed(2)}</div>
              <div className="text-xs text-[#8B7355]">~EUR 0.05 per SMS</div>
            </div>
          )}
        </div>

        {isSending && (
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#6B5744]">Sending progress</span>
              <span className="font-medium text-[#2D2721]">{sendingProgress}%</span>
            </div>
            <Progress value={sendingProgress} className="h-2" />
          </div>
        )}
      </div>
    </WarmCard>
  );
}

