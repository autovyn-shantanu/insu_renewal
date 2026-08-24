// "use client";

// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import Image from "next/image";
// import Swal from "sweetalert2";
// import { Button } from "@/components/ui/button";
// import HashloaderComponent from "@/components/Templates/hashloader";
// import DataTable from "@/components/Templates/servicetable";
// import { useCurrentUser } from "@/app/hooks/use-current-user";
// import axios from "axios";

// const BASE_URL = process.env.NEXT_PUBLIC_URL;

// type Task = {
//   Insurance_UTD: number | string;
//   CUST_NAME: string;
//   CUST_MOB_NO: string;
//   POLICY_NAME: string;
//   POLICY_NUMBER: string;
//   VEHICAL_REG_NO: string;
//   MODEL_NAME: string;
//   POLICY_START_DATE: string;
//   POLICY_END_DATE: string;
//   DSC_EMPCODE: string;
//   DSC_NAME: string;
//   DSC_MOB_NO: string;
//   DAYS_REMAINING: number;
// };

// type TeamMember = {
//   EMPCODE: string;
//   FULL_NAME: string;
//   MOBILENO: string;
//   taskCount: number;
//   urgent: number;
//   warning: number;
//   normal: number;
//   expired: number;
// };

// function showSideAlert(
//   message: string,
//   type: "success" | "error" | "warning" | "info"
// ) {
//   Swal.mixin({
//     toast: true,
//     position: "top-end",
//     showConfirmButton: false,
//     timer: 5000,
//     timerProgressBar: true,
//   }).fire({ icon: type, title: message });
// }

// const ReportingManagerViewPage = () => {
//   const user = useCurrentUser();

//   const getJsonHeaders = () => ({
//     accept: "application/json",
//     compcode: user?.Comp_Code,
//     name: user?.name,
//     "Content-Type": "application/json",
//   });

//   const [tasks, setTasks] = useState<Task[]>([]);
//   const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
//   const [isFetching, setIsFetching] = useState(false);
//   const [managerDetails, setManagerDetails] = useState<any>(null);
//   const [selectedDSE, setSelectedDSE] = useState<string | null>(null);

//   // ── Fetch Team Tasks ─────────────────────────────────────────
//   const fetchTeamTasks = useCallback(async () => {
//     try {
//       setIsFetching(true);

//       const res = await axios.post(
//         `${BASE_URL}/excel/getReportingManagerTeamTasks`,
//         {
//           MANAGER_EMPCODE: user?.EMP_CODE || (user as any)?.EMPCODE,
//         },
//         { headers: getJsonHeaders() }
//       );

//       if (res?.data?.success) {
//         setManagerDetails(res.data.managerDetails);
//         setTeamMembers(res.data.teamMembers || []);
//         setTasks(res.data.data || []);
//         console.log("Team tasks loaded:", res.data.stats);
//       } else {
//         setTeamMembers([]);
//         setTasks([]);
//         showSideAlert(res.data.message || "Failed to fetch team tasks", "error");
//       }
//     } catch (err) {
//       console.error("fetch error:", err);
//       setTeamMembers([]);
//       setTasks([]);
//       showSideAlert("Error fetching team tasks", "error");
//     } finally {
//       setIsFetching(false);
//     }
//   }, [user]);

//   useEffect(() => {
//     fetchTeamTasks();
//   }, [fetchTeamTasks]);

//   // ── Filter tasks by selected DSE ─────────────────────────────
//   const filteredTasks = useMemo(() => {
//     if (!selectedDSE) return tasks;
//     return tasks.filter((t) => t.DSC_EMPCODE === selectedDSE);
//   }, [tasks, selectedDSE]);

//   // ── Statistics ───────────────────────────────────────────────
//   const stats = useMemo(() => {
//     const dataToCalc = selectedDSE ? filteredTasks : tasks;
//     return {
//       total: dataToCalc.length,
//       urgent: dataToCalc.filter((t) => t.DAYS_REMAINING <= 5).length,
//       warning: dataToCalc.filter(
//         (t) => t.DAYS_REMAINING > 5 && t.DAYS_REMAINING <= 10
//       ).length,
//       normal: dataToCalc.filter((t) => t.DAYS_REMAINING > 10).length,
//       expired: dataToCalc.filter((t) => t.DAYS_REMAINING <= 0).length,
//     };
//   }, [tasks, selectedDSE, filteredTasks]);

//   // ── Table Columns ─────────────────────────────────────────────
//   const columns = [
//     { Header: "DSE Name", accessor: "DSC_NAME", width: 130 },
//     { Header: "Policy Number", accessor: "POLICY_NUMBER", width: 120 },
//     { Header: "Vehicle Reg", accessor: "VEHICAL_REG_NO", width: 120 },
//     { Header: "Customer", accessor: "CUST_NAME", width: 150 },
//     { Header: "Mobile", accessor: "CUST_MOB_NO", width: 120 },
//     { Header: "Policy", accessor: "POLICY_NAME", width: 120 },
//     { Header: "Model", accessor: "MODEL_NAME", width: 130 },
//     { Header: "Start Date", accessor: "POLICY_START_DATE", width: 120 },
//     { Header: "End Date", accessor: "POLICY_END_DATE", width: 120 },
//     {
//       Header: "Days Remaining",
//       accessor: "DAYS_REMAINING",
//       cellAlign: "center",
//       width: 120,
//       Cell: ({ value }: any) => {
//         const days = Number(value);
//         let bgColor = "bg-green-100 text-green-700";
//         if (days <= 0) bgColor = "bg-red-100 text-red-700";
//         else if (days <= 5) bgColor = "bg-red-100 text-red-700";
//         else if (days <= 10) bgColor = "bg-orange-100 text-orange-700";

//         return (
//           <span className={`rounded-full px-2 py-1 text-xs font-bold ${bgColor}`}>
//             {days > 0 ? `${days} days` : "Expired"}
//           </span>
//         );
//       },
//     },
//   ];

//   return (
//     <div className="grid grid-cols-12 gap-4">
//       {/* HEADER */}
//       <div className="col-span-12">
//         <div className="rounded-t border border-borderColor bg-header px-2 py-2 dark:border-borderColor-dark dark:bg-black md:px-6">
//           <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
//             <h1 className="flex items-center gap-x-3 text-sm font-bold uppercase text-white dark:text-[#37a9dd] md:text-lg lg:text-xl">
//               <Image
//                 src="/Payrollicon/Excel_Import.png"
//                 alt="Team Tasks"
//                 width={25}
//                 height={25}
//               />
//               Team Insurance Renewal Tasks
//             </h1>

//             <Button
//               variant="print"
//               onClick={() => window.history.back()}
//               disabled={isFetching}
//             >
//               Back
//             </Button>
//           </div>
//         </div>
//       </div>

//       {/* MANAGER INFO */}
//       {managerDetails && (
//         <div className="col-span-12 rounded border border-borderColor bg-white p-4 shadow dark:border-borderColor-dark dark:bg-black">
//           <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
//             <div>
//               <h2 className="text-lg font-bold text-gray-800 dark:text-white">
//                 {managerDetails.FULL_NAME}
//               </h2>
//               <p className="text-sm text-gray-600 dark:text-gray-400">
//                 {managerDetails.DESIGNATION} ({managerDetails.EMPCODE})
//               </p>
//               <p className="text-sm text-gray-600 dark:text-gray-400">
//                 📱 {managerDetails.MOBILENO}
//               </p>
//             </div>
//             <Button variant="print" onClick={fetchTeamTasks} disabled={isFetching}>
//               Refresh
//             </Button>
//           </div>
//         </div>
//       )}

//       {/* STATISTICS */}
//       <div className="col-span-12 grid grid-cols-1 gap-4 md:grid-cols-5">
//         <div className="rounded border border-borderColor bg-white p-4 shadow dark:border-borderColor-dark dark:bg-black">
//           <h3 className="mb-2 text-sm font-bold text-gray-600 dark:text-gray-400">
//             Team Members
//           </h3>
//           <p className="text-3xl font-bold text-blue-600">{teamMembers.length}</p>
//         </div>

//         <div className="rounded border border-borderColor bg-white p-4 shadow dark:border-borderColor-dark dark:bg-black">
//           <h3 className="mb-2 text-sm font-bold text-gray-600 dark:text-gray-400">
//             Total Tasks
//           </h3>
//           <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
//         </div>

//         <div className="rounded border border-borderColor bg-white p-4 shadow dark:border-borderColor-dark dark:bg-black">
//           <h3 className="mb-2 text-sm font-bold text-gray-600 dark:text-gray-400">
//             🔴 Urgent
//           </h3>
//           <p className="text-3xl font-bold text-red-600">{stats.urgent}</p>
//         </div>

//         <div className="rounded border border-borderColor bg-white p-4 shadow dark:border-borderColor-dark dark:bg-black">
//           <h3 className="mb-2 text-sm font-bold text-gray-600 dark:text-gray-400">
//             🟠 Warning
//           </h3>
//           <p className="text-3xl font-bold text-orange-600">{stats.warning}</p>
//         </div>

//         <div className="rounded border border-borderColor bg-white p-4 shadow dark:border-borderColor-dark dark:bg-black">
//           <h3 className="mb-2 text-sm font-bold text-gray-600 dark:text-gray-400">
//             🟢 Normal
//           </h3>
//           <p className="text-3xl font-bold text-green-600">{stats.normal}</p>
//         </div>
//       </div>

//       {/* TEAM MEMBERS SUMMARY */}
//       {teamMembers.length > 0 && (
//         <div className="col-span-12 rounded border border-borderColor bg-white p-4 shadow dark:border-borderColor-dark dark:bg-black">
//           <h3 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">
//             Team Members ({teamMembers.length})
//           </h3>
//           <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
//             {teamMembers.map((member) => (
//               <div
//                 key={member.EMPCODE}
//                 onClick={() =>
//                   setSelectedDSE(
//                     selectedDSE === member.EMPCODE ? null : member.EMPCODE
//                   )
//                 }
//                 className={`cursor-pointer rounded border p-3 transition ${
//                   selectedDSE === member.EMPCODE
//                     ? "border-blue-500 bg-blue-50 dark:bg-blue-900"
//                     : "border-borderColor dark:border-borderColor-dark"
//                 }`}
//               >
//                 <div className="flex justify-between">
//                   <div>
//                     <p className="font-bold text-gray-800 dark:text-white">
//                       {member.FULL_NAME}
//                     </p>
//                     <p className="text-xs text-gray-600 dark:text-gray-400">
//                       {member.EMPCODE}
//                     </p>
//                     <p className="text-xs text-gray-600 dark:text-gray-400">
//                       📱 {member.MOBILENO}
//                     </p>
//                   </div>
//                   <div className="text-right">
//                     <p className="text-2xl font-bold text-blue-600">
//                       {member.taskCount}
//                     </p>
//                     <p className="text-xs text-gray-500">Tasks</p>
//                     {member.urgent > 0 && (
//                       <p className="text-xs font-bold text-red-600">
//                         {member.urgent} urgent
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* TASKS TABLE */}
//       <div className="col-span-12 rounded border border-borderColor bg-white p-2 shadow dark:border-borderColor-dark dark:bg-black md:p-4">
//         <DataTable
//           title={
//             selectedDSE
//               ? `Tasks for ${teamMembers.find((m) => m.EMPCODE === selectedDSE)?.FULL_NAME} (${filteredTasks.length} tasks)`
//               : `All Team Tasks (${tasks.length} total)`
//           }
//           columns={columns}
//           selectValue="Insurance_UTD"
//           data={filteredTasks}
//           height={500}
//           filterPosition="FilterData"
//           enableColumnFilters={true}
//           numericFilterColumns={["Insurance_UTD", "CUST_MOB_NO", "DAYS_REMAINING"]}
//           onRowDoubleClick={() => {}}
//           ischeckbox={false}
//         />

//         {!isFetching && filteredTasks.length === 0 && (
//           <div className="py-8 text-center text-sm text-gray-500">
//             ✅ No tasks found
//           </div>
//         )}
//       </div>

//       <HashloaderComponent isLoading={isFetching} />
//     </div>
//   );
// };

// export default ReportingManagerViewPage;