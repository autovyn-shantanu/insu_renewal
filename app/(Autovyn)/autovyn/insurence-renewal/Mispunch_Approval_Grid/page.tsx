"use client";
import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import SelectSearch from "@/components/atoms/Select";
import { Button } from "@/components/ui/button";
import ServiceTabel from "@/components/Templates/Servicetable";
import axios from "axios";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import { FaUsers } from "react-icons/fa";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import HashloaderComponent from "@/components/Templates/hashloader";
import MediumTitle from "@/components/atoms/MediumTitle";
import { ListChecks } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog2";
import Ainput from "@/components/atoms/Input";
import { useDateRange } from "@/app/hooks/use-date-range";

const Approver2 = ({ back }) => {
  const [filtereddata, setFiltereddata] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const user = useCurrentUser();
  const { toast } = useToast();
  const Router = useRouter();
  const [MissPunchData, setMissPunchData] = useState({});
  const [globalDateRange] = useDateRange();
  const [attendanceDetailData, setAttendanceDetailData] = useState({});
  const [dailyAttendanceRows, setDailyAttendanceRows] = useState([]);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyPagination, setDailyPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalPages: 0,
    totalRecords: 0,
  });

  const pageSizeRef = useRef(10);
  const isChangingPageSizeRef = useRef(false);
  const searchRef = useRef("");
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const debounceTimerRef = useRef<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchContainer, setSearchContainer] = useState<Element | null>(null);

  const Status = [
    { value: 1, label: "Pending" },
    { value: 2, label: "Approved" },
    { value: 3, label: "Reject" },
  ];

  const ReportType = [
    { value: 1, label: "Approval Report" },
    { value: 2, label: "Attendance Report" },
  ];

  const [tabledata, setTabledata] = useState([]);
  const [reportType, setReportType] = useState(1);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalPages: 0,
    totalRecords: 0,
  });

  const [apprPagination, setApprPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalPages: 0,
    totalRecords: 0,
  });

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  };

  const approvalColumns = [
    { Header: "SR NO", accessor: "srno" },
    { Header: "Employee Code", accessor: "Employee Code" },
    { Header: "Employee Name", accessor: "Employee Name" },
    { Header: "Designation", accessor: "Designation" },
    { Header: "Department", accessor: "Department" },
    { Header: "Section", accessor: "Section" },
    { Header: "Branch", accessor: "Branch" },
    { Header: "Region", accessor: "Region" },
    { Header: "Channel", accessor: "Channel" },
    { Header: "Cluster", accessor: "Cluster" },
    { Header: "OD Type", accessor: "OD Type" },
    {
      Header: "Start From",
      accessor: "Start From",
      Cell: ({ value }) => formatDateTime(value),
    },
    {
      Header: "End From",
      accessor: "End From",
      Cell: ({ value }) => formatDateTime(value),
    },
    { Header: "Applied Type", accessor: "Applied Type" },
    { Header: "Total OD Days", accessor: "Total_OD_Days" },
    {
      Header: "Mis Punch Status",
      accessor: "OD Status",
      Cell: ({ value }) => {
        let colorClass = "text-yellow-600";
        if (value === "Final Acceptance") colorClass = "text-green-600";
        if (value === "Rejected") colorClass = "text-red-600";
        return <span className={`font-semibold ${colorClass}`}>{value}</span>;
      },
    },
    { Header: "Approver 1 Name", accessor: "Approver 1 Name" },
    { Header: "Approver 1 Status", accessor: "Approver 1 Action Status" },
    { Header: "Approver 2 Name", accessor: "Approver 2 Name" },
    { Header: "Approver 2 Status", accessor: "Approver 2 Action Status" },
    { Header: "Approver 3 Name", accessor: "Approver 3 Name" },
    { Header: "Approver 3 Status", accessor: "Approver 3 Action Status" },
  ];

  const attendanceColumns = [
    { Header: "SR NO", accessor: "srno" },
    { Header: "Employee Code", accessor: "Empcode" },
    { Header: "Employee Name", accessor: "EmployeeName" },
    { Header: "Joining Date", accessor: "JoiningDate", Cell: ({ value }) => formatDate(value) },
    { Header: "Region", accessor: "Region" },
    { Header: "Channel", accessor: "Channel" },
    { Header: "Cluster", accessor: "Cluster" },
    { Header: "Location", accessor: "Location" },
    { Header: "Section", accessor: "Section" },
    { Header: "Department", accessor: "Department" },
    { Header: "Designation", accessor: "Designation" },
    { Header: "Paid Days", accessor: "Paid Days" },
    { Header: "Total Penalty Days", accessor: "Total Penalty Days" },
    { Header: "Month Count", accessor: "MonthCount" },
  ];

  const formatLocalYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const getMonthDateRange = (dateObj = new Date()) => {
    const y = dateObj.getFullYear();
    const m = dateObj.getMonth();
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0); // Correctly gets last day (31st for 31-day months)
    const y1 = firstDay.getFullYear();
    const m1 = String(firstDay.getMonth() + 1).padStart(2, "0");
    const d1 = String(firstDay.getDate()).padStart(2, "0");
    const y2 = lastDay.getFullYear();
    const m2 = String(lastDay.getMonth() + 1).padStart(2, "0");
    const d2 = String(lastDay.getDate()).padStart(2, "0");
    return {
      firstDay: `${y1}-${m1}-${d1}`,
      lastDay: `${y2}-${m2}-${d2}`,
    };
  };

  const defaultMonthRange = getMonthDateRange();

  const [dates, setDates] = useState({
    DATE_FROM: defaultMonthRange.firstDay,
    DATE_TO: defaultMonthRange.lastDay,
    branch: user?.branch,
    status: 1,
  });

  const [selectedrowdata, setsellectedrowdata] = useState([]);
  const [check, setCheck] = useState(true);
  const [isModalVisible1, setIsModalVisible1] = useState(false);
  const [apprData, setApprData] = useState([]);
  const [detailedModal1, setDetailedModal1] = useState(false);
  const [model1, setModel1] = useState({});

  const handleSelectApprover = (item) => {
    setModel1(item);
    setIsModalVisible1(false);
    setDetailedModal1(true);
  };

  useEffect(() => {
    FetchgetDateRange();
  }, []);

  const handleDateChange = (name, value) => {
    if (name === "status") {
      if (reportType === 1) {
        setIsClicked(true);
        const filtered = filterByStatus(tabledata, value);
        setFiltereddata(filtered);
        setIsClicked(false);
      }
    }

    if (name === "DATE_FROM" && value) {
      const parts = value.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const lastDayObj = new Date(y, m, 0);
        const y2 = lastDayObj.getFullYear();
        const m2 = String(lastDayObj.getMonth() + 1).padStart(2, "0");
        const d2 = String(lastDayObj.getDate()).padStart(2, "0");
        setDates((prevData) => ({
          ...prevData,
          DATE_FROM: value,
          DATE_TO: `${y2}-${m2}-${d2}`,
        }));
        return;
      }
    }

    setDates((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleReportTypeChange = (value) => {
    const numValue = parseInt(value);
    console.log("Setting report type to:", numValue);
    setReportType(numValue);
    setTabledata([]);
    setFiltereddata([]);
    searchRef.current = "";
    setSearchTerm("");
    setIsDialogOpen(false);
    setDailyAttendanceRows([]);
    setDailyLoading(false);
    setMissPunchData({});
    setAttendanceDetailData({});
    setPagination({
      currentPage: 1,
      pageSize: 10,
      totalPages: 0,
      totalRecords: 0,
    });
  };

  const lastClickRef = useRef<{ time: number; id: any }>({ time: 0, id: null });
  const lastOpenedRef = useRef<number>(0);

  const triggerOpenDialog = (rowData: any) => {
    if (!rowData || Object.keys(rowData).length === 0) return;
    const now = Date.now();
    // Prevent duplicate rapid triggers within 400ms
    if (now - lastOpenedRef.current < 400) return;
    lastOpenedRef.current = now;
    doubleclicked(rowData);
  };

  const handleRowClick = (rowId: any, rowData: any) => {
    if (!rowData || Object.keys(rowData).length === 0) return;

    const now = Date.now();
    const isSameRow = String(lastClickRef.current.id) === String(rowId);
    const isDoubleTap = isSameRow && (now - lastClickRef.current.time < 500);

    lastClickRef.current = { time: now, id: rowId };

    if (isDoubleTap) {
      lastClickRef.current = { time: 0, id: null };
      triggerOpenDialog(rowData);
    }
  };

  const doubleclicked = (rowData) => {
    console.log("===== DOUBLE CLICK DEBUG =====");
    console.log("Row Data:", rowData);
    console.log("Report Type:", reportType);

    if (!rowData || Object.keys(rowData).length === 0) {
      console.error("❌ Row data is empty!");
      toast({
        title: "No data to display",
        variant: "destructive",
      });
      return;
    }

    const currentReportType = Number(reportType);

    if (currentReportType === 1) {
      console.log("✅ Opening Approval Report Dialog");
      setMissPunchData(rowData);
      setAttendanceDetailData({});
      setIsDialogOpen(true);
    } else if (currentReportType === 2) {
      console.log("✅ Opening Attendance Report Dialog");
      setAttendanceDetailData(rowData);
      setMissPunchData({});
      setDailyAttendanceRows([]);
      setDailyPagination({
        currentPage: 1,
        pageSize: 10,
        totalPages: 0,
        totalRecords: 0,
      });
      setIsDialogOpen(true);
      fetchEmployeeDailyAttendance(rowData?.Empcode, 1, 10);
    } else {
      console.error("❌ Invalid report type:", currentReportType);
    }
  };

  function filterByStatus(data, status) {
    const statusMap = {
      1: "Pending",
      2: "Final Acceptance",
      3: "Rejected",
    };
    const mappedStatus = statusMap[status];
    if (!mappedStatus) return data;
    return data.filter((item) => item["OD Status"] === mappedStatus);
  }

  const FetchgetDateRange = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_URL}/ars/getDateRange`,
        {
          headers: {
            compcode: user?.Comp_Code
          }
        }
      );

      const { DATE_FROM, DATE_TO } = res.data?.result || {};

      if (DATE_FROM && DATE_TO) {
        setDates((prev) => ({
          ...prev,
          DATE_FROM,
          DATE_TO,
        }));
      } else {
        const range = getMonthDateRange();
        setDates((prev) => ({
          ...prev,
          DATE_FROM: range.firstDay,
          DATE_TO: range.lastDay,
        }));
      }
    } catch (error) {
      console.error("Date range API failed", error);
      const range = getMonthDateRange();
      setDates((prev) => ({
        ...prev,
        DATE_FROM: range.firstDay,
        DATE_TO: range.lastDay,
      }));
    }
  };

  const fetchEmployeeDailyAttendance = async (emp, pageNum = 1, pageLimit = 10) => {
    if (!emp) {
      setDailyAttendanceRows([]);
      return;
    }

    setDailyLoading(true);
    try {
      const payload = {
        dateFrom: dates.DATE_FROM,
        dateto: dates.DATE_TO,
        region: "",
        channel: "",
        Cluster: "",
        location: "",
        section: "",
        department: "",
        designation: "",
        emptype: "",
        empcode: String(emp).trim(),
        reporttype: "attendance",
        LeftEmp: 1,
        page: pageNum,
        pageSize: pageLimit,
        loc_code: user?.branch,
      };

      const apiUrl = `${process.env.NEXT_PUBLIC_URL}/hrmsreport/attendance`;

      const response = await axios.post(apiUrl, payload, {
        headers: {
          compcode: user?.Comp_Code,
          name: user?.name,
        },
        params: { compcode: user?.Comp_Code },
      });

      const rows = response?.data?.data || [];
      const totalRecords = response?.data?.pagination?.totalRecords || 0;
      const totalPages = response?.data?.pagination?.totalPages || 0;
      const currentPage = response?.data?.pagination?.currentPage || pageNum;
      const pageSize = response?.data?.pagination?.pageSize || pageLimit;

      // ✅ Add serial number to each row based on page
      const dataWithSrNo = rows.map((item, index) => ({
        ...item,
        srno: (currentPage - 1) * pageSize + index + 1,
      }));

      // ✅ Sort by Attendance Date
      dataWithSrNo.sort((a, b) =>
        String(a.AttendanceDate).localeCompare(String(b.AttendanceDate))
      );

      setDailyAttendanceRows(dataWithSrNo);

      // ✅ Update daily pagination state
      setDailyPagination({
        currentPage: currentPage,
        pageSize: pageSize,
        totalPages: totalPages,
        totalRecords: totalRecords,
      });
    } catch (err) {
      console.error("❌ Daily attendance fetch failed:", err?.response?.data || err.message);
      setDailyAttendanceRows([]);
    } finally {
      setDailyLoading(false);
    }
  };

  const handleDailyPageChange = (newPage) => {
    console.log(`🔄 Changing daily attendance to page: ${newPage}`);
    fetchEmployeeDailyAttendance(attendanceDetailData?.Empcode, newPage, dailyPagination.pageSize);
  };

  const handleDailyPageSizeChange = (newPageSize) => {
    console.log(`🔄 Changing daily attendance page size to: ${newPageSize}`);
    fetchEmployeeDailyAttendance(attendanceDetailData?.Empcode, 1, newPageSize);
  };

  const showdata = async (
    pageNum = 1,
    pageLimit = 10,
    searchParam?: string,
    showLoader = true
  ) => {
    if (showLoader) {
      setIsClicked(true);
    }

    const activeSearch = searchParam !== undefined ? searchParam : searchRef.current;
    if (searchParam !== undefined) {
      searchRef.current = searchParam;
    }

    try {
      const payload = {
        dateFrom: dates.DATE_FROM,
        dateto: dates.DATE_TO,
        region: "",
        channel: "",
        Cluster: "",
        location: "",
        section: "",
        department: "",
        designation: "",
        emptype: "",
        empcode: "",
        reporttype: reportType === 1 ? "OD_report" : "attendance",
        LeftEmp: 1,
        page: pageNum,
        pageSize: pageLimit,
        limit: pageLimit,
        loc_code: user?.branch,
        search: activeSearch || "",
      };

      const apiUrl =
        reportType === 1
          ? `${process.env.NEXT_PUBLIC_URL}/hrmsreport/OD_report_With_Pic`
          : `${process.env.NEXT_PUBLIC_URL}/hrmsreport/attendance`;

      console.log(`📤 Sending request for page ${pageNum}, limit ${pageLimit}, search "${activeSearch || ""}"`);
      console.log(`📍 API URL:`, apiUrl);

      const response = await axios.post(apiUrl, payload, {
        headers: {
          compcode: user?.Comp_Code,
          name: user?.name,
        },
        params: {
          compcode: user?.Comp_Code,
        },
      });

      const resultData = response?.data?.data || [];
      const totalRecords = response?.data?.pagination?.totalRecords || 0;
      const totalPages = response?.data?.pagination?.totalPages || 0;
      const currentPage = response?.data?.pagination?.currentPage || pageNum;
      const pageSize = response?.data?.pagination?.pageSize || pageLimit;

      pageSizeRef.current = pageSize;

      const dataWithSrNo = resultData.map((item, index) => {
        const history = item.attendance_history || item.attendance || item.records || [];
        const paid = history.filter((h) =>
          ["P", "P2F", "PL", "CL", "SL", "H", "WO"].includes(
            String(h.Status).trim().toUpperCase()
          )
        ).length;
        const penalty = history.filter((h) =>
          ["A", "LWP"].includes(String(h.Status).trim().toUpperCase())
        ).length;
        const count = history.length;

        return {
          ...item,
          srno: (currentPage - 1) * pageSize + index + 1,
          "Paid Days": item["Paid Days"] !== undefined ? item["Paid Days"] : paid,
          "Total Penalty Days": item["Total Penalty Days"] !== undefined ? item["Total Penalty Days"] : penalty,
          MonthCount: item.MonthCount !== undefined ? item.MonthCount : (item["Month Count"] !== undefined ? item["Month Count"] : count),
          "Month Count": item["Month Count"] !== undefined ? item["Month Count"] : (item.MonthCount !== undefined ? item.MonthCount : count),
        };
      });

      setTabledata(dataWithSrNo);
      setFiltereddata(dataWithSrNo);

      setPagination({
        currentPage: currentPage,
        pageSize: pageSize,
        totalPages: totalPages,
        totalRecords: totalRecords,
      });

      toast({
        title: `Data loaded: ${resultData.length} records on page ${currentPage}`,
        variant: "default",
      });
    } catch (err) {
      console.error("❌ Report error:", err);
      toast({
        title: "Failed to fetch report data",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
      });
    }

    setIsClicked(false);
  };

  const handlePageChange = (newPage) => {
    if (isChangingPageSizeRef.current) {
      console.log(`⏸️ Skipping duplicate page change triggered by page size update`);
      return;
    }
    console.log(`🔄 Changing to page: ${newPage}`);
    showdata(newPage, pageSizeRef.current, searchRef.current);
  };

  const handlePageSizeChange = (newPageSize) => {
    console.log(`🔄 Changing page size to: ${newPageSize}`);
    isChangingPageSizeRef.current = true;
    pageSizeRef.current = newPageSize;
    showdata(1, newPageSize, searchRef.current).finally(() => {
      setTimeout(() => {
        isChangingPageSizeRef.current = false;
      }, 300);
    });
  };

  // ✅ Find the toolbar container inside ServiceTabel to place our custom search input
  useEffect(() => {
    if (tableContainerRef.current) {
      const origInput = tableContainerRef.current.querySelector(
        'input[placeholder="Search..."]:not([data-custom-search])'
      );
      if (origInput && origInput.parentElement) {
        setSearchContainer(origInput.parentElement);
      }
    }
  }, [searchContainer]);

  const handleCustomSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    searchRef.current = val;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      console.log("🔍 Global search triggered:", val);
      showdata(1, pageSizeRef.current || pagination.pageSize, val, true);
    }, 350);
  };

  // useEffect(() => {
  //   const container = tableContainerRef.current;
  //   if (!container) return;

  //   const handleClick = (e: Event) => {
  //     const target = e.target as HTMLElement;
  //     if (
  //       target &&
  //       (target.innerText === "Reset Filters" ||
  //         target.closest("button")?.innerText?.includes("Reset Filters"))
  //     ) {
  //       setSearchTerm("");
  //       searchRef.current = "";
  //       showdata(1, pageSizeRef.current || pagination.pageSize, "", true);
  //     }
  //   };

  //   container.addEventListener("click", handleClick);
  //   return () => container.removeEventListener("click", handleClick);
  // }, []);

  // const fetchApproverList = async (pageNum = 1, pageLimit = 10) => {
  //   try {
  //     setIsClicked(true);
  //     const response = await axios.get(
  //       `${process.env.NEXT_PUBLIC_URL}/approval/approverList`,
  //       {
  //         headers: {
  //           compcode: user?.Comp_Code,
  //           name: user?.name,
  //           loc_code: user?.branch
  //         },
  //         params: {
  //           page: pageNum,
  //           pageSize: pageLimit,
  //           compcode: user?.Comp_Code,
  //         },
  //       }
  //     );

  //     const approverList = response?.data?.data || [];
  //     const totalRecords = response?.data?.pagination?.totalRecords || 0;
  //     const totalPages = response?.data?.pagination?.totalPages || 0;
  //     const currentPage = response?.data?.pagination?.currentPage || pageNum;
  //     const pageSize = response?.data?.pagination?.pageSize || pageLimit;

  //     setApprData(approverList);
  //     setApprPagination({
  //       currentPage: currentPage,
  //       pageSize: pageSize,
  //       totalPages: totalPages,
  //       totalRecords: totalRecords,
  //     });
  //   } catch (error) {
  //     console.error("Error fetching approver list:", error);
  //     toast({
  //       title: "Failed to fetch approver list",
  //       description: error.response?.data?.message || error.message,
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsClicked(false);
  //   }
  // };

  const handleApproverPageChange = (newPage) => {
    console.log(`🔄 Changing approver list to page: ${newPage}`);
    // fetchApproverList(newPage, apprPagination.pageSize);
  };

  const handleApproverPageSizeChange = (newPageSize) => {
    console.log(`🔄 Changing approver list page size to: ${newPageSize}`);
    // fetchApproverList(1, newPageSize);
  };

  const paidDaysCount = dailyAttendanceRows.filter((r) =>
    ["P", "P2F", "PL", "CL", "SL", "H", "WO"].includes(String(r.Status).trim().toUpperCase())
  ).length;

  const penaltyDaysCount = dailyAttendanceRows.filter((r) =>
    ["A", "LWP"].includes(String(r.Status).trim().toUpperCase())
  ).length;

  const totalDaysCount = dailyAttendanceRows.length;

  return (
    <div>
      <div>
        {/* ===== HEADER ===== */}
        <div className="rounded-t bg-header dark:bg-black px-3 md:px-6 py-2.5 border dark:border-borderColor-dark">
          <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-2">
            <h1 className="font-bold text-sm sm:text-base md:text-lg lg:text-xl text-white dark:text-[#37a9dd] flex items-center gap-x-2 md:gap-x-3 uppercase">
              {reportType === 1 ? "MIS-PUNCH APPROVER REPORT" : "ATTENDANCE REPORT"}
            </h1>
            <div className="flex items-center gap-2 flex-shrink-0">
              {reportType === 1 && (
                <Button
                  variant="update"
                  onClick={() => {
                    setIsModalVisible1(true);
                  }}
                  className="px-3"
                >
                  <ListChecks size={18} />
                </Button>
              )}
              <Button variant="print" onClick={() => window.history.back()} className="px-3">
                Back
              </Button>
            </div>
          </div>
        </div>

        {/* ===== FILTERS ===== */}
        <div
          className="relative z-30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 md:gap-3 mt-2 rounded-b p-2 md:p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow [&_.react-datepicker-popper]:!z-[9999] [&_.react-datepicker]:!shadow-2xl"
          id="pdfContent"
        >
          <div className="col-span-1 sm:col-span-1 lg:col-span-2 relative z-10 focus-within:z-[9999]">
            <SelectSearch
              title="Report Type"
              options={ReportType}
              name="reportType"
              handleInputChange={(name, value) => handleReportTypeChange(value)}
              selectedValue={reportType?.toString()}
            />
          </div>

          <div className="col-span-1 sm:col-span-1 lg:col-span-2 relative z-10 has-[.react-datepicker-popper]:z-[9999] focus-within:z-[9999]">
            <Ainput
              title="DATE FROM"
              type="date"
              name="DATE_FROM"
              value={dates.DATE_FROM}
              handleInputChange={handleDateChange}
              popperClassName="!z-[9999]"
            />
          </div>

          <div className="col-span-1 sm:col-span-1 lg:col-span-2 relative z-10 has-[.react-datepicker-popper]:z-[9999] focus-within:z-[9999]">
            <Ainput
              title="DATE TO"
              type="date"
              name="DATE_TO"
              value={dates.DATE_TO}
              handleInputChange={handleDateChange}
              popperClassName="!z-[9999]"
            />
          </div>

          {reportType === 1 && (
            <div className="col-span-1 sm:col-span-1 lg:col-span-2 relative z-10 focus-within:z-[9999]">
              <SelectSearch
                title="Status"
                options={Status}
                name="status"
                handleInputChange={handleDateChange}
                selectedValue={dates.status?.toString()}
              />
            </div>
          )}

          <div className="col-span-1 sm:col-span-1 lg:col-span-2 flex items-end sm:mt-0 mt-2 relative z-0">
            <Button
              onClick={() => showdata(1, pageSizeRef.current || pagination.pageSize)}
              variant={"save"}
              className="w-full sm:w-auto"
            >
              Show
            </Button>
          </div>
        </div>

        {/* ===== DATA TABLE (USING SERVICETABEL) ===== */}
        <div
          ref={tableContainerRef}
          className="w-full mt-2 rounded-b p-2 md:p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow overflow-x-auto [&_input[placeholder='Search...']:not([data-custom-search])]:hidden"
        >
          <ServiceTabel
            columns={reportType === 1 ? approvalColumns : attendanceColumns}
            data={filtereddata}
            selectValue="srno"
            height="370px"
            onRowClick={handleRowClick}
            onRowDoubleClick={triggerOpenDialog}
            ischeckbox={false}
            enableColumnFilters={true}
            filterPosition="FilterData"
            columnsDownload={reportType === 1 ? approvalColumns : attendanceColumns}
            serverMode={true}
            serverPagination={{
              currentPage: pagination.currentPage,
              pageSize: pagination.pageSize,
              totalPages: pagination.totalPages,
              totalRecords: pagination.totalRecords,
              hasNextPage: pagination.currentPage < pagination.totalPages,
              hasPrevPage: pagination.currentPage > 1,
            }}
            onServerPageChange={handlePageChange}
            onServerPageSizeChange={handlePageSizeChange}
          />
          {searchContainer &&
            createPortal(
              <input
                data-custom-search="true"
                className="border border-borderColor dark:border-borderColor-dark h-[32px] px-2.5 w-full sm:w-52 text-black dark:text-white py-1 dark:bg-input rounded text-xs sm:text-sm shadow focus:outline-none focus:ring ease-linear transition-all duration-150"
                type="text"
                value={searchTerm}
                onChange={handleCustomSearchChange}
                placeholder="Search..."
              />,
              searchContainer
            )}
        </div>
      </div>

      {/* ================= DIALOG - MIS PUNCH DETAIL ON DOUBLE CLICK (APPROVAL REPORT ONLY) ================= */}
      {Number(reportType) === 1 && isDialogOpen && Object.keys(MissPunchData).length > 0 && (
        <div className="col-span-12 mt-2 items-center">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="w-[96vw] max-w-5xl h-[90vh] max-h-[750px] p-3 sm:p-5 overflow-hidden flex flex-col z-[9999]">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="text-base sm:text-lg">Mis-Punch Request Details</DialogTitle>
                <hr className="bg-body-color mt-2" />
              </DialogHeader>
              <div className="flex-1 min-h-0 overflow-y-auto pr-1 sm:pr-2">
                <div className="grid grid-cols-12 gap-2 text-xs sm:text-sm">
                  <div className="col-span-12 font-bold text-blue-700 text-sm sm:text-base">
                    Employee Information
                  </div>

                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Employee Code
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["Employee Code"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Employee Name
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["Employee Name"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Date Of Joining
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {formatDate(MissPunchData["Date Of Joining"])}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Mobile No.
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["Mobile No."]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Company
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["Company"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Designation
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["Designation"]}
                    </span>
                  </div>

                  <hr className="col-span-12 my-2" />

                  <div className="col-span-12 font-bold text-blue-700 text-sm sm:text-base">
                    Organizational Details
                  </div>

                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Channel
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["Channel"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Cluster
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["Cluster"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Branch
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["Branch"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Section
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["Section"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Department
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["Department"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Region
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["Region"]}
                    </span>
                  </div>

                  <hr className="col-span-12 my-2" />

                  <div className="col-span-12 font-bold text-blue-700 text-sm sm:text-base">
                    Mis-Punch Details
                  </div>

                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Start From
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {formatDateTime(MissPunchData["Start From"])}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      End From
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {formatDateTime(MissPunchData["End From"])}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      OD Type
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["OD Type"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Shift Start Time
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["Shift Start Time"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Shift End Time
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["Shift End Time"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Attn. Status
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["ATTN. STATUS"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Mispunch IN Applied On
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {formatDateTime(MissPunchData["Mispunch IN Applied On"])}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Mispunch OUT Applied On
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {formatDateTime(
                        MissPunchData["Mispunch OUT Applied On"]
                      )}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Mispunch Entered By
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["Mispunch Enter By"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Applied Type
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["Applied Type"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Total Days
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["Total_OD_Days"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Mis-Punch Status
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span
                      className={`flex-1 text-left font-semibold break-words ${MissPunchData["OD Status"] === "Final Acceptance"
                        ? "text-green-600"
                        : MissPunchData["OD Status"] === "Rejected"
                          ? "text-red-600"
                          : "text-yellow-600"
                        }`}
                    >
                      {MissPunchData["OD Status"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Employee Remark
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["Employee  Remark"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Employee SPL Remark
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["Employee SPL Remark"]}
                    </span>
                  </div>

                  <div className="col-span-12 mt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="font-semibold mb-1 text-xs sm:text-sm">Mispunch In Image</span>
                        {MissPunchData.fileIn ? (
                          <img
                            src={MissPunchData.fileIn}
                            alt="Mispunch In"
                            className="w-full max-h-[180px] sm:max-h-[220px] object-contain border rounded bg-gray-50"
                          />
                        ) : (
                          <span className="text-gray-500 text-xs sm:text-sm italic">No Image Available</span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold mb-1 text-xs sm:text-sm">Mispunch Out Image</span>
                        {MissPunchData.fileOut ? (
                          <img
                            src={MissPunchData.fileOut}
                            alt="Mispunch Out"
                            className="w-full max-h-[180px] sm:max-h-[220px] object-contain border rounded bg-gray-50"
                          />
                        ) : (
                          <span className="text-gray-500 text-xs sm:text-sm italic">No Image Available</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <hr className="col-span-12 my-2" />

                  <div className="col-span-12 font-bold text-blue-700 text-sm sm:text-base">
                    Approver 1 Details
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Emp Code
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["Approver 1 Emp code"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">Name</span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["Approver 1 Name"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Action Status
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span
                      className={`flex-1 text-left font-semibold break-words ${MissPunchData["Approver 1 Action Status"] ===
                        "Final Acceptance"
                        ? "text-green-600"
                        : MissPunchData["Approver 1 Action Status"] ===
                          "Rejected"
                          ? "text-red-600"
                          : "text-yellow-600"
                        }`}
                    >
                      {MissPunchData["Approver 1 Action Status"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Remarks
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["Approver 1 Remarks"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Action Taken On
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {formatDate(MissPunchData["Approver 1 Action Taken on"])}
                    </span>
                  </div>

                  <hr className="col-span-12 my-2" />

                  <div className="col-span-12 font-bold text-blue-700 text-sm sm:text-base">
                    Approver 2 Details
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Emp Code
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["Approver 2 Emp code"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">Name</span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["Approver 2 Name"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Action Status
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span
                      className={`flex-1 text-left font-semibold break-words ${MissPunchData["Approver 2 Action Status"] ===
                        "Final Acceptance"
                        ? "text-green-600"
                        : MissPunchData["Approver 2 Action Status"] ===
                          "Rejected"
                          ? "text-red-600"
                          : "text-yellow-600"
                        }`}
                    >
                      {MissPunchData["Approver 2 Action Status"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Remarks
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["Approver 2 Remarks"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Action Taken On
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {formatDate(MissPunchData["Approver 2 Action Taken on"])}
                    </span>
                  </div>

                  <hr className="col-span-12 my-2" />

                  <div className="col-span-12 font-bold text-blue-700 text-sm sm:text-base">
                    Approver 3 Details
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Emp Code
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["Approver 3 Emp code"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">Name</span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["Approver 3 Name"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Action Status
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span
                      className={`flex-1 text-left font-semibold break-words ${MissPunchData["Approver 3 Action Status"] ===
                        "Final Acceptance"
                        ? "text-green-600"
                        : MissPunchData["Approver 3 Action Status"] ===
                          "Rejected"
                          ? "text-red-600"
                          : "text-yellow-600"
                        }`}
                    >
                      {MissPunchData["Approver 3 Action Status"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Remarks
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {MissPunchData["Approver 3 Remarks"]}
                    </span>
                  </div>
                  <div className="col-span-12 md:col-span-6 flex items-start">
                    <span className="w-5/12 sm:w-4/12 text-left font-semibold flex-shrink-0">
                      Action Taken On
                    </span>
                    <span className="w-4 text-center flex-shrink-0">:</span>
                    <span className="flex-1 text-left break-words">
                      {formatDate(MissPunchData["Approver 3 Action Taken on"])}
                    </span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* ================= DIALOG - ATTENDANCE DETAIL ON DOUBLE CLICK (ATTENDANCE REPORT ONLY) ================= */}
      {Number(reportType) === 2 && isDialogOpen && Object.keys(attendanceDetailData).length > 0 && (
        <div className="col-span-12 mt-2 items-center">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="w-[96vw] max-w-7xl 2xl:max-w-screen-2xl h-[92vh] max-h-[92vh] p-3 sm:p-5 overflow-hidden flex flex-col z-[9999]">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="text-base sm:text-lg">Attendance Details</DialogTitle>
                <hr className="bg-body-color mt-2" />
              </DialogHeader>

              {/* Two Column Layout: Left (Employee Information) | Right (Daily Attendance Records) */}
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col md:flex-row gap-4 lg:gap-5 pt-2 sm:pt-3">
                {/* Left Column: Employee Information, Organizational Details & Attendance Summary */}
                <div className="w-full md:w-[360px] lg:w-[400px] max-h-[36vh] md:max-h-none flex-shrink-0 overflow-y-auto pr-2 sm:pr-3 pb-3 md:pb-0 md:border-r border-b md:border-b-0 border-gray-200 flex flex-col gap-3">
                  <div>
                    <div className="font-bold text-blue-700 text-base sm:text-lg mb-2">
                      Employee Information
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex items-start text-xs sm:text-sm">
                        <span className="w-5/12 text-left font-semibold flex-shrink-0">
                          Employee Code
                        </span>
                        <span className="w-4 text-center flex-shrink-0">:</span>
                        <span className="flex-1 text-left font-medium break-words">
                          {attendanceDetailData?.Empcode?.trim()}
                        </span>
                      </div>
                      <div className="flex items-start text-xs sm:text-sm">
                        <span className="w-5/12 text-left font-semibold flex-shrink-0">
                          Employee Name
                        </span>
                        <span className="w-4 text-center flex-shrink-0">:</span>
                        <span className="flex-1 text-left font-medium break-words">
                          {attendanceDetailData?.EmployeeName?.trim()}
                        </span>
                      </div>
                      <div className="flex items-start text-xs sm:text-sm">
                        <span className="w-5/12 text-left font-semibold flex-shrink-0">
                          Joining Date
                        </span>
                        <span className="w-4 text-center flex-shrink-0">:</span>
                        <span className="flex-1 text-left font-medium break-words">
                          {formatDate(attendanceDetailData?.JoiningDate)}
                        </span>
                      </div>
                      <div className="flex items-start text-xs sm:text-sm">
                        <span className="w-5/12 text-left font-semibold flex-shrink-0">
                          Designation
                        </span>
                        <span className="w-4 text-center flex-shrink-0">:</span>
                        <span className="flex-1 text-left font-medium break-words">
                          {attendanceDetailData?.Designation}
                        </span>
                      </div>
                    </div>
                  </div>

                  <hr className="my-1" />

                  <div>
                    <div className="font-bold text-blue-700 text-base sm:text-lg mb-2">
                      Organizational Details
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex items-start text-xs sm:text-sm">
                        <span className="w-5/12 text-left font-semibold flex-shrink-0">
                          Region
                        </span>
                        <span className="w-4 text-center flex-shrink-0">:</span>
                        <span className="flex-1 text-left font-medium break-words">
                          {attendanceDetailData?.Region}
                        </span>
                      </div>
                      <div className="flex items-start text-xs sm:text-sm">
                        <span className="w-5/12 text-left font-semibold flex-shrink-0">
                          Channel
                        </span>
                        <span className="w-4 text-center flex-shrink-0">:</span>
                        <span className="flex-1 text-left font-medium break-words">
                          {attendanceDetailData?.Channel}
                        </span>
                      </div>
                      <div className="flex items-start text-xs sm:text-sm">
                        <span className="w-5/12 text-left font-semibold flex-shrink-0">
                          Cluster
                        </span>
                        <span className="w-4 text-center flex-shrink-0">:</span>
                        <span className="flex-1 text-left font-medium break-words">
                          {attendanceDetailData?.Cluster}
                        </span>
                      </div>
                      <div className="flex items-start text-xs sm:text-sm">
                        <span className="w-5/12 text-left font-semibold flex-shrink-0">
                          Location
                        </span>
                        <span className="w-4 text-center flex-shrink-0">:</span>
                        <span className="flex-1 text-left font-medium break-words">
                          {attendanceDetailData?.Location}
                        </span>
                      </div>
                      <div className="flex items-start text-xs sm:text-sm">
                        <span className="w-5/12 text-left font-semibold flex-shrink-0">
                          Section
                        </span>
                        <span className="w-4 text-center flex-shrink-0">:</span>
                        <span className="flex-1 text-left font-medium break-words">
                          {attendanceDetailData?.Section}
                        </span>
                      </div>
                      <div className="flex items-start text-xs sm:text-sm">
                        <span className="w-5/12 text-left font-semibold flex-shrink-0">
                          Department
                        </span>
                        <span className="w-4 text-center flex-shrink-0">:</span>
                        <span className="flex-1 text-left font-medium break-words">
                          {attendanceDetailData?.Department || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <hr className="my-1" />

                  <div>
                    <div className="font-bold text-blue-700 text-base sm:text-lg mb-2">
                      Attendance Summary
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex items-center text-xs sm:text-sm">
                        <span className="w-5/12 text-left font-semibold flex-shrink-0">
                          Paid Days
                        </span>
                        <span className="w-4 text-center flex-shrink-0">:</span>
                        <span className="flex-1 text-left text-green-600 font-bold text-base sm:text-lg">
                          {attendanceDetailData?.["Paid Days"] !== undefined
                            ? attendanceDetailData["Paid Days"]
                            : (dailyLoading ? "..." : paidDaysCount)}
                        </span>
                      </div>
                      <div className="flex items-center text-xs sm:text-sm">
                        <span className="w-5/12 text-left font-semibold flex-shrink-0">
                          Total Penalty Days
                        </span>
                        <span className="w-4 text-center flex-shrink-0">:</span>
                        <span className="flex-1 text-left text-red-600 font-bold text-base sm:text-lg">
                          {attendanceDetailData?.["Total Penalty Days"] !== undefined
                            ? attendanceDetailData["Total Penalty Days"]
                            : (dailyLoading ? "..." : penaltyDaysCount)}
                        </span>
                      </div>
                      <div className="flex items-center text-xs sm:text-sm">
                        <span className="w-5/12 text-left font-semibold flex-shrink-0">
                          Total Days in Period
                        </span>
                        <span className="w-4 text-center flex-shrink-0">:</span>
                        <span className="flex-1 text-left font-medium">
                          {attendanceDetailData?.["MonthCount"] !== undefined
                            ? attendanceDetailData["MonthCount"]
                            : (attendanceDetailData?.["Month Count"] !== undefined
                              ? attendanceDetailData["Month Count"]
                              : (dailyLoading ? "..." : totalDaysCount))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Daily Attendance Records */}
                <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden pl-0 md:pl-2">
                  <div className="font-bold text-blue-700 text-base sm:text-lg mb-2 sm:mb-3 flex-shrink-0">
                    📅 Daily Attendance Records (Page {dailyPagination.currentPage} of {dailyPagination.totalPages})
                  </div>

                  {dailyLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
                        Loading daily attendance records...
                      </div>
                    </div>
                  ) : dailyAttendanceRows.length > 0 ? (
                    <div className="flex-1 min-h-0 overflow-y-auto pr-1 sm:pr-2">
                      <div className="space-y-3 sm:space-y-4">
                        {dailyAttendanceRows.map((item, index) => {
                          const statusValue = item.Status?.trim() || "N/A";
                          const inTime = item.InTime;
                          const outTime = item.OutTime;

                          const inImage =
                            item.InPhotoUrl ||
                            (item.InPhoto
                              ? `https://erp.autovyn.com/backend/fetch?filePath=${item.InPhoto}`
                              : "");
                          const outImage =
                            item.OutPhotoUrl ||
                            (item.OutPhoto
                              ? `https://erp.autovyn.com/backend/fetch?filePath=${item.OutPhoto}`
                              : "");

                          let statusColor = "bg-gray-50 border-l-4 border-gray-400";
                          let statusBgColor = "bg-gray-200 text-gray-800";

                          if (statusValue === "P" || statusValue.startsWith("P")) {
                            statusColor = "bg-green-50 border-l-4 border-green-500";
                            statusBgColor = "bg-green-200 text-green-800";
                          } else if (statusValue === "A") {
                            statusColor = "bg-red-50 border-l-4 border-red-500";
                            statusBgColor = "bg-red-200 text-red-800";
                          } else if (statusValue === "H") {
                            statusColor = "bg-blue-50 border-l-4 border-blue-500";
                            statusBgColor = "bg-blue-200 text-blue-800";
                          } else if (statusValue === "WO") {
                            statusColor = "bg-yellow-50 border-l-4 border-yellow-500";
                            statusBgColor = "bg-yellow-200 text-yellow-800";
                          } else if (statusValue === "LWP") {
                            statusColor = "bg-purple-50 border-l-4 border-purple-500";
                            statusBgColor = "bg-purple-200 text-purple-800";
                          }

                          return (
                            <div
                              key={index}
                              className={`${statusColor} rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition`}
                            >
                              <div className="grid grid-cols-12 gap-2 sm:gap-3">
                                <div className="col-span-12 font-bold text-base sm:text-lg text-gray-800 mb-1 sm:mb-2">
                                  📆 {item.AttendanceDate}
                                </div>

                                <div className="col-span-4 flex flex-col">
                                  <span className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">
                                    Status
                                  </span>
                                  <span
                                    className={`font-bold text-sm sm:text-base px-2.5 py-0.5 rounded w-fit ${statusBgColor}`}
                                  >
                                    {statusValue}
                                  </span>
                                </div>

                                <div className="col-span-4 flex flex-col">
                                  <span className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">
                                    In Time
                                  </span>
                                  <span className="font-medium text-xs sm:text-sm text-gray-800 break-words">
                                    {inTime && inTime !== "00:00:00"
                                      ? inTime
                                      : "—"}
                                  </span>
                                </div>

                                <div className="col-span-4 flex flex-col">
                                  <span className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">
                                    Out Time
                                  </span>
                                  <span className="font-medium text-xs sm:text-sm text-gray-800 break-words">
                                    {outTime && outTime !== "00:00:00"
                                      ? outTime
                                      : "—"}
                                  </span>
                                </div>

                                {(inImage || outImage) && (
                                  <>
                                    <div className="col-span-12">
                                      <hr className="border-gray-300 my-2" />
                                    </div>
                                    <div className="col-span-12">
                                      <div className="text-xs sm:text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        📸 Punch Images
                                      </div>
                                    </div>

                                    {inImage ? (
                                      <div className="col-span-12 sm:col-span-6 flex flex-col">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                            ✓ IN
                                          </span>
                                          <span className="text-xs sm:text-sm font-semibold text-gray-700">
                                            In Punch Image
                                          </span>
                                        </div>
                                        <img
                                          src={inImage}
                                          alt={`In Punch ${item.AttendanceDate}`}
                                          className="w-full h-40 sm:h-48 md:h-56 object-cover border-2 border-green-300 rounded-lg hover:border-green-500 transition cursor-pointer shadow-md"
                                          onError={(e) => {
                                            e.target.src =
                                              "https://via.placeholder.com/300x250?text=Image+Not+Found";
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <div className="col-span-12 sm:col-span-6 flex flex-col">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-xs font-bold bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                                            ⊗ IN
                                          </span>
                                          <span className="text-xs sm:text-sm font-semibold text-gray-700">
                                            In Punch Image
                                          </span>
                                        </div>
                                        <div className="w-full h-40 sm:h-48 md:h-56 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                          <span className="text-gray-500 text-xs sm:text-sm text-center">
                                            No In Punch Image
                                          </span>
                                        </div>
                                      </div>
                                    )}

                                    {outImage ? (
                                      <div className="col-span-12 sm:col-span-6 flex flex-col">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-xs font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded">
                                            ✓ OUT
                                          </span>
                                          <span className="text-xs sm:text-sm font-semibold text-gray-700">
                                            Out Punch Image
                                          </span>
                                        </div>
                                        <img
                                          src={outImage}
                                          alt={`Out Punch ${item.AttendanceDate}`}
                                          className="w-full h-40 sm:h-48 md:h-56 object-cover border-2 border-red-300 rounded-lg hover:border-red-500 transition cursor-pointer shadow-md"
                                          onError={(e) => {
                                            e.target.src =
                                              "https://via.placeholder.com/300x250?text=Image+Not+Found";
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <div className="col-span-12 sm:col-span-6 flex flex-col">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-xs font-bold bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                                            ⊗ OUT
                                          </span>
                                          <span className="text-xs sm:text-sm font-semibold text-gray-700">
                                            Out Punch Image
                                          </span>
                                        </div>
                                        <div className="w-full h-40 sm:h-48 md:h-56 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                          <span className="text-gray-500 text-xs sm:text-sm text-center">
                                            No Out Punch Image
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}

                                {!inImage && !outImage && (
                                  <div className="col-span-12">
                                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                                      <p className="text-xs sm:text-sm text-yellow-800 font-medium">
                                        ⚠️ No punch images available for this date
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
                        <p className="text-base sm:text-lg">
                          📭 No daily attendance records available
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* ================= APPROVER LIST DIALOG WITH PAGINATION (APPROVAL REPORT ONLY) ================= */}
      {reportType === 1 && (
        <Dialog open={isModalVisible1} onOpenChange={setIsModalVisible1}>
          <DialogContent className="w-[95vw] max-w-4xl h-[85vh] max-h-[600px] p-3 sm:p-6 overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-base sm:text-lg">Approver List</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Page {apprPagination.currentPage} of {apprPagination.totalPages} | Total Records: {apprPagination.totalRecords}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
              {apprData.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                  No Approver Found
                </div>
              ) : (
                <>
                  <div className="hidden md:block">
                    <table className="w-full border">
                      <thead className="sticky top-0 bg-gray-100">
                        <tr>
                          <th className="p-2 border text-sm font-semibold">SR NO</th>
                          <th className="p-2 border text-sm font-semibold">Approver 1A</th>
                          <th className="p-2 border text-sm font-semibold">Approver 1B</th>
                          <th className="p-2 border text-sm font-semibold">Approver 2A</th>
                          <th className="p-2 border text-sm font-semibold">Approver 2B</th>
                          <th className="p-2 border text-sm font-semibold">Approver 3A</th>
                          <th className="p-2 border text-sm font-semibold">Approver 3B</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apprData.map((item, index) => (
                          <tr
                            key={index}
                            className="hover:bg-blue-50 cursor-pointer border-b"
                            onClick={() => handleSelectApprover(item)}
                          >
                            <td className="border p-2 text-sm text-center">
                              {(apprPagination.currentPage - 1) * apprPagination.pageSize + index + 1}
                            </td>
                            <td className="border p-2 text-sm capitalize">
                              {item.approver1_A || "-"}
                            </td>
                            <td className="border p-2 text-sm capitalize">
                              {item.approver1_B || "-"}
                            </td>
                            <td className="border p-2 text-sm capitalize">
                              {item.approver2_A || "-"}
                            </td>
                            <td className="border p-2 text-sm capitalize">
                              {item.approver2_B || "-"}
                            </td>
                            <td className="border p-2 text-sm capitalize">
                              {item.approver3_A || "-"}
                            </td>
                            <td className="border p-2 text-sm capitalize">
                              {item.approver3_B || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden space-y-3 p-2">
                    {apprData.map((item, index) => (
                      <div
                        key={index}
                        className="border p-3 rounded-lg shadow-sm bg-white cursor-pointer hover:shadow-md transition"
                        onClick={() => handleSelectApprover(item)}
                      >
                        <div className="text-xs font-bold text-gray-600 mb-2">
                          SR NO: {(apprPagination.currentPage - 1) * apprPagination.pageSize + index + 1}
                        </div>
                        <div className="grid grid-cols-2 gap-y-2 text-xs">
                          <span className="font-semibold text-gray-600">
                            Approver 1A:
                          </span>
                          <span>{item.approver1_A || "-"}</span>
                          <span className="font-semibold text-gray-600">
                            Approver 1B:
                          </span>
                          <span>{item.approver1_B || "-"}</span>
                          <span className="font-semibold text-gray-600">
                            Approver 2A:
                          </span>
                          <span>{item.approver2_A || "-"}</span>
                          <span className="font-semibold text-gray-600">
                            Approver 2B:
                          </span>
                          <span>{item.approver2_B || "-"}</span>
                          <span className="font-semibold text-gray-600">
                            Approver 3A:
                          </span>
                          <span>{item.approver3_A || "-"}</span>
                          <span className="font-semibold text-gray-600">
                            Approver 3B:
                          </span>
                          <span>{item.approver3_B || "-"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      {isClicked && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/20 backdrop-blur-sm pointer-events-auto [&>div]:!bg-transparent [&>div]:!z-[99999]">
          <HashloaderComponent isLoading={true} />
        </div>
      )}
    </div>
  );
};

export default Approver2;