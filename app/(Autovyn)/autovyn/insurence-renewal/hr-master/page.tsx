"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Ainput from "@/components/atoms/Einput";
import SelectSearch from "@/components/atoms/Select";
import { Button } from "@/components/ui/button";
import ServiceTabel from "@/components/Templates/Servicetable";
import { onlybranch } from "@/action/branch";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import {
    ShieldCheck,
    CalendarCheck,
    Clock,
    Layers,
    Settings,
    AlertCircle,
    CheckCircle2,
    RefreshCw,
    Database,
    Timer,
    HelpCircle,
    X,
    Search,
    BookOpen,
    Info,
} from "lucide-react";

// ============================================================
// CONSTANTS & DROPDOWN OPTIONS
// ============================================================
const POLICY_TYPE_OPTIONS = [
    { value: "Leave", label: "Leave Policy" },
    { value: "Mispunch", label: "Mispunch Policy" },
];

const LEAVE_TYPE_OPTIONS = [
    { label: "CL - Casual Leave", value: "CL" },
    { label: "PL -   Paid Leave", value: "PL" },
    { label: "SL - Sick Leave", value: "SL" },
    { label: "CO - Comp Off", value: "CO" },
    { label: "HCL - Half Casual Leave", value: "HCL" },
    { label: "HPL - Half Paid Leave", value: "HPL" },
    { label: "HSL - Half Sick Leave", value: "HSL" },
    { label: "HESL - Half Earned Sick Leave", value: "HESL" },
    { label: "HSSL - Half Special Sick Leave", value: "HSSL" },
    { label: "HCO - Half Comp Off", value: "HCO" },
];

const LEAVE_TYPE_MAP: Record<string, { code: number; name: string }> = {
    CL: { code: 4, name: "CASUAL LEAVE" },
    PL: { code: 5, name: "Paid LEAVE" },
    SL: { code: 6, name: "SICK LEAVE" },
    CO: { code: 9, name: "COMP OFF" },
    HCL: { code: 10, name: "HALF CASUAL LEAVE" },
    HPL: { code: 120, name: "HALF PAID LEAVE" },
    HSL: { code: 121, name: "HALF SICK LEAVE" },
    HESL: { code: 122, name: "HALF EARNED SICK LEAVE" },
    HSSL: { code: 123, name: "HALF SPECIAL SICK LEAVE" },
    HCO: { code: 104, name: "HALF COMP OFF" },
};

const STATUS_OPTIONS = [
    { label: "ACTIVE", value: "ACTIVE" },
    { label: "INACTIVE", value: "INACTIVE" },
];

const APP_TYPE_OPTIONS = [
    { label: "USER & HR", value: "USER & HR" },
    { label: "HR", value: "HR" },
];

const ASSESSABLE_TYPE_OPTIONS = [
    { label: "1 → Full Day Leave", value: "1" },
    { label: "2 → Half Day Leave", value: "2" },
    { label: "3 → Full Leave Without Payment", value: "3" },
    { label: "4 → Half Day Leave Without Pay", value: "4" },
];

const PresentValueOptions = [
    { label: "Actual", value: "Actual" },
    { label: "0", value: "0" },
    { label: ".25", value: ".25" },
    { label: ".50", value: ".50" },
    { label: ".65", value: ".65" },
    { label: ".75", value: ".75" },
    { label: "-1", value: "-1" },
];

const AbsentValueOptions = [
    { label: "Actual", value: "Actual" },
    { label: "0", value: "0" },
    { label: ".25", value: ".25" },
    { label: ".50", value: ".50" },
    { label: ".65", value: ".65" },
    { label: ".75", value: ".75" },
    { label: "-1", value: "-1" },
    { label: "2", value: "2" },
];

const LeaveValueOptions = [
    { label: "0", value: "0" },
    { label: "1", value: "1" },
    { label: ".5", value: ".5" },
    { label: ".25", value: ".25" },
];

const InTimeOptions = [
    { label: "Actual", value: "0" },
    { label: "Shift Time", value: "1" },
    { label: "Not Required", value: "2" },
];

const CARRY_FORWARD_OPTIONS = [
    { label: "1 (Leave addon in next month)", value: "1" },
    { label: "NULL (Leave not addon in next month)", value: "null" },
];

const BACK_DATE_OPTIONS = [
    { label: "Back Date NOT Allowed ", value: "1" },
    { label: "Back Date Allowed ", value: "null" },
];

const MIN_BALANCE_OPTIONS = [
    { label: "1", value: "1" },
    { label: "0.5", value: "0.5" },
];

const FIELD_GUIDE_SECTIONS = [
    {
        id: "core",
        title: "1. Core Policy Setup",
        icon: Layers,
        items: [
            {
                title: "Policy Mode (Leave vs. Mispunch)",
                keywords: "policy mode type leave mispunch core setup",
                content: (
                    <>
                        <strong>Leave Policy:</strong> Use for employee leaves (like CL, PL, SL) to deduct leave balance and set monthly limits.<br />
                        <strong>Mispunch Policy:</strong> Use when employee came to office but forgot to punch in/out.
                    </>
                ),
            },
            {
                title: "Leave Type (Predefined Categories)",
                keywords: "leave type categories cl pl sl co hcl hpl hsl hesl hssl hco master",
                content: (
                    <>
                        Main leave categories: <strong>CL</strong> (Casual), <strong>PL</strong> (Paid), <strong>SL</strong> (Sick), <strong>CO</strong> (Comp Off), <strong>HCL</strong>, <strong>HPL</strong>, <strong>HSL</strong>, <strong>HESL</strong>, <strong>HSSL</strong>, <strong>HCO</strong>.<br />
                        Selecting a type loads existing setup or creates a new policy under that type.
                    </>
                ),
            },
            {
                title: "Status (Mispunch Status)",
                keywords: "status mispunch abbr abbreviation mp tr to code short",
                content: (
                    <>
                        Short code for mispunch reason (e.g. <strong>MP</strong> for Mispunch, <strong>TR</strong> for Traffic Delay, <strong>TO</strong> for Tour/Outdoor Duty).
                    </>
                ),
            },
        ],
    },
    {
        id: "reason",
        title: "2. Reason Name & Attendance Values",
        icon: Settings,
        items: [
            {
                title: "Reason Name / Leave Name",
                keywords: "reason name leave name policy title descriptive identity",
                content: (
                    <>
                        Full name that employees will see in dropdown when applying (e.g., <em>"Casual Leave"</em>, <em>"Paid Leave"</em>, or <em>"Mispunch - Traffic Delay"</em>).
                    </>
                ),
            },
            {
                title: "Present Value & Absent Value",
                keywords: "present value absent score attendance credit penalty actual dtl1 dtl2",
                content: (
                    <>
                        <strong>Present Value:</strong> Gives attendance on approval: <strong>1.0</strong> = Full Day, <strong>0.5</strong> = Half Day, <br />
                        <strong>0</strong> = No Present.<br />
                        <strong>Absent Value:</strong> Marks employee as absent: <strong>1.0</strong> = Full Day, <strong>0.5</strong> = Half Day, <br /> <strong>0</strong> = Not Absent.
                    </>
                ),
            },
            {
                title: "Leave Value (ERP)",
                keywords: "leave value erp dtl3 deduction full half day calculation",
                colSpan: true,
                content: (
                    <>
                        Deducts leave from balance in ERP: <strong>1.0</strong> = Full Day Leave, <strong>0.5</strong> = Half Day Leave (for Mispunch enter <strong>0</strong>).
                    </>
                ),
            },
        ],
    },
    {
        id: "limit",
        title: "3. Monthly Leave Limit & Cloud Leave Value",
        icon: CalendarCheck,
        items: [
            {
                title: "Monthly Leave Limit (Count)",
                keywords: "monthly leave limit count max frequency num1 unlimited quota",
                content: (
                    <>
                        How many times an employee can apply for this leave in Current month (enter <strong>0</strong> for unlimited).
                    </>
                ),
            },
            {
                title: "Leave Value (Cloud)",
                keywords: "leave value cloude mobile app num2 weight score cloud",
                content: (
                    <>
                        Deducts leave from balance on Cloud / Mobile App: <strong>1.0</strong> = Full Day, <strong>0.5</strong> = Half Day, <br /> <strong>0</strong> = None.
                    </>
                ),
            },
        ],
    },
    {
        id: "rules",
        title: "4. Leave Policy Constraints & Quota Rules",
        icon: CalendarCheck,
        items: [
            {
                title: "Leave / Assessable Type",
                keywords: "assessable column salary calculation lwp without pay full half day assessable_column",
                content: (
                    <>
                        <strong>1:</strong> Full Day Leave (cuts 1 paid day).<br />
                        <strong>2:</strong> Half Day Leave (cuts 0.5 paid day).<br />
                        <strong>3:</strong> Full LWP (Full Day Leave Without Pay - no salary).<br />
                        <strong>4:</strong> Half LWP (Half Day Leave Without Pay - no salary).
                    </>
                ),
            },
            {
                title: "Minimum Value (MIN_VALUE)",
                keywords: "minimum bal balance req min_value eligible balance required min half day",
                content: (
                    <>
                        Used only for Half day leaves. For example: <br /> <strong>1</strong> = only assessable for full day leave, <strong>0.5</strong> = assessable for both full day and half day leaves.
                    </>
                ),
            },
            {
                title: "Continuous Max Days",
                keywords: "continuous max days consecutive stretch limit continuous_max",
                content: (
                    <>
                        Maximum number of leave days that can be taken together in one go (e.g. max 3 days in a row).
                    </>
                ),
            },
            {
                title: "Days Front (CC_Group) & Days Back (CC_Ledg)",
                keywords: "days front cc_group advance back cc_ledg retroactive past future notice",
                content: (
                    <>
                        <strong>Days Front (CC_Group):</strong> How many days in advance employee can apply for leave / mispunch.<br />
                        <strong>Days Back (CC_Ledg):</strong> How many past days an employee can apply for leave / mispunch after taking it.
                    </>
                ),
            },
            {
                title: "Carry Forward (is_carry)",
                keywords: "carry forward is_carry balance lapse addon 1 null next month",
                content: (
                    <>
                        <strong>1:</strong> Add remaining leave balance to next month.<br />
                        <strong>NULL:</strong> Do not add to next month (unused leave will expire).
                    </>
                ),
            },
            {
                title: "Back Date Rule (dis_back_date)",
                keywords: "back date rule dis_back_date allowed blocked past retroactive dis_back_date",
                content: (
                    <>
                        <strong>Allowed (NULL):</strong> Allow applying for past dates.<br />
                        <strong>Blocked (1):</strong> Block applying for past dates (can only apply for today or future dates).
                    </>
                ),
            },
        ],
    },
    {
        id: "access",
        title: "5. Policy Access Target (User & HR vs. HR Portal)",
        icon: ShieldCheck,
        items: [
            {
                title: "Policy Type",
                keywords: "user hr portal export_type app_type target access audience mobile self service",
                colSpan: true,
                content: (
                    <>
                        <strong>USER & HR:</strong> Available for employees on Mobile App & Self-Service Portal so they can apply.<br />
                        <strong>HR:</strong> Only accessable to Hr Admin portal.
                    </>
                ),
            },
        ],
    },
];

// ============================================================
// TOAST HELPER
// ============================================================
const showToast = (
    msg: string,
    type: "success" | "error" | "warning" | "info"
) => {
    Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
    }).fire({ icon: type, title: msg });
};

// ============================================================
// COMPONENT
// ============================================================
export default function LeaveMispunchPolicyPage() {
    const user = useCurrentUser();

    // Form State
    const [policyType, setPolicyType] = useState<"Leave" | "Mispunch">("Leave");
    const [formData, setFormData] = useState({
        Misc_Name: "",
        Misc_Abbr: "",
        Misc_Dtl1: "",
        Misc_Dtl2: "",
        Misc_Dtl3: "",
        Misc_Num1: "",
        Misc_Num2: "",
        Loc_Code: "",
        CC_Group: "",
        CC_Ledg: "",
        Assessable_Column: "",
        MIN_VALUE: "",
        Continuous_Max: "",
        is_carry: "",
        dis_back_date: "",
        Policy_type: "",
    });

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [branchOptions, setBranchOptions] = useState<{ value: string; label: string }[]>([]);
    const [isLoadingBranches, setIsLoadingBranches] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isLoadingTable, setIsLoadingTable] = useState(false);
    const [policyList, setPolicyList] = useState<any[]>([]);
    const [editingMiscCode, setEditingMiscCode] = useState<number | string | null>(null);
    const [editingUtd, setEditingUtd] = useState<number | string | null>(null);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [helpSearch, setHelpSearch] = useState("");
    const topRef = useRef<HTMLDivElement>(null);

    // -----------------------------------------------------------
    // Fetch Locations / Branches
    // -----------------------------------------------------------
    useEffect(() => {
        const loadBranches = async () => {
            if (!user) return;
            setIsLoadingBranches(true);
            try {
                const response = await onlybranch(user);
                if (response?.data && Array.isArray(response.data)) {
                    const formatted = response.data.map((b: any) => ({
                        value: String(b.Code ?? b.value),
                        label: `${b.Code ?? b.value} - ${b.Name ?? b.label}`,
                    }));
                    setBranchOptions(formatted);

                    // Default to user's branch if available
                    if (user?.branch) {
                        setFormData((prev) => ({ ...prev, Loc_Code: String(user.branch) }));
                    } else if (formatted.length > 0) {
                        setFormData((prev) => ({ ...prev, Loc_Code: formatted[0].value }));
                    }
                }
            } catch (error) {
                console.error("Error loading branch options:", error);
            } finally {
                setIsLoadingBranches(false);
            }
        };

        loadBranches();
    }, [user]);

    // -----------------------------------------------------------
    // Fetch Policies from Backend API
    // -----------------------------------------------------------
    const fetchPolicies = async () => {
        if (!user) return;
        setIsLoadingTable(true);
        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/DefaultMaster/getLeaveMispunchPolicies`,
                {
                    Loc_Code: user?.branch,
                },
                {
                    headers: {
                        compcode: user?.Comp_Code,
                        name: user?.name,

                    },
                }
            );

            if (response.data?.success && Array.isArray(response.data.data)) {
                const formatted = response.data.data.map((item: any) => {
                    const isLeaveItem = item.Assessable_Column !== null && item.Assessable_Column !== undefined;
                    const assessLabel = isLeaveItem
                        ? ASSESSABLE_TYPE_OPTIONS.find((o) => o.value === String(item.Assessable_Column))?.label || String(item.Assessable_Column)
                        : "NULL (Mispunch)";

                    const appTypeLabel =
                        item.Export_Type === 1 || item.Export_Type === "1" || item.App_Type === "User" || item.App_Type === "USER & HR" || item.App_Type === "USER&HR"
                            ? "USER & HR"
                            : item.Export_Type === 2 || item.Export_Type === "2" || item.App_Type === "HR"
                                ? "HR"
                                : item.App_Type || "-";

                    const isMinOne = item.MIN_VALUE === 1 || item.MIN_VALUE === "1" || item.MIN_VALUE === 1.0 || item.MIN_VALUE === "1.0";

                    return {
                        id: item.UTD || item.Misc_Code,
                        UTD: item.UTD,
                        Misc_Code: item.Misc_Code,
                        policyType: isLeaveItem ? "Leave" : "Mispunch",
                        Misc_Name: item.Misc_Name,
                        Misc_Abbr: item.Misc_Abbr,
                        Loc_Code: item.Loc_code,
                        Loc_Name: item.Loc_Name || item.Loc_code,
                        Assessable_Column: assessLabel,
                        rawAssessable: item.Assessable_Column,
                        Misc_Num1: item.Misc_Num1 !== null && item.Misc_Num1 !== undefined ? String(item.Misc_Num1) : "-",
                        rawMiscNum1: item.Misc_Num1?.toString() ?? "0",
                        Misc_Num2: item.Misc_Num2 !== null && item.Misc_Num2 !== undefined ? String(item.Misc_Num2) : "-",
                        rawMiscNum2: item.Misc_Num2?.toString() ?? "0",
                        Misc_Dtl1: item.Misc_Dtl1 || "-",
                        Misc_Dtl2: item.Misc_Dtl2 || "-",
                        Misc_Dtl3: item.Misc_Dtl3 ?? "-",
                        CC_Group: item.CC_Group ?? "-",
                        CC_Ledg: item.CC_Ledg ?? "-",
                        MIN_VALUE: isMinOne ? "1" : "NULL",
                        rawMinValue: isMinOne ? "1" : "0.5",
                        Continuous_Max: item.Continuous_Max ?? "-",
                        is_carry: item.is_carry === 1 ? "1 (Addon in next month)" : "NULL (Not addon in next month)",
                        rawCarry: item.is_carry === 1 ? "1" : "null",
                        dis_back_date: item.dis_back_date === 1 ? "Not Allowed (1)" : "Allowed (NULL)",
                        rawBackDate: item.dis_back_date === 1 ? "1" : "null",
                        Policy_type: appTypeLabel,
                    };
                });

                setPolicyList(formatted);
            }
        } catch (error) {
            console.error("Error fetching policy list:", error);
        } finally {
            setIsLoadingTable(false);
        }
    };

    useEffect(() => {
        fetchPolicies();
    }, [user]);

    // -----------------------------------------------------------
    // Dynamic Leave Name Options (Extracted from Table / Master List)
    // -----------------------------------------------------------
    const leaveNameOptions = useMemo(() => {
        const namesFromTable = policyList
            .filter((p) => p.policyType === "Leave" && p.Misc_Name)
            .map((p) => p.Misc_Name.trim().toUpperCase());



        const uniqueNames = Array.from(new Set([...namesFromTable]));
        return uniqueNames.map((name) => ({
            value: name,
            label: name,
        }));
    }, [policyList]);

    // -----------------------------------------------------------
    // Check if the currently entered/selected policy exists in the table
    // -----------------------------------------------------------
    const isPolicyInTable = useMemo(() => {
        if (policyType === "Leave") {
            const currentAbbr = (formData.Misc_Abbr || "").trim().toUpperCase();
            const currentName = (formData.Misc_Name || "").trim().toUpperCase();
            const mappedCode = currentAbbr && LEAVE_TYPE_MAP[currentAbbr] ? LEAVE_TYPE_MAP[currentAbbr].code : null;

            return policyList.some(
                (p) =>
                    p.policyType === "Leave" &&
                    ((mappedCode && Number(p.Misc_Code) === mappedCode) ||
                        (currentAbbr && String(p.Misc_Abbr || "").trim().toUpperCase() === currentAbbr) ||
                        (currentName && String(p.Misc_Name || "").trim().toUpperCase() === currentName) ||
                        (editingMiscCode && Number(p.Misc_Code) === Number(editingMiscCode)) ||
                        (editingUtd && p.UTD === editingUtd))
            );
        } else {
            return Boolean(
                (editingMiscCode && policyList.some((p) => p.policyType === "Mispunch" && Number(p.Misc_Code) === Number(editingMiscCode))) ||
                (editingUtd && policyList.some((p) => p.policyType === "Mispunch" && p.UTD === editingUtd))
            );
        }
    }, [policyType, formData.Misc_Abbr, formData.Misc_Name, editingMiscCode, editingUtd, policyList]);

    // -----------------------------------------------------------
    // Handle Input Changes
    // -----------------------------------------------------------
    const handleInputChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (validationErrors[name]) {
            setValidationErrors((prev) => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }
    };

    // -----------------------------------------------------------
    // Switch Policy Type (Clean reset of irrelevant fields)
    // -----------------------------------------------------------
    const handlePolicyTypeChange = (_name: string, value: string) => {
        const selected = value === "Mispunch" ? "Mispunch" : "Leave";
        setPolicyType(selected);
        setValidationErrors({});
        setEditingMiscCode(null);
        setEditingUtd(null);

        setFormData({
            Misc_Name: "",
            Misc_Abbr: "",
            Misc_Dtl1: "",
            Misc_Dtl2: "",
            Misc_Dtl3: "",
            Misc_Num1: "",
            Misc_Num2: "",
            Loc_Code: user?.branch ? String(user.branch) : (branchOptions[0]?.value || ""),
            CC_Group: "",
            CC_Ledg: "",
            Assessable_Column: "",
            MIN_VALUE: "",
            Continuous_Max: "",
            is_carry: "",
            dis_back_date: "",
            Policy_type: "",
        });
    };

    // -----------------------------------------------------------
    // Handle Leave Type Dropdown Selection (Auto-Update or New Save)
    // -----------------------------------------------------------
    const handleLeaveTypeChange = (name: string, value: string) => {
        handleInputChange(name, value);
        const mapping = LEAVE_TYPE_MAP[value];
        if (!mapping) return;

        const targetCode = mapping.code;
        // Check if a policy with this Misc_Code or Misc_Abbr already exists in policyList
        const existingPolicy = policyList.find(
            (p) =>
                (Number(p.Misc_Code) === targetCode || String(p.Misc_Abbr || "").toUpperCase() === value.toUpperCase()) &&
                p.policyType === "Leave"
        );

        if (existingPolicy) {
            // Populate form with existing policy data for updating
            handleRowDoubleClick(existingPolicy);
            setFormData((prev) => ({
                ...prev,
                Misc_Abbr: value,
            }));
            // showToast(`Loaded existing "${existingPolicy.Misc_Name}" (Code: ${targetCode}) for Update`, "info");
        } else {
            // New entry with fixed Misc_Code and Misc_Abbr
            setEditingMiscCode(null);
            setEditingUtd(null);
            setFormData((prev) => ({
                ...prev,
                Misc_Abbr: value,
                Misc_Name: mapping.name,
            }));
        }
    };

    // -----------------------------------------------------------
    // Dynamic Assessable Type Quick Auto-fill
    // -----------------------------------------------------------
    const handleAssessableTypeChange = (name: string, value: string) => {
        handleInputChange(name, value);
        if (value === "2" || value === "4") {
            // Half Day Leave
            handleInputChange("Misc_Dtl3", ".5");
        } else if (value === "1" || value === "3") {
            // Full Day Leave
            handleInputChange("Misc_Dtl3", "1");
        }
    };

    // -----------------------------------------------------------
    // Row Double Click (Fill form for inspection/editing)
    // -----------------------------------------------------------
    const handleRowDoubleClick = (rowData: any) => {
        const pType = rowData.policyType === "Leave" ? "Leave" : "Mispunch";
        setPolicyType(pType);
        setEditingMiscCode(rowData.Misc_Code);
        setEditingUtd(rowData.UTD || null);
        setFormData({
            Misc_Name: rowData.Misc_Name || "",
            Misc_Abbr: rowData.Misc_Abbr || "",
            Misc_Dtl1: rowData.Misc_Dtl1 === "-" ? "Actual" : (rowData.Misc_Dtl1 || "Actual"),
            Misc_Dtl2: rowData.Misc_Dtl2 === "-" ? "Actual" : (rowData.Misc_Dtl2 || "Actual"),
            Misc_Dtl3: String(rowData.Misc_Dtl3 === "-" ? (pType === "Leave" ? "1" : "0") : (rowData.Misc_Dtl3 ?? "0")),
            Misc_Num1: rowData.rawMiscNum1 || "0",
            Misc_Num2: rowData.rawMiscNum2 || "0",
            Loc_Code: String(rowData.Loc_Code || ""),
            CC_Group: String(rowData.CC_Group === "-" ? "0" : rowData.CC_Group || "0"),
            CC_Ledg: String(rowData.CC_Ledg === "-" ? "0" : rowData.CC_Ledg || "0"),
            Assessable_Column: rowData.rawAssessable ? String(rowData.rawAssessable) : (pType === "Leave" ? "1" : ""),
            MIN_VALUE: rowData.rawMinValue ? String(rowData.rawMinValue) : (rowData.MIN_VALUE === "1" || rowData.MIN_VALUE === 1 ? "1" : "0.5"),
            Continuous_Max: String(rowData.Continuous_Max === "-" ? "0" : rowData.Continuous_Max || "0"),
            is_carry: rowData.rawCarry || "null",
            dis_back_date: rowData.rawBackDate || "null",
            Policy_type: (rowData.Policy_type || rowData.App_Type) === "HR" ? "HR" : "USER & HR",
        });

        // Auto scroll to top of the page smoothly across all scrollable containers
        setTimeout(() => {
            if (topRef.current) {
                topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
            }
            if (typeof window !== "undefined") {
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
            if (typeof document !== "undefined") {
                document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
                document.body.scrollTo({ top: 0, behavior: "smooth" });
                const scrollContainers = document.querySelectorAll(
                    "main, [class*='overflow-y-auto'], [class*='overflow-auto'], [class*='overflow-y-scroll']"
                );
                scrollContainers.forEach((el) => {
                    el.scrollTo({ top: 0, behavior: "smooth" });
                });
            }
        }, 50);
    };

    // -----------------------------------------------------------
    // Validation
    // -----------------------------------------------------------
    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!formData.Misc_Name || !formData.Misc_Name.trim()) {
            errors.Misc_Name = "Policy Name is required";
        }

        if (policyType === "Leave") {
            if (!formData.Misc_Abbr || !formData.Misc_Abbr.trim()) {
                errors.Misc_Abbr = "Leave Type is required";
            }
        } else {
            if (!formData.Misc_Abbr || !formData.Misc_Abbr.trim()) {
                errors.Misc_Abbr = "Abbreviation (Misc_Abbr) is required";
            }
        }

        if (!formData.Policy_type || (formData.Policy_type !== "USER & HR" && formData.Policy_type !== "User" && formData.Policy_type !== "HR")) {
            errors.Policy_type = "Valid Policy Type is required";
        }

        if (policyType === "Leave") {
            if (formData.Misc_Dtl3 === "" || isNaN(Number(formData.Misc_Dtl3)) || Number(formData.Misc_Dtl3) < 0) {
                errors.Misc_Dtl3 = "Valid non-negative leave value required";
            }

            if (!formData.Assessable_Column || ![1, 2, 3, 4].includes(Number(formData.Assessable_Column))) {
                errors.Assessable_Column = "Assessable Leave Type is required";
            }

            if (formData.MIN_VALUE === "" || (formData.MIN_VALUE !== "1" && formData.MIN_VALUE !== "0.5")) {
                errors.MIN_VALUE = "Minimum Value is required (1 or 0.5)";
            }

            if (formData.Continuous_Max === "" || isNaN(Number(formData.Continuous_Max)) || Number(formData.Continuous_Max) < 0) {
                errors.Continuous_Max = "Continuous Max must be >= 0";
            }
        }

        if (formData.CC_Group !== "" && (isNaN(Number(formData.CC_Group)) || Number(formData.CC_Group) < 0)) {
            errors.CC_Group = "Must be a valid positive number";
        }

        if (formData.CC_Ledg !== "" && (isNaN(Number(formData.CC_Ledg)) || Number(formData.CC_Ledg) < 0)) {
            errors.CC_Ledg = "Must be a valid positive number";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // -----------------------------------------------------------
    // Save Handler (Insert New Policy)
    // -----------------------------------------------------------
    const handleSave = async () => {
        if (typeof user?.branch === "string" || user?.branch?.toString().includes(",")) {
            Swal.fire({
                icon: "warning",
                title: "Not Allowed",
                text: "Multi branch not allowed to save entry",
            });
            return;
        }

        if (!validateForm()) {
            showToast("Please fill required fields before submitting it", "warning");
            return;
        }

        const isLeave = policyType === "Leave";
        const fixedLeaveCode = isLeave && formData.Misc_Abbr && LEAVE_TYPE_MAP[formData.Misc_Abbr]
            ? LEAVE_TYPE_MAP[formData.Misc_Abbr].code
            : undefined;

        // If Leave Type or Policy already exists in table, warn user to use Update button
        if (isLeave && fixedLeaveCode) {
            const alreadyExists = policyList.some(
                (p) =>
                    (Number(p.Misc_Code) === fixedLeaveCode || String(p.Misc_Abbr || "").toUpperCase() === String(formData.Misc_Abbr || "").toUpperCase()) &&
                    p.policyType === "Leave"
            );
            if (alreadyExists || (editingMiscCode && isPolicyInTable)) {
                showToast("This Leave Policy already exists. Please use the Update button.", "warning");
                return;
            }
        } else if (editingMiscCode && isPolicyInTable) {
            showToast("Policy already selected. Please use the Update button to modify it.", "warning");
            return;
        }

        setIsSaving(true);

        try {

            const payload: Record<string, any> = {
                Misc_Code: fixedLeaveCode,
                Misc_Name: formData.Misc_Name.trim().toUpperCase(),
                Misc_Abbr: formData.Misc_Abbr ? formData.Misc_Abbr.trim() : (isLeave ? "CL" : ""),
                Misc_Dtl1: formData.Misc_Dtl1 || "Actual",
                Misc_Dtl2: formData.Misc_Dtl2 || "Actual",
                Misc_Dtl3: isLeave ? String(formData.Misc_Dtl3 || "0") : "0",
                Misc_Num1: formData.Misc_Num1 !== "" && formData.Misc_Num1 !== null ? Number(formData.Misc_Num1) : 0,
                Misc_Num2: formData.Misc_Num2 !== "" && formData.Misc_Num2 !== null ? Number(formData.Misc_Num2) : 0,
                Loc_Code: Number(formData.Loc_Code || user?.branch || branchOptions[0]?.value || 0),
                App_Type: formData.Policy_type || "USER & HR",
                dis_back_date: formData.dis_back_date === "1" ? 1 : null,
                CC_Group: formData.CC_Group !== "" ? Number(formData.CC_Group) : 0,
                CC_Ledg: formData.CC_Ledg !== "" ? Number(formData.CC_Ledg) : 0,
            };

            if (isLeave) {
                payload.Assessable_Column = Number(formData.Assessable_Column);
                payload.CC_Group = formData.CC_Group !== "" ? Number(formData.CC_Group) : 0;
                payload.CC_Ledg = formData.CC_Ledg !== "" ? Number(formData.CC_Ledg) : 0;
                payload.MIN_VALUE = formData.MIN_VALUE === "1" ? 1 : null;
                payload.Continuous_Max = formData.Continuous_Max !== "" ? Number(formData.Continuous_Max) : 0;
                payload.is_carry = formData.is_carry === "1" ? 1 : null;
            } else {
                payload.Assessable_Column = null;
            }

            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/DefaultMaster/insertLeaveMispunchPolicy`,
                payload,
                {
                    headers: {
                        compcode: user?.Comp_Code,
                        name: user?.name,
                    },
                }
            );

            if (response.data?.success) {
                showToast(response.data.message || "Policy Saved Successfully", "success");
                await fetchPolicies();
                handleReset();
            } else {
                showToast(response.data?.message || "Failed to save policy", "error");
            }
        } catch (error: any) {
            console.error("API error while saving policy:", error);
            if (error?.response?.status === 409) {
                showToast(
                    error.response.data?.message || "This Leave/Mispunch Policy Already Exist",
                    "warning"
                );
            } else if (error?.response?.data?.message) {
                showToast(error.response.data.message, "error");
            } else {
                showToast("Error occurred while saving policy. Please try again.", "error");
            }
        } finally {
            setIsSaving(false);
        }
    };

    // -----------------------------------------------------------
    // Update Handler (Update Existing Policy)
    // -----------------------------------------------------------
    const handleUpdate = async () => {
        const isLeave = policyType === "Leave";
        const fixedLeaveCode = isLeave && formData.Misc_Abbr && LEAVE_TYPE_MAP[formData.Misc_Abbr]
            ? LEAVE_TYPE_MAP[formData.Misc_Abbr].code
            : (editingMiscCode ? Number(editingMiscCode) : undefined);

        if (!editingMiscCode && !fixedLeaveCode) {
            showToast("Please select a Leave Type or double-click any row in the table to update", "warning");
            return;
        }

        if (!isPolicyInTable) {
            showToast("This policy does not exist in the table yet. Please click Save instead.", "warning");
            return;
        }

        if (typeof user?.branch === "string" || user?.branch?.toString().includes(",")) {
            Swal.fire({
                icon: "warning",
                title: "Not Allowed",
                text: "Multi branch not allowed to update entry",
            });
            return;
        }

        if (!validateForm()) {
            showToast("Please fix the errors in the form before submitting", "warning");
            return;
        }

        setIsUpdating(true);

        try {
            // If editingUtd is missing, try to resolve from existing policy in policyList
            let targetUtd = editingUtd;
            if (!targetUtd && fixedLeaveCode) {
                const matchedPolicy = policyList.find(
                    (p) =>
                        (Number(p.Misc_Code) === fixedLeaveCode || String(p.Misc_Abbr || "").toUpperCase() === String(formData.Misc_Abbr || "").toUpperCase()) &&
                        p.policyType === "Leave"
                );
                if (matchedPolicy?.UTD) {
                    targetUtd = matchedPolicy.UTD;
                }
            }

            const payload: Record<string, any> = {
                Misc_Code: fixedLeaveCode,
                Misc_Name: formData.Misc_Name.trim().toUpperCase(),
                Misc_Abbr: formData.Misc_Abbr ? formData.Misc_Abbr.trim() : (isLeave ? "CL" : ""),
                Misc_Dtl1: formData.Misc_Dtl1 || "Actual",
                Misc_Dtl2: formData.Misc_Dtl2 || "Actual",
                Misc_Dtl3: isLeave ? String(formData.Misc_Dtl3 || "0") : "0",
                Misc_Num1: formData.Misc_Num1 !== "" && formData.Misc_Num1 !== null ? Number(formData.Misc_Num1) : 0,
                Misc_Num2: formData.Misc_Num2 !== "" && formData.Misc_Num2 !== null ? Number(formData.Misc_Num2) : 0,
                Loc_Code: Number(formData.Loc_Code || user?.branch || branchOptions[0]?.value || 0),
                App_Type: formData.Policy_type || "USER & HR",
                dis_back_date: formData.dis_back_date === "1" ? 1 : null,
                CC_Group: formData.CC_Group !== "" ? Number(formData.CC_Group) : 0,
                CC_Ledg: formData.CC_Ledg !== "" ? Number(formData.CC_Ledg) : 0,
            };

            if (targetUtd) {
                payload.UTD = Number(targetUtd);
            }

            if (isLeave) {
                payload.Assessable_Column = Number(formData.Assessable_Column);
                payload.CC_Group = formData.CC_Group !== "" ? Number(formData.CC_Group) : 0;
                payload.CC_Ledg = formData.CC_Ledg !== "" ? Number(formData.CC_Ledg) : 0;
                payload.MIN_VALUE = formData.MIN_VALUE === "1" ? 1 : null;
                payload.Continuous_Max = formData.Continuous_Max !== "" ? Number(formData.Continuous_Max) : 0;
                payload.is_carry = formData.is_carry === "1" ? 1 : null;
            } else {
                payload.Assessable_Column = null;
            }

            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/DefaultMaster/updateLeaveMispunchPolicy`,
                payload,
                {
                    headers: {
                        compcode: user?.Comp_Code,
                        name: user?.name,
                    },
                }
            );

            if (response.data?.success) {
                showToast(response.data.message || "Policy Updated Successfully", "success");
                await fetchPolicies();
                handleReset();
            } else {
                showToast(response.data?.message || "Failed to update policy", "error");
            }
        } catch (error: any) {
            console.error("API error while updating policy:", error);
            if (error?.response?.status === 409) {
                showToast(
                    error.response.data?.message || "Another Leave/Mispunch Policy with this name already exists in this location",
                    "warning"
                );
            } else if (error?.response?.data?.message) {
                showToast(error.response.data.message, "error");
            } else {
                showToast("Error occurred while updating policy. Please try again.", "error");
            }
        } finally {
            setIsUpdating(false);
        }
    };

    // -----------------------------------------------------------
    // Reset Form
    // -----------------------------------------------------------
    const handleReset = () => {
        setEditingMiscCode(null);
        setEditingUtd(null);
        setFormData({
            Misc_Name: "",
            Misc_Abbr: "",
            Misc_Dtl1: "",
            Misc_Dtl2: "",
            Misc_Dtl3: "",
            Misc_Num1: "",
            Misc_Num2: "",
            Loc_Code: user?.branch ? String(user.branch) : (branchOptions[0]?.value || ""),
            CC_Group: "",
            CC_Ledg: "",
            Assessable_Column: "",
            MIN_VALUE: "",
            Continuous_Max: "",
            is_carry: "",
            dis_back_date: "",
            Policy_type: "",
        });
        setValidationErrors({});
    };

    // -----------------------------------------------------------
    // Deactivate Policy Handler (Sets Export_Type = 33)
    // -----------------------------------------------------------
    const handleDeactivate = async (rowData: any) => {
        const result = await Swal.fire({
            title: "Deactivate Policy?",
            text: `Are you sure you want to deactivate "${rowData.Misc_Name}"?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Yes, Deactivate",
            cancelButtonText: "Cancel",
        });

        if (!result.isConfirmed) return;

        try {
            const isLeave = rowData.policyType === "Leave";
            const payload: Record<string, any> = {
                Misc_Code: Number(rowData.Misc_Code),
                Misc_Name: String(rowData.Misc_Name).trim().toUpperCase(),
                Misc_Abbr: rowData.Misc_Abbr || "INACTIVE",
                Misc_Dtl1: rowData.Misc_Dtl1 === "-" ? "Actual" : (rowData.Misc_Dtl1 || "Actual"),
                Misc_Dtl2: rowData.Misc_Dtl2 === "-" ? "Actual" : (rowData.Misc_Dtl2 || "Actual"),
                Misc_Dtl3: isLeave ? String(rowData.Misc_Dtl3 === "-" ? "0" : (rowData.Misc_Dtl3 ?? "0")) : "0",
                Misc_Num1: rowData.rawMiscNum1 !== "" && rowData.rawMiscNum1 !== null ? Number(rowData.rawMiscNum1) : 0,
                Misc_Num2: rowData.rawMiscNum2 !== "" && rowData.rawMiscNum2 !== null ? Number(rowData.rawMiscNum2) : 0,
                Loc_Code: Number(rowData.Loc_Code),
                App_Type: "Deactive", // Backend sets Export_Type = 33
                dis_back_date: rowData.rawBackDate === "1" ? 1 : null,
            };

            if (rowData.UTD) {
                payload.UTD = Number(rowData.UTD);
            }

            if (isLeave) {
                payload.Assessable_Column = rowData.rawAssessable ? Number(rowData.rawAssessable) : null;
                payload.CC_Group = rowData.CC_Group !== "-" && rowData.CC_Group !== "" ? Number(rowData.CC_Group) : 0;
                payload.CC_Ledg = rowData.CC_Ledg !== "-" && rowData.CC_Ledg !== "" ? Number(rowData.CC_Ledg) : 0;
                payload.MIN_VALUE = rowData.MIN_VALUE !== "-" && rowData.MIN_VALUE !== "" ? Number(rowData.MIN_VALUE) : 0;
                payload.Continuous_Max = rowData.Continuous_Max !== "-" && rowData.Continuous_Max !== "" ? Number(rowData.Continuous_Max) : 0;
                payload.is_carry = rowData.rawCarry === "1" ? 1 : null;
            } else {
                payload.Assessable_Column = null;
            }

            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/DefaultMaster/updateLeaveMispunchPolicy`,
                payload,
                {
                    headers: {
                        compcode: user?.Comp_Code,
                        name: user?.name,
                    },
                }
            );

            if (response.data?.success) {
                showToast(response.data.message || "Policy Deactivated Successfully", "success");
                setEditingMiscCode(null);
                setEditingUtd(null);
                await fetchPolicies();
            } else {
                showToast(response.data?.message || "Failed to deactivate policy", "error");
            }
        } catch (error: any) {
            console.error("API error while deactivating policy:", error);
            showToast(error?.response?.data?.message || "Error occurred while deactivating policy", "error");
        }
    };

    // -----------------------------------------------------------
    // Table Columns Definition (Leave vs Mispunch)
    // -----------------------------------------------------------
    const tableColumns = useMemo(() => {
        const actionColumn = {
            Header: "Action",
            accessor: "action",
            HeaderAlign: "center",
            cellAlign: "center",
            disableSortBy: true,
            disableFilters: true,
            Cell: ({ row }: any) => (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDeactivate(row.original);
                    }}
                    style={{
                        backgroundColor: "#dc2626",
                        color: "#ffffff",
                        padding: "3px 10px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "700",
                        border: "1px solid #b91c1c",
                        cursor: "pointer",
                        display: "inline-block",
                        lineHeight: "1.2",
                        whiteSpace: "nowrap",
                    }}
                    className="hover:bg-red-700 active:scale-95 transition-all shadow-sm"
                    title="Deactivate Policy"
                >
                    Deactivate
                </button>
            ),
        };

        if (policyType === "Mispunch") {
            return [
                {
                    Header: "Sr No",
                    accessor: "srno",
                    Cell: ({ row }: any) => <span>{row.index + 1}</span>,
                },
                {
                    Header: "Type",
                    accessor: "policyType",
                    Cell: ({ value }: any) => (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                            {value}
                        </span>
                    ),
                },
                {
                    Header: "Mispunch Reason",
                    accessor: "Misc_Name",
                },
                {
                    Header: "Status",
                    accessor: "Misc_Abbr",
                    Cell: ({ value }: any) => (
                        <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${value === "ACTIVE"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                }`}
                        >
                            {value}
                        </span>
                    ),
                },
                {
                    Header: "Present Value",
                    accessor: "Misc_Dtl1",
                },
                {
                    Header: "Absent Value",
                    accessor: "Misc_Dtl2",
                },
                {
                    Header: "Monthly Limit",
                    accessor: "Misc_Num1",
                },
                {
                    Header: "Days Front",
                    accessor: "CC_Group",
                },
                {
                    Header: "Days Back",
                    accessor: "CC_Ledg",
                },
                {
                    Header: "Back Date Rule",
                    accessor: "dis_back_date",
                },
                {
                    Header: "App Type",
                    accessor: "Policy_type",
                },
                actionColumn,
            ];
        }

        // Leave Columns
        return [
            {
                Header: "Sr No",
                accessor: "srno",
                Cell: ({ row }: any) => <span>{row.index + 1}</span>,
            },
            {
                Header: "Type",
                accessor: "policyType",
                Cell: ({ value }: any) => (
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {value}
                    </span>
                ),
            },
            {
                Header: "Leave Name",
                accessor: "Misc_Name",
            },
            {
                Header: "Leave Type",
                accessor: "Misc_Abbr",
                Cell: ({ value }: any) => (
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                        {value}
                    </span>
                ),
            },
            {
                Header: "Present Value",
                accessor: "Misc_Dtl1",
            },
            {
                Header: "Absent Value",
                accessor: "Misc_Dtl2",
            },
            {
                Header: "Leave Value (ERP)",
                accessor: "Misc_Dtl3",
            },
            {
                Header: "Monthly Leave Limit",
                accessor: "Misc_Num1",
            },
            {
                Header: "Leave Value (Cloud)",
                accessor: "Misc_Num2",
            },
            {
                Header: "Assessable Type",
                accessor: "Assessable_Column",
            },
            {
                Header: "Days Front",
                accessor: "CC_Group",
            },
            {
                Header: "Days Back",
                accessor: "CC_Ledg",
            },
            {
                Header: "Minimum Value",
                accessor: "MIN_VALUE",
            },
            {
                Header: "Max Count",
                accessor: "Continuous_Max",
            },
            {
                Header: "Carry Fwd",
                accessor: "is_carry",
            },
            {
                Header: "Back Date Rule",
                accessor: "dis_back_date",
            },
            {
                Header: "App Type",
                accessor: "Policy_type",
            },
            actionColumn,
        ];
    }, [policyType, handleDeactivate]);

    const downloadColumns = useMemo(
        () => tableColumns.filter((col: any) => col.accessor !== "action" && col.Header !== "Action"),
        [tableColumns]
    );

    const displayedPolicies = useMemo(() => {
        return policyList
            .filter((p) => p.policyType === policyType)
            .map((p, idx) => ({
                ...p,
                srno: idx + 1,
            }));
    }, [policyList, policyType]);

    return (
        <div ref={topRef} id="hr-master-top" className="min-h-screen bg-slate-50 dark:bg-slate-950 p-3 sm:p-4 md:p-6 transition-colors">
            {/* ── Page Header ───────────────────────────────────────── */}
            <div className="mb-4 sm:mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <span>HR Master</span>
                        <span>&rarr;</span>
                        <span className="text-primary font-bold">Leave & Mispunch Policy</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#193A69] dark:text-[#E2E8F0] flex items-center gap-2 mt-1">
                        <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
                        <span>Leave & Mispunch Policy Master</span>
                    </h1>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Configure Mispunch reasons, Leave policies and punch timing rules.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {/* Policy Type Selector Switch */}
                    <div className="flex items-center gap-2 bg-[#f1f5f9] dark:bg-[#0f172a] border border-[#cbd5e1] dark:border-[#334155] p-1 rounded-lg w-full sm:w-auto justify-between sm:justify-start shadow-sm">
                        <span className="text-xs font-bold text-[#334155] dark:text-[#38bdf8] shrink-0 px-1.5">
                            Active Mode:
                        </span>
                        <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                            <button
                                type="button"
                                onClick={() => handlePolicyTypeChange("policyType", "Leave")}
                                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all duration-150 whitespace-nowrap cursor-pointer select-none ${policyType === "Leave"
                                    ? "bg-[#193A69] dark:bg-[#2563eb] text-white shadow-sm border border-[#193A69] dark:border-[#3b82f6]"
                                    : "bg-white dark:bg-[#1e293b] text-[#334155] dark:text-[#cbd5e1] border border-[#cbd5e1] dark:border-[#334155] hover:bg-[#f8fafc] dark:hover:bg-[#334155]"
                                    }`}
                            >
                                <CalendarCheck className="h-4 w-4 shrink-0" />
                                <span>Leave</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handlePolicyTypeChange("policyType", "Mispunch")}
                                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all duration-150 whitespace-nowrap cursor-pointer select-none ${policyType === "Mispunch"
                                    ? "bg-[#b45309] dark:bg-[#d97706] text-white shadow-sm border border-[#b45309] dark:border-[#f59e0b]"
                                    : "bg-white dark:bg-[#1e293b] text-[#334155] dark:text-[#cbd5e1] border border-[#cbd5e1] dark:border-[#334155] hover:bg-[#f8fafc] dark:hover:bg-[#334155]"
                                    }`}
                            >
                                <Clock className="h-4 w-4 shrink-0" />
                                <span>Mispunch</span>
                            </button>
                        </div>
                    </div>

                    {/* Question Mark (?) Help Guide Button */}
                    <button
                        type="button"
                        onClick={() => setIsHelpOpen(true)}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-lg border border-[#38bdf8] dark:border-[#0284c7] bg-[#f0f9ff] dark:bg-[#0c4a6e]/50 text-[#0369a1] dark:text-[#38bdf8] hover:bg-[#e0f2fe] dark:hover:bg-[#075985] transition-all shadow-sm cursor-pointer whitespace-nowrap select-none ml-auto sm:ml-0"
                        title="Click to view explanation for all fields"
                    >
                        <HelpCircle className="h-4 w-4 text-[#0284c7] dark:text-[#38bdf8] shrink-0" />
                        <span>Guide (?)</span>
                    </button>
                </div>
            </div>

            {/* ── Main Content: Form ───────────────────────────────── */}
            <div className="bg-white dark:bg-[#15203F] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-5 shadow-sm">
                {/* Section 1: Core Policy Setup */}
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-4 sm:mb-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-slate-800 dark:text-sky-300 font-bold text-xs sm:text-sm">
                            <Layers className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                            <span>1. Policy Category & Type Selection</span>
                            <button
                                type="button"
                                onClick={() => setIsHelpOpen(true)}
                                className="inline-flex items-center justify-center p-1 text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-200 hover:bg-sky-100 dark:hover:bg-sky-900/50 rounded-full transition-colors cursor-pointer bg-transparent border-0"
                                title="Click to view detailed explanation of all fields"
                            >
                                <HelpCircle className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="flex items-center font-bold text-xs mt-1 mb-1 text-[#193A69] dark:text-[#E2E8F0]">
                                Policy Type <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">(Select who can access this policy: User & HR or HR only)</span>
                                <span className="text-exit text-xs ml-1.5 font-bold">*</span>
                            </label>
                            <div className="[&_label]:hidden">
                                <SelectSearch
                                    title="Policy Type"
                                    name="policyType"
                                    options={POLICY_TYPE_OPTIONS}
                                    handleInputChange={handlePolicyTypeChange}
                                    selectedValue={policyType}
                                    redlabel="*"
                                />
                            </div>
                        </div>

                        {policyType === "Leave" && (
                            <div>
                                <label className="flex items-center font-bold text-xs mt-1 mb-1 text-[#193A69] dark:text-[#E2E8F0]">
                                    Leave Type <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">(Select leave type like CL, PL, SL)</span>
                                    <span className="text-exit text-xs ml-1.5 font-bold">*</span>
                                </label>
                                <div className="[&_label]:hidden">
                                    <SelectSearch
                                        title="Leave Type"
                                        name="Misc_Abbr"
                                        options={LEAVE_TYPE_OPTIONS}
                                        handleInputChange={handleLeaveTypeChange}
                                        selectedValue={formData.Misc_Abbr}
                                        redlabel="*"
                                    />
                                </div>
                                {validationErrors.Misc_Abbr && (
                                    <p className="text-exit text-xs mt-1">{validationErrors.Misc_Abbr}</p>
                                )}
                            </div>
                        )}

                        {policyType === "Mispunch" && (
                            <div>
                                <label className="flex items-center font-bold text-xs mt-1 mb-1 text-[#193A69] dark:text-[#E2E8F0]">
                                    Status <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">(Enter code like MP, TR, TO)</span>
                                    <span className="text-exit text-xs ml-1.5 font-bold">*</span>
                                </label>
                                <div className="[&_label]:hidden">
                                    <Ainput
                                        title="Status"
                                        name="Misc_Abbr"
                                        type="text"
                                        value={formData.Misc_Abbr}
                                        handleInputChange={handleInputChange}
                                        onInput={(_name, val) => handleInputChange("Misc_Abbr", val)}
                                        disabled={false}
                                        required={true}
                                        redlabel="*"
                                        placeholder="e.g. MP, TR, TO"
                                        errorMessage={validationErrors.Misc_Abbr}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Section 2: Policy Name & Values */}
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-4 sm:mb-5">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-sky-300 font-bold text-xs sm:text-sm mb-3">
                        <Settings className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                        <span>2. Policy Name & Attendance Credit Values</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className={policyType === "Leave" ? "" : "sm:col-span-2"}>
                            {policyType === "Leave" ? (
                                <div>
                                    <label className="flex items-center font-bold text-xs mt-1 mb-1 text-[#193A69] dark:text-[#E2E8F0]">
                                        Leave Name <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">(Enter full name like Casual Leave, Sick Leave)</span>
                                        <span className="text-exit text-xs ml-1.5 font-bold">*</span>
                                    </label>
                                    <div className="[&_label]:hidden">
                                        <Ainput
                                            title="Leave Name"
                                            name="Misc_Name"
                                            type="text"
                                            value={formData.Misc_Name}
                                            handleInputChange={handleInputChange}
                                            onInput={(_name, val) => handleInputChange("Misc_Name", val)}
                                            disabled={false}
                                            required={true}
                                            redlabel="*"
                                            placeholder="e.g. CASUAL LEAVE"
                                            errorMessage={validationErrors.Misc_Name}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="flex items-center font-bold text-xs mt-1 mb-1 text-[#193A69] dark:text-[#E2E8F0]">
                                        Mispunch Reason <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">(Enter reason like Traffic Delay, Machine Issue)</span>
                                        <span className="text-exit text-xs ml-1.5 font-bold">*</span>
                                    </label>
                                    <div className="[&_label]:hidden">
                                        <Ainput
                                            title="Mispunch Reason"
                                            name="Misc_Name"
                                            type="text"
                                            value={formData.Misc_Name}
                                            handleInputChange={handleInputChange}
                                            onInput={(_name, val) => handleInputChange("Misc_Name", val)}
                                            disabled={false}
                                            required={true}
                                            redlabel="*"
                                            placeholder="e.g. MISPUNCH - TRAFFIC DELAY"
                                            errorMessage={validationErrors.Misc_Name}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {policyType === "Leave" && (
                            <div>
                                <label className="flex items-center font-bold text-xs mt-1 mb-1 text-[#193A69] dark:text-[#E2E8F0]">
                                    Leave Value (ERP) <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">(Deducts leave from balance: 1.0 = Full Day, 0.5 = Half Day)</span>
                                    <span className="text-exit text-xs ml-1.5 font-bold">*</span>
                                </label>
                                <div className="[&_label]:hidden">
                                    <SelectSearch
                                        title="Leave Value (ERP)"
                                        name="Misc_Dtl3"
                                        options={LeaveValueOptions}
                                        handleInputChange={handleInputChange}
                                        selectedValue={formData.Misc_Dtl3}
                                        redlabel="*"
                                    />
                                </div>
                                {validationErrors.Misc_Dtl3 && (
                                    <p className="text-exit text-xs mt-1">{validationErrors.Misc_Dtl3}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Present & Absent Value Dropdowns using SelectSearch (Full Width 2-Column Grid) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                        <div>
                            <label className="flex items-center font-bold text-xs mt-1 mb-1 text-[#193A69] dark:text-[#E2E8F0]">
                                Present Value <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">(Gives attendance on approval: 1.0 = Full Day, 0.5 = Half Day, 0 = No Present)</span>
                            </label>
                            <div className="[&_label]:hidden">
                                <SelectSearch
                                    title="Present Value"
                                    name="Misc_Dtl1"
                                    options={PresentValueOptions}
                                    handleInputChange={handleInputChange}
                                    selectedValue={formData.Misc_Dtl1}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="flex items-center font-bold text-xs mt-1 mb-1 text-[#193A69] dark:text-[#E2E8F0]">
                                Absent Value <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">(Marks employee as absent: 1.0 = Full Day, 0.5 = Half Day, 0 = Not Absent)</span>
                            </label>
                            <div className="[&_label]:hidden">
                                <SelectSearch
                                    title="Absent Value"
                                    name="Misc_Dtl2"
                                    options={AbsentValueOptions}
                                    handleInputChange={handleInputChange}
                                    selectedValue={formData.Misc_Dtl2}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 3: Monthly Limit & Cloud Leave Value */}
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-4 sm:mb-5 bg-slate-50/70 dark:bg-slate-900/40 p-3 sm:p-3.5 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-sky-300 font-bold text-xs sm:text-sm mb-3">
                        <CalendarCheck className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                        <span>{policyType === "Leave" ? "3. Monthly Leave Limit & Cloud Leave Value" : "3. Monthly Limit"}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className={policyType === "Leave" ? "" : "sm:col-span-2"}>
                            <label className="flex items-center font-bold text-xs mt-1 mb-1 text-[#193A69] dark:text-[#E2E8F0]">
                                {policyType === "Leave" ? "Monthly Leave Limit (count)" : "Monthly Mispunch Limit (count)"}{" "}
                                <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">
                                    ({policyType === "Leave" ? "How much leave take in Current month" : "How many times allowed in 1 month"})
                                </span>
                            </label>
                            <div className="[&_label]:hidden">
                                <Ainput
                                    title="Monthly Leave Limit"
                                    name="Misc_Num1"
                                    type="number"
                                    step="1"
                                    value={formData.Misc_Num1}
                                    handleInputChange={handleInputChange}
                                    onInput={(_name, val) => handleInputChange("Misc_Num1", val)}
                                    disabled={false}
                                    placeholder="Max count per month"
                                />
                            </div>
                        </div>
                        {policyType === "Leave" && (
                            <div>
                                <label className="flex items-center font-bold text-xs mt-1 mb-1 text-[#193A69] dark:text-[#E2E8F0]">
                                    Leave Value (Cloud) <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">(Deducts leave from balance  1.0 = Full Day, 0.5 = Half Day)</span>
                                </label>
                                <div className="[&_label]:hidden">
                                    <SelectSearch
                                        title="Leave Value (CLOUD)"
                                        name="Misc_Num2"
                                        options={LeaveValueOptions}
                                        handleInputChange={handleInputChange}
                                        selectedValue={formData.Misc_Num2}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Section 4: Conditional Leave Configuration Fields */}
                {policyType === "Leave" && (
                    <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-4 sm:mb-5 bg-blue-50/50 dark:bg-blue-950/20 p-3 sm:p-3.5 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-sky-300 font-bold text-xs sm:text-sm mb-3">
                            <CalendarCheck className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                            <span>4. Leave Quota Rules & Eligibility Constraints</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="flex items-center font-bold text-xs mt-1 mb-1 text-[#193A69] dark:text-[#E2E8F0]">
                                    Leave / Assessable Type <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">(Salary type: Full Day Paid, Half Day Paid, or No Pay)</span>
                                    <span className="text-exit text-xs ml-1.5 font-bold">*</span>
                                </label>
                                <div className="[&_label]:hidden">
                                    <SelectSearch
                                        title="Leave / Assessable Type"
                                        name="Assessable_Column"
                                        options={ASSESSABLE_TYPE_OPTIONS}
                                        handleInputChange={handleAssessableTypeChange}
                                        selectedValue={formData.Assessable_Column}
                                        redlabel="*"
                                    />
                                </div>
                                {validationErrors.Assessable_Column && (
                                    <p className="text-exit text-xs mt-1">{validationErrors.Assessable_Column}</p>
                                )}
                            </div>
                            <div>
                                <label className="flex items-center font-bold text-xs mt-1 mb-1 text-[#193A69] dark:text-[#E2E8F0]">
                                    Minimum  Value. <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">(its use for Half day leaves for ex:(1=only assessable for fullday leave,0.5=assessable for both))</span>
                                    <span className="text-exit text-xs ml-1.5 font-bold">*</span>
                                </label>
                                <div className="[&_label]:hidden">
                                    <SelectSearch
                                        title="Minimum Value"
                                        name="MIN_VALUE"
                                        options={MIN_BALANCE_OPTIONS}
                                        handleInputChange={handleInputChange}
                                        selectedValue={formData.MIN_VALUE}
                                        redlabel="*"
                                    />
                                </div>
                                {validationErrors.MIN_VALUE && (
                                    <p className="text-exit text-xs mt-1">{validationErrors.MIN_VALUE}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-3 sm:mt-4">
                            <div>
                                <label className="flex items-center font-bold text-xs mt-1 mb-1 text-[#193A69] dark:text-[#E2E8F0]">
                                    Continuous Max Days <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">(Max number of leave days that can be taken together)</span>
                                    <span className="text-exit text-xs ml-1.5 font-bold">*</span>
                                </label>
                                <div className="[&_label]:hidden">
                                    <Ainput
                                        title="Continuous Max Days"
                                        name="Continuous_Max"
                                        type="number"
                                        step="1"
                                        value={formData.Continuous_Max}
                                        handleInputChange={handleInputChange}
                                        onInput={(_name, val) => handleInputChange("Continuous_Max", val)}
                                        disabled={false}
                                        required={true}
                                        redlabel="*"
                                        errorMessage={validationErrors.Continuous_Max}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="flex items-center font-bold text-xs mt-1 mb-1 text-[#193A69] dark:text-[#E2E8F0]">
                                    Days Front (CC_Group) <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">(Days in advance to apply for leave)</span>
                                </label>
                                <div className="[&_label]:hidden">
                                    <Ainput
                                        title="Days Front (CC_Group)"
                                        name="CC_Group"
                                        type="number"
                                        step="1"
                                        value={formData.CC_Group}
                                        handleInputChange={handleInputChange}
                                        onInput={(_name, val) => handleInputChange("CC_Group", val)}
                                        disabled={false}
                                        errorMessage={validationErrors.CC_Group}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="flex items-center font-bold text-xs mt-1 mb-1 text-[#193A69] dark:text-[#E2E8F0]">
                                    Days Back (CC_Ledg) <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">(How many past days an employee can apply for leave)</span>
                                </label>
                                <div className="[&_label]:hidden">
                                    <Ainput
                                        title="Days Back (CC_Ledg)"
                                        name="CC_Ledg"
                                        type="number"
                                        step="1"
                                        value={formData.CC_Ledg}
                                        handleInputChange={handleInputChange}
                                        onInput={(_name, val) => handleInputChange("CC_Ledg", val)}
                                        disabled={false}
                                        errorMessage={validationErrors.CC_Ledg}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                            <div>
                                <label className="flex items-center font-bold text-xs mt-1 mb-1 text-[#193A69] dark:text-[#E2E8F0]">
                                    Carry Forward <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">(1 = Add remaining leave to next month, NULL = Do not add)</span>
                                    <span className="text-exit text-xs ml-1.5 font-bold">*</span>
                                </label>
                                <div className="[&_label]:hidden">
                                    <SelectSearch
                                        title="Carry Forward"
                                        name="is_carry"
                                        options={CARRY_FORWARD_OPTIONS}
                                        handleInputChange={handleInputChange}
                                        selectedValue={formData.is_carry}
                                        redlabel="*"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="flex items-center font-bold text-xs mt-1 mb-1 text-[#193A69] dark:text-[#E2E8F0]">
                                    Back Date Rule <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">(Allow or Block applying for past dates)</span>
                                    <span className="text-exit text-xs ml-1.5 font-bold">*</span>
                                </label>
                                <div className="[&_label]:hidden">
                                    <SelectSearch
                                        title="Back Date Rule"
                                        name="dis_back_date"
                                        options={BACK_DATE_OPTIONS}
                                        handleInputChange={handleInputChange}
                                        selectedValue={formData.dis_back_date}
                                        redlabel="*"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Section 4 (Mispunch Mode): Specific Mispunch Rules */}
                {policyType === "Mispunch" && (
                    <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-4 sm:mb-5 bg-amber-50/50 dark:bg-amber-950/20 p-3 sm:p-3.5 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs sm:text-sm mb-3">
                            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <span>4. Mispunch Policy Constraints</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="flex items-center font-bold text-xs mt-1 mb-1 text-[#193A69] dark:text-[#E2E8F0]">
                                    Days Front (CC_Group) <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">(How many days in advance employee can apply for mispunch)</span>
                                </label>
                                <div className="[&_label]:hidden">
                                    <Ainput
                                        title="Days Front (CC_Group)"
                                        name="CC_Group"
                                        type="number"
                                        step="1"
                                        value={formData.CC_Group}
                                        handleInputChange={handleInputChange}
                                        onInput={(_name, val) => handleInputChange("CC_Group", val)}
                                        disabled={false}
                                        errorMessage={validationErrors.CC_Group}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="flex items-center font-bold text-xs mt-1 mb-1 text-[#193A69] dark:text-[#E2E8F0]">
                                    Days Back (CC_Ledg) <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">(How many past days an employee can apply for mispunch after taking it)</span>
                                </label>
                                <div className="[&_label]:hidden">
                                    <Ainput
                                        title="Days Back (CC_Ledg)"
                                        name="CC_Ledg"
                                        type="number"
                                        step="1"
                                        value={formData.CC_Ledg}
                                        handleInputChange={handleInputChange}
                                        onInput={(_name, val) => handleInputChange("CC_Ledg", val)}
                                        disabled={false}
                                        errorMessage={validationErrors.CC_Ledg}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                            <div>
                                <label className="flex items-center font-bold text-xs mt-1 mb-1 text-[#193A69] dark:text-[#E2E8F0]">
                                    Back Date Rule <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">(Allow or Block mispunch for past dates)</span>
                                    <span className="text-exit text-xs ml-1.5 font-bold">*</span>
                                </label>
                                <div className="[&_label]:hidden">
                                    <SelectSearch
                                        title="Back Date Rule"
                                        name="dis_back_date"
                                        options={BACK_DATE_OPTIONS}
                                        handleInputChange={handleInputChange}
                                        selectedValue={formData.dis_back_date}
                                        redlabel="*"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col justify-center bg-amber-50/70 dark:bg-slate-900/60 border border-dashed border-amber-300 dark:border-amber-700/60 p-3 rounded-md">
                                <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                                    Assessable Column Rule:
                                </span>
                                <span className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                                    Salary assessment column is automatically handled as <strong className="text-slate-900 dark:text-white">NULL</strong> for Mispunch policies.
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Section 5: Application Access Target */}
                <div className="mb-5 sm:mb-6">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-sky-300 font-bold text-xs sm:text-sm mb-3">
                        <ShieldCheck className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                        <span>5. Policy Access Target (User vs. HR Portal)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="flex items-center font-bold text-xs mt-1 mb-1 text-[#193A69] dark:text-[#E2E8F0]">
                                Policy Type <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">(Select who can access this policy: User & HR or HR only)</span>
                                <span className="text-exit text-xs ml-1.5 font-bold">*</span>
                            </label>
                            <div className="[&_label]:hidden">
                                <SelectSearch
                                    title="Policy Type"
                                    name="Policy_type"
                                    options={APP_TYPE_OPTIONS}
                                    handleInputChange={handleInputChange}
                                    selectedValue={formData.Policy_type}
                                    redlabel="*"
                                />
                            </div>
                            {validationErrors.Policy_type && (
                                <p className="text-exit text-xs mt-1">{validationErrors.Policy_type}</p>
                            )}
                        </div>
                        <div className="flex items-center bg-slate-50/80 dark:bg-slate-900/60 p-3 rounded-md border border-slate-200 dark:border-slate-800">
                            <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                <strong className="text-slate-900 dark:text-white">USER & HR:</strong> Available for employees on Mobile App & Self-Service Portal.<br />
                                <strong className="text-slate-900 dark:text-white">HR:</strong> Only accessable for  HR Admin Portal.
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleReset}
                        disabled={isSaving || isUpdating}
                        className="w-full sm:w-auto px-4 sm:px-5 py-2 text-xs font-bold uppercase rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        {editingMiscCode ? "Cancel Edit" : "Reset"}
                    </Button>

                    <Button
                        type="button"
                        variant="save"
                        onClick={handleSave}
                        disabled={isSaving || isUpdating}
                        loading={isSaving}
                        className="flex-1 sm:flex-initial bg-primary hover:bg-primary/90 text-white font-bold uppercase text-xs px-5 sm:px-6 py-2 shadow-sm rounded-md cursor-pointer"
                    >
                        Save
                    </Button>

                    <Button
                        type="button"
                        variant="update"
                        onClick={handleUpdate}
                        disabled={isSaving || isUpdating || !isPolicyInTable}
                        loading={isUpdating}
                        className="flex-1 sm:flex-initial bg-save hover:bg-save/90 text-white font-bold uppercase text-xs px-5 sm:px-6 py-2 shadow-sm rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Update
                    </Button>
                </div>
            </div>

            {/* ── Table Section: ServiceTabel Component ──────────────── */}
            <div className="mt-6 sm:mt-8 bg-white dark:bg-[#15203F] border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
                    <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-primary shrink-0" />
                        <h3 className="font-bold text-sm sm:text-base text-[#193A69] dark:text-[#E2E8F0]">
                            {policyType === "Leave" ? "Leave Policies Master List" : "Mispunch Policies Master List"}
                        </h3>
                        {isLoadingTable && (
                            <span className="text-xs text-primary font-medium ml-2 animate-pulse">
                                Loading...
                            </span>
                        )}
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            Total {policyType === "Leave" ? "Leave" : "Mispunch"} Policies: {displayedPolicies.length}
                        </span>
                        <Button
                            type="button"
                            onClick={fetchPolicies}
                            disabled={isLoadingTable}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors bg-transparent shadow-none h-auto cursor-pointer"
                            title="Refresh Policies"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoadingTable ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>

                <div className="w-full overflow-x-auto">
                    <ServiceTabel
                        title=""
                        columns={tableColumns}
                        columnsDownload={downloadColumns}
                        data={displayedPolicies}
                        selectValue="id"
                        onRowDoubleClick={handleRowDoubleClick}
                        height="350px"
                        size="text-xs"
                    />
                </div>
            </div>

            {/* ── Field Guide & Help Modal (?) ──────────────────────── */}
            {isHelpOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#15203F] border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] sm:max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-2 sm:gap-2.5">
                                <div className="p-1.5 sm:p-2 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 shrink-0">
                                    <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-sky-300">
                                        Policy Fields & Rules Explanation Guide
                                    </h3>
                                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                                        Simple explanation of every field and how it works
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                onClick={() => setIsHelpOpen(false)}
                                className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer bg-transparent shadow-none h-auto"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Search Filter */}
                        <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#15203F]">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search any field name (e.g. Assessable, Carry Forward, Min Bal)..."
                                    value={helpSearch}
                                    onChange={(e) => setHelpSearch(e.target.value)}
                                    className="w-full pl-9 pr-9 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                                {helpSearch && (
                                    <Button
                                        type="button"
                                        onClick={() => setHelpSearch("")}
                                        className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full bg-transparent shadow-none h-auto cursor-pointer"
                                        title="Clear search"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Modal Body - Filtered Field Cards */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 text-xs text-slate-700 dark:text-slate-300">
                            {(() => {
                                const q = helpSearch.trim().toLowerCase();
                                const filteredSections = FIELD_GUIDE_SECTIONS.map((section) => {
                                    const matchingItems = section.items.filter((item) => {
                                        if (!q) return true;
                                        return (
                                            item.title.toLowerCase().includes(q) ||
                                            item.keywords.toLowerCase().includes(q) ||
                                            section.title.toLowerCase().includes(q)
                                        );
                                    });
                                    return { ...section, items: matchingItems };
                                }).filter((section) => section.items.length > 0);

                                if (filteredSections.length === 0) {
                                    return (
                                        <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
                                            <Search className="h-8 w-8 text-slate-400 mb-3" />
                                            <h5 className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                                                No matching fields found
                                            </h5>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                                                No field guide items matched <strong>"{helpSearch}"</strong>. Try searching for Assessable, Carry Forward, Min Bal, Present Value, etc.
                                            </p>
                                            <Button
                                                type="button"
                                                onClick={() => setHelpSearch("")}
                                                className="mt-4 px-4 py-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 border border-sky-300 dark:border-sky-700 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950 transition-colors bg-transparent shadow-none cursor-pointer"
                                            >
                                                Clear Search
                                            </Button>
                                        </div>
                                    );
                                }

                                return filteredSections.map((section) => {
                                    const IconComponent = section.icon;
                                    return (
                                        <div key={section.id} className="space-y-3">
                                            <h4 className="font-bold text-sm text-slate-800 dark:text-sky-300 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                                                <IconComponent className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                                                <span>{section.title}</span>
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {section.items.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 ${item.colSpan ? "md:col-span-2 lg:col-span-3" : ""
                                                            }`}
                                                    >
                                                        <span className="font-bold text-sky-700 dark:text-sky-300 block text-xs mb-1">
                                                            • {item.title}
                                                        </span>
                                                        <div className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                                            {item.content}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-end">
                            <Button
                                type="button"
                                variant="save"
                                onClick={() => setIsHelpOpen(false)}
                                className="px-5 py-1.5 text-xs font-bold uppercase rounded-md shadow-sm cursor-pointer"
                            >
                                Got it
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
