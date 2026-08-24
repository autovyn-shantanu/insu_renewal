"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import DataTable from "@/components/Templates/reactTable";
import Ainput from "@/components/atoms/Input";
import HashloaderComponent from "@/components/Templates/hashloader";
import { useCurrentUser } from "@/app/hooks/use-current-user";

import {
  X,
  User,
  Phone,
  MapPin,
  LayoutGrid,
  PhoneCall,
  History,
  Bot,
  Clock3,
  CarFront,
  Shield,
  FileText,
  CalendarDays,
  MessageSquareText,
  Building2,
  BadgeIndianRupee,
  PhoneOff,
  PhoneForwarded,
  XCircle,
  CheckCircle2,
  Zap,
  Clock,
  PencilLine,
  Save,
  CalendarCheck2,
  Wrench,
  Copy,
  CirclePlay,
  PlayCircle,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Mic,
  Inbox,
  MessageSquare,
  RotateCcw,
} from "lucide-react";

// ============================================================
// HELPERS
// ============================================================
function showSideAlert(message: string, type: "success" | "error" | "warning") {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
  });
  Toast.fire({ icon: type, title: message });
}

function ymdToDmy(ymd?: string | null) {
  if (!ymd) return "";
  const s = String(ymd).trim().split("T")[0].split(" ")[0];
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(ymd);
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function ymdToMdy(ymd?: string | null) {
  if (!ymd) return "";
  const m = String(ymd).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(ymd);
  const mm = Number(m[2]);
  const dd = Number(m[3]);
  return `${mm}/${dd}/${m[1]}`;
}

function time24To12(t?: string | null) {
  if (!t) return "";
  const m = String(t).match(/^(\d{2}):(\d{2})$/);
  if (!m) return String(t);
  let hh = Number(m[1]);
  const mm = m[2];
  const ampm = hh >= 12 ? "PM" : "AM";
  hh = hh % 12;
  if (hh === 0) hh = 12;
  return `${hh}:${mm} ${ampm}`;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

function todayYMD() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function tomorrowYMD() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

const normalizeVeh = (v: any) =>
  String(v || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .trim();

const ymdOnly = (v: any) => {
  if (!v) return "";
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return s;
};

function safeJsonParse(v: any) {
  if (v === null || v === undefined) return null;
  if (typeof v === "object") return v;
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}

function prettyJson(v: any) {
  const parsed = safeJsonParse(v);
  if (parsed === null || parsed === undefined) return "";
  if (typeof parsed === "string") return parsed;
  try {
    return JSON.stringify(parsed, null, 2);
  } catch {
    return String(parsed);
  }
}

// ============================================================
// STATUS + UI
// ============================================================
const FOLLOWUP_STATUSES = [
  { value: "PROMISED", label: "PROMISED" },
  { value: "PENDING", label: "PENDING " },
  { value: "NOT_INTERESTED", label: "NOT INTERESTED" },
  { value: "RENEWED", label: "RENEWED" },
];

function statusPillClass(status: string) {
  switch (status) {
    case "RENEWED":
      return "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800";
    case "NOT_INTERESTED":
      return "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800";
    case "PENDING":
      return "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-green-800";
    default:
      return "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800";
  }
}

type TabType = "info" | "followup" | "history" | "aiCalling";
type ActionType = "NONE" | "NO_ANSWER" | "CALL_LATER" | "CLOSE" | "RENEWED";

const TabButton = ({
  label,
  icon,
  active,
  onClick,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold
      transition-all duration-150 whitespace-nowrap rounded-xl border
      ${disabled
        ? "opacity-50 cursor-not-allowed border-transparent text-gray-400 dark:text-gray-500"
        : active
          ? "border-primary bg-blue-50 text-primary dark:bg-blue-900/10 dark:text-blue-300"
          : "border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
      }`}
  >
    <span className="inline-flex items-center justify-center">{icon}</span>
    <span>{label}</span>
  </button>
);

const SectionTitle = ({ title, icon }: { title: string; icon: string }) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="text-sm">{icon}</span>
    <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">
      {title}
    </h3>
    <div className="flex-1 h-px bg-gray-200 dark:bg-borderColor-dark" />
  </div>
);

const InfoRow = ({ label, value }: { label: string; value: any }) => (
  <div className="flex justify-between items-center py-2 border-b last:border-0 border-gray-100 dark:border-borderColor-dark">
    <span className="text-[11px] text-gray-500 dark:text-gray-300 min-w-[130px] shrink-0">
      {label}
    </span>
    <span className="text-[11px] text-right dark:text-white font-medium break-all ml-2">
      {value ?? "—"}
    </span>
  </div>
);

const Field = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
      {label}
      {required && <span className="text-exit ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputCls =
  "h-9 w-full rounded-lg border border-gray-300 dark:border-borderColor-dark " +
  "bg-white dark:bg-input px-3 text-sm dark:text-white " +
  "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent " +
  "placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-shadow";

const panelInputCls =
  "h-11 w-full rounded-xl border border-[#E6ECF7] dark:border-borderColor-dark " +
  "bg-white dark:bg-input px-3 text-sm font-semibold text-gray-900 dark:text-white " +
  "focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition";

const ActionBtn = ({
  label,
  active,
  color,
  onClick,
  disabled,
}: {
  label: string;
  active: boolean;
  color: "gray" | "blue" | "amber" | "red" | "green";
  onClick: () => void;
  disabled: boolean;
}) => {
  const colors: Record<string, { base: string; act: string }> = {
    gray: {
      base: "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 dark:bg-white/5 dark:text-gray-300 dark:border-borderColor-dark dark:hover:bg-white/10",
      act: "bg-white text-primary border border-gray-800 dark:bg-gray-700",
    },
    blue: {
      base: "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/40",
      act: "bg-white text-primary border border-blue-600",
    },
    amber: {
      base: "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
      act: "bg-white text-primary border border-amber-600",
    },
    red: {
      base: "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
      act: "bg-white text-primary border border-red-600",
    },
    green: {
      base: "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
      act: "bg-white text-primary  border border-green-600",
    },
  };

  const c = colors[color] ?? colors.gray;

  return (
    <button
      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-150
        ${active ? c.act : c.base}
        ${disabled
          ? "opacity-40 cursor-not-allowed"
          : "cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        }`}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {label}
    </button>
  );
};

// ============================================================
// AI CALLING TAB
// ============================================================
function AiCallingTab({
  row,
  followupForm,
  aiGenerating,
  onGenerateAiCall,
  aiHistoryLoading,
  aiHistoryRows,
  onRefreshHistory,
}: {
  row: any;
  followupForm: any;
  aiGenerating: boolean;
  onGenerateAiCall: () => Promise<void>;
  aiHistoryLoading: boolean;
  aiHistoryRows: any[];
  onRefreshHistory: () => Promise<void>;
}) {
  // Always show only the latest/recent call record
  const selected = aiHistoryRows?.length ? aiHistoryRows[0] : null;
  const [showScript, setShowScript] = useState(true);

  const rawTranscript = selected?.transcript ?? null;
  const summary = selected?.summary ?? null;
  const recordingUrl = selected?.recording_url ?? null;

  const parsedTranscript = useMemo(() => {
    if (!rawTranscript) return [];
    const parsed = safeJsonParse(rawTranscript);
    if (Array.isArray(parsed)) return parsed;
    return [];
  }, [rawTranscript]);

  const handleCopyTranscript = () => {
    if (!parsedTranscript.length) return;
    const textToCopy = parsedTranscript
      .map((t: any) => `${String(t.sender ?? t.role ?? "user").toUpperCase()}: ${t.text ?? t.message ?? ""}`)
      .join("\n");
    navigator.clipboard.writeText(textToCopy);
    showSideAlert("Transcript copied to clipboard", "success");
  };

  const parseCallDate = (ts: any): Date | null => {
    if (!ts) return null;
    try {
      if (typeof ts === "number") {
        const d = ts > 1e11 ? new Date(ts) : new Date(ts * 1000);
        return isNaN(d.getTime()) ? null : d;
      }
      const str = String(ts).trim();
      if (!str) return null;
      if (/^\d+$/.test(str)) {
        const num = Number(str);
        const d = num > 1e11 ? new Date(num) : new Date(num * 1000);
        return isNaN(d.getTime()) ? null : d;
      }
      const d = new Date(str);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  };

  const formatTimestamp = (ts: any) => {
    const d = parseCallDate(ts);
    if (!d) return "";
    let hh = d.getHours();
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    const ampm = hh >= 12 ? "pm" : "am";
    hh = hh % 12;
    if (hh === 0) hh = 12;
    return `${hh}:${mm}:${ss} ${ampm}`;
  };

  const formatCallDate = (ts: any) => {
    const d = parseCallDate(ts);
    if (!d) return "";
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  return (
    <div className="space-y-4">
      {/* AI CALL DETAILS */}
      <div className="rounded-2xl border border-[#DDE6FF] dark:border-borderColor-dark bg-[#F6F8FF] dark:bg-white/5 shadow-sm overflow-hidden p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-lg bg-[#EAF1FF] dark:bg-blue-500/10 inline-flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-blue-600 dark:text-blue-300" />
              </span>
              <div className="text-xs font-black tracking-widest uppercase text-gray-500 dark:text-gray-400">
                AI CALL DETAILS
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400 dark:text-gray-500 font-semibold block text-xs">Customer</span>
                <span className="text-gray-900 dark:text-white font-medium">{row?.CUST_NAME ?? "—"}</span>
              </div>
              <div>
                <span className="text-gray-400 dark:text-gray-500 font-semibold block text-xs">Mobile</span>
                <span className="text-gray-900 dark:text-white font-medium">{row?.CUST_MOB_NO ?? "—"}</span>
              </div>
              <div>
                <span className="text-gray-400 dark:text-gray-500 font-semibold block text-xs">Vehicle</span>
                <span className="text-gray-900 dark:text-white font-medium">{followupForm?.VEHICAL_REG_NO ?? row?.VEHICAL_REG_NO ?? "—"}</span>
              </div>
              <div>
                <span className="text-gray-400 dark:text-gray-500 font-semibold block text-xs">Model</span>
                <span className="text-gray-900 dark:text-white font-medium">{row?.MODEL_NAME ?? "—"}</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center">
            <button
              type="button"
              onClick={onGenerateAiCall}
              disabled={aiGenerating}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold shadow-lg
                bg-[#2F5BFF] hover:bg-[#274CF0] text-white transition cursor-pointer hover:scale-[1.02] active:scale-[0.98]
                ${aiGenerating ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <PhoneCall className="w-4 h-4" />
              {aiGenerating ? "Triggering…" : "Trigger AI Call"}
            </button>
          </div>
        </div>
      </div>

      {/* CALL HISTORY */}
      <div className="rounded-2xl border border-[#E6ECF7] dark:border-borderColor-dark bg-white dark:bg-white/5 shadow-sm overflow-hidden p-5">
        <div className="flex items-center justify-between gap-3 border-b border-[#E6ECF7] dark:border-borderColor-dark pb-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#F5F3FF] dark:bg-purple-500/10 inline-flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-purple-600 dark:text-purple-300" />
            </span>
            <div className="text-xs font-black tracking-widest uppercase text-gray-500 dark:text-gray-400">
              CALL HISTORY
            </div>
          </div>

          <button
            type="button"
            onClick={onRefreshHistory}
            disabled={aiHistoryLoading}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold border
              border-blue-300/70 text-blue-700 bg-white hover:bg-blue-50 transition cursor-pointer
              dark:bg-blue-900/10 dark:text-blue-200 dark:border-blue-900/40 dark:hover:bg-blue-900/20
              ${aiHistoryLoading ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <Clock3 className="w-4 h-4" />
            {aiHistoryLoading ? "Loading…" : "Refresh"}
          </button>
        </div>

        <div>
          {aiHistoryLoading ? (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Loading calling history...
            </div>
          ) : !selected ? (
            <div className="rounded-2xl border border-dashed border-[#D6E4FF] dark:border-white/10 bg-white/50 dark:bg-transparent p-10 flex flex-col items-center justify-center text-center">
              <Bot className="w-10 h-10 text-rose-400 animate-bounce" />
              <div className="mt-4 text-sm font-semibold text-gray-500 dark:text-gray-300">
                Click <b>"Refresh"</b> to fetch call records
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Call Top Details Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-borderColor-dark pb-3">
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-500 dark:text-gray-400">
                  <span className={`px-3 py-1 text-[10px] font-black rounded-full border ${String(selected?.status).toUpperCase() === "COMPLETED"
                    ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]"
                    : "bg-[#FFF1F2] border-[#FECDD3] text-[#BE123C]"
                    }`}>
                    {String(selected?.status || "PENDING").toUpperCase()}
                  </span>

                  <span className="flex items-center gap-1">
                    <span>📱</span>
                    <span>{selected?.phone_number || "—"}</span>
                  </span>

                  <span className="flex items-center gap-1">
                    <span>⏱️</span>
                    <span>{selected?.duration ? `${selected.duration}s` : "—"}</span>
                  </span>

                  <span className="flex items-center gap-1">
                    <span>📅</span>
                    <span>
                      {formatCallDate(selected?.start_time || selected?.triggered_at)}
                      {", "}
                      {formatTimestamp(selected?.start_time || selected?.triggered_at)}
                    </span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowScript(!showScript)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-[#F5DBC4] bg-[#FFF9F2] text-[#C27A3A] hover:bg-[#FFE4D3] transition rounded-lg cursor-pointer"
                >
                  <span>📜</span>
                  {showScript ? "Hide Script" : "View Script"}
                </button>
              </div>

              {/* Summary and End Time */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                  <span className="text-sm font-bold text-gray-400 dark:text-gray-500 sm:w-24 shrink-0">Summary</span>
                  <span className="text-sm font-medium text-gray-800 dark:text-white flex-1 leading-relaxed">
                    {summary ? String(summary) : "The call was triggered successfully."}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-sm font-bold text-gray-400 dark:text-gray-500 sm:w-24 shrink-0">End Time</span>
                  <span className="text-sm font-medium text-gray-800 dark:text-white">
                    {selected?.end_time
                      ? `${formatCallDate(selected.end_time)}, ${formatTimestamp(selected.end_time)}`
                      : "—"}
                  </span>
                </div>
              </div>

              {/* Call Transcript / Script Chat bubbles */}
              {showScript && parsedTranscript.length > 0 && (
                <div className="border-t border-gray-100 dark:border-borderColor-dark pt-4 mt-2">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="text-sm font-bold text-[#7C3AED] dark:text-[#A78BFA] uppercase tracking-wider flex items-center gap-2">
                      <span>📜</span> CALL TRANSCRIPT / SCRIPT
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyTranscript}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-gray-200 dark:border-borderColor-dark bg-white dark:bg-white/5 hover:bg-gray-50 text-gray-600 dark:text-gray-300 rounded-lg cursor-pointer transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </button>
                  </div>

                  <div className="rounded-2xl bg-[#FAFAFE] dark:bg-black/10 border border-[#EBEBFA] p-4 max-h-[300px] overflow-y-auto space-y-4">
                    {parsedTranscript.map((t: any, idx: number) => {
                      const isBot = String(t.sender ?? t.role ?? "").toLowerCase() === "bot";
                      return (
                        <div
                          key={idx}
                          className={`flex w-full ${isBot ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`rounded-2xl p-3 max-w-[85%] sm:max-w-[70%] border shadow-sm ${isBot
                              ? "bg-[#EEF2FF] border-[#C7D2FE] text-gray-900 rounded-tl-none"
                              : "bg-[#ECFDF5] border-[#A7F3D0] text-gray-900 rounded-tr-none"
                              }`}
                          >
                            <div
                              className={`text-[10px] font-bold uppercase ${isBot ? "text-[#4F46E5]" : "text-[#059669]"
                                }`}
                            >
                              {isBot ? "🤖 BOT" : "👤 CUSTOMER"}
                              {t.timestamp ? ` · ${formatTimestamp(t.timestamp)}` : ""}
                            </div>
                            <div className="text-sm font-bold mt-1 text-gray-800 leading-normal whitespace-pre-wrap">
                              {t.text ?? t.message ?? ""}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// CALL HISTORY & TRANSCRIPT UTILITIES
// ────────────────────────────────────────────────────────────
function formatCallDateTime(v: any): string {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  let h = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, "0");
  const ap = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return `${dd}/${mm}/${yyyy}, ${String(h).padStart(2, "0")}:${mins} ${ap}`;
}

type TranscriptMsg = {
  side: "in" | "out";
  text: string;
  speaker?: string;
  time?: string;
};

function tryParseJSON(v: any) {
  if (v == null) return null;
  if (typeof v === "object") return v;
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}

function normalizeSpeaker(s?: any) {
  return String(s || "")
    .toLowerCase()
    .trim();
}

function guessSideFromSpeaker(speaker: string) {
  const s = normalizeSpeaker(speaker);
  if (!s) return null;
  if (
    s.includes("customer") ||
    s.includes("user") ||
    s.includes("callee") ||
    s.includes("client") ||
    s.includes("lead")
  )
    return "in" as const;
  if (
    s.includes("agent") ||
    s.includes("assistant") ||
    s.includes("bot") ||
    s.includes("caller") ||
    s.includes("system")
  )
    return "out" as const;
  return null;
}

function extractTextFromItem(item: any) {
  return (
    item?.text ??
    item?.content ??
    item?.message ??
    item?.utterance ??
    item?.transcript ??
    item?.sentence ??
    item?.value ??
    ""
  );
}

function extractTimeFromItem(item: any) {
  return (
    item?.time ??
    item?.timestamp ??
    item?.startTime ??
    item?.start_time ??
    item?.createdAt ??
    item?.created_at ??
    ""
  );
}

function extractSpeakerFromItem(item: any) {
  return (
    item?.speaker ??
    item?.role ??
    item?.from ??
    item?.name ??
    item?.participant ??
    item?.type ??
    ""
  );
}

function prettyMsgTime(raw?: string) {
  if (!raw) return undefined;
  const s = String(raw).trim();
  if (!s) return undefined;
  const num = Number(s);
  if (Number.isFinite(num) && s.length >= 9) {
    const ms = s.length > 12 ? num : num * 1000;
    const d = new Date(ms);
    if (!isNaN(d.getTime())) {
      let h = d.getHours();
      const m = String(d.getMinutes()).padStart(2, "0");
      const ap = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return `${String(h).padStart(2, "0")}:${m} ${ap}`;
    }
  }
  const d2 = new Date(s);
  if (!isNaN(d2.getTime())) {
    let h = d2.getHours();
    const m = String(d2.getMinutes()).padStart(2, "0");
    const ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${String(h).padStart(2, "0")}:${m} ${ap}`;
  }
  return s.length > 12 ? undefined : s;
}

function transcriptToWhatsappMessages(transcript: any): TranscriptMsg[] {
  if (!transcript) return [];
  const parsed = tryParseJSON(transcript);

  if (Array.isArray(parsed)) {
    let fallbackToggle: "in" | "out" = "in";
    return parsed
      .map((item, idx) => {
        const speaker = extractSpeakerFromItem(item);
        const sideGuess = guessSideFromSpeaker(speaker);
        const text = String(extractTextFromItem(item) || "").trim();
        const side =
          sideGuess ??
          (idx % 2 === 0
            ? fallbackToggle
            : fallbackToggle === "in"
              ? "out"
              : "in");
        if (!sideGuess) fallbackToggle = side === "in" ? "out" : "in";
        return {
          side,
          text: text || safeJsonParse(item) || "—",
          speaker: speaker || undefined,
          time: String(extractTimeFromItem(item) || "").trim() || undefined,
        };
      })
      .filter((m) => m.text && m.text !== "—");
  }

  if (parsed && typeof parsed === "object") {
    const arr =
      (parsed as any).utterances ||
      (parsed as any).messages ||
      (parsed as any).transcript ||
      (parsed as any).data;
    if (Array.isArray(arr)) return transcriptToWhatsappMessages(arr);
    return [{ side: "in", text: prettyJson(parsed) || "—" }];
  }

  const str = String(parsed || "").trim();
  if (!str) return [];
  return [{ side: "in", text: str }];
}

const WhatsappTranscript = ({ transcript }: { transcript: any }) => {
  const msgs = useMemo(
    () => transcriptToWhatsappMessages(transcript),
    [transcript],
  );

  if (!msgs.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <MessageSquare size={26} className="text-slate-300 mb-2" />
        <div className="text-xs text-slate-500">No transcript found.</div>
      </div>
    );
  }

  return (
    <div className="max-h-[380px] overflow-y-auto rounded-lg bg-[#EFEAE2] dark:bg-[#1f2937] p-3 space-y-2.5">
      {msgs.map((m, idx) => {
        const isOut = m.side === "out";
        const t = prettyMsgTime(m.time);
        return (
          <div
            key={idx}
            className={`flex ${isOut ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`relative max-w-[85%] sm:max-w-[70%] px-3 py-2 text-[12.5px] leading-[1.5] shadow-sm
              ${isOut
                  ? "bg-[#D9FDD3] text-slate-900 rounded-xl rounded-tr-[3px]"
                  : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl rounded-tl-[3px]"
                }`}
            >
              {m.speaker ? (
                <div
                  className={`text-[10px] font-bold mb-0.5 capitalize ${isOut ? "text-emerald-700 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-300"}`}
                >
                  {m.speaker}
                </div>
              ) : null}
              <div className="whitespace-pre-wrap break-words">{m.text}</div>
              {t ? (
                <div className="mt-0.5 text-[9.5px] text-slate-500 dark:text-slate-400 text-right leading-none">
                  {t}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

type CallPanelType = "recording" | "transcript" | "summary" | null;

const CallSubPanel = ({
  type,
  row,
  customer,
  user,
  streamBaseUrl,
  onClose,
}: {
  type: CallPanelType;
  row: any;
  customer: any;
  user: any;
  streamBaseUrl: string;
  onClose: () => void;
}) => {
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string>("");
  const [audioErr, setAudioErr] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const loadAudio = async () => {
      if (type !== "recording" || !row?.call_id) return;
      try {
        setAudioErr("");
        setAudioSrc("");
        setAudioLoading(true);
        const mob = customer?.CUST_MOB_NO || row?.phone_number || "";
        const url = `${streamBaseUrl}/${encodeURIComponent(row.call_id)}?mob_no=${encodeURIComponent(mob)}`;
        const res = await axios.get(url, {
          responseType: "blob",
          headers: {
            accept: "audio/mpeg",
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        });
        if (cancelled) return;
        setAudioSrc(URL.createObjectURL(res.data));
      } catch (e: any) {
        if (cancelled) return;
        setAudioErr(
          e?.response?.data?.Message || e?.message || "Recording load failed",
        );
      } finally {
        if (!cancelled) setAudioLoading(false);
      }
    };
    loadAudio();
    return () => {
      cancelled = true;
      if (audioSrc) URL.revokeObjectURL(audioSrc);
    };
  }, [type, row?.call_id]);

  if (!type) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-white dark:bg-[#111827] rounded-xl shadow-2xl border border-slate-200 dark:border-borderColor-dark overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2 text-[13px] font-bold text-slate-700 dark:text-slate-200">
            {type === "recording" && (
              <>
                <CirclePlay size={16} className="text-violet-600 dark:text-violet-400" /> Call Recording
              </>
            )}
            {type === "transcript" && (
              <>
                <MessageSquare size={16} className="text-indigo-600 dark:text-indigo-400" /> Call Transcript
              </>
            )}
            {type === "summary" && (
              <>
                <BarChart2 size={16} className="text-blue-600 dark:text-blue-400" /> Call Summary
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition"
          >
            <X size={14} />
          </button>
        </div>

        {/* body */}
        <div className="p-4">
          {type === "recording" && (
            <>
              {audioLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500 py-4 justify-center">
                  <span className="w-4 h-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                  Loading recording audio…
                </div>
              ) : audioErr ? (
                <div className="text-sm text-rose-600 flex items-center gap-2 py-2 justify-center">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> {audioErr}
                </div>
              ) : audioSrc ? (
                <div className="space-y-3">
                  <audio controls autoPlay src={audioSrc} className="w-full rounded-lg" />
                  <div className="text-[11px] text-slate-400 text-center font-mono">
                    Call ID: {row?.call_id}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-slate-400 py-4 justify-center">
                  <Mic size={16} /> Recording not available.
                </div>
              )}
            </>
          )}

          {type === "transcript" && (
            <WhatsappTranscript transcript={row?.transcript} />
          )}

          {type === "summary" && (
            <div className="text-[13px] text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed min-h-[60px] p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5">
              {row?.summary ? (
                String(row.summary)
              ) : getCallStatusCategory(row?.status) === "completed" ? (
                <span>The call was completed successfully.</span>
              ) : (
                <span className="text-slate-400">No summary available for this call.</span>
              )}
            </div>
          )}
        </div>

        {/* footer */}
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[12px] font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

function getCallStatusCategory(statusRaw: any): "completed" | "busy" | "no_answer" | "failed" | "other" {
  const s = String(statusRaw || "")
    .toUpperCase()
    .replace(/[-_]/g, " ")
    .trim();
  if (!s) return "other";
  if (s.includes("COMPLETE") || s.includes("SUCCESS")) return "completed";
  if (s.includes("BUSY")) return "busy";
  if (
    s.includes("NO ANSWER") ||
    s.includes("NOANSWER") ||
    s.includes("UNANSWER") ||
    s.includes("NOT ANSWER") ||
    s.includes("MISSED") ||
    s.includes("NOT RESPOND") ||
    s.includes("RING") ||
    s.includes("UNREACHABLE")
  ) {
    return "no_answer";
  }
  if (
    s.includes("FAIL") ||
    s.includes("ERROR") ||
    s.includes("REJECT") ||
    s.includes("DROP") ||
    s.includes("CANCEL") ||
    s.includes("HANGUP") ||
    s.includes("NOT CONNECTED")
  ) {
    return "failed";
  }
  return "other";
}

const CALL_PAGE_SIZE = 10;

const CustomerCallHistoryTab = ({
  row,
  historyLoading,
  historyRows,
  onRefreshHistory,
  user,
  streamBaseUrl,
}: {
  row: any;
  historyLoading: boolean;
  historyRows: any[];
  onRefreshHistory: () => Promise<void>;
  user: any;
  streamBaseUrl: string;
}) => {
  const [page, setPage] = useState(1);
  const [subPanel, setSubPanel] = useState<{
    type: CallPanelType;
    row: any;
  } | null>(null);

  useEffect(() => {
    setPage(1);
  }, [historyRows?.length]);

  const rows = historyRows || [];
  const totalCalls = rows.length;
  const completed = rows.filter(
    (r) => getCallStatusCategory(r?.status) === "completed"
  ).length;
  const busy = rows.filter(
    (r) => getCallStatusCategory(r?.status) === "busy"
  ).length;
  const noAnswer = rows.filter(
    (r) => getCallStatusCategory(r?.status) === "no_answer"
  ).length;
  const failed = rows.filter(
    (r) => getCallStatusCategory(r?.status) === "failed"
  ).length;
  const appointments = rows.filter(
    (r) =>
      r?.appointment ||
      r?.has_appointment ||
      (r?.summary && String(r.summary).toUpperCase().includes("APPOINTMENT"))
  ).length;
  const totalDurationSec = rows.reduce(
    (acc, r) => acc + (Number(r?.duration) || 0),
    0
  );
  const totalDurationMin = Math.round(totalDurationSec / 60);

  const totalPages = Math.max(1, Math.ceil(rows.length / CALL_PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * CALL_PAGE_SIZE, page * CALL_PAGE_SIZE);

  const stats = [
    {
      label: "Total Calls",
      value: totalCalls,
      color: "text-slate-800 dark:text-white",
    },
    {
      label: "Completed",
      value: completed,
      color: "text-[#16a34a] dark:text-emerald-400",
    },
    {
      label: "Busy",
      value: busy,
      color: "text-[#d97706] dark:text-amber-400",
    },
    {
      label: "No Answer",
      value: noAnswer,
      color: "text-slate-700 dark:text-slate-300",
    },
    {
      label: "Failed",
      value: failed,
      color: "text-[#dc2626] dark:text-rose-400",
    },
    {
      label: "Appointments",
      value: appointments,
      color: "text-[#2563eb] dark:text-blue-400",
    },
    {
      label: "Total Duration",
      value: `${totalDurationMin} min`,
      color: "text-slate-800 dark:text-white",
    },
  ];

  return (
    <div className="space-y-4">
      {/* ── STATS ROW (7 Cards matching screenshot) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {stats.map((s, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center py-3 px-2 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-white/5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-sm transition-all"
          >
            <div className={`text-[22px] font-bold leading-tight ${s.color}`}>
              {s.value}
            </div>
            <div className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-1 text-center">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── CALL HISTORY TABLE ── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-white/5 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <PhoneCall size={16} className="text-slate-700 dark:text-slate-300" />
            <span className="text-[14px] font-bold text-slate-800 dark:text-slate-100">
              Customer Call History
            </span>
          </div>

          <button
            type="button"
            onClick={onRefreshHistory}
            disabled={historyLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-[12px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-50 transition cursor-pointer"
          >
            <Clock3 size={13} />
            {historyLoading ? "Loading…" : "Refresh"}
          </button>
        </div>

        <div className="overflow-x-auto">
          {historyLoading ? (
            <div className="flex items-center justify-center gap-3 py-16">
              <span className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <span className="text-sm font-medium text-slate-500">
                Loading call history…
              </span>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-4">
              <Inbox size={36} className="text-slate-300 mb-2" />
              <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                No calls found
              </div>
              <div className="text-xs text-slate-400 mt-1">
                This customer does not have any call records yet.
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-y border-slate-200 dark:border-slate-700/60 bg-transparent">
                  {[
                    "TIME",
                    "TO PHONE NUMBER",
                    "STATUS",
                    "DURATION",
                    "CHANNEL",
                    "RECORDING",
                    "TRANSCRIPT",
                    "SUMMARY",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-[11.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {pageRows.map((r, idx) => {
                  const startVal = r.start_time || r.triggered_at || r.created_at;
                  const hasTranscript = !!(
                    r.transcript && String(r.transcript).length > 5
                  );
                  const hasSummary = !!(
                    (r.summary && String(r.summary).trim().length > 0) ||
                    getCallStatusCategory(r?.status) === "completed"
                  );
                  const category = getCallStatusCategory(r?.status);
                  const rawStatus = String(r?.status || "completed").toLowerCase().replace(/[-_]/g, " ");

                  let statusDot = "#22c55e";
                  let statusTextClass = "text-[#16a34a]";
                  let statusLabel = rawStatus;

                  if (category === "completed") {
                    statusDot = "#22c55e";
                    statusTextClass = "text-[#16a34a]";
                    statusLabel = "completed";
                  } else if (category === "busy") {
                    statusDot = "#f59e0b";
                    statusTextClass = "text-[#d97706]";
                    statusLabel = "busy";
                  } else if (category === "no_answer") {
                    statusDot = "#ef4444";
                    statusTextClass = "text-[#dc2626]";
                    statusLabel = "no answer";
                  } else if (category === "failed") {
                    statusDot = "#ef4444";
                    statusTextClass = "text-[#dc2626]";
                    statusLabel = "failed";
                  } else {
                    statusDot = "#94a3b8";
                    statusTextClass = "text-slate-600 dark:text-slate-400";
                  }

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors text-[13px]"
                    >
                      {/* TIME */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {startVal ? formatCallDateTime(startVal) : "—"}
                      </td>

                      {/* PHONE */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-800 dark:text-white font-medium">
                        {r.phone_number || row?.CUST_MOB_NO || "—"}
                      </td>

                      {/* STATUS */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 font-medium ${statusTextClass}`}>
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: statusDot }}
                          />
                          <span>{statusLabel}</span>
                        </span>
                      </td>

                      {/* DURATION */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {r.duration != null ? `${r.duration} sec` : "0 sec"}
                      </td>

                      {/* CHANNEL */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F3E8FF] text-[#7E22CE] dark:bg-purple-950/50 dark:text-purple-300">
                          AI Call
                        </span>
                      </td>

                      {/* RECORDING */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSubPanel({ type: "recording", row: r })}
                          className="w-7 h-7 rounded-full flex items-center justify-center mx-auto hover:bg-blue-50 dark:hover:bg-blue-900/20 transition cursor-pointer"
                          title="Play Recording"
                        >
                          <PlayCircle
                            size={18}
                            className="text-[#2563eb] hover:text-[#1d4ed8] transition"
                          />
                        </button>
                      </td>

                      {/* TRANSCRIPT */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            hasTranscript &&
                            setSubPanel({ type: "transcript", row: r })
                          }
                          className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto transition ${hasTranscript
                            ? "hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer"
                            : "opacity-35 cursor-not-allowed"
                            }`}
                          title={hasTranscript ? "View Transcript" : "No transcript"}
                          disabled={!hasTranscript}
                        >
                          <MessageSquareText
                            size={17}
                            className={
                              hasTranscript
                                ? "text-[#7c3aed] hover:text-[#6d28d9] transition"
                                : "text-slate-300"
                            }
                          />
                        </button>
                      </td>

                      {/* SUMMARY */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            hasSummary &&
                            setSubPanel({ type: "summary", row: r })
                          }
                          className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto transition ${hasSummary
                            ? "hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer"
                            : "opacity-35 cursor-not-allowed"
                            }`}
                          title={hasSummary ? "View Summary" : "No summary"}
                          disabled={!hasSummary}
                        >
                          <BarChart2
                            size={17}
                            className={
                              hasSummary
                                ? "text-[#c026d3] hover:text-[#a21caf] transition"
                                : "text-slate-300"
                            }
                          />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── FOOTER / PAGINATION ── */}
        {rows.length > 0 && (
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-borderColor-dark bg-white dark:bg-white/5 flex items-center justify-between gap-3">
            <div className="text-[12px] font-normal text-slate-500 dark:text-slate-400">
              Showing {Math.min((page - 1) * CALL_PAGE_SIZE + 1, rows.length)} to{" "}
              {Math.min(page * CALL_PAGE_SIZE, rows.length)} of {rows.length}{" "}
              results
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-md border border-slate-200 dark:border-white/10 text-[12px] font-normal text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={13} /> Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded-md border border-slate-200 dark:border-white/10 text-[12px] font-normal text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sub-panel dialog for recording / transcript / summary */}
      {subPanel && (
        <CallSubPanel
          type={subPanel.type}
          row={subPanel.row}
          customer={row}
          user={user}
          streamBaseUrl={streamBaseUrl}
          onClose={() => setSubPanel(null)}
        />
      )}
    </div>
  );
};

// ============================================================
// MODAL - WITH FULL DATA INTEGRATION
// ============================================================
type InsuranceRow = any;

const InsuranceDetailModal = ({
  open,
  row,
  activeTab,
  onTabChange,
  onClose,
  followupForm,
  setFollowupForm,
  isSaving,
  onSave,
  historyLoading,
  historyRows,
  onLoadHistory,
  aiGenerating,
  onGenerateAiCall,
  aiHistoryLoading,
  aiHistoryRows,
  onLoadAiHistory,
  user,
  streamBaseUrl,
}: {
  open: boolean;
  row: InsuranceRow | null;
  activeTab: TabType;
  onTabChange: (t: TabType) => void;
  onClose: () => void;
  followupForm: {
    VEHICAL_REG_NO: string;
    FOLLOWUP_DATE: string;
    FOLLOWUP_TIME: string;
    FOLLOWUP_STATUS: string;
    REMARKS: string;
  };
  setFollowupForm: React.Dispatch<
    React.SetStateAction<{
      VEHICAL_REG_NO: string;
      FOLLOWUP_DATE: string;
      FOLLOWUP_TIME: string;
      FOLLOWUP_STATUS: string;
      REMARKS: string;
    }>
  >;
  isSaving: boolean;
  onSave: (
    override?: Partial<{
      FOLLOWUP_DATE: string;
      FOLLOWUP_TIME: string;
      FOLLOWUP_STATUS: string;
      REMARKS: string;
    }>,
  ) => void;
  historyLoading: boolean;
  historyRows: any[];
  onLoadHistory: () => Promise<void>;
  aiGenerating: boolean;
  onGenerateAiCall: () => Promise<void>;
  aiHistoryLoading: boolean;
  aiHistoryRows: any[];
  onLoadAiHistory: () => Promise<void>;
  user?: any;
  streamBaseUrl?: string;
}) => {
  const [activeAction, setActiveAction] = useState<ActionType>("NONE");

  const getReminderStatusColors = (status: string) => {
    const s = String(status || "").toUpperCase();
    if (s.includes("RENEW")) {
      return {
        card: "border-green-250 bg-[#E8F8F5] dark:bg-green-950/20 dark:border-green-900/30",
        pill: "border-green-300 bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-200 dark:border-green-300/25"
      };
    }
    if (s.includes("NOT") || s.includes("CLOSE")) {
      return {
        card: "border-red-200 bg-[#FDF2F2] dark:bg-red-950/20 dark:border-red-900/30",
        pill: "border-red-300 bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200 dark:border-red-300/25"
      };
    }
    if (s.includes("PENDING")) {
      return {
        card: "border-purple-200 bg-[#F5F3FF] dark:bg-purple-950/20 dark:border-purple-900/30",
        pill: "border-purple-300 bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-200 dark:border-purple-300/25"
      };
    }
    // Default PROMISED or others
    return {
      card: "border-[#F3D7B3] bg-[#FFF8F0] dark:bg-amber-950/20 dark:border-amber-900/30",
      pill: "border-[#F2C27A] bg-[#FFE7C2] text-[#A65A00] dark:bg-amber-500/15 dark:text-[#F59E0B]"
    };
  };

  const statusColors = getReminderStatusColors(followupForm.FOLLOWUP_STATUS);

  const [noAnsDate, setNoAnsDate] = useState(tomorrowYMD());
  const [noAnsTime, setNoAnsTime] = useState("");
  const [noAnsRemark, setNoAnsRemark] = useState(
    "No answer – auto follow-up scheduled"
  );

  const [callLaterDate, setCallLaterDate] = useState("");
  const [callLaterTime, setCallLaterTime] = useState("16:00");
  const [callLaterRemark, setCallLaterRemark] = useState(
    "Customer asked to call back"
  );

  const [closeRemark, setCloseRemark] = useState("Not interested");
  const [renewRemark, setRenewRemark] = useState("Renewed");

  useEffect(() => {
    setActiveAction("NONE");
    setNoAnsDate(tomorrowYMD());
    setNoAnsTime("");
    setNoAnsRemark("No answer – auto follow-up scheduled");
    setCallLaterDate("");
    setCallLaterTime("16:00");
    setCallLaterRemark("Customer asked to call back");
    setCloseRemark("Not interested");
    setRenewRemark("Renewed");
  }, [row?.UTD, open]);

  if (!open) return null;

  const quickSet = (p: {
    FOLLOWUP_DATE: string;
    FOLLOWUP_STATUS: string;
    REMARKS: string;
    FOLLOWUP_TIME?: string;
  }) => {
    setFollowupForm((prev) => ({
      ...prev,
      FOLLOWUP_DATE: p.FOLLOWUP_DATE,
      FOLLOWUP_TIME: p.FOLLOWUP_TIME ?? prev.FOLLOWUP_TIME,
      FOLLOWUP_STATUS: p.FOLLOWUP_STATUS,
      REMARKS: p.REMARKS,
    }));
  };

  const CallInfoRow = ({
    k,
    v,
    highlight,
  }: {
    k: string;
    v: any;
    highlight?: boolean;
  }) => (
    <div className="py-3 flex items-center justify-between gap-4 border-b border-[#EEF2FF] dark:border-white/10 last:border-b-0">
      <div className="text-sm font-semibold text-gray-500 dark:text-gray-300">
        {k}
      </div>
      <div
        className={[
          "text-sm font-medium text-gray-900 dark:text-white text-right",
          highlight ? "text-blue-600 dark:text-blue-300" : "",
        ].join(" ")}
      >
        {v ?? "—"}
      </div>
    </div>
  );

  const ActionPill = ({
    active,
    onClick,
    disabled,
    icon,
    label,
    variant,
  }: {
    active: boolean;
    onClick: () => void;
    disabled: boolean;
    icon: React.ReactNode;
    label: string;
    variant: "red" | "blue" | "gray" | "green";
  }) => {
    const base =
      "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 border text-sm font-extrabold shadow-sm transition cursor-pointer hover:scale-[1.02] active:scale-[0.98]";

    const styles =
      variant === "red"
        ? active
          ? "bg-[#E11D48] border-[#E11D48] text-white"
          : "border-[#FECDD3] text-[#E11D48] bg-[#FFF5F5] hover:bg-[#FFE4E6]"
        : variant === "blue"
          ? active
            ? "bg-[#2563EB] border-[#2563EB] text-white"
            : "border-[#BFDBFE] text-[#2563EB] bg-[#F0F5FF] hover:bg-[#DBEAFE]"
          : variant === "green"
            ? active
              ? "bg-[#059669] border-[#059669] text-white"
              : "border-[#A7F3D0] text-[#059669] bg-[#F0FDF4] hover:bg-[#D1FAE5]"
            : active
              ? "bg-gray-800 border-gray-800 text-white"
              : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50";

    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={[
          base,
          styles,
          disabled ? "opacity-40 cursor-not-allowed" : "",
        ].join(" ")}
      >
        {icon}
        {label}
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-2 md:p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="
          w-full h-[100dvh] sm:h-auto sm:max-h-[92vh] md:max-h-[90vh] md:max-w-5xl
          flex flex-col overflow-hidden
          rounded-none sm:rounded-2xl border border-gray-200 dark:border-borderColor-dark
          bg-white dark:bg-[#111827] shadow-2xl
          animate-in fade-in zoom-in-95 duration-200
        "
      >
        {/* ===== STICKY TOP AREA (HEADER + TABS) ===== */}
        <div className="shrink-0 sticky top-0 z-20">
          {/* HEADER */}
          <div className="relative overflow-hidden border-b border-white/10">
            <div className="absolute inset-0 bg-gradient-to-br from-[#061735] via-[#0B2A5A] to-[#0A1732]" />
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.10),transparent_40%),radial-gradient(circle_at_80%_35%,rgba(255,255,255,0.10),transparent_45%)]" />
            <div className="relative px-4 sm:px-6 py-4 sm:py-5 text-white">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl sm:text-3xl font-black tracking-wide truncate max-w-[70vw]">
                      {row?.VEHICAL_REG_NO ??
                        followupForm.VEHICAL_REG_NO ??
                        "—"}
                    </h2>

                    {/* Policy Name / Insurer pill */}
                    {row?.POLICY_NAME ? (
                      <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold border border-white/15 bg-white/10">
                        {row.POLICY_NAME}
                      </span>
                    ) : row?.INSURER_NAME ? (
                      <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold border border-white/15 bg-white/10">
                        {row.INSURER_NAME}
                      </span>
                    ) : null}

                    {/* Type pill */}
                    {row?.type ? (
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold border whitespace-nowrap ${String(row.type).toUpperCase().includes("BEFORE")
                            ? "bg-[#F3E8FF] text-[#7C3AED] border-[#DDD6FE] dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/40"
                            : "bg-[#FFF0F2] text-[#E11D48] border-[#FFD2D7] dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/40"
                          }`}
                      >
                        {String(row.type).replace(/_/g, " ").toUpperCase()}
                      </span>
                    ) : null}

                    {/* Status pill */}
                    {followupForm.FOLLOWUP_STATUS ? (
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold border whitespace-nowrap ${String(followupForm.FOLLOWUP_STATUS).toUpperCase().includes("RENEW")
                            ? "bg-[#E8F8F0] text-[#16A34A] border-[#BFE8CB] dark:bg-green-950/60 dark:text-green-300 dark:border-green-800/40"
                            : String(followupForm.FOLLOWUP_STATUS).toUpperCase().includes("NOT") ||
                              String(followupForm.FOLLOWUP_STATUS).toUpperCase().includes("FAILED")
                              ? "bg-[#FFF0F2] text-[#E11D48] border-[#FFD2D7] dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/40"
                              : String(followupForm.FOLLOWUP_STATUS).toUpperCase().includes("PENDING") ||
                                String(followupForm.FOLLOWUP_STATUS).toUpperCase().includes("CALLBACK") ||
                                String(followupForm.FOLLOWUP_STATUS).toUpperCase().includes("BUSY")
                                ? "bg-[#FFF7E6] text-[#D97706] border-[#FCD34D] dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/40"
                                : String(followupForm.FOLLOWUP_STATUS).toUpperCase().includes("AI_CALL") ||
                                  String(followupForm.FOLLOWUP_STATUS).toUpperCase().includes("AI CALL")
                                  ? "bg-[#F3E8FF] text-[#7C3AED] border-[#DDD6FE] dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/40"
                                  : "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE] dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/40"
                          }`}
                      >
                        {String(followupForm.FOLLOWUP_STATUS).replace(/_/g, " ").toUpperCase()}
                      </span>
                    ) : null}
                  </div>

                  {/* sub line */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold text-white/80">
                    <span className="inline-flex items-center gap-2 min-w-0">
                      <User className="w-4 h-4 opacity-90" />
                      <span className="truncate">{row?.CUST_NAME ?? "—"}</span>
                    </span>

                    <span className="inline-flex items-center gap-2">
                      <Phone className="w-4 h-4 opacity-90" />
                      <span className="truncate">
                        {row?.CUST_MOB_NO ?? "—"}
                      </span>
                    </span>



                    {row?.POLICY_NUMBER ? (
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 opacity-90" />
                        <span className="truncate">{row.POLICY_NUMBER}</span>
                      </span>
                    ) : null}
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-10 h-10 shrink-0 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 transition inline-flex items-center justify-center"
                  aria-label="Close"
                  type="button"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* TABS BAR */}
          <div className="bg-white dark:bg-[#111827] border-b border-[#E6ECF7] dark:border-borderColor-dark px-3 sm:px-5 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto">
                <TabButton
                  label="Overview"
                  icon={<LayoutGrid className="w-4 h-4" />}
                  active={activeTab === "info"}
                  onClick={() => onTabChange("info")}
                />
                <TabButton
                  label="AI Call"
                  icon={<Bot className="w-4 h-4" />}
                  active={activeTab === "aiCalling"}
                  onClick={async () => {
                    onTabChange("aiCalling");
                    await onLoadAiHistory();
                  }}
                />
                <TabButton
                  label="Call/Followup"
                  icon={<PhoneCall className="w-4 h-4" />}
                  active={activeTab === "followup"}
                  onClick={() => onTabChange("followup")}
                />


              </div>

              <button
                type="button"
                onClick={async () => {
                  onTabChange("history");
                  await onLoadHistory();
                }}
                className="shrink-0 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold border
                  border-blue-300/70 text-blue-700 bg-white hover:bg-blue-50
                  dark:bg-blue-900/10 dark:text-blue-200 dark:border-blue-900/40 dark:hover:bg-blue-900/20"
                title="All History"
              >
                <Clock3 className="w-4 h-4" />
                All History
              </button>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 sm:py-5 bg-[#F6F8FF] dark:bg-[#111827]">
          {/* ===== OVERVIEW TAB ===== */}
          {activeTab === "info" && (
            <div className="space-y-4">
              {/* METRICS ROW (3 cards) */}
              <div className="grid grid-cols-12 gap-4">
                {/* REMINDER STATUS */}
                <div className={`col-span-12 md:col-span-4 rounded-2xl border p-6 shadow-sm ${statusColors.card}`}>
                  <div className="text-[11px] font-black tracking-widest uppercase text-gray-500/70 dark:text-gray-500">
                    REMINDER STATUS
                  </div>
                  <div className="mt-4">
                    <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-black border ${statusColors.pill}`}>
                      {String(followupForm.FOLLOWUP_STATUS || "—").replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {/* DAYS UNTIL DUE */}
                <div className="col-span-12 md:col-span-4 rounded-2xl border border-[#E4D7FF] dark:border-violet-900/30 bg-[#F2EEFF] dark:bg-violet-900/10 p-6 shadow-sm">
                  <div className="text-[11px] font-black tracking-widest uppercase text-gray-500/70 dark:text-gray-500">
                    DAYS UNTIL DUE
                  </div>
                  <div className="mt-3 text-4xl font-black text-[#16A34A] dark:text-emerald-300">
                    {row?.days != null ? `${row.days}d` : "—"}
                  </div>
                </div>

                {/* POLICY */}
                <div className="col-span-12 md:col-span-4 rounded-2xl border border-[#DDE6FF] dark:border-blue-950 bg-[#EEF4FF] dark:bg-blue-900/10 p-6 shadow-sm">
                  <div className="text-[11px] font-black tracking-widest uppercase text-gray-500/70 dark:text-gray-500">
                    POLICY
                  </div>
                  <div className="mt-2 text-2xl font-black text-[#1E3A8A] dark:text-blue-300">
                    {row?.POLICY_NUMBER ?? "—"}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-semibold truncate">
                    {row?.POLICY_NAME ?? row?.INSURER_NAME ?? "—"} · Expiry {row?.POLICY_END_DATE ? ymdToDmy(row.POLICY_END_DATE) : "—"}
                  </div>
                </div>
              </div>

              {/* 3 INFO CARDS */}
              <div className="grid grid-cols-12 gap-4">
                {/* VEHICLE & CUSTOMER */}
                <div className="col-span-12 md:col-span-4 rounded-2xl border border-[#E6ECF7] dark:border-borderColor-dark bg-white dark:bg-white/5 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 bg-white/70 dark:bg-transparent border-b border-[#E6ECF7] dark:border-borderColor-dark flex items-center gap-2">
                    <span className="w-9 h-9 rounded-xl bg-[#FFEFE1] dark:bg-orange-500/10 inline-flex items-center justify-center">
                      <CarFront className="w-4 h-4 text-orange-600 dark:text-orange-300" />
                    </span>
                    <div className="text-xs font-black tracking-widest uppercase text-gray-600 dark:text-gray-300">
                      VEHICLE & CUSTOMER
                    </div>
                    <div className="ml-2 flex-1 h-px bg-[#E6ECF7] dark:bg-white/10" />
                  </div>

                  <div className="px-4 py-2">
                    {[
                      [
                        "Reg No",
                        row?.VEHICAL_REG_NO ??
                        followupForm.VEHICAL_REG_NO ??
                        "—",
                      ],
                      ["Customer", row?.CUST_NAME ?? "—"],
                      ["Mobile", row?.CUST_MOB_NO ?? "—"],
                      ["Vehicle Model", row?.MODEL_NAME ?? "—"],

                    ].map(([k, v], idx) => (
                      <div
                        key={k}
                        className={[
                          "py-3 flex items-center justify-between gap-4",
                          idx !== 4
                            ? "border-b border-[#EEF2FF] dark:border-white/10"
                            : "",
                        ].join(" ")}
                      >
                        <div className="text-sm font-semibold text-gray-500 dark:text-gray-300">
                          {k}
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white text-right">
                          {v}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* POLICY INFO */}
                <div className="col-span-12 md:col-span-4 rounded-2xl border border-[#E6ECF7] dark:border-borderColor-dark bg-white dark:bg-white/5 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 bg-white/70 dark:bg-transparent border-b border-[#E6ECF7] dark:border-borderColor-dark flex items-center gap-2">
                    <span className="w-9 h-9 rounded-xl bg-[#EAF1FF] dark:bg-blue-500/10 inline-flex items-center justify-center">
                      <Shield className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                    </span>
                    <div className="text-xs font-black tracking-widest uppercase text-gray-600 dark:text-gray-300">
                      POLICY INFO
                    </div>
                    <div className="ml-2 flex-1 h-px bg-[#E6ECF7] dark:bg-white/10" />
                  </div>

                  <div className="px-4 py-2">
                    {[
                      ["Policy Name", row?.POLICY_NAME ?? "—"],
                      ["Policy Number", row?.POLICY_NUMBER ?? "—"],
                      ["Insurer", row?.INSURER_NAME ?? row?.POLICY_NAME ?? "—"],

                    ].map(([k, v], idx) => (
                      <div
                        key={k}
                        className={[
                          "py-3 flex items-center justify-between gap-4",
                          idx !== 3
                            ? "border-b border-[#EEF2FF] dark:border-white/10"
                            : "",
                        ].join(" ")}
                      >
                        <div className="text-sm font-semibold text-gray-500 dark:text-gray-300">
                          {k}
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white text-right">
                          {v}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* POLICY DATES */}
                <div className="col-span-12 md:col-span-4 rounded-2xl border border-[#E6ECF7] dark:border-borderColor-dark bg-white dark:bg-white/5 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 bg-white/70 dark:bg-transparent border-b border-[#E6ECF7] dark:border-borderColor-dark flex items-center gap-2">
                    <span className="w-9 h-9 rounded-xl bg-[#F1ECFF] dark:bg-violet-500/10 inline-flex items-center justify-center">
                      <CalendarDays className="w-4 h-4 text-violet-600 dark:text-violet-300" />
                    </span>
                    <div className="text-xs font-black tracking-widest uppercase text-gray-600 dark:text-gray-300">
                      POLICY DATES
                    </div>
                    <div className="ml-2 flex-1 h-px bg-[#E6ECF7] dark:bg-white/10" />
                  </div>

                  <div className="px-4 py-2">
                    <div className="py-3 flex items-center justify-between gap-4 border-b border-[#EEF2FF] dark:border-white/10">
                      <div className="text-sm font-semibold text-gray-500 dark:text-gray-300">
                        Start Date
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white text-right">
                        {row?.POLICY_START_DATE ? ymdToDmy(row.POLICY_START_DATE) : "—"}
                      </div>
                    </div>

                    <div className="py-3 flex items-center justify-between gap-4 border-b border-[#EEF2FF] dark:border-white/10">
                      <div className="text-sm font-semibold text-gray-500 dark:text-gray-300">
                        End / Expiry Date
                      </div>
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-300 text-right">
                        {row?.POLICY_END_DATE ? ymdToDmy(row.POLICY_END_DATE) : "—"}
                      </div>
                    </div>



                    <div className="py-3 flex items-center justify-between gap-4">
                      <div className="text-sm font-semibold text-gray-500 dark:text-gray-300">
                        Based On
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white text-right">
                        {row?.BASED_ON ?? row?.BASED_TYPE ?? "DATE_BASED"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* MESSAGE */}
              <div className="rounded-2xl border border-[#E6ECF7] dark:border-borderColor-dark bg-white dark:bg-white/5 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-white/70 dark:bg-transparent border-b border-[#E6ECF7] dark:border-borderColor-dark flex items-center gap-2">
                  <span className="w-9 h-9 rounded-xl bg-[#E9FFF2] dark:bg-emerald-500/10 inline-flex items-center justify-center">
                    <MessageSquareText className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                  </span>
                  <div className="text-xs font-black tracking-widest uppercase text-gray-600 dark:text-gray-300">
                    MESSAGE
                  </div>
                  <div className="ml-2 flex-1 h-px bg-[#E6ECF7] dark:bg-white/10" />
                </div>
                <div className="px-4 py-4 text-[12px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {row?.message ?? "—"}
                </div>
              </div>

              {/* Created / Updated */}
              <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 flex flex-wrap gap-x-6 gap-y-2 pt-1">
                <span>
                  Created:{" "}
                  <span className="font-black">
                    {row?.CREATED_AT ?? row?.createdAt ?? "—"}
                  </span>
                </span>
                <span>
                  Updated:{" "}
                  <span className="font-black">
                    {row?.UPDATED_AT ?? row?.updatedAt ?? "—"}
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* ===== FOLLOWUP TAB ===== */}
          {activeTab === "followup" && (
            <div className="space-y-4">
              {/* LAST CALL INFO */}
              <div className="rounded-2xl border border-[#E6ECF7] dark:border-borderColor-dark bg-white dark:bg-white/5 shadow-sm overflow-hidden">
                <div className="px-5 py-4 flex items-center gap-3 border-b border-[#E6ECF7] dark:border-borderColor-dark bg-white/70 dark:bg-transparent">
                  <span className="w-9 h-9 rounded-xl bg-[#FFE7EC] dark:bg-rose-500/10 inline-flex items-center justify-center">
                    <PhoneCall className="w-4 h-4 text-rose-600 dark:text-rose-300" />
                  </span>
                  <div className="text-xs font-black tracking-widest uppercase text-gray-600 dark:text-gray-300 font-bold">
                    LAST CALL INFO
                  </div>
                  <div className="ml-2 flex-1 h-px bg-[#E6ECF7] dark:bg-white/10" />
                </div>

                <div className="px-5 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
                    {/* LEFT */}
                    <div>
                      <div className="py-3 flex items-center justify-between gap-4 border-b border-[#EEF2FF] dark:border-white/10">
                        <div className="text-sm font-semibold text-gray-500 dark:text-gray-300">
                          Call Status
                        </div>
                        <div className="text-sm font-medium text-[#D97706] dark:text-amber-400">
                          {String(followupForm.FOLLOWUP_STATUS || "—").replace(/_/g, " ")}
                        </div>
                      </div>

                      <div className="py-3 flex items-center justify-between gap-4 border-b border-[#EEF2FF] dark:border-white/10">
                        <div className="text-sm font-semibold text-gray-500 dark:text-gray-300">
                          Policy Number
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white text-right">
                          {row?.POLICY_NUMBER ?? "—"}
                        </div>
                      </div>

                      <div className="py-3 flex items-center justify-between gap-4 md:border-b-0 border-b border-[#EEF2FF] dark:border-white/10">
                        <div className="text-sm font-semibold text-gray-500 dark:text-gray-300">
                          Followup Date
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white text-right">
                          {followupForm.FOLLOWUP_DATE
                            ? ymdToDmy(followupForm.FOLLOWUP_DATE)
                            : "—"}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT */}
                    <div>
                      <div className="py-3 flex items-center justify-between gap-4 border-b border-[#EEF2FF] dark:border-white/10">
                        <div className="text-sm font-semibold text-gray-500 dark:text-gray-300">
                          Policy Expiry
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white text-right">
                          {row?.POLICY_END_DATE ? ymdToDmy(row.POLICY_END_DATE) : "—"}
                        </div>
                      </div>

                      <div className="py-3 flex items-center justify-between gap-4 border-b border-[#EEF2FF] dark:border-white/10">
                        <div className="text-sm font-semibold text-gray-500 dark:text-gray-300">
                          Followup Remark
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white text-right truncate max-w-[260px]">
                          {followupForm.REMARKS || "—"}
                        </div>
                      </div>

                      <div className="py-3 flex items-center justify-between gap-4">
                        <div className="text-sm font-semibold text-gray-500 dark:text-gray-300">
                          Insurer
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white text-right">
                          {row?.POLICY_NAME ?? "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTIONS HEADER */}
              <div className="flex items-center gap-2 mt-5">
                <span className="w-7 h-7 rounded-lg bg-[#FFF1C9] dark:bg-amber-500/10 inline-flex items-center justify-center">
                  <Zap className="w-4 h-4 text-amber-700 dark:text-amber-300" />
                </span>
                <div className="text-xs font-black tracking-widest uppercase text-gray-600 dark:text-gray-300 font-bold">
                  ACTIONS
                </div>
                <div className="flex-1 h-px bg-[#E6ECF7] dark:bg-white/10" />
              </div>

              <div className="flex flex-wrap gap-3 mt-3">
                <ActionPill
                  variant="red"
                  active={activeAction === "NO_ANSWER"}
                  disabled={isSaving}
                  onClick={() => {
                    if (activeAction === "NO_ANSWER") {
                      setActiveAction("NONE");
                      setFollowupForm(p => ({ ...p, FOLLOWUP_STATUS: "PROMISED", REMARKS: "" }));
                    } else {
                      setActiveAction("NO_ANSWER");
                      quickSet({
                        FOLLOWUP_DATE: tomorrowYMD(),
                        FOLLOWUP_TIME: "",
                        FOLLOWUP_STATUS: "PENDING",
                        REMARKS: "No answer – auto follow-up scheduled",
                      });
                    }
                  }}
                  icon={<PhoneOff className="w-4 h-4" />}
                  label="No Answer"
                />

                <ActionPill
                  variant="blue"
                  active={activeAction === "CALL_LATER"}
                  disabled={isSaving}
                  onClick={() => {
                    if (activeAction === "CALL_LATER") {
                      setActiveAction("NONE");
                      setFollowupForm(p => ({ ...p, FOLLOWUP_STATUS: "PROMISED", REMARKS: "" }));
                    } else {
                      setActiveAction("CALL_LATER");
                      quickSet({
                        FOLLOWUP_DATE: tomorrowYMD(),
                        FOLLOWUP_TIME: "16:00",
                        FOLLOWUP_STATUS: "PROMISED",
                        REMARKS: "Customer asked to call back",
                      });
                    }
                  }}
                  icon={<PhoneForwarded className="w-4 h-4" />}
                  label="Call Later"
                />

                <ActionPill
                  variant="red"
                  active={activeAction === "CLOSE"}
                  disabled={isSaving}
                  onClick={() => {
                    if (activeAction === "CLOSE") {
                      setActiveAction("NONE");
                      setFollowupForm(p => ({ ...p, FOLLOWUP_STATUS: "PROMISED", REMARKS: "" }));
                    } else {
                      setActiveAction("CLOSE");
                      quickSet({
                        FOLLOWUP_DATE: todayYMD(),
                        FOLLOWUP_TIME: "",
                        FOLLOWUP_STATUS: "NOT_INTERESTED",
                        REMARKS: "Not interested",
                      });
                    }
                  }}
                  icon={<XCircle className="w-4 h-4" />}
                  label="Close"
                />

                <ActionPill
                  variant="green"
                  active={activeAction === "RENEWED"}
                  disabled={isSaving}
                  onClick={() => {
                    if (activeAction === "RENEWED") {
                      setActiveAction("NONE");
                      setFollowupForm(p => ({ ...p, FOLLOWUP_STATUS: "PROMISED", REMARKS: "" }));
                    } else {
                      setActiveAction("RENEWED");
                      quickSet({
                        FOLLOWUP_DATE: todayYMD(),
                        FOLLOWUP_TIME: "",
                        FOLLOWUP_STATUS: "RENEWED",
                        REMARKS: "Renewed",
                      });
                    }
                  }}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  label="Renewed"
                />
              </div>

              {/* CUSTOMIZED ACTIVE ACTION PANEL */}
              <div className="rounded-2xl border border-[#DDE6FF] dark:border-borderColor-dark bg-white dark:bg-white/5 shadow-sm overflow-hidden mt-4">
                {activeAction === "NO_ANSWER" && (
                  <>
                    <div className="px-5 py-4 flex items-center gap-4 border-b border-[#E6ECF7] dark:border-borderColor-dark bg-[#FBFCFF] dark:bg-transparent">
                      <span className="w-10 h-10 rounded-full bg-[#FFE7EC] dark:bg-rose-500/10 inline-flex items-center justify-center shrink-0">
                        <PhoneOff className="w-4 h-4 text-rose-600 dark:text-rose-300" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-base font-black text-gray-900 dark:text-white">
                          No Answer
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-300 font-semibold">
                          Schedule next follow-up automatically.
                        </div>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="flex font-bold mt-1 mb-1 text-xs text-[#193A69] dark:text-[#E2E8F0]">
                            Follow-up Status <span className="text-red-500 ml-0.5">*</span>
                          </label>
                          <select
                            className="h-10 w-full border border-gray-300 dark:border-borderColor-dark rounded-lg px-3 bg-white dark:bg-input text-sm font-semibold text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                            value={followupForm.FOLLOWUP_STATUS}
                            onChange={(e) => setFollowupForm(p => ({ ...p, FOLLOWUP_STATUS: e.target.value }))}
                          >
                            {FOLLOWUP_STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="flex font-bold mt-1 mb-1 text-xs text-[#193A69] dark:text-[#E2E8F0]">
                            Next Follow-up Date <span className="text-red-500 ml-0.5">*</span>
                          </label>
                          <input
                            type="date"
                            className="h-10 w-full border border-gray-300 dark:border-borderColor-dark rounded-lg px-3 bg-white dark:bg-input text-sm font-semibold text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={followupForm.FOLLOWUP_DATE}
                            onChange={(e) => setFollowupForm(p => ({ ...p, FOLLOWUP_DATE: e.target.value }))}
                          />
                        </div>

                        <div>
                          <label className="flex font-bold mt-1 mb-1 text-xs text-[#193A69] dark:text-[#E2E8F0]">
                            Preferred Time
                          </label>
                          <input
                            type="time"
                            className="h-10 w-full border border-gray-300 dark:border-borderColor-dark rounded-lg px-3 bg-white dark:bg-input text-sm font-semibold text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={followupForm.FOLLOWUP_TIME}
                            onChange={(e) => setFollowupForm(p => ({ ...p, FOLLOWUP_TIME: e.target.value }))}
                          />
                        </div>

                        <div>
                          <label className="flex font-bold mt-1 mb-1 text-xs text-[#193A69] dark:text-[#E2E8F0]">
                            Remark
                          </label>
                          <input
                            type="text"
                            className="h-10 w-full border border-gray-300 dark:border-borderColor-dark rounded-lg px-3 bg-white dark:bg-input text-sm font-semibold text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={followupForm.REMARKS}
                            onChange={(e) => setFollowupForm(p => ({ ...p, REMARKS: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => onSave()}
                          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold shadow-lg bg-[#2F5BFF] hover:bg-[#274CF0] text-white disabled:opacity-60 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <Save className="w-4 h-4" />
                          {isSaving ? "Saving..." : "Schedule Follow-Up"}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {activeAction === "CALL_LATER" && (
                  <>
                    <div className="px-5 py-4 flex items-center gap-4 border-b border-[#E6ECF7] dark:border-borderColor-dark bg-[#FBFCFF] dark:bg-transparent">
                      <span className="w-10 h-10 rounded-full bg-[#EAF1FF] dark:bg-blue-500/10 inline-flex items-center justify-center shrink-0">
                        <PhoneForwarded className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-base font-black text-gray-900 dark:text-white">
                          Call Later
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-300 font-semibold">
                          Customer requested a callback — schedule the next call time.
                        </div>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="flex font-bold mt-1 mb-1 text-xs text-[#193A69] dark:text-[#E2E8F0]">
                            Follow-up Status <span className="text-red-500 ml-0.5">*</span>
                          </label>
                          <select
                            className="h-10 w-full border border-gray-300 dark:border-borderColor-dark rounded-lg px-3 bg-white dark:bg-input text-sm font-semibold text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                            value={followupForm.FOLLOWUP_STATUS}
                            onChange={(e) => setFollowupForm(p => ({ ...p, FOLLOWUP_STATUS: e.target.value }))}
                          >
                            {FOLLOWUP_STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="flex font-bold mt-1 mb-1 text-xs text-[#193A69] dark:text-[#E2E8F0]">
                            Call Back Date <span className="text-red-500 ml-0.5">*</span>
                          </label>
                          <input
                            type="date"
                            className="h-10 w-full border border-gray-300 dark:border-borderColor-dark rounded-lg px-3 bg-white dark:bg-input text-sm font-semibold text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={followupForm.FOLLOWUP_DATE}
                            onChange={(e) => setFollowupForm(p => ({ ...p, FOLLOWUP_DATE: e.target.value }))}
                          />
                        </div>

                        <div>
                          <label className="flex font-bold mt-1 mb-1 text-xs text-[#193A69] dark:text-[#E2E8F0]">
                            Call Back Time
                          </label>
                          <input
                            type="time"
                            className="h-10 w-full border border-gray-300 dark:border-borderColor-dark rounded-lg px-3 bg-white dark:bg-input text-sm font-semibold text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={followupForm.FOLLOWUP_TIME}
                            onChange={(e) => setFollowupForm(p => ({ ...p, FOLLOWUP_TIME: e.target.value }))}
                          />
                        </div>

                        <div>
                          <label className="flex font-bold mt-1 mb-1 text-xs text-[#193A69] dark:text-[#E2E8F0]">
                            Remark
                          </label>
                          <input
                            type="text"
                            className="h-10 w-full border border-gray-300 dark:border-borderColor-dark rounded-lg px-3 bg-white dark:bg-input text-sm font-semibold text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={followupForm.REMARKS}
                            onChange={(e) => setFollowupForm(p => ({ ...p, REMARKS: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => onSave()}
                          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold shadow-lg bg-[#2F5BFF] hover:bg-[#274CF0] text-white disabled:opacity-60 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <Save className="w-4 h-4" />
                          {isSaving ? "Saving..." : "Save & Set Follow-up"}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {activeAction === "CLOSE" && (
                  <>
                    <div className="px-5 py-4 flex items-center gap-4 border-b border-[#E6ECF7] dark:border-borderColor-dark bg-[#FBFCFF] dark:bg-transparent">
                      <span className="w-10 h-10 rounded-full bg-[#FFF1F2] dark:bg-red-500/10 inline-flex items-center justify-center shrink-0">
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-300" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-base font-black text-gray-900 dark:text-white">
                          Close
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-300 font-semibold">
                          Mark as not interested and close the follow-up.
                        </div>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12 md:col-span-4">
                          <label className="flex font-bold mt-1 mb-1 text-xs text-[#193A69] dark:text-[#E2E8F0]">
                            Follow-up Status <span className="text-red-500 ml-0.5">*</span>
                          </label>
                          <select
                            className="h-10 w-full border border-gray-300 dark:border-borderColor-dark rounded-lg px-3 bg-white dark:bg-input text-sm font-semibold text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                            value={followupForm.FOLLOWUP_STATUS}
                            onChange={(e) => setFollowupForm(p => ({ ...p, FOLLOWUP_STATUS: e.target.value }))}
                          >
                            {FOLLOWUP_STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-12 md:col-span-5">
                          <label className="flex font-bold mt-1 mb-1 text-xs text-[#193A69] dark:text-[#E2E8F0]">
                            Remark <span className="text-red-500 ml-0.5">*</span>
                          </label>
                          <input
                            type="text"
                            className="h-10 w-full border border-gray-300 dark:border-borderColor-dark rounded-lg px-3 bg-white dark:bg-input text-sm font-semibold text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={followupForm.REMARKS}
                            onChange={(e) => setFollowupForm(p => ({ ...p, REMARKS: e.target.value }))}
                          />
                        </div>

                        <div className="col-span-12 md:col-span-3">
                          <label className="flex font-bold mt-1 mb-1 text-xs text-[#193A69] dark:text-[#E2E8F0]">
                            Follow-up Date
                          </label>
                          <input
                            type="date"
                            disabled
                            className="h-10 w-full border border-gray-250 dark:border-borderColor-dark rounded-lg px-3 bg-gray-50 dark:bg-white/5 opacity-70 text-sm font-semibold text-gray-800 dark:text-white"
                            value={followupForm.FOLLOWUP_DATE}
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => onSave()}
                          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold shadow-lg bg-[#EF4444] hover:bg-[#DC2626] text-white disabled:opacity-60 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <XCircle className="w-4 h-4" />
                          {isSaving ? "Saving..." : "Close (Not Interested)"}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {activeAction === "RENEWED" && (
                  <>
                    <div className="px-5 py-4 flex items-center gap-4 border-b border-[#E6ECF7] dark:border-borderColor-dark bg-[#FBFCFF] dark:bg-transparent">
                      <span className="w-10 h-10 rounded-full bg-[#ECFDF5] dark:bg-emerald-500/10 inline-flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-base font-black text-gray-900 dark:text-white">
                          Renewed
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-300 font-semibold">
                          Mark this policy as renewed.
                        </div>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12 md:col-span-4">
                          <label className="flex font-bold mt-1 mb-1 text-xs text-[#193A69] dark:text-[#E2E8F0]">
                            Follow-up Status <span className="text-red-500 ml-0.5">*</span>
                          </label>
                          <select
                            className="h-10 w-full border border-gray-300 dark:border-borderColor-dark rounded-lg px-3 bg-white dark:bg-input text-sm font-semibold text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                            value={followupForm.FOLLOWUP_STATUS}
                            onChange={(e) => setFollowupForm(p => ({ ...p, FOLLOWUP_STATUS: e.target.value }))}
                          >
                            {FOLLOWUP_STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-12 md:col-span-5">
                          <label className="flex font-bold mt-1 mb-1 text-xs text-[#193A69] dark:text-[#E2E8F0]">
                            Remark
                          </label>
                          <input
                            type="text"
                            className="h-10 w-full border border-gray-300 dark:border-borderColor-dark rounded-lg px-3 bg-white dark:bg-input text-sm font-semibold text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={followupForm.REMARKS}
                            onChange={(e) => setFollowupForm(p => ({ ...p, REMARKS: e.target.value }))}
                          />
                        </div>

                        <div className="col-span-12 md:col-span-3">
                          <label className="flex font-bold mt-1 mb-1 text-xs text-[#193A69] dark:text-[#E2E8F0]">
                            Date
                          </label>
                          <input
                            type="date"
                            disabled
                            className="h-10 w-full border border-gray-200 dark:border-borderColor-dark rounded-lg px-3 bg-gray-50 dark:bg-white/5 opacity-70 text-sm font-semibold text-gray-800 dark:text-white"
                            value={followupForm.FOLLOWUP_DATE}
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => onSave()}
                          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold shadow-lg bg-[#10B981] hover:bg-[#059669] text-white disabled:opacity-60 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {isSaving ? "Saving..." : "Mark Renewed"}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {activeAction === "NONE" && (
                  <>
                    <div className="px-5 py-4 flex items-center gap-3 border-b border-[#E6ECF7] dark:border-borderColor-dark bg-white/70 dark:bg-transparent">
                      <span className="w-9 h-9 rounded-xl bg-[#EEF4FF] dark:bg-blue-500/10 inline-flex items-center justify-center">
                        <PencilLine className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                      </span>
                      <div className="text-xs font-black tracking-widest uppercase text-gray-600 dark:text-gray-300 font-bold">
                        MANUAL FOLLOW-UP
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Ainput
                            title="Vehicle Reg No"
                            type="text"
                            name="VEHICAL_REG_NO"
                            value={followupForm.VEHICAL_REG_NO}
                            handleInputChange={() => { }}
                            disabled
                            className="bg-gray-100 dark:bg-white/5 opacity-80 font-semibold"
                          />
                        </div>

                        <div>
                          <Ainput
                            title="Follow Up Date"
                            type="date"
                            name="FOLLOWUP_DATE"
                            redlabel="*"
                            value={followupForm.FOLLOWUP_DATE}
                            handleInputChange={(n, v) => setFollowupForm(p => ({ ...p, FOLLOWUP_DATE: v }))}
                          />
                        </div>

                        <div>
                          <Ainput
                            title="Follow Up Time"
                            type="time"
                            name="FOLLOWUP_TIME"
                            value={followupForm.FOLLOWUP_TIME}
                            handleInputChange={(n, v) => setFollowupForm(p => ({ ...p, FOLLOWUP_TIME: v }))}
                          />
                        </div>

                        <div>
                          <label className="flex font-bold mt-1 mb-1 text-xs text-[#193A69] dark:text-[#E2E8F0]">
                            Follow Up Status <span className="text-red-500 ml-1">*</span>
                          </label>
                          <select
                            className="h-9 w-full border border-borderColor dark:border-borderColor-dark rounded px-3 bg-white dark:bg-input text-sm font-semibold text-gray-800 dark:text-white"
                            value={followupForm.FOLLOWUP_STATUS}
                            onChange={(e) => setFollowupForm(p => ({ ...p, FOLLOWUP_STATUS: e.target.value }))}
                          >
                            {FOLLOWUP_STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-1 md:col-span-2">
                          <Ainput
                            title="Remarks"
                            type="text"
                            name="REMARKS"
                            value={followupForm.REMARKS}
                            handleInputChange={(n, v) => setFollowupForm(p => ({ ...p, REMARKS: v }))}
                            max={100}
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => onSave()}
                          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold shadow-lg bg-[#2F5BFF] hover:bg-[#274CF0] text-white disabled:opacity-60 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <Save className="w-4 h-4" />
                          {isSaving ? "Saving..." : "Save Follow-Up"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* CALL HISTORY TAB */}
          {activeTab === "history" && (
            <CustomerCallHistoryTab
              row={row}
              historyLoading={historyLoading}
              historyRows={historyRows}
              onRefreshHistory={onLoadHistory}
              user={user}
              streamBaseUrl={streamBaseUrl || ""}
            />
          )}

          {/* AI CALLING TAB */}
          {activeTab === "aiCalling" && (
            <AiCallingTab
              row={row}
              followupForm={followupForm}
              aiGenerating={aiGenerating}
              onGenerateAiCall={onGenerateAiCall}
              aiHistoryLoading={aiHistoryLoading}
              aiHistoryRows={aiHistoryRows}
              onRefreshHistory={onLoadAiHistory}
            />
          )}
        </div>

        {/* FOOTER */}
        <div className="px-3 sm:px-5 py-3 border-t border-gray-100 dark:border-borderColor-dark bg-white dark:bg-[#111827] flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="save"
            onClick={() => onSave()}
            disabled={isSaving || activeTab !== "followup"}
            title={
              activeTab !== "followup" ? "Go to Follow-up tab to save" : ""
            }
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// PAGE
// ============================================================
export default function RemindersView() {
  const user = useCurrentUser();
  const router = useRouter();

  const REMINDER_API_URL = `${process.env.NEXT_PUBLIC_URL}/Crm/reminders`;
  const CALLING_HISTORY_URL = `${process.env.NEXT_PUBLIC_URL}/Crm/calling/history`;
  const STREAM_BASE_URL = `${process.env.NEXT_PUBLIC_URL}/Crm/calling/recording`;
  const AI_RENEWAL_CALL_URL = `${process.env.NEXT_PUBLIC_URL}/Crm/makecall`;
  const AI_CALLING_HISTORY_URL = `${process.env.NEXT_PUBLIC_URL}/Crm/webhook`;
  const FOLLOWUP_SAVE_URL = `${process.env.NEXT_PUBLIC_URL}/Crm/followup`;

  const [form, setForm] = useState({
    fromDate: todayYMD(),
    toDate: todayYMD(),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [tableData, setTableData] = useState<any[]>([]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("followup");
  const [selectedRow, setSelectedRow] = useState<any>(null);

  const [followupForm, setFollowupForm] = useState({
    VEHICAL_REG_NO: "",
    FOLLOWUP_DATE: todayYMD(),
    FOLLOWUP_TIME: "",
    FOLLOWUP_STATUS: "PROMISED",
    REMARKS: "",
  });

  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRows, setHistoryRows] = useState<any[]>([]);

  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiHistoryLoading, setAiHistoryLoading] = useState(false);
  const [aiHistoryRows, setAiHistoryRows] = useState<any[]>([]);

  const handleInputChange = (name: string, value: any) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const columns = useMemo(
    () => [
      {
        Header: "TYPE",
        accessor: "type",
        Cell: ({ value }: any) => {
          if (!value) return "—";
          const val = String(value).toUpperCase().trim();
          const isBefore = val.includes("BEFORE");
          return (
            <span
              className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full border whitespace-nowrap ${isBefore
                ? "bg-[#F3E8FF] text-[#7C3AED] border-[#DDD6FE] dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40"
                : "bg-[#FFF0F2] text-[#E11D48] border-[#FFD2D7] dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40"
                }`}
            >
              {String(value).replace(/_/g, " ").toUpperCase()}
            </span>
          );
        },
      },
      {
        Header: "DAYS",
        accessor: "days",
        Cell: ({ row, value }: any) => {
          if (value === null || value === undefined || value === "") return "—";
          const num = parseInt(String(value), 10);
          const isAfter = String(row.original.type || "").toUpperCase().includes("AFTER") || num < 0;
          return (
            <span
              className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full border whitespace-nowrap ${isAfter
                ? "bg-[#FFF0F2] text-[#E11D48] border-[#FFD2D7] dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40"
                : num === 0
                  ? "bg-[#FFF0F2] text-[#E11D48] border-[#FFD2D7] dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40 animate-pulse"
                  : num <= 7
                    ? "bg-[#FFF7E6] text-[#D97706] border-[#FCD34D] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40"
                    : "bg-[#E8F8F0] text-[#16A34A] border-[#BFE8CB] dark:bg-green-950/40 dark:text-green-300 dark:border-green-800/40"
                }`}
            >
              {Math.abs(num)} Days
            </span>
          );
        },
      },
      {
        Header: "STATUS",
        accessor: "FOLLOWUP_STATUS",
        Cell: ({ row }: any) => {
          const value = row.original.FOLLOWUP_STATUS;
          if (!value) return <span className="text-gray-400">—</span>;

          const statusValue = String(value).toUpperCase().trim();

          let colorClass = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";

          if (statusValue.includes("RENEWED")) {
            colorClass = "bg-[#E8F8F0] text-[#16A34A] border-[#BFE8CB] dark:bg-green-950/40 dark:text-green-300 dark:border-green-800/40";
          } else if (statusValue.includes("NOT_INTERESTED") || statusValue.includes("FAILED")) {
            colorClass = "bg-[#FFF0F2] text-[#E11D48] border-[#FFD2D7] dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40";
          } else if (statusValue.includes("PENDING") || statusValue.includes("CALLBACK") || statusValue.includes("BUSY")) {
            colorClass = "bg-[#FFF7E6] text-[#D97706] border-[#FCD34D] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40";
          } else if (statusValue.includes("PROMISED") || statusValue.includes("INTERESTED") || statusValue.includes("CALLED")) {
            colorClass = "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE] dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40";
          } else if (statusValue.includes("AI_CALL") || statusValue.includes("AI CALL")) {
            colorClass = "bg-[#F3E8FF] text-[#7C3AED] border-[#DDD6FE] dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40";
          }

          return (
            <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full border whitespace-nowrap ${colorClass}`}>
              {String(value).replace(/_/g, " ").toUpperCase()}
            </span>
          );
        },
      },
      { Header: "MESSAGE", accessor: "message" },
      { Header: "CUST NAME", accessor: "CUST_NAME" },
      { Header: "CUST MOB NO", accessor: "CUST_MOB_NO" },
      { Header: "POLICY NAME", accessor: "POLICY_NAME" },
      { Header: "POLICY NUMBER", accessor: "POLICY_NUMBER" },
      { Header: "VEHICLE REG NO", accessor: "VEHICAL_REG_NO" },
      {
        Header: "POLICY START DATE",
        accessor: "POLICY_START_DATE",
        Cell: ({ value }: any) => {
          if (!value) return "—";
          return ymdToDmy(value);
        },
      },
      {
        Header: "POLICY END DATE",
        accessor: "POLICY_END_DATE",
        Cell: ({ value }: any) => {
          if (!value) return "—";
          return ymdToDmy(value);
        },
      },
    ],
    []
  );
  const fetchData = async () => {
    try {
      if (!form.fromDate || !form.toDate) {
        showSideAlert("Please select From Date and To Date", "warning");
        return;
      }

      setIsLoading(true);

      const payload = {
        fromDate: ymdToDmy(form.fromDate),
        toDate: ymdToDmy(form.toDate),
        loc_code: user?.branch,
        empcode: user?.EMPCODE,
        emp_dms_code: user?.emp_dms_code,
      };

      const res = await axios.post(REMINDER_API_URL, payload, {
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          compcode: user?.Comp_Code,
          name: user?.name,
        },
      });

      if (!res.data?.ok) {
        setTableData([]);
        showSideAlert(res.data?.Message || "No data", "warning");
        return;
      }

      const formatRow = (r: any) => {
        const raw = r.data || r;
        return {
          type: r.type,
          days: r.days,
          message: r.message,
          ...raw,
          POLICY_START_DATE: ymdToDmy(raw.POLICY_START_DATE),
          POLICY_END_DATE: ymdToDmy(raw.POLICY_END_DATE),
        };
      };

      const before = (res.data?.beforeReminders || []).map(formatRow);
      const after = (res.data?.afterReminders || []).map(formatRow);

      setTableData([...before, ...after]);
    } catch (err: any) {
      setTableData([]);
      showSideAlert(
        err?.response?.data?.Message || err?.message || "Server error",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCallingHistoryByMobile = async (mobNo?: string, vehNo?: string) => {
    try {
      if (!mobNo && !vehNo) return;
      setHistoryLoading(true);

      const res = await axios.post(
        CALLING_HISTORY_URL,
        { mob_no: mobNo, vehicle_number: vehNo },
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );

      if (res.data?.ok) setHistoryRows(res.data?.data || []);
      else setHistoryRows([]);
    } catch {
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchAiCallingHistoryByVehicle = async (vehNo: string) => {
    try {
      if (!vehNo) return;
      setAiHistoryLoading(true);

      const res = await axios.post(
        AI_CALLING_HISTORY_URL,
        { vehicle_number: vehNo },
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        }
      );

      if (res.data?.Status === true) setAiHistoryRows(res.data?.data || []);
      else if (res.data?.ok === true || res.data?.success === true)
        setAiHistoryRows(res.data?.data || []);
      else setAiHistoryRows([]);
    } catch {
      setAiHistoryRows([]);
    } finally {
      setAiHistoryLoading(false);
    }
  };

  const generateAiCall = async () => {
    try {
      if (!selectedRow) {
        showSideAlert("Row not selected", "warning");
        return;
      }

      setAiGenerating(true);

      const payload = {
        utd: selectedRow?.UTD ?? null,
        policy_number: selectedRow?.POLICY_NUMBER ?? null,
        vehicle_number:
          selectedRow?.VEHICAL_REG_NO ?? followupForm.VEHICAL_REG_NO ?? null,
        Campain_ID: process.env.NEXT_PUBLIC_AI_CAMPAIGN_ID || undefined,
        customerNumber: selectedRow?.CUST_MOB_NO ?? undefined,
        showroom_name: selectedRow?.POLICY_NAME ?? undefined,
        transferNumber: process.env.NEXT_PUBLIC_AI_TRANSFER_NUMBER || undefined,
        callback_date: followupForm.FOLLOWUP_DATE
          ? ymdToMdy(followupForm.FOLLOWUP_DATE)
          : undefined,
        callback_time: followupForm.FOLLOWUP_TIME
          ? time24To12(followupForm.FOLLOWUP_TIME)
          : undefined,
      };

      const res = await axios.post(AI_RENEWAL_CALL_URL, payload, {
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          compcode: user?.Comp_Code,
          name: user?.name,
        },
      });

      if (!(res.data?.success || res.data?.ok)) {
        showSideAlert(
          res.data?.message || res.data?.Message || "AI call failed",
          "error"
        );
        return;
      }

      showSideAlert(res.data?.message || "AI Call Triggered", "success");

      const vehNo = selectedRow?.VEHICAL_REG_NO ?? followupForm.VEHICAL_REG_NO;
      if (vehNo) await fetchAiCallingHistoryByVehicle(vehNo);
    } catch (err: any) {
      showSideAlert(
        err?.response?.data?.message ||
        err?.response?.data?.Message ||
        err?.message ||
        "AI call failed",
        "error"
      );
    } finally {
      setAiGenerating(false);
    }
  };

  const handleRowDoubleClick = (row: any) => {
    setSelectedRow(row);

    const vehNo = row?.VEHICAL_REG_NO || "";
    setFollowupForm({
      VEHICAL_REG_NO: vehNo,
      FOLLOWUP_DATE: ymdOnly(row?.FOLLOWUP_DATE) || ymdOnly(row?.NEXT_DATE) || todayYMD(),
      FOLLOWUP_TIME: row?.FOLLOWUP_TIME || "",
      FOLLOWUP_STATUS: row?.FOLLOWUP_STATUS || row?.STATUS || "PROMISED",
      REMARKS: row?.REMARKS || row?.REMARK || "",
    });

    setHistoryRows([]);
    setAiHistoryRows([]);

    setActiveTab("followup");
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedRow(null);
    setHistoryRows([]);
    setAiHistoryRows([]);
    setActiveTab("followup");
  };

  const saveFollowup = async (
    override?: Partial<{
      FOLLOWUP_DATE: string;
      FOLLOWUP_TIME: string;
      FOLLOWUP_STATUS: string;
      REMARKS: string;
    }>
  ) => {
    try {
      const data = {
        ...followupForm,
        ...(override || {}),
      };

      if (!data.VEHICAL_REG_NO) {
        showSideAlert("Vehicle Reg No not found", "warning");
        return;
      }
      if (!data.FOLLOWUP_DATE) {
        showSideAlert("Please select Follow UP Date", "warning");
        return;
      }
      if (!data.FOLLOWUP_STATUS) {
        showSideAlert("Please select Followup Status", "warning");
        return;
      }

      setIsLoading(true);

      const payload = {
        VEHICAL_REG_NO: data.VEHICAL_REG_NO,
        FOLLOWUP_DATE: data.FOLLOWUP_DATE,
        FOLLOWUP_TIME: data.FOLLOWUP_TIME || "",
        FOLLOWUP_STATUS: data.FOLLOWUP_STATUS,
        REMARKS: data.REMARKS || "",
      };

      const res = await axios.post(FOLLOWUP_SAVE_URL, payload, {
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          compcode: user?.Comp_Code,
          name: user?.name,
        },
      });

      if (!res.data?.ok) {
        showSideAlert(res.data?.Message || "Save failed", "error");
        return;
      }

      if (data.FOLLOWUP_DATE >= todayYMD()) {
        setTableData((prev) =>
          prev.filter(
            (r) =>
              normalizeVeh(r?.VEHICAL_REG_NO) !==
              normalizeVeh(data.VEHICAL_REG_NO)
          )
        );
      }

      setFollowupForm((prev) => ({
        ...prev,
        FOLLOWUP_DATE: data.FOLLOWUP_DATE,
        FOLLOWUP_TIME: data.FOLLOWUP_TIME || "",
        FOLLOWUP_STATUS: data.FOLLOWUP_STATUS,
        REMARKS: data.REMARKS || "",
      }));

      showSideAlert("Follow-up saved", "success");
      closeDetail();
      fetchData();
    } catch (err: any) {
      showSideAlert(
        err?.response?.data?.Message || err?.message || "Save failed",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="grid grid-cols-12 gap-3 p-3">
      <div className="col-span-12">
        <div className="rounded-t bg-header dark:bg-black px-2 md:px-6 py-2 border dark:border-borderColor-dark">
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-bold sm:text-sm md:text-lg lg:text-xl text-white dark:text-[#37a9dd] uppercase">
              Reminder Table
            </h1>
            <div className="flex gap-2">
              <Button variant="print" onClick={() => router.back()}>
                Back
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-b mt-0 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark p-3 shadow">
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-12 md:col-span-3">
              <Ainput
                title="Date From"
                type="date"
                name="fromDate"
                redlabel="*"
                value={form.fromDate}
                handleInputChange={handleInputChange}
                onInput={() => { }}
              />
            </div>

            <div className="col-span-12 md:col-span-3">
              <Ainput
                title="Date To"
                type="date"
                name="toDate"
                redlabel="*"
                value={form.toDate}
                handleInputChange={handleInputChange}
                onInput={() => { }}
              />
            </div>

            <div className="col-span-12 md:col-span-2 flex gap-2">
              <Button variant="save" onClick={fetchData} disabled={isLoading}>
                Show
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="col-span-12 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark rounded p-2 shadow">
        <DataTable
          title={""}
          columns={columns}
          data={tableData}
          selectValue="UTD"
          onRowDoubleClick={handleRowDoubleClick}
          height="380px"
          filterPosition="FilterData"
          numericFilterColumns={["days", "UTD"]}
        />
      </div>

      {/* MODAL */}
      <InsuranceDetailModal
        open={detailOpen}
        row={selectedRow}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onClose={closeDetail}
        followupForm={followupForm}
        setFollowupForm={setFollowupForm}
        isSaving={isLoading}
        onSave={saveFollowup}
        historyLoading={historyLoading}
        historyRows={historyRows}
        onLoadHistory={async () => {
          const mobNo =
            selectedRow?.CUST_MOB_NO ||
            followupForm?.CUST_MOB_NO ||
            selectedRow?.MOBILE ||
            selectedRow?.phone_number;
          const vehNo =
            selectedRow?.VEHICAL_REG_NO ?? followupForm.VEHICAL_REG_NO;
          if (!mobNo && !vehNo) {
            showSideAlert("Customer details not found", "warning");
            return;
          }
          await fetchCallingHistoryByMobile(mobNo, vehNo);
        }}
        aiGenerating={aiGenerating}
        onGenerateAiCall={generateAiCall}
        aiHistoryLoading={aiHistoryLoading}
        aiHistoryRows={aiHistoryRows}
        onLoadAiHistory={async () => {
          const vehNo =
            selectedRow?.VEHICAL_REG_NO ?? followupForm.VEHICAL_REG_NO;
          if (!vehNo) return;
          await fetchAiCallingHistoryByVehicle(vehNo);
        }}
        user={user}
        streamBaseUrl={STREAM_BASE_URL}
      />

      <HashloaderComponent isLoading={isLoading} />
    </div>
  );
}
