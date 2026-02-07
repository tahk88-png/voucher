import { useState } from 'react';
import { WarmCard } from '@/figma/app/components/WarmCard';
import { WarmButton } from '@/figma/app/components/WarmButton';
import { Input } from '@/figma/app/components/ui/input';
import { Label } from '@/figma/app/components/ui/label';
import { Textarea } from '@/figma/app/components/ui/textarea';
import { Progress } from '@/figma/app/components/ui/progress';
import { 
  Upload, 
  X, 
  Users, 
  Send, 
  Calendar,
  FileSpreadsheet,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

type Recipient = {
  id: string;
  email: string;
  name?: string;
  status: 'pending' | 'sending' | 'sent' | 'failed';
};

type BulkEmailSenderProps = {
  defaultSubject?: string;
  defaultMessage?: string;
};

export function BulkEmailSender({ defaultSubject = '', defaultMessage = '' }: BulkEmailSenderProps) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultMessage);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');

  const addRecipient = () => {
    if (!emailInput) {
      toast.error('Please enter an email address');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (recipients.some(r => r.email === emailInput)) {
      toast.error('This email is already in the list');
      return;
    }

    const newRecipient: Recipient = {
      id: Date.now().toString(),
      email: emailInput,
      name: nameInput || undefined,
      status: 'pending',
    };

    setRecipients([...recipients, newRecipient]);
    setEmailInput('');
    setNameInput('');
    toast.success('Recipient added!');
  };

  const removeRecipient = (id: string) => {
    setRecipients(recipients.filter(r => r.id !== id));
    toast.success('Recipient removed');
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      // Skip header if exists
      const dataLines = lines[0].includes('email') || lines[0].includes('Email') 
        ? lines.slice(1) 
        : lines;

      const newRecipients: Recipient[] = [];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      dataLines.forEach((line, index) => {
        const parts = line.split(',').map(p => p.trim());
        const email = parts[0];
        const name = parts[1];

        if (email && emailRegex.test(email) && !recipients.some(r => r.email === email)) {
          newRecipients.push({
            id: `${Date.now()}-${index}`,
            email,
            name: name || undefined,
            status: 'pending',
          });
        }
      });

      if (newRecipients.length > 0) {
        setRecipients([...recipients, ...newRecipients]);
        toast.success(`${newRecipients.length} recipients added from CSV!`);
      } else {
        toast.error('No valid emails found in CSV');
      }
    };

    reader.readAsText(file);
  };

  const downloadCSVTemplate = () => {
    const csvContent = 'email,name\nexample1@email.com,John Doe\nexample2@email.com,Jane Smith';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'email-template.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded!');
  };

  const sendBulkEmails = async () => {
    if (recipients.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }

    if (!subject || !message) {
      toast.error('Please fill in subject and message');
      return;
    }

    setIsSending(true);
    setSendingProgress(0);

    // Simulate sending emails
    for (let i = 0; i < recipients.length; i++) {
      setRecipients(prev => 
        prev.map((r, index) => 
          index === i ? { ...r, status: 'sending' } : r
        )
      );

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulate 95% success rate
      const success = Math.random() > 0.05;

      setRecipients(prev => 
        prev.map((r, index) => 
          index === i ? { ...r, status: success ? 'sent' : 'failed' } : r
        )
      );

      setSendingProgress(((i + 1) / recipients.length) * 100);
    }

    setIsSending(false);
    toast.success('Bulk email sending completed!');
  };

  const scheduleSend = () => {
    if (!scheduleDate) {
      toast.error('Please select a date and time');
      return;
    }

    toast.success(`Email scheduled for ${new Date(scheduleDate).toLocaleString()}!`);
  };

  const sentCount = recipients.filter(r => r.status === 'sent').length;
  const failedCount = recipients.filter(r => r.status === 'failed').length;
  const pendingCount = recipients.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Recipients Management */}
      <WarmCard padding="lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-[#2D2721]">Recipients</h3>
              <p className="text-sm text-[#8B7355]">{recipients.length} recipients added</p>
            </div>
          </div>
          <div className="flex gap-2">
            <WarmButton
              variant="outline"
              size="sm"
              onClick={downloadCSVTemplate}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Download Template
            </WarmButton>
            <label htmlFor="csv-upload">
              <div 
                className="inline-flex items-center justify-center font-medium transition-all duration-200 shadow-warm px-4 py-2 text-sm rounded-[12px] bg-transparent text-[#2D2721] border-2 border-[#FFC857] hover:bg-[#FFF9ED] cursor-pointer"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </div>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Add Recipients Manually */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <Input
            placeholder="Email address *"
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
            className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-11"
          />
          <Input
            placeholder="Name (optional)"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
            className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-11"
          />
          <WarmButton onClick={addRecipient} className="h-11">
            <Plus className="h-4 w-4 mr-2" />
            Add Recipient
          </WarmButton>
        </div>

        {/* Recipients List */}
        {recipients.length > 0 && (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {recipients.map((recipient) => (
              <div
                key={recipient.id}
                className="flex items-center justify-between p-3 rounded-lg bg-[#FFF9ED] border border-[rgba(139,115,85,0.1)]"
              >
                <div className="flex items-center gap-3 flex-1">
                  {recipient.status === 'sent' && (
                    <CheckCircle2 className="h-5 w-5 text-[#9DB5A5]" />
                  )}
                  {recipient.status === 'failed' && (
                    <AlertCircle className="h-5 w-5 text-[#E17B5C]" />
                  )}
                  {recipient.status === 'sending' && (
                    <div className="h-5 w-5 rounded-full border-2 border-[#FFC857] border-t-transparent animate-spin" />
                  )}
                  {recipient.status === 'pending' && (
                    <div className="h-5 w-5 rounded-full bg-[#E5E5E5]" />
                  )}
                  <div>
                    <div className="font-medium text-[#2D2721]">{recipient.email}</div>
                    {recipient.name && (
                      <div className="text-xs text-[#8B7355]">{recipient.name}</div>
                    )}
                  </div>
                </div>
                {recipient.status === 'pending' && (
                  <button
                    onClick={() => removeRecipient(recipient.id)}
                    className="p-2 rounded-lg hover:bg-[#FEE2E2] text-[#E17B5C] transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                {recipient.status === 'sent' && (
                  <span className="text-xs font-medium text-[#9DB5A5]">Sent</span>
                )}
                {recipient.status === 'failed' && (
                  <span className="text-xs font-medium text-[#E17B5C]">Failed</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {(sentCount > 0 || failedCount > 0) && (
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[rgba(139,115,85,0.1)]">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#9DB5A5]">{sentCount}</div>
              <div className="text-xs text-[#8B7355]">Sent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#E17B5C]">{failedCount}</div>
              <div className="text-xs text-[#8B7355]">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#6B5744]">{pendingCount}</div>
              <div className="text-xs text-[#8B7355]">Pending</div>
            </div>
          </div>
        )}
      </WarmCard>

      {/* Email Content */}
      <WarmCard padding="lg">
        <h3 className="font-semibold text-[#2D2721] mb-4">Email Content</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="bulk-subject">Subject *</Label>
            <Input
              id="bulk-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
            />
          </div>
          <div>
            <Label htmlFor="bulk-message">Message *</Label>
            <Textarea
              id="bulk-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your email message..."
              className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white min-h-[200px]"
            />
            <p className="text-xs text-[#8B7355] mt-2">
              Use {'{{name}}'} to personalize with recipient name
            </p>
          </div>
        </div>
      </WarmCard>

      {/* Send Options */}
      <WarmCard padding="lg">
        <h3 className="font-semibold text-[#2D2721] mb-4">Send Options</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Send Now */}
          <div>
            <WarmButton
              onClick={sendBulkEmails}
              disabled={isSending || recipients.length === 0}
              className="w-full h-14"
            >
              <Send className="h-5 w-5 mr-2" />
              {isSending ? 'Sending...' : `Send to ${recipients.length} Recipients`}
            </WarmButton>
          </div>

          {/* Schedule Send */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-14"
              />
              <WarmButton
                variant="outline"
                onClick={scheduleSend}
                disabled={!scheduleDate || recipients.length === 0}
                className="h-14"
              >
                <Calendar className="h-5 w-5" />
              </WarmButton>
            </div>
            <p className="text-xs text-[#8B7355]">Schedule for later</p>
          </div>
        </div>

        {/* Progress */}
        {isSending && (
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#6B5744]">Sending progress</span>
              <span className="font-medium text-[#2D2721]">{Math.round(sendingProgress)}%</span>
            </div>
            <Progress value={sendingProgress} className="h-2" />
          </div>
        )}
      </WarmCard>

      {/* Tips */}
      <WarmCard padding="md" className="bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4]">
        <h4 className="font-semibold text-[#2D2721] mb-2 text-sm">Bulk Email Tips</h4>
        <ul className="space-y-1 text-xs text-[#6B5744]">
          <li>• CSV format: email,name (one recipient per line)</li>
          <li>• Personalize messages with {'{{name}}'} placeholder</li>
          <li>• Test with a small group before sending to all</li>
          <li>• Schedule sends during business hours for better engagement</li>
          <li>• Monitor failed sends and retry if needed</li>
        </ul>
      </WarmCard>
    </div>
  );
}