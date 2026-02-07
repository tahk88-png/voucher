import { createContext, useContext, useState, ReactNode } from 'react';

export interface ShareActivity {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  merchantId: string;
  merchantName: string;
  campaignId: string;
  campaignName: string;
  platform: string;
  timestamp: Date;
  bonusAmount: number;
  status: 'pending' | 'approved' | 'rejected';
  giftCardId?: string;
}

interface BonusTrackingContextType {
  shareActivities: ShareActivity[];
  addShareActivity: (activity: Omit<ShareActivity, 'id' | 'timestamp' | 'status'>) => void;
  approveBonus: (activityId: string, giftCardId: string) => void;
  rejectBonus: (activityId: string) => void;
  getPendingForMerchant: (merchantId: string) => ShareActivity[];
}

const BonusTrackingContext = createContext<BonusTrackingContextType | undefined>(undefined);

export function BonusTrackingProvider({ children }: { children: ReactNode }) {
  const [shareActivities, setShareActivities] = useState<ShareActivity[]>([]);

  const addShareActivity = (activity: Omit<ShareActivity, 'id' | 'timestamp' | 'status'>) => {
    const newActivity: ShareActivity = {
      ...activity,
      id: `share-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      status: 'pending',
    };
    
    setShareActivities((prev) => [newActivity, ...prev]);
  };

  const approveBonus = (activityId: string, giftCardId: string) => {
    setShareActivities((prev) =>
      prev.map((activity) =>
        activity.id === activityId
          ? { ...activity, status: 'approved' as const, giftCardId }
          : activity
      )
    );
  };

  const rejectBonus = (activityId: string) => {
    setShareActivities((prev) =>
      prev.map((activity) =>
        activity.id === activityId
          ? { ...activity, status: 'rejected' as const }
          : activity
      )
    );
  };

  const getPendingForMerchant = (merchantId: string) => {
    return shareActivities.filter(
      (activity) => activity.merchantId === merchantId && activity.status === 'pending'
    );
  };

  return (
    <BonusTrackingContext.Provider
      value={{
        shareActivities,
        addShareActivity,
        approveBonus,
        rejectBonus,
        getPendingForMerchant,
      }}
    >
      {children}
    </BonusTrackingContext.Provider>
  );
}

export function useBonusTracking() {
  const context = useContext(BonusTrackingContext);
  if (context === undefined) {
    throw new Error('useBonusTracking must be used within a BonusTrackingProvider');
  }
  return context;
}
