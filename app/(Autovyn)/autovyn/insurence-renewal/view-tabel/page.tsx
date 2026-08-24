"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import DataTable from "@/components/Templates/reactTable";
import Ainput from "@/components/atoms/Input";
import CustomSelectSearch from "@/components/atoms/Select";
import HashloaderComponent from "@/components/Templates/hashloader";
import { useCurrentUser } from "@/app/hooks/use-current-user";

type Employee = {
  EMPCODE: string;
  EMPFIRSTNAME: string;
  EMPLASTNAME: string;
  FULL_NAME: string;
  MOBILENO: string;
};

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

// YYYY-MM-DD -> DD/MM/YYYY (backend expects DD/MM/YYYY)
function ymdToDmy(ymd?: string | null) {
  if (!ymd) return "";
  const m = String(ymd).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(ymd);
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function todayYMD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function InsuRenewalExportView() {
  const user: any = useCurrentUser();
  const router = useRouter();

  const BASE_URL = process.env.NEXT_PUBLIC_URL;
  const API_URL = `${BASE_URL}/Crm/filter`;

  const [form, setForm] = useState({
    fromDate: todayYMD(),
    toDate: todayYMD(),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [tableData, setTableData] = useState<any[]>([]);

  // DSE & Selection States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDSECode, setSelectedDSECode] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<{ id: any; rowData: any }[]>([]);

  const handleInputChange = (name: string, value: any) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Fetch active DSE / Employees from EMPLOYEEMASTER
  const fetchEmployees = useCallback(async () => {
    if (!user?.Comp_Code) return;
    try {
      const res = await axios.post(
        `${BASE_URL}/Crm/getEmployees`,
        { Loc_Code: user?.branch || "" },
        {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code,
            name: user?.name,
            "Content-Type": "application/json",
          },
        }
      );
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setEmployees(res.data.data);
      } else {
        setEmployees([]);
      }
    } catch (err) {
      console.error("fetchEmployees error:", err);
      setEmployees([]);
    }
  }, [BASE_URL, user?.Comp_Code, user?.branch, user?.name]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // DSE dropdown options
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

  // Selected UTDs from checked rows
  const selectedInsuRenewalUTDs = useMemo(
    () =>
      selectedRows
        .map((row) => Number(row.rowData?.UTD || row.id))
        .filter((utd) => !isNaN(utd) && utd > 0),
    [selectedRows]
  );

  // Selected DSE details
  const selectedDSE = useMemo(
    () => employees.find((e) => e.EMPCODE === selectedDSECode) || null,
    [employees, selectedDSECode]
  );

  const columns = useMemo(
    () => [
      { Header: "CUST NAME", accessor: "CUST_NAME" },
      { Header: "CUST MOB NO", accessor: "CUST_MOB_NO" },
      { Header: "POLICY NAME", accessor: "POLICY_NAME" },
      { Header: "POLICY NUMBER", accessor: "POLICY_NUMBER" },
      { Header: "VEHICLE REG NO", accessor: "VEHICAL_REG_NO" },
      { Header: "MODEL NAME", accessor: "MODEL_NAME" },
      { Header: "DSE EMPCODE", accessor: "DSC_EMPCODE" },
      { Header: "DSE NAME", accessor: "DSC_NAME" },
      { Header: "DSE MOB NO", accessor: "DSC_MOB_NO" },
      { Header: "POLICY START DATE", accessor: "POLICY_START_DATE" },
      { Header: "POLICY END DATE", accessor: "POLICY_END_DATE" },
    ],
    [],
  );

  const fetchData = async () => {
    try {
      if (!user?.Comp_Code) {
        showSideAlert("Compcode not found. Please re-login.", "error");
        return;
      }

      if (!form.fromDate || !form.toDate) {
        showSideAlert("Please select From Date and To Date", "warning");
        return;
      }

      setIsLoading(true);
      setSelectedRows([]);

      const payload: any = {
        fromDate: ymdToDmy(form.fromDate),
        toDate: ymdToDmy(form.toDate),
        loc_code: user?.branch || "",
        empcode: user?.EMPCODE,
        emp_dms_code: user?.emp_dms_code,
      };

      const res = await axios.post(API_URL, payload, {
        headers: {
          accept: "application/json",
          compcode: user?.Comp_Code,
          name: user?.name,
          "Content-Type": "application/json",
        },
      });

      if (res.data?.ok) {
        setTableData(res.data.data || []);
        showSideAlert(`Loaded ${res.data.count || 0} records`, "success");
      } else {
        setTableData([]);
        showSideAlert(res.data?.Message || "No data", "warning");
      }
    } catch (err: any) {
      setTableData([]);
      showSideAlert(
        err?.response?.data?.Message || err?.message || "Server error",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Assign checked customers to selected DSE
  const handleAssignWork = async () => {
    if (!selectedDSECode) {
      showSideAlert("Please select a DSE executive from dropdown", "warning");
      return;
    }

    if (selectedInsuRenewalUTDs.length === 0) {
      showSideAlert("Please select at least one customer row with checkbox", "warning");
      return;
    }

    const confirmResult = await Swal.fire({
      title: "Confirm Work Assignment",
      html: `
        <p>Assign <b style="color:#e74c3c">${selectedInsuRenewalUTDs.length}</b> customer to:</p>
        <b style="color:#27ae60; font-size: 16px;">
          ${selectedDSE?.FULL_NAME?.trim() || selectedDSECode}
        </b>
        <br/>
        <small style="color:#666">
          Emp Code: ${selectedDSECode} ${selectedDSE?.MOBILENO ? `| Mobile: ${selectedDSE.MOBILENO}` : ""}
        </small>
      `,
      icon: "question",
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

      const res = await axios.post(
        `${BASE_URL}/Crm/assignwork`,
        payload,
        {
          headers: {
            accept: "application/json",
            compcode: user?.Comp_Code,
            name: user?.name,
            "Content-Type": "application/json",
          },
        }
      );

      if (res?.data?.success) {
        showSideAlert(
          `✅ ${selectedInsuRenewalUTDs.length} customer assigned to ${selectedDSE?.FULL_NAME || selectedDSECode}`,
          "success"
        );

        // Update local tableData so DSC details reflect immediately in view
        setTableData((prev) =>
          prev.map((row) => {
            if (selectedInsuRenewalUTDs.includes(Number(row.UTD))) {
              return {
                ...row,
                DSC_EMPCODE: selectedDSE?.EMPCODE || selectedDSECode,
                DSC_NAME: selectedDSE?.FULL_NAME || "",
                DSC_MOB_NO: selectedDSE?.MOBILENO || "",
              };
            }
            return row;
          })
        );

        setSelectedRows([]);
        setSelectedDSECode("");
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

  // auto-load when user available
  useEffect(() => {
    if (user?.Comp_Code) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.Comp_Code]);

  return (
    <div className="grid grid-cols-12 gap-3 p-3">
      {/* Header + Back button */}
      <div className="col-span-12">
        <div className="rounded-t bg-header dark:bg-black px-2 md:px-6 py-2 border dark:border-borderColor-dark">
          <div className="flex items-center justify-between gap-4">
            <div className="col-span-12">
              <h1 className="font-bold sm:text-sm md:text-lg lg:text-xl text-white dark:text-[#37a9dd] uppercase">
                Insurance Renewal Table
              </h1>
              <div className="text-[11px] text-white/80 mt-0.5"></div>
            </div>

            <div className="flex gap-2">
              <Button variant="print" onClick={() => router.back()}>
                Back
              </Button>
            </div>
          </div>
        </div>

        {/* Filter bar & Assign DSE bar */}
        <div className="rounded-b mt-0 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark p-3 shadow">
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-12 sm:col-span-6 md:col-span-2">
              <Ainput
                title="Date From"
                type="date"
                name="fromDate"
                redlabel="*"
                value={form.fromDate}
                handleInputChange={handleInputChange}
                onInput={() => {}}
              />
            </div>

            <div className="col-span-12 sm:col-span-6 md:col-span-2">
              <Ainput
                title="Date To"
                type="date"
                name="toDate"
                redlabel="*"
                value={form.toDate}
                handleInputChange={handleInputChange}
                onInput={() => {}}
              />
            </div>

            <div className="col-span-12 sm:col-span-4 md:col-span-1 flex gap-2">
              <Button variant="save" onClick={fetchData} className="w-full">
                Show
              </Button>
            </div>

            {/* DSE Selection Dropdown */}
            <div className="col-span-12 sm:col-span-8 md:col-span-4">
              <CustomSelectSearch
                title="Select DSE"
                name="dseExecutive"
                placeholder="Choose DSE to assign..."
                options={dseOptions}
                selectedValue={selectedDSECode}
                handleInputChange={(_name: string, value: string) =>
                  setSelectedDSECode(value)
                }
                isSelectAll={false}
                disabled={isAssigning || isLoading}
              />
            </div>

            {/* Apply / Assign Button */}
            <div className="col-span-12 md:col-span-3 flex items-center gap-2">
              <Button
                variant="save"
                onClick={handleAssignWork}
                disabled={isAssigning || isLoading || selectedInsuRenewalUTDs.length === 0}
                className="w-full bg-[#28a745] hover:bg-[#218838] text-white font-bold whitespace-nowrap text-xs md:text-sm py-2"
              >
                {isAssigning
                  ? "Assigning..."
                  : `Assign (${selectedInsuRenewalUTDs.length})`}
              </Button>
              {selectedInsuRenewalUTDs.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRows([])}
                  className="text-xs text-red-500 hover:text-red-700 border-red-300 whitespace-nowrap"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table with Checkbox */}
      <div className="col-span-12 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark rounded p-2 shadow">
        <DataTable
          title={
            selectedInsuRenewalUTDs.length > 0
              ? `Selected: ${selectedInsuRenewalUTDs.length} customer`
              : ""
          }
          columns={columns}
          data={tableData}
          selectValue="UTD"
          onRowDoubleClick={() => {}}
          height="450px"
          filterPosition="FilterData"
          numericFilterColumns={[]}
          ischeckbox={true}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
        />
      </div>

      <HashloaderComponent isLoading={isLoading || isAssigning} />
    </div>
  );
}
