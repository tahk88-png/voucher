"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { TrendingUp, Users, Ticket, DollarSign } from "lucide-react";

export function PricingCalculator() {
  const [customers, setCustomers] = useState(200);
  const [avgTicket, setAvgTicket] = useState(25);
  const [referralRate, setReferralRate] = useState(15);

  const results = useMemo(() => {
    const monthlyPurchases = customers;
    const monthlyRevenue = monthlyPurchases * avgTicket;
    const referralCustomers = Math.round(monthlyPurchases * (referralRate / 100));
    const referralRevenue = referralCustomers * avgTicket;
    const platformFee = Math.round(monthlyRevenue * 0.05);
    const planCost = monthlyRevenue < 5000 ? 19 : monthlyRevenue < 15000 ? 39 : 99;
    const totalCost = platformFee + planCost;
    const roi = referralRevenue > 0 ? Math.round(((referralRevenue - totalCost) / totalCost) * 100) : 0;

    return {
      monthlyRevenue,
      referralCustomers,
      referralRevenue,
      platformFee,
      planCost,
      totalCost,
      roi: Math.max(0, roi),
    };
  }, [customers, avgTicket, referralRate]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Sliders */}
      <div className="space-y-6">
        <SliderInput
          label="Monthly voucher purchases"
          value={customers}
          onChange={setCustomers}
          min={10}
          max={2000}
          step={10}
          suffix=" purchases"
        />
        <SliderInput
          label="Average ticket value"
          value={avgTicket}
          onChange={setAvgTicket}
          min={5}
          max={200}
          step={5}
          prefix="EUR "
        />
        <SliderInput
          label="Referral conversion rate"
          value={referralRate}
          onChange={setReferralRate}
          min={5}
          max={40}
          step={1}
          suffix="%"
        />
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 gap-3">
        <ResultCard
          icon={DollarSign}
          label="Monthly revenue"
          value={`EUR ${results.monthlyRevenue.toLocaleString()}`}
          color="text-[var(--primary)]"
          bgColor="bg-[#f6e1d7]"
        />
        <ResultCard
          icon={Users}
          label="New referral customers"
          value={`${results.referralCustomers}/mo`}
          color="text-[var(--success)]"
          bgColor="bg-green-50"
        />
        <ResultCard
          icon={Ticket}
          label="Referral revenue"
          value={`EUR ${results.referralRevenue.toLocaleString()}`}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <ResultCard
          icon={TrendingUp}
          label="Estimated ROI"
          value={`${results.roi}%`}
          color="text-[var(--danger)]"
          bgColor="bg-red-50"
          highlight
        />
        <div className="col-span-2 rounded-xl border border-[var(--border)] bg-white/80 px-4 py-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-[var(--text-muted)]">Platform cost</span>
            <span className="font-semibold text-[var(--text)]">
              EUR {results.planCost}/mo plan + EUR {results.platformFee} fees = <strong>EUR {results.totalCost}/mo</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  prefix = "",
  suffix = "",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
}) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-[var(--text)]">{label}</span>
        <span className="text-sm font-bold text-[var(--primary)]">
          {prefix}{value.toLocaleString()}{suffix}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[var(--border)]"
          style={{
            background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${percent}%, var(--border) ${percent}%, var(--border) 100%)`,
          }}
        />
      </div>
    </div>
  );
}

function ResultCard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
  highlight,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
  bgColor: string;
  highlight?: boolean;
}) {
  return (
    <motion.div
      className={`rounded-xl border p-4 ${highlight ? "border-[var(--primary)] bg-gradient-to-br from-[#f6e1d7] to-[#efd2c4]" : "border-[var(--border)] bg-white/80"}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center mb-2`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className="text-xs text-[var(--text-muted)] mb-0.5">{label}</p>
      <p className={`text-lg font-bold ${highlight ? "text-[var(--primary)]" : "text-[var(--text)]"}`}>{value}</p>
    </motion.div>
  );
}
