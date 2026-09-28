"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import AButton from "@/components/atoms/Buttton";
import Ainput from "@/components/atoms/Einput";
import Eselect from "@/components/atoms/Eselect";
import ServiceTabel from "@/components/Templates/Servicetable";
import ChartCard from "@/components/chartcard";
import { onlybranch } from "@/action/branch";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import {
    ShieldCheck,
    CalendarCheck,
    Clock,
    Layers,
    Settings,
    AlertCircle,
    BarChart3,
    CheckCircle2,
    RefreshCw,
    Database,
    Timer,
} from "lucide-react";

// ============================================================
// CONSTANTS & DROPDOWN OPTIONS
// ============================================================
const POLICY_TYPE_OPTIONS = [
    { value: "Leave", label: "Leave Policy" },
    { value: "Mispunch", label: "Mispunch Policy" },
];

const STATUS_OPTIONS = [
    { label: "ACTIVE", value: "ACTIVE" },
    { label: "INACTIVE", value: "INACTIVE" },
];

const APP_TYPE_OPTIONS = [
    { label: "Mobile App", value: "Mobile App" },
    { label: "Web App", value: "Web App" },
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
    { label: "No (0 - Lapses at year end)", value: "0" },
    { label: "Yes (1 - Carried forward)", value: "1" },
];

const BACK_DATE_OPTIONS = [
    { label: "Back Date NOT Allowed (1)", value: "1" },
    { label: "Back Date Allowed (NULL)", value: "null" },
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
        Misc_Abbr: "ACTIVE",
        Misc_Dtl1: "Actual",
        Misc_Dtl2: "Actual",
        Misc_Dtl3: "1",
        Misc_Num1: "0", // In-Time Status (0=Actual, 1=Shift Time, 2=Not Required)
        Misc_Num2: "0", // Out-Time Status (0=Actual, 1=Shift Time, 2=Not Required)
        Loc_Code: "",
        CC_Group: "0", // Days Front / Apply Before Days
        CC_Ledg: "0", // Days Back / Apply After Days
        Assessable_Column: "1", // 1=Full, 2=Half, 3=LWP, 4=Half LWP
        MIN_VALUE: "0", // Minimum Bal Req.
        Continuous_Max: "3", // Max continuous leave days
        is_carry: "0", // Carry Forward (0=No, 1=Yes)
        dis_back_date: "null", // 1 = NOT allowed, null = Allowed
        App_Type: "Mobile App",
    });

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [branchOptions, setBranchOptions] = useState<{ value: string; label: string }[]>([]);
    const [isLoadingBranches, setIsLoadingBranches] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingTable, setIsLoadingTable] = useState(false);
    const [policyList, setPolicyList] = useState<any[]>([]);

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
                `${process.env.NEXT_PUBLIC_URL}/Crm/getLeaveMispunchPolicies`,
                {},
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
                        item.Export_Type === 1
                            ? "Mobile App"
                            : item.Export_Type === 2
                                ? "Web App"
                                : item.App_Type || "-";

                    const formatTimeStatus = (val: any) => {
                        if (val === 0 || val === "0") return "Actual (0)";
                        if (val === 1 || val === "1") return "Shift Time (1)";
                        if (val === 2 || val === "2") return "Not Required (2)";
                        return "-";
                    };

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
                        Misc_Num1: formatTimeStatus(item.Misc_Num1),
                        rawMiscNum1: item.Misc_Num1?.toString() ?? "0",
                        Misc_Num2: formatTimeStatus(item.Misc_Num2),
                        rawMiscNum2: item.Misc_Num2?.toString() ?? "0",
                        Misc_Dtl1: item.Misc_Dtl1 || "-",
                        Misc_Dtl2: item.Misc_Dtl2 || "-",
                        Misc_Dtl3: item.Misc_Dtl3 ?? "-",
                        CC_Group: item.CC_Group ?? "-",
                        CC_Ledg: item.CC_Ledg ?? "-",
                        MIN_VALUE: item.MIN_VALUE ?? "-",
                        Continuous_Max: item.Continuous_Max ?? "-",
                        is_carry: item.is_carry === 1 ? "Yes" : (item.is_carry === 0 ? "No" : "-"),
                        rawCarry: item.is_carry?.toString() ?? "0",
                        dis_back_date: item.dis_back_date === 1 ? "Not Allowed (1)" : "Allowed (NULL)",
                        rawBackDate: item.dis_back_date === 1 ? "1" : "null",
                        App_Type: appTypeLabel,
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

        if (selected === "Mispunch") {
            setFormData((prev) => ({
                ...prev,
                Misc_Name: prev.Misc_Name.includes("LEAVE") ? "MISPUNCH" : prev.Misc_Name,
                Misc_Dtl1: "Actual",
                Misc_Dtl2: "Actual",
                Misc_Dtl3: "0",
                Misc_Num1: "0",
                Misc_Num2: "0",
                Assessable_Column: "",
                CC_Group: "0",
                CC_Ledg: "0",
                MIN_VALUE: "0",
                Continuous_Max: "0",
                is_carry: "0",
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                Misc_Name: prev.Misc_Name === "MISPUNCH" ? "CASUAL LEAVE" : prev.Misc_Name,
                Misc_Dtl1: "Actual",
                Misc_Dtl2: "Actual",
                Misc_Dtl3: "1",
                Misc_Num1: "0",
                Misc_Num2: "0",
                Assessable_Column: "1",
                CC_Group: "0",
                CC_Ledg: "0",
                MIN_VALUE: "0",
                Continuous_Max: "3",
                is_carry: "0",
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
        setFormData({
            Misc_Name: rowData.Misc_Name || "",
            Misc_Abbr: rowData.Misc_Abbr || "ACTIVE",
            Misc_Dtl1: rowData.Misc_Dtl1 || "Actual",
            Misc_Dtl2: rowData.Misc_Dtl2 || "Actual",
            Misc_Dtl3: String(rowData.Misc_Dtl3 ?? "0"),
            Misc_Num1: rowData.rawMiscNum1 || "0",
            Misc_Num2: rowData.rawMiscNum2 || "0",
            Loc_Code: String(rowData.Loc_Code || ""),
            CC_Group: String(rowData.CC_Group === "-" ? "0" : rowData.CC_Group || "0"),
            CC_Ledg: String(rowData.CC_Ledg === "-" ? "0" : rowData.CC_Ledg || "0"),
            Assessable_Column: rowData.rawAssessable ? String(rowData.rawAssessable) : (pType === "Leave" ? "1" : ""),
            MIN_VALUE: String(rowData.MIN_VALUE === "-" ? "0" : rowData.MIN_VALUE || "0"),
            Continuous_Max: String(rowData.Continuous_Max === "-" ? "0" : rowData.Continuous_Max || "0"),
            is_carry: rowData.rawCarry || "0",
            dis_back_date: rowData.rawBackDate || "null",
            App_Type: rowData.App_Type?.includes("Web") ? "Web App" : "Mobile App",
        });
        showToast(`Loaded policy: ${rowData.Misc_Name}`, "info");
    };

    // -----------------------------------------------------------
    // Validation
    // -----------------------------------------------------------
    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!formData.Misc_Name || !formData.Misc_Name.trim()) {
            errors.Misc_Name = "Policy Name is required";
        }

        if (!formData.Misc_Abbr || !formData.Misc_Abbr.trim()) {
            errors.Misc_Abbr = "Status is required";
        }

        if (!formData.Loc_Code || formData.Loc_Code.trim() === "") {
            errors.Loc_Code = "Location is required";
        }

        if (!formData.App_Type || (formData.App_Type !== "Mobile App" && formData.App_Type !== "Web App")) {
            errors.App_Type = "Valid Application Type is required";
        }

        if (policyType === "Leave") {
            if (formData.Misc_Dtl3 === "" || isNaN(Number(formData.Misc_Dtl3)) || Number(formData.Misc_Dtl3) < 0) {
                errors.Misc_Dtl3 = "Valid non-negative leave value required";
            }

            if (!formData.Assessable_Column || ![1, 2, 3, 4].includes(Number(formData.Assessable_Column))) {
                errors.Assessable_Column = "Assessable Leave Type is required";
            }

            if (formData.MIN_VALUE === "" || isNaN(Number(formData.MIN_VALUE)) || Number(formData.MIN_VALUE) < 0) {
                errors.MIN_VALUE = "Minimum Leave Balance must be >= 0";
            }

            if (formData.Continuous_Max === "" || isNaN(Number(formData.Continuous_Max)) || Number(formData.Continuous_Max) < 0) {
                errors.Continuous_Max = "Continuous Max must be >= 0";
            }

            if (formData.CC_Group !== "" && (isNaN(Number(formData.CC_Group)) || Number(formData.CC_Group) < 0)) {
                errors.CC_Group = "Must be a valid positive number";
            }

            if (formData.CC_Ledg !== "" && (isNaN(Number(formData.CC_Ledg)) || Number(formData.CC_Ledg) < 0)) {
                errors.CC_Ledg = "Must be a valid positive number";
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // -----------------------------------------------------------
    // Form Submit Handler
    // -----------------------------------------------------------
    const handleSubmit = async () => {
        if (user?.branch?.toString().includes(",")) {
            Swal.fire({
                icon: "warning",
                title: "Not Allowed",
                text: "Multi branch not allowed to save entry",
            });
            return;
        }

        if (!validateForm()) {
            showToast("Please fix the errors in the form before submitting", "warning");
            return;
        }

        setIsSubmitting(true);

        try {
            const isLeave = policyType === "Leave";

            const payload: Record<string, any> = {
                Misc_Name: formData.Misc_Name.trim().toUpperCase(),
                Misc_Abbr: formData.Misc_Abbr.trim(),
                Misc_Dtl1: formData.Misc_Dtl1 || "Actual",
                Misc_Dtl2: formData.Misc_Dtl2 || "Actual",
                Misc_Dtl3: isLeave ? String(formData.Misc_Dtl3) : "0",
                Misc_Num1: formData.Misc_Num1 !== "" && formData.Misc_Num1 !== null ? Number(formData.Misc_Num1) : 0,
                Misc_Num2: formData.Misc_Num2 !== "" && formData.Misc_Num2 !== null ? Number(formData.Misc_Num2) : 0,
                Loc_Code: Number(formData.Loc_Code),
                App_Type: formData.App_Type,
                dis_back_date: formData.dis_back_date === "1" ? 1 : null,
            };

            if (isLeave) {
                payload.Assessable_Column = Number(formData.Assessable_Column);
                payload.CC_Group = formData.CC_Group !== "" ? Number(formData.CC_Group) : 0;
                payload.CC_Ledg = formData.CC_Ledg !== "" ? Number(formData.CC_Ledg) : 0;
                payload.MIN_VALUE = formData.MIN_VALUE !== "" ? Number(formData.MIN_VALUE) : 0;
                payload.Continuous_Max = formData.Continuous_Max !== "" ? Number(formData.Continuous_Max) : 0;
                payload.is_carry = formData.is_carry === "1" ? 1 : 0;
            } else {
                // Mispunch: Assessable_Column must be null
                payload.Assessable_Column = null;
            }

            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/Crm/insertLeaveMispunchPolicy`,
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

                // Reload data from backend to ensure table is always in sync
                await fetchPolicies();

                // Reset form
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
            setIsSubmitting(false);
        }
    };

    // -----------------------------------------------------------
    // Reset Form
    // -----------------------------------------------------------
    const handleReset = () => {
        setFormData({
            Misc_Name: policyType === "Leave" ? "CASUAL LEAVE" : "MISPUNCH",
            Misc_Abbr: "ACTIVE",
            Misc_Dtl1: "Actual",
            Misc_Dtl2: "Actual",
            Misc_Dtl3: policyType === "Leave" ? "1" : "0",
            Misc_Num1: "0",
            Misc_Num2: "0",
            Loc_Code: user?.branch ? String(user.branch) : (branchOptions[0]?.value || ""),
            CC_Group: "0",
            CC_Ledg: "0",
            Assessable_Column: policyType === "Leave" ? "1" : "",
            MIN_VALUE: "0",
            Continuous_Max: policyType === "Leave" ? "3" : "0",
            is_carry: "0",
            dis_back_date: "null",
            App_Type: "Mobile App",
        });
        setValidationErrors({});
    };

    // -----------------------------------------------------------
    // Impact Chart Metrics Calculation
    // -----------------------------------------------------------
    const chartMetricsData = useMemo(() => {
        if (policyType === "Leave") {
            return [
                {
                    loc_code: "Leave Val",
                    chart_data: Math.max(0, parseFloat(formData.Misc_Dtl3) || 1),
                },
                {
                    loc_code: "In-Time Mode",
                    chart_data: Number(formData.Misc_Num1) || 0,
                },
                {
                    loc_code: "Out-Time Mode",
                    chart_data: Number(formData.Misc_Num2) || 0,
                },
                {
                    loc_code: "Min Bal Req",
                    chart_data: Math.max(0, parseFloat(formData.MIN_VALUE) || 0),
                },
                {
                    loc_code: "Max Days",
                    chart_data: Math.max(0, parseFloat(formData.Continuous_Max) || 0),
                },
                {
                    loc_code: "Days Front",
                    chart_data: Math.max(0, parseFloat(formData.CC_Group) || 0),
                },
                {
                    loc_code: "Days Back",
                    chart_data: Math.max(0, parseFloat(formData.CC_Ledg) || 0),
                },
                {
                    loc_code: "Carry Fwd",
                    chart_data: formData.is_carry === "1" ? 1 : 0,
                },
            ];
        } else {
            return [
                {
                    loc_code: "Leave Weight",
                    chart_data: parseFloat(formData.Misc_Dtl3) || 0,
                },
                {
                    loc_code: "In-Time Mode",
                    chart_data: Number(formData.Misc_Num1) || 0,
                },
                {
                    loc_code: "Out-Time Mode",
                    chart_data: Number(formData.Misc_Num2) || 0,
                },
                {
                    loc_code: "Backdate Lock",
                    chart_data: formData.dis_back_date === "1" ? 1 : 0,
                },
                {
                    loc_code: "App Export",
                    chart_data: formData.App_Type === "Mobile App" ? 1 : 2,
                },
            ];
        }
    }, [formData, policyType]);

    // -----------------------------------------------------------
    // Table Columns Definition
    // -----------------------------------------------------------
    const tableColumns = useMemo(
        () => [
            {
                Header: "Sr No",
                accessor: "Misc_Code",
            },
            {
                Header: "Type",
                accessor: "policyType",
                Cell: ({ value }: any) => (
                    <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${value === "Leave"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                            }`}
                    >
                        {value}
                    </span>
                ),
            },
            {
                Header: "Policy / Reason Name",
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
                Header: "Location",
                accessor: "Loc_Name",
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
                Header: "Leave Value",
                accessor: "Misc_Dtl3",
            },
            {
                Header: "In Time",
                accessor: "Misc_Num1",
            },
            {
                Header: "Out Time",
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
                Header: "Min Bal Req",
                accessor: "MIN_VALUE",
            },
            {
                Header: "Max Continuous",
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
                accessor: "App_Type",
            },
        ],
        []
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 transition-colors">
            {/* ── Page Header ───────────────────────────────────────── */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <span>HR Master</span>
                        <span>&rarr;</span>
                        <span className="text-primary font-bold">Leave & Mispunch Policy</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#193A69] dark:text-[#E2E8F0] flex items-center gap-2 mt-1">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                        Leave & Mispunch Policy Master
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Configure Mispunch reasons, Leave policies, punch timing rules, and mobile/web access criteria.
                    </p>
                </div>

                {/* Policy Type Selector Switch */}
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-lg shadow-sm">
                    <span className="text-xs font-bold text-[#193A69] dark:text-slate-300 ml-2">
                        Active Mode:
                    </span>
                    <button
                        type="button"
                        onClick={() => handlePolicyTypeChange("policyType", "Leave")}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${policyType === "Leave"
                                ? "bg-primary text-white shadow"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                    >
                        <CalendarCheck className="h-3.5 w-3.5" />
                        Leave Policy
                    </button>
                    <button
                        type="button"
                        onClick={() => handlePolicyTypeChange("policyType", "Mispunch")}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${policyType === "Mispunch"
                                ? "bg-amber-600 text-white shadow"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                    >
                        <Clock className="h-3.5 w-3.5" />
                        Mispunch Policy
                    </button>
                </div>
            </div>

            {/* ── Main Content Grid (Form + Impact Chart) ───────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Form (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white dark:bg-[#15203F] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                        {/* Top Section: Master Selection */}
                        <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-5">
                            <div className="flex items-center gap-2 text-[#193A69] dark:text-sky-400 font-bold text-sm mb-3">
                                <Layers className="h-4 w-4" />
                                <span>1. Core Policy Setup</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Eselect
                                        title="Policy Type"
                                        name="policyType"
                                        option={POLICY_TYPE_OPTIONS}
                                        handleInputChange={handlePolicyTypeChange}
                                        initialValue={policyType}
                                        redlabel="*"
                                    />
                                </div>
                                <div>
                                    <Eselect
                                        title="Status"
                                        name="Misc_Abbr"
                                        option={STATUS_OPTIONS}
                                        handleInputChange={handleInputChange}
                                        initialValue={formData.Misc_Abbr}
                                        redlabel="*"
                                    />
                                    {validationErrors.Misc_Abbr && (
                                        <p className="text-red-500 text-xs mt-1">{validationErrors.Misc_Abbr}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Policy Identity & Location */}
                        <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-5">
                            <div className="flex items-center gap-2 text-[#193A69] dark:text-sky-400 font-bold text-sm mb-3">
                                <Settings className="h-4 w-4" />
                                <span>2. Reason Name & Branch</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Ainput
                                        title={policyType === "Leave" ? "Leave Name / Policy Name" : "Mispunch Reason"}
                                        name="Misc_Name"
                                        type="text"
                                        value={formData.Misc_Name}
                                        handleInputChange={handleInputChange}
                                        onInput={(_name, val) => handleInputChange("Misc_Name", val)}
                                        disabled={false}
                                        required={true}
                                        redlabel="*"
                                        placeholder={policyType === "Leave" ? "e.g. CASUAL LEAVE" : "e.g. MISPUNCH"}
                                        errorMessage={validationErrors.Misc_Name}
                                    />
                                </div>
                              
                            </div>

                            {/* Present / Absent / Leave Value Dropdowns using Eselect */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                                <div>
                                    <Eselect
                                        title="Present Value"
                                        name="Misc_Dtl1"
                                        option={PresentValueOptions}
                                        handleInputChange={handleInputChange}
                                        initialValue={formData.Misc_Dtl1}
                                    />
                                </div>
                                <div>
                                    <Eselect
                                        title="Absent Value"
                                        name="Misc_Dtl2"
                                        option={AbsentValueOptions}
                                        handleInputChange={handleInputChange}
                                        initialValue={formData.Misc_Dtl2}
                                    />
                                </div>
                                <div>
                                    <Eselect
                                        title="Leave Value"
                                        name="Misc_Dtl3"
                                        option={LeaveValueOptions}
                                        handleInputChange={handleInputChange}
                                        initialValue={formData.Misc_Dtl3}
                                        redlabel={policyType === "Leave" ? "*" : ""}
                                    />
                                    {validationErrors.Misc_Dtl3 && (
                                        <p className="text-red-500 text-xs mt-1">{validationErrors.Misc_Dtl3}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 3: In Time & Out Time using Eselect */}
                        <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-5 bg-slate-50/70 dark:bg-slate-900/40 p-3.5 rounded-lg">
                            <div className="flex items-center gap-2 text-[#193A69] dark:text-sky-400 font-bold text-sm mb-3">
                                <Timer className="h-4 w-4" />
                                <span>3. Punch Timing Rules</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Eselect
                                        title="In Time"
                                        name="Misc_Num1"
                                        option={InTimeOptions}
                                        handleInputChange={handleInputChange}
                                        initialValue={formData.Misc_Num1}
                                    />
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                        0 = Actual, 1 = Shift Time, 2 = Not Required
                                    </p>
                                </div>
                                <div>
                                    <Eselect
                                        title="Out Time"
                                        name="Misc_Num2"
                                        option={InTimeOptions}
                                        handleInputChange={handleInputChange}
                                        initialValue={formData.Misc_Num2}
                                    />
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                        0 = Actual, 1 = Shift Time, 2 = Not Required
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Conditional Leave Configuration Fields */}
                        {policyType === "Leave" && (
                            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-5 bg-blue-50/50 dark:bg-blue-950/20 p-3.5 rounded-lg">
                                <div className="flex items-center gap-2 text-blue-700 dark:text-sky-300 font-bold text-sm mb-3">
                                    <CalendarCheck className="h-4 w-4" />
                                    <span>4. Leave Rules & Limits</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Eselect
                                            title="Leave / Assessable Type"
                                            name="Assessable_Column"
                                            option={ASSESSABLE_TYPE_OPTIONS}
                                            handleInputChange={handleAssessableTypeChange}
                                            initialValue={formData.Assessable_Column}
                                            redlabel="*"
                                        />
                                        {validationErrors.Assessable_Column && (
                                            <p className="text-red-500 text-xs mt-1">{validationErrors.Assessable_Column}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Ainput
                                            title="Minimum Bal Req."
                                            name="MIN_VALUE"
                                            type="number"
                                            step="0.5"
                                            value={formData.MIN_VALUE}
                                            handleInputChange={handleInputChange}
                                            onInput={(_name, val) => handleInputChange("MIN_VALUE", val)}
                                            disabled={false}
                                            required={true}
                                            redlabel="*"
                                            errorMessage={validationErrors.MIN_VALUE}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                                    <div>
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
                                    <div>
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
                                    <div>
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

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <Eselect
                                            title="Carry Forward"
                                            name="is_carry"
                                            option={CARRY_FORWARD_OPTIONS}
                                            handleInputChange={handleInputChange}
                                            initialValue={formData.is_carry}
                                            redlabel="*"
                                        />
                                    </div>
                                    <div>
                                        <Eselect
                                            title="Back Date Rule"
                                            name="dis_back_date"
                                            option={BACK_DATE_OPTIONS}
                                            handleInputChange={handleInputChange}
                                            initialValue={formData.dis_back_date}
                                            redlabel="*"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Section 4 (Mispunch Mode): Specific Mispunch Rules */}
                        {policyType === "Mispunch" && (
                            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-5 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 rounded-lg">
                                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-sm mb-3">
                                    <Clock className="h-4 w-4" />
                                    <span>4. Mispunch Policy Constraints</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Eselect
                                            title="Back Date Rule"
                                            name="dis_back_date"
                                            option={BACK_DATE_OPTIONS}
                                            handleInputChange={handleInputChange}
                                            initialValue={formData.dis_back_date}
                                            redlabel="*"
                                        />
                                    </div>
                                    <div className="flex flex-col justify-center bg-white dark:bg-slate-900 border border-dashed border-amber-300 dark:border-amber-800 p-3 rounded-md">
                                        <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                                            Assessable Column:
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            Automatically handled as <strong>NULL</strong> for Mispunch.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Section 5: Application Platform Type */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 text-[#193A69] dark:text-sky-400 font-bold text-sm mb-3">
                                <ShieldCheck className="h-4 w-4" />
                                <span>5. Application Access Target</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Eselect
                                        title="Application Type"
                                        name="App_Type"
                                        option={APP_TYPE_OPTIONS}
                                        handleInputChange={handleInputChange}
                                        initialValue={formData.App_Type}
                                        redlabel="*"
                                    />
                                    {validationErrors.App_Type && (
                                        <p className="text-red-500 text-xs mt-1">{validationErrors.App_Type}</p>
                                    )}
                                </div>
                                <div className="flex items-center bg-slate-50 dark:bg-slate-900/60 p-3 rounded-md border border-slate-200 dark:border-slate-800">
                                    <span className="text-xs text-slate-600 dark:text-slate-300">
                                        Backend will automatically assign{" "}
                                        <strong>{formData.App_Type === "Mobile App" ? "Export_Type = 1" : "Export_Type = 2"}</strong>{" "}
                                        and generate <strong>Misc_Code</strong> under <strong>Misc_Type 92</strong>.
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={handleReset}
                                disabled={isSubmitting}
                                className="px-5 py-2 text-xs font-bold uppercase rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Reset
                            </button>

                            <AButton
                                text={isSubmitting ? "SAVING POLICY..." : "SAVE POLICY"}
                                onClick={handleSubmit}
                                type="button"
                                color="primary"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Dynamic Impact Chart & Policy Preview (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                    {/* ChartCard: Real-time Impact Visualization */}
                    <div className="bg-white dark:bg-[#15203F] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-primary" />
                                <h3 className="font-bold text-sm text-[#193A69] dark:text-[#E2E8F0]">
                                    Policy Configuration Metrics Impact
                                </h3>
                            </div>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">
                                {policyType} Mode
                            </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                            Real-time parameter graph reflecting balance limits, notice days, timing rules, and policy weights.
                        </p>

                        <div className="rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 p-2">
                            <ChartCard
                                title={`${policyType} Parameter Weight & Limits`}
                                data={chartMetricsData}
                                height="h-56"
                                type="column"
                            />
                        </div>

                        {/* Impact Summary Pill Badges */}
                        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-slate-100 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                                <span className="text-slate-500 dark:text-slate-400 block font-medium">
                                    {policyType === "Leave" ? "Assessable Column" : "Assessable Type"}
                                </span>
                                <span className="font-bold text-[#193A69] dark:text-sky-300 text-sm">
                                    {policyType === "Leave"
                                        ? ASSESSABLE_TYPE_OPTIONS.find((o) => o.value === formData.Assessable_Column)?.label?.split("→")[1]?.trim() || formData.Assessable_Column
                                        : "NULL"}
                                </span>
                            </div>

                            <div className="bg-slate-100 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                                <span className="text-slate-500 dark:text-slate-400 block font-medium">
                                    In-Time / Out-Time
                                </span>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                                    {formData.Misc_Num1 === "0" ? "Actual" : formData.Misc_Num1 === "1" ? "Shift" : "None"} /{" "}
                                    {formData.Misc_Num2 === "0" ? "Actual" : formData.Misc_Num2 === "1" ? "Shift" : "None"}
                                </span>
                            </div>

                            <div className="bg-slate-100 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                                <span className="text-slate-500 dark:text-slate-400 block font-medium">
                                    Target Application
                                </span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                                    {formData.App_Type}
                                </span>
                            </div>

                            <div className="bg-slate-100 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                                <span className="text-slate-500 dark:text-slate-400 block font-medium">
                                    Back Date Rule
                                </span>
                                <span className="font-bold text-[#193A69] dark:text-slate-200 text-sm">
                                    {formData.dis_back_date === "1" ? "Blocked (1)" : "Allowed (NULL)"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Rules Checklist Card */}
                    <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4 text-xs space-y-2">
                        <h4 className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            Policy Engine Rules Validation
                        </h4>
                        <ul className="space-y-1.5 text-blue-800 dark:text-blue-300">
                            <li className="flex items-start gap-1.5">
                                <span className="text-blue-500 font-bold">•</span>
                                <span>
                                    <strong>In Time (Misc_Num1)</strong> & <strong>Out Time (Misc_Num2)</strong>: Actual (0), Shift Time (1), Not Required (2).
                                </span>
                            </li>
                            <li className="flex items-start gap-1.5">
                                <span className="text-blue-500 font-bold">•</span>
                                <span>
                                    <strong>Misc_Type 92</strong> is automatically managed by the backend engine for all policies.
                                </span>
                            </li>
                            <li className="flex items-start gap-1.5">
                                <span className="text-blue-500 font-bold">•</span>
                                <span>
                                    Double-click on any row in the table below to load and view policy parameters.
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* ── Table Section: ServiceTabel Component ──────────────── */}
            <div className="mt-8 bg-white dark:bg-[#15203F] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-primary" />
                        <h3 className="font-bold text-base text-[#193A69] dark:text-[#E2E8F0]">
                            Leave & Mispunch Policies Master List
                        </h3>
                        {isLoadingTable && (
                            <span className="text-xs text-primary font-medium ml-2 animate-pulse">
                                Loading policies...
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            Total Policies: {policyList.length}
                        </span>
                        <button
                            type="button"
                            onClick={fetchPolicies}
                            disabled={isLoadingTable}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                            title="Refresh Policies"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoadingTable ? "animate-spin" : ""}`} />
                        </button>
                    </div>
                </div>

                <ServiceTabel
                    title="Leave & Mispunch Policies"
                    columns={tableColumns}
                    data={policyList}
                    selectValue="id"
                    onRowDoubleClick={handleRowDoubleClick}
                    height="350px"
                    size="text-xs"
                />
            </div>
        </div>
    );
}
