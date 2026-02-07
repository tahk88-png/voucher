import { useState } from 'react';
import { WarmCard } from '@/figma/app/components/WarmCard';
import { WarmButton } from '@/figma/app/components/WarmButton';
import { Input } from '@/figma/app/components/ui/input';
import { 
  Bell, 
  Settings as SettingsIcon, 
  Check, 
  Trash2,
  Filter,
  Mail,
  Smartphone,
  TrendingUp,
  AlertCircle,
  Gift,
  Users,
  CreditCard,
  Calendar,
  Search,
  CheckCircle2,
  Archive
} from 'lucide-react';
import { toast } from 'sonner';

type NotificationType = 'system' | 'campaign' | 'transaction' | 'referral' | 'alert';
type NotificationPriority = 'high' | 'medium' | 'low';

type Notification = {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionLabel?: string;
  actionUrl?: string;
};

export function Notifications() {
  const [filter, setFilter] = useState<'all' | 'unread' | NotificationType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'notif-1',
      type: 'campaign',
      priority: 'high',
      title: 'Kampaania Hoiatus',
      message: 'Sinu "Suveallahindlus" kampaania on saavutanud 80% kupongide limiidist.',
      timestamp: '2024-01-25T10:30:00',
      read: false,
      actionLabel: 'Vaata kampaaniat',
      actionUrl: '/campaigns/summer-sale',
    },
    {
      id: 'notif-2',
      type: 'transaction',
      priority: 'medium',
      title: 'Väljamakse Teostatud',
      message: '€150 on kantud sinu pangakontole.',
      timestamp: '2024-01-25T09:15:00',
      read: false,
      actionLabel: 'Vaata rahakotti',
      actionUrl: '/wallet',
    },
    {
      id: 'notif-3',
      type: 'referral',
      priority: 'medium',
      title: 'Uus Liituja',
      message: 'Anna Tamm liitus sinu soovituskoodiga. Teenisid €25!',
      timestamp: '2024-01-24T16:45:00',
      read: true,
      actionLabel: 'Vaata soovitusi',
      actionUrl: '/referrals',
    },
    {
      id: 'notif-4',
      type: 'system',
      priority: 'low',
      title: 'Süsteemi Uuendus',
      message: 'Uued funktsioonid saadaval: Täiustatud analüütika ja kinkekaartide kujundused.',
      timestamp: '2024-01-23T08:00:00',
      read: true,
      actionLabel: 'Loe lähemalt',
      actionUrl: '/analytics',
    },
    {
      id: 'notif-5',
      type: 'alert',
      priority: 'high',
      title: 'Makseviis Aegub',
      message: 'Sinu krediitkaart lõpuga 1234 aegub 7 päeva pärast.',
      timestamp: '2024-01-22T14:20:00',
      read: false,
      actionLabel: 'Uuenda andmeid',
      actionUrl: '/settings',
    },
    {
      id: 'notif-6',
      type: 'campaign',
      priority: 'low',
      title: 'Kampaania Loodud',
      message: 'Sinu "Talvekollektsioon" kampaania on nüüd aktiivne.',
      timestamp: '2024-01-22T11:30:00',
      read: true,
      actionLabel: 'Vaata kampaaniat',
      actionUrl: '/campaigns/winter-collection',
    },
  ]);

  // Settings state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    campaignAlerts: true,
    transactionAlerts: true,
    referralAlerts: true,
    systemUpdates: true,
    weeklyReports: true,
    marketingEmails: false,
  });

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'system': return Bell;
      case 'campaign': return TrendingUp;
      case 'transaction': return CreditCard;
      case 'referral': return Users;
      case 'alert': return AlertCircle;
    }
  };

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case 'system': return 'from-[#9DB5A5] to-[#7FA090]';
      case 'campaign': return 'from-[#FFC857] to-[#FFB627]';
      case 'transaction': return 'from-[#F5C98E] to-[#E5B97E]';
      case 'referral': return 'from-[#E17B5C] to-[#D16B4C]';
      case 'alert': return 'from-[#E17B5C] to-[#D16B4C]';
    }
  };

  const getPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case 'high': return 'bg-[#E17B5C] text-white';
      case 'medium': return 'bg-[#FFC857] text-[#2D2721]';
      case 'low': return 'bg-[#9DB5A5] text-white';
    }
  };

  // Group notifications by date
  const groupedNotifications = () => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    const groups: Record<string, Notification[]> = {
      'Täna': [],
      'Eile': [],
      'Varem': []
    };

    filteredNotifications.forEach(n => {
      const date = new Date(n.timestamp).toDateString();
      if (date === today) groups['Täna'].push(n);
      else if (date === yesterday) groups['Eile'].push(n);
      else groups['Varem'].push(n);
    });

    return groups;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('et-EE', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('et-EE', { day: 'numeric', month: 'long' });
  };

  const filteredNotifications = notifications.filter((notif) => {
    const matchesFilter = filter === 'all' ? true : filter === 'unread' ? !notif.read : notif.type === filter;
    const matchesSearch = notif.title.toLowerCase().includes(searchQuery.toLowerCase()) || notif.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    toast.success('Kõik märgitud loetuks');
  };

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
    toast.success('Teavitus kustutatud');
  };

  const handleClearAll = () => {
    setNotifications([]);
    toast.success('Kõik teavitused kustutatud');
  };

  const handleSettingToggle = (key: keyof typeof settings) => {
    setSettings({ ...settings, [key]: !settings[key] });
    toast.success('Seaded uuendatud');
  };

  const groups = groupedNotifications();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-[#2D2721]">Teavitused</h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-gradient-to-br from-[#E17B5C] to-[#D16B4C] text-white text-sm font-semibold shadow-warm animate-pulse">
                {unreadCount} uut
              </span>
            )}
          </div>
          <p className="text-[#6B5744]">Hoia silm peal olulistel sündmustel ja uuendustel</p>
        </div>
        <div className="flex items-center gap-3">
          <WarmButton variant="outline" onClick={handleMarkAllAsRead} className="hidden sm:flex">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Märgi kõik loetuks
          </WarmButton>
          <WarmButton
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
            className={showSettings ? 'bg-[#FFC857] text-[#2D2721] border-[#FFC857]' : ''}
          >
            <SettingsIcon className="h-5 w-5 mr-2" />
            Seaded
          </WarmButton>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <WarmCard padding="lg" className="bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] border border-[#FFC857]">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-[#2D2721] mb-2">Teavituste seaded</h2>
              <p className="text-[#6B5744]">Halda, kuidas ja milliseid teavitusi soovid saada</p>
            </div>
            <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-[#FFC857]/20 rounded-full">
               <Trash2 className="w-5 h-5 text-[#8B7355]" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delivery Methods */}
            <div>
              <h3 className="text-sm font-semibold text-[#2D2721] mb-4 flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#FFC857]" />
                Kanalid
              </h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer hover:bg-[#FFF9ED] transition-colors border border-[#E7DCC7]">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-[#8B7355]" />
                    <div>
                      <div className="font-medium text-[#2D2721]">E-mail</div>
                      <div className="text-xs text-[#8B7355]">Kokkuvõtted ja olulised teated</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={() => handleSettingToggle('emailNotifications')}
                    className="h-5 w-5 rounded border-[#E7DCC7] text-[#FFC857] focus:ring-[#FFC857]"
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer hover:bg-[#FFF9ED] transition-colors border border-[#E7DCC7]">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-[#8B7355]" />
                    <div>
                      <div className="font-medium text-[#2D2721]">Push teavitused</div>
                      <div className="text-xs text-[#8B7355]">Välkkiired teated ekraanil</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={() => handleSettingToggle('pushNotifications')}
                    className="h-5 w-5 rounded border-[#E7DCC7] text-[#FFC857] focus:ring-[#FFC857]"
                  />
                </label>
              </div>
            </div>

            {/* Notification Types */}
            <div>
              <h3 className="text-sm font-semibold text-[#2D2721] mb-4 flex items-center gap-2">
                <Filter className="h-4 w-4 text-[#FFC857]" />
                Teavituste tüübid
              </h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer hover:bg-[#FFF9ED] transition-colors border border-[#E7DCC7]">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-[#8B7355]" />
                    <span className="font-medium text-[#2D2721]">Kampaaniad</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.campaignAlerts}
                    onChange={() => handleSettingToggle('campaignAlerts')}
                    className="h-5 w-5 rounded border-[#E7DCC7] text-[#FFC857] focus:ring-[#FFC857]"
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer hover:bg-[#FFF9ED] transition-colors border border-[#E7DCC7]">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-[#8B7355]" />
                    <span className="font-medium text-[#2D2721]">Maksed</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.transactionAlerts}
                    onChange={() => handleSettingToggle('transactionAlerts')}
                    className="h-5 w-5 rounded border-[#E7DCC7] text-[#FFC857] focus:ring-[#FFC857]"
                  />
                </label>
              </div>
            </div>
          </div>
        </WarmCard>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
         <WarmCard padding="sm" className="w-full md:w-auto overflow-x-auto">
           <div className="flex items-center gap-2">
             {[
               { id: 'all' as const, label: 'Kõik', count: notifications.length },
               { id: 'unread' as const, label: 'Lugemata', count: unreadCount },
               { id: 'campaign' as const, label: 'Kampaaniad', icon: TrendingUp },
               { id: 'transaction' as const, label: 'Raha', icon: CreditCard },
               { id: 'referral' as const, label: 'Soovitused', icon: Users },
               { id: 'system' as const, label: 'Süsteem', icon: Bell },
             ].map((filterOption) => {
               const Icon = filterOption.icon;
               const isActive = filter === filterOption.id;
               return (
                 <button
                   key={filterOption.id}
                   onClick={() => setFilter(filterOption.id)}
                   className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap text-sm ${
                     isActive
                       ? 'bg-[#2D2721] text-white shadow-md'
                       : 'bg-[#FFF9ED] text-[#6B5744] hover:bg-[#E7DCC7]'
                   }`}
                 >
                   {Icon && <Icon className="h-3 w-3" />}
                   {filterOption.label}
                   {filterOption.count !== undefined && (
                     <span className={`text-xs ml-1 ${isActive ? 'text-white/60' : 'text-[#8B7355]'}`}>
                       {filterOption.count}
                     </span>
                   )}
                 </button>
               );
             })}
           </div>
         </WarmCard>

         <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B7355]" />
            <Input 
               placeholder="Otsi teavitustest..." 
               className="pl-9 bg-white border-[#E7DCC7] focus:border-[#FFC857]"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
      </div>

      {/* Notifications List Grouped */}
      <div className="space-y-8">
         {Object.entries(groups).map(([groupName, groupNotifs]) => (
            groupNotifs.length > 0 && (
               <div key={groupName} className="space-y-3">
                  <h3 className="text-sm font-bold text-[#8B7355] uppercase tracking-wider pl-1 flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#FFC857]"></div>
                     {groupName}
                  </h3>
                  {groupNotifs.map((notification) => {
                     const Icon = getTypeIcon(notification.type);
                     return (
                       <WarmCard
                         key={notification.id}
                         padding="lg"
                         hover
                         className={`transition-all duration-300 ${notification.read ? 'opacity-70 bg-[#FAF7F2]' : 'bg-white border-l-4 border-l-[#E17B5C] shadow-md'}`}
                       >
                         <div className="flex items-start gap-4">
                           <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getTypeColor(notification.type)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                             <Icon className="h-5 w-5 text-white" />
                           </div>
                           <div className="flex-1 min-w-0">
                             <div className="flex items-start justify-between gap-3 mb-1">
                               <div className="flex-1">
                                 <h3 className={`text-base font-bold text-[#2D2721] ${!notification.read ? 'text-[#E17B5C]' : ''}`}>
                                   {notification.title}
                                 </h3>
                                 <p className="text-sm text-[#6B5744] leading-relaxed mt-1">
                                   {notification.message}
                                 </p>
                               </div>
                               <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                  notification.priority === 'high' ? 'bg-[#FFF5F5] text-[#E17B5C] border-[#E17B5C]/20' : 
                                  notification.priority === 'medium' ? 'bg-[#FFF9ED] text-[#B88E40] border-[#FFC857]/30' : 
                                  'bg-[#F2F7F5] text-[#7FA090] border-[#9DB5A5]/30'
                               }`}>
                                 {notification.priority}
                               </span>
                             </div>
                             
                             <div className="flex items-center justify-between mt-3 pt-3 border-t border-[rgba(139,115,85,0.1)]">
                               <div className="flex items-center gap-2 text-xs text-[#8B7355]">
                                 <Calendar className="w-3 h-3" />
                                 {groupName === 'Varem' ? formatDate(notification.timestamp) : formatTime(notification.timestamp)}
                               </div>
                               
                               <div className="flex items-center gap-2">
                                 {notification.actionLabel && (
                                   <WarmButton size="sm" variant="outline" className="h-7 text-xs px-3">
                                     {notification.actionLabel}
                                   </WarmButton>
                                 )}
                                 {!notification.read && (
                                   <button
                                     onClick={() => handleMarkAsRead(notification.id)}
                                     className="p-1.5 rounded-lg hover:bg-[#E6F4EA] text-[#9DB5A5] hover:text-[#00D098] transition-colors"
                                     title="Märgi loetuks"
                                   >
                                     <Check className="h-4 w-4" />
                                   </button>
                                 )}
                                 <button
                                   onClick={() => handleDelete(notification.id)}
                                   className="p-1.5 rounded-lg hover:bg-[#FEE2E2] text-[#E17B5C] transition-colors"
                                   title="Kustuta"
                                 >
                                   <Trash2 className="h-4 w-4" />
                                 </button>
                               </div>
                             </div>
                           </div>
                         </div>
                       </WarmCard>
                     );
                  })}
               </div>
            )
         ))}

         {filteredNotifications.length === 0 && (
           <WarmCard padding="lg" className="text-center py-16 border-dashed border-2 border-[#E7DCC7] bg-transparent">
             <div className="w-16 h-16 rounded-full bg-[#FAF7F2] flex items-center justify-center mx-auto mb-4">
               <Bell className="h-8 w-8 text-[#E7DCC7]" />
             </div>
             <h3 className="text-xl font-bold text-[#2D2721] mb-2">Teavitusi pole</h3>
             <p className="text-[#6B5744]">
               {searchQuery ? "Otsingule vastavaid teavitusi ei leitud." : "Hetkel uusi teavitusi ei ole."}
             </p>
           </WarmCard>
         )}
      </div>

      {/* Footer Actions */}
      {notifications.length > 0 && (
        <div className="flex justify-center pt-8 pb-12">
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 text-sm text-[#8B7355] hover:text-[#E17B5C] font-bold transition-colors px-4 py-2 rounded-lg hover:bg-[#FFF9ED]"
          >
            <Archive className="w-4 h-4" />
            Arhiveeri kõik teavitused
          </button>
        </div>
      )}
    </div>
  );
}