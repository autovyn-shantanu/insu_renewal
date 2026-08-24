"use client";
import React, { useEffect, useState } from "react";
import SelectSearch from "@/components/atoms/Select";
import { Button } from "@/components/ui/button";
import DataTable from "./_approverTable";
import axios from "axios";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import { FaUsers } from "react-icons/fa";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import HashloaderComponent from "@/components/Templates/hashloader";
import MediumTitle from "@/components/atoms/MediumTitle";
import Image from 'next/image';
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

const AttendanceReport = ({ back }) => {
  const [filtereddata, setFiltereddata] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const user = useCurrentUser();
  const { toast } = useToast();
  const Router = useRouter();
  const [attendanceData, setAttendanceData] = useState({});
  const [globalDateRange] = useDateRange();

  const Status = [
    { value: "P", label: "Present" },
    { value: "A", label: "Absent" },
    { value: "WO", label: "Weekly Off" },
    { value: "L", label: "Leave" },
    { value: "H", label: "Holiday" },
  ];

  const [tabledata, setTabledata] = useState([]);

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

  // ================= COLUMNS FOR PIVOT ATTENDANCE REPORT =================
  const columns1 = [
    { Header: "SR NO", accessor: "srno" },
    { Header: "Employee Code", accessor: "Empcode" },
    { Header: "Employee Name", accessor: "EmployeeName" },
    { Header: "Designation", accessor: "Designation" },
    { Header: "Department", accessor: "Department" },
    { Header: "Section", accessor: "Section" },
    { Header: "Location", accessor: "Location" },
    { Header: "Region", accessor: "Region" },
    { Header: "Channel", accessor: "Channel" },
    { Header: "Cluster", accessor: "Cluster" },
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
    status: "P",
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
    setDates((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // ================= DOUBLE CLICK => SHOW ALL ATTENDANCE DETAILS =================
  const doubleclicked = (rowData) => {
    setAttendanceData({});
    setIsDialogOpen(true);
    console.log(rowData, "rowData");
    setAttendanceData(rowData);
  };

  const FetchgetDateRange = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_URL}/ars/getDateRange`,
        { headers: { compcode: user?.Comp_Code } }
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

  // ================= FETCH ATTENDANCE DATA FROM BACKEND =================
  const showdata = async () => {
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
        user_location: user?.location || 1,
        LeftEmp: 1,
      };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/excel/attendance`,
        payload,
        {
          headers: {
            compcode: user?.Comp_Code,
            name: user?.name,
          },
          params: {
            compcode: user?.Comp_Code,
          },
        }
      );

      const resultData = response?.data?.data || [];

      // Add serial number to each row
      const dataWithSrNo = resultData.map((item, index) => ({
        ...item,
        srno: index + 1,
      }));

      setTabledata(dataWithSrNo);
      setFiltereddata(dataWithSrNo);

      toast({
        title: `Data fetched successfully - ${dataWithSrNo.length} records found`,
        variant: "default",
      });
    } catch (err) {
      console.error("Attendance report error:", err);
      toast({
        title: "Failed to fetch report data",
        description: err?.response?.data?.message || err.message,
        variant: "destructive",
      });
    }

    setIsClicked(false);
  };

  return (
    <div>
      <div>
        {/* ===== HEADER ===== */}
        <div className="col-span-12 rounded-t bg-header dark:bg-black px-2 md:px-6 py-2 border dark:border-borderColor-dark">
          <div className="flex justify-between">
            <h1 className="font-bold sm:text-sm md:text-lg lg:text-xl text-white dark:text-[#37a9dd] flex items-center gap-x-3 uppercase">
              <Image
                src="/Payrollicon/Add_Attendance.png"
                alt="Autovyn"
                width={25}
                height={25}
              />
              ATTENDANCE PIVOT REPORT
            </h1>
            <div className="flex gap-2 mr-2">
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

          <div className="md:col-span-4"></div>
          
          <div className="md:col-span-2 mt-6">
            <Button onClick={showdata} variant={"save"}>
              Show Report
            </Button>
          </div>
        </div>

        {/* ===== DATA TABLE ===== */}
        <div className="md:col-span-12 gap-2 md:gap-3 mt-2 rounded-b p-2 md:p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow">
          <DataTable
            columns={columns1}
            check={check}
            selectValue="srno"
            data={filtereddata}
            setsellectedrowdata={setsellectedrowdata}
            height="370px"
            onRowDoubleClick={doubleclicked}
          />
        </div>

        <HashloaderComponent isLoading={isClicked} />
      </div>

      {/* ================= DIALOG - ATTENDANCE DETAIL ON DOUBLE CLICK ================= */}
      <div className="col-span-12 mt-2 items-center">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-full max-w-screen-xl lg:h-[700px] md:h-[700px] p-5">
            <DialogHeader>
              <DialogTitle>Attendance Details</DialogTitle>
              <hr className="bg-body-color" />
              <DialogDescription>
                <div
                  className="grid grid-cols-12 gap-2"
                  style={{ maxHeight: "620px", overflowY: "scroll" }}
                >
                  {/* ---------- Basic Employee Info ---------- */}
                  <div className="col-span-12 font-bold text-blue-700">
                    Employee Information
                  </div>

                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Employee Code
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {attendanceData["Empcode"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Employee Name
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {attendanceData["EmployeeName"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Date Of Joining
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {formatDate(attendanceData["JoiningDate"])}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Designation
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {attendanceData["Designation"]}
                    </span>
                  </div>

                  <hr className="col-span-12 my-2" />

                  {/* ---------- Organizational Info ---------- */}
                  <div className="col-span-12 font-bold text-blue-700">
                    Organizational Details
                  </div>

                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Channel
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {attendanceData["Channel"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Cluster
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {attendanceData["Cluster"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Location
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {attendanceData["Location"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Section
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {attendanceData["Section"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Department
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {attendanceData["Department"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Region
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {attendanceData["Region"]}
                    </span>
                  </div>

                  <hr className="col-span-12 my-2" />

                  {/* ---------- Attendance Summary ---------- */}
                  <div className="col-span-12 font-bold text-blue-700">
                    Attendance Summary
                  </div>

                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Paid Days
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {attendanceData["Paid Days"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Total Penalty Days
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {attendanceData["Total Penalty Days"]}
                    </span>
                  </div>
                  <div className="col-span-12 xl:col-span-6 md:col-span-6 flex">
                    <span className="w-1/3 text-left font-semibold">
                      Month Count
                    </span>
                    <span className="w-1/12 text-center">:</span>
                    <span className="w-2/3 text-left">
                      {attendanceData["MonthCount"]}
                    </span>
                  </div>

                  <hr className="col-span-12 my-2" />

                  {/* ---------- Daily Attendance Breakdown ---------- */}
                  <div className="col-span-12 font-bold text-blue-700">
                    Daily Attendance Breakdown
                  </div>

                  <div className="col-span-12">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2">Date</th>
                            <th className="border p-2">Status</th>
                            <th className="border p-2">In Time</th>
                            <th className="border p-2">Out Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Extract daily data from attendanceData - dates are stored as column names like "01-Jan", "01-Jan_in1", "01-Jan_out1" */}
                          {Object.keys(attendanceData)
                            .filter(
                              (key) =>
                                !key.includes("_in1") &&
                                !key.includes("_out1") &&
                                !["Empcode", "EmployeeName", "JoiningDate", "Region", "Channel", "Cluster", "Location", "Section", "Department", "Designation", "Paid Days", "Total Penalty Days", "MonthCount", "srno"].includes(key)
                            )
                            .map((key, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="border p-2">{key}</td>
                                <td className="border p-2 font-semibold">
                                  {attendanceData[key] || "-"}
                                </td>
                                <td className="border p-2">
                                  {attendanceData[`${key}_in1`] || "-"}
                                </td>
                                <td className="border p-2">
                                  {attendanceData[`${key}_out1`] || "-"}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <hr className="col-span-12 my-2" />

                  {/* ---------- Photo Evidence ---------- */}
                  <div className="col-span-12 font-bold text-blue-700">
                    Photo Evidence
                  </div>

                  <div className="col-span-12 mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="font-semibold mb-1">Check In Photo</span>
                        {attendanceData["In_Photo_URL"] ? (
                          <img
                            src={attendanceData["In_Photo_URL"]}
                            alt="Check In"
                            className="w-full max-h-[250px] object-contain border rounded"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="text-gray-500 text-sm italic">
                            No Image Available
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold mb-1">Check Out Photo</span>
                        {attendanceData["Out_Photo_URL"] ? (
                          <img
                            src={attendanceData["Out_Photo_URL"]}
                            alt="Check Out"
                            className="w-full max-h-[250px] object-contain border rounded"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="text-gray-500 text-sm italic">
                            No Image Available
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AttendanceReport;