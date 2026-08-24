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

// const DSETasksPage = () => {
//   const user = useCurrentUser();

//   const getJsonHeaders = () => ({
//     accept: "application/json",
//     compcode: user?.Comp_Code,
//     name: user?.name,
//     "Content-Type": "application/json",
//   });

//   const [tasks, setTasks] = useState<Task[]>([]);
//   const [isFetching, setIsFetching] = useState(false);
//   const [dseDetails, setDseDetails] = useState<any>(null);

//   // ── Fetch DSE Tasks ──────────────────────────────────────────
//   const fetchDSETasks = useCallback(async () => {
//     try {
//       setIsFetching(true);

//       const res = await axios.post(
//         `${BASE_URL}/excel/getDSEOwnTasks`,
//         {
//           DSE_EMPCODE: user?.EMP_CODE || (user as any)?.EMPCODE,
//         },
//         { headers: getJsonHeaders() }
//       );

//       if (res?.data?.success) {
//         setDseDetails(res.data.dseDetails);
//         setTasks(res.data.data || []);
//         console.log("Tasks loaded:", res.data.totalRecords);
//       } else {
//         setTasks([]);
//         showSideAlert(res.data.message || "Failed to fetch tasks", "error");
//       }
//     } catch (err) {
//       console.error("fetch error:", err);
//       setTasks([]);
//       showSideAlert("Error fetching tasks", "error");
//     } finally {
//       setIsFetching(false);
//     }
//   }, [user]);

//   useEffect(() => {
//     fetchDSETasks();
//   }, [fetchDSETasks]);

//   // ── Statistics ───────────────────────────────────────────────
//   const stats = useMemo(() => {
//     return {
//       total: tasks.length,
//       urgent: tasks.filter((t) => t.DAYS_REMAINING <= 5).length,
//       warning: tasks.filter((t) => t.DAYS_REMAINING > 5 && t.DAYS_REMAINING <= 10).length,
//       normal: tasks.filter((t) => t.DAYS_REMAINING > 10).length,
//       expired: tasks.filter((t) => t.DAYS_REMAINING <= 0).length,
//     };
//   }, [tasks]);

//   // ── Table Columns ─────────────────────────────────────────────
//   const columns = [
//     { Header: "Policy Number", accessor: "POLICY_NUMBER", width: 120 },
//     { Header: "Vehicle Reg No", accessor: "VEHICAL_REG_NO", width: 120 },
//     { Header: "Customer Name", accessor: "CUST_NAME", width: 150 },
//     { Header: "Customer Mobile", accessor: "CUST_MOB_NO", width: 130 },
//     { Header: "Policy Name", accessor: "POLICY_NAME", width: 120 },
//     { Header: "Model", accessor: "MODEL_NAME", width: 130 },
//     { Header: "Start Date", accessor: "POLICY_START_DATE", width: 130 },
//     { Header: "End Date", accessor: "POLICY_END_DATE", width: 130 },
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
//                 alt="My Tasks"
//                 width={25}
//                 height={25}
//               />
//               My Insurance Renewal Tasks
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

//       {/* DSE INFO */}
//       {dseDetails && (
//         <div className="col-span-12 rounded border border-borderColor bg-white p-4 shadow dark:border-borderColor-dark dark:bg-black">
//           <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
//             <div>
//               <h2 className="text-lg font-bold text-gray-800 dark:text-white">
//                 {dseDetails.FULL_NAME}
//               </h2>
//               <p className="text-sm text-gray-600 dark:text-gray-400">
//                 {dseDetails.DESIGNATION} ({dseDetails.EMPCODE})
//               </p>
//               <p className="text-sm text-gray-600 dark:text-gray-400">
//                 📱 {dseDetails.MOBILENO}
//               </p>
//             </div>
//             <Button variant="print" onClick={fetchDSETasks} disabled={isFetching}>
//               Refresh
//             </Button>
//           </div>
//         </div>
//       )}

//       {/* STATISTICS */}
//       <div className="col-span-12 grid grid-cols-1 gap-4 md:grid-cols-5">
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

//         <div className="rounded border border-borderColor bg-white p-4 shadow dark:border-borderColor-dark dark:bg-black">
//           <h3 className="mb-2 text-sm font-bold text-gray-600 dark:text-gray-400">
//             ⏰ Expired
//           </h3>
//           <p className="text-3xl font-bold text-gray-600">{stats.expired}</p>
//         </div>
//       </div>

//       {/* TASKS TABLE */}
//       <div className="col-span-12 rounded border border-borderColor bg-white p-2 shadow dark:border-borderColor-dark dark:bg-black md:p-4">
//         <DataTable
//           title={`My Tasks (${tasks.length} total)`}
//           columns={columns}
//           selectValue="Insurance_UTD"
//           data={tasks}
//           height={500}
//           filterPosition="FilterData"
//           enableColumnFilters={true}
//           numericFilterColumns={["Insurance_UTD", "CUST_MOB_NO", "DAYS_REMAINING"]}
//           onRowDoubleClick={() => {}}
//           ischeckbox={false}
//         />

//         {!isFetching && tasks.length === 0 && (
//           <div className="py-8 text-center text-sm text-gray-500">
//             ✅ No assigned tasks
//           </div>
//         )}
//       </div>

//       <HashloaderComponent isLoading={isFetching} />
//     </div>
//   );
// };

// export default DSETasksPage;