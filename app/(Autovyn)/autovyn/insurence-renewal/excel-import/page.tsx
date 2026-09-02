"use client";
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/Templates/reactTable";
import axios from "axios";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import Swal from "sweetalert2";
import HashloaderComponent from "@/components/Templates/hashloader";
import Image from "next/image";
import * as XLSX from "xlsx";

function showSideAlert(message, type) {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 5000,
    timerProgressBar: true,
    customClass: {
      container: "side-alert-container",
      popup: `side-alert-${type}`,
      title: "side-alert-title",
      icon: "side-alert-icon",
    },
  });

  Toast.fire({
    icon: type,
    title: message,
  });
}

const Approver2 = () => {
  const user = useCurrentUser();

  const API_BASE =
    (process.env.NEXT_PUBLIC_URL || "").replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "");

  const SAMPLE_API = `${process.env.NEXT_PUBLIC_URL}/Crm/sampel`;
  const IMPORT_API = `${process.env.NEXT_PUBLIC_URL}/Crm/import`;

  const [excelfile, setFile] = useState();
  const [isLoadingonpage, setisLoadingonpage] = useState(false);
  const [tabledata, setTabledata] = useState([]);
  const [erroredData, setErroredData] = useState([]);
  const [correctData, setCorrectData] = useState([]);
  const fileInputRef = useRef(null);

  // ✅ Updated columns with DSC_EMPCODE, DSC_NAME, DSC_MOB_NO
  const columns1 = [
    {
      Header: "REJECTION REASONS",
      accessor: "rejectionReasons",
      Cell: ({ value }) => (
        <span className="text-exit font-semibold">{value || "-"}</span>
      ),
    },
    { Header: "EXCEL ROW",          accessor: "Excel_Row"         },
    { Header: "CUST NAME",          accessor: "CUST_NAME"         },
    { Header: "CUST MOB NO",        accessor: "CUST_MOB_NO"       },
    { Header: "POLICY NAME",        accessor: "POLICY_NAME"       },
    { Header: "POLICY NUMBER",      accessor: "POLICY_NUMBER"     },
    { Header: "VEHICLE REG NO",     accessor: "VEHICAL_REG_NO"    },
    { Header: "MODEL NAME",         accessor: "MODEL_NAME"        },
    { Header: "DSE EMPCODE",        accessor: "DSC_EMPCODE"       }, 
    { Header: "DSE NAME",           accessor: "DSC_NAME"          }, 
    { Header: "DSE MOB NO",         accessor: "DSC_MOB_NO"        }, 
    { Header: "POLICY START DATE",  accessor: "POLICY_START_DATE" },
    { Header: "POLICY END DATE",    accessor: "POLICY_END_DATE"   },
  ];

  // base64 => Uint8Array
  const base64ToUint8Array = (base64) => {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  };

  const parseResultExcelBase64 = (base64File) => {
    const bytes = base64ToUint8Array(base64File);
    const wb = XLSX.read(bytes, { type: "array", cellDates: true });

    const importedSheet =
      wb.Sheets["Imported Data"] || wb.Sheets[wb.SheetNames?.[0]];
    const nonImportedSheet =
      wb.Sheets["Non Imported Data"] || wb.Sheets[wb.SheetNames?.[1]];

    const imported = importedSheet
      ? XLSX.utils.sheet_to_json(importedSheet, { defval: "" })
      : [];
    const nonImported = nonImportedSheet
      ? XLSX.utils.sheet_to_json(nonImportedSheet, { defval: "" })
      : [];

    const withUTD = (arr) =>
      (arr || []).map((x, idx) => ({
        UTD: x?.UTD ?? x?.Excel_Row ?? idx + 1,
        ...x,
      }));

    return {
      imported: withUTD(imported),
      nonImported: withUTD(nonImported),
    };
  };

  // ✅ Sample download
  const showdata = async () => {
    try {
      if (!user?.Comp_Code) {
        showSideAlert("Compcode missing", "error");
        return;
      }

      setisLoadingonpage(true);

      const res = await axios.get(SAMPLE_API, {
        params: { compcode: user?.Comp_Code },
        responseType: "blob",
        headers: {
            accept: "application/json",
            compcode: user?.Comp_Code,
            name: user?.name,
            loc_code:user.branch
            
        },
      });

      const contentDisposition = res.headers?.["content-disposition"] || "";
      const match = contentDisposition.match(/filename="?([^"]+)"?/i);
      const fileName = match?.[1] || "INSURANCE_RENUAL_TEMPLATE.xlsx";

      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setisLoadingonpage(false);
    } catch (error) {
      setisLoadingonpage(false);
      console.error("Sample download error:", error);
      showSideAlert(
        error?.response?.data?.Message || "Invalid Request",
        "error"
      );
    }
  };

  // ✅ Import Excel
 const handleButtonClick = async () => {
    try {
      console.log(user?.branch, "branchmmm")
      const branches = String(user.branch)
        .split(",")
        .filter(x => x.trim() !== "");

      if (branches.length > 1) {
        showSideAlert("Multiple branches are not allowed.", "warning");
        return;
      }
      if (!user?.Comp_Code) {
        showSideAlert("Compcode missing", "error");
        return;
      }
      if (!excelfile) {
        showSideAlert("Please select an Excel file.", "error");
        return;
      }

      setTabledata([]);
      setisLoadingonpage(true);

      const cleanBranch = String(user?.branch || "").split(",")[0].trim();
      const formData = new FormData();
      formData.append("excel", excelfile, excelfile.name);
      formData.append("user", user?.name ?? "");
      formData.append("branch", cleanBranch);

      const response = await axios.post(IMPORT_API, formData, {
        headers: {
          accept: "application/json",
          compcode: user?.Comp_Code,
          name: user?.name,
          loc_code: cleanBranch,
          // ✅ no "Content-Type" here
        },
      });

      if (response.status === 200) {
        let CorrectMapped = [];
        let ErroredMapped = [];

        if (Array.isArray(response?.data?.CorrectData) || Array.isArray(response?.data?.ErroredData)) {
          CorrectMapped = (response?.data?.CorrectData || []).map((x, idx) => ({
            UTD: x?.UTD ?? x?.Excel_Row ?? idx + 1,
            ...x,
          }));
          ErroredMapped = (response?.data?.ErroredData || []).map((x, idx) => ({
            UTD: x?.UTD ?? x?.Excel_Row ?? idx + 1,
            ...x,
          }));
        } else if (response?.data?.File) {
          const parsed = parseResultExcelBase64(response.data.File);
          CorrectMapped = parsed.imported;
          ErroredMapped = parsed.nonImported;
        }

        setErroredData(ErroredMapped);
        setCorrectData(CorrectMapped);
        setTabledata(ErroredMapped?.length ? ErroredMapped : CorrectMapped);

        showSideAlert(response?.data?.Message || "Import completed", "success");
      }

      setisLoadingonpage(false);
    } catch (error) {
      setisLoadingonpage(false);
      console.error("Import error:", error);
      showSideAlert(error?.response?.data?.Message || "Invalid Request", "error");
    }
  };

  const handleChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const extension = file.name.split(".").pop().toLowerCase();
      if (extension === "xlsx" || extension === "xls") {
        setFile(file);
      } else {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        showSideAlert("Please select a valid Excel file (.xlsx or .xls)", "error");
      }
    }
  };

  const abcd = () => {};

  const handleErrorDataClick = () => setTabledata(erroredData);
  const handleCorrectDataClick = () => setTabledata(correctData);

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* ===== HEADER ===== */}
      <div className="col-span-12">
        <div className="rounded-t bg-header dark:bg-black px-2 md:px-6 py-2 border dark:border-borderColor-dark">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex">
              <h1 className="font-bold sm:text-sm md:text-lg lg:text-xl text-white dark:text-[#37a9dd] flex items-center gap-x-3 uppercase">
                <Image
                  src="/Payrollicon/Excel_Import.png"
                  alt="Autovyn"
                  width={25}
                  height={25}
                />
                INSURANCE RENEWAL Excel Import
              </h1>
            </div>
            <div className="flex justify-between gap-x-2">
              <Button variant={"save"} onClick={showdata}>
                Download Sample
              </Button>
              <Button variant={"print"} onClick={() => window.history.back()}>
                Back
              </Button>
            </div>
          </div>
        </div>

        {/* ===== FILE INPUT ===== */}
        <div className="mt-3 gap-2 md:gap-3 rounded-b p-2 md:p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow">
          <div className="flex gap-4 items-center">
            <input
              type="file"
              className="pt-1.5 border border-borderColor dark:border-borderColor-dark 
                lg:w-1/4 md:w-1/2 flex h-9 w-full rounded-md dark:bg-input bg-white 
                px-3 py-1 text-sm shadow-sm transition-colors file:border-0 
                file:bg-transparent file:text-sm file:font-medium 
                placeholder:text-slate-500 focus-visible:outline-none 
                focus-visible:ring-1 focus-visible:ring-slate-950 
                disabled:cursor-not-allowed disabled:opacity-50 
                dark:border-slate-800 dark:placeholder:text-slate-400 
                dark:focus-visible:ring-slate-300"
              accept=".xlsx, .xls"
              onChange={handleChange}
              ref={fileInputRef}
            />
            <Button variant={"save"} onClick={handleButtonClick}>
              Import
            </Button>

            {/* ✅ Show selected file name */}
            {excelfile && (
              <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                📄 {excelfile.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ===== SUMMARY BAR ===== */}
      <div className="col-span-12">
        <div
          className="mt-0 gap-2 md:gap-3 rounded-b p-2 md:p-4 bg-white dark:bg-black 
          border border-borderColor dark:border-borderColor-dark shadow flex flex-wrap 
          items-center gap-4 font-bold"
        >
          <div className="text-save">
            Imported Rows :- {correctData?.length}
          </div>
          <div className="text-exit">
            Non-Imported Rows :- {erroredData?.length}
          </div>

          <Button
            variant="outline"
            className="ml-4"
            onClick={handleCorrectDataClick}
          >
            Imported Data
          </Button>
          <Button variant="outline" onClick={handleErrorDataClick}>
            Non-Imported Data
          </Button>
           
        </div>
        <div  className="mt-0 gap-2 md:gap-3 rounded-b p-2 md:p-4 bg-white dark:bg-black 
          border border-borderColor dark:border-borderColor-dark shadow flex flex-wrap 
          items-center gap-4 font-bold"><span>Note :</span><span className="text-exit">Please select date only in DD/MM/YYYY Format</span></div>
       
      </div>

      {/* ===== DATA TABLE ===== */}
      <div className="col-span-12 mt-0 items-center gap-0 md:gap-3 rounded-b p-2 md:p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow">
        <DataTable
          onRowDoubleClick={abcd}
          columns={columns1}
          selectValue="UTD"
          data={tabledata}
          height="350px"
          filterPosition="FilterData"
          numericFilterColumns={[]}
        />
      </div>

      <HashloaderComponent isLoading={isLoadingonpage} />
    </div>
  );
};

export default Approver2;