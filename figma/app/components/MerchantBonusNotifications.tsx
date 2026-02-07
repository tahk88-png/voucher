import { useState } from 'react';
import { useBonusTracking, ShareActivity } from '@app/contexts/BonusTracking';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { Input } from '@app/components/ui/input';
import { Label } from '@app/components/ui/label';
import { 
  Bell, 
  Gift, 
  Check, 
  X, 
  Send, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Share2,
  DollarSign,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

interface BonusApprovalModalProps {
  activity: ShareActivity;
  onClose: () => void;
  onApprove: (amount: number, message: string) => void;
  onReject: () => void;
}

function BonusApprovalModal({ activity, onClose, onApprove, onReject }: BonusApprovalModalProps) {
  const [amount, setAmount] = useState(activity.bonusAmount.toString());
  const [message, setMessage] = useState(
    `Aitäh ${activity.userName} reklaamimise eest! 🎉 Sinu ${activity.bonusAmount}€ kinkekaart on valmis.`
  );

  const handleApprove = () => {
    const finalAmount = parseFloat(amount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      toast.error('Palun sisesta kehtiv summa');
      return;
    }
    onApprove(finalAmount, message);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <WarmCard padding="none" className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] p-6 rounded-t-[16px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Kinnita Boonuskinkekaart</h2>
                <p className="text-sm text-white/80">Vaata üle ja saada kliendile</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <div className="p-4 bg-[#FFF9ED] rounded-[16px] border border-[rgba(139,115,85,0.1)]">
            <div className="text-sm font-semibold text-[#8B7355] mb-3">📋 Kliendi Andmed</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-[#9DB5A5]" />
                <div>
                  <div className="text-xs text-[#8B7355]">Nimi</div>
                  <div className="font-semibold text-[#2D2721]">{activity.userName}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#9DB5A5]" />
                <div>
                  <div className="text-xs text-[#8B7355]">E-mail</div>
                  <div className="font-semibold text-[#2D2721] text-sm">{activity.userEmail}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#9DB5A5]" />
                <div>
                  <div className="text-xs text-[#8B7355]">Telefon</div>
                  <div className="font-semibold text-[#2D2721]">{activity.userPhone}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#9DB5A5]" />
                <div>
                  <div className="text-xs text-[#8B7355]">Jagamise aeg</div>
                  <div className="font-semibold text-[#2D2721] text-sm">
                    {activity.timestamp.toLocaleString('et-EE')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Share Activity Info */}
          <div className="p-4 bg-[#E8F4F8] rounded-[16px] border border-[rgba(139,115,85,0.1)]">
            <div className="text-sm font-semibold text-[#8B7355] mb-3">📢 Jagamise Info</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-[#9DB5A5]" />
                <span className="text-sm text-[#6B5744]">
                  <strong>Kampaania:</strong> {activity.campaignName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#9DB5A5]" />
                <span className="text-sm text-[#6B5744]">
                  <strong>Platform:</strong> {activity.platform}
                </span>
              </div>
            </div>
          </div>

          {/* Gift Card Amount */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-[#FFC857]" />
              Kinkekaardi Summa (€)
            </Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              className="text-2xl font-bold text-center"
            />
            <p className="text-xs text-[#8B7355] mt-2">
              💡 Soovitatud boonussumma: {activity.bonusAmount}€
            </p>
          </div>

          {/* Personal Message */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-[#9DB5A5]" />
              Isiklik Sõnum Kliendile
            </Label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-[12px] border border-[rgba(139,115,85,0.2)] focus:border-[#9DB5A5] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]/20 transition-all resize-none text-sm text-[#2D2721]"
              placeholder="Kirjuta kliendile tänusõnum..."
            />
            <p className="text-xs text-[#8B7355] mt-2">
              ✉️ Saadetakse automaatselt e-mailile: {activity.userEmail}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <WarmButton
              onClick={handleApprove}
              className="flex-1"
              size="lg"
            >
              <Check className="h-5 w-5 mr-2" />
              Kinnita ja Saada Kinkekaart
            </WarmButton>
            <WarmButton
              onClick={() => {
                onReject();
                onClose();
              }}
              variant="outline"
              size="lg"
              className="border-[#E17B5C] text-[#E17B5C] hover:bg-[#E17B5C]/10"
            >
              <X className="h-5 w-5 mr-2" />
              Keeldu
            </WarmButton>
          </div>
        </div>
      </WarmCard>
    </div>
  );
}

export function MerchantBonusNotifications({ merchantId }: { merchantId: string }) {
  const { getPendingForMerchant, approveBonus, rejectBonus } = useBonusTracking();
  const [selectedActivity, setSelectedActivity] = useState<ShareActivity | null>(null);
  
  const pendingActivities = getPendingForMerchant(merchantId);

  const handleApprove = (amount: number, message: string) => {
    if (!selectedActivity) return;

    // Generate gift card ID
    const giftCardId = `gc-bonus-${Date.now()}`;
    
    // Approve the bonus
    approveBonus(selectedActivity.id, giftCardId);
    
    // Show success toast
    toast.success(
      `✅ Kinkekaart ${amount}€ saadetud kliendile ${selectedActivity.userName}!`,
      {
        description: `E-mail saadetud: ${selectedActivity.userEmail}`,
      }
    );
    
    setSelectedActivity(null);
  };

  const handleReject = () => {
    if (!selectedActivity) return;
    
    rejectBonus(selectedActivity.id);
    toast.error('❌ Boonus tagasi lükatud');
    setSelectedActivity(null);
  };

  if (pendingActivities.length === 0) {
    return null;
  }

  return (
    <>
      {/* Notification Badge */}
      <WarmCard padding="lg" className="bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] border-2 border-[#FFC857] shadow-warm-lg">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
              <Bell className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#E17B5C] rounded-full flex items-center justify-center text-white text-xs font-bold shadow-warm">
              {pendingActivities.length}
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-[#2D2721] text-lg mb-1">
              🎉 {pendingActivities.length} Uus Boonustaotlus!
            </h3>
            <p className="text-sm text-[#6B5744] mb-4">
              Kliendid on jaganud sinu reklaame. Kinnita ja saada neile kinkekaart!
            </p>
            
            {/* Activity List */}
            <div className="space-y-2 mb-4">
              {pendingActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="p-3 bg-white rounded-[12px] border border-[rgba(139,115,85,0.1)] hover:border-[#FFC857] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center text-white font-semibold">
                        {activity.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-[#2D2721]">{activity.userName}</div>
                        <div className="text-xs text-[#8B7355]">
                          {activity.platform} • {activity.campaignName}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-[#FFC857]">
                        {activity.bonusAmount}€
                      </div>
                      <WarmButton
                        size="sm"
                        onClick={() => setSelectedActivity(activity)}
                        className="mt-1"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Kinnita
                      </WarmButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </WarmCard>

      {/* Approval Modal */}
      {selectedActivity && (
        <BonusApprovalModal
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </>
  );
}
