import { useState } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { Input } from '@app/components/ui/input';
import { Label } from '@app/components/ui/label';
import { Switch } from '@app/components/ui/switch';
import { LanguageSelector } from '@app/components/LanguageSelector';
import { toast } from 'sonner';
import { useNavigate } from '@/lib/router-shim';
import { useLanguage } from '@app/contexts/LanguageContext';
import { 
  Bell,
  Mail,
  Smartphone,
  Globe,
  Clock,
  Shield,
  Key,
  Users,
  Code,
  Zap,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Plus,
  Trash2,
  Eye,
  Copy,
  ArrowLeft,
  Share2,
  Save
} from 'lucide-react';

export function AdvancedSettings() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const tr = (en: string, et: string) => (language === 'et' ? et : en);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success(tr('Advanced settings saved!', 'Taisustatud seaded salvestatud!'));
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <WarmButton
          variant="ghost"
          size="sm"
          onClick={() => navigate('/settings')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tr('Back to Settings', 'Tagasi seadetesse')}
        </WarmButton>
        <h1 className="text-3xl font-bold text-[#2D2721]">{tr('Advanced Settings', 'Taisustatud seaded')}</h1>
        <p className="text-[#6B5744] mt-1">{tr('Configure advanced features and integrations', 'Seadista keerukamad funktsioonid ja integratsioonid')}</p>
      </div>

      {/* Social Media Links */}
      <WarmCard padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center shadow-warm">
            <Share2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#2D2721]">{tr('Social Media Links', 'Sotsiaalmeedia lingid')}</h2>
            <p className="text-sm text-[#6B5744]">{tr('Connect your social profiles', 'Uhenda oma sotsiaalmeedia profiilid')}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Facebook */}
          <div className="space-y-2">
            <Label htmlFor="facebook" className="text-[#2D2721] font-medium flex items-center gap-2">
              <Facebook className="h-4 w-4 text-[#1877F2]" />
              Facebook
            </Label>
            <Input
              id="facebook"
              type="url"
              placeholder={tr('https://facebook.com/yourpage', 'https://facebook.com/sinuleht')}
              className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
            />
          </div>

          {/* Instagram */}
          <div className="space-y-2">
            <Label htmlFor="instagram" className="text-[#2D2721] font-medium flex items-center gap-2">
              <Instagram className="h-4 w-4 text-[#E1306C]" />
              Instagram
            </Label>
            <Input
              id="instagram"
              type="url"
              placeholder={tr('https://instagram.com/yourprofile', 'https://instagram.com/sinuprofiil')}
              className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
            />
          </div>

          {/* Twitter */}
          <div className="space-y-2">
            <Label htmlFor="twitter" className="text-[#2D2721] font-medium flex items-center gap-2">
              <Twitter className="h-4 w-4 text-[#1DA1F2]" />
              Twitter / X
            </Label>
            <Input
              id="twitter"
              type="url"
              placeholder={tr('https://twitter.com/yourhandle', 'https://twitter.com/sinukasutaja')}
              className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
            />
          </div>

          {/* LinkedIn */}
          <div className="space-y-2">
            <Label htmlFor="linkedin" className="text-[#2D2721] font-medium flex items-center gap-2">
              <Linkedin className="h-4 w-4 text-[#0A66C2]" />
              LinkedIn
            </Label>
            <Input
              id="linkedin"
              type="url"
              placeholder={tr('https://linkedin.com/company/yourcompany', 'https://linkedin.com/company/sinuettevote')}
              className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
            />
          </div>

          {/* YouTube */}
          <div className="space-y-2">
            <Label htmlFor="youtube" className="text-[#2D2721] font-medium flex items-center gap-2">
              <Youtube className="h-4 w-4 text-[#FF0000]" />
              YouTube
            </Label>
            <Input
              id="youtube"
              type="url"
              placeholder={tr('https://youtube.com/@yourchannel', 'https://youtube.com/@sinukanal')}
              className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
            />
          </div>
        </div>
      </WarmCard>

      {/* Business Hours */}
      <WarmCard padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E17B5C] to-[#D16B4C] flex items-center justify-center shadow-warm">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#2D2721]">{tr('Business Hours', 'Lahtiolekuajad')}</h2>
            <p className="text-sm text-[#6B5744]">{tr('Set your operating hours', 'Määra oma lahtiolekuajad')}</p>
          </div>
        </div>

        <div className="space-y-3">
          {(language === 'et'
            ? ['Esmaspaev', 'Teisipaev', 'Kolmapaev', 'Neljapaev', 'Reede', 'Laupaev', 'Puhapaev']
            : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
          ).map((day, idx) => (
            <div key={day} className="flex items-center gap-4">
              <div className="flex items-center gap-3 w-32">
                <Switch id={`${day}-enabled`} defaultChecked={idx < 5} />
                <Label htmlFor={`${day}-enabled`} className="text-sm font-medium text-[#2D2721] cursor-pointer">
                  {day}
                </Label>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Input
                  type="time"
                  defaultValue={idx < 5 ? "09:00" : "10:00"}
                  className="rounded-[10px] border-[rgba(139,115,85,0.2)] bg-white h-10"
                  disabled={idx >= 5}
                />
                <span className="text-[#8B7355]">{tr('to', 'kuni')}</span>
                <Input
                  type="time"
                  defaultValue={idx < 5 ? "18:00" : "16:00"}
                  className="rounded-[10px] border-[rgba(139,115,85,0.2)] bg-white h-10"
                  disabled={idx >= 5}
                />
              </div>
            </div>
          ))}
        </div>
      </WarmCard>

      {/* Notification Settings */}
      <WarmCard padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
            <Bell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#2D2721]">{tr('Notification Preferences', 'Teavituste eelistused')}</h2>
            <p className="text-sm text-[#6B5744]">{tr('Choose how you want to be notified', 'Vali, kuidas soovid teavitusi saada')}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Email Notifications */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Mail className="h-5 w-5 text-[#8B7355]" />
              <h3 className="text-sm font-semibold text-[#2D2721]">{tr('Email Notifications', 'E-posti teavitused')}</h3>
            </div>
            <div className="space-y-3 ml-7">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-voucher-redeemed" className="text-sm text-[#2D2721] cursor-pointer">
                  {tr('Voucher redeemed', 'Vautser lunastatud')}
                </Label>
                <Switch id="email-voucher-redeemed" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email-new-customer" className="text-sm text-[#2D2721] cursor-pointer">
                  {tr('New customer signup', 'Uus kliendi registreerumine')}
                </Label>
                <Switch id="email-new-customer" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email-campaign-ending" className="text-sm text-[#2D2721] cursor-pointer">
                  {tr('Campaign ending soon', 'Kampaania loppemas')}
                </Label>
                <Switch id="email-campaign-ending" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email-weekly-report" className="text-sm text-[#2D2721] cursor-pointer">
                  {tr('Weekly performance report', 'Nadala tulemusraport')}
                </Label>
                <Switch id="email-weekly-report" />
              </div>
            </div>
          </div>

          {/* SMS Notifications */}
          <div className="pt-4 border-t border-[rgba(139,115,85,0.1)]">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="h-5 w-5 text-[#8B7355]" />
              <h3 className="text-sm font-semibold text-[#2D2721]">{tr('SMS Notifications', 'SMS teavitused')}</h3>
            </div>
            <div className="space-y-3 ml-7">
              <div className="flex items-center justify-between">
                <Label htmlFor="sms-fraud-alert" className="text-sm text-[#2D2721] cursor-pointer">
                  {tr('Fraud alerts', 'Pettusehoiatused')}
                </Label>
                <Switch id="sms-fraud-alert" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sms-high-value" className="text-sm text-[#2D2721] cursor-pointer">
                  {tr('High-value transactions', 'Suure vaartusega tehingud')}
                </Label>
                <Switch id="sms-high-value" defaultChecked />
              </div>
            </div>
          </div>

          {/* Push Notifications */}
          <div className="pt-4 border-t border-[rgba(139,115,85,0.1)]">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-[#8B7355]" />
              <h3 className="text-sm font-semibold text-[#2D2721]">{tr('Push Notifications', 'Push teavitused')}</h3>
            </div>
            <div className="space-y-3 ml-7">
              <div className="flex items-center justify-between">
                <Label htmlFor="push-realtime" className="text-sm text-[#2D2721] cursor-pointer">
                  {tr('Real-time redemptions', 'Reaalajas lunastused')}
                </Label>
                <Switch id="push-realtime" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push-milestones" className="text-sm text-[#2D2721] cursor-pointer">
                  {tr('Campaign milestones', 'Kampaania vaheeesmargid')}
                </Label>
                <Switch id="push-milestones" defaultChecked />
              </div>
            </div>
          </div>
        </div>
      </WarmCard>

      {/* Localization Settings */}
      <WarmCard padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#87BCDE] to-[#6FA3C8] flex items-center justify-center shadow-warm">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#2D2721]">{tr('Localization', 'Lokaliseerimine')}</h2>
            <p className="text-sm text-[#6B5744]">{tr('Regional and language preferences', 'Piirkonna ja keele eelistused')}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Default Language */}
          <div className="space-y-2">
            <Label className="text-[#2D2721] font-medium">
              {tr('Default Language', 'Vaikekeel')}
            </Label>
            <LanguageSelector />
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label htmlFor="timezone" className="text-[#2D2721] font-medium">
              {tr('Timezone', 'Ajavoo')}
            </Label>
            <select
              id="timezone"
              className="w-full h-12 rounded-[12px] border border-[rgba(139,115,85,0.2)] bg-white px-4 text-[#2D2721]"
              defaultValue="Europe/Tallinn"
            >
              <option value="Europe/Tallinn">Europe/Tallinn (EET)</option>
              <option value="Europe/Riga">Europe/Riga (EET)</option>
              <option value="Europe/Vilnius">Europe/Vilnius (EET)</option>
              <option value="Europe/Helsinki">Europe/Helsinki (EET)</option>
              <option value="Europe/Stockholm">Europe/Stockholm (CET)</option>
              <option value="Europe/Warsaw">Europe/Warsaw (CET)</option>
              <option value="Europe/Berlin">Europe/Berlin (CET)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label htmlFor="currency" className="text-[#2D2721] font-medium">
              {tr('Default Currency', 'Vaikevaluuta')}
            </Label>
            <select
              id="currency"
              className="w-full h-12 rounded-[12px] border border-[rgba(139,115,85,0.2)] bg-white px-4 text-[#2D2721]"
              defaultValue="EUR"
            >
              <option value="EUR">EUR - Euro (€)</option>
              <option value="USD">USD - US Dollar ($)</option>
              <option value="GBP">GBP - British Pound (£)</option>
              <option value="SEK">SEK - Swedish Krona (kr)</option>
              <option value="NOK">NOK - Norwegian Krone (kr)</option>
              <option value="DKK">DKK - Danish Krone (kr)</option>
              <option value="PLN">PLN - Polish Zloty (zł)</option>
            </select>
          </div>

          {/* Date Format */}
          <div className="space-y-2">
            <Label htmlFor="dateFormat" className="text-[#2D2721] font-medium">
              {tr('Date Format', 'Kuupaeva formaat')}
            </Label>
            <select
              id="dateFormat"
              className="w-full h-12 rounded-[12px] border border-[rgba(139,115,85,0.2)] bg-white px-4 text-[#2D2721]"
              defaultValue="DD.MM.YYYY"
            >
              <option value="DD.MM.YYYY">DD.MM.YYYY (25.01.2026)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (01/25/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (2026-01-25)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (25/01/2026)</option>
            </select>
          </div>
        </div>
      </WarmCard>

      {/* Security Settings */}
      <WarmCard padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E17B5C] to-[#D16B4C] flex items-center justify-center shadow-warm">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#2D2721]">{tr('Security & Privacy', 'Turvalisus ja privaatsus')}</h2>
            <p className="text-sm text-[#6B5744]">{tr('Manage your account security', 'Halda oma konto turvalisust')}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between p-4 bg-[#FFFBF5] rounded-[12px] border border-[rgba(139,115,85,0.1)]">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-[#9DB5A5]" />
              <div>
                <div className="font-semibold text-[#2D2721]">{tr('Two-Factor Authentication', 'Kaheastmeline autentimine')}</div>
                <p className="text-sm text-[#6B5744]">{tr('Add an extra layer of security', 'Lisa turvalisusele lisakiht')}</p>
              </div>
            </div>
            <WarmButton variant="outline" size="sm">
              {tr('Enable 2FA', 'Luba 2FA')}
            </WarmButton>
          </div>

          {/* Change Password */}
          <div>
            <Label className="text-[#2D2721] font-medium mb-4 block">{tr('Change Password', 'Muuda parooli')}</Label>
            <div className="space-y-3">
              <Input
                type="password"
                placeholder={tr('Current password', 'Praegune parool')}
                className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
              />
              <Input
                type="password"
                placeholder={tr('New password', 'Uus parool')}
                className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
              />
              <Input
                type="password"
                placeholder={tr('Confirm new password', 'Kinnita uus parool')}
                className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
              />
              <WarmButton variant="outline" size="sm">
                {tr('Update Password', 'Uuenda parooli')}
              </WarmButton>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="pt-4 border-t border-[rgba(139,115,85,0.1)]">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-[#2D2721] font-medium">Active Sessions</Label>
              <button className="text-sm text-[#FFC857] hover:text-[#FFB627] font-medium">
                {tr('Sign out all devices', 'Logi koigist seadmetest valja')}
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-white rounded-[10px] border border-[rgba(139,115,85,0.1)]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#9DB5A5]/10 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-[#9DB5A5]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#2D2721]">Chrome on MacOS</div>
                    <div className="text-xs text-[#8B7355]">{tr('Tallinn, Estonia • Active now', 'Tallinn, Eesti • Hetkel aktiivne')}</div>
                  </div>
                </div>
                <span className="px-2 py-1 bg-[#9DB5A5]/10 text-[#9DB5A5] text-xs font-semibold rounded-full">
                  {tr('Current', 'Praegune')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </WarmCard>

      {/* API & Integrations */}
      <WarmCard padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D8A7C5] to-[#C897B5] flex items-center justify-center shadow-warm">
            <Code className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#2D2721]">{tr('API & Integrations', 'API ja integratsioonid')}</h2>
            <p className="text-sm text-[#6B5744]">{tr('Connect external services', 'Uhenda valiseid teenuseid')}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* API Keys */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-[#2D2721] font-medium">API Keys</Label>
              <WarmButton variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {tr('Generate New Key', 'Genereeri uus voti')}
              </WarmButton>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-4 bg-white rounded-[12px] border border-[rgba(139,115,85,0.1)]">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-[#FFC857]/10 flex items-center justify-center">
                    <Key className="h-4 w-4 text-[#FFC857]" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#2D2721] mb-1">{tr('Production API Key', 'Tootmise API voti')}</div>
                    <div className="font-mono text-xs text-[#8B7355]">sk_live_••••••••••••••••••••1234</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-[#F8F6F1] rounded-lg transition-colors">
                    <Copy className="h-4 w-4 text-[#8B7355]" />
                  </button>
                  <button className="p-2 hover:bg-[#F8F6F1] rounded-lg transition-colors">
                    <Eye className="h-4 w-4 text-[#8B7355]" />
                  </button>
                  <button className="p-2 hover:bg-[#FFE5E5] rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4 text-[#E17B5C]" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-[12px] border border-[rgba(139,115,85,0.1)]">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-[#9DB5A5]/10 flex items-center justify-center">
                    <Key className="h-4 w-4 text-[#9DB5A5]" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#2D2721] mb-1">{tr('Test API Key', 'Test API voti')}</div>
                    <div className="font-mono text-xs text-[#8B7355]">sk_test_••••••••••••••••••••5678</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-[#F8F6F1] rounded-lg transition-colors">
                    <Copy className="h-4 w-4 text-[#8B7355]" />
                  </button>
                  <button className="p-2 hover:bg-[#F8F6F1] rounded-lg transition-colors">
                    <Eye className="h-4 w-4 text-[#8B7355]" />
                  </button>
                  <button className="p-2 hover:bg-[#FFE5E5] rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4 text-[#E17B5C]" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Webhooks */}
          <div className="pt-4 border-t border-[rgba(139,115,85,0.1)]">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-[#2D2721] font-medium">Webhooks</Label>
              <WarmButton variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {tr('Add Webhook', 'Lisa webhook')}
              </WarmButton>
            </div>
            <div className="p-4 bg-[#F8F6F1] rounded-[12px] text-center">
              <Zap className="h-8 w-8 text-[#8B7355] mx-auto mb-2" />
              <p className="text-sm text-[#6B5744]">{tr('No webhooks configured', 'Webhooke pole seadistatud')}</p>
              <p className="text-xs text-[#8B7355] mt-1">{tr('Get real-time notifications about events', 'Saa sundmuste kohta reaalajas teavitusi')}</p>
            </div>
          </div>
        </div>
      </WarmCard>

      {/* Team Management */}
      <WarmCard padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C8A882] to-[#B5956F] flex items-center justify-center shadow-warm">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-[#2D2721]">{tr('Team Members', 'Tiimi liikmed')}</h2>
            <p className="text-sm text-[#6B5744]">{tr('Manage access and permissions', 'Halda ligipaase ja oigusi')}</p>
          </div>
          <WarmButton variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {tr('Invite Member', 'Kutsu liige')}
          </WarmButton>
        </div>

        <div className="space-y-2">
          {/* Team Member 1 */}
          <div className="flex items-center justify-between p-4 bg-white rounded-[12px] border border-[rgba(139,115,85,0.1)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center font-bold text-white">
                JD
              </div>
              <div>
                <div className="text-sm font-semibold text-[#2D2721]">John Doe</div>
                <div className="text-xs text-[#8B7355]">john.doe@email.com</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-white text-xs font-semibold rounded-full">
                {tr('Owner', 'Omanik')}
              </span>
            </div>
          </div>

          {/* Team Member 2 */}
          <div className="flex items-center justify-between p-4 bg-white rounded-[12px] border border-[rgba(139,115,85,0.1)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center font-bold text-white">
                SM
              </div>
              <div>
                <div className="text-sm font-semibold text-[#2D2721]">Sarah Miller</div>
                <div className="text-xs text-[#8B7355]">sarah.m@email.com</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-[#9DB5A5]/20 text-[#9DB5A5] text-xs font-semibold rounded-full">
                {tr('Admin', 'Admin')}
              </span>
              <button className="p-2 hover:bg-[#F8F6F1] rounded-lg transition-colors">
                <Trash2 className="h-4 w-4 text-[#E17B5C]" />
              </button>
            </div>
          </div>

          {/* Team Member 3 */}
          <div className="flex items-center justify-between p-4 bg-white rounded-[12px] border border-[rgba(139,115,85,0.1)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E17B5C] to-[#D16B4C] flex items-center justify-center font-bold text-white">
                MJ
              </div>
              <div>
                <div className="text-sm font-semibold text-[#2D2721]">Mike Johnson</div>
                <div className="text-xs text-[#8B7355]">mike.j@email.com</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-[#8B7355]/10 text-[#8B7355] text-xs font-semibold rounded-full">
                {tr('Editor', 'Toimetaja')}
              </span>
              <button className="p-2 hover:bg-[#F8F6F1] rounded-lg transition-colors">
                <Trash2 className="h-4 w-4 text-[#E17B5C]" />
              </button>
            </div>
          </div>
        </div>
      </WarmCard>

      {/* Save Button */}
      <div className="flex justify-end">
        <WarmButton size="lg" onClick={handleSave} isLoading={isSaving}>
          <Save className="h-5 w-5 mr-2" />
          {tr('Save All Changes', 'Salvesta koik muudatused')}
        </WarmButton>
      </div>
    </div>
  );
}


