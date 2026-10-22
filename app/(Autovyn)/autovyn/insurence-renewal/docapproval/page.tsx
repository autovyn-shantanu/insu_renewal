"use client";
import React, { useEffect, useState } from "react";
import Ainput from "@/components/atoms/Input";
import SelectSearch from "@/components/atoms/Select";
import { Button } from "@/components/ui/button";
import DataTable from "./_approverTable";
import axios from "axios";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import Swal from "sweetalert2";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import HashloaderComponent from "@/components/Templates/hashloader";
import Image from "next/image";
import { ListChecks, Eye, FileText, Download, ExternalLink } from "lucide-react";
import { useDateRange } from "@/app/hooks/use-date-range";
import { onlybranch } from "@/action/branch";
import FileViewer from "@/components/atoms/Fileviewer";

const DocumentApproval = () => {
    const [filtereddata, setFiltereddata] = useState([]);
    const [remark, setRemark] = useState(null);
    const [isClicked, setIsClicked] = useState(false);
    const user = useCurrentUser();
    const { toast } = useToast();
    const [globalDateRange] = useDateRange();

    // Modal States
    const [isModalVisible1, setIsModalVisible1] = useState(false);
    const [apprData, setApprData] = useState([]);

    const [tabledata, setTabledata] = useState([]);
    const [selectedrowdata, setsellectedrowdata] = useState([]);
    const [branch, setBranch] = useState([]);
    const [check, setCheck] = useState(true);

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
        DATE_FROM: globalDateRange?.from || getCurrentDate(1),
        DATE_TO: globalDateRange?.to || getCurrentDate(),
        branch: user?.branch,
        status: 2, // 2: Pending, 1: Approved, 0: Rejected
    });

    const Status = [
        { value: 2, label: "Pending" },
        { value: 1, label: "Approved" },
        { value: 0, label: "Reject" },
    ];

    const formatDocType = (type) => {
        if (!type) return "-";
        const map = {
            adhar: "Aadhaar Card",
            pan: "PAN Card",
            salaryslip: "Salary Slip",
            profileimage: "Profile Image",
            faceimage: "Face Embedding Image",
            otherdocument: "Other Document",
            others: "Other Document",
        };
        return map[type.toLowerCase()] || type.toUpperCase();
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
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
            process.env.Next_Public_File || "https://erp.autovyn.com/backend";
        return `${fileBaseUrl}/fetch?filePath=${cleanPath}`;
    };

    const columns1 = [
        {
            Header: "SR.No",
            accessor: "sr_no",
            Cell: ({ row }: any) => <span className="font-semibold">{row.index + 1}</span>,
        },
        { Header: "Emp Code", accessor: "Emp_Code" },
        { Header: "Employee Name", accessor: "Emp_Name" },
        { Header: "Designation", accessor: "Designation" },
        { Header: "Location", accessor: "Location_Name" },
        {
            Header: "Document Type",
            accessor: "Doc_Type",
            Cell: ({ value }) => (
                <span className="font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    {formatDocType(value)}
                </span>
            ),
        },
        { Header: "Document Name", accessor: "Doc_Name" },
        {
            Header: "Uploaded Date",
            accessor: "CREATED_AT",
            Cell: ({ value }) => formatDate(value),
        },
        { Header: "Uploaded By", accessor: "Created_By_Name" },
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
                    <div
                        style={style}
                        className="p-1.5 rounded text-center text-xs font-bold shadow-sm"
                    >
                        {row.original.apr1_name}
                    </div>
                );
            },
        },
        { Header: "Appr 1 Remark", accessor: "Appr_1_Rem" },
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
                    <div
                        style={style}
                        className="p-1.5 rounded text-center text-xs font-bold shadow-sm"
                    >
                        {row.original.apr2_name}
                    </div>
                );
            },
        },
        { Header: "Appr 2 Remark", accessor: "Appr_2_Rem" },
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
                    <div
                        style={style}
                        className="p-1.5 rounded text-center text-xs font-bold shadow-sm"
                    >
                        {row.original.apr3_name}
                    </div>
                );
            },
        },
        { Header: "Appr 3 Remark", accessor: "Appr_3_Rem" },
        {
            Header: "Final Status",
            accessor: "FIN_APPR",
            Cell: ({ row }: any) => {
                const status = row.original.Overall_Status || (row.original.Fin_Appr == 1 ? "APPROVED" : row.original.Fin_Appr == 0 ? "REJECTED" : "PENDING");
                const style =
                    status === "APPROVED" || row.original.Fin_Appr == 1
                        ? { border: "1.5px solid #16a34a", color: "#16a34a", backgroundColor: "transparent" }
                        : status === "REJECTED" || row.original.Fin_Appr == 0
                            ? { border: "1.5px solid #dc2626", color: "#dc2626", backgroundColor: "transparent" }
                            : { border: "1.5px solid #d97706", color: "#d97706", backgroundColor: "transparent" };
                return (
                    <span
                        style={style}
                        className="px-2.5 py-1 rounded text-xs font-bold shadow-sm inline-block"
                    >
                        {status}
                    </span>
                );
            },
        },
    ];

    useEffect(() => {
        if (user) {
            showDataOFAPPRVL();
            fetchBranches();
        }
    }, [user]);

    useEffect(() => {
        showdata();
    }, [dates.status]);

    const fetchBranches = async () => {
        if (!user) return;
        try {
            const userBranchCode = user?.branch ? String(user.branch) : "";
            const response = await onlybranch(user);
            if (response?.data && Array.isArray(response.data)) {
                // Sirf wahi branch rakho jisse user logged in hai
                const userBranches = userBranchCode
                    ? response.data.filter((b: any) => String(b.Code ?? b.value) === userBranchCode)
                    : response.data;

                const branchList = userBranches.length > 0 ? userBranches : response.data;
                const formatted = branchList.map((b: any) => ({
                    value: String(b.Code ?? b.value),
                    label: `${b.Code ?? b.value} - ${b.Name ?? b.label}`,
                }));
                setBranch(formatted);
                if (formatted.length > 0) {
                    setDates((prev) => ({
                        ...prev,
                        branch: formatted[0].value,
                    }));
                }
            } else if (userBranchCode) {
                const singleBranch = [{
                    value: userBranchCode,
                    label: user?.branchName ? `${userBranchCode} - ${user.branchName}` : userBranchCode,
                }];
                setBranch(singleBranch);
                setDates((prev) => ({ ...prev, branch: userBranchCode }));
            }
        } catch (error) {
            console.error("Error fetching branches:", error);
            if (user?.branch) {
                const bCode = String(user.branch);
                setBranch([{
                    value: bCode,
                    label: user?.branchName ? `${bCode} - ${user.branchName}` : bCode,
                }]);
                setDates((prev) => ({ ...prev, branch: bCode }));
            }
        }
    };

    const showDataOFAPPRVL = async () => {
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_URL}/Crm/approvalmatrixfindOne`,
                {
                    params: {
                        empcode: user?.EMPCODE,
                        module_code: "EMP_DOC_CHANGE",
                    },
                    headers: {
                        compcode: user?.Comp_Code,
                    },
                }
            ).catch(() => null);

            if (response?.data?.Result) {
                setApprData(response.data.Result);
            } else {
                const resp2 = await axios.get(
                    `${process.env.NEXT_PUBLIC_URL}/Crm/GetApprList`,
                    {
                        params: {
                            Empcode: user?.EMPCODE,
                            module: "EMP_DOC_CHANGE",
                        },
                        headers: {
                            compcode: user?.Comp_Code,
                        },
                    }
                ).catch(() => null);
                if (resp2?.data?.Result) {
                    setApprData(resp2.data.Result);
                }
            }
        } catch (error) {
            console.error("Error fetching approval matrix:", error);
        }
    };

    //   const fetchBranches = async () => {
    //     try {
    //       const result = await axios.post(
    //         `${process.env.NEXT_PUBLIC_URL}/payout/payout`,
    //         {
    //           dateFrom: dates.DATE_FROM,
    //           dateto: dates.DATE_TO,
    //           multi_loc: user?.branch,
    //         },
    //         {
    //           headers: {
    //             compcode: user?.Comp_Code,
    //             name: user?.name,
    //             token: user?.email,
    //           },
    //         }
    //       );
    //       setBranch(result.data.branch || []);
    //     } catch (err) {
    //       console.log("Branch fetch error:", err);
    //     }
    //   };

    function filterByStatus(data, status) {
        if (status === 2) {
            // Pending: Strictly only Export_Type = 1 records pending for current approver
            return data.filter((item) =>
                (Number(item.Export_Type) === 1 || item.Export_Type === "1" || item.Export_Type == null) &&
                (
                    item.is_pending_for_me == 1 ||
                    (item.status_khud_ka == null && item.Fin_Appr == null && (item.Current_Appr_Level === 1 || item.Appr_1_Stat !== null))
                )
            );
        }
        if (status === 1) {
            // Approved: Overall Final Approved OR (Current user approved and not final rejected) - includes all export types
            return data.filter((item) =>
                item.Fin_Appr == 1 ||
                (item.status_khud_ka == 1 && item.Fin_Appr == null)
            );
        }
        if (status === 0) {
            // Reject: Overall Final Rejected OR (Current user rejected and not final approved) - includes all export types
            return data.filter((item) =>
                (item.Fin_Appr == 0 && item.Fin_Appr !== 1) ||
                (item.status_khud_ka == 0 && item.Fin_Appr == null)
            );
        }
        return data;
    }

    const showdata = async () => {
        setFiltereddata([]);
        setTabledata([]);
        setsellectedrowdata([]);

        setIsClicked(true);
        try {
            const result = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/Crm/DocApproverView`,
                {
                    Appr_Code: user?.EMPCODE,
                    DateFrom: dates.DATE_FROM,
                    DateTo: dates.DATE_TO,
                    branch: dates.branch,
                },
                {
                    headers: {
                        compcode: user?.Comp_Code,
                        name: user?.name,
                    },
                }
            );

            const resList = result.data.Result || [];
            setTabledata(resList);
            setFiltereddata(filterByStatus(resList, Number(dates.status)));
        } catch (err) {
            console.error("DocApproverView error:", err);
            toast({
                title: "Error fetching document approval data",
                variant: "destructive",
            });
        } finally {
            setIsClicked(false);
        }
    };

    const handleDateChange = (name, value) => {
        if (name === "status") {
            setIsClicked(true);
            setFiltereddata([]);
            setFiltereddata(filterByStatus(tabledata, Number(value)));
            setIsClicked(false);
        }
        setDates((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleRemark = (name, value) => {
        setRemark(value);
    };

    const approver = async () => {
        if (!selectedrowdata || selectedrowdata.length === 0) {
            toast({
                title: "Please select at least one document to approve",
                variant: "destructive",
            });
            return;
        }

        const confirmed = await Swal.fire({
            icon: "warning",
            title: "Approve Document(s)?",
            text: "Do you want to proceed with approving the selected document(s)?",
            confirmButtonText: "Yes, Approve",
            cancelButtonText: "Cancel",
            showCancelButton: true,
        });

        if (confirmed.isConfirmed) {
            setIsClicked(true);
            try {
                const result = await axios.post(
                    `${process.env.NEXT_PUBLIC_URL}/Crm/DocApproveBy2`,
                    {
                        tran_id: selectedrowdata,
                        Appr_Code: user?.EMPCODE,
                        Remark: remark,
                    },
                    {
                        headers: {
                            compcode: user?.Comp_Code,
                            name: user?.name,
                        },
                    }
                );

                if (result.data.Status || result.data.status) {
                    toast({
                        title: "Document(s) Approved Successfully",
                        variant: "default",
                    });
                }
                setsellectedrowdata([]);
                setCheck(false);
                setRemark(null);
                await showdata();
            } catch (err) {
                console.error("Approval error:", err);
                toast({
                    title: err.response?.data?.Message || "Error approving documents",
                    variant: "destructive",
                });
            } finally {
                setIsClicked(false);
            }
        }
    };

    const reject = async () => {
        if (!selectedrowdata || selectedrowdata.length === 0) {
            toast({
                title: "Please select at least one document to reject",
                variant: "destructive",
            });
            return;
        }

        const confirmed = await Swal.fire({
            icon: "warning",
            title: "Reject Document(s)?",
            text: "Are you sure you want to reject the selected document(s)?",
            confirmButtonText: "Yes, Reject",
            cancelButtonText: "Cancel",
            showCancelButton: true,
        });

        if (confirmed.isConfirmed) {
            setIsClicked(true);
            try {
                const result = await axios.post(
                    `${process.env.NEXT_PUBLIC_URL}/Crm/DocRejectBy2`,
                    {
                        tran_id: selectedrowdata,
                        Appr_Code: user?.EMPCODE,
                        Remark: remark,
                    },
                    {
                        headers: {
                            compcode: user?.Comp_Code,
                            name: user?.name,
                        },
                    }
                );

                if (result.data.Status || result.data.status) {
                    toast({
                        title: "Document(s) Rejected Successfully",
                        variant: "default",
                    });
                }
                setsellectedrowdata([]);
                setCheck(false);
                setRemark(null);
                await showdata();
            } catch (err) {
                console.error("Rejection error:", err);
                toast({
                    title: err.response?.data?.Message || "Error rejecting documents",
                    variant: "destructive",
                });
            } finally {
                setIsClicked(false);
            }
        }
    };

    const doubleclicked = (row: any) => {
        const docPath = row?.Doc_Path ? String(row.Doc_Path).trim() : "";
        if (docPath) {
            window.open(getFileUrl(docPath), "_blank");
        }
    };

    return (
        <div>
            <div>
                {/* Header Banner */}
                <div className="col-span-12 rounded-t bg-header dark:bg-black px-3 sm:px-6 py-2.5 border dark:border-borderColor-dark">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                        <h1 className="font-bold text-xs sm:text-sm md:text-base lg:text-lg text-white dark:text-[#37a9dd] flex items-center gap-x-2 sm:gap-x-3 uppercase">
                            <FileText size={20} className="text-white shrink-0 sm:w-6 sm:h-6" />
                            <span>EMPLOYEE DOCUMENT APPROVAL GRID</span>
                        </h1>
                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                            <Button
                                variant="update"
                                title="View Approval Matrix"
                                onClick={() => setIsModalVisible1(true)}
                                className="h-8 px-2.5"
                            >
                                <ListChecks size={16} />
                            </Button>
                            <Button variant="print" onClick={() => window.history.back()} className="h-8 px-3 text-xs sm:text-sm">
                                Back
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Filter Controls */}
                <div
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 rounded-b p-3 sm:p-4 mt-3 bg-white dark:bg-black border border-[#b5bfcb] dark:border-[#D0D5DD] shadow"
                    id="pdfContent"
                >
                    <div className="col-span-1 sm:col-span-1 md:col-span-2">
                        <Ainput
                            title="DATE FROM"
                            type="date"
                            name="DATE_FROM"
                            value={dates.DATE_FROM}
                            handleInputChange={handleDateChange}
                        />
                    </div>

                    <div className="col-span-1 sm:col-span-1 md:col-span-2">
                        <Ainput
                            title="DATE TO"
                            type="date"
                            name="DATE_TO"
                            value={dates.DATE_TO}
                            handleInputChange={handleDateChange}
                        />
                    </div>

                    <div className="col-span-1 sm:col-span-2 md:col-span-3">
                        <SelectSearch
                            title="Branch"
                            options={branch}
                            name={"branch"}
                            handleInputChange={handleDateChange}
                            selectedValue={dates.branch?.toString()}
                            isSelectAll={true}
                        />
                    </div>

                    <div className="col-span-1 sm:col-span-1 md:col-span-3">
                        <SelectSearch
                            title="Status"
                            options={Status}
                            name="status"
                            handleInputChange={handleDateChange}
                            selectedValue={dates.status?.toString()}
                        />
                    </div>

                    <div className="col-span-1 sm:col-span-1 md:col-span-2 flex items-end">
                        <Button onClick={showdata} variant={"save"} className="w-full h-9 font-bold text-xs sm:text-sm">
                            Show
                        </Button>
                    </div>
                </div>

                {/* Table Content */}
                <div className="w-full p-2 sm:p-4 mt-3 bg-white dark:bg-black border border-[#b5bfcb] dark:border-[#D0D5DD] shadow rounded">
                    <DataTable
                        status={dates.status}
                        columns={columns1}
                        check={check}
                        selectValue="UTD"
                        data={filtereddata}
                        setsellectedrowdata={setsellectedrowdata}
                        height="400px"
                        texta="Approve"
                        textr="Reject"
                        onRowDoubleClick={doubleclicked}
                        handlereject={reject}
                        handleapprove={approver}
                        remark={remark}
                        handleRemark={handleRemark}
                    />
                </div>

                {/* Approver Matrix Modal */}
                <Dialog open={isModalVisible1} onOpenChange={setIsModalVisible1}>
                    <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto p-3 sm:p-6">
                        <DialogHeader>
                            <DialogTitle className="text-sm sm:text-base font-semibold">Document Approval List</DialogTitle>
                            <DialogDescription asChild>
                                <div className="mt-3 max-h-[350px] overflow-x-auto overflow-y-auto">
                                    {apprData.length === 0 ? (
                                        <div className="text-center text-gray-500 py-10 text-xs sm:text-sm">
                                            No Approver Matrix Configured for EMP_DOC_CHANGE
                                        </div>
                                    ) : (
                                        <div className="border rounded-lg overflow-x-auto">
                                            <table className="w-full border text-xs min-w-[500px]">
                                                <thead>
                                                    <tr className="bg-gray-100 text-left font-bold">
                                                        <th className="p-2 border">Approver 1A</th>
                                                        <th className="p-2 border">Approver 1B</th>
                                                        <th className="p-2 border">Approver 2A</th>
                                                        <th className="p-2 border">Approver 2B</th>
                                                        <th className="p-2 border">Approver 3A</th>
                                                        <th className="p-2 border">Approver 3B</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {apprData.map((item, index) => (
                                                        <tr key={index} className="hover:bg-blue-50">
                                                            <td className="border p-2">{item.approver1_A || "-"}</td>
                                                            <td className="border p-2">{item.approver1_B || "-"}</td>
                                                            <td className="border p-2">{item.approver2_A || "-"}</td>
                                                            <td className="border p-2">{item.approver2_B || "-"}</td>
                                                            <td className="border p-2">{item.approver3_A || "-"}</td>
                                                            <td className="border p-2">{item.approver3_B || "-"}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </DialogDescription>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>

                <HashloaderComponent isLoading={isClicked} />
            </div>
        </div>
    );
};

export default DocumentApproval;
