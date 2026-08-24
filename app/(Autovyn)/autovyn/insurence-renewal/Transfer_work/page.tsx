"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import HashloaderComponent from "@/components/Templates/hashloader";
import DataTable from "@/components/Templates/servicetable";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import CustomSelectSearch from "@/components/atoms/Select";
import axios from "axios";
import { useRouter } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_URL;

// ============================================================
// TYPES
// ============================================================
type Employee = {
    EMPCODE: string;
    EMPFIRSTNAME: string;
    EMPLASTNAME: string;
    FULL_NAME: string;
    MOBILENO: string;
};

type PendingInsurance = {
    Insurance_UTD: number | string;
    LOC_CODE: string;
    CUST_NAME: string;
    CUST_MOB_NO: string;
    POLICY_NAME: string;
    POLICY_NUMBER: string;
    VEHICAL_REG_NO: string;
    MODEL_NAME: string;
    POLICY_START_DATE: string;
    POLICY_END_DATE: string;
    DSC_EMPCODE: string | null;
    DSC_NAME: string | null;
    DSC_MOB_NO: string | null;
    DAYS_REMAINING: number;
};

// ============================================================
// ALERT
// ============================================================
function showSideAlert(
    message: string,
    type: "success" | "error" | "warning" | "info"
) {
    Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
    }).fire({ icon: type, title: message });
}

// ============================================================
// PAGE
// ============================================================
const TransferInsuranceWorkloadPage = () => {
    const user = useCurrentUser();

    const getJsonHeaders = () => ({
        accept: "application/json",
        compcode: user?.Comp_Code,
        name: user?.name,
        "Content-Type": "application/json",
    });

    // ── States ───────────────────────────────────────────────────
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [fromEmpCode, setFromEmpCode] = useState<string>("");
    const [toEmpCode, setToEmpCode] = useState<string>("");
    const [pendingInsurances, setPendingInsurances] = useState<PendingInsurance[]>([]);
    const [isTransferring, setIsTransferring] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    // ✅ Selected rows state
    const [selectedRows, setSelectedRows] = useState<{ id: any; rowData: any }[]>([]);

    // ── Fetch Employees ──────────────────────────────────────────
    const fetchEmployees = useCallback(async () => {
        try {
            const locCode = user?.branch || "1";
            const res = await axios.post(
                `${BASE_URL}/Crm/getEmployees`,
                { Loc_Code: String(locCode) },
                { headers: getJsonHeaders() }
            );
            setEmployees(
                res?.data?.success && Array.isArray(res.data.data)
                    ? res.data.data
                    : []
            );
        } catch (err) {
            console.error("getInsuranceExecutives error:", err);
            setEmployees([]);
        }
    }, [user?.branch]);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    // ── Employee Dropdown Options ─────────────────────────────────
    const employeeOptions = useMemo(
        () =>
            employees.map((emp) => ({
                value: emp.EMPCODE,
                label: `${(emp.FULL_NAME || "").trim()} - ${emp.EMPCODE}${
                    emp.MOBILENO ? ` (${emp.MOBILENO})` : ""
                }`,
            })),
        [employees]
    );

    const toEmployeeOptions = useMemo(
        () => employeeOptions.filter((e) => e.value !== fromEmpCode),
        [employeeOptions, fromEmpCode]
    );

      const router = useRouter();

    const fromEmployeeOptions = useMemo(
        () => employeeOptions.filter((e) => e.value !== toEmpCode),
        [employeeOptions, toEmpCode]
    );

    // ── Fetch Pending Insurance ──────────────────────────────────
    const fetchPendingInsurance = useCallback(async () => {
        if (!fromEmpCode) {
            setPendingInsurances([]);
            setSelectedRows([]); // ✅ clear selection
            return;
        }

        try {
            setIsFetching(true);
            const locCode = user?.branch || "1";

            const res = await axios.post(
                `${BASE_URL}/Crm/getPendingTasksByExecutive`,
                { from_Emp_Code: fromEmpCode, Loc_Code: locCode },
                { headers: getJsonHeaders() }
            );

            setPendingInsurances(
                res?.data?.success && Array.isArray(res.data.data)
                    ? res.data.data
                    : []
            );
            setSelectedRows([]); // ✅ new executive select hone par selection clear
        } catch (err: any) {
            console.error("fetchPendingInsurance error:", err);
            setPendingInsurances([]);
            setSelectedRows([]);
            showSideAlert(
                err?.response?.data?.message || "Error fetching pending insurance renewals",
                "error"
            );
        } finally {
            setIsFetching(false);
        }
    }, [fromEmpCode, user?.branch]);

    useEffect(() => {
        fetchPendingInsurance();
        setToEmpCode("");
    }, [fromEmpCode]);

    // ── Employee info helpers ────────────────────────────────────
    const fromEmployee = useMemo(
        () => employees.find((e) => e.EMPCODE === fromEmpCode) || null,
        [employees, fromEmpCode]
    );

    const toEmployee = useMemo(
        () => employees.find((e) => e.EMPCODE === toEmpCode) || null,
        [employees, toEmpCode]
    );

    // ✅ Selected insurance renewals derived from selectedRows
    const selectedInsurances = useMemo(
        () => selectedRows.map((r) => r.rowData as PendingInsurance),
        [selectedRows]
    );

    // ✅ Selected Insurance UTDs
    const selectedInsuRenewalUTDs = useMemo(
        () =>
            selectedInsurances
                .map((t) => Number(t.Insurance_UTD))
                .filter((v) => !isNaN(v) && v > 0),
        [selectedInsurances]
    );

    // ── Handle Transfer ──────────────────────────────────────────
    const handleTransfer = async () => {
        if (!fromEmpCode) {
            showSideAlert("Please select the source (From) executive", "warning");
            return;
        }

        if (!toEmpCode) {
            showSideAlert("Please select the destination (To) executive", "warning");
            return;
        }

        if (fromEmpCode === toEmpCode) {
            showSideAlert("From and To executive cannot be the same", "warning");
            return;
        }

        // ✅ Selected insurance check
        if (selectedInsurances.length === 0) {
            showSideAlert(
                "Please select at least one insurance renewal to transfer",
                "warning"
            );
            return;
        }

        const confirmResult = await Swal.fire({
            title: "Confirm Insurance Transfer",
            html: `
        Transfer <b>${selectedInsurances.length}</b> insurance renewal(s) from<br/>
        <b style="color:#e74c3c">
          ${fromEmployee?.FULL_NAME?.trim() || fromEmpCode}
        </b>
        <br/>to<br/>
        <b style="color:#27ae60">
          ${toEmployee?.FULL_NAME?.trim() || toEmpCode}
        </b>
        <br/><br/>
        <small style="color:#666">
          Insurance UTDs: ${selectedInsuRenewalUTDs.slice(0, 5).join(", ")}
          ${
              selectedInsuRenewalUTDs.length > 5
                  ? ` ... +${selectedInsuRenewalUTDs.length - 5} more`
                  : ""
          }
        </small>
        <br/>Do you want to continue?
      `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Transfer",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
        });

        if (!confirmResult.isConfirmed) return;

        try {
            setIsTransferring(true);

            const locCode = user?.branch || "1";

            // ✅ Sirf selected UTDs pass karo
            const payload = {
                from_Emp_Code: fromEmpCode,
                to_Emp_Code: toEmpCode,
                to_exec_name: toEmployee?.FULL_NAME?.trim() || null,
                to_exec_mobile: toEmployee?.MOBILENO || null,
                Loc_Code: locCode,
                // ✅ KEY CHANGE: selected Insurance UTDs
                selectedInsuRenewalUTDs,
                Updated_By: user?.name || (user as any)?.UTD || null,
            };

            const res = await axios.post(
                `${BASE_URL}/Crm/transferInsuranceWorkload`,
                payload,
                { headers: getJsonHeaders() }
            );

            if (res?.data?.success) {
                showSideAlert(
                    res.data.message || "Insurance renewals transferred successfully",
                    "success"
                );

                // ✅ Sirf transferred insurance ko list se hatao
                setPendingInsurances((prev) =>
                    prev.filter(
                        (t) =>
                            !selectedInsuRenewalUTDs.includes(Number(t.Insurance_UTD))
                    )
                );
                setSelectedRows([]);
                setToEmpCode("");
            } else {
                showSideAlert(res?.data?.message || "Transfer failed", "error");
            }
        } catch (err: any) {
            console.error("transfer error:", err);
            showSideAlert(
                err?.response?.data?.message ||
                    err?.response?.data?.Message ||
                    err?.message ||
                    "Error transferring insurance renewals",
                "error"
            );
        } finally {
            setIsTransferring(false);
        }
    };

    // ── Table Columns ─────────────────────────────────────────────
    const columns = [
        { Header: "Policy Number", accessor: "POLICY_NUMBER" },
        { Header: "Vehicle Reg No", accessor: "VEHICAL_REG_NO" },
        { Header: "Customer Name", accessor: "CUST_NAME" },
        { Header: "Customer Mobile", accessor: "CUST_MOB_NO" },
        { Header: "Policy Name", accessor: "POLICY_NAME" },
        { Header: "Model Name", accessor: "MODEL_NAME" },
        { Header: "Current DSE Name", accessor: "DSC_NAME" },
        { Header: "Current DSE Code", accessor: "DSC_EMPCODE" },
        { Header: "Current DSE Mobile", accessor: "DSC_MOB_NO" },
        {
            Header: "Policy Start Date",
            accessor: "POLICY_START_DATE",
            cellAlign: "center",
            Cell: ({ value }: any) => {
                if (!value) return "";
                const [y, m, d] = String(value).split("-");
                return `${d}-${m}-${y}`;
            },
        },
        {
            Header: "Policy End Date",
            accessor: "POLICY_END_DATE",
            cellAlign: "center",
            Cell: ({ value }: any) => {
                if (!value) return "";
                const [y, m, d] = String(value).split("-");
                return `${d}-${m}-${y}`;
            },
        },
        {
            Header: "Days Remaining",
            accessor: "DAYS_REMAINING",
            cellAlign: "center",
            Cell: ({ value }: any) => {
                const days = Number(value);
                let bgColor = "bg-green-100 text-green-700";
                if (days <= 0) bgColor = "bg-red-100 text-red-700";
                else if (days <= 5) bgColor = "bg-orange-100 text-orange-700";
                else if (days <= 10) bgColor = "bg-yellow-100 text-yellow-700";

                return (
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${bgColor}`}>
                        {days > 0 ? `${days} days` : "Expired"}
                    </span>
                );
            },
        },
    
    ];

    // ── Render ────────────────────────────────────────────────────
    return (
        <div className="grid grid-cols-12 gap-4">
            {/* HEADER */}
            <div className="col-span-12">
                <div className="rounded-t border border-borderColor bg-header px-2 py-2 dark:border-borderColor-dark dark:bg-black md:px-6">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <h1 className="flex items-center gap-x-3 text-sm font-bold uppercase text-white dark:text-[#37a9dd] md:text-lg lg:text-xl">
                            <Image
                                src="/Payrollicon/Excel_Import.png"
                                alt="Transfer Insurance"
                                width={25}
                                height={25}
                            />
                            Transfer Insurance Workload
                        </h1>

                        <Button
                            variant="print"
                            onClick={() => window.history.back()}
                            disabled={isTransferring}
                        >
                            Back
                        </Button>
                    </div>
                </div>
            </div>

            {/* TRANSFER PANEL */}
            <div className="col-span-12 rounded border border-borderColor bg-white p-4 shadow dark:border-borderColor-dark dark:bg-black">
                <div className="flex flex-wrap items-end gap-3">

                    {/* FROM EXECUTIVE */}
                    <div className="w-full md:w-[22%]">
                        <CustomSelectSearch
                            title="Select From Executive (DSE)"
                            name="fromExecutive"
                            placeholder="Select source executive..."
                            options={fromEmployeeOptions}
                            selectedValue={fromEmpCode}
                            handleInputChange={(_name: string, value: string) =>
                                setFromEmpCode(value)
                            }
                            isSelectAll={false}
                            disabled={isTransferring}
                        />
                    </div>

                    {/* ARROW */}
                    <div className="flex items-center justify-center pb-1">
                        <span className="text-2xl font-bold text-blue-500">→</span>
                    </div>

                    {/* TO EXECUTIVE */}
                    <div className="w-full md:w-[22%]">
                        <CustomSelectSearch
                            title="Select To Executive (DSE)"
                            name="toExecutive"
                            placeholder="Select destination executive..."
                            options={toEmployeeOptions}
                            selectedValue={toEmpCode}
                            handleInputChange={(_name: string, value: string) =>
                                setToEmpCode(value)
                            }
                            isSelectAll={false}
                            disabled={isTransferring || !fromEmpCode}
                        />
                    </div>

                    {/* SELECT ALL / CLEAR */}
                    {pendingInsurances.length > 0 && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                const allSelected =
                                    selectedInsurances.length === pendingInsurances.length;

                                if (allSelected) {
                                    // Clear Selection
                                    setSelectedRows([]);
                                } else {
                                    // Select All
                                    setSelectedRows(
                                        pendingInsurances.map((t) => ({
                                            id: t.Insurance_UTD,
                                            rowData: t,
                                        }))
                                    );
                                }
                            }}
                            disabled={isTransferring}
                        >
                            {selectedInsurances.length === pendingInsurances.length
                                ? `Clear All (${pendingInsurances.length})`
                                : `Select All (${pendingInsurances.length})`}
                        </Button>
                    )}

                    {/* TRANSFER BUTTON */}
                    <Button
                        variant="save"
                        onClick={handleTransfer}
                        disabled={
                            isTransferring ||
                            !fromEmpCode ||
                            !toEmpCode ||
                            selectedInsurances.length === 0
                        }
                    >
                        {isTransferring
                            ? "Transferring..."
                            : `Transfer ${selectedInsurances.length} Insurance`}
                    </Button>

                    {/* RESET BUTTON */}
                    <Button
                        variant="print"
                        onClick={() => {
                            setFromEmpCode("");
                            setToEmpCode("");
                            setPendingInsurances([]);
                            setSelectedRows([]);
                        }}
                        disabled={isTransferring}
                    >
                        Reset
                    </Button>

                     <Button variant="print" onClick={() => router.back()}>
                                   Back
                                 </Button>
                </div>
            </div>

            {/* PENDING INSURANCE TABLE */}
            <div className="col-span-12 rounded border border-borderColor bg-white p-2 shadow dark:border-borderColor-dark dark:bg-black md:p-4">
                <DataTable
                    title={
                        fromEmpCode
                            ? `Pending Insurance Renewals — ${
                                  fromEmployee?.FULL_NAME?.trim() || fromEmpCode
                              } (${pendingInsurances.length} total | ${selectedInsurances.length} selected)`
                            : "Pending Insurance Renewals"
                    }
                    columns={columns}
                    selectValue="Insurance_UTD"
                    data={pendingInsurances}
                    height={400}
                    filterPosition="FilterData"
                    enableColumnFilters={true}
                    numericFilterColumns={["Insurance_UTD", "CUST_MOB_NO"]}
                    onRowDoubleClick={() => {}}
                    // ✅ Checkbox selection
                    ischeckbox={true}
                    selectedRows={selectedRows}
                    setSelectedRows={setSelectedRows}
                />

                {fromEmpCode && !isFetching && pendingInsurances.length === 0 && (
                    <div className="py-4 text-center text-sm text-gray-500">
                        ✅ No pending insurance renewals found for{" "}
                        <strong>
                            {fromEmployee?.FULL_NAME?.trim() || fromEmpCode}
                        </strong>
                    </div>
                )}
            </div>

            <HashloaderComponent isLoading={isTransferring || isFetching} />
        </div>
    );
};

export default TransferInsuranceWorkloadPage;