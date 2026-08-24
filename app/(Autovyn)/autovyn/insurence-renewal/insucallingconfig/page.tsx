"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/Templates/reactTable";
import HashloaderComponent from "@/components/Templates/hashloader";
import Ainput from "@/components/atoms/Input";
import axios from "axios";
import { Edit, Shield, Lock, Unlock, Clock } from "lucide-react";
import { useCurrentUser } from "@/app/hooks/use-current-user";

// ============================================================
// CONSTANTS
// ============================================================
const BASE_URL = process.env.NEXT_PUBLIC_URL;

const API = {
  get: `${BASE_URL}/Crm/insucalling/get`,
  create: `${BASE_URL}/Crm/insucalling/save`,
  update: `${BASE_URL}/Crm/insucalling/update`,
  toggle: `${BASE_URL}/Crm/insucalling/toggle`,
};

// ============================================================
// TYPES
// ============================================================
type InsuCallingConfig = {
  UTD: number;
  LOC_CODE: number | null;
  LOC_NAME: string | null;
  INSU_COMPANY_NAME: string;
  SALES_EXECUTIVE_NO: string | null;
  SLOT1: string | null;
  SLOT2: string | null;
  SLOT3: string | null;
  CALLBACK_TIME: string | null;
  CAMPAIGN_ID: string | null;

  // UI expects number (1/0)
  STATUS: number;

  CREATED_BY: string | null;
  CREATED_AT: string | null;
  UPDATED_BY: string | null;
  UPDATED_AT: string | null;
};

type FormMode = "create" | "edit";

type ConfigFormData = {
  Loc_Code: string;
  INSU_COMPANY_NAME: string;
  SALES_EXECUTIVE_NO: string;
  SLOT1: string;
  SLOT2: string;
  SLOT3: string;
  CALLBACK_TIME: string;
  CAMPAIGN_ID: string;
  STATUS: number;
};

// ============================================================
// UTILS
// ============================================================
const showToast = (
  msg: string,
  type: "success" | "error" | "warning" | "info",
) =>
  Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
  }).fire({ icon: type, title: msg });

const showAlertModal = (
  title: string,
  html: string,
  icon: "warning" | "error" | "info" = "warning",
) =>
  Swal.fire({
    icon,
    title,
    html,
    confirmButtonText: "OK, Got it",
    confirmButtonColor: "#193A69",
  });

// "HH:MM" (24hr) → "02:30 PM"
const formatTimeForDisplay = (time24: string | null): string => {
  if (!time24) return "—";
  const parts = time24.split(":");
  if (parts.length < 2) return time24;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return time24;
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours === 0 ? 12 : hours;
  return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
};

// old "10:00 AM" text → "HH:MM" for <input type="time">
const normalizeTimeForInput = (value: string | null): string => {
  if (!value) return "";
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return "";
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3]?.toUpperCase();
  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${minutes}`;
};

// ✅ normalize STATUS coming from API (varchar/int anything) -> 1/0 for UI
const normalizeStatusToNumber = (s: any): number => {
  const v = String(s ?? "")
    .trim()
    .toUpperCase();
  if (v === "1" || v === "ACTIVE") return 1;
  if (v === "0" || v === "INACTIVE") return 0;
  const n = Number(s);
  if (n === 1) return 1;
  if (n === 0) return 0;
  return 0;
};

// ============================================================
// BADGE
// ============================================================
const StatusBadge = ({ status }: { status: number | null }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border
    ${
      status === 1
        ? "bg-[#DCFCE7] text-green-700 border-green-300 dark:bg-[#14532D]/30 dark:text-green-300 dark:border-green-700"
        : "bg-gray-100 text-[#6B7280] border-[#D1D5DB] dark:bg-[#1F2937] dark:text-[#9CA3AF] dark:border-[#4B5563]"
    }`}
  >
    {status === 1 ? "● Active" : "● Inactive"}
  </span>
);

// ============================================================
// SHARED STYLES
// ============================================================
const inputCls =
  "h-9 w-full rounded border border-[#D1D5DB] dark:border-[#4B5563] " +
  "bg-white dark:bg-[#0d1117] px-3 text-sm text-[#1F2937] dark:text-white " +
  "focus:outline-none focus:ring-2 focus:ring-[#BFDBFE] focus:border-transparent " +
  "placeholder:text-[#9CA3AF] transition-shadow disabled:opacity-60";

const selectCls =
  "h-9 w-full rounded border border-[#D1D5DB] dark:border-[#4B5563] " +
  "bg-white dark:bg-[#0d1117] px-3 text-sm text-[#1F2937] dark:text-white " +
  "focus:outline-none focus:ring-2 focus:ring-[#BFDBFE] transition-shadow " +
  "cursor-pointer disabled:opacity-60";

const timeInputCls =
  "h-9 w-full rounded border border-[#D1D5DB] dark:border-[#4B5563] " +
  "bg-white dark:bg-[#0d1117] px-3 text-sm text-[#1F2937] dark:text-white " +
  "focus:outline-none focus:ring-2 focus:ring-[#BFDBFE] focus:border-transparent " +
  "transition-shadow disabled:opacity-60 cursor-pointer " +
  "[&::-webkit-calendar-picker-indicator]:cursor-pointer " +
  "[&::-webkit-calendar-picker-indicator]:dark:invert";

// ── Field wrapper ──
const Field = ({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1 min-w-0">
    <label className="text-xs font-semibold text-[#4B5563] dark:text-[#9CA3AF] truncate">
      {label}
      {required && <span className="text-[#EF4444] ml-0.5">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-[10px] text-[#EF4444] leading-tight">{error}</p>
    )}
  </div>
);

// ── Time Field ──
const TimeField = ({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) => (
  <div className="flex flex-col gap-1 min-w-0">
    <label className="flex items-center gap-1 text-xs font-semibold text-[#4B5563] dark:text-[#9CA3AF] truncate">
      <Clock size={12} className="shrink-0" />
      {label}
    </label>
    <input
      type="time"
      className={timeInputCls}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  </div>
);

// ============================================================
// MAIN PAGE
// ============================================================
export default function InsuCallingConfigPage() {
  const user = useCurrentUser();

  const HEADERS = () => ({
    accept: "application/json",
    compcode: user?.Comp_Code,
    name: user?.name,
    "Content-Type": "application/json",
  });

  const userName: string = (user as any)?.name ?? "SYSTEM";

  // ── Branch ───────────────────────────────────────────────
  const userBranchRaw: string =
    user?.branch !== undefined && user?.branch !== null
      ? String(user.branch)
      : "";

  const userBranchArray = userBranchRaw
    ? userBranchRaw
        .split(",")
        .map((l: string) => l.trim())
        .filter(Boolean)
    : [];

  const isMultiLocationUser = userBranchArray.length > 1;
  const userSingleLocation =
    userBranchArray.length === 1 ? userBranchArray[0] : "";

  // ── State ────────────────────────────────────────────────
  const [rows, setRows] = useState<InsuCallingConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");

  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editUTD, setEditUTD] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const EMPTY_FORM: ConfigFormData = {
    Loc_Code: userSingleLocation || "",
    INSU_COMPANY_NAME: "",
    SALES_EXECUTIVE_NO: "",
    SLOT1: "",
    SLOT2: "",
    SLOT3: "",
    CALLBACK_TIME: "",
    CAMPAIGN_ID: "",
    STATUS: 1,
  };

  const [form, setForm] = useState<ConfigFormData>(EMPTY_FORM);

  // ── Auto-set Loc_Code when user loads ────────────────────
  useEffect(() => {
    if (userSingleLocation) {
      setForm((prev) => ({ ...prev, Loc_Code: userSingleLocation }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSingleLocation]);

  // ============================================================
  // FETCH
  // ============================================================
  const fetchConfigs = useCallback(async () => {
    if (isMultiLocationUser) return;
    if (!userSingleLocation) return;

    setIsLoading(true);
    try {
      // ✅ Send loc_code in params (as you asked) + Loc_Code (for backward compatibility)
      const params: Record<string, any> = {
        loc_code: userSingleLocation,
        Loc_Code: userSingleLocation,
      };
      if (filterStatus !== "") params.status = filterStatus;

      const res = await axios.get(API.get, {
        headers: HEADERS(),
        params,
      });

      const list = Array.isArray(res?.data?.data) ? res.data.data : [];

      // ✅ normalize STATUS to number (1/0) for UI
      const normalized: InsuCallingConfig[] = list.map((r: any) => ({
        ...r,
        STATUS: normalizeStatusToNumber(r.STATUS),
      }));

      setRows(normalized);
    } catch (err: any) {
      showToast(
        err?.response?.data?.message ?? "Error fetching configs",
        "error",
      );
      setRows([]);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, userSingleLocation, isMultiLocationUser]);

  useEffect(() => {
    if (!isMultiLocationUser && userSingleLocation) fetchConfigs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchConfigs, userSingleLocation]);

  // ============================================================
  // FORM HELPERS
  // ============================================================
  const resetToCreate = () => {
    setForm({ ...EMPTY_FORM, Loc_Code: userSingleLocation || "" });
    setFormErrors({});
    setEditUTD(null);
    setFormMode("create");
  };

  const handleFieldChange = (
    field: keyof ConfigFormData,
    value: string | number,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const openEdit = (row: InsuCallingConfig) => {
    setForm({
      Loc_Code: userSingleLocation,
      INSU_COMPANY_NAME: row.INSU_COMPANY_NAME ?? "",
      SALES_EXECUTIVE_NO: row.SALES_EXECUTIVE_NO ?? "",
      SLOT1: normalizeTimeForInput(row.SLOT1),
      SLOT2: normalizeTimeForInput(row.SLOT2),
      SLOT3: normalizeTimeForInput(row.SLOT3),
      CALLBACK_TIME: normalizeTimeForInput(row.CALLBACK_TIME),
      CAMPAIGN_ID: row.CAMPAIGN_ID ?? "",
      STATUS: row.STATUS ?? 1,
    });
    setFormErrors({});
    setEditUTD(row.UTD);
    setFormMode("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ============================================================
  // VALIDATION
  // ============================================================
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.INSU_COMPANY_NAME.trim())
      errs.INSU_COMPANY_NAME = "Insurance Company Name is required";
    if (!form.CAMPAIGN_ID.trim()) errs.CAMPAIGN_ID = "Campaign ID is required";
    if (!form.SALES_EXECUTIVE_NO.trim())
      errs.SALES_EXECUTIVE_NO = "Sales Executive Number is required";
    if (!form.SLOT1.trim()) errs.SLOT1 = "Slot 1 time is required";
    if (!form.SLOT2.trim()) errs.SLOT2 = "Slot 2 time is required";
    if (!form.SLOT3.trim()) errs.SLOT3 = "Slot 3 time is required";
    if (!form.CALLBACK_TIME.trim())
      errs.CALLBACK_TIME = "Callback time is required";

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ============================================================
  // SUBMIT
  // ============================================================
  const handleSubmit = async () => {
    if (isMultiLocationUser) {
      showAlertModal(
        "Multiple Branches Detected",
        `You are logged in with <b>${userBranchArray.length} branches</b>:
         <br/><br/>
         <span style="font-weight:600;color:#193A69;">${userBranchArray.join(", ")}</span>
         <br/><br/>
         Please select <b>only one branch</b> to save Insurance Calling Config.`,
        "warning",
      );
      return;
    }

    if (!userSingleLocation) {
      showToast("User location not found. Cannot save config.", "error");
      return;
    }

    if (!validate()) return;

    setFormLoading(true);
    try {
      // ✅ payload me bhi LOC_CODE bhej rahe hain (table column)
      // ✅ and params me bhi loc_code bhej rahe hain (as you asked)
      const locCodeNum = Number(userSingleLocation);

      const payload = {
        ...form,

        // location in body (safe for backend)
        Loc_Code: userSingleLocation,
        LOC_CODE: Number.isFinite(locCodeNum) ? locCodeNum : userSingleLocation,

        // keep UI status numeric, backend can map; optional: send string too
        STATUS: Number(form.STATUS),

        // creator in both keys (safe)
        Created_By: userName,
        CREATED_BY: userName,
      };

      const params = {
        loc_code: userSingleLocation,
        Loc_Code: userSingleLocation,
      };

      const isEdit = formMode === "edit";

      if (isEdit) {
        await axios.put(
          API.update,
          { ...payload, UTD: editUTD },
          { headers: HEADERS(), params },
        );
        showToast("Config updated successfully", "success");
      } else {
        await axios.post(API.create, payload, { headers: HEADERS(), params });
        showToast("Config created successfully", "success");
      }

      resetToCreate();
      await fetchConfigs();
    } catch (err: any) {
      showToast(
        err?.response?.data?.message ?? "Something went wrong",
        "error",
      );
    } finally {
      setFormLoading(false);
    }
  };

  // ============================================================
  // TOGGLE
  // ============================================================
  const handleToggle = async (row: InsuCallingConfig) => {
    if (isMultiLocationUser) {
      showAlertModal(
        "Multiple Branches Detected",
        `Please select <b>only one branch</b> to change config status.<br/><br/>
         Your branches: <b>${userBranchArray.join(", ")}</b>`,
        "warning",
      );
      return;
    }

    if (!userSingleLocation) {
      showToast("User location not found.", "error");
      return;
    }

    const newStatus = row.STATUS === 1 ? 0 : 1;

    try {
      // ✅ params me loc_code bhej rahe hain
      await axios.patch(
        API.toggle,
        { UTD: row.UTD, status: newStatus },
        {
          headers: HEADERS(),
          params: {
            loc_code: userSingleLocation,
            Loc_Code: userSingleLocation,
          },
        },
      );

      showToast(
        `Config ${newStatus === 1 ? "activated" : "deactivated"} successfully`,
        "success",
      );
      await fetchConfigs();
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Toggle failed", "error");
    }
  };

  // ============================================================
  // STATS
  // ============================================================
  const activeCount = rows.filter((r) => r.STATUS === 1).length;
  const inactiveCount = rows.filter((r) => r.STATUS === 0).length;

  // ============================================================
  // COLUMNS
  // ============================================================
  const columns = useMemo(
    () => [
      {
        Header: "Location",
        accessor: "LOC_NAME",
        Cell: ({ row }: any) => (
          <div className="min-w-[90px]">
            <div className="text-xs font-semibold text-[#193A69] dark:text-[#93C5FD] whitespace-nowrap">
              {row.original.LOC_NAME || "—"}
            </div>
            <div className="text-[10px] text-[#9CA3AF]">
              Code: {row.original.LOC_CODE ?? "—"}
            </div>
          </div>
        ),
      },
      {
        Header: "Insurance Company",
        accessor: "INSU_COMPANY_NAME",
        Cell: ({ value }: any) => (
          <span className="text-xs font-medium text-[#1F2937] dark:text-[#E5E7EB] whitespace-nowrap">
            {value || "—"}
          </span>
        ),
      },
      {
        Header: "Sales Exec No.",
        accessor: "SALES_EXECUTIVE_NO",
        Cell: ({ value }: any) => (
          <span className="text-xs text-[#4B5563] dark:text-[#9CA3AF] whitespace-nowrap">
            {value || "—"}
          </span>
        ),
      },
      {
        Header: "Slot 1",
        accessor: "SLOT1",
        cellAlign: "center" as const,
        Cell: ({ value }: any) => (
          <span className="text-xs text-[#4B5563] dark:text-[#9CA3AF] whitespace-nowrap">
            {formatTimeForDisplay(value)}
          </span>
        ),
      },
      {
        Header: "Slot 2",
        accessor: "SLOT2",
        cellAlign: "center" as const,
        Cell: ({ value }: any) => (
          <span className="text-xs text-[#4B5563] dark:text-[#9CA3AF] whitespace-nowrap">
            {formatTimeForDisplay(value)}
          </span>
        ),
      },
      {
        Header: "Slot 3",
        accessor: "SLOT3",
        cellAlign: "center" as const,
        Cell: ({ value }: any) => (
          <span className="text-xs text-[#4B5563] dark:text-[#9CA3AF] whitespace-nowrap">
            {formatTimeForDisplay(value)}
          </span>
        ),
      },
      {
        Header: "Callback Time",
        accessor: "CALLBACK_TIME",
        cellAlign: "center" as const,
        Cell: ({ value }: any) => (
          <span className="text-xs text-[#4B5563] dark:text-[#9CA3AF] whitespace-nowrap">
            {formatTimeForDisplay(value)}
          </span>
        ),
      },
      {
        Header: "Campaign ID",
        accessor: "CAMPAIGN_ID",
        Cell: ({ value }: any) => (
          <span className="text-[11px] font-mono text-[#4B5563] dark:text-[#9CA3AF] break-all">
            {value || "—"}
          </span>
        ),
      },
      {
        Header: "Status",
        accessor: "STATUS",
        cellAlign: "center" as const,
        Cell: ({ value }: any) => <StatusBadge status={value} />,
      },
      {
        Header: "Created At",
        accessor: "CREATED_AT",
        cellAlign: "center" as const,
        Cell: ({ row }: any) => (
          <div className="text-[11px] text-[#6B7280] whitespace-nowrap">
            <div>{row.original.CREATED_AT || "—"}</div>
            {row.original.CREATED_BY && (
              <div className="text-[10px] text-[#9CA3AF]">
                {row.original.CREATED_BY}
              </div>
            )}
          </div>
        ),
      },
      {
        Header: "Updated At",
        accessor: "UPDATED_AT",
        cellAlign: "center" as const,
        Cell: ({ row }: any) => (
          <div className="text-[11px] text-[#6B7280] whitespace-nowrap">
            <div>{row.original.UPDATED_AT || "—"}</div>
            {row.original.UPDATED_BY && (
              <div className="text-[10px] text-[#9CA3AF]">
                {row.original.UPDATED_BY}
              </div>
            )}
          </div>
        ),
      },
      {
        Header: "Actions",
        accessor: "action",
        cellAlign: "center" as const,
        Cell: ({ row }: any) => (
          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={() => openEdit(row.original)}
              title="Edit"
              className="p-1.5 rounded bg-[#EFF6FF] hover:bg-[#DBEAFE]
                dark:bg-[#1E3A8A]/30 dark:hover:bg-[#1E3A8A]/50
                text-[#2563EB] dark:text-[#60A5FA] transition-colors"
            >
              <Edit size={13} />
            </button>
            <button
              onClick={() => handleToggle(row.original)}
              title={row.original.STATUS === 1 ? "Deactivate" : "Activate"}
              className={`p-1.5 rounded transition-colors ${
                row.original.STATUS === 1
                  ? "bg-[#FEF2F2] hover:bg-[#FEE2E2] dark:bg-[#7F1D1D]/30 dark:hover:bg-[#7F1D1D]/50 text-[#EF4444] dark:text-[#F87171]"
                  : "bg-[#F0FDF4] hover:bg-[#DCFCE7] dark:bg-[#14532D]/30 dark:hover:bg-[#14532D]/50 text-[#16A34A] dark:text-[#4ADE80]"
              }`}
            >
              {row.original.STATUS === 1 ? (
                <Lock size={13} />
              ) : (
                <Unlock size={13} />
              )}
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="w-full max-w-full overflow-x-hidden p-3 sm:p-4 flex flex-col gap-4">
      {/* ══ HEADER ══ */}
      <div className="bg-header flex flex-wrap items-center justify-between gap-2 rounded-sm px-4 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <Shield className="h-5 w-5 text-white shrink-0" />
          <div className="min-w-0">
            <h1 className="text-base font-bold text-white leading-tight truncate">
              Insurance Calling Config
            </h1>
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              {rows.length > 0 && (
                <span className="text-[10px] text-white/50">
                  {rows.length} total
                </span>
              )}
              <span className="text-[10px] font-bold text-white rounded-full px-1.5 py-0.5 bg-green-600/60">
                {activeCount} active
              </span>
              {inactiveCount > 0 && (
                <span className="text-[10px] font-bold bg-[#6B7280]/80 text-white rounded-full px-1.5 py-0.5">
                  {inactiveCount} inactive
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchConfigs}
            disabled={isLoading || formLoading}
          >
            Refresh
          </Button>
          {formMode === "edit" && (
            <Button
              variant="print"
              size="sm"
              onClick={resetToCreate}
              disabled={formLoading}
            >
              + New Config
            </Button>
          )}
          <Button
            variant="save"
            size="sm"
            onClick={handleSubmit}
            loading={formLoading}
            disabled={formLoading || isLoading}
          >
            {formLoading
              ? "Saving…"
              : formMode === "edit"
                ? "Update Config"
                : "Save Config"}
          </Button>
          <Button
            variant="print"
            size="sm"
            onClick={() => window.history.back()}
          >
            Back
          </Button>
        </div>
      </div>

      {/* ══ MULTI-LOCATION WARNING ══ */}
      {isMultiLocationUser && (
        <div className="border border-[#FDE047] bg-[#FEFCE8] dark:bg-[#713F12]/20 dark:border-[#A16207] rounded-md p-3 text-sm text-[#A16207] flex items-start gap-2">
          <span className="text-lg leading-none">⚠️</span>
          <div>
            <p className="font-semibold">Multiple branches detected</p>
            <p className="text-xs mt-0.5">
              You have access to <b>{userBranchArray.length} branches</b>:{" "}
              <span className="font-mono">{userBranchArray.join(", ")}</span>.
              Please switch to a <b>single branch</b> account to view or save
              Insurance Calling Config.
            </p>
          </div>
        </div>
      )}

      {/* ══ FORM ══ */}
      <div className="border rounded-md p-3 sm:p-4 bg-white dark:bg-[#0d1117]">
        <h2 className="text-sm font-bold text-[#193A69] dark:text-white mb-3 uppercase tracking-wide">
          {formMode === "edit"
            ? `Edit Config (UTD: ${editUTD})`
            : "New Insurance Calling Config"}
          {userSingleLocation && (
            <span className="ml-2 text-[10px] font-normal text-[#9CA3AF] normal-case">
              (Branch Code: {userSingleLocation})
            </span>
          )}
        </h2>

        {/* Row 1 — Main Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3 mb-4">
          <Ainput
            title="Insurance Company Name"
            type="text"
            name="INSU_COMPANY_NAME"
            redlabel="*"
            value={form.INSU_COMPANY_NAME}
            handleInputChange={(_n, v) => {
              const onlyLetters = v.replace(/[^a-zA-Z\s]/g, "");
              handleFieldChange("INSU_COMPANY_NAME", onlyLetters);
            }}
            onKeyDown={(e) => {
              // ✅ Numbers (0-9) block karo
              if (e.key >= "0" && e.key <= "9") {
                e.preventDefault();
              }
            }}
            placeholder="e.g. HDFC ERGO"
            disabled={formLoading}
            errorMessage={formErrors.INSU_COMPANY_NAME}
            className={
              inputCls +
              (formErrors.INSU_COMPANY_NAME
                ? " !border-[#F87171] focus:!ring-[#F87171]"
                : "")
            }
          />

          <Ainput
            title="Sales Executive Number"
            type="text"
            name="SALES_EXECUTIVE_NO"
            redlabel="*"
            value={form.SALES_EXECUTIVE_NO}
            handleInputChange={(_n, v) => {
              const onlyNumbers = v.replace(/\D/g, "").slice(0, 15);
              handleFieldChange("SALES_EXECUTIVE_NO", onlyNumbers);
            }}
            onKeyDown={(e) => {
              // ✅ Alphabets block karo
              if (
                !/[0-9]/.test(e.key) &&
                e.key !== "Backspace" &&
                e.key !== "Delete"
              ) {
                e.preventDefault();
              }
            }}
            placeholder="e.g. 9876643210"
            max={15}
            disabled={formLoading}
            errorMessage={formErrors.SALES_EXECUTIVE_NO}
            className={
              inputCls +
              (formErrors.SALES_EXECUTIVE_NO
                ? " !border-[#F87171] focus:!ring-[#F87171]"
                : "")
            }
          />

          <Ainput
            title="Campaign ID"
            type="text"
            name="CAMPAIGN_ID"
            redlabel="*"
            value={form.CAMPAIGN_ID}
            handleInputChange={(_n, v) => handleFieldChange("CAMPAIGN_ID", v)}
            placeholder="Campaign UUID"
            disabled={formLoading}
            errorMessage={formErrors.CAMPAIGN_ID}
            className={
              inputCls +
              (formErrors.CAMPAIGN_ID
                ? " !border-[#F87171] focus:!ring-[#F87171]"
                : "")
            }
          />
        </div>

        <div className="border-t border-dashed border-[#E5E7EB] dark:border-[#374151] mb-4" />

        {/* Row 2 — Time Slots */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3 mb-4">
          <TimeField
            label="Slot 1 Time"
            value={form.SLOT1}
            onChange={(v) => handleFieldChange("SLOT1", v)}
            disabled={formLoading}
          />
          <TimeField
            label="Slot 2 Time"
            value={form.SLOT2}
            onChange={(v) => handleFieldChange("SLOT2", v)}
            disabled={formLoading}
          />
          <TimeField
            label="Slot 3 Time"
            value={form.SLOT3}
            onChange={(v) => handleFieldChange("SLOT3", v)}
            disabled={formLoading}
          />
          <TimeField
            label="Callback Time"
            value={form.CALLBACK_TIME}
            onChange={(v) => handleFieldChange("CALLBACK_TIME", v)}
            disabled={formLoading}
          />
        </div>

        {/* Edit only — Status */}
        {formMode === "edit" && (
          <>
            <div className="border-t border-dashed border-[#E5E7EB] dark:border-[#374151] mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
              <Field label="Status">
                <div className="flex items-center gap-4 h-9 px-3 rounded border border-[#D1D5DB] dark:border-[#4B5563] bg-white dark:bg-[#0d1117]">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="insu-cfg-status"
                      checked={form.STATUS === 1}
                      onChange={() => handleFieldChange("STATUS", 1)}
                      disabled={formLoading}
                    />
                    <span className="text-xs font-medium text-[#16A34A] dark:text-[#4ADE80]">
                      Active
                    </span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="insu-cfg-status"
                      checked={form.STATUS === 0}
                      onChange={() => handleFieldChange("STATUS", 0)}
                      disabled={formLoading}
                    />
                    <span className="text-xs font-medium text-[#6B7280]">
                      Inactive
                    </span>
                  </label>
                </div>
              </Field>
            </div>
          </>
        )}
      </div>

      {/* ══ FILTER ══ */}
      <div className="border rounded-md p-3 sm:p-4 bg-white dark:bg-[#0d1117]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3 items-end">
          <Field label="Filter by Status">
            <select
              className={selectCls}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              disabled={isLoading}
            >
              <option value="">All Status</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </Field>

          <div className="flex gap-2 sm:col-span-2 items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchConfigs}
              disabled={isLoading}
              className="flex-1"
            >
              Apply
            </Button>
            <Button
              variant="print"
              size="sm"
              onClick={() => setFilterStatus("")}
              disabled={isLoading}
              className="flex-1"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* ══ TABLE ══ */}
      <div className="border p-2 rounded-md bg-white dark:bg-[#0d1117] overflow-hidden">
        <div className="w-full overflow-x-auto">
          <DataTable
            title={isLoading ? "Loading…" : "Insurance Calling Config List"}
            columns={columns}
            selectValue="UTD"
            data={rows}
            height={440}
            filterPosition="FilterData"
            enableColumnFilters={true}
            numericFilterColumns={["UTD", "LOC_CODE", "STATUS"]}
            onRowDoubleClick={(r: InsuCallingConfig) => openEdit(r)}
          />
        </div>
      </div>

      <HashloaderComponent isLoading={isLoading || formLoading} />
    </div>
  );
}
