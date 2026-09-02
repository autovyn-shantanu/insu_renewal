"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
// Dialog import removed — using inline table instead
import DataTable from "@/components/Templates/reactTable";
import axios from "axios";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import Ainput from "@/components/atoms/Input";
import {
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
  Bell,
  DollarSign,
  Hourglass,
  Building2,
  Search,
  X,
  Loader,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Phone,
  MessageSquare,
  Tag,
  Smartphone,
  Target,
  Briefcase,
  ListChecks,
  Activity,
  RefreshCw,
  CheckCheck,
  XCircle,
  PhoneOff,
  WifiOff,
  Zap as Zap2,
  FileText,
  ThumbsUp,
  PieChart,
  ChevronRight,
} from "lucide-react";

// ─── SAFE PARSERS ─────────────────────────────────────────────────────────────
const si = (v: any): number => {
  const n = parseInt(String(v ?? 0), 10);
  return Number.isFinite(n) ? n : 0;
};
const sf = (v: any): number => {
  const n = parseFloat(String(v ?? 0));
  return Number.isFinite(n) ? n : 0;
};

// ─── FORMAT HELPERS ───────────────────────────────────────────────────────────
const fmtMoney = (n: number): string => {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)}Cr`;
  if (n >= 10_00_000) return `₹${(n / 10_00_000).toFixed(2)}L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
};
const fmtN = (n: number): string => {
  if (n >= 10_00_000) return `${(n / 10_00_000).toFixed(1)}L`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-IN");
};

// ─── FOLLOWUP META ────────────────────────────────────────────────────────────
const FU_META: Record<string, { color: string; icon: any; label: string }> = {
  RENEWED: { color: "#10b981", icon: CheckCheck, label: "Renewed" },
  NOT_INTERESTED: { color: "#ef4444", icon: XCircle, label: "Not Interested" },
  CALLBACK: { color: "#f59e0b", icon: Phone, label: "Callback" },
  PROMISED: { color: "#6366f1", icon: MessageSquare, label: "Promised" },
  INTERESTED: { color: "#3b82f6", icon: ThumbsUp, label: "Interested" },
  BUSY: { color: "#ec4899", icon: PhoneOff, label: "Busy" },
  NO_FOLLOWUP: { color: "#6b7280", icon: Tag, label: "No Follow-up" },
  AI_CALL_INITIATED: {
    color: "#8b5cf6",
    icon: Activity,
    label: "AI Call Initiated",
  },
  AI_CALL_PROCESSING: {
    color: "#a855f7",
    icon: RefreshCw,
    label: "AI Call Processing",
  },
  AI_CALL_COMPLETED: {
    color: "#7c3aed",
    icon: Target,
    label: "AI Call Completed",
  },
  AI_CALL_FAILED: {
    color: "#dc2626",
    icon: AlertTriangle,
    label: "AI Call Failed",
  },
  FOLLOWUP_DONE: {
    color: "#14b8a6",
    icon: ListChecks,
    label: "Follow-up Done",
  },
  PENDING: { color: "#f97316", icon: Hourglass, label: "Pending" },
  CALLED: { color: "#06b6d4", icon: Smartphone, label: "Called" },
  NO_ANSWER: { color: "#64748b", icon: PhoneOff, label: "No Answer" },
  DISCONNECTED: { color: "#94a3b8", icon: WifiOff, label: "Disconnected" },
};

const fuMeta = (s: string) => {
  const meta = FU_META[s];
  if (meta) return meta;
  return {
    color: "#64748b",
    icon: Tag,
    label: s
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase()),
  };
};

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface DashConfig {
  beforeDays: number;
  afterDays: number;
  periodType: string;
  periodLabel: string;
}
interface DashPayments {
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  totalCount: number;
  totalCollectedAmount: number;
  totalPremiumAmount: number;
  totalRejectedAmount: number;
  totalPendingAmount: number;
}
interface DashReminders {
  beforeExpiry: number;
  afterExpiry: number;
  totalDue: number;
  beforeDays: number;
  afterDays: number;
}
interface PeriodSummary {
  periodType: string;
  periodLabel: string;
  totalPolicies: number;
  collectedAmount: number;
  pendingAmount: number;
  rejectedAmount: number;
  totalPremium: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
}
interface DashSummary {
  totalPolicies: number;
  activePolicies: number;
  expiredPolicies: number;
  expiringIn30Days: number;
  reminders: DashReminders;
  payments: DashPayments;
  periodSummary: PeriodSummary;
}
interface FuItem {
  status: string;
  count: number;
}
interface PtItem {
  periodLabel: string;
  totalExpiring: number;
  collectedAmount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  rejectedAmount: number;
  pendingAmount: number;
  totalPremiumAmount: number;
  activePoliciesCount: number;
  expiredPoliciesCount: number;
}
interface CdItem {
  companyName: string;
  policyCount: number;
  totalPremium: number;
}
interface ExpRow {
  UTD: number;
  TRAN_ID: number;
  VEHICAL_REG_NO: string;
  CUST_NAME: string;
  CUST_MOB_NO: string;
  POLICY_NAME: string;
  POLICY_NUMBER: string;
  POLICY_END_DATE: string;
  DAYS_TO_EXPIRY: number;
  LAST_FOLLOWUP_STATUS?: string;
  LAST_FOLLOWUP_DATE?: string;
}
interface DashData {
  config: DashConfig;
  summary: DashSummary;
  charts: {
    followupBreakdown: FuItem[];
    periodTrend: PtItem[];
    companyDistribution: CdItem[];
  };
  tables: {
    recentExpiring: ExpRow[];
    totalPolicies?: any[];
    activePolicies?: any[];
    expiredPolicies?: any[];
    expiringIn30Days?: any[];
    premiumPolicies?: any[];
    approvedPayments?: any[];
    pendingPayments?: any[];
    rejectedPayments?: any[];
    totalPayments?: any[];
    beforeExpiryReminders?: any[];
    afterExpiryReminders?: any[];
    totalReminders?: any[];
  };
}

// ─── MICRO COMPONENTS ─────────────────────────────────────────────────────────
const Sk = ({ h = "h-24", cls = "" }: { h?: string; cls?: string }) => (
  <div
    className={`animate-pulse rounded-2xl bg-gray-200 dark:bg-white/10 ${h} w-full ${cls}`}
  />
);

const ExpiryBadge = ({ days }: { days: number | null }) => {
  if (days === null || days === undefined)
    return <span className="text-[10px] text-gray-400">—</span>;
  const [bg, lbl] =
    days < 0
      ? [
        "bg-[#FFF0F2] text-[#FF2D46] border-[#FFD2D7] dark:bg-red-950/20 dark:text-red-300 dark:border-red-900/30",
        `${Math.abs(days)}d ago`,
      ]
      : days === 0
        ? [
          "bg-[#FFF0F2] text-[#FF2D46] border-[#FFD2D7] dark:bg-red-950/20 dark:text-red-300 dark:border-red-900/30",
          "Today!",
        ]
        : days <= 5
          ? [
            "bg-[#FFF0F2] text-[#FF2D46] border-[#FFD2D7] dark:bg-red-950/20 dark:text-red-300 dark:border-red-900/30",
            `${days}d left`,
          ]
          : days <= 15
            ? [
              "bg-[#FFF9E6] text-[#D97706] border-[#FCD34D] dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/30",
              `${days}d left`,
            ]
            : [
              "bg-[#E8F8F0] text-[#16A34A] border-[#BFE8CB] dark:bg-green-950/20 dark:text-green-300 dark:border-green-900/30",
              `${days}d left`,
            ];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${bg}`}
    >
      {lbl}
    </span>
  );
};

const FuBadge = ({ status }: { status?: string }) => {
  if (!status)
    return (
      <span className="text-[10px] text-gray-400 dark:text-gray-500">—</span>
    );
  const m = fuMeta(status);
  const IconComponent = m.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap"
      style={{
        color: m.color,
        background: `${m.color}18`,
        borderColor: `${m.color}40`,
      }}
    >
      <IconComponent size={12} /> {m.label}
    </span>
  );
};

const PolicyStatusCell = ({ value }: { value: any }) => {
  const s = String(value || "").toUpperCase();
  if (!s || s === "—" || s === "NULL") return <span className="text-gray-400">—</span>;
  if (s.includes("ACTIVE")) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F8F0] text-[#16A34A] border border-[#BFE8CB] dark:bg-green-950/30 dark:text-green-300 dark:border-green-800/40">
        ACTIVE
      </span>
    );
  }
  if (s.includes("EXPIRED") && !s.includes("SOON") && !s.includes("TODAY")) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF0F2] text-[#E11D48] border border-[#FFD2D7] dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/40">
        EXPIRED
      </span>
    );
  }
  if (s.includes("EXPIRING") || s.includes("SOON") || s.includes("TODAY")) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF7E6] text-[#D97706] border border-[#FCD34D] dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40">
        {s.replace(/_/g, " ")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300">
      {s.replace(/_/g, " ")}
    </span>
  );
};

const DaysLeftCell = ({ value }: { value: any }) => {
  if (value === null || value === undefined || value === "") return <span className="text-gray-400">—</span>;
  const days = si(value);
  if (days < 0) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF0F2] text-[#E11D48] border border-[#FFD2D7] dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/40">
        {Math.abs(days)}d ago
      </span>
    );
  }
  if (days === 0) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF0F2] text-[#E11D48] border border-[#FFD2D7] dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/40 animate-pulse">
        Today!
      </span>
    );
  }
  if (days <= 5) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF0F2] text-[#E11D48] border border-[#FFD2D7] dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/40">
        {days}d left
      </span>
    );
  }
  if (days <= 30) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF7E6] text-[#D97706] border border-[#FCD34D] dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40">
        {days}d left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F8F0] text-[#16A34A] border border-[#BFE8CB] dark:bg-green-950/30 dark:text-green-300 dark:border-green-800/40">
      {days}d left
    </span>
  );
};

const ApprovalStatusCell = ({ value }: { value: any }) => {
  const s = String(value || "").toUpperCase();
  if (s.includes("APPROV") || s === "1") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F8F0] text-[#16A34A] border border-[#BFE8CB] dark:bg-green-950/30 dark:text-green-300 dark:border-green-800/40">
        APPROVED
      </span>
    );
  }
  if (s.includes("REJECT") || s === "2") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF0F2] text-[#E11D48] border border-[#FFD2D7] dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/40">
        REJECTED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF7E6] text-[#D97706] border border-[#FCD34D] dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40">
      PENDING
    </span>
  );
};

const AmountCell = ({ value, color = "text-[#16A34A]" }: { value: any; color?: string }) => {
  if (value === null || value === undefined || value === "") return <span className="text-gray-400">—</span>;
  const num = Number(value);
  return (
    <span className={`font-mono font-bold ${color}`}>
      {Number.isFinite(num) ? `₹${num.toLocaleString("en-IN")}` : value}
    </span>
  );
};

const PremiumHighlightCell = ({ value }: { value: any }) => {
  if (value === null || value === undefined || value === "") return <span className="text-gray-400 font-medium">—</span>;
  const num = Number(value);
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black font-mono border whitespace-nowrap shadow-sm"
      style={{
        backgroundColor: "#DBEAFE",
        color: "#1D4ED8",
        borderColor: "#60A5FA",
      }}
    >
      {Number.isFinite(num) ? `₹${num.toLocaleString("en-IN")}` : value}
    </span>
  );
};

const ReminderTypeCell = ({ value }: { value: any }) => {
  const s = String(value || "").toUpperCase();
  const isBefore = s.includes("BEFORE");
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${isBefore
        ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800/40"
        : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/40"
        }`}
    >
      {value || "—"}
    </span>
  );
};

const FollowupCell = ({ value }: { value: any }) => {
  if (!value) return <span className="text-gray-400">—</span>;
  return <FuBadge status={value} />;
};

interface CardDef {
  label: string;
  value: string;
  icon: any;
  color: string;
  grad: string;
  sub?: string;
  onClick?: () => void;
}

const StatCard = ({ c }: { c: CardDef }) => {
  const IconComponent = c.icon;
  const isNeutral = c.label === "TOTAL POLICIES" || c.label === "PENDING APPROVAL";
  return (
    <div
      onClick={c.onClick}
      className={`rounded-2xl bg-white dark:bg-[#161b22] shadow-md overflow-hidden w-full transition-all duration-200 ${c.onClick
        ? "cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
        : ""
        }`}
    >
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-black tracking-widest uppercase text-gray-400 dark:text-gray-500">
            {c.label}
          </div>
          <div
            className="mt-2 text-3xl font-black leading-none dark:text-white"
            style={{ color: isNeutral ? undefined : c.color }}
          >
            {c.value}
          </div>
          {c.sub ? (
            <div className="mt-2 text-xs font-semibold text-gray-400 dark:text-gray-500">
              {c.sub}
            </div>
          ) : null}
        </div>

        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border"
          style={{
            background: `${c.color}12`,
            borderColor: `${c.color}33`,
            color: c.color,
          }}
        >
          <IconComponent size={18} />
        </div>
      </div>
    </div>
  );
};

const SecHd = ({
  icon,
  title,
  sub,
  badge,
  right,
}: {
  icon: any;
  title: string;
  sub?: string;
  badge?: { label: string; color: string };
  right?: React.ReactNode;
}) => {
  const IconComponent = icon;
  return (
    <div className="px-5 py-4 flex items-start justify-between gap-3 bg-white dark:bg-[#161b22]">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0">
          <IconComponent size={16} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <div className="text-base font-black text-gray-900 dark:text-white">
              {title}
            </div>
            {badge ? (
              <span
                className="text-xs font-black px-3 py-1 rounded-full border"
                style={{
                  color: badge.color,
                  background: `${badge.color}12`,
                  borderColor: `${badge.color}30`,
                }}
              >
                {badge.label}
              </span>
            ) : null}
          </div>
          {sub ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 -mt-0.5">
              {sub}
            </div>
          ) : null}
        </div>
      </div>
      {right}
    </div>
  );
};

const PRow = ({
  label,
  count,
  amount,
  maxCount,
  color,
  onClick,
}: {
  label: string;
  count: number;
  amount: number;
  maxCount: number;
  color: string;
  onClick?: () => void;
}) => {
  const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
  return (
    <div
      onClick={onClick}
      className={`space-y-2 p-2 rounded-xl transition-all ${onClick ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5" : ""
        }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-bold text-gray-900 dark:text-white">
          {label}
        </div>
        <div className="text-sm font-extrabold" style={{ color }}>
          {fmtMoney(amount)} · {count} · {pct}%
        </div>
      </div>
      <div className="h-3 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(100, pct)}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
};

const PayTile = ({
  icon,
  title,
  value,
  bg,
  color,
  border,
  onClick,
}: {
  icon: any;
  title: string;
  value: string;
  bg: string;
  color: string;
  border: string;
  onClick?: () => void;
}) => {
  const IconComponent = icon;
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border p-4 ${bg} ${border} transition-all ${onClick
        ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
        : ""
        }`}
    >
      <div className="flex items-center gap-2 text-[11px] font-black tracking-widest uppercase text-gray-500 dark:text-gray-400">
        <span
          className="w-8 h-8 rounded-xl inline-flex items-center justify-center border"
          style={{ background: `${color}12`, borderColor: `${color}33` }}
        >
          <IconComponent size={14} style={{ color }} />
        </span>
        {title}
      </div>
      <div className="mt-3 text-3xl font-black" style={{ color }}>
        {value}
      </div>
    </div>
  );
};

const getCurrentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const firstDay = `${year}-${pad2(month + 1)}-01`;
  const lastDate = new Date(year, month + 1, 0).getDate();
  const lastDay = `${year}-${pad2(month + 1)}-${pad2(lastDate)}`;
  return { firstDay, lastDay };
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function InsuranceDashboard() {
  const user = useCurrentUser();
  const BASE = `${process.env.NEXT_PUBLIC_URL}/Crm`;

  const { firstDay: defaultFrom, lastDay: defaultTo } = useMemo(
    () => getCurrentMonthRange(),
    []
  );

  const [dash, setDash] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);
  const [appliedFromDate, setAppliedFromDate] = useState(defaultFrom);
  const [appliedToDate, setAppliedToDate] = useState(defaultTo);

  // dlg* states kept for backward compatibility (unused after inline table migration)

  // Inline drilldown table state
  const [activeTable, setActiveTable] = useState<{
    title: string;
    data: any[];
    cols: any[];
  } | null>(null);
  const inlineTableRef = useRef<HTMLDivElement>(null);

  const fetchDash = useCallback(async (fDate?: string, tDate?: string) => {
    try {
      setLoading(true);
      setError("");

      const activeFrom = fDate !== undefined ? fDate : appliedFromDate;
      const activeTo = tDate !== undefined ? tDate : appliedToDate;

      const payload: Record<string, any> = {
        EXPORT_TYPE: 1,
        loc_code: user?.branch ?? "",
      };
      if (activeFrom) payload.fromDate = activeFrom;
      if (activeTo) payload.toDate = activeTo;

      const res = await axios.post(`${BASE}/dashboard`, payload, {
        headers: {
          "Content-Type": "application/json",
          compcode: user?.Comp_Code ?? "",
          name: user?.name ?? "",
        },
      });

      if (!res.data?.success) {
        setError(res.data?.Message || "Failed");
        return;
      }

      const rd = res.data?.data ?? {};
      const rs = rd?.summary ?? {};
      const rp = rs?.payments ?? {};
      const rr = rs?.reminders ?? {};
      const rc = rd?.charts ?? {};
      const rt = rd?.tables ?? {};
      const cfg = rd?.config ?? {};
      const rps = rs?.periodSummary ?? {};

      const filteredExpiring = (
        Array.isArray(rt.recentExpiring) ? rt.recentExpiring : []
      ).filter((row: ExpRow) => {
        const daysToExpiry = si(row.DAYS_TO_EXPIRY);
        return daysToExpiry >= 0 && daysToExpiry <= 30;
      });

      const normalized: DashData = {
        config: {
          beforeDays: si(cfg.beforeDays ?? rr.beforeDays ?? 30),
          afterDays: si(cfg.afterDays ?? rr.afterDays ?? 30),
          periodType: String(cfg.periodType ?? "monthly"),
          periodLabel: String(cfg.periodLabel ?? "month"),
        },
        summary: {
          totalPolicies: si(rs.totalPolicies),
          activePolicies: si(rs.activePolicies),
          expiredPolicies: si(rs.expiredPolicies),
          expiringIn30Days: si(rs.expiringIn30Days),
          reminders: {
            beforeExpiry: si(rr.beforeExpiry),
            afterExpiry: si(rr.afterExpiry),
            totalDue: si(rr.totalDue),
            beforeDays: si(cfg.beforeDays ?? rr.beforeDays ?? 30),
            afterDays: si(cfg.afterDays ?? rr.afterDays ?? 30),
          },
          payments: {
            approvedCount: si(rp.approvedCount),
            pendingCount: si(rp.pendingCount),
            rejectedCount: si(rp.rejectedCount),
            totalCount: si(rp.totalCount),
            totalCollectedAmount: sf(rp.totalCollectedAmount),
            totalPremiumAmount: sf(rp.totalPremiumAmount),
            totalRejectedAmount: sf(rp.totalRejectedAmount),
            totalPendingAmount: sf(rp.totalPendingAmount),
          },
          periodSummary: {
            periodType: String(rps.periodType ?? "monthly"),
            periodLabel: String(rps.periodLabel ?? "month"),
            totalPolicies: si(rps.totalPolicies),
            collectedAmount: sf(rps.collectedAmount),
            pendingAmount: sf(rps.pendingAmount),
            rejectedAmount: sf(rps.rejectedAmount),
            totalPremium: sf(rps.totalPremium),
            approvedCount: si(rps.approvedCount),
            rejectedCount: si(rps.rejectedCount),
            pendingCount: si(rps.pendingCount),
          },
        },
        charts: {
          followupBreakdown: (Array.isArray(rc.followupBreakdown)
            ? rc.followupBreakdown
            : []
          )
            .map((f: any) => ({
              status: String(f?.status ?? "UNKNOWN"),
              count: si(f?.count),
            }))
            .filter((f: any) => f.count > 0),
          periodTrend: (Array.isArray(rc.periodTrend)
            ? rc.periodTrend
            : []
          ).map((t: any) => ({
            periodLabel: String(t?.periodLabel ?? ""),
            totalExpiring: si(t?.totalExpiring),
            collectedAmount: sf(t?.collectedAmount),
            pendingCount: si(t?.pendingCount),
            approvedCount: si(t?.approvedCount),
            rejectedCount: si(t?.rejectedCount),
            rejectedAmount: sf(t?.rejectedAmount),
            pendingAmount: sf(t?.pendingAmount),
            totalPremiumAmount: sf(t?.totalPremiumAmount),
            activePoliciesCount: si(t?.activePoliciesCount),
            expiredPoliciesCount: si(t?.expiredPoliciesCount),
          })),
          companyDistribution: (Array.isArray(rc.companyDistribution)
            ? rc.companyDistribution
            : []
          ).map((c: any) => ({
            companyName: String(c?.companyName ?? "Other"),
            policyCount: si(c?.policyCount),
            totalPremium: sf(c?.totalPremium),
          })),
        },
        tables: {
          recentExpiring: filteredExpiring,
          totalPolicies: Array.isArray(rt.totalPolicies) ? rt.totalPolicies : [],
          activePolicies: Array.isArray(rt.activePolicies) ? rt.activePolicies : [],
          expiredPolicies: Array.isArray(rt.expiredPolicies) ? rt.expiredPolicies : [],
          expiringIn30Days: Array.isArray(rt.expiringIn30Days) ? rt.expiringIn30Days : [],
          approvedPayments: Array.isArray(rt.approvedPayments) ? rt.approvedPayments : [],
          pendingPayments: Array.isArray(rt.pendingPayments) ? rt.pendingPayments : [],
          rejectedPayments: Array.isArray(rt.rejectedPayments) ? rt.rejectedPayments : [],
          totalPayments: Array.isArray(rt.totalPayments) ? rt.totalPayments : [],
          beforeExpiryReminders: Array.isArray(rt.beforeExpiryReminders) ? rt.beforeExpiryReminders : [],
          afterExpiryReminders: Array.isArray(rt.afterExpiryReminders) ? rt.afterExpiryReminders : [],
          totalReminders: Array.isArray(rt.totalReminders) ? rt.totalReminders : [],
        },
      };

      setDash(normalized);
    } catch (e: any) {
      setError(e?.response?.data?.Message || e?.message || "Server error");
    } finally {
      setLoading(false);
    }
  }, [appliedFromDate, appliedToDate, user, BASE]);

  useEffect(() => {
    fetchDash();
  }, [user?.Comp_Code, user?.branch]);

  const cfg = dash?.config;
  const s = dash?.summary;
  const p = s?.payments;
  const r = s?.reminders;
  const fb = dash?.charts.followupBreakdown ?? [];
  const cd = dash?.charts.companyDistribution ?? [];
  const ex = dash?.tables.recentExpiring ?? [];

  const payTotal =
    (p?.approvedCount ?? 0) +
    (p?.pendingCount ?? 0) +
    (p?.rejectedCount ?? 0) || 1;
  const fbTotal = fb.reduce((a, f) => a + f.count, 0) || 1;

  const expiringSoonRef = useRef<HTMLDivElement>(null);

  const openDlg = (title: string, rows: any[], cols: any[]) => {
    // Show inline drilldown table and auto-scroll to it
    setActiveTable({ title, data: rows, cols });
    setTimeout(() => {
      inlineTableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const POLICY_COLS = [
    { Header: "Vehicle Reg No", accessor: "VEHICAL_REG_NO" },
    { Header: "Customer Name", accessor: "CUST_NAME" },
    { Header: "Mobile No", accessor: "CUST_MOB_NO" },
    { Header: "Car Model", accessor: "MODEL_NAME" },
    { Header: "Policy No", accessor: "POLICY_NUMBER" },
    { Header: "Insurer", accessor: "POLICY_NAME" },
    { Header: "Premium", accessor: "PREMIUM_AMOUNT", Cell: ({ value }: any) => <PremiumHighlightCell value={value} /> },
    { Header: "Start Date", accessor: "POLICY_START_DATE" },
    { Header: "End Date", accessor: "POLICY_END_DATE" },
    { Header: "Status", accessor: "POLICY_STATUS", Cell: ({ value }: any) => <PolicyStatusCell value={value} /> },
    { Header: "Days Left", accessor: "DAYS_TO_EXPIRY", Cell: ({ value }: any) => <DaysLeftCell value={value} /> },
    { Header: "Last Follow-up", accessor: "LAST_FOLLOWUP_STATUS", Cell: ({ value }: any) => <FollowupCell value={value} /> },
    { Header: "FU Date", accessor: "LAST_FOLLOWUP_DATE" },
  ];

  const PREMIUM_POLICY_COLS = [
    { Header: "Vehicle Reg No", accessor: "VEHICAL_REG_NO" },
    { Header: "Customer Name", accessor: "CUST_NAME" },
    { Header: "Mobile No", accessor: "CUST_MOB_NO" },
    { Header: "Car Model", accessor: "MODEL_NAME" },
    { Header: "Policy No", accessor: "POLICY_NUMBER" },
    { Header: "Insurer", accessor: "POLICY_NAME" },
    { Header: "Premium", accessor: "PREMIUM_AMOUNT", Cell: ({ value }: any) => <PremiumHighlightCell value={value} /> },
    { Header: "Start Date", accessor: "POLICY_START_DATE" },
    { Header: "End Date", accessor: "POLICY_END_DATE" },
    { Header: "Status", accessor: "POLICY_STATUS", Cell: ({ value }: any) => <PolicyStatusCell value={value} /> },
    { Header: "Days Left", accessor: "DAYS_TO_EXPIRY", Cell: ({ value }: any) => <DaysLeftCell value={value} /> },
    { Header: "Last Follow-up", accessor: "LAST_FOLLOWUP_STATUS", Cell: ({ value }: any) => <FollowupCell value={value} /> },
    { Header: "FU Date", accessor: "LAST_FOLLOWUP_DATE" },
  ];

  const PAYMENT_COLS = [
    { Header: "Vehicle Reg No", accessor: "VEHICAL_REG_NO" },
    { Header: "Customer Name", accessor: "CUST_NAME" },
    { Header: "Mobile No", accessor: "CUST_MOB_NO" },
    { Header: "Model", accessor: "MODEL_NAME" },
    { Header: "Policy Number", accessor: "POLICY_NUMBER" },
    { Header: "Insurer", accessor: "POLICY_NAME" },
    { Header: "Amount", accessor: "PYMT_AMOUNT", Cell: ({ value }: any) => <AmountCell value={value} color="text-[#16A34A] dark:text-emerald-400" /> },
    { Header: "Payment Mode", accessor: "PYMT_MODE" },
    { Header: "Payment Date", accessor: "PYMT_DATE" },
    { Header: "Approval Status", accessor: "APPROVAL_STATUS_LABEL", Cell: ({ value }: any) => <ApprovalStatusCell value={value} /> },
    { Header: "Bank Name", accessor: "BANK_NAME" },
    { Header: "Approval Remark", accessor: "ACNT_APPR_REMARK" },
    { Header: "Remarks", accessor: "REMARKS" },
  ];

  const REMINDER_COLS = [
    { Header: "Vehicle Reg No", accessor: "VEHICAL_REG_NO" },
    { Header: "Customer Name", accessor: "CUST_NAME" },
    { Header: "Mobile No", accessor: "CUST_MOB_NO" },
    { Header: "Model", accessor: "MODEL_NAME" },
    { Header: "Policy Number", accessor: "POLICY_NUMBER" },
    { Header: "Insurance Company", accessor: "POLICY_NAME" },
    { Header: "Expiry Date", accessor: "POLICY_END_DATE" },
    { Header: "Days Left", accessor: "DAYS_TO_EXPIRY", Cell: ({ value }: any) => <DaysLeftCell value={value} /> },
    { Header: "Reminder Type", accessor: "REMINDER_TYPE", Cell: ({ value }: any) => <ReminderTypeCell value={value} /> },
    { Header: "Last Follow-up", accessor: "LAST_FOLLOWUP_STATUS", Cell: ({ value }: any) => <FollowupCell value={value} /> },
    { Header: "Follow-up Date", accessor: "LAST_FOLLOWUP_DATE" },
  ];

  const EXPIRY_COLS = [
    { Header: "Vehicle", accessor: "VEHICAL_REG_NO" },
    { Header: "Customer", accessor: "CUST_NAME" },
    { Header: "Mobile", accessor: "CUST_MOB_NO" },
    { Header: "Policy No", accessor: "POLICY_NUMBER" },
    { Header: "Policy Name", accessor: "POLICY_NAME" },
    { Header: "Expires", accessor: "POLICY_END_DATE" },
    { Header: "Days Left", accessor: "DAYS_TO_EXPIRY", Cell: ({ value }: any) => <DaysLeftCell value={value} /> },
    { Header: "Last Followup", accessor: "LAST_FOLLOWUP_STATUS", Cell: ({ value }: any) => <FollowupCell value={value} /> },
    { Header: "FU Date", accessor: "LAST_FOLLOWUP_DATE" },
  ];

  const cards = useMemo((): CardDef[] => {
    if (!s || !p || !r) return [];
    return [
      {
        label: "TOTAL POLICIES",
        value: fmtN(s.totalPolicies),
        icon: FileText,
        color: "#2563eb",
        grad: "",
        sub: "All records",
        onClick: () => openDlg("Total Policies List", dash?.tables?.totalPolicies || [], POLICY_COLS),
      },
      {
        label: "ACTIVE",
        value: fmtN(s.activePolicies),
        icon: CheckCircle,
        color: "#16a34a",
        grad: "",
        sub: "Not expired",
        onClick: () => openDlg("Active Policies List", dash?.tables?.activePolicies || [], POLICY_COLS),
      },
      {
        label: "EXPIRED",
        value: fmtN(s.expiredPolicies),
        icon: AlertTriangle,
        color: "#d97706",
        grad: "",
        sub: "Past due date",
        onClick: () => openDlg("Expired Policies List", dash?.tables?.expiredPolicies || [], POLICY_COLS),
      },
      {
        label: "EXPIRING SOON",
        value: fmtN(s.expiringIn30Days),
        icon: Clock,
        color: "#e11d48",
        grad: "",
        sub: "Next 30 days",
        onClick: () => openDlg("Expiring Soon Policies (Next 30 Days)", dash?.tables?.expiringIn30Days || [], POLICY_COLS),
      },
      {
        label: "REMINDERS DUE",
        value: fmtN(r.totalDue),
        icon: Bell,
        color: "#7c3aed",
        grad: "",
        sub: `${r.beforeExpiry} before · ${r.afterExpiry} after`,
        onClick: () => openDlg("Reminders Due List", dash?.tables?.totalReminders || [], REMINDER_COLS),
      },
      {
        label: "COLLECTED",
        value: fmtMoney(p.totalCollectedAmount),
        icon: DollarSign,
        color: "#16a34a",
        grad: "",
        sub: `${p.approvedCount} approved`,
        onClick: () => openDlg("Approved / Collected Payments List", dash?.tables?.approvedPayments || [], PAYMENT_COLS),
      },
      {
        label: "PENDING APPROVAL",
        value: fmtN(p.pendingCount),
        icon: Clock,
        color: "#6b7280",
        grad: "",
        sub: "Awaiting review",
        onClick: () => openDlg("Pending Approval Payments List", dash?.tables?.pendingPayments || [], PAYMENT_COLS),
      },
      {
        label: "TOTAL PREMIUM",
        value: fmtMoney(p.totalPremiumAmount),
        icon: Building2,
        color: "#2563eb",
        grad: "",
        sub: "With premium",
        onClick: () => {
          const rows = (dash?.tables?.premiumPolicies || dash?.tables?.totalPolicies || []).filter(
            (row: any) => {
              const amt = Number(row.PREMIUM_AMOUNT || 0);
              return Number.isFinite(amt) && amt > 0;
            }
          );
          openDlg("Total Premium Policies List", rows, PREMIUM_POLICY_COLS);
        },
      },
    ];
  }, [s, p, r, dash]);

  const donutOpts = useMemo(
    (): Highcharts.Options => ({
      chart: {
        type: "pie",
        backgroundColor: "transparent",
        style: { fontFamily: "inherit" },
        height: 220,
      },
      title: { text: undefined },
      credits: { enabled: false },
      tooltip: {
        useHTML: true,
        backgroundColor: "#1e293b",
        borderColor: "transparent",
        borderRadius: 10,
        style: { color: "#f1f5f9", zIndex: 9999 },
        pointFormat: "<b>{point.name}</b>: {point.y} ({point.percentage:.1f}%)",
      },
      plotOptions: {
        pie: {
          innerSize: "70%",
          borderWidth: 0,
          dataLabels: { enabled: false },
          showInLegend: false,
        },
      },
      series: [
        {
          type: "pie",
          name: "Follow-ups",
          data: fb.map((f) => ({
            name: fuMeta(f.status).label,
            y: f.count,
            color: fuMeta(f.status).color,
          })),
        },
      ],
    }),
    [fb],
  );

  const barOpts = useMemo(
    (): Highcharts.Options => ({
      chart: {
        type: "bar",
        backgroundColor: "transparent",
        style: { fontFamily: "inherit" },
        height: 220,
      },
      title: { text: undefined },
      credits: { enabled: false },
      xAxis: {
        categories: cd.map((c) =>
          c.companyName.length > 22
            ? c.companyName.slice(0, 22) + "…"
            : c.companyName,
        ),
        labels: { style: { color: "#64748b", fontSize: "11px", fontWeight: "600" } },
        lineColor: "transparent",
        tickColor: "transparent",
      },
      yAxis: {
        title: { text: null },
        labels: { style: { color: "#64748b", fontSize: "10px" } },
        gridLineColor: "rgba(148, 163, 184, 0.15)",
      },
      legend: { enabled: false },
      plotOptions: {
        bar: {
          borderRadius: 8,
          borderWidth: 0,
          colorByPoint: false,
          color: "#7c3aed",
        },
      },
      series: [
        { type: "bar", name: "Policies", data: cd.map((c) => c.policyCount) },
      ],
    }),
    [cd],
  );

  return (
    <div className="min-h-screen bg-[#F3F6FF] dark:bg-[#0d1117] p-3 sm:p-4 space-y-4 w-full max-w-full overflow-x-hidden box-border">
      {/* Breadcrumb */}


      {/* HEADER */}
      <div
        className="rounded-3xl shadow-xl relative"
        style={{
          background:
            "linear-gradient(135deg,#4f46e5 0%,#7c3aed 55%,#a855f7 100%)",
        }}
      >
        <div className="relative px-6 py-6 rounded-3xl">
          <div
            className="absolute inset-0 opacity-10 rounded-3xl overflow-hidden pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle,white 1px,transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />

          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-3xl bg-white/15 border border-white/15 flex items-center justify-center shadow-lg">
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Insurance Renewal Dashboard
                </h1>
                <p className="text-white/75 text-sm mt-1">
                  Policies · Renewals · Payments · Follow-ups · Reminders
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/15 border border-white/15 rounded-2xl px-4 py-2">
              <span className="w-4 h-4 rounded-full bg-[#10b981]/25 flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
              </span>
              <span className="text-white font-bold text-sm">
                Live ·{" "}
                {new Date().toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Filter strip */}
          <div className="relative mt-6 bg-white/12 border border-white/15 rounded-3xl px-5 py-4 flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-3 text-white/90 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="flex items-center gap-2">
                <Search size={16} />
                Filter
              </span>
            </div>
            <div className="relative">
              <Ainput
                type="date"
                title="From Date"
                name="fromDate"
                value={fromDate}
                labelClass="!text-white font-bold text-xs"
                handleInputChange={(_n, v) => {
                  const formatted = String(v || "").trim();
                  setFromDate(formatted);
                }}
                className="!h-10 !rounded-2xl !text-sm"
                onInput={() => { }}
                redlabel="*"
              />
            </div>

            <div className="relative">
              <Ainput
                type="date"
                title="To Date"
                name="toDate"
                value={toDate}
                labelClass="!text-white font-bold text-xs"
                handleInputChange={(_n, v) => {
                  const formatted = String(v || "").trim();
                  setToDate(formatted);
                }}
                className="!h-10 !rounded-2xl !text-sm"
                onInput={() => { }}
                redlabel="*"
              />
            </div>

            <style>{`
              .react-datepicker-popper {
                z-index: 999999 !important;
              }
              .react-datepicker {
                font-family: inherit !important;
                border-radius: 16px !important;
                border: 1px solid #e2e8f0 !important;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
                overflow: hidden !important;
                background-color: #ffffff !important;
                color: #1e293b !important;
              }
              .react-datepicker__header {
                background-color: #f8fafc !important;
                border-bottom: 1px solid #e2e8f0 !important;
                padding: 12px 0 8px 0 !important;
              }
              .react-datepicker__current-month {
                font-weight: 800 !important;
                font-size: 0.95rem !important;
                color: #0f172a !important;
                margin-bottom: 6px !important;
              }
              .react-datepicker__day-names {
                display: flex !important;
                justify-content: space-around !important;
                padding: 0 6px !important;
                margin-bottom: -4px !important;
              }
              .react-datepicker__day-name {
                font-weight: 700 !important;
                color: #64748b !important;
                width: 2rem !important;
                line-height: 2rem !important;
                margin: 0.1rem !important;
              }
              .react-datepicker__month {
                margin: 0.5rem !important;
              }
              .react-datepicker__week {
                display: flex !important;
                justify-content: space-around !important;
              }
              .react-datepicker__day {
                width: 2rem !important;
                line-height: 2rem !important;
                border-radius: 8px !important;
                font-weight: 600 !important;
                color: #1e293b !important;
                margin: 0.1rem !important;
              }
              .react-datepicker__day span,
              .react-datepicker__day-name span,
              .react-datepicker__header span,
              .react-datepicker span {
                color: inherit !important;
              }
              .react-datepicker__day--selected,
              .react-datepicker__day--keyboard-selected {
                background-color: #4f46e5 !important;
                color: #ffffff !important;
                font-weight: 800 !important;
              }
              .react-datepicker__day:hover {
                background-color: #e0e7ff !important;
                color: #4338ca !important;
              }
              .react-datepicker__day--outside-month {
                color: #cbd5e1 !important;
                opacity: 0.6 !important;
              }
              .react-datepicker__navigation {
                top: 12px !important;
              }
              .react-datepicker__navigation-icon::before {
                border-color: #475569 !important;
                border-width: 2px 2px 0 0 !important;
              }
            `}</style>

            <button
              onClick={() => {
                setAppliedFromDate(fromDate);
                setAppliedToDate(toDate);
                fetchDash(fromDate, toDate);
              }}
              disabled={loading}
              className="h-10 px-8 rounded-2xl bg-white text-indigo-700 font-black text-sm shadow
    hover:bg-white/90 
    dark:bg-black dark:text-white dark:hover:bg-gray-900
    disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader size={16} className="animate-spin" /> Loading…
                </span>
              ) : (
                "Apply"
              )}
            </button>

            {(fromDate !== defaultFrom || toDate !== defaultTo || appliedFromDate !== defaultFrom || appliedToDate !== defaultTo) && (
              <button
                onClick={() => {
                  setFromDate(defaultFrom);
                  setToDate(defaultTo);
                  setAppliedFromDate(defaultFrom);
                  setAppliedToDate(defaultTo);
                  fetchDash(defaultFrom, defaultTo);
                }}
                className="h-10 px-4 rounded-2xl border border-white/25 text-white text-sm font-bold hover:bg-white/10 transition inline-flex items-center gap-2"
              >
                <X size={16} /> Reset
              </button>
            )}

            {cfg && (
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs font-black text-white bg-white/15 border border-white/15 rounded-full px-4 py-2">
                  Before: {cfg.beforeDays}d
                </span>
                <span className="text-xs font-black text-white bg-white/15 border border-white/15 rounded-full px-4 py-2">
                  After: {cfg.afterDays}d
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-red-700 dark:text-red-300">
              Error
            </div>
            <div className="text-xs text-red-600 dark:text-red-400 truncate">
              {error}
            </div>
          </div>
          <button
            onClick={() => fetchDash(appliedFromDate, appliedToDate)}
            className="text-xs font-bold text-red-600 dark:text-red-400 underline shrink-0 hover:opacity-80 flex items-center gap-1"
          >
            <RotateCcw size={12} />
            Retry
          </button>
        </div>
      )}

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <Sk key={i} />)
          : cards.map((c, i) => <StatCard key={i} c={c} />)}
      </div>

      {/* REMINDER BANNER */}
      {!loading && r && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 w-full max-w-full">
          {[
            {
              val: r.beforeExpiry,
              icon: Clock,
              label: "Before Expiry Reminders",
              desc: (appliedFromDate && appliedToDate) ? "Expiring in selected month" : `Expiring in next ${r.beforeDays} days`,
              grad: "linear-gradient(135deg,#FF9E45 0%,#FF6011 100%)",
              onClick: () =>
                openDlg(
                  "Before Expiry Reminders List",
                  dash?.tables?.beforeExpiryReminders || [],
                  REMINDER_COLS
                ),
            },
            {
              val: r.afterExpiry,
              icon: AlertCircle,
              label: "After Expiry Reminders",
              desc: (appliedFromDate && appliedToDate) ? "Expired in selected month" : `Expired in last ${r.afterDays} days`,
              grad: "linear-gradient(135deg,#FF557F 0%,#FF1C3B 100%)",
              onClick: () =>
                openDlg(
                  "After Expiry Reminders List",
                  dash?.tables?.afterExpiryReminders || [],
                  REMINDER_COLS
                ),
            },
            {
              val: r.totalDue,
              icon: Bell,
              label: "Total Reminders Due",
              desc: "Vehicles pending follow-up",
              grad: "linear-gradient(135deg,#7C55FF 0%,#3B1CFF 100%)",
              onClick: () =>
                openDlg(
                  "Total Reminders Due List",
                  dash?.tables?.totalReminders || [],
                  REMINDER_COLS
                ),
            },
          ].map((rem) => {
            const RemIcon = rem.icon;
            return (
              <div
                key={rem.label}
                onClick={rem.onClick}
                className="rounded-3xl overflow-hidden shadow-xl cursor-pointer hover:opacity-95 hover:scale-[1.01] transition-all"
                style={{ background: rem.grad }}
              >
                <div className="relative p-6 overflow-hidden">
                  <div className="absolute right-0 top-0 w-44 h-44 rounded-full bg-white/15 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
                  <div className="relative">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/20 flex items-center justify-center">
                        <RemIcon size={22} className="text-white" />
                      </div>
                      <div className="text-5xl font-black text-white leading-none">
                        {rem.val}
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-base font-black text-white">
                        {rem.label}
                      </div>
                      <div className="text-xs text-white/90 mt-1 font-semibold">
                        {rem.desc}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PAYMENT SUMMARY */}
      {!loading && p && (
        <div className="rounded-3xl bg-white dark:bg-[#161b22] shadow-sm overflow-hidden">
          <SecHd
            icon={DollarSign}
            title="Payment Summary"
            sub="Approval breakdown & revenue metrics · Click any item to view detailed records"
          />
          <div className="p-5 grid grid-cols-12 gap-5">
            <div className="col-span-12 lg:col-span-7 space-y-6">
              <PRow
                label="Approved"
                count={p.approvedCount}
                amount={p.totalCollectedAmount}
                maxCount={payTotal}
                color="#16a34a"
                onClick={() =>
                  openDlg(
                    "Approved Payments List",
                    dash?.tables?.approvedPayments || [],
                    PAYMENT_COLS
                  )
                }
              />
              <PRow
                label="Pending Approval"
                count={p.pendingCount}
                amount={p.totalPendingAmount}
                maxCount={payTotal}
                color="#f59e0b"
                onClick={() =>
                  openDlg(
                    "Pending Approval Payments List",
                    dash?.tables?.pendingPayments || [],
                    PAYMENT_COLS
                  )
                }
              />
              <PRow
                label="Rejected"
                count={p.rejectedCount}
                amount={p.totalRejectedAmount}
                maxCount={payTotal}
                color="#e11d48"
                onClick={() =>
                  openDlg(
                    "Rejected Payments List",
                    dash?.tables?.rejectedPayments || [],
                    PAYMENT_COLS
                  )
                }
              />
            </div>

            <div className="col-span-12 lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PayTile
                icon={DollarSign}
                title="COLLECTED"
                value={fmtMoney(p.totalCollectedAmount)}
                bg="bg-[#EFFAF2] dark:bg-emerald-950/10"
                border="border-[#BFE8CB] dark:border-emerald-900/30 dark:text-black"
                color="#16a34a"
                onClick={() =>
                  openDlg(
                    "Approved / Collected Payments List",
                    dash?.tables?.approvedPayments || [],
                    PAYMENT_COLS
                  )
                }
              />

              <PayTile
                icon={XCircle}
                title="REJECTED"
                value={String(p.rejectedCount)}
                bg="bg-[#FFF0F2] dark:bg-rose-950/10"
                border="border-[#FFD2D7] dark:border-rose-900/30 dark:text-black"
                color="#e11d48"
                onClick={() =>
                  openDlg(
                    "Rejected Payments List",
                    dash?.tables?.rejectedPayments || [],
                    PAYMENT_COLS
                  )
                }
              />

              <PayTile
                icon={CheckCircle}
                title="APPROVED"
                value={String(p.approvedCount)}
                bg="bg-[#EFFAF2] dark:bg-emerald-950/10"
                border="border-[#BFE8CB] dark:border-emerald-900/30 dark:text-black"
                color="#16a34a"
                onClick={() =>
                  openDlg(
                    "Approved Payments List",
                    dash?.tables?.approvedPayments || [],
                    PAYMENT_COLS
                  )
                }
              />

              <PayTile
                icon={Hourglass}
                title="PENDING"
                value={String(p.pendingCount)}
                bg="bg-[#FFF7E6] dark:bg-amber-950/10"
                border="border-[#F3D29A] dark:border-amber-900/30 dark:text-black"
                color="#d97706"
                onClick={() =>
                  openDlg(
                    "Pending Approval Payments List",
                    dash?.tables?.pendingPayments || [],
                    PAYMENT_COLS
                  )
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* CHARTS */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 lg:col-span-6 rounded-3xl bg-white dark:bg-[#161b22] shadow-sm overflow-hidden">
          <SecHd
            icon={PieChart}
            title="Follow-up Breakdown"
            sub="Status distribution of all followups"
            badge={
              fb.length
                ? { label: `${fbTotal} total`, color: "#16a34a" }
                : undefined
            }
          />
          <div className="p-5">
            {loading ? (
              <Sk h="h-56" />
            ) : fb.length ? (
              <div className="grid grid-cols-12 gap-5 items-center">
                <div className="col-span-12 sm:col-span-5 relative">
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                    <div className="text-3xl font-black text-gray-900 dark:text-white">
                      {fbTotal}
                    </div>
                    <div className="text-sm font-bold text-gray-400">total</div>
                  </div>
                  <HighchartsReact
                    highcharts={Highcharts}
                    options={donutOpts}
                  />
                </div>
                <div className="col-span-12 sm:col-span-7 space-y-3">
                  {fb.map((f) => {
                    const pct = Math.round((f.count / fbTotal) * 100);
                    const m = fuMeta(f.status);
                    const I = m.icon;
                    return (
                      <div
                        key={f.status}
                        className="rounded-2xl bg-gray-50 dark:bg-white/5 p-3 border border-gray-100 dark:border-white/10"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-8 h-8 rounded-xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center">
                              <I size={16} style={{ color: m.color }} />
                            </span>
                            <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                              {m.label}
                            </div>
                          </div>
                          <div className="text-sm font-black text-gray-900 dark:text-white shrink-0">
                            {f.count}{" "}
                            <span className="text-gray-400 font-bold">
                              ({pct}%)
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-gray-200/70 dark:bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: m.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-gray-400">
                No followup data
              </div>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 rounded-3xl bg-white dark:bg-[#161b22] shadow-sm overflow-hidden border border-gray-100 dark:border-white/10">
          <SecHd
            icon={Building2}
            title="Top Insurers"
            sub="By policy count"
            badge={
              cd.length
                ? { label: `Top ${cd.length}`, color: "#2563eb" }
                : undefined
            }
          />
          <div className="p-5">
            {loading ? (
              <Sk h="h-56" />
            ) : cd.length ? (
              <div className="space-y-4">
                {cd.slice(0, 1).map((c, idx) => {
                  const maxV = cd[0]?.policyCount || 1;
                  const pct = Math.round((c.policyCount / maxV) * 100);
                  return (
                    <div
                      key={c.companyName}
                      className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-black flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-black text-gray-900 dark:text-white truncate">
                              {c.companyName}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xl font-black text-indigo-700 dark:text-indigo-300">
                            {c.policyCount}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                            {fmtMoney(c.totalPremium)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 h-3 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/40 dark:bg-white/[0.02] p-2">
                  <HighchartsReact highcharts={Highcharts} options={barOpts} />
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-gray-400">
                No insurer data
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── INLINE DRILLDOWN TABLE (appears on card click) ────────────── */}
      {activeTable && (
        <div
          ref={inlineTableRef}
          className="rounded-3xl border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-[#161b22] shadow-lg overflow-hidden w-full max-w-full min-w-0"
          style={{ scrollMarginTop: "16px" }}
        >
          {/* Header */}
          <div
            className="px-5 py-4 flex items-center justify-between gap-3"
            style={{ background: "linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/20 flex items-center justify-center">
                <FileText size={16} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-black text-white">{activeTable.title}</div>
                <div className="text-white/70 text-[11px] mt-0.5">
                  {activeTable.data.length} record{activeTable.data.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveTable(null)}
              className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center transition"
              title="Close"
            >
              <X size={15} className="text-white" />
            </button>
          </div>

          {/* Table */}
          <div className="p-3 sm:p-4 bg-[#F3F6FF] dark:bg-[#0d1117] w-full max-w-full min-w-0 overflow-hidden">
            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161b22] p-3 sm:p-4 w-full max-w-full min-w-0 overflow-hidden">
              <DataTable
                title=""
                columns={activeTable.cols}
                data={activeTable.data}
                selectValue="UTD"
                height="420px"
                filterPosition="FilterData"
                onRowDoubleClick={() => { }}
              />
            </div>
          </div>
        </div>
      )}

      {/* EXPIRING SOON */}
      <div ref={expiringSoonRef} className="rounded-3xl bg-white dark:bg-[#161b22] shadow-sm overflow-hidden">
        <SecHd
          icon={Zap2}
          title="Expiring Soon (Next 30 Days)"
          sub="Policies expiring in next 30 days · Double-click for details"
          badge={
            ex.length
              ? { label: `${ex.length} records`, color: "#f97316" }
              : undefined
          }
        />

        {loading ? (
          <div className="p-5 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Sk key={i} h="h-16" />
            ))}
          </div>
        ) : ex.length ? (
          <div className="p-5 space-y-2 max-h-[440px] overflow-auto">
            {ex.map((row, i) => (
              <div
                key={row.UTD ?? i}
                onDoubleClick={() =>
                  openDlg(`Policy — ${row.VEHICAL_REG_NO}`, [row], EXPIRY_COLS)
                }
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border
                  border-gray-100 dark:border-white/10 bg-white dark:bg-[#161b22]/40
                  px-4 py-4 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-500 dark:text-gray-400 flex items-center justify-center text-sm font-semibold shrink-0">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      {row.VEHICAL_REG_NO || "—"}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {row.CUST_NAME || "—"}
                      {row.CUST_MOB_NO ? ` · ${row.CUST_MOB_NO}` : ""}
                    </div>
                  </div>
                </div>

                <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 truncate max-w-[160px]">
                  {row.POLICY_NAME || "—"}
                </div>

                <FuBadge status={row.LAST_FOLLOWUP_STATUS} />

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-medium text-gray-400 dark:text-gray-300">
                    {row.POLICY_END_DATE || "—"}
                  </span>
                  <ExpiryBadge days={si(row.DAYS_TO_EXPIRY)} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-44 flex flex-col items-center justify-center gap-2 text-gray-400">
            <span className="text-4xl"></span>
            <span className="text-sm font-semibold">
              No policies expiring in next 30 days
            </span>
          </div>
        )}
      </div>

    </div>
  );
}
