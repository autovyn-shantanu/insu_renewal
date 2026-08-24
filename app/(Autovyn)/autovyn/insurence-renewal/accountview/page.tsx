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

// YYYY-MM-DD -> DD/MM/YYYY
// (Backend controller toDbDate supports both, but we keep this for safety/consistency)
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
  const user = useCurrentUser();
  const router = useRouter();

  // ✅ Approved-only (Account View) API
  // NOTE: Route name aapke backend route mapping ke hisab se set kar lena:
  // Example: /excel/getAllApprovedInsuranceRenewals
  const API_URL = `${process.env.NEXT_PUBLIC_URL}/Crm/getApprovedOne`;

  const [form, setForm] = useState({
    fromDate: todayYMD(),  
    toDate: todayYMD(),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [tableData, setTableData] = useState<any[]>([]);

  const handleInputChange = (name: string, value: any) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const columns = useMemo(
    () => [
      { Header: "UTD", accessor: "UTD" },
      { Header: "CUST NAME", accessor: "CUST_NAME" },
      { Header: "CUST MOB NO", accessor: "CUST_MOB_NO" },
      { Header: "POLICY NAME", accessor: "POLICY_NAME" },
      { Header: "POLICY NUMBER", accessor: "POLICY_NUMBER" },
      { Header: "VEHICLE REG NO", accessor: "VEHICAL_REG_NO" },
      { Header: "MODEL NAME", accessor: "MODEL_NAME" },
      { Header: "POLICY START DATE", accessor: "POLICY_START_DATE" },
      { Header: "POLICY END DATE", accessor: "POLICY_END_DATE" },
    ],
    []
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

      // ✅ Controller me created-at filter P.CREATED_AT pe lagta hai
      // We will send createdFrom/createdTo using selected dates
      const payload = {
        page: 1,
        pageSize: 10000, 
        createdFrom: ymdToDmy(form.fromDate),
        createdTo: ymdToDmy(form.toDate),
        loc_code: user?.branch || "",
        empcode: user?.EMPCODE,
        emp_dms_code:user?.emp_dms_code,
      };

      const res = await axios.post(API_URL, payload, {
        headers: {
          accept: "application/json",
          compcode: user?.Comp_Code,
          name: user?.name,
         
          id: user?.id,
          usercode: user?.id,
          "Content-Type": "application/json",
        },
      });

      // ✅ New API returns: { success, Message, pagination, data }
      if (res.data?.success) {
        const rows = res.data?.data || [];
        setTableData(rows);

        const total =
          res.data?.pagination?.totalRecords != null
            ? Number(res.data.pagination.totalRecords)
            : rows.length;

        showSideAlert(`Loaded ${total} approved records`, "success");
      } else {
        setTableData([]);
        showSideAlert(res.data?.Message || "No data", "warning");
      }
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

  // keep existing behavior: auto-load when user available
  useEffect(() => {
    if (user?.Comp_Code) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.Comp_Code]);

  return (
    <div className="grid grid-cols-12 gap-3 p-3">
      {/* Header + Back */}
      <div className="col-span-12">
        <div className="rounded-t bg-header dark:bg-black px-2 md:px-6 py-2 border dark:border-borderColor-dark">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-bold sm:text-sm md:text-lg lg:text-xl text-white dark:text-[#37a9dd] uppercase truncate">
                Insurance Renewal Table (Approved)
              </h1>
            </div>

            <div className="flex gap-2">
              <Button variant="print" onClick={() => router.back()}>
                Back
              </Button>
            </div>
          </div>
        </div>

        {/* Filter bar: Created-At From/To + Show */}
        <div className="rounded-b mt-0 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark p-3 shadow">
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-12 md:col-span-3">
              <Ainput
                title="Created Date From"
                type="date"
                name="fromDate"
                redlabel="*"
                value={form.fromDate}
                handleInputChange={handleInputChange}
                onInput={() => {}}
              />
            </div>

            <div className="col-span-12 md:col-span-3">
              <Ainput
                title="Created Date To"
                type="date"
                name="toDate"
                redlabel="*"
                value={form.toDate}
                handleInputChange={handleInputChange}
                onInput={() => {}}
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

      {/* Table */}
      <div className="col-span-12 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark rounded p-2 shadow">
        <DataTable
          title={""}
          columns={columns}
          data={tableData}
          selectValue="UTD"
          onRowDoubleClick={() => {}}
          height="380px"
          filterPosition="FilterData"
          numericFilterColumns={[]}
        />
      </div>

      <HashloaderComponent isLoading={isLoading} />
    </div>
  );
}