// Replace the entire EditEmployeeProfile component with this updated version
"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";
import {
    User,
    Users,
    MapPin,
    CreditCard,
    Briefcase,
    Settings,
    FileText,
    ToggleLeft,
    ToggleRight,
    ChevronDown,
    ChevronUp,
    Camera,
    ShieldCheck,
    ShieldAlert,
    Upload,
    Eye,
    Check,
    X,
    Save,
    Eye as EyeIcon,
} from "lucide-react";
import Ainput from "@/components/atoms/Input";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import HashloaderComponent from "@/components/Templates/hashloader";
import { useSecureStorage } from "@/app/hooks/comp-key-data";


const UPDATE_PROFILE_URL = `${process.env.NEXT_PUBLIC_URL}/Crm/updateEmpProfile`;

 const FIELD_NAMES = {
    profile: "profileImage",
    adhar: "adharDocument",
    pan: "panDocument",
    salary: "salarySlipDocument",
    other: "otherDocument",
};
type DocKey = "adhar" | "pan" | "salary" | "other";
// ============== DROPDOWN OPTIONS ==============
const BLOOD_GROUP_OPTIONS = [
    { value: "A+", label: "A+" },
    { value: "A-", label: "A-" },
    { value: "B+", label: "B+" },
    { value: "B-", label: "B-" },
    { value: "AB+", label: "AB+" },
    { value: "AB-", label: "AB-" },
    { value: "O+", label: "O+" },
    { value: "O-", label: "O-" },
];
const MARITAL_STATUS_OPTIONS = [
    { value: "1", label: "SINGLE" },
    { value: "2", label: "MARRIED" },
    { value: "3", label: "DIVORCED" },
    { value: "4", label: "WIDOWED" },
];
const RELIGION_OPTIONS = [
    { value: "1", label: "HINDU" },
    { value: "2", label: "MUSLIMS" },
    { value: "3", label: "SIKH" },
    { value: "4", label: "CHRISTIAN" },
    { value: "5", label: "JAIN" },
    { value: "6", label: "BUDDHA" },
    { value: "7", label: "PERSIANS" },
];
const GENDER_OPTIONS = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Other", label: "Other" },
];

const MARITAL_STATUS_MAP: Record<string, string> = {
    "1": "1",
    "2": "2",
    "3": "3",
    "4": "4"
};
const RELIGION_MAP: Record<string, string> = {
    "1": "1",
    "2": "2",
    "3": "3",
    "4": "4",
    "5": "5",
    "6": "6",
    "7": "7"
};
const getDisplayValue = (value: any, map: Record<string, string>): string => {
    if (!value) return "";
    const strValue = String(value);
    return map[strValue] || strValue;
};
// ==========================================================
type ProfileFormData = {
    empCode: string;
    employeedesignation: string;
    empName: string;
    mobileNo: string;
    landlineNumber: string;
    coporateMailId: string;
    alternateMailId: string;
    gender: string;
    dob: string;
    maritialStatus: string;
    dom: string;
    bloodGroup: string;
    skills: string;
    basicQualification: string;
    professionalQualification: string;
    religion: string;
    driving_licence: string;
    empHeight: string;
    empWeight: string;
    childrenDetails: string;
    languageDetails: string;
    fatherName: string;
    fatherOccupation: string;
    fatherMobile: string;
    motherName: string;
    motherMobile: string;
    spouseName: string;
    spouseGender: string;
    spouseMobile: string;
    siblingName: string;
    siblingContactNumber: string;
    emergencyName: string;
    emergencyNumber: string;
    panNo: string;
    adharNo: string;
    passportNo: string;
    passportExpiryDate: string;
    pfNumber: string;
    esiNumber: string;
    LIN_NO: string;
    pAddress1: string;
    pAddress2: string;
    pCity: string;
    pState: string;
    pPinCode: string;
    cAddress1: string;
    cAddress2: string;
    cCity: string;
    cState: string;
    cPincode: string;
    previousCompanyName: string;
    pCompanyCity: string;
    pCompanyContactNumber: string;
    pJoiningDate: string;
    preEndDate: string;
    pDesignation: string;
    // Verification fields
    panCardVer: boolean;
    aadhaarCardVer: boolean;
    panNameMatchVer: boolean;
    aadhaarLinkedVer: boolean;
    aadhaarLinkedPanVar: boolean;
};
const emptyForm: ProfileFormData = {
    empCode: "",
    employeedesignation: "",
    empName: "",
    mobileNo: "",
    landlineNumber: "",
    coporateMailId: "",
    alternateMailId: "",
    gender: "",
    dob: "",
    maritialStatus: "",
    dom: "",
    bloodGroup: "",
    skills: "",
    basicQualification: "",
    professionalQualification: "",
    religion: "",
    driving_licence: "",
    empHeight: "",
    empWeight: "",
    childrenDetails: "",
    languageDetails: "",
    fatherName: "",
    fatherOccupation: "",
    fatherMobile: "",
    motherName: "",
    motherMobile: "",
    spouseName: "",
    spouseGender: "",
    spouseMobile: "",
    siblingName: "",
    siblingContactNumber: "",
    emergencyName: "",
    emergencyNumber: "",
    panNo: "",
    adharNo: "",
    passportNo: "",
    passportExpiryDate: "",
    pfNumber: "",
    esiNumber: "",
    LIN_NO: "",
    pAddress1: "",
    pAddress2: "",
    pCity: "",
    pState: "",
    pPinCode: "",
    cAddress1: "",
    cAddress2: "",
    cCity: "",
    cState: "",
    cPincode: "",
    previousCompanyName: "",
    pCompanyCity: "",
    pCompanyContactNumber: "",
    pJoiningDate: "",
    preEndDate: "",
    pDesignation: "",
    panCardVer: false,
    aadhaarCardVer: false,
    panNameMatchVer: false,
    aadhaarLinkedVer: false,
    aadhaarLinkedPanVar: false,
};
function toInputDate(v: string | null | undefined) {
    if (!v || v === "-/-/-") return "";
    if (v.includes("T") && v.includes("Z")) {
        const date = new Date(v);
        if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        }
        return "";
    }
    if (v.includes("-") && v.length === 10) {
        const parts = v.split("-");
        if (parts.length === 3 && parts[0].length === 4) {
            return v;
        }
    }
    if (v.includes("/")) {
        const [mm, dd, yyyy] = v.split("/");
        if (yyyy?.length === 4) return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    }
    if (v.includes("-")) {
        const [dd, mm, yyyy] = v.split("-");
        if (yyyy?.length === 4) return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    }
    return "";
}
function getValidDocumentUrl(url: any): string {
    if (!url) return "";
    if (typeof url !== "string") return "";
    if (url.includes("function") || url.includes("[native code]")) return "";
    if (!url.startsWith("http://") && !url.startsWith("https://")) return "";
    try {
        new URL(url);
        return url;
    } catch {
        return "";
    }
}
function extractDocumentPath(docData: any, docType: string): string {
    if (!docData) return "";
    if (typeof docData === "string") {
        const validUrl = getValidDocumentUrl(docData);
        if (validUrl) return validUrl;
    }
    if (Array.isArray(docData)) {
        const docMap: Record<string, number> = {
            adhar: 2,
            pan: 3,
            salary: 4,
            other: 5
        };
        const targetSeq = docMap[docType];
        if (targetSeq) {
            const found = docData.find((doc: any) => doc.Seq_No === targetSeq || doc.misspunch_inout === targetSeq);
            if (found && found.DOC_PATH) {
                const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:5000";
                return `${baseUrl}/fetch?filePath=${encodeURIComponent(found.DOC_PATH)}`;
            }
        }
    }
    return "";
}
function showSideAlert(message: string, type: "success" | "warning" | "error") {
    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
    });
    Toast.fire({
        icon: type,
        title: message,
    });
}
export default function EditEmployeeProfile() {
    const user = useCurrentUser();
    const { compdata } = useSecureStorage();
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [expandedTab, setExpandedTab] = useState<string | null>("basic");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [sameAsPermanent, setSameAsPermanent] = useState(false);
    const [hasPreviousCompany, setHasPreviousCompany] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [panInfo, setPanInfo] = useState<any>(null);
    const [aadhaarInfo, setAadhaarInfo] = useState<any>(null);
    const [showPanTooltip, setShowPanTooltip] = useState(false);
    const [showAadhaarTooltip, setShowAadhaarTooltip] = useState(false);
    // City options - you can fetch these from API or use static list
    // For now, using common cities from the data
    const [cityOptions, setCityOptions] = useState<Array<{ value: string; label: string }>>([]);
    const [stateOptions, setStateOptions] = useState<Array<{ value: string; label: string }>>([]);
    const [aadhaarRefId, setAadhaarRefId] = useState<string | null>(null);
    const [aadhaarOtp, setAadhaarOtp] = useState("");
    const [otpDisabled, setOtpDisabled] = useState(true);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    // Add this function after the fetchProfile function
    const fetchMasterData = async () => {
        try {
            // Fetch masters data
            const mastersResponse = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/employee/masters`,
                {},
                {
                    headers: {
                        compcode: user?.Comp_Code,
                        name: user?.name,
                    },
                }
            );
            // Fetch occupations data
            const occupationsResponse = await axios.get(
                `${process.env.NEXT_PUBLIC_URL}/mobile/GetOccupations`,
                {
                    headers: {
                        compcode: user?.Comp_Code,
                        name: user?.name,
                    },
                }
            );
            // Fetch employee data for Marital Status if needed
            const employeeResponse = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/employee/findallemp`,
                {
                    branch: user?.branch,
                },
                {
                    headers: {
                        compcode: user?.Comp_Code,
                        name: user?.name,
                    },
                }
            );
            const convertValuesToString = (array) => {
                if (!array || !Array.isArray(array)) return [];
                return array.map((obj) => {
                    return {
                        label: obj.label || obj.Misc_Name || obj.name || String(obj),
                        value: String(obj.value || obj.Misc_Code || obj.id || obj),
                    };
                });
            };
            const masters = mastersResponse.data?.data || mastersResponse.data?.Result || {};
            const occupations = occupationsResponse.data?.Result || occupationsResponse.data?.data || [];
            const employeeData = employeeResponse.data?.data || employeeResponse.data?.Result || {};
            console.log("Masters data:", masters);
            console.log("Occupations data:", occupations);
            console.log("Employee data:", employeeData);
            // Set City options
            if (masters.CITY && Array.isArray(masters.CITY)) {
                setCityOptions(convertValuesToString(masters.CITY));
            }
            // Set State options
            if (masters.STATE && Array.isArray(masters.STATE)) {
                setStateOptions(convertValuesToString(masters.STATE));
            }
            // Set Occupation options
            if (occupations && Array.isArray(occupations)) {
                const formattedOccupations = occupations.map((item) => ({
                    label: item.Misc_Name || item.name || String(item),
                    value: String(item.Misc_Code || item.id || item)
                }));
                setOccupationOptions(formattedOccupations);
            }
        } catch (error) {
            console.log("Error fetching master data:", error);
        }
    };
    const [photoUrl, setPhotoUrl] = useState("");
    const [photoPreview, setPhotoPreview] = useState("");
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [existingDocs, setExistingDocs] = useState<Record<DocKey, string>>({
        adhar: "", pan: "", salary: "", other: "",
    });
    const [docFiles, setDocFiles] = useState<Record<DocKey, File | null>>({
        adhar: null, pan: null, salary: null, other: null,
    });
    const [formData, setFormData] = useState<ProfileFormData>(emptyForm);
    const [empDocs, setEmpDocs] = useState<any[]>([]);
    const [occupationOptions, setOccupationOptions] = useState<Array<{ value: string; label: string }>>([]);
    const getProfileSummary = () => {
        const sections = [
            {
                title: "Basic Information",
                fields: [
                    { label: "Employee Code", value: formData.empCode || "—" },
                    { label: "Employee Name", value: formData.empName || "—" },
                    { label: "Designation", value: formData.employeedesignation || "—" },
                    { label: "Mobile Number", value: formData.mobileNo || "—" },
                    { label: "Landline Number", value: formData.landlineNumber || "—" },
                    { label: "Company Email", value: formData.coporateMailId || "—" },
                    { label: "Personal Email", value: formData.alternateMailId || "—" },
                    { label: "Gender", value: formData.gender || "—" },
                    { label: "Date of Birth", value: formData.dob || "—" },
                    { label: "Marital Status", value: formData.maritialStatus || "—" },
                    { label: "Date of Marriage", value: formData.dom || "—" },
                    { label: "Blood Group", value: formData.bloodGroup || "—" },
                ]
            },
            {
                title: "Family Details",
                fields: [
                    { label: "Father's Name", value: formData.fatherName || "—" },
                    { label: "Father's Occupation", value: formData.fatherOccupation || "—" },
                    { label: "Father's Mobile", value: formData.fatherMobile || "—" },
                    { label: "Mother's Name", value: formData.motherName || "—" },
                    { label: "Mother's Mobile", value: formData.motherMobile || "—" },
                    { label: "Spouse's Name", value: formData.spouseName || "—" },
                    { label: "Spouse's Gender", value: formData.spouseGender || "—" },
                    { label: "Spouse's Mobile", value: formData.spouseMobile || "—" },
                    { label: "Sibling's Name", value: formData.siblingName || "—" },
                    { label: "Sibling's Contact", value: formData.siblingContactNumber || "—" },
                    { label: "Emergency Contact Name", value: formData.emergencyName || "—" },
                    { label: "Emergency Contact Number", value: formData.emergencyNumber || "—" },
                ]
            },
            {
                title: "Identity & Documents",
                fields: [
                    { label: "PAN Number", value: formData.panNo || "—" },
                    { label: "PAN Verified", value: formData.panCardVer ? "✅ Yes" : "❌ No" },
                    { label: "PAN Name Match", value: formData.panNameMatchVer ? "✅ Yes" : "❌ No" },
                    { label: "Aadhaar Linked to PAN", value: formData.aadhaarLinkedVer ? "✅ Yes" : "❌ No" },
                    { label: "Aadhaar Number", value: formData.adharNo || "—" },
                    { label: "Aadhaar Verified", value: formData.aadhaarCardVer ? "✅ Yes" : "❌ No" },
                    { label: "Passport Number", value: formData.passportNo || "—" },
                    { label: "Passport Expiry", value: formData.passportExpiryDate || "—" },
                    { label: "PF (UAN) Number", value: formData.pfNumber || "—" },
                    { label: "ESI Number", value: formData.esiNumber || "—" },
                    { label: "LIN Number", value: formData.LIN_NO || "—" },
                    { label: "Driving License", value: formData.driving_licence || "—" },
                ]
            },
            {
                title: "Address Details",
                fields: [
                    { label: "Permanent Address Line 1", value: formData.pAddress1 || "—" },
                    { label: "Permanent Address Line 2", value: formData.pAddress2 || "—" },
                    { label: "Permanent City", value: formData.pCity || "—" },
                    { label: "Permanent State", value: formData.pState || "—" },
                    { label: "Permanent Pincode", value: formData.pPinCode || "—" },
                    { label: "Current Address Line 1", value: formData.cAddress1 || "—" },
                    { label: "Current Address Line 2", value: formData.cAddress2 || "—" },
                    { label: "Current City", value: formData.cCity || "—" },
                    { label: "Current State", value: formData.cState || "—" },
                    { label: "Current Pincode", value: formData.cPincode || "—" },
                    { label: "Same as Permanent", value: sameAsPermanent ? "✅ Yes" : "❌ No" },
                ]
            },
            {
                title: "Previous Employment",
                fields: [
                    { label: "Has Previous Employment", value: hasPreviousCompany ? "✅ Yes" : "❌ No" },
                    ...(hasPreviousCompany ? [
                        { label: "Previous Company Name", value: formData.previousCompanyName || "—" },
                        { label: "Company City", value: formData.pCompanyCity || "—" },
                        { label: "Company Contact", value: formData.pCompanyContactNumber || "—" },
                        { label: "Designation", value: formData.pDesignation || "—" },
                        { label: "Joining Date", value: formData.pJoiningDate || "—" },
                        { label: "End Date", value: formData.preEndDate || "—" },
                    ] : [])
                ]
            },
            {
                title: "Other Details",
                fields: [
                    { label: "Skills", value: formData.skills || "—" },
                    { label: "Basic Qualification", value: formData.basicQualification || "—" },
                    { label: "Professional Qualification", value: formData.professionalQualification || "—" },
                    { label: "Languages Known", value: formData.languageDetails || "—" },
                    { label: "Children Details", value: formData.childrenDetails || "—" },
                    { label: "Religion", value: formData.religion || "—" },
                    { label: "Height", value: formData.empHeight ? `${formData.empHeight} cm` : "—" },
                    { label: "Weight", value: formData.empWeight ? `${formData.empWeight} kg` : "—" },
                ]
            },
            {
                title: "Documents Status",
                fields: [
                    { label: "Aadhaar Document", value: existingDocs.adhar ? "✅ Uploaded" : "❌ Not Uploaded" },
                    { label: "PAN Document", value: existingDocs.pan ? "✅ Uploaded" : "❌ Not Uploaded" },
                    { label: "Salary Slip", value: existingDocs.salary ? "✅ Uploaded" : "❌ Not Uploaded" },
                    { label: "Other Document", value: existingDocs.other ? "✅ Uploaded" : "❌ Not Uploaded" },
                    { label: "Profile Photo", value: photoUrl || photoPreview ? "✅ Uploaded" : "❌ Not Uploaded" },
                ]
            }
        ];
        return sections;
    };
    const tabs = [
        { id: "basic", label: "Basic", icon: User, color: "text-primary" },
        { id: "family", label: "Family", icon: Users, color: "text-[#67E8F9]" },
        { id: "identity", label: "Identity", icon: CreditCard, color: "text-green" },
        { id: "address", label: "Address", icon: MapPin, color: "text-exit" },
        { id: "employment", label: "Previous Employment", icon: Briefcase, color: "text-[#A78BFA]" },
        { id: "other", label: "Other Details", icon: Settings, color: "text-yellow" },
        { id: "documents", label: "Documents", icon: FileText, color: "text-[#D8B4FE]" },
    ];
    useEffect(() => {
        if (user?.EMPCODE && user?.Comp_Code) {
            fetchProfile();
            fetchMasterData();
        }
    }, [user?.EMPCODE, user?.Comp_Code]);
    const fetchProfile = async () => {
        setLoading(true);
        try {
            const result = await axios.get(`${process.env.NEXT_PUBLIC_URL}/mobile/getEmpProfile`,
                {
                    params: {
                        empCode: user?.EMPCODE,
                        is_edit: "1",
                    },
                    headers: {
                        compcode: user?.Comp_Code,
                        name: user?.name,
                    },
                });
            if (result.data?.Status) {
                const d = result.data.Result || {};
                console.log("d.other =", d.other);
                if (d.EmpDocs && Array.isArray(d.EmpDocs)) {
                    setEmpDocs(d.EmpDocs);
                }
                setFormData({
                    empCode: d.empcode || user?.EMPCODE,
                    employeedesignation: d.employeedesignation || "",
                    empName: d.empfirstname || d.empname || "",
                    mobileNo: d.mobileno || "",
                    landlineNumber: d.landline_no || d.landlineno || "",
                    coporateMailId: d.corporatemailid || "",
                    alternateMailId: d.alternet_mail || "",
                    gender: getDisplayValue(d.gender, { "Male": "Male", "Female": "Female", "Other": "Other" }),
                    dob: d.dob ? toInputDate(d.dob) : "",
                    maritialStatus: getDisplayValue(d.marital_status || d.maritalstatus, MARITAL_STATUS_MAP),
                    dom: d.dom ? toInputDate(d.dom) : "",
                    bloodGroup: getDisplayValue(d.bloodgroup, {
                        "A+": "A+", "A-": "A-", "B+": "B+", "B-": "B-",
                        "AB+": "AB+", "AB-": "AB-", "O+": "O+", "O-": "O-"
                    }),
                    skills: d.skills || "",
                    basicQualification: d.basicqualification || "",
                    professionalQualification: d.professionalqualification || "",
                    religion: getDisplayValue(d.relcode || d.religion, RELIGION_MAP),
                    driving_licence: d.driving_licence || "",
                    empHeight: d.empheight ? String(d.empheight) : "",
                    empWeight: d.empweight ? String(d.empweight) : "",
                    childrenDetails: d.children_detail || "",
                    languageDetails: d.language_detail || "",
                    fatherName: d.fathername || "",
                    fatherOccupation: d.fatheroccupation ? String(d.fatheroccupation) : "",
                    fatherMobile: d.father_mob || d.fathercontactno || "",
                    motherName: d.mothername || "",
                    motherMobile: d.mother_mob || d.mothercontactno || "",
                    spouseName: d.spousename || "",
                    spouseGender: getDisplayValue(d.spousegender, { "Male": "Male", "Female": "Female" }),
                    spouseMobile: d.spouse_mob || d.spousecontactno || "",
                    siblingName: d.siblingname || "",
                    siblingContactNumber: d.siblingcontactno || "",
                    emergencyName: d.emergencyname || "",
                    emergencyNumber: d.emergencyno || "",
                    panNo: d.panno || "",
                    adharNo: d.adharno || d.uid_no || "",
                    passportNo: d.passportno || "",
                    passportExpiryDate: d.passexpirydate || d.passport_expdate ? toInputDate(d.passexpirydate || d.passport_expdate) : "",
                    pfNumber: d.pfnumber || d.pfno || "",
                    esiNumber: d.esinumber || d.esino || "",
                    LIN_NO: d.lin_no || "",
                    pAddress1: d.permanentaddress1 || "",
                    pAddress2: d.permanentaddress2 || "",
                    pCity: d.pcity ? String(d.pcity) : "",
                    pState: d.pstate ? String(d.pstate) : "",
                    pPinCode: d.ppincode || "",
                    cAddress1: d.currentaddress1 || "",
                    cAddress2: d.currentaddress2 || "",
                    cCity: d.ccity ? String(d.ccity) : "",
                    cState: d.cstate ? String(d.cstate) : "",
                    cPincode: d.cpincode || "",
                    previousCompanyName: d.previouscompanyname || "",
                    pCompanyCity: d.precompcity ? String(d.precompcity) : "",
                    pCompanyContactNumber: d.precompcontactno || "",
                    pJoiningDate: d.prejoiningdate ? toInputDate(d.prejoiningdate) : "",
                    preEndDate: d.preenddate ? toInputDate(d.preenddate) : "",
                    pDesignation: d.predesignation || "",
                    panCardVer: String(d.pan_card_ver) === "true" || Number(d.pan_card_ver) === 1,
                    aadhaarCardVer: String(d.aadhaar_card_ver) === "true" || Number(d.aadhaar_card_ver) === 1,
                    panNameMatchVer: String(d.pan_name_match_ver) === "true" || Number(d.pan_name_match_ver) === 1,
                    aadhaarLinkedVer: String(d.aadhaar_linked_ver) === "true" || Number(d.aadhaar_linked_ver) === 1,
                    aadhaarLinkedPanVar: String(d.aadhaar_linked_pan_var) === "true" || Number(d.aadhaar_linked_pan_var) === 1,
                });
                let profilePhoto = "";
                profilePhoto = d.profile
                    ? d.profile.replace("http://localhost:5000", "https://erp.autovyn.com/backend")
                    : "";
                if (!profilePhoto && d.EmpDocs && Array.isArray(d.EmpDocs)) {
                    const profileDoc = d.EmpDocs.find((doc: any) => doc.Seq_No === 1);
                    if (profileDoc && profileDoc.DOC_PATH) {
                        const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:5000";
                        profilePhoto = `${baseUrl}/fetch?filePath=${encodeURIComponent(profileDoc.DOC_PATH)}`;
                    }
                }
                setPhotoUrl(profilePhoto);
                const getDocUrl = (docType: DocKey, directUrl: string) => {
                    const validUrl = getValidDocumentUrl(directUrl);
                    if (validUrl) {
                        return validUrl.replace("http://localhost:5000", "https://erp.autovyn.com/backend");
                    }
                    if (d.EmpDocs && Array.isArray(d.EmpDocs)) {
                        const docMap: Record<DocKey, number> = {
                            adhar: 2,
                            pan: 3,
                            salary: 4,
                            other: 5
                        };
                        const targetSeq = docMap[docType];
                        const found = d.EmpDocs.find((doc: any) =>
                            doc.Seq_No === targetSeq || doc.misspunch_inout === targetSeq
                        );
                        if (found && found.DOC_PATH) {
                            const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:5000";
                            return `${baseUrl}/fetch?filePath=${encodeURIComponent(found.DOC_PATH)}`;
                        }
                    }
                    return "";
                };
                setExistingDocs({
                    adhar: getDocUrl("adhar", d.adhar),
                    pan: getDocUrl("pan", d.pan),
                    salary: getDocUrl("salary", d.salary),
                    other: getDocUrl("other", d.other),
                });
                console.log("existing other =", getDocUrl("other", d.other));
                setHasPreviousCompany(Boolean(d.previouscompanyname));
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };
    const verifyPan = async () => {
        const panNo = formData.panNo?.trim().toUpperCase();
        if (!panNo) {
            showSideAlert("Please Enter Pan Number", "warning");
            return;
        }
        const isValidPAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNo);
        if (!isValidPAN) {
            showSideAlert("Invalid PAN Card No. Format should be ABCDE1234F", "warning");
            return;
        }
        if (!formData.empName) {
            showSideAlert("Please Enter Employee Name", "warning");
            return;
        }
        if (!formData.dob) {
            showSideAlert("Please Enter Date Of Birth (DOB)", "warning");
            return;
        }
        setIsVerifying(true);
        try {
            if (compdata?.Digilocker_Linked == "2") {
                const fullName = formData.empName.trim();
                const result = await axios.post(
                    `${process.env.NEXT_PUBLIC_URL}/panAndAdharApi/ValidateIdtoAi`,
                    {
                        api_name: "pan_nsdl",
                        payload: {
                            pan_number: panNo,
                            name: fullName,
                            dob: formData.dob
                        },
                        refresh: false
                    },
                    {
                        headers: { compcode: user?.Comp_Code, name: user?.name },
                    }
                );
                const res = result?.data?.data;
                setPanInfo(res);
                if (res?.status == "success") {
                    setFormData(prev => ({
                        ...prev,
                        panCardVer: true,
                        panNameMatchVer: Boolean(res?.name_match),
                        aadhaarLinkedVer: Boolean(res?.aadhaar_seeding),
                    }));
                    showSideAlert("PAN Card Verified successfully", "success");
                } else {
                    setFormData(prev => ({
                        ...prev,
                        panCardVer: false,
                        panNameMatchVer: false,
                        aadhaarLinkedVer: false,
                    }));
                    showSideAlert("Invalid PAN Card Number", "warning");
                }
            } else {
                const fullName = formData.empName.trim();
                const result = await axios.post(
                    `${process.env.NEXT_PUBLIC_URL}/panAndAdharApi/validate`,
                    {
                        value: panNo,
                        name_as_per_pan: fullName,
                        date_of_birth: formData.dob,
                        option: "10",
                    },
                    {
                        headers: { compcode: user?.Comp_Code, name: user?.name },
                    }
                );
                const res = result?.data?.data;
                setPanInfo(res);
                if (res?.status == "valid") {
                    setFormData(prev => ({
                        ...prev,
                        panCardVer: true,
                        panNameMatchVer: res.name_as_per_pan_match || false,
                        aadhaarLinkedVer: res.aadhaar_seeding_status === "y" || false,
                    }));
                    showSideAlert("PAN Card Verified successfully", "success");
                } else {
                    setFormData(prev => ({
                        ...prev,
                        panCardVer: false,
                        panNameMatchVer: false,
                        aadhaarLinkedVer: false,
                    }));
                    showSideAlert("Invalid PAN Card Number", "warning");
                }
            }
        } catch (error: any) {
            console.error("PAN Verification Error:", error);
            if (error?.response?.data?.error?.detail) {
                showSideAlert(`${error?.response?.data?.error?.detail?.details}`, "error");
            } else {
                showSideAlert("PAN Verification Failed", "error");
            }
        } finally {
            setIsVerifying(false);
        }
    };
    const verifyAadhaar = async () => {
        const aadhaarNo = formData.adharNo?.trim();
        if (!aadhaarNo) {
            showSideAlert("Please enter Aadhaar number first", "warning");
            return;
        }
        if (!/^\d{12}$/.test(aadhaarNo)) {
            showSideAlert("Aadhaar number must be exactly 12 digits", "warning");
            return;
        }
        if (!formData.mobileNo) {
            showSideAlert("Please enter Mobile Number first", "warning");
            return;
        }
        setIsVerifying(true);
        try {
            const result = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/panAndAdharApi/validate`,
                {
                    value: aadhaarNo,
                    option: "8",
                },
                {
                    headers: { compcode: user?.Comp_Code, name: user?.name },
                }
            );
            const res = result?.data?.data;
            console.log("Aadhaar Verification Response:", res);
            if (res && (res.photo || res.full_address)) {
                setAadhaarInfo(res);
                setFormData(prev => ({
                    ...prev,
                    aadhaarCardVer: true,
                    pAddress1: res.full_address || prev.pAddress1,
                }));
                showSideAlert("Aadhaar Verified successfully", "success");
            }
            else if (res?.reference_id) {
                showSideAlert(res?.message || "OTP sent successfully. Please enter OTP to verify.", "success");
                setAadhaarInfo(res);
                setAadhaarRefId(res.reference_id?.toString()); // ← ADD
                setOtpDisabled(false); // ← ADD
            } else {
                try {
                    const digiRes = await axios.post(
                        `${process.env.NEXT_PUBLIC_URL}/panAndAdharApi/ValidateDigilockerAadhaar`,
                        {
                            api_name: "digilocker_initiate_session",
                            payload: {
                                redirect_to_signup: "true",
                                redirect_url: `${process.env.NEXT_PUBLIC_URL}/panAndAdharApi/digilocker/callback/${btoa(`${user?.Comp_Code}__${aadhaarNo}`)}`,
                                consent_purpose: "true",
                                consent: "true"
                            },
                            mobile: formData.mobileNo,
                            aadhaar_number: aadhaarNo
                        },
                        {
                            headers: { compcode: user?.Comp_Code, name: user?.name },
                        }
                    );
                    const digilockerUrl = digiRes?.data?.data?.url;
                    if (digilockerUrl) {
                        showSideAlert("Please complete verification via Digilocker", "success");
                        window.open(digilockerUrl, "_blank", "width=500,height=700");
                    } else if (digiRes?.data?.aadhaar_photo_base64 || digiRes?.data?.full_address) {
                        setAadhaarInfo(digiRes.data);
                        setFormData(prev => ({
                            ...prev,
                            aadhaarCardVer: true,
                            pAddress1: digiRes.data.full_address || prev.pAddress1,
                        }));
                        showSideAlert("Aadhaar Verified successfully via Digilocker", "success");
                    } else {
                        showSideAlert("Aadhaar verification failed. Please try again.", "error");
                    }
                } catch (digiError) {
                    console.error("Digilocker Error:", digiError);
                    showSideAlert("Both verification methods failed. Please try again.", "error");
                }
            }
        } catch (error) {
            console.error("Aadhaar Verification Error:", error);
            showSideAlert("Aadhaar Verification Failed", "error");
        } finally {
            setIsVerifying(false);
        }
    };
    // verify otp
    const verifyAadhaarOtp = async () => {
        if (!aadhaarRefId || !aadhaarOtp) {
            showSideAlert("Please enter OTP", "warning");
            return;
        }
        setIsVerifyingOtp(true);
        try {
            const result = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/panAndAdharApi/validate`,
                {
                    value: formData.adharNo,
                    ref_id: aadhaarRefId,
                    otp: aadhaarOtp,
                    option: "9",
                },
                {
                    headers: { compcode: user?.Comp_Code, name: user?.name },
                }
            );
            const res = result?.data?.data;
            setAadhaarInfo(res);
            if (res?.status?.toLowerCase() === "valid") {
                // Success case
                setFormData(prev => ({
                    ...prev,
                    aadhaarCardVer: true,
                    pAddress1: res.full_address || prev.pAddress1,
                }));
                setOtpDisabled(true);
                setAadhaarRefId(null);
                setAadhaarOtp("");
                showSideAlert(res?.message || "OTP Verified successfully", "success");
            } else {
                // Any non-valid status/message → invalid
                setFormData(prev => ({
                    ...prev,
                    aadhaarCardVer: false,
                }));
                showSideAlert(res?.message || "Invalid OTP", "warning");
            }
        } catch (error) {
            console.error("OTP Verification Error:", error);
            showSideAlert("OTP Verification Failed", "error");
        } finally {
            setIsVerifyingOtp(false);
        }
    };
    // Update the saveProfile function in your EditEmployeeProfile component
    const saveProfile = async () => {
        if (!formData.mobileNo) {
            Swal.fire({ icon: "warning", title: "Missing Field!", text: "Mobile number is required." });
            setExpandedTab("basic");
            return;
        }
        setSaving(true);
        try {
            const fd = new FormData();
            // Add ALL required fields that the backend expects
            // These must match the backend's destructuring order
            const fieldsToSend = {
                pAddress1: formData.pAddress1 || "",
                pAddress2: formData.pAddress2 || "",
                pCity: formData.pCity || "",
                pPinCode: formData.pPinCode || "",
                pState: formData.pState || "",
                cAddress1: formData.cAddress1 || "",
                cAddress2: formData.cAddress2 || "",
                cCity: formData.cCity || "",
                cPincode: formData.cPincode || "",
                cState: formData.cState || "",
                mobileNo: formData.mobileNo || "",
                emergencyName: formData.emergencyName || "",
                emergencyNumber: formData.emergencyNumber || "",
                panNo: formData.panNo || "",
                passportNo: formData.passportNo || "",
                passportExpiryDate: formData.passportExpiryDate || "",
                bloodGroup: formData.bloodGroup || "",
                dob: formData.dob || "",
                gender: formData.gender || "",
                maritialStatus: formData.maritialStatus || "",
                dom: formData.dom || "",
                skills: formData.skills || "",
                basicQualification: formData.basicQualification || "",
                professionalQualification: formData.professionalQualification || "",
                fatherName: formData.fatherName || "",
                fatherOccupation: formData.fatherOccupation || "",
                motherName: formData.motherName || "",
                spouseName: formData.spouseName || "",
                spouseGender: formData.spouseGender || "",
                siblingName: formData.siblingName || "",
                siblingContactNumber: formData.siblingContactNumber || "",
                previousCompanyName: formData.previousCompanyName || "",
                pCompanyCity: formData.pCompanyCity || "",
                pCompanyContactNumber: formData.pCompanyContactNumber || "",
                pJoiningDate: formData.pJoiningDate || "",
                preEndDate: formData.preEndDate || "",
                pDesignation: formData.pDesignation || "",
                coporateMailId: formData.coporateMailId || "",
                dLicenseIssueDate: "", // Add this if not in your form
                dLicenseIssuePlace: "", // Add this if not in your form
                empHeight: formData.empHeight || "",
                empWeight: formData.empWeight || "",
                alternateMailId: formData.alternateMailId || "",
                childrenDetails: formData.childrenDetails || "",
                languageDetails: formData.languageDetails || "",
                adharNo: formData.adharNo || "",
                pfNumber: formData.pfNumber || "",
                esiNumber: formData.esiNumber || "",
                landlineNumber: formData.landlineNumber || "",
                fatherMobile: formData.fatherMobile || "",
                motherMobile: formData.motherMobile || "",
                spouseMobile: formData.spouseMobile || "",
                relCode: formData.religion || "",
                driving_licence: formData.driving_licence || "",
                empCode: user?.EMPCODE || "",
                LIN_NO: formData.LIN_NO || "",
                faceEmbedding: "", // Add this empty string to satisfy the backend
            };
            // Append all fields to FormData
            Object.entries(fieldsToSend).forEach(([key, value]) => {
                fd.append(key, String(value));
            });
            // Add verification flags
            fd.append("pan_card_ver", formData.panCardVer ? "true" : "false");
            fd.append("aadhaar_card_ver", formData.aadhaarCardVer ? "true" : "false");
            fd.append("pan_name_match_ver", formData.panNameMatchVer ? "true" : "false");
            fd.append("aadhaar_linked_ver", formData.aadhaarLinkedVer ? "true" : "false");
            fd.append("aadhaar_linked_pan_var", formData.aadhaarLinkedPanVar ? "true" : "false");
            // Add files if they exist
            if (photoFile) fd.append(FIELD_NAMES.profile, photoFile);
            if (docFiles.adhar) fd.append(FIELD_NAMES.adhar, docFiles.adhar);
            if (docFiles.pan) fd.append(FIELD_NAMES.pan, docFiles.pan);
            if (docFiles.salary) fd.append(FIELD_NAMES.salary, docFiles.salary);
            if (docFiles.other) fd.append(FIELD_NAMES.other, docFiles.other);
            for (const [key, value] of fd.entries()) {
                console.log(key, value);
            }
            console.log(docFiles, "DOCFILES");
            const result = await axios.post(UPDATE_PROFILE_URL, fd, {
                params:{
                    Loc_Code:user?.branch
                },
                headers: {
                    compcode: user?.Comp_Code,
                    name: user?.name,
                    "Content-Type": "multipart/form-data",
                },
            });
            if (result.data?.Status) {
                Swal.fire({
                    icon: "success",
                    title: "Success!",
                    text: result.data.Message || "Profile updated successfully",
                    timer: 2000,
                    showConfirmButton: false,
                }).then(() => {
                    setPhotoFile(null);
                    setDocFiles({ adhar: null, pan: null, salary: null, other: null });
                    fetchProfile();
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error!",
                    text: result.data?.Message || "Failed to update profile"
                });
            }
        } catch (error: any) {
            console.log("Error saving profile:", error);
            Swal.fire({
                icon: "error",
                title: "Error!",
                text: error?.response?.data?.Message || "Something went wrong!"
            });
        } finally {
            setSaving(false);
        }
    };
    const setField = (name: keyof ProfileFormData, value: string | boolean) => {
        setFormData((prev) => {
            const next = { ...prev, [name]: value };
            if (sameAsPermanent) {
                if (name === "pAddress1") next.cAddress1 = value as string;
                if (name === "pAddress2") next.cAddress2 = value as string;
                if (name === "pCity") next.cCity = value as string;
                if (name === "pState") next.cState = value as string;
                if (name === "pPinCode") next.cPincode = value as string;
            }
            return next;
        });
    };
    const handleSameAsPermanentToggle = () => {
        const checked = !sameAsPermanent;
        setSameAsPermanent(checked);
        if (checked) {
            setFormData((prev) => ({
                ...prev,
                cAddress1: prev.pAddress1,
                cAddress2: prev.pAddress2,
                cCity: prev.pCity,
                cState: prev.pState,
                cPincode: prev.pPinCode,
            }));
        }
    };
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };
    const renderToggle = (value: boolean, onChange: () => void) => {
        return (
            <button onClick={onChange} className="focus:outline-none transition-all hover:scale-105">
                {value ? (
                    <ToggleRight className="w-10 h-10 text-primary" />
                ) : (
                    <ToggleLeft className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                )}
            </button>
        );
    };
    const inputClass =
        "w-full border border-borderColor dark:border-borderColor-dark rounded-lg px-4 py-2 bg-white dark:bg-dark text-black dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all";
    const toggleTab = (tabId: string) => {
        setExpandedTab(expandedTab === tabId ? null : tabId);
    };
    // Custom Select component for dropdowns
    const SelectDropdown = ({
        options,
        value,
        onChange,
        placeholder = "Select an option",
        className = ""
    }: {
        options: { value: string; label: string }[],
        value: string,
        onChange: (val: string) => void,
        placeholder?: string,
        className?: string
    }) => {
        return (
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`${inputClass} ${className}`}
            >
                <option value="">{placeholder}</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        );
    };
    const renderTabContent = () => {
        switch (expandedTab) {
            case "basic":
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Ainput title="Mobile Number" type="text" name="mobileNo" value={formData.mobileNo} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} redlabel="" />
                            <Ainput title="Landline Number" type="text" name="landlineNumber" value={formData.landlineNumber} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Ainput title="Company Email" type="email" name="coporateMailId" value={formData.coporateMailId} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                            <Ainput title="Personal Email" type="email" name="alternateMailId" value={formData.alternateMailId} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-header dark:text-white mb-2 uppercase tracking-wider">Gender</label>
                                <SelectDropdown
                                    options={GENDER_OPTIONS}
                                    value={formData.gender}
                                    onChange={(val) => setField("gender", val)}
                                    placeholder="Select Gender"
                                />
                            </div>
                            <Ainput title="Date of Birth" type="date" name="dob" value={formData.dob} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-header dark:text-white mb-2 uppercase tracking-wider">Marital Status</label>
                                <SelectDropdown
                                    options={MARITAL_STATUS_OPTIONS}
                                    value={formData.maritialStatus}
                                    onChange={(val) => setField("maritialStatus", val)}
                                    placeholder="Select Status"
                                />
                            </div>
                            <Ainput title="Date of Marriage" type="date" name="dom" value={formData.dom} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-header dark:text-white mb-2 uppercase tracking-wider">Blood Group</label>
                            <SelectDropdown
                                options={BLOOD_GROUP_OPTIONS}
                                value={formData.bloodGroup}
                                onChange={(val) => setField("bloodGroup", val)}
                                placeholder="Select Blood Group"
                            />
                        </div>
                    </div>
                );
            case "family":
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Ainput title="Father's Name" type="text" name="fatherName" value={formData.fatherName} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                            <Ainput title="Father's Mobile" type="text" name="fatherMobile" value={formData.fatherMobile} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-header dark:text-white mb-2 uppercase tracking-wider">Father's Occupation</label>
                            <SelectDropdown
                                options={occupationOptions.length > 0 ? occupationOptions : []}
                                value={formData.fatherOccupation}
                                onChange={(val) => setField("fatherOccupation", val)}
                                placeholder="Select Occupation"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Ainput title="Mother's Name" type="text" name="motherName" value={formData.motherName} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                            <Ainput title="Mother's Mobile" type="text" name="motherMobile" value={formData.motherMobile} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Ainput title="Spouse's Name" type="text" name="spouseName" value={formData.spouseName} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                            <Ainput title="Spouse's Mobile" type="text" name="spouseMobile" value={formData.spouseMobile} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-header dark:text-white mb-2 uppercase tracking-wider">Spouse's Gender</label>
                            <SelectDropdown
                                options={GENDER_OPTIONS.slice(0, 2)}
                                value={formData.spouseGender}
                                onChange={(val) => setField("spouseGender", val)}
                                placeholder="Select Gender"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Ainput title="Sibling's Name" type="text" name="siblingName" value={formData.siblingName} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                            <Ainput title="Sibling's Mobile" type="text" name="siblingContactNumber" value={formData.siblingContactNumber} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-off dark:bg-dark border-2 border-primary/30 rounded">
                            <Ainput title="Emergency Contact Name" type="text" name="emergencyName" value={formData.emergencyName} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} redlabel="" />
                            <Ainput title="Emergency Contact Number" type="text" name="emergencyNumber" value={formData.emergencyNumber} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} redlabel="" />
                        </div>
                    </div>
                );
            case "identity":
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <div>
                            <label className="block text-sm font-bold text-header dark:text-white mb-2 uppercase tracking-wider">PAN Number</label>
                            <div className="flex flex-wrap gap-2">
                                <input
                                    type="text"
                                    value={formData.panNo}
                                    onChange={(e) => setField("panNo", e.target.value.toUpperCase())}
                                    className={inputClass + " flex-1 min-w-[150px]"}
                                    maxLength={10}
                                />
                                <Button
                                    variant="save"
                                    onClick={verifyPan}
                                    disabled={isVerifying}
                                    className="h-10 px-4 text-sm"
                                >
                                    {isVerifying ? "Verifying..." : "Verify PAN"}
                                </Button>
                                <span className={`shrink-0 inline-flex items-center gap-1 px-4 rounded-lg text-xs font-bold border-2 ${formData.panCardVer ? 'bg-green/10 text-green border-green/30' : 'bg-yellow/10 text-yellow border-yellow/30'}`}>
                                    {formData.panCardVer ? (
                                        <><ShieldCheck className="w-4 h-4" /> Verified</>
                                    ) : (
                                        <><ShieldAlert className="w-4 h-4" /> Not Verified</>
                                    )}
                                </span>
                            </div>
                            {formData.panCardVer && (
                                <div className="mt-2 flex flex-wrap gap-3">
                                    <span className={`text-xs font-medium ${formData.panNameMatchVer ? 'text-green' : 'text-yellow'}`}>
                                        Name Match: {formData.panNameMatchVer ? '✓' : '✗'}
                                    </span>
                                    <span className={`text-xs font-medium ${formData.aadhaarLinkedVer ? 'text-green' : 'text-yellow'}`}>
                                        Aadhaar Linked: {formData.aadhaarLinkedVer ? '✓' : '✗'}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-header dark:text-white mb-2 uppercase tracking-wider">Aadhaar Number</label>
                            <div className="flex flex-wrap gap-2">
                                <input
                                    type="text"
                                    value={formData.adharNo}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 12) setField("adharNo", val);
                                    }}
                                    className={inputClass + " flex-1 min-w-[150px]"}
                                    maxLength={12}
                                />
                                <Button
                                    variant="save"
                                    onClick={verifyAadhaar}
                                    disabled={isVerifying}
                                    className="h-10 px-4 text-sm"
                                >
                                    {isVerifying ? "Verifying..." : "Verify Aadhaar"}
                                </Button>
                                {!otpDisabled && (
                                    <div className="mt-3 flex flex-wrap gap-2 items-center p-3 bg-off dark:bg-dark rounded-lg border-2 border-primary/30">
                                        <input
                                            type="text"
                                            value={aadhaarOtp}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, "");
                                                if (val.length <= 6) setAadhaarOtp(val);
                                            }}
                                            maxLength={6}
                                            placeholder="Enter 6-digit OTP"
                                            className={inputClass + " flex-1 min-w-[150px] text-center tracking-widest"}
                                        />
                                        <Button
                                            variant="save"
                                            onClick={verifyAadhaarOtp}
                                            disabled={isVerifyingOtp || aadhaarOtp.length !== 6}
                                            className="h-10 px-4 text-sm"
                                        >
                                            {isVerifyingOtp ? "Verifying..." : "Verify OTP"}
                                        </Button>
                                        <p className="w-full text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Enter the 6-digit OTP sent to the Aadhaar-linked mobile number
                                        </p>
                                    </div>
                                )}

                                <span className={`shrink-0 inline-flex items-center gap-1 px-4 rounded-lg text-xs font-bold border-2 ${formData.aadhaarCardVer ? 'bg-green/10 text-green border-green/30' : 'bg-yellow/10 text-yellow border-yellow/30'}`}>
                                    {formData.aadhaarCardVer ? (
                                        <><ShieldCheck className="w-4 h-4" /> Verified</>
                                    ) : (
                                        <><ShieldAlert className="w-4 h-4" /> Not Verified</>
                                    )}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Ainput title="Passport Number" type="text" name="passportNo" value={formData.passportNo} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                            <Ainput title="Passport Expiry" type="date" name="passportExpiryDate" value={formData.passportExpiryDate} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Ainput title="PF (UAN Number)" type="text" name="pfNumber" value={formData.pfNumber} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                            <Ainput title="ESI Number" type="text" name="esiNumber" value={formData.esiNumber} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Ainput title="LIN Number" type="text" name="LIN_NO" value={formData.LIN_NO} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                            <Ainput title="Driving License Number" type="text" name="driving_licence" value={formData.driving_licence} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                        </div>
                    </div>
                );
            case "address":
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <p className="text-sm font-bold text-header dark:text-white uppercase tracking-wider">Permanent Address</p>
                        <Ainput title="Address Line 1" type="text" name="pAddress1" value={formData.pAddress1} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                        <Ainput title="Address Line 2" type="text" name="pAddress2" value={formData.pAddress2} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-header dark:text-white mb-2 uppercase tracking-wider">City</label>
                                <SelectDropdown
                                    options={cityOptions.length > 0 ? cityOptions : []}
                                    value={formData.pCity}
                                    onChange={(val) => setField("pCity", val)}
                                    placeholder="Select City"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-header dark:text-white mb-2 uppercase tracking-wider">State</label>
                                <SelectDropdown
                                    options={stateOptions.length > 0 ? stateOptions : []}
                                    value={formData.pState}
                                    onChange={(val) => setField("pState", val)}
                                    placeholder="Select State"
                                />
                            </div>
                            <Ainput h={9} title="Pincode" type="text" name="pPinCode" value={formData.pPinCode} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                        </div>
                        <div className="flex items-center justify-between p-5 bg-off dark:bg-dark border-2 border-primary/30 rounded">
                            <div>
                                <p className="text-base font-bold text-black dark:text-white">Current Address Same As Permanent</p>
                                <p className="text-sm text-body-color mt-1">Enable to copy the permanent address below</p>
                            </div>
                            {renderToggle(sameAsPermanent, handleSameAsPermanentToggle)}
                        </div>
                        {!sameAsPermanent && (
                            <>
                                <p className="text-sm font-bold text-header dark:text-white uppercase tracking-wider">Current Address</p>
                                <Ainput title="Address Line 1" type="text" name="cAddress1" value={formData.cAddress1} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                                <Ainput title="Address Line 2" type="text" name="cAddress2" value={formData.cAddress2} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-header dark:text-white mb-2 uppercase tracking-wider">City</label>
                                        <SelectDropdown
                                            options={cityOptions.length > 0 ? cityOptions : []}
                                            value={formData.cCity}
                                            onChange={(val) => setField("cCity", val)}
                                            placeholder="Select City"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-header dark:text-white mb-2 uppercase tracking-wider">State</label>
                                        <SelectDropdown
                                            options={stateOptions.length > 0 ? stateOptions : []}
                                            value={formData.cState}
                                            onChange={(val) => setField("cState", val)}
                                            placeholder="Select State"
                                        />
                                    </div>
                                    <Ainput title="Pincode" type="text" name="cPincode" value={formData.cPincode} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                                </div>
                            </>
                        )}
                    </div>
                );
            case "employment":
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="flex items-center justify-between p-5 bg-off dark:bg-dark border-2 border-primary/30 rounded">
                            <div>
                                <p className="text-base font-bold text-black dark:text-white">I Have Previous Company Information</p>
                                <p className="text-sm text-body-color mt-1">Enable this only if applicable</p>
                            </div>
                            {renderToggle(hasPreviousCompany, () => setHasPreviousCompany(!hasPreviousCompany))}
                        </div>
                        {hasPreviousCompany && (
                            <>
                                <Ainput title="Previous Company Name" type="text" name="previousCompanyName" value={formData.previousCompanyName} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-header dark:text-white mb-2 uppercase tracking-wider">Company City</label>
                                        <SelectDropdown
                                            options={cityOptions.length > 0 ? cityOptions : []}
                                            value={formData.pCompanyCity}
                                            onChange={(val) => setField("pCompanyCity", val)}
                                            placeholder="Select City"
                                        />
                                    </div>
                                    <Ainput title="Contact Number" type="text" name="pCompanyContactNumber" value={formData.pCompanyContactNumber} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                                </div>
                                <Ainput title="Designation" type="text" name="pDesignation" value={formData.pDesignation} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Ainput title="Joining Date" type="date" name="pJoiningDate" value={formData.pJoiningDate} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                                    <Ainput title="End Date" type="date" name="preEndDate" value={formData.preEndDate} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                                </div>
                            </>
                        )}
                    </div>
                );
            case "other":
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <Ainput title="Skills" type="textarea" name="skills" value={formData.skills} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} rows={3} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Ainput title="Basic Qualification" type="text" name="basicQualification" value={formData.basicQualification} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                            <Ainput title="Professional Qualification" type="text" name="professionalQualification" value={formData.professionalQualification} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Ainput title="Languages Known" type="text" name="languageDetails" value={formData.languageDetails} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                            <Ainput title="Children Details" type="text" name="childrenDetails" value={formData.childrenDetails} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-header dark:text-white mb-2 uppercase tracking-wider">Religion</label>
                                <SelectDropdown
                                    options={RELIGION_OPTIONS}
                                    value={formData.religion}
                                    onChange={(val) => setField("religion", val)}
                                    placeholder="Select Religion"
                                />
                            </div>
                            <Ainput title="Height" type="text" name="empHeight" value={formData.empHeight} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} placeholder="cm" />
                            <Ainput title="Weight" type="text" name="empWeight" value={formData.empWeight} handleInputChange={(name, value) => setField(name as keyof ProfileFormData, value)} placeholder="kg" />
                        </div>
                    </div>
                );
            case "documents":
                return (
                    <div className="space-y-4 animate-fadeIn">
                        <DocRow label="Aadhaar Card" existingUrl={existingDocs.adhar} file={docFiles.adhar} onChange={(f) => setDocFiles((p) => ({ ...p, adhar: f }))} />
                        <DocRow label="PAN Card" existingUrl={existingDocs.pan} file={docFiles.pan} onChange={(f) => setDocFiles((p) => ({ ...p, pan: f }))} />
                        <DocRow label="Salary Slip" existingUrl={existingDocs.salary} file={docFiles.salary} onChange={(f) => setDocFiles((p) => ({ ...p, salary: f }))} />
                        <DocRow label="Other Document" existingUrl={existingDocs.other} file={docFiles.other} onChange={(f) => setDocFiles((p) => ({ ...p, other: f }))} />
                    </div>
                );
            default:
                return null;
        }
    };
    const PreviewModal = () => {
        const sections = getProfileSummary();
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                <div className="bg-white dark:bg-black rounded-xl border-2 border-primary/30 max-w-4xl w-full max-h-[90vh] flex flex-col">
                    <div className="flex items-center justify-between p-6 border-b border-borderColor dark:border-borderColor-dark">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Eye className="w-6 h-6 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold text-header dark:text-white">Profile Summary</h2>
                        </div>
                        <button
                            onClick={() => setShowPreviewModal(false)}
                            className="p-2 hover:bg-off dark:hover:bg-dark rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* {/* Employee Photo /} */}
<div className="flex items-center gap-4 p-4 bg-off dark:bg-dark rounded-lg">
<div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary">
{photoPreview ? (
<img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
) : photoUrl ? (
<img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
) : (
<div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
<User className="w-8 h-8 text-gray-400" />
</div>
)}
</div>
<div>
<p className="text-lg font-bold text-header dark:text-white">{formData.empName || "Employee"}</p>
<p className="text-sm text-body-color">Emp Code: {formData.empCode || "—"}</p>
<p className="text-sm text-body-color">Designation: {formData.employeedesignation || "—"}</p>
</div>
</div>
{/* {/* Sections /} */}
{sections.map((section, idx) => (
<div key={idx} className="border border-borderColor dark:border-borderColor-dark rounded-lg overflow-hidden">
<div className="bg-primary/5 dark:bg-primary/10 px-4 py-3 border-b border-borderColor dark:border-borderColor-dark">
<h3 className="font-bold text-header dark:text-white">{section.title}</h3>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4">
{section.fields.map((field, fIdx) => (
<div key={fIdx} className="flex items-start gap-2 p-2 hover:bg-off/50 dark:hover:bg-dark/50 rounded transition-colors">
<span className="text-sm font-medium text-body-color min-w-[140px]">{field.label}:</span>
<span className="text-sm text-black dark:text-white break-words flex-1">
{field.value}
</span>
</div>
))}
</div>
</div>
))}
</div>
<div className="flex items-center justify-between p-6 border-t border-borderColor dark:border-borderColor-dark">
<p className="text-sm text-body-color">
Total Fields: {sections.reduce((acc, sec) => acc + sec.fields.length, 0)}
</p>
<div className="flex gap-3">
<Button variant="cancel" onClick={() => setShowPreviewModal(false)}>
Close
</Button>
<Button variant="update" onClick={() => {
setShowPreviewModal(false);
saveProfile();
}}>
<Save className="w-4 h-4 mr-2" />
Update Profile
</Button>
</div>
</div>
</div>
</div>
);
};
return (
<div className="w-full min-h-screen bg-white dark:bg-black">
<HashloaderComponent isLoading={isVerifying} />
<div className="w-full bg-gradient-to-r from-header to-header/80 dark:from-dark dark:to-dark/60 border-b border-borderColor dark:border-borderColor-dark px-6 md:px-8 py-4">
<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
<div className="flex items-center gap-4">
<div className="p-3 bg-white rounded">
<User className="w-8 h-6 text-primary" />
</div>
<div>
<h1 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-wider">Edit Profile</h1>
<p className="text-white/70 text-sm mt-1 font-medium">Keep your employee record accurate and up to date</p>
</div>
</div>
<div className="flex items-center gap-3">
{/* {/* Preview Button - NEW /} */}
<Button variant="outline" onClick={() => setShowPreviewModal(true)}>
<Eye className="w-4 h-4 " />
</Button>
{/* {/* Update Button /} */}
<Button variant="update" onClick={saveProfile} disabled={saving || loading}>
<Save className="w-4 h-4" />
</Button>
<Button variant="print" onClick={() => window.history.back()}>
Back
</Button>
</div>
</div>
</div>
<div className="w-full px-6 md:px-8 py-8">
<div className="bg-white dark:bg-black rounded border-2 border-borderColor dark:border-borderColor-dark p-5 mb-6 flex items-center gap-5">
<div className="relative shrink-0">
<div className="w-20 h-20 rounded-full overflow-hidden bg-off dark:bg-dark border-2 border-primary flex items-center justify-center">
{photoPreview ? (
<img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
) : photoUrl ? (
<img src={photoUrl} alt="Profile" className="w-full h-full object-cover" onError={(e) => {
(e.target as HTMLImageElement).style.display = 'none';
}} />
) : (
<User className="w-8 h-8 text-gray-400" />
)}
</div>
<label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-white cursor-pointer">
<Camera className="w-3.5 h-3.5 text-white" />
<input type="file" accept="image/" className="hidden" onChange={handlePhotoChange} />
</label>
</div>
<div>
<p className="font-bold text-header dark:text-white text-xl">{formData.empName || "Employee"}</p>
<p className="text-base text-black">Emp Code · {formData.empCode || "—"}</p>
<p className="text-base text-black">Designation · {formData.employeedesignation || "—"}</p>
</div>
</div>
{loading ? (
<div className="flex justify-center items-center py-12">
<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
</div>
) : (
<div className="space-y-4">
{tabs.map((tab) => {
const Icon = tab.icon;
const isExpanded = expandedTab === tab.id;
return (
<div
key={tab.id}
className={`border-2 rounded transition-all duration-300 overflow-hidden bg-white dark:bg-black border-borderColor dark:border-borderColor-dark ${isExpanded ? "shadow-lg" : "hover:border-primary/60"
}`}
>
<button
onClick={() => toggleTab(tab.id)}
className="w-full px-6 py-4 flex items-center justify-between hover:bg-off/50 dark:hover:bg-dark/30 transition-colors"
>
<div className="flex items-center gap-4">
<div className="p-2 rounded-lg bg-off dark:bg-dark/50">
<Icon className={`w-6 h-6 ${tab.color}`} />
</div>
<span className="text-xl font-bold text-header dark:text-white">{tab.label}</span>
</div>
{isExpanded ? (
<ChevronUp className="w-5 h-5 text-header dark:text-white" />
) : (
<ChevronDown className="w-5 h-5 text-gray-400" />
)}
</button>
{isExpanded && (
<div className="px-6 pb-6 pt-2 border-t border-borderColor dark:border-borderColor-dark">
{renderTabContent()}
</div>
)}
</div>
);
})}
</div>
)}
</div>
{showPreviewModal && <PreviewModal />}
</div>
);
}
function DocRow({
label,
existingUrl,
file,
onChange,
}: {
label: string;
existingUrl: string;
file: File | null;
onChange: (f: File | null) => void;
}) {
const inputId = `doc-${label.replace(/\s+/g, "-").toLowerCase()}`;
const hasExisting = Boolean(existingUrl) && !file;
return (
<div className="flex items-center justify-between gap-3 p-4 rounded-lg border-2 border-borderColor dark:border-borderColor-dark bg-off dark:bg-dark">
<div className="min-w-0">
<p className="text-sm font-bold text-header dark:text-white">{label}</p>
{file ? (
<p className="text-xs text-green font-semibold truncate flex items-center gap-1 mt-0.5">
<Check className="w-3 h-3" /> {file.name}
</p>
) : hasExisting ? (
<a href={existingUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline flex items-center gap-1 mt-0.5">
<Eye className="w-3 h-3" /> View uploaded file
</a>
) : (
<p className="text-xs text-gray-400 mt-0.5">No file uploaded yet</p>
)}
</div>
<div className="flex items-center gap-1.5 shrink-0">
{file && (
<button onClick={() => onChange(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-borderColor/30">
<X className="w-4 h-4" />
</button>
)}
<label htmlFor={inputId} className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-black border-2 border-borderColor dark:border-borderColor-dark text-xs font-bold text-header dark:text-white">
<Upload className="w-3.5 h-3.5" />
{hasExisting || file ? "Replace" : "Upload"}
</label>
<input id={inputId} type="file" accept="image/,application/pdf" className="hidden" onChange={(e) => onChange(e.target.files?.[0] || null)} />
</div>
</div>
);
}