"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/Templates/reactTable";
import HashloaderComponent from "@/components/Templates/hashloader";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import {
  Search,
  Phone,
  CirclePlay,
  Car,
  FileText,
  Headphones,
  MessageSquare,
  Clock,
  X,
  PhoneCall,
  Users,
  Calendar,
  Activity,
  Mic,
  Hash,
  Timer,
  Inbox,
  MousePointerClick,
  PlayCircle,
  BarChart2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────
function showSideAlert(message: string, type: "success" | "error" | "warning") {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
  });
  Toast.fire({ icon: type, title: message });
}

function safeJson(v: any) {
  if (!v) return "";
  if (typeof v === "string") {
    try {
      const j = JSON.parse(v);
      return JSON.stringify(j, null, 2);
    } catch {
      return v;
    }
  }
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DISPLAY FORMATTERS
// ─────────────────────────────────────────────────────────────────────────────
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function fmtDateOnly(v: any): string {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtTimeOnly(v: any): string {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${m} ${ap}`;
}

function fmtDateTime(v: any): string {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return `${fmtDateOnly(v)}, ${fmtTimeOnly(v)}`;
}

function fmtDuration(v: any): string {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  if (n <= 0) return "0s";
  const mins = Math.floor(n / 60);
  const secs = Math.round(n % 60);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function shortId(v: any, head = 8, tail = 6): string {
  if (!v) return "—";
  const s = String(v);
  if (s.length <= head + tail + 2) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp style transcript helpers
// ─────────────────────────────────────────────────────────────────────────────
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

function formatTranscriptTime(
  rawTime: any,
  callStartTime?: string | null,
  msgIndex: number = 0
): string | undefined {
  let baseDate: Date | null = null;
  if (callStartTime) {
    const s = String(callStartTime).trim().replace(" ", "T");
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      baseDate = d;
    }
  }

  // If rawTime is already formatted 12-hour string (e.g. "10:30 PM" or "2:15 AM")
  if (typeof rawTime === "string" && /^\d{1,2}:\d{2}\s*(AM|PM|am|pm)$/i.test(rawTime.trim())) {
    return rawTime.trim().toUpperCase();
  }

  // If rawTime is a full ISO date or datetime string with '-' or '/'
  if (typeof rawTime === "string" && (rawTime.includes("-") || rawTime.includes("/")) && rawTime.length >= 10) {
    const d = new Date(rawTime.replace(" ", "T"));
    if (!isNaN(d.getTime())) {
      return fmtTimeOnly(d.toISOString());
    }
  }

  let offsetSeconds = 0;
  let hasValidOffset = false;

  if (rawTime !== undefined && rawTime !== null && rawTime !== "") {
    const str = String(rawTime).trim();
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) {
      const parts = str.split(":").map(Number);
      if (parts.length === 2) offsetSeconds = parts[0] * 60 + parts[1];
      else if (parts.length === 3) offsetSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      hasValidOffset = true;
    } else {
      const num = Number(str);
      if (Number.isFinite(num)) {
        if (num > 1000000000000) {
          const d = new Date(num);
          if (!isNaN(d.getTime())) return fmtTimeOnly(d.toISOString());
        } else if (num > 1000000000) {
          const d = new Date(num * 1000);
          if (!isNaN(d.getTime())) return fmtTimeOnly(d.toISOString());
        } else {
          offsetSeconds = num > 10000 ? num / 1000 : num;
          hasValidOffset = true;
        }
      }
    }
  }

  if (baseDate) {
    const effectiveOffset = hasValidOffset ? offsetSeconds : (msgIndex * 6);
    const msgDate = new Date(baseDate.getTime() + effectiveOffset * 1000);
    return fmtTimeOnly(msgDate.toISOString());
  }

  if (hasValidOffset) {
    const mins = Math.floor(offsetSeconds / 60);
    const secs = Math.floor(offsetSeconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return undefined;
}

function transcriptToWhatsappMessages(transcript: any, callStartTime?: string | null): TranscriptMsg[] {
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
        const rawTime = extractTimeFromItem(item);
        const computedTime = formatTranscriptTime(rawTime, callStartTime, idx);

        return {
          side,
          text: text || safeJson(item) || "—",
          speaker: speaker || undefined,
          time: computedTime || undefined,
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
    if (Array.isArray(arr)) return transcriptToWhatsappMessages(arr, callStartTime);
    return [{ side: "in", text: safeJson(parsed) || "—", time: formatTranscriptTime(undefined, callStartTime, 0) }];
  }

  const str = String(parsed || "").trim();
  if (!str) return [];
  return [{ side: "in", text: str, time: formatTranscriptTime(undefined, callStartTime, 0) }];
}

const WhatsappTranscript = ({
  transcript,
  callStartTime,
}: {
  transcript: any;
  callStartTime?: string | null;
}) => {
  const msgs = useMemo(
    () => transcriptToWhatsappMessages(transcript, callStartTime),
    [transcript, callStartTime],
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
    <div className="max-h-[380px] overflow-y-auto rounded-lg bg-[#EFEAE2] p-3 space-y-2.5">
      {msgs.map((m, idx) => {
        const isOut = m.side === "out";
        const t = m.time;
        return (
          <div
            key={idx}
            className={`flex ${isOut ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`relative max-w-[85%] sm:max-w-[70%] px-3 py-2 text-[12.5px] leading-[1.5] shadow-sm
              ${
                isOut
                  ? "bg-[#D9FDD3] text-slate-900 rounded-xl rounded-tr-[3px]"
                  : "bg-white text-slate-900 rounded-xl rounded-tl-[3px]"
              }`}
            >
              {m.speaker ? (
                <div
                  className={`text-[10px] font-bold mb-0.5 capitalize ${isOut ? "text-emerald-700" : "text-indigo-600"}`}
                >
                  {m.speaker}
                </div>
              ) : null}
              <div className="whitespace-pre-wrap break-words">{m.text}</div>
              {t ? (
                <div className="mt-0.5 text-[9.5px] text-slate-500 text-right leading-none">
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

// ─────────────────────────────────────────────────────────────────────────────
// UI helpers
// ─────────────────────────────────────────────────────────────────────────────
const Pill = ({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "gray" | "green" | "red" | "amber" | "blue" | "purple" | "glass";
}) => {
  const map: Record<string, string> = {
    gray: "bg-slate-100 text-slate-600 border-slate-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-violet-50 text-violet-700 border-violet-200",
    glass: "bg-white/15 text-white border-white/25 backdrop-blur-sm",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-[3px] rounded-md text-[10.5px] font-semibold border whitespace-nowrap ${map[tone]}`}
    >
      {children}
    </span>
  );
};

function statusTone(status?: string) {
  const s = String(status || "").toUpperCase();
  if (s.includes("COMPLETE")) return "green" as const;
  if (
    s.includes("FAIL") ||
    s.includes("ERROR") ||
    s.includes("REJECT") ||
    s.includes("BUSY")
  )
    return "red" as const;
  if (
    s.includes("RING") ||
    s.includes("PROGRESS") ||
    s.includes("TRANSFER") ||
    s.includes("INITIAT")
  )
    return "amber" as const;
  return "gray" as const;
}

function statusDotColor(status?: string) {
  const tone = statusTone(status);
  if (tone === "green") return "#22c55e";
  if (tone === "red") return "#ef4444";
  if (tone === "amber") return "#f59e0b";
  return "#94a3b8";
}

const StatusCell = ({ status }: { status?: string }) => {
  const dot = statusDotColor(status);
  const label = String(status || "—").replace(/[-_]/g, " ");
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-slate-700">
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: dot }}
      />
      <span>{label}</span>
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Mini Sub-Modal for Recording / Transcript / Summary
// ─────────────────────────────────────────────────────────────────────────────
type PanelType = "recording" | "transcript" | "summary" | null;

const SubPanel = ({
  type,
  row,
  customer,
  user,
  streamBaseUrl,
  onClose,
}: {
  type: PanelType;
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
        const url = `${streamBaseUrl}/${encodeURIComponent(row.call_id)}?mob_no=${encodeURIComponent(customer?.CUST_MOB_NO || "")}`;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, row?.call_id]);

  if (!type) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-[13px] font-bold text-slate-700">
            {type === "recording" && (
              <>
                <CirclePlay size={15} className="text-violet-600" /> Recording
              </>
            )}
            {type === "transcript" && (
              <>
                <MessageSquare size={15} className="text-indigo-600" />{" "}
                Transcript
              </>
            )}
            {type === "summary" && (
              <>
                <BarChart2 size={15} className="text-blue-600" /> Summary
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
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
                  Loading recording…
                </div>
              ) : audioErr ? (
                <div className="text-sm text-rose-600 flex items-center gap-2 py-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />{" "}
                  {audioErr}
                </div>
              ) : audioSrc ? (
                <audio controls src={audioSrc} className="w-full rounded-lg" />
              ) : (
                <div className="flex items-center gap-2 text-sm text-slate-400 py-4 justify-center">
                  <Mic size={15} /> Recording not available.
                </div>
              )}
            </>
          )}

          {type === "transcript" && (
            <WhatsappTranscript
              transcript={row?.transcript}
              callStartTime={row?.start_time || row?.triggered_at || row?.created_at}
            />
          )}

          {type === "summary" && (
            <div className="text-[13px] text-slate-700 whitespace-pre-wrap leading-relaxed min-h-[60px]">
              {row?.summary || (
                <span className="text-slate-400">No summary available.</span>
              )}
            </div>
          )}
        </div>

        {/* footer */}
        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-white text-[12px] font-semibold hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CustomerCallsModal — redesigned to match the image
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

const CustomerCallsModal = ({
  open,
  customer,
  loading,
  rows,
  onClose,
  user,
  streamBaseUrl,
}: {
  open: boolean;
  customer: any;
  loading: boolean;
  rows: any[];
  onClose: () => void;
  user: any;
  streamBaseUrl: string;
}) => {
  const [page, setPage] = useState(1);
  const [subPanel, setSubPanel] = useState<{
    type: PanelType;
    row: any;
  } | null>(null);

  useEffect(() => {
    if (open) setPage(1);
  }, [open, rows?.length]);

  if (!open) return null;

  // ── stats ──
  const totalCalls = rows.length;
  const completed = rows.filter((r) =>
    String(r?.status || "")
      .toUpperCase()
      .includes("COMPLETE"),
  ).length;
  const busy = rows.filter((r) =>
    String(r?.status || "")
      .toUpperCase()
      .includes("BUSY"),
  ).length;
  const noAnswer = rows.filter(
    (r) =>
      String(r?.status || "")
        .toUpperCase()
        .includes("NO_ANSWER") ||
      String(r?.status || "")
        .toUpperCase()
        .includes("NO ANSWER"),
  ).length;
  const failed = rows.filter((r) => {
    const s = String(r?.status || "").toUpperCase();
    return s.includes("FAIL") || s.includes("ERROR");
  }).length;
  const appointments = rows.filter(
    (r) => r?.appointment || r?.has_appointment,
  ).length;
  const totalDurationSec = rows.reduce(
    (acc, r) => acc + (Number(r?.duration) || 0),
    0,
  );
  const totalDurationMin = Math.round(totalDurationSec / 60);

  // ── pagination ──
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = [
    { label: "Total Calls", value: totalCalls },
    { label: "Completed", value: completed },
    { label: "Busy", value: busy },
    { label: "No Answer", value: noAnswer },
    { label: "Failed", value: failed },
    { label: "Appointments", value: appointments },
    { label: "Total Duration", value: `${totalDurationMin} min` },
  ];

  const vehicleNo = customer?.VEHICAL_REG_NO || "—";
  const custName = customer?.CUST_NAME || "Customer";
  const custMob = customer?.CUST_MOB_NO || "—";
  const modelName = customer?.MODEL_NAME || "";

  return (
    <>
      <div
        className="fixed inset-0 z-[1000] bg-black/50 flex items-start justify-center pt-6 px-3 pb-3 overflow-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        role="dialog"
        aria-modal="true"
      >
        <div className="w-full max-w-5xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
          {/* ── HEADER ── dark navy like image */}
          <div
            className="flex items-start justify-between px-5 py-4"
            style={{ background: "#1a2e4a" }}
          >
            <div>
              <div className="text-[17px] font-bold text-white">
                {vehicleNo}
              </div>
              <div className="text-[12px] text-slate-300 mt-0.5 text-white">
                {custName}
                {custMob !== "—" && <> · {custMob}</>}
                {modelName && <> · {modelName}</>}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition mt-0.5"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>

          {/* ── STATS ROW ── */}
          <div className="bg-white border-b border-slate-200 px-4 py-3">
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {stats.map((s, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center py-2.5 px-3 rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-default"
                >
                  <div className="text-[20px] font-extrabold text-slate-800 leading-tight">
                    {s.value}
                  </div>
                  <div className="text-[9.5px] text-slate-400 mt-1 text-center leading-tight font-medium uppercase tracking-wide">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── BODY ── */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-3 py-16">
                <span className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                <span className="text-sm text-slate-500">
                  Loading call history…
                </span>
              </div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Inbox size={36} className="text-slate-300 mb-3" />
                <div className="text-sm font-bold text-slate-700">
                  No calls found
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  This customer does not have any call history yet.
                </div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
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
                        className="px-4 py-2.5 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r, idx) => {
                    const startVal = r.start_time || r.triggered_at;
                    const hasTranscript = !!(
                      r.transcript && String(r.transcript).length > 5
                    );
                    const hasSummary = !!(
                      r.summary && String(r.summary).trim().length > 0
                    );

                    return (
                      <tr
                        key={idx}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        {/* TIME */}
                        <td className="px-4 py-3 text-[12px] text-slate-600 whitespace-nowrap">
                          {startVal ? fmtDateTime(startVal) : "—"}
                        </td>

                        {/* PHONE */}
                        <td className="px-4 py-3 text-[12px] text-slate-700 font-mono whitespace-nowrap">
                          {r.phone_number || "—"}
                        </td>

                        {/* STATUS */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusCell status={r.status} />
                        </td>

                        {/* DURATION */}
                        <td className="px-4 py-3 text-[12px] text-slate-600 whitespace-nowrap">
                          {r.duration ? `${r.duration} sec` : "—"}
                        </td>

                        {/* CHANNEL */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-[12px] font-bold text-slate-700">
                            AI Call
                          </span>
                        </td>

                        {/* RECORDING */}
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() =>
                              setSubPanel({ type: "recording", row: r })
                            }
                            className="w-8 h-8   border-slate-300 hover:border-violet-400 hover:bg-violet-50 flex items-center justify-center mx-auto transition group"
                            title="Play Recording"
                          >
                            <CirclePlay
                              size={20}
                              className="text-slate-400 group-hover:text-violet-600 transition"
                            />
                          </button>
                        </td>

                        {/* TRANSCRIPT */}
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() =>
                              hasTranscript &&
                              setSubPanel({ type: "transcript", row: r })
                            }
                            className={`w-8 h-8 rounded-full border flex items-center justify-center mx-auto transition group
      ${hasTranscript
                                ? "border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer"
                                : "border-slate-200 cursor-not-allowed opacity-40"
                              }`}
                            title={
                              hasTranscript
                                ? "View Transcript"
                                : "No transcript"
                            }
                            disabled={!hasTranscript}
                          >
                            <FileText
                              size={14}
                              className={`transition ${hasTranscript
                                ? "text-indigo-400 group-hover:text-indigo-600"
                                : "text-slate-300"
                                }`}
                            />
                          </button>
                        </td>

                        {/* SUMMARY */}
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() =>
                              hasSummary &&
                              setSubPanel({ type: "summary", row: r })
                            }
                            className={`w-8 h-8 rounded-full border flex items-center justify-center mx-auto transition group
                              ${hasSummary
                                ? "border-blue-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer"
                                : "border-slate-200 cursor-not-allowed opacity-40"
                              }`}
                            title={hasSummary ? "View Summary" : "No summary"}
                            disabled={!hasSummary}
                          >
                            <BarChart2
                              size={14}
                              className={`transition ${hasSummary ? "text-blue-400 group-hover:text-blue-600" : "text-slate-300"}`}
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
            <div className="px-4 py-2.5 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500">
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, rows.length)} to{" "}
                {Math.min(page * PAGE_SIZE, rows.length)} of {rows.length}{" "}
                results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
                >
                  <ChevronLeft size={13} /> Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sub-panel for recording / transcript / summary */}
      {subPanel && (
        <SubPanel
          type={subPanel.type}
          row={subPanel.row}
          customer={customer}
          user={user}
          streamBaseUrl={streamBaseUrl}
          onClose={() => setSubPanel(null)}
        />
      )}
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function CallingDashboardPage() {
  const user = useCurrentUser();

  const CUSTOMERS_URL = `${process.env.NEXT_PUBLIC_URL}/Crm/calling/customers`;
  const HISTORY_URL = `${process.env.NEXT_PUBLIC_URL}/Crm/calling/history`;
  const STREAM_BASE_URL = `${process.env.NEXT_PUBLIC_URL}/Crm/calling/recording`;

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRows, setHistoryRows] = useState<any[]>([]);

  const columns = useMemo(
    () => [
      {
        Header: "CUSTOMER",
        accessor: "CUST_NAME",
        Cell: ({ value }: any) => (
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
            {value || "—"}
          </span>
        ),
      },
      {
        Header: "MOBILE",
        accessor: "CUST_MOB_NO",
        Cell: ({ value }: any) => (
          <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
            {value || "—"}
          </span>
        ),
      },
      {
        Header: "VEHICLE",
        accessor: "VEHICAL_REG_NO",
        Cell: ({ value }: any) => (
          <span className="text-[11px] font-mono font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 px-1.5 py-0.5 rounded">
            {value || "—"}
          </span>
        ),
      },
      {
        Header: "POLICY NO",
        accessor: "POLICY_NUMBER",
        Cell: ({ value }: any) => (
          <span className="text-[11px] text-slate-600 dark:text-slate-300">
            {value || "—"}
          </span>
        ),
      },
      {
        Header: "MODEL",
        accessor: "MODEL_NAME",
        Cell: ({ value }: any) => (
          <span className="text-[11px] text-slate-600 dark:text-slate-300">
            {value || "—"}
          </span>
        ),
      },
      {
        Header: "LAST STATUS",
        accessor: "LAST_CALL_STATUS",
        cellAlign: "center" as const,
        Cell: ({ value }: any) => <StatusCell status={value} />,
      },
      {
        Header: "LAST CALL ID",
        accessor: "LAST_CALL_ID",
        Cell: ({ value }: any) => (
          <span
            className="text-[10px] font-mono text-slate-400 dark:text-slate-500"
            title={value || ""}
          >
            {shortId(value)}
          </span>
        ),
      },
    ],
    [],
  );

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await axios.post(
        CUSTOMERS_URL,
        { search, page: 1, pageSize: 100 },
        {

          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            compcode: user?.Comp_Code,
            name: user?.name,
            loc_code: user?.branch || "",
          },

        },

      );
      if (!res.data?.ok) {
        setCustomers([]);
        showSideAlert(res.data?.Message || "No data", "warning");
        return;
      }
      setCustomers(res.data?.data || []);
    } catch (err: any) {
      setCustomers([]);
      showSideAlert(
        err?.response?.data?.Message || err?.message || "Server error",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const openCustomer = async (row: any) => {
    setSelectedCustomer(row);
    setModalOpen(true);
    setHistoryRows([]);
    try {
      setHistoryLoading(true);
      const res = await axios.post(
        HISTORY_URL,
        { mob_no: row?.CUST_MOB_NO },
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            compcode: user?.Comp_Code,
            name: user?.name,
          },
        },
      );
      if (!res.data?.ok) {
        setHistoryRows([]);
        showSideAlert(res.data?.Message || "History not found", "warning");
        return;
      }
      setHistoryRows(res.data?.data || []);
    } catch (err: any) {
      setHistoryRows([]);
      showSideAlert(
        err?.response?.data?.Message || err?.message || "History error",
        "error",
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-3 flex flex-col gap-3">
      {/* ══ HEADER ══ */}
      <div className="relative overflow-hidden rounded-xl shadow-sm">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(110deg,#193A69 0%, #24508f 55%, #3a6bb5 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />
        <div className="relative flex flex-wrap gap-3 items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Headphones className="h-[18px] w-[18px] text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-[15px] font-bold text-white leading-tight">
                Calling Dashboard
              </div>
              <div className="text-[11px] text-white/60 flex items-center gap-1.5 mt-0.5">
                <Users size={11} />
                Customers · Call history · Recordings · Transcripts
              </div>
            </div>
            {customers.length > 0 && (
              <span className="ml-1 hidden sm:inline-flex items-center gap-1 rounded-lg bg-white/15 border border-white/25 px-2.5 py-1 text-[11px] font-bold text-white">
                {customers.length} customers
              </span>
            )}
          </div>
          <div className="flex gap-2 items-center w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                className="h-9 w-full sm:w-[300px] rounded-lg border border-white/20 pl-9 pr-3 text-[13px]
                  bg-white/95 dark:bg-white/10 text-slate-800 dark:text-white
                  placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
                placeholder="Search name / mobile / vehicle / policy"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchCustomers()}
              />
            </div>
            <Button
              variant="save"
              size="sm"
              onClick={fetchCustomers}
              disabled={loading}
              className="!bg-white !text-[#193A69] hover:!bg-white/90 font-bold shrink-0"
            >
              {loading ? "Loading…" : "Search"}
            </Button>
            <Button
              variant="print"
              size="sm"
              onClick={() => window.history.back()}
              className="font-bold shrink-0"
            >
              Back
            </Button>
          </div>
        </div>
      </div>

      {/* ══ TABLE ══ */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d1117] overflow-hidden shadow-sm">
        <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12px] font-bold text-slate-700 dark:text-white">
            <span className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 flex items-center justify-center">
              <PhoneCall size={12} />
            </span>
            Customer List
          </div>
          <span className="text-[10.5px] text-slate-400 flex items-center gap-1">
            <MousePointerClick size={10} />
            Double-click a row to view call history
          </span>
        </div>
        <div className="p-2">
          <DataTable
            title={""}
            columns={columns}
            data={customers}
            selectValue="CUST_MOB_NO"
            height="520px"
            filterPosition="FilterData"
            onRowDoubleClick={openCustomer}
          />
        </div>
      </div>

      <CustomerCallsModal
        open={modalOpen}
        customer={selectedCustomer}
        loading={historyLoading}
        rows={historyRows}
        user={user}
        streamBaseUrl={STREAM_BASE_URL}
        onClose={() => {
          setModalOpen(false);
          setSelectedCustomer(null);
          setHistoryRows([]);
        }}
      />

      <HashloaderComponent isLoading={loading || historyLoading} />
    </div>
  );
}
