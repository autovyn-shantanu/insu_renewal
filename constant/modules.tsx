import { MdAccountCircle, MdFileUpload } from "react-icons/md";
import { AiOutlineAudit } from "react-icons/ai";
import { IoIdCard, IoCart } from "react-icons/io5";
import { GiCarWheel } from "react-icons/gi";
import { FaFolderOpen, FaTag } from "react-icons/fa";
import {
  FaUsers,
  FaShieldAlt,
  FaBoxOpen,
  FaTools,
  FaClipboardCheck,
} from "react-icons/fa";
import { MdDashboard, MdAutoMode } from "react-icons/md";
import { GrUserAdmin } from "react-icons/gr";
import { FaBalanceScale } from "react-icons/fa";
import { Car, BadgeCheck, Wallet } from "lucide-react";
import { RiBankFill } from "react-icons/ri";
import Image from "next/image";

export const treeData = [

  {
    title: "Admin",
    url: "/autovyn/admin",
    ShortCut: "alt+u",
    icon: (
      <div className="h-10 w-10 flex items-center justify-center rounded-lg cursor-pointer hover:text-gray-800 hover:duration-300 hover:ease-linear ">
        <Image src="/sidebaricon/Admin.png" alt="Autovyn" width={25} height={25} />
      </div>
    ),
    key: "8",
    children: [
      
      {
        title: "Query Analyzer |",
        key: "8.7",
        url: "/autovyn/admin/QueryAnalyzer",
        children: [
          {
            title: "Query Analyzer |",
            key: "8.7.1",
            url: "/autovyn/admin/QueryAnalyzer/QueryAnalyzer",
          },
        ],
      },
      

    ],
  },
  {
    title: "Employee Master",
    url: "/autovyn/admin",
    ShortCut: "alt+u",
    icon: (
      <div className="h-10 w-10 flex items-center justify-center rounded-lg cursor-pointer hover:text-gray-800 hover:duration-300 hover:ease-linear ">
        <Image src="/sidebaricon/Admin.png" alt="Autovyn" width={25} height={25} />
      </div>
    ),
    key: "9",
    children: [
       {
        title: "Employee master|",
        key: "9.1",
        url: "/autovyn/employee-master",
        children: [
          {
            title: "Employee Add |",
            key: "9.1.1",
            url: "/autovyn/employee-master/employee_mini",
          },
          {
            title: "Employee Detail |",
            key: "9.1.2",
            url: "/autovyn/employee-master/employee_view",
          },
          {
          title: "Wish Well |",
          key: "9.1.3",
          url: "/autovyn/employee-master/wish_well"
        },
        ],
      },
    ]
  },
  {
    title: "DEMO GATEPASS",
    url: "/autovyn/admin",
    ShortCut: "alt+u",
    icon: (
      <div className="h-10 w-10 flex items-center justify-center rounded-lg cursor-pointer hover:text-gray-800 hover:duration-300 hover:ease-linear ">
        <Image src="/sidebaricon/Admin.png" alt="Autovyn" width={25} height={25} />
      </div>
    ),
    key: "10",
    children: [
       {
        title: "Demo Gatepass|",
        key: "10.1",
        url: "/autovyn/demo-gatepass",
        children: [
          {
            title: "Test Drive Appointment |",
            key: "10.1.1",
            url: "/autovyn/demo-gatepass/test-drive-appointment",
          },
        //   {
        //     title: "Employee Detail |",
        //     key: "9.1.2",
        //     url: "/autovyn/employee-master/employee_view",
        //   },
        //   {
        //   title: "Wish Well |",
        //   key: "9.1.3",
        //   url: "/autovyn/employee-master/wish_well"
        // },
        ],
      },
    ]
  },

  {
    title: "Insurence Renewal",
    url: "/autovyn/admin",
    ShortCut: "alt+u",
    icon: (
      <div className="h-10 w-10 flex items-center justify-center rounded-lg cursor-pointer hover:text-gray-800 hover:duration-300 hover:ease-linear ">
        <Image src="/sidebaricon/Admin.png" alt="Autovyn" width={25} height={25} />
      </div>
    ),
    key: "11",
    children: [
       {
        title: "Insurence renewal|",
        key: "11.1",
        url: "/autovyn/insurence-renewal",
        children: [
          {
            title: "Excel Import |",
            key: "11.1.1",
            url: "/autovyn/insurence-renewal/excel-import",
          },

           {
            title: "View Tabel |",
            key: "11.1.2",
            url: "/autovyn/insurence-renewal/view-tabel",
          },

           {
            title: "Reminders |",
            key: "11.1.3",
            url: "/autovyn/insurence-renewal/reminder",
          },

           {
            title: "Insu Payment |",
            key: "11.1.4",
            url: "/autovyn/insurence-renewal/payment",
          },
           {
            title: "Insu Account Approval |",
            key: "11.1.5",
            url: "/autovyn/insurence-renewal/accountapproval",
          },
            {
            title: "Insu Account View |",
            key: "11.1.6",
            url: "/autovyn/insurence-renewal/accountview",
          },

           {
            title: "Insu Calling View |",
            key: "11.1.7",
            url: "/autovyn/insurence-renewal/insucallingview",
          },
             {
            title: "Insu Calling Config |",
            key: "11.1.8",
            url: "/autovyn/insurence-renewal/insucallingconfig",
          },
           {
            title: "Insu Dashboard |",
            key: "11.1.10",
            url: "/autovyn/insurence-renewal/insu-dashboard",
          },

           {
            title: "Approval Grid  |",
            key: "11.1.11",
            url: "/autovyn/insurence-renewal/Mispunch_Approval_Grid",
          },
            {
            title: "Atteandance Report  |",
            key: "11.1.12",
            url: "/autovyn/insurence-renewal/attendance",
          },

            {
            title: "Insu Transfer   |",
            key: "11.1.13",
            url: "/autovyn/insurence-renewal/Transfer_work",
          },
        ],
      },
    ]
  }
];
