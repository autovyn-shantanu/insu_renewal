"use client";
import React, { useEffect, useState } from "react";
import SelectSearch from "@/components/atoms/Select";
import { Button } from "@/components/ui/button";
import ServiceTabel from "@/components/Templates/servicetable";
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

  function getCurrentDate(monthsBack = 0) {
    const today = new Date();
    today.setMonth(today.getMonth() - monthsBack);
    const year = today.getFullYear();
    let month = today.getMonth() + 1;
    let day = today.getDate();
    if (month < 10) month = "0" + month;
    if (day < 10) day = "0" + day;
    return `${year}-${month}-${day}`;
  }

  const [dates, setDates] = useState({
    DATE_FROM: globalDateRange?.from || getCurrentDate(),
    DATE_TO: globalDateRange?.to || getCurrentDate(-1),
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

    const currentReportType = parseInt(reportType);

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
        { headers: {
           compcode: user?.Comp_Code
           } }
      );

      const { DATE_FROM, DATE_TO } = res.data?.result || {};

      if (DATE_FROM && DATE_TO) {
        setDates((prev) => ({
          ...prev,
          DATE_FROM,
          DATE_TO,
        }));
      } else {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setDates((prev) => ({
          ...prev,
          DATE_FROM: firstDay.toISOString().split("T")[0],
          DATE_TO: lastDay.toISOString().split("T")[0],
        }));
      }
    } catch (error) {
      console.error("Date range API failed", error);
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setDates((prev) => ({
        ...prev,
        DATE_FROM: firstDay.toISOString().split("T")[0],
        DATE_TO: lastDay.toISOString().split("T")[0],
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
      };

      const apiUrl = `${process.env.NEXT_PUBLIC_URL}/excel/attendance`;

      const response = await axios.post(apiUrl, payload, {
        headers: {
          compcode: user?.Comp_Code,
          name: user?.name,
          loc_code:user?.branch
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

  const showdata = async (pageNum = 1, pageLimit = 10) => {
    setIsClicked(true);

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
      };

      const apiUrl =
        reportType === 1
          ? `${process.env.NEXT_PUBLIC_URL}/excel/od`
          : `${process.env.NEXT_PUBLIC_URL}/excel/attendance`;

      console.log(`📤 Sending request for page ${pageNum}, limit ${pageLimit}`);
      console.log(`📍 API URL:`, apiUrl);

      const response = await axios.post(apiUrl, payload, {
        headers: {
          compcode: user?.Comp_Code,
          name: user?.name,
          loc_code:user?.branch
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

      const dataWithSrNo = resultData.map((item, index) => ({
        ...item,
        srno: (currentPage - 1) * pageSize + index + 1,
      }));

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
    console.log(`🔄 Changing to page: ${newPage}`);
    showdata(newPage, pagination.pageSize);
  };

  const handlePageSizeChange = (newPageSize) => {
    console.log(`🔄 Changing page size to: ${newPageSize}`);
    showdata(1, newPageSize);
  };

  const fetchApproverList = async (pageNum = 1, pageLimit = 10) => {
    try {
      setIsClicked(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_URL}/approval/approverList`,
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
            loc_code: user?.branch
          },
          params: {
            page: pageNum,
            pageSize: pageLimit,
            compcode: user?.Comp_Code,
          },
        }
      );

      const approverList = response?.data?.data || [];
      const totalRecords = response?.data?.pagination?.totalRecords || 0;
      const totalPages = response?.data?.pagination?.totalPages || 0;
      const currentPage = response?.data?.pagination?.currentPage || pageNum;
      const pageSize = response?.data?.pagination?.pageSize || pageLimit;

      setApprData(approverList);
      setApprPagination({
        currentPage: currentPage,
        pageSize: pageSize,
        totalPages: totalPages,
        totalRecords: totalRecords,
      });
    } catch (error) {
      console.error("Error fetching approver list:", error);
      toast({
        title: "Failed to fetch approver list",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setIsClicked(false);
    }
  };

  const handleApproverPageChange = (newPage) => {
    console.log(`🔄 Changing approver list to page: ${newPage}`);
    fetchApproverList(newPage, apprPagination.pageSize);
  };

  const handleApproverPageSizeChange = (newPageSize) => {
    console.log(`🔄 Changing approver list page size to: ${newPageSize}`);
    fetchApproverList(1, newPageSize);
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
        <div className="col-span-12 rounded-t bg-header dark:bg-black px-2 md:px-6 py-2 border dark:border-borderColor-dark">
          <div className="flex justify-between">
            <h1 className="font-bold sm:text-sm md:text-lg lg:text-xl text-white dark:text-[#37a9dd] flex items-center gap-x-3 uppercase">
              {reportType === 1 ? "MIS-PUNCH APPROVER REPORT" : "ATTENDANCE REPORT"}
            </h1>
            <div className="flex gap-2 mr-2">
              {reportType === 1 && (
                <Button 
                  variant="update" 
                  onClick={() => {
                    setIsModalVisible1(true);
                    fetchApproverList(1, 10);
                  }}
                >
                  <ListChecks size={18} />
                </Button>
              )}
              <Button variant="print" onClick={() => window.history.back()}>
                Back
              </Button>
            </div>
          </div>
        </div>

        {/* ===== FILTERS ===== */}
        <div
          className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 mt-2 rounded-b p-2 md:p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow"
          id="pdfContent"
        >
          <div className="md:col-span-2">
            <SelectSearch
              title="Report Type"
              options={ReportType}
              name="reportType"
              handleInputChange={(name, value) => handleReportTypeChange(value)}
              selectedValue={reportType?.toString()}
            />
          </div>

          <div className="md:col-span-2">
            <Ainput
              title="DATE FROM"
              type="date"
              name="DATE_FROM"
              value={dates.DATE_FROM}
              handleInputChange={handleDateChange}
            />
          </div>

          <div className="md:col-span-2">
            <Ainput
              title="DATE TO"
              type="date"
              name="DATE_TO"
              value={dates.DATE_TO}
              handleInputChange={handleDateChange}
            />
          </div>

          {reportType === 1 && (
            <div className="md:col-span-2">
              <SelectSearch
                title="Status"
                options={Status}
                name="status"
                handleInputChange={handleDateChange}
                selectedValue={dates.status?.toString()}
              />
            </div>
          )}

          <div className="md:col-span-2 mt-6">
            <Button onClick={() => showdata(1, pagination.pageSize)} variant={"save"}>
              Show
            </Button>
          </div>
        </div>

        {/* ===== DATA TABLE (USING SERVICETABEL) ===== */}
        <div className="md:col-span-3"></div>
        <div className="md:col-span-12 gap-2 md:gap-3 mt-2 rounded-b p-2 md:p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow">
          <ServiceTabel
            columns={reportType === 1 ? approvalColumns : attendanceColumns}
            data={filtereddata}
            selectValue="srno"
            height="370px"
            onRowDoubleClick={doubleclicked}
            ischeckbox={false}
            enableColumnFilters={true}
            filterPosition="header"
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
        </div>

        <HashloaderComponent isLoading={isClicked} />
      </div>

      {/* ================= DIALOG - MIS PUNCH DETAIL ON DOUBLE CLICK (APPROVAL REPORT ONLY) ================= */}
      {reportType === 1 && isDialogOpen && Object.keys(MissPunchData).length > 0 && (
        <div className="col-span-12 mt-2 items-center">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="w-full max-w-screen-xl lg:h-[620px] md:h-[620px] p-5">
              <DialogHeader>
                <DialogTitle>Mis-Punch Request Details</DialogTitle>
                <hr className="bg-body-color" />
              </DialogHeader>
              <DialogDescription>
                <div
                  className="grid grid-cols-12 gap-2"
                  style={{ maxHeight: "560px", overflowY: "scroll" }}
                >
                  <div className="col-span-12 font-bold text-blue-700">
                    Employee Information
                  </div>

                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Employee Code
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["Employee Code"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Employee Name
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["Employee Name"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Date Of Joining
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {formatDate(MissPunchData["Date Of Joining"])}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Mobile No.
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["Mobile No."]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Company
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["Company"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Designation
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["Designation"]}
                    </span>
                  </div>

                  <hr className="col-span-12 my-2" />

                  <div className="col-span-12 font-bold text-blue-700">
                    Organizational Details
                  </div>

                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Channel
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["Channel"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Cluster
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["Cluster"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Branch
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["Branch"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Section
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["Section"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Department
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["Department"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Region
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["Region"]}
                    </span>
                  </div>

                  <hr className="col-span-12 my-2" />

                  <div className="col-span-12 font-bold text-blue-700">
                    Mis-Punch Details
                  </div>

                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Start From
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {formatDateTime(MissPunchData["Start From"])}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      End From
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {formatDateTime(MissPunchData["End From"])}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      OD Type
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["OD Type"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Shift Start Time
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["Shift Start Time"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Shift End Time
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["Shift End Time"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Attn. Status
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["ATTN. STATUS"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Mispunch IN Applied On
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {formatDateTime(MissPunchData["Mispunch IN Applied On"])}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Mispunch OUT Applied On
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {formatDateTime(
                        MissPunchData["Mispunch OUT Applied On"]
                      )}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Mispunch Entered By
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["Mispunch Enter By"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Applied Type
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["Applied Type"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Total Days
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["Total_OD_Days"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Mis-Punch Status
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span
                      className={`w-2/3 text-left font-semibold ${
                        MissPunchData["OD Status"] === "Final Acceptance"
                          ? "text-green-600"
                          : MissPunchData["OD Status"] === "Rejected"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {MissPunchData["OD Status"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Employee Remark
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["Employee  Remark"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Employee SPL Remark
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["Employee SPL Remark"]}
                    </span>
                  </div>

                  <div className="col-span-12 mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="font-semibold mb-1">Mispunch In Image</span>
                        {MissPunchData.fileIn ? (
                          <img
                            src={MissPunchData.fileIn}
                            alt="Mispunch In"
                            className="w-full max-h-[200px] object-contain border rounded"
                          />
                        ) : (
                          <span className="text-gray-500 text-sm italic">No Image Available</span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold mb-1">Mispunch Out Image</span>
                        {MissPunchData.fileOut ? (
                          <img
                            src={MissPunchData.fileOut}
                            alt="Mispunch Out"
                            className="w-full max-h-[200px] object-contain border rounded"
                          />
                        ) : (
                          <span className="text-gray-500 text-sm italic">No Image Available</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <hr className="col-span-12 my-2" />

                  <div className="col-span-12 font-bold text-blue-700">
                    Approver 1 Details
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Emp Code
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["Approver 1 Emp code"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">Name</span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["Approver 1 Name"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Action Status
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span
                      className={`w-2/3 text-left font-semibold ${
                        MissPunchData["Approver 1 Action Status"] ===
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
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Remarks
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["Approver 1 Remarks"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Action Taken On
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {formatDate(MissPunchData["Approver 1 Action Taken on"])}
                    </span>
                  </div>

                  <hr className="col-span-12 my-2" />

                  <div className="col-span-12 font-bold text-blue-700">
                    Approver 2 Details
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Emp Code
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["Approver 2 Emp code"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">Name</span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["Approver 2 Name"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Action Status
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span
                      className={`w-2/3 text-left font-semibold ${
                        MissPunchData["Approver 2 Action Status"] ===
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
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Remarks
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["Approver 2 Remarks"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Action Taken On
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {formatDate(MissPunchData["Approver 2 Action Taken on"])}
                    </span>
                  </div>

                  <hr className="col-span-12 my-2" />

                  <div className="col-span-12 font-bold text-blue-700">
                    Approver 3 Details
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Emp Code
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["Approver 3 Emp code"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">Name</span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["Approver 3 Name"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Action Status
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span
                      className={`w-2/3 text-left font-semibold ${
                        MissPunchData["Approver 3 Action Status"] ===
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
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Remarks
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {MissPunchData["Approver 3 Remarks"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Action Taken On
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {formatDate(MissPunchData["Approver 3 Action Taken on"])}
                    </span>
                  </div>
                </div>
              </DialogDescription>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* ================= DIALOG - ATTENDANCE DETAIL ON DOUBLE CLICK (ATTENDANCE REPORT ONLY) ================= */}
      {reportType === 2 && isDialogOpen && Object.keys(attendanceDetailData).length > 0 && (
        <div className="col-span-12 mt-2 items-center">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="w-full max-w-screen-xl lg:h-[90vh] md:h-[90vh] p-5 overflow-hidden flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>Attendance Details</DialogTitle>
                <hr className="bg-body-color" />
              </DialogHeader>

              <div className="flex-1 overflow-y-auto pr-4 flex flex-col">
                <div className="grid grid-cols-12 gap-3 flex-shrink-0">
                  <div className="col-span-12 font-bold text-blue-700 text-lg">
                    Employee Information
                  </div>

                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Employee Code
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left font-medium">
                      {attendanceDetailData?.Empcode?.trim()}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Employee Name
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left font-medium">
                      {attendanceDetailData?.EmployeeName?.trim()}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Joining Date
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left font-medium">
                      {formatDate(attendanceDetailData?.JoiningDate)}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Designation
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left font-medium">
                      {attendanceDetailData?.Designation}
                    </span>
                  </div>

                  <hr className="col-span-12 my-2" />

                  <div className="col-span-12 font-bold text-blue-700 text-lg">
                    Organizational Details
                  </div>

                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Region
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left font-medium">
                      {attendanceDetailData?.Region}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Channel
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left font-medium">
                      {attendanceDetailData?.Channel}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Cluster
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left font-medium">
                      {attendanceDetailData?.Cluster}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Location
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left font-medium">
                      {attendanceDetailData?.Location}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Section
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left font-medium">
                      {attendanceDetailData?.Section}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Department
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left font-medium">
                      {attendanceDetailData?.Department || "N/A"}
                    </span>
                  </div>

                  <hr className="col-span-12 my-2" />

                  <div className="col-span-12 font-bold text-blue-700 text-lg">
                    Attendance Summary
                  </div>

                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Paid Days
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left text-green-600 font-bold text-lg">
                      {dailyLoading ? "..." : paidDaysCount}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Total Penalty Days
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left text-red-600 font-bold text-lg">
                      {dailyLoading ? "..." : penaltyDaysCount}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Total Days in Period
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left font-medium">
                      {dailyLoading ? "..." : totalDaysCount}
                    </span>
                  </div>

                  <hr className="col-span-12 my-3" />

                  <div className="col-span-12 font-bold text-blue-700 text-lg mb-3">
                    📅 Daily Attendance Records (Page {dailyPagination.currentPage} of {dailyPagination.totalPages})
                  </div>
                </div>

                {dailyLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
                      Loading daily attendance records...
                    </div>
                  </div>
                ) : dailyAttendanceRows.length > 0 ? (
                  <div className="flex-1 overflow-y-auto">
                    <div className="space-y-4 pr-4">
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
                            className={`${statusColor} rounded-lg p-4 shadow-sm hover:shadow-md transition`}
                          >
                            <div className="grid grid-cols-12 gap-3">
                              <div className="col-span-12 font-bold text-lg text-gray-800 mb-2">
                                📆 {item.AttendanceDate}
                              </div>

                              <div className="col-span-12 xl:col-span-4 md:col-span-4 flex flex-col">
                                <span className="text-sm font-semibold text-gray-600 mb-1">
                                  Status
                                </span>
                                <span
                                  className={`font-bold text-lg px-3 py-1 rounded w-fit ${statusBgColor}`}
                                >
                                  {statusValue}
                                </span>
                              </div>

                              <div className="col-span-12 xl:col-span-4 md:col-span-4 flex flex-col">
                                <span className="text-sm font-semibold text-gray-600 mb-1">
                                  In Time
                                </span>
                                <span className="font-medium text-gray-800">
                                  {inTime && inTime !== "00:00:00"
                                    ? inTime
                                    : "—"}
                                </span>
                              </div>

                              <div className="col-span-12 xl:col-span-4 md:col-span-4 flex flex-col">
                                <span className="text-sm font-semibold text-gray-600 mb-1">
                                  Out Time
                                </span>
                                <span className="font-medium text-gray-800">
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
                                    <div className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                      📸 Punch Images
                                    </div>
                                  </div>

                                  {inImage ? (
                                    <div className="col-span-12 xl:col-span-6 md:col-span-6 flex flex-col">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded">
                                          ✓ IN
                                        </span>
                                        <span className="text-sm font-semibold text-gray-700">
                                          In Punch Image
                                        </span>
                                      </div>
                                      <img
                                        src={inImage}
                                        alt={`In Punch ${item.AttendanceDate}`}
                                        className="w-full h-56 object-cover border-2 border-green-300 rounded-lg hover:border-green-500 transition cursor-pointer shadow-md"
                                        onError={(e) => {
                                          e.target.src =
                                            "https://via.placeholder.com/300x250?text=Image+Not+Found";
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div className="col-span-12 xl:col-span-6 md:col-span-6 flex flex-col">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-bold bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                          ⊗ IN
                                        </span>
                                        <span className="text-sm font-semibold text-gray-700">
                                          In Punch Image
                                        </span>
                                      </div>
                                      <div className="w-full h-56 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                        <span className="text-gray-500 text-center">
                                          No In Punch Image
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {outImage ? (
                                    <div className="col-span-12 xl:col-span-6 md:col-span-6 flex flex-col">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-bold bg-red-100 text-red-800 px-2 py-1 rounded">
                                          ✓ OUT
                                        </span>
                                        <span className="text-sm font-semibold text-gray-700">
                                          Out Punch Image
                                        </span>
                                      </div>
                                      <img
                                        src={outImage}
                                        alt={`Out Punch ${item.AttendanceDate}`}
                                        className="w-full h-56 object-cover border-2 border-red-300 rounded-lg hover:border-red-500 transition cursor-pointer shadow-md"
                                        onError={(e) => {
                                          e.target.src =
                                            "https://via.placeholder.com/300x250?text=Image+Not+Found";
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div className="col-span-12 xl:col-span-6 md:col-span-6 flex flex-col">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-bold bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                          ⊗ OUT
                                        </span>
                                        <span className="text-sm font-semibold text-gray-700">
                                          Out Punch Image
                                        </span>
                                      </div>
                                      <div className="w-full h-56 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                        <span className="text-gray-500 text-center">
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
                                    <p className="text-sm text-yellow-800 font-medium">
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
                      <p className="text-lg">
                        📭 No daily attendance records available
                      </p>
                    </div>
                  </div>
                )}

                {/* ✅ DAILY ATTENDANCE PAGINATION */}
                {dailyAttendanceRows.length > 0 && (
                  <div className="flex-shrink-0 border-t p-3 bg-gray-50 flex items-center justify-between flex-wrap gap-2 mt-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-semibold text-gray-700">
                        Records per page:
                      </label>
                      <select
                        value={dailyPagination.pageSize}
                        onChange={(e) => handleDailyPageSizeChange(parseInt(e.target.value))}
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDailyPageChange(1)}
                        disabled={dailyPagination.currentPage === 1}
                        className="px-2 py-1 text-xs"
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDailyPageChange(dailyPagination.currentPage - 1)}
                        disabled={dailyPagination.currentPage === 1}
                        className="px-2 py-1 text-xs"
                      >
                        Previous
                      </Button>

                      <div className="text-sm font-semibold text-gray-700">
                        Page {dailyPagination.currentPage} / {dailyPagination.totalPages}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDailyPageChange(dailyPagination.currentPage + 1)}
                        disabled={dailyPagination.currentPage === dailyPagination.totalPages}
                        className="px-2 py-1 text-xs"
                      >
                        Next
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDailyPageChange(dailyPagination.totalPages)}
                        disabled={dailyPagination.currentPage === dailyPagination.totalPages}
                        className="px-2 py-1 text-xs"
                      >
                        Last
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* ================= APPROVER LIST DIALOG WITH PAGINATION (APPROVAL REPORT ONLY) ================= */}
      {reportType === 1 && (
        <Dialog open={isModalVisible1} onOpenChange={setIsModalVisible1}>
          <DialogContent className="w-full max-w-4xl lg:h-[600px] md:h-[600px] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Approver List</DialogTitle>
              <DialogDescription>
                Page {apprPagination.currentPage} of {apprPagination.totalPages} | Total Records: {apprPagination.totalRecords}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto">
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

            {apprData.length > 0 && (
              <div className="flex-shrink-0 border-t p-3 bg-gray-50 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Records per page:
                  </label>
                  <select
                    value={apprPagination.pageSize}
                    onChange={(e) => handleApproverPageSizeChange(parseInt(e.target.value))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApproverPageChange(1)}
                    disabled={apprPagination.currentPage === 1}
                    className="px-2 py-1 text-xs"
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApproverPageChange(apprPagination.currentPage - 1)}
                    disabled={apprPagination.currentPage === 1}
                    className="px-2 py-1 text-xs"
                  >
                    Previous
                  </Button>

                  <div className="text-sm font-semibold text-gray-700">
                    Page {apprPagination.currentPage} / {apprPagination.totalPages}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApproverPageChange(apprPagination.currentPage + 1)}
                    disabled={apprPagination.currentPage === apprPagination.totalPages}
                    className="px-2 py-1 text-xs"
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApproverPageChange(apprPagination.totalPages)}
                    disabled={apprPagination.currentPage === apprPagination.totalPages}
                    className="px-2 py-1 text-xs"
                  >
                    Last
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Approver2;