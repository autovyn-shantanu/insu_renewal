"use client";
import React, { useEffect, useState, useMemo } from "react";
import Ainput from "@/components/atoms/Input";
import Eselect from "@/components/atoms/Eselect";
import AButton from "@/components/atoms/Buttton";
import DataTable from "@/components/Templates/reactTable";
import axios from "axios";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import { useDateRange } from "@/app/hooks/use-date-range";
import { useToast } from "@/components/ui/use-toast";
import HashloaderComponent from "@/components/Templates/hashloader";
import { onlybranch } from "@/action/branch";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const DocumentApprovalReportPage = () => {
    const user = useCurrentUser();
    const { toast } = useToast();
    const [globalDateRange] = useDateRange();

    const [isLoading, setIsLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [branchList, setBranchList] = useState([]);

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

    const [filters, setFilters] = useState({
        DateFrom: globalDateRange?.from || getCurrentDate(1),
        DateTo: globalDateRange?.to || getCurrentDate(),
        branch: user?.branch ? String(user.branch) : "",
        status: "",
        empcode: "",
    });

    const statusOptions = [
        { value: "", label: "All Status" },
        { value: "2", label: "Pending" },
        { value: "1", label: "Approved" },
        { value: "0", label: "Rejected" },
    ];

    const formatDocType = (type: any) => {
        if (!type) return "-";
        const map: Record<string, string> = {
            adhar: "Aadhaar Card",
            pan: "PAN Card",
            salaryslip: "Salary Slip",
            profileimage: "Profile Image",
            faceimage: "Face Embedding Image",
            otherdocument: "Other Document",
            others: "Other Document",
        };
        return map[String(type).toLowerCase()] || String(type).toUpperCase();
    };

    const formatDate = (dateString: any) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const getFileUrl = (docPath: any) => {
        if (!docPath) return "";
        const str = String(docPath).trim();
        if (str.startsWith("http://") || str.startsWith("https://")) {
            return str;
        }
        const cleanPath = str.startsWith("/") ? str.substring(1) : str;
        const fileBaseUrl =
            process.env.Next_Public_File || process.env.NEXT_PUBLIC_FILE_URL || "https://erp.autovyn.com/backend";
        return `${fileBaseUrl}/fetch?filePath=${cleanPath}`;
    };

    const handleFilterChange = (name: string, value: any) => {
        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const fetchBranches = async () => {
        if (!user) return;
        try {
            const userBranchCode = user?.branch ? String(user.branch) : "";
            const response = await onlybranch(user);
            if (response?.data && Array.isArray(response.data)) {
                const formatted = response.data.map((b: any) => ({
                    value: String(b.Code ?? b.value),
                    label: `${b.Code ?? b.value} - ${b.Name ?? b.label}`,
                }));
                setBranchList(formatted);
                if (!filters.branch && formatted.length > 0) {
                    setFilters((prev) => ({ ...prev, branch: userBranchCode || formatted[0].value }));
                }
            } else if (userBranchCode) {
                const singleBranch = [{
                    value: userBranchCode,
                    label: user?.branchName ? `${userBranchCode} - ${user.branchName}` : userBranchCode,
                }];
                setBranchList(singleBranch);
                setFilters((prev) => ({ ...prev, branch: userBranchCode }));
            }
        } catch (error) {
            console.error("Error fetching branches:", error);
            if (user?.branch) {
                const bCode = String(user.branch);
                setBranchList([{
                    value: bCode,
                    label: user?.branchName ? `${bCode} - ${user.branchName}` : bCode,
                }]);
                setFilters((prev) => ({ ...prev, branch: bCode }));
            }
        }
    };

    useEffect(() => {
        if (user) {
            fetchBranches();
        }
    }, [user]);

    const fetchReportData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_URL}/Crm/DocApprovalReport`,
                {
                    params: {
                        DateFrom: filters.DateFrom,
                        DateTo: filters.DateTo,
                        branch: filters.branch,
                        status: filters.status,
                        empcode: filters.empcode,
                    },
                    headers: {
                        compcode: user?.Comp_Code,
                    },
                }
            );

            if (response.data?.Status || response.data?.status) {
                setReportData(response.data.Result || []);
            } else {
                setReportData([]);
            }
        } catch (error: any) {
            console.error("Error fetching DocApprovalReport:", error);
            toast({
                title: "Error fetching report",
                description: error.response?.data?.Message || "Failed to load document approval report",
                variant: "destructive",
            });
            setReportData([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchReportData();
        }
    }, [user]);

    const columns = useMemo(
        () => [
            {
                Header: "SR.No",
                accessor: "sr_no",
                Cell: ({ row }: any) => <span className="font-semibold">{row.index + 1}</span>,
            },
            { Header: "Emp Code", accessor: "Emp_Code" },
            { Header: "Employee Name", accessor: "Emp_Name" },
            { Header: "Designation", accessor: "Designation" },
            { Header: "Location / Branch", accessor: "Location_Name" },
            {
                Header: "Document Type",
                accessor: "Doc_Type",
                Cell: ({ value }: any) => (
                    <span className="font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 text-xs">
                        {formatDocType(value)}
                    </span>
                ),
            },
            { Header: "Document Name", accessor: "Doc_Name" },
            {
                Header: "View Document",
                accessor: "Doc_Path",
                Cell: ({ row }: any) => {
                    const docPath = row.original?.Doc_Path ? String(row.original.Doc_Path).trim() : "";
                    if (!docPath) return <span className="text-center block">-</span>;
                    const fileUrl = getFileUrl(docPath);
                    const isPdf = docPath.toLowerCase().endsWith(".pdf") || docPath.toLowerCase().includes(".pdf");
                    return (
                        <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary dark:text-sky-400 capitalize hover:underline cursor-pointer text-xs inline-flex items-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {isPdf ? "View PDF" : "View Image"}
                        </a>
                    );
                },
            },
            {
                Header: "Uploaded Date",
                accessor: "CREATED_AT",
                Cell: ({ value }: any) => formatDate(value),
            },
            { Header: "Uploaded By", accessor: "Created_By_Name" },
            {
                Header: "Approver 1",
                accessor: "apr1_name",
                Cell: ({ row }: any) => {
                    if (!row.original.apr1_name || row.original.apr1_name === "-") return <span className="text-center block">-</span>;
                    const stat = row.original.Appr_1_Stat;
                    const style =
                        stat == 1
                            ? { border: "1.5px solid #16a34a", color: "#16a34a", backgroundColor: "transparent" }
                            : stat == 0
                                ? { border: "1.5px solid #dc2626", color: "#dc2626", backgroundColor: "transparent" }
                                : { border: "1.5px solid #d97706", color: "#d97706", backgroundColor: "transparent" };
                    return (
                        <div style={style} className="p-1 rounded text-center text-xs font-bold">
                            {row.original.apr1_name}
                        </div>
                    );
                },
            },
            { Header: "Appr 1 Remark", accessor: "Appr_1_Rem" },
            {
                Header: "Appr 1 Date",
                accessor: "Appr_1_Date",
                Cell: ({ value }: any) => formatDate(value),
            },
            {
                Header: "Approver 2",
                accessor: "apr2_name",
                Cell: ({ row }: any) => {
                    if (!row.original.apr2_name || row.original.apr2_name === "-") return <span className="text-center block">-</span>;
                    const stat = row.original.Appr_2_Stat;
                    const style =
                        stat == 1
                            ? { border: "1.5px solid #16a34a", color: "#16a34a", backgroundColor: "transparent" }
                            : stat == 0
                                ? { border: "1.5px solid #dc2626", color: "#dc2626", backgroundColor: "transparent" }
                                : { border: "1.5px solid #d97706", color: "#d97706", backgroundColor: "transparent" };
                    return (
                        <div style={style} className="p-1 rounded text-center text-xs font-bold">
                            {row.original.apr2_name}
                        </div>
                    );
                },
            },
            { Header: "Appr 2 Remark", accessor: "Appr_2_Rem" },
            {
                Header: "Appr 2 Date",
                accessor: "Appr_2_Date",
                Cell: ({ value }: any) => formatDate(value),
            },
            {
                Header: "Approver 3",
                accessor: "apr3_name",
                Cell: ({ row }: any) => {
                    if (!row.original.apr3_name || row.original.apr3_name === "-") return <span className="text-center block">-</span>;
                    const stat = row.original.Appr_3_Stat;
                    const style =
                        stat == 1
                            ? { border: "1.5px solid #16a34a", color: "#16a34a", backgroundColor: "transparent" }
                            : stat == 0
                                ? { border: "1.5px solid #dc2626", color: "#dc2626", backgroundColor: "transparent" }
                                : { border: "1.5px solid #d97706", color: "#d97706", backgroundColor: "transparent" };
                    return (
                        <div style={style} className="p-1 rounded text-center text-xs font-bold">
                            {row.original.apr3_name}
                        </div>
                    );
                },
            },
            { Header: "Appr 3 Remark", accessor: "Appr_3_Rem" },
            {
                Header: "Appr 3 Date",
                accessor: "Appr_3_Date",
                Cell: ({ value }: any) => formatDate(value),
            },
            {
                Header: "Final Status",
                accessor: "Overall_Status",
                Cell: ({ row }: any) => {
                    const status = row.original.Overall_Status || (row.original.Fin_Appr == 1 ? "APPROVED" : row.original.Fin_Appr == 0 ? "REJECTED" : "PENDING");
                    const style =
                        status === "APPROVED" || row.original.Fin_Appr == 1
                            ? { border: "1.5px solid #16a34a", color: "#16a34a", backgroundColor: "transparent" }
                            : status === "REJECTED" || row.original.Fin_Appr == 0
                                ? { border: "1.5px solid #dc2626", color: "#dc2626", backgroundColor: "transparent" }
                                : { border: "1.5px solid #d97706", color: "#d97706", backgroundColor: "transparent" };
                    return (
                        <span style={style} className="px-2.5 py-1 rounded text-xs font-bold inline-block">
                            {status}
                        </span>
                    );
                },
            },
        ],
        []
    );

    return (
        <div className="p-2 sm:p-4 space-y-4">
            {/* Header Banner */}
            <div className="rounded-t bg-header dark:bg-black px-4 sm:px-6 py-3 border dark:border-borderColor-dark shadow">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <h1 className="font-bold text-sm sm:text-base md:text-lg text-white dark:text-[#37a9dd] flex items-center gap-x-2 sm:gap-x-3 uppercase">
                        <FileText size={22} className="text-white shrink-0" />
                        <span>DOCUMENT APPROVAL TRACKING REPORT</span>
                    </h1>
                    <Button variant="print" onClick={() => window.history.back()} className="h-8 px-3 text-xs sm:text-sm">
                        Back
                    </Button>
                </div>
            </div>

            {/* Filter Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 p-3 sm:p-4 bg-white dark:bg-black border border-[#b5bfcb] dark:border-[#D0D5DD] rounded shadow">
                <div className="col-span-1 sm:col-span-1 md:col-span-2">
                    <Ainput
                        title="DATE FROM"
                        type="date"
                        name="DateFrom"
                        value={filters.DateFrom}
                        handleInputChange={handleFilterChange}
                    />
                </div>

                <div className="col-span-1 sm:col-span-1 md:col-span-2">
                    <Ainput
                        title="DATE TO"
                        type="date"
                        name="DateTo"
                        value={filters.DateTo}
                        handleInputChange={handleFilterChange}
                    />
                </div>

                <div className="col-span-1 sm:col-span-2 md:col-span-3">
                    <Eselect
                        title="Branch"
                        name="branch"
                        option={branchList}
                        handleInputChange={handleFilterChange}
                        initialValue={filters.branch}
                    />
                </div>

                <div className="col-span-1 sm:col-span-1 md:col-span-2">
                    <Eselect
                        title="Status"
                        name="status"
                        option={statusOptions}
                        handleInputChange={handleFilterChange}
                        initialValue={filters.status}
                    />
                </div>

                <div className="col-span-1 sm:col-span-1 md:col-span-2">
                    <Ainput
                        title="Emp Code / Name"
                        type="text"
                        name="empcode"
                        value={filters.empcode}
                        handleInputChange={handleFilterChange}
                    />
                </div>

                <div className="col-span-1 sm:col-span-2 md:col-span-1 flex items-end">
                    <Button
                        onClick={fetchReportData}
                        variant={"save"}
                        className="w-full h-9 font-bold text-xs sm:text-sm"
                    >
                        Show
                    </Button>
                </div>
            </div>

            {/* Table Section */}
            <div className="p-2 sm:p-4 bg-white dark:bg-black border border-[#b5bfcb] dark:border-[#D0D5DD] rounded shadow">
                <DataTable
                    columns={columns}
                    data={reportData}
                    title="Employee Document Approval Report"
                    height="500px"
                    selectValue="UTD"
                    filterPosition="FilterData"
                    enableColumnFilters={true}
                    onRowDoubleClick={(row: any) => {
                        const docPath = row?.Doc_Path ? String(row.Doc_Path).trim() : "";
                        if (docPath) {
                            window.open(getFileUrl(docPath), "_blank");
                        }
                    }}
                />
            </div>

            <HashloaderComponent isLoading={isLoading} />
        </div>
    );
};

export default DocumentApprovalReportPage;
