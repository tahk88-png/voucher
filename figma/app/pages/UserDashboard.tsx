import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { WarmCard } from "@app/components/WarmCard";
import { WarmButton } from "@app/components/WarmButton";
import { SEOHead } from "@app/components/SEOHead";
import { motion, AnimatePresence, useAnimation } from "motion/react";
import {
  Gift,
  Share2,
  Award,
  TrendingUp,
  Copy,
  Check,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  Instagram,
  Mail,
  Link as LinkIcon,
  Star,
  Sparkles,
  Zap,
  Users,
  Euro,
  Calendar,
  Clock,
  Trophy,
  Target,
  Flame,
  Crown,
  Medal,
  Rocket,
  Heart,
  Coins,
  Ticket,
  CreditCard,
  ShoppingBag,
  Tag,
  QrCode,
} from "lucide-react";
import { CurrencyDisplay } from "@app/components/CurrencyDisplay";
import { Input } from "@app/components/ui/input";
import { Progress } from "@app/components/ui/progress";
import { toast } from "sonner";

// Floating particles component
const FloatingParticle = ({
  delay = 0,
  duration = 3,
  size = 8,
}: {
  delay?: number;
  duration?: number;
  size?: number;
}) => (
  <motion.div
    className="absolute rounded-full bg-gradient-to-br from-[#FFC857]/30 to-[#FFB627]/30 blur-sm"
    style={{
      width: size,
      height: size,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
    }}
    animate={{
      y: [0, -30],
      x: [0, Math.random() * 20 - 10],
      opacity: [0.3, 0.7],
      scale: [1, 1.5],
    }}
    transition={{
      duration,
      repeat: Infinity,
      repeatType: "reverse",
      delay,
      ease: "easeInOut",
    }}
  />
);

// Animated counter
const AnimatedCounter = ({
  value,
  duration = 1,
}: {
  value: number;
  duration?: number;
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = (timestamp - startTime) / (duration * 1000);

      if (progress < 1) {
        setCount(Math.floor(value * progress));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{count.toLocaleString()}</span>;
};

// Copy to clipboard helper
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy:", err);
    return false;
  }
};

export function UserDashboard() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const controls = useAnimation();

  const referralLink = "https://vouchers.app/ref/USR12345";
  const userName = "Maria Silva";

  // User stats
  const userStats = {
    totalPoints: 2450,
    pointsToNextReward: 550,
    nextRewardAt: 3000,
    totalShares: 127,
    successfulReferrals: 18,
    totalEarned: 245,
    currentStreak: 7,
    rank: "Gold Member",
    level: 12,
    rankPosition: 48,
  };

  // Points history
  const pointsHistory = [
    { date: "Mon", points: 1800 },
    { date: "Tue", points: 1950 },
    { date: "Wed", points: 2100 },
    { date: "Thu", points: 2200 },
    { date: "Fri", points: 2350 },
    { date: "Sat", points: 2450 },
    { date: "Sun", points: 2450 },
  ];

  // Leaderboard
  const leaderboard = [
    { rank: 1, name: "Ana Costa", points: 5240, avatar: "👸", badge: "🏆" },
    { rank: 2, name: "João Silva", points: 4980, avatar: "🧑", badge: "🥈" },
    { rank: 3, name: "Pedro Alves", points: 4520, avatar: "👨", badge: "🥉" },
    {
      rank: 48,
      name: "You (Maria Silva)",
      points: 2450,
      avatar: "👩",
      badge: "⭐",
      isUser: true,
    },
  ];

  // Achievements/Badges
  const achievements = [
    {
      id: 1,
      name: "First Share",
      icon: "🎯",
      unlocked: true,
      color: "from-[#9DB5A5] to-[#7FA090]",
    },
    {
      id: 2,
      name: "10 Referrals",
      icon: "🚀",
      unlocked: true,
      color: "from-[#FFC857] to-[#FFB627]",
    },
    {
      id: 3,
      name: "Week Streak",
      icon: "🔥",
      unlocked: true,
      color: "from-[#E17B5C] to-[#D16B4C]",
    },
    {
      id: 4,
      name: "1000 Points",
      icon: "💎",
      unlocked: false,
      color: "from-gray-300 to-gray-400",
    },
  ];

  // Recent activities
  const recentActivities = [
    {
      id: 1,
      type: "share",
      platform: "Facebook",
      points: 50,
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "referral",
      name: "João Costa",
      points: 200,
      time: "1 day ago",
    },
    {
      id: 3,
      type: "share",
      platform: "Instagram",
      points: 50,
      time: "2 days ago",
    },
    {
      id: 4,
      type: "bonus",
      reason: "Weekly Streak",
      points: 100,
      time: "3 days ago",
    },
    {
      id: 5,
      type: "share",
      platform: "WhatsApp",
      points: 50,
      time: "4 days ago",
    },
  ];

  // Available rewards
  const availableRewards = [
    {
      id: 1,
      name: "€10 Voucher",
      points: 1000,
      image: "🎁",
      available: true,
      discount: "25% OFF",
    },
    { id: 2, name: "€25 Voucher", points: 2500, image: "💎", available: false },
    { id: 3, name: "€50 Voucher", points: 5000, image: "🏆", available: false },
    {
      id: 4,
      name: "Premium Month",
      points: 3000,
      image: "⭐",
      available: false,
    },
  ];

  // Available campaigns to share
  const activeCampaigns = [
    {
      id: 1,
      merchant: "Fashion Store",
      title: "30% Off Summer Collection",
      category: "Fashion",
      emoji: "👗",
      bonus: "€5",
      expiresIn: "3 days",
      shares: 234,
      trending: true,
    },
    {
      id: 2,
      merchant: "Coffee House",
      title: "Buy 2 Get 1 Free",
      category: "Food & Dining",
      emoji: "☕",
      bonus: "€3",
      expiresIn: "1 week",
      shares: 156,
    },
    {
      id: 3,
      merchant: "Tech Store",
      title: "€100 Off Laptops",
      category: "Electronics",
      emoji: "💻",
      bonus: "€8",
      expiresIn: "5 days",
      shares: 412,
      trending: true,
    },
    {
      id: 4,
      merchant: "Spa Wellness",
      title: "Massage Special 20% Off",
      category: "Beauty & Wellness",
      emoji: "💆",
      bonus: "€4",
      expiresIn: "2 weeks",
      shares: 89,
    },
  ];

  // Upcoming events
  const upcomingEvents = [
    {
      id: 1,
      name: "Summer Fashion Show",
      date: "Feb 15, 2026",
      location: "Tallinn",
      tickets: "15 available",
      emoji: "🎭",
    },
    {
      id: 2,
      name: "Food Festival",
      date: "Feb 22, 2026",
      location: "Riga",
      tickets: "42 available",
      emoji: "🍽️",
    },
    {
      id: 3,
      name: "Tech Conference",
      date: "Mar 5, 2026",
      location: "Vilnius",
      tickets: "8 available",
      emoji: "🚀",
    },
  ];

  // Share platforms
  const sharePlatforms = [
    { name: "Facebook", icon: Facebook, points: 50, color: "#1877F2" },
    { name: "Instagram", icon: Instagram, points: 50, color: "#E1306C" },
    { name: "Twitter", icon: Twitter, points: 50, color: "#1DA1F2" },
    { name: "LinkedIn", icon: Linkedin, points: 50, color: "#0A66C2" },
    { name: "WhatsApp", icon: MessageCircle, points: 50, color: "#25D366" },
    { name: "Email", icon: Mail, points: 30, color: "#E17B5C" },
  ];

  // My Active Vouchers
  const myVouchers = [
    {
      id: 1,
      merchant: "Fashion Store",
      title: "€20 Off Purchase",
      code: "FASH20",
      expiresIn: "5 days",
      emoji: "👗",
      used: false,
    },
    {
      id: 2,
      merchant: "Coffee House",
      title: "Free Coffee",
      code: "COFFEE",
      expiresIn: "2 days",
      emoji: "☕",
      used: false,
    },
    {
      id: 3,
      merchant: "Tech Store",
      title: "10% Off Electronics",
      code: "TECH10",
      expiresIn: "12 days",
      emoji: "💻",
      used: true,
    },
  ];

  // My Gift Cards
  const myGiftCards = [
    {
      id: 1,
      merchant: "Universal Gift Card",
      value: "€50",
      balance: "€35",
      emoji: "🎁",
      color: "from-[#FFC857] to-[#FFB627]",
    },
    {
      id: 2,
      merchant: "Spa & Wellness",
      value: "€100",
      balance: "€100",
      emoji: "💆",
      color: "from-[#D8A7C5] to-[#C897B5]",
    },
  ];

  // My Event Tickets
  const myTickets = [
    {
      id: 1,
      event: "Summer Fashion Show",
      date: "Feb 15, 2026",
      location: "Tallinn",
      quantity: 2,
      emoji: "🎭",
      qrCode: true,
    },
    {
      id: 2,
      event: "Food Festival",
      date: "Feb 22, 2026",
      location: "Riga",
      quantity: 1,
      emoji: "🍽️",
      qrCode: true,
    },
  ];

  // Quick Actions
  const quickActions = [
    {
      name: "Browse Vouchers",
      icon: Tag,
      color: "from-[#FFC857] to-[#FFB627]",
      route: "/vouchers",
    },
    {
      name: "Active Campaigns",
      icon: TrendingUp,
      color: "from-[#9DB5A5] to-[#7FA090]",
      route: "/campaigns",
    },
    {
      name: "Buy Gift Cards",
      icon: CreditCard,
      color: "from-[#E17B5C] to-[#D16B4C]",
      route: "/gift-cards",
    },
    {
      name: "Book Events",
      icon: Calendar,
      color: "from-[#D8A7C5] to-[#C897B5]",
      route: "/events",
    },
  ];

  const handleCopyLink = async () => {
    const success = await copyToClipboard(referralLink);
    if (success) {
      setCopied(true);
      toast.success("🎉 Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = (platform: string) => {
    toast.success(`✨ Sharing on ${platform}... +50 points!`);
  };

  const progressPercentage =
    (userStats.totalPoints / userStats.nextRewardAt) * 100;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0, scale: 0.95 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  };

  return (
    <motion.div
      className="space-y-6 relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <SEOHead
        title="Rewards Dashboard - GiftHub"
        description="Track your points, referrals, and rewards. Share campaigns, earn bonuses, and redeem exclusive vouchers and gift cards."
        keywords={[
          "rewards",
          "points",
          "referrals",
          "bonuses",
          "vouchers",
          "gift cards",
          "campaigns",
          "preemiad",
          "boonused",
          "soovitused",
        ]}
        type="website"
      />

      {/* Floating Background Particles */}
      {[...Array(15)].map((_, i) => (
        <FloatingParticle
          key={i}
          delay={i * 0.3}
          duration={3 + Math.random() * 2}
          size={6 + Math.random() * 8}
        />
      ))}

      {/* Animated Header with Level Badge */}
      <motion.div
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10"
        variants={itemVariants}
      >
        <div className="text-center lg:text-left">
          <motion.h1
            className="text-5xl font-bold mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            <motion.span
              className="inline-block"
              animate={{
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              🎯
            </motion.span>
            <span className="ml-3 bg-gradient-to-r from-[#2D2721] via-[#FFC857] to-[#E17B5C] bg-clip-text text-transparent">
              Rewards Dashboard
            </span>
          </motion.h1>
          <motion.p
            className="text-lg text-[#6B5744] mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Welcome back,{" "}
            <span className="font-bold text-[#FFC857]">{userName}</span>!
            <motion.span
              className="inline-block ml-2"
              animate={{ rotate: [0, 14, -8, 14, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            >
              👋
            </motion.span>
          </motion.p>
        </div>
        <div className="flex items-center gap-3 justify-center lg:justify-end flex-wrap">
          <motion.div
            className="relative flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-br from-[#FFC857] via-[#FFD700] to-[#FFB627] text-white font-semibold shadow-warm overflow-hidden"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: [
                "0 4px 20px rgba(255,200,87,0.4)",
                "0 8px 30px rgba(255,200,87,0.6)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Crown className="h-5 w-5 relative z-10" />
            </motion.div>
            <span className="relative z-10">{userStats.rank}</span>
          </motion.div>
          <motion.div
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-br from-[#E17B5C] to-[#D16B4C] text-white font-semibold shadow-warm"
            whileHover={{ scale: 1.1 }}
            animate={{
              y: [0, -5, 0],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Target className="h-5 w-5" />
            </motion.div>
            Level {userStats.level}
          </motion.div>
        </div>
      </motion.div>

      {/* Enhanced Main Stats with Animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Points Balance - Compact version */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <WarmCard
            hover
            padding="lg"
            className="relative overflow-hidden bg-gradient-to-br from-white via-[#FFF9ED] to-[#FFE5B4] h-full"
          >
            {/* Animated background orbs - smaller */}
            <motion.div
              className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#FFC857] to-[#FFB627] opacity-20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] opacity-15 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.15, 0.3, 0.15],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <motion.div
                    className="text-xs font-medium text-[#8B7355] mb-2 flex items-center gap-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <motion.div
                      animate={{
                        rotate: [0, 10, -10, 10, 0],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                    >
                      <Sparkles className="h-4 w-4 text-[#FFC857]" />
                    </motion.div>
                    Your Points Balance
                  </motion.div>
                  <motion.div
                    className="text-5xl font-bold bg-gradient-to-r from-[#2D2721] via-[#FFC857] to-[#E17B5C] bg-clip-text text-transparent mb-2"
                    whileHover={{ scale: 1.05 }}
                  >
                    <AnimatedCounter
                      value={userStats.totalPoints}
                      duration={1.5}
                    />
                  </motion.div>
                  <motion.div
                    className="flex items-center gap-2 text-xs font-medium"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <motion.div
                      animate={{
                        rotate: [0, 360],
                        scale: [1, 1.3, 1],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="h-4 w-4 text-[#9DB5A5]" />
                    </motion.div>
                    <span className="bg-gradient-to-r from-[#9DB5A5] to-[#FFC857] bg-clip-text text-transparent font-bold">
                      {userStats.pointsToNextReward} points to next reward
                    </span>
                  </motion.div>
                </div>
                <motion.div
                  className="w-24 h-24 rounded-[24px] bg-gradient-to-br from-[#FFC857] via-[#FFD700] to-[#FFB627] flex items-center justify-center shadow-warm"
                  whileHover={{
                    rotate: [0, -10, 10, -10, 0],
                    scale: 1.1,
                  }}
                  animate={{
                    y: [0, -10, 0],
                    boxShadow: [
                      "0 10px 30px rgba(255,200,87,0.4)",
                      "0 20px 40px rgba(255,200,87,0.6)",
                      "0 10px 30px rgba(255,200,87,0.4)",
                    ],
                  }}
                  transition={{
                    y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                    boxShadow: { duration: 2, repeat: Infinity },
                  }}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Award className="h-12 w-12 text-white" />
                  </motion.div>
                </motion.div>
              </div>

              {/* Enhanced Progress Bar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6B5744] font-semibold flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Trophy className="h-4 w-4 text-[#FFB627]" />
                    </motion.div>
                    Progress to{" "}
                    <span className="font-semibold text-[#2D2721]">
                      <CurrencyDisplay amount={25} currency="EUR" />
                    </span>{" "}
                    voucher
                  </span>
                  <motion.span
                    className="font-bold text-xl bg-gradient-to-r from-[#FFC857] to-[#E17B5C] bg-clip-text text-transparent"
                    key={progressPercentage}
                    initial={{ scale: 1.5, opacity: 0, y: -10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    {Math.round(progressPercentage)}%
                  </motion.span>
                </div>
                <div className="relative h-5 bg-[#FFE5B4]/40 rounded-full overflow-hidden border-2 border-[rgba(255,200,87,0.3)]">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-[#FFC857] via-[#FFD700] to-[#FFB627] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
                  />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-40"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </div>
              </div>
            </div>
          </WarmCard>
        </motion.div>

        {/* Enhanced Quick Stats */}
        <div className="space-y-4">
          <motion.div variants={itemVariants}>
            <motion.div
              whileHover={{ scale: 1.08, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
            >
              <WarmCard
                hover
                padding="lg"
                className="text-center bg-gradient-to-br from-white via-[#E8F4EC] to-[#D0E8DD] cursor-pointer relative overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-[#9DB5A5]/0 to-[#9DB5A5]/20"
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <div className="flex flex-col items-center gap-3 mb-2 relative z-10">
                  <motion.div
                    className="w-14 h-14 rounded-[16px] bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center shadow-warm"
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.6 }}
                    animate={{
                      boxShadow: [
                        "0 4px 15px rgba(157,181,165,0.4)",
                        "0 8px 25px rgba(157,181,165,0.6)",
                        "0 4px 15px rgba(157,181,165,0.4)",
                      ],
                    }}
                  >
                    <Users className="h-7 w-7 text-white" />
                  </motion.div>
                  <motion.div
                    className="text-4xl font-bold text-[#2D2721]"
                    whileHover={{ scale: 1.2 }}
                  >
                    <AnimatedCounter value={userStats.successfulReferrals} />
                  </motion.div>
                </div>
                <div className="text-sm text-[#8B7355] font-semibold">
                  Successful Referrals
                </div>
              </WarmCard>
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <motion.div
              whileHover={{ scale: 1.08, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <WarmCard
                hover
                padding="lg"
                className="text-center bg-gradient-to-br from-white via-[#FFE5E5] to-[#FFD5D5] cursor-pointer relative overflow-hidden"
              >
                <motion.div
                  className="absolute top-0 right-0 w-20 h-20 bg-[#E17B5C] opacity-10 rounded-full blur-2xl"
                  animate={{
                    scale: [1, 1.5, 1],
                    x: [0, 10, 0],
                    y: [0, -10, 0],
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <div className="flex flex-col items-center gap-3 mb-2 relative z-10">
                  <motion.div
                    className="w-14 h-14 rounded-[16px] bg-gradient-to-br from-[#E17B5C] to-[#D16B4C] flex items-center justify-center shadow-warm"
                    animate={{
                      rotate: [0, 5, -5, 0],
                      boxShadow: [
                        "0 4px 15px rgba(225,123,92,0.4)",
                        "0 8px 25px rgba(225,123,92,0.6)",
                        "0 4px 15px rgba(225,123,92,0.4)",
                      ],
                    }}
                    transition={{
                      rotate: { duration: 2, repeat: Infinity },
                      boxShadow: { duration: 2, repeat: Infinity },
                    }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Coins className="h-7 w-7 text-white" />
                    </motion.div>
                  </motion.div>
                  <motion.div
                    className="text-4xl font-bold bg-gradient-to-r from-[#E17B5C] to-[#FFC857] bg-clip-text text-transparent"
                    whileHover={{ scale: 1.2 }}
                  >
                    <CurrencyDisplay
                      amount={userStats.totalEarned}
                      currency="EUR"
                    />
                  </motion.div>
                </div>
                <div className="text-sm text-[#8B7355] font-semibold">
                  Total Earned
                </div>
              </WarmCard>
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <motion.div
              whileHover={{ scale: 1.08, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
            >
              <WarmCard
                hover
                padding="lg"
                className="text-center bg-gradient-to-br from-white via-[#FFF3E0] to-[#FFE0B2] cursor-pointer relative overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0"
                  animate={{
                    background: [
                      "radial-gradient(circle at 20% 50%, rgba(255,107,53,0.1) 0%, transparent 50%)",
                      "radial-gradient(circle at 80% 50%, rgba(255,107,53,0.15) 0%, transparent 50%)",
                      "radial-gradient(circle at 20% 50%, rgba(255,107,53,0.1) 0%, transparent 50%)",
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <div className="flex flex-col items-center gap-3 mb-2 relative z-10">
                  <motion.div
                    className="w-14 h-14 rounded-[16px] bg-gradient-to-br from-[#FF6B35] via-[#FF8C42] to-[#FFA500] flex items-center justify-center shadow-warm"
                    animate={{
                      rotate: [0, -10, 10, -10, 0],
                      boxShadow: [
                        "0 4px 20px rgba(255,107,53,0.5)",
                        "0 8px 30px rgba(255,140,66,0.7)",
                        "0 4px 20px rgba(255,107,53,0.5)",
                      ],
                    }}
                    transition={{
                      rotate: { duration: 2, repeat: Infinity },
                      boxShadow: { duration: 2, repeat: Infinity },
                    }}
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.3, 1],
                        rotate: [0, 10, -10, 0],
                      }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Flame className="h-7 w-7 text-white" />
                    </motion.div>
                  </motion.div>
                  <motion.div
                    className="text-4xl font-bold text-[#FF6B35]"
                    whileHover={{ scale: 1.2 }}
                    animate={{
                      textShadow: [
                        "0 0 10px rgba(255,107,53,0.3)",
                        "0 0 20px rgba(255,107,53,0.5)",
                        "0 0 10px rgba(255,107,53,0.3)",
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <AnimatedCounter value={userStats.currentStreak} />
                  </motion.div>
                </div>
                <div className="text-sm text-[#8B7355] font-semibold flex items-center justify-center gap-1">
                  Day Streak
                  <motion.span
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    🔥
                  </motion.span>
                </div>
              </WarmCard>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Achievements Section */}
      <motion.div variants={itemVariants}>
        <WarmCard
          padding="lg"
          className="bg-gradient-to-br from-[#F8F6F1] via-white to-[#FFF9ED] relative overflow-hidden"
        >
          <motion.div
            className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#D4AF37] to-[#C5A028] opacity-5 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.5, 1],
              rotate: [0, 180, 360],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <motion.div
              className="w-14 h-14 rounded-[16px] bg-gradient-to-br from-[#D4AF37] via-[#FFD700] to-[#C5A028] flex items-center justify-center shadow-warm"
              animate={{
                rotate: [0, 10, -10, 0],
                boxShadow: [
                  "0 4px 20px rgba(212,175,55,0.4)",
                  "0 8px 30px rgba(212,175,55,0.6)",
                  "0 4px 20px rgba(212,175,55,0.4)",
                ],
              }}
              transition={{
                rotate: { duration: 3, repeat: Infinity },
                boxShadow: { duration: 2, repeat: Infinity },
              }}
            >
              <Medal className="h-7 w-7 text-white" />
            </motion.div>
            <div>
              <h3 className="text-xl font-semibold text-[#2D2721]">
                🏅 Your Achievements
              </h3>
              <p className="text-sm text-[#8B7355]">
                Unlock badges by completing challenges
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ scale: 0, rotate: -180, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{
                  delay: index * 0.15,
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                }}
                whileHover={{ scale: 1.15, y: -10 }}
              >
                <WarmCard
                  padding="md"
                  className={`text-center cursor-pointer relative overflow-hidden ${achievement.unlocked ? "bg-white" : "bg-gray-50 opacity-60"}`}
                >
                  {achievement.unlocked && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-[#FFC857]/10 to-transparent"
                      animate={{ opacity: [0, 0.5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  <motion.div
                    className={`w-20 h-20 mx-auto mb-3 rounded-[20px] bg-gradient-to-br ${achievement.color} flex items-center justify-center text-4xl shadow-warm relative z-10`}
                    animate={
                      achievement.unlocked
                        ? {
                            boxShadow: [
                              "0 4px 15px rgba(0,0,0,0.1)",
                              "0 8px 25px rgba(255,200,87,0.5)",
                              "0 4px 15px rgba(0,0,0,0.1)",
                            ],
                            y: [0, -5, 0],
                          }
                        : {}
                    }
                    transition={{ duration: 2, repeat: Infinity }}
                    whileHover={{ rotate: [0, 360] }}
                  >
                    <motion.span
                      animate={
                        achievement.unlocked
                          ? {
                              scale: [1, 1.2, 1],
                            }
                          : {}
                      }
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                    >
                      {achievement.icon}
                    </motion.span>
                  </motion.div>
                  <div className="text-xs font-semibold text-[#2D2721] relative z-10">
                    {achievement.name}
                  </div>
                  {achievement.unlocked && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mt-1 text-xs text-[#9DB5A5] font-medium relative z-10"
                    >
                      ✓ Unlocked
                    </motion.div>
                  )}
                </WarmCard>
              </motion.div>
            ))}
          </div>
        </WarmCard>
      </motion.div>

      {/* Enhanced Referral Link */}
      <motion.div variants={itemVariants}>
        <WarmCard
          padding="lg"
          className="bg-gradient-to-br from-[#FFF9ED] via-[#FFE5B4] to-[#FFF9ED] border-2 border-[rgba(255,200,87,0.4)] relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-[#FFC857]/0 via-[#FFC857]/10 to-[#FFC857]/0"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <motion.div
              className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-[#FFC857] via-[#FFD700] to-[#FFB627] flex items-center justify-center shadow-warm"
              animate={{
                rotate: [0, 360],
                boxShadow: [
                  "0 4px 20px rgba(255,200,87,0.4)",
                  "0 10px 40px rgba(255,200,87,0.7)",
                  "0 4px 20px rgba(255,200,87,0.4)",
                ],
              }}
              transition={{
                rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                boxShadow: { duration: 2, repeat: Infinity },
              }}
            >
              <LinkIcon className="h-8 w-8 text-white" />
            </motion.div>
            <div className="flex-1">
              <motion.h3
                className="text-xl font-semibold text-[#2D2721]"
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🎁 Your Referral Link
              </motion.h3>
              <p className="text-sm text-[#8B7355]">
                Share with friends and earn{" "}
                <motion.span
                  className="font-bold bg-gradient-to-r from-[#FFC857] to-[#E17B5C] bg-clip-text text-transparent"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  200 points
                </motion.span>{" "}
                per referral!
              </p>
            </div>
          </div>
          <div className="flex gap-3 relative z-10">
            <Input
              value={referralLink}
              readOnly
              className="rounded-[16px] border-2 border-[rgba(255,200,87,0.4)] bg-white h-14 font-mono text-[#2D2721] font-semibold"
            />
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={{
                boxShadow: [
                  "0 4px 15px rgba(255,200,87,0.3)",
                  "0 8px 25px rgba(255,200,87,0.5)",
                ],
              }}
              transition={{
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                },
              }}
            >
              <WarmButton onClick={handleCopyLink} className="h-14 px-8">
                <motion.div
                  animate={copied ? { rotate: 360 } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {copied ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </motion.div>
              </WarmButton>
            </motion.div>
          </div>
        </WarmCard>
      </motion.div>
    </motion.div>
  );
}
