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

type ExpiringCustomer = {
  Insurance_UTD: number | string;
  CUST_NAME: string;
  CUST_MOB_NO: string;
  POLICY_NAME: string;
  POLICY_NUMBER: string;
  VEHICAL_REG_NO: string;
  MODEL_NAME: string;
  POLICY_START_DATE: string;
  POLICY_END_DATE: string;
  DSC_EMPCODE: string;
  DSC_NAME: string;
  DSC_MOB_NO: string;
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
const InsuranceRenewalAssignmentPage = () => {
  const user = useCurrentUser();

  const getJsonHeaders = () => ({
    accept: "application/json",
    compcode: user?.Comp_Code,
    name: user?.name,
    "Content-Type": "application/json",
  });

  // ── States ───────────────────────────────────────────────────
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [expiringCustomers, setExpiringCustomers] = useState<ExpiringCustomer[]>([]);
  const [selectedDSECode, setSelectedDSECode] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // ✅ Selected rows state
  const [selectedRows, setSelectedRows] = useState<{ id: any; rowData: any }[]>([]);

  // ── Fetch All DSE Employees ──────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    try {
      setIsFetching(true);
      const locCode = user?.branch || "1";

      const res = await axios.post(
        `${BASE_URL}/excel/getEmployees`,
        { Loc_Code: String(locCode) },
        { headers: getJsonHeaders() }
      );

      setEmployees(
        res?.data?.success && Array.isArray(res.data.data)
          ? res.data.data
          : []
      );
      console.log("Employees loaded:", res.data.data?.length);
    } catch (err) {
      console.error("getInsuranceExecutives error:", err);
      setEmployees([]);
      showSideAlert("Error fetching DSE executives", "error");
    } finally {
      setIsFetching(false);
    }
  }, [user?.branch]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // ── Fetch ALL Expiring Customers (30 days) ───────────────────
  const fetchExpiringCustomers = useCallback(async () => {
    try {
      setIsFetching(true);
      const locCode = user?.branch || "1";

      // ✅ Get ALL expiring customers (not filtered by DSE)
      // const res = await axios.post(
      //   `${BASE_URL}/excel/getExpiringInsuranceRenewals`,
      //   {
      //     Loc_Code: locCode,
      //     days: 30,
      //   },
      //   { headers: getJsonHeaders() }
      // );

      
      
    } catch (err) {
      console.error("fetchExpiringCustomers error:", err);
      setExpiringCustomers([]);
      showSideAlert("Error fetching expiring customers", "error");
    } finally {
      setIsFetching(false);
    }
  }, [user?.branch]);

  useEffect(() => {
    fetchExpiringCustomers();
  }, [fetchExpiringCustomers]);

  // ── DSE Dropdown Options ──────────────────────────────────────
  const dseOptions = useMemo(
    () =>
      employees.map((emp) => ({
        value: emp.EMPCODE,
        label: `${(emp.FULL_NAME || "").trim()} - ${emp.EMPCODE}${
          emp.MOBILENO ? ` (${emp.MOBILENO})` : ""
        }`,
      })),
    [employees]
  );

  // ✅ Get selected UTDs from selectedRows
  const selectedInsuRenewalUTDs = useMemo(
    () =>
      selectedRows
        .map((row) => Number(row.rowData?.Insurance_UTD))
        .filter((utd) => !isNaN(utd) && utd > 0),
    [selectedRows]
  );

  // ── Get selected DSE details ─────────────────────────────────
  const selectedDSE = useMemo(
    () => employees.find((e) => e.EMPCODE === selectedDSECode) || null,
    [employees, selectedDSECode]
  );

  // ── Statistics ───────────────────────────────────────────────
  const stats = useMemo(() => {
    const urgent = expiringCustomers.filter((c) => c.DAYS_REMAINING <= 5).length;
    const warning = expiringCustomers.filter(
      (c) => c.DAYS_REMAINING > 5 && c.DAYS_REMAINING <= 10
    ).length;
    const normal = expiringCustomers.filter(
      (c) => c.DAYS_REMAINING > 10
    ).length;

    return { urgent, warning, normal, total: expiringCustomers.length };
  }, [expiringCustomers]);

  // ── Assign Selected Customers to DSE ──────────────────────────
  const handleAssignWork = async () => {
    if (!selectedDSECode) {
      showSideAlert("Please select a DSE executive", "warning");
      return;
    }

    if (selectedInsuRenewalUTDs.length === 0) {
      showSideAlert("Please select at least one customer to assign", "warning");
      return;
    }

    const confirmResult = await Swal.fire({
      title: "Confirm Work Assignment",
      html: `
        <p>Assign <b style="color:#e74c3c">${selectedInsuRenewalUTDs.length}</b> insurance renewal(s) to:</p>
        <b style="color:#27ae60; font-size: 16px;">
          ${selectedDSE?.FULL_NAME?.trim() || selectedDSECode}
        </b>
        <br/>
        <small style="color:#666">
          (${selectedDSECode})
        </small>
        <br/>
        <small style="color:#888">
          Mobile: ${selectedDSE?.MOBILENO || "N/A"}
        </small>
        <br/><br/>
        <p style="font-size: 12px; color: #666;">
          Insurance UTDs: ${selectedInsuRenewalUTDs.slice(0, 5).join(", ")}
          ${
            selectedInsuRenewalUTDs.length > 5
              ? ` ... +${selectedInsuRenewalUTDs.length - 5} more`
              : ""
          }
        </p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Assign Work",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    });

    if (!confirmResult.isConfirmed) return;

    try {
      setIsAssigning(true);

      const payload = {
        DSE_EMPCODE: selectedDSECode,
        selectedInsuRenewalUTDs: selectedInsuRenewalUTDs,
      };

      console.log("Payload:", payload);

      const res = await axios.post(
        `${BASE_URL}/excel/assignwork`,
        payload,
        { headers: getJsonHeaders() }
      );

      console.log("API Response:", res.data);

      if (res?.data?.success) {
        showSideAlert(
          `✅ ${selectedInsuRenewalUTDs.length} insurance renewals assigned to ${selectedDSE?.FULL_NAME}`,
          "success"
        );

        // ✅ Remove assigned customers from list
        setExpiringCustomers((prev) =>
          prev.filter((c) => !selectedInsuRenewalUTDs.includes(Number(c.Insurance_UTD)))
        );
        setSelectedRows([]);
        setSelectedDSECode(""); // Reset DSE selection
      } else {
        showSideAlert(res?.data?.message || "Assignment failed", "error");
      }
    } catch (err: any) {
      console.error("assign work error:", err);
      showSideAlert(
        err?.response?.data?.message ||
          err?.response?.data?.Message ||
          err?.message ||
          "Error assigning work",
        "error"
      );
    } finally {
      setIsAssigning(false);
    }
  };

  // ── Table Columns ─────────────────────────────────────────────
  const columns = [
    {
      Header: "Policy Number",
      accessor: "POLICY_NUMBER",
      width: 120,
    },
    {
      Header: "Vehicle Reg No",
      accessor: "VEHICAL_REG_NO",
      width: 120,
    },
    {
      Header: "Customer Name",
      accessor: "CUST_NAME",
      width: 150,
    },
    {
      Header: "Customer Mobile",
      accessor: "CUST_MOB_NO",
      width: 130,
    },
    {
      Header: "Policy Name",
      accessor: "POLICY_NAME",
      width: 120,
    },
    {
      Header: "Model Name",
      accessor: "MODEL_NAME",
      width: 130,
    },
    {
      Header: "Policy Start Date",
      accessor: "POLICY_START_DATE",
      cellAlign: "center",
      width: 130,
    },
    {
      Header: "Policy End Date",
      accessor: "POLICY_END_DATE",
      cellAlign: "center",
      width: 130,
    },
    {
      Header: "Days Remaining",
      accessor: "DAYS_REMAINING",
      cellAlign: "center",
      width: 120,
      Cell: ({ value }: any) => {
        const days = Number(value);
        let bgColor = "bg-green-100 text-green-700";
        if (days <= 0) bgColor = "bg-red-100 text-red-700";
        else if (days <= 5) bgColor = "bg-red-100 text-red-700"; // ⚠️ Urgent
        else if (days <= 10) bgColor = "bg-orange-100 text-orange-700"; // ⚠️ Warning

        return (
          <span className={`rounded-full px-2 py-1 text-xs font-bold ${bgColor}`}>
            {days > 0 ? `${days} days` : "Expired"}
          </span>
        );
      },
    },
    {
      Header: "Current DSC",
      accessor: "DSC_NAME",
      width: 130,
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
                alt="Insurance Renewal Assignment"
                width={25}
                height={25}
              />
              Insurance Renewal Assignment (Expiring within 30 days)
            </h1>

            <Button
              variant="print"
              onClick={() => window.history.back()}
              disabled={isAssigning}
            >
              Back
            </Button>
          </div>
        </div>
      </div>

      {/* STATISTICS CARDS */}
      <div className="col-span-12 grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Total */}
        <div className="rounded border border-borderColor bg-white p-4 shadow dark:border-borderColor-dark dark:bg-black">
          <h3 className="mb-2 text-sm font-bold text-gray-600 dark:text-gray-400">
            Total Expiring
          </h3>
          <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          <p className="text-xs text-gray-500">Within 30 days</p>
        </div>

        {/* Urgent (≤5 days) */}
        <div className="rounded border border-borderColor bg-white p-4 shadow dark:border-borderColor-dark dark:bg-black">
          <h3 className="mb-2 text-sm font-bold text-gray-600 dark:text-gray-400">
            🔴 Urgent
          </h3>
          <p className="text-3xl font-bold text-red-600">{stats.urgent}</p>
          <p className="text-xs text-gray-500">Expiring ≤ 5 days</p>
        </div>

        {/* Warning (5-10 days) */}
        <div className="rounded border border-borderColor bg-white p-4 shadow dark:border-borderColor-dark dark:bg-black">
          <h3 className="mb-2 text-sm font-bold text-gray-600 dark:text-gray-400">
            🟠 Warning
          </h3>
          <p className="text-3xl font-bold text-orange-600">{stats.warning}</p>
          <p className="text-xs text-gray-500">Expiring 5-10 days</p>
        </div>

        {/* Normal (>10 days) */}
        <div className="rounded border border-borderColor bg-white p-4 shadow dark:border-borderColor-dark dark:bg-black">
          <h3 className="mb-2 text-sm font-bold text-gray-600 dark:text-gray-400">
            🟢 Normal
          </h3>
          <p className="text-3xl font-bold text-green-600">{stats.normal}</p>
          <p className="text-xs text-gray-500">Expiring 10-30 days</p>
        </div>
      </div>

      {/* ASSIGNMENT PANEL */}
      <div className="col-span-12 rounded border border-borderColor bg-white p-4 shadow dark:border-borderColor-dark dark:bg-black">
        <div className="flex flex-wrap items-end gap-3">
          {/* SELECT DSE */}
          <div className="w-full md:w-[25%]">
            <CustomSelectSearch
              title="Assign Selected Customers to DSE"
              name="dseExecutive"
              placeholder="Select DSE..."
              options={dseOptions}
              selectedValue={selectedDSECode}
              handleInputChange={(_name: string, value: string) =>
                setSelectedDSECode(value)
              }
              isSelectAll={false}
              disabled={isAssigning || isFetching}
            />
          </div>

          {/* SELECT ALL / CLEAR */}
          {expiringCustomers.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                const allSelected =
                  selectedInsuRenewalUTDs.length === expiringCustomers.length;

                if (allSelected) {
                  setSelectedRows([]);
                } else {
                  setSelectedRows(
                    expiringCustomers.map((customer) => ({
                      id: customer.Insurance_UTD,
                      rowData: customer,
                    }))
                  );
                }
              }}
              disabled={isAssigning}
            >
              {selectedInsuRenewalUTDs.length === expiringCustomers.length
                ? `Clear All (${expiringCustomers.length})`
                : `Select All (${expiringCustomers.length})`}
            </Button>
          )}

          {/* ASSIGN BUTTON */}
          <Button
            variant="save"
            onClick={handleAssignWork}
            disabled={
              isAssigning ||
              !selectedDSECode ||
              selectedInsuRenewalUTDs.length === 0
            }
          >
            {isAssigning
              ? "Assigning..."
              : `Assign ${selectedInsuRenewalUTDs.length} Insurance(s)`}
          </Button>

          {/* REFRESH BUTTON */}
          <Button
            variant="print"
            onClick={() => fetchExpiringCustomers()}
            disabled={isAssigning || isFetching}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* EXPIRING CUSTOMERS TABLE */}
      <div className="col-span-12 rounded border border-borderColor bg-white p-2 shadow dark:border-borderColor-dark dark:bg-black md:p-4">
        <DataTable
          title={`Insurance Renewals Expiring within 30 days (${expiringCustomers.length} total | ${selectedInsuRenewalUTDs.length} selected)`}
          columns={columns}
          selectValue="Insurance_UTD"
          data={expiringCustomers}
          height={500}
          filterPosition="FilterData"
          enableColumnFilters={true}
          numericFilterColumns={["Insurance_UTD", "CUST_MOB_NO", "DAYS_REMAINING"]}
          onRowDoubleClick={() => {}}
          ischeckbox={true}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
        />

        {!isFetching && expiringCustomers.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-500">
            ✅ No insurance renewals expiring within 30 days
          </div>
        )}
      </div>

      <HashloaderComponent isLoading={isAssigning || isFetching} />
    </div>
  );
};

export default InsuranceRenewalAssignmentPage;