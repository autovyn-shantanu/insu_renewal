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
    key: "23",
    children: [
       {
        title: "Insurance Renewal |",
        key: "23.2",
        url: "/autovyn/insurence-renewal",
        children: [
           {
            title: "Dashboard |",
            key: "23.2.9",
            url: "/autovyn/insurence-renewal/insu-dashboard",
          },
          {
            title: "Insurance Data Import |",
            key: "23.2.1",
            url: "/autovyn/insurence-renewal/excel-import",
          },
           {
            title: "Insurance Data View |",
            key: "23.2.3",
            url: "/autovyn/insurence-renewal/view-tabel",
          },
          {
            title: "Insurance Reminder |",
            key: "23.2.2",
            url: "/autovyn/insurence-renewal/reminder",
          },
         
          {
            title: "Insurance Payment |",
            key: "23.2.4",
            url: "/autovyn/insurence-renewal/payment",
          },
          {
            title: "Account Approval |",
            key: "23.2.5",
            url: "/autovyn/insurence-renewal/accountapproval",
          },
          {
            title: "Insurance Renewal Approved |",
            key: "23.2.6",
            url: "/autovyn/insurence-renewal/accountview",
          },
          {
            title: "Insurance Calling Config |",
            key: "23.2.7",
            url: "/autovyn/insurence-renewal/insucallingconfig",
          },
          // {
          //   title: "Insurance Calling View |",
          //   key: "23.2.8",
          //   url: "/autovyn/CRM/Insu_Renewal/insucallingview",
          // },
         
          {
            title: "CRE Transfer Work |",
            key: "23.2.10",
            url: "/autovyn/insurence-renewal/Transfer_work",
          },

            {
            title: "Mispunch Approval Grid |",
            key: "23.2.11",
            url: "/autovyn/insurence-renewal/Mispunch_Approval_Grid",
          },


        ],
      },
    ]
  }
];
