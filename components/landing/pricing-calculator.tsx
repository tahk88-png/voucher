"use client";

import { useState, useMemo, useId } from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { TrendingUp, Users, Ticket, Euro } from "lucide-react";
import { PLAN_CATALOG, PLATFORM_FEE_PERCENT } from "@/lib/access-control/monetization";
import { formatWholeCurrency } from "@/components/landing/format-price";

const eur = (euros: number) => formatWholeCurrency(Math.round(euros * 100), "EUR");

export function PricingCalculator() {
  const t = useTranslations("home.calculator");
  const [customers, setCustomers] = useState(200);
  const [avgTicket, setAvgTicket] = useState(25);
  const [referralRate, setReferralRate] = useState(15);

  const results = useMemo(() => {
    const monthlyPurchases = customers;
    const monthlyRevenue = monthlyPurchases * avgTicket;
    const referralCustomers = Math.round(monthlyPurchases * (referralRate / 100));
    const referralRevenue = referralCustomers * avgTicket;
    const platformFee = Math.round((monthlyRevenue * PLATFORM_FEE_PERCENT) / 100);
    // Illustrative plan pick by volume; prices come from the plan catalog.
    const plan =
      monthlyRevenue < 5000 ? PLAN_CATALOG.starter : monthlyRevenue < 15000 ? PLAN_CATALOG.pro : PLAN_CATALOG.scale;
    const planCost = plan.monthlyPriceCents / 100;
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start min-w-0">
      {/* Sliders */}
      <div className="space-y-6">
        <SliderInput
          label={t("monthlyPurchases")}
          value={customers}
          onChange={setCustomers}
          min={10}
          max={2000}
          step={10}
          format={(value) => t("purchasesValue", { count: value })}
        />
        <SliderInput
          label={t("averageTicket")}
          value={avgTicket}
          onChange={setAvgTicket}
          min={5}
          max={200}
          step={5}
          format={eur}
        />
        <SliderInput
          label={t("referralRate")}
          value={referralRate}
          onChange={setReferralRate}
          min={5}
          max={40}
          step={1}
          suffix="%"
        />
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 min-w-0">
        <ResultCard
          icon={Euro}
          label={t("monthlyRevenue")}
          value={eur(results.monthlyRevenue)}
          color="text-[var(--primary)]"
          bgColor="bg-[#f6e1d7]"
        />
        <ResultCard
          icon={Users}
          label={t("referralCustomers")}
          value={t("perMonthValue", { value: results.referralCustomers })}
          color="text-[var(--success)]"
          bgColor="bg-green-50"
        />
        <ResultCard
          icon={Ticket}
          label={t("referralRevenue")}
          value={eur(results.referralRevenue)}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <ResultCard
          icon={TrendingUp}
          label={t("estimatedRoi")}
          value={`${results.roi}%`}
          color="text-[var(--danger)]"
          bgColor="bg-red-50"
          highlight
        />
        <div className="min-[400px]:col-span-2 rounded-xl border border-[var(--border)] bg-white/80 px-4 py-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center text-sm">
            <span className="text-[var(--text-muted)]">{t("platformCost")}</span>
            <span className="font-semibold text-[var(--text)]">
              {t.rich("platformCostValue", {
                plan: eur(results.planCost),
                fees: eur(results.platformFee),
                percent: PLATFORM_FEE_PERCENT,
                total: eur(results.totalCost),
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </span>
          </div>
        </div>
        <p className="min-[400px]:col-span-2 text-xs text-[var(--text-muted)]">
          {t("disclaimer")}
        </p>
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
  suffix = "",
  format,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  format?: (value: number) => string;
}) {
  const id = useId();
  const percent = ((value - min) / (max - min)) * 100;
  const display = format ? format(value) : `${value.toLocaleString("en-GB")}${suffix}`;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-x-3 mb-1">
        <label htmlFor={id} className="text-sm font-medium text-[var(--text)]">{label}</label>
        <output htmlFor={id} className="text-sm font-bold text-[var(--primary)]">
          {display}
        </output>
      </div>
      {/* py-3 gives the thin track a touch-sized hit area. */}
      <div className="relative py-3">
        <input
          id={id}
          type="range"
          aria-valuetext={display}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="block w-full h-2 rounded-full appearance-none cursor-pointer bg-[var(--border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-4"
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
      className={`min-w-0 rounded-xl border p-4 ${highlight ? "border-[var(--primary)] bg-gradient-to-br from-[#f6e1d7] to-[#efd2c4]" : "border-[var(--border)] bg-white/80"}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center mb-2`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className="text-xs text-[var(--text-muted)] mb-0.5">{label}</p>
      <p className={`text-lg font-bold break-words ${highlight ? "text-[var(--primary)]" : "text-[var(--text)]"}`}>{value}</p>
    </motion.div>
  );
}
