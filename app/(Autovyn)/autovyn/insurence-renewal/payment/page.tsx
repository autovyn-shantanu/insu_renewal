"use client";
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import Einput from "@/components/atoms/Input";
import Eselect from "@/components/atoms/Eselect";
import Ainput from "@/components/atoms/Input";
import HashloaderComponent from "@/components/Templates/hashloader";
import { FaCarSide } from "react-icons/fa";

function showSideAlert(message, type) {
  const Toast = Swal.mixin({
    toast: true,
    position: "bottom-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    customClass: {
      container: "side-alert-container",
      popup: `side-alert-${type}`,
      title: "side-alert-title",
      icon: "side-alert-icon",
    },
  });
  Toast.fire({ icon: type, title: message });
}

const initialForm = {
  RegNo: "",
  isExisting: false,
  VehicleId: null,

  OwnerName: "",
  MobileNo: "",
  ModelVariant: "",
  ChassisNo: "",
  EngineNo: "",

  PrevPolicyNo: "",
  PrevInsuranceCo: "",
  PrevExpiryDate: "",

  InsuranceCo: "",
  PolicyNo: "",
  PolicyName: "",
  PolicyType: "",
  PolicyStartDate: "",
  PolicyExpiryDate: "",
  IDV: "",
  PremiumAmount: "",

  PaymentMode: "",
  PaymentDate: "",
  Amount: "",
  UTR: "",
  ChequeNo: "",
  BankName: "",
  Remarks: "",
};

export default function InsuranceRenewal() {
  const user = useCurrentUser();
  const router = useRouter();

  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [regNoLocked, setRegNoLocked] = useState(false);

  // ✅ dropdown options from API
  const [insuranceCompanies, setInsuranceCompanies] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);

  // ✅ store selected meta (optional, for auto-fill / future use)
  const [selectedInsuranceMeta, setSelectedInsuranceMeta] = useState(null);
  const [selectedPaymentMeta, setSelectedPaymentMeta] = useState(null);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  // ✅ Payload with loc_code
  const payload = {
    loc_code: user?.branch,
  };

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  // ✅ Load dropdowns (Misc_Type 9 & 18)
  const fetchInsuranceAndPaymentDropdowns = async () => {
    if (!user?.Comp_Code) return;

    try {
      setIsLoading(true);

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/Crm/getInsuranceAndPaymentDropdowns`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            compcode: user.Comp_Code,
            name: user.name,
            loc_code: payload.loc_code,
          },
        }
      );

      if (res?.data?.Status) {
        setInsuranceCompanies(res?.data?.Result?.insuranceCompanies || []);
        setPaymentModes(res?.data?.Result?.paymentModes || []);
      } else {
        showSideAlert(res?.data?.Message || "Dropdown load failed", "error");
      }
    } catch (err) {
      console.error(err);
      showSideAlert("Error loading dropdowns", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.Comp_Code) fetchInsuranceAndPaymentDropdowns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.Comp_Code]);

  const handleInputChange = (name, value) => {
    // ✅ RegNo change => unlock + clear all autofilled fields
    if (name === "RegNo") {
      setRegNoLocked(false);
      setForm((prev) => ({
        ...prev,
        RegNo: value,
        isExisting: false,
        VehicleId: null,
        OwnerName: "",
        MobileNo: "",
        ModelVariant: "",
        PrevPolicyNo: "",
        PrevInsuranceCo: "",
        PrevExpiryDate: "",
        PolicyNo: "",
        PolicyName: "",
        PolicyStartDate: "",
        PolicyExpiryDate: "",
      }));
      return;
    }

    // ✅ PolicyName => Numbers block karo
    if (name === "PolicyName") {
      const onlyLetters = value.replace(/[^a-zA-Z\s]/g, "");
      setForm((prev) => ({ ...prev, PolicyName: onlyLetters }));
      return;
    }

    // ✅ MobileNo => Alphabets block karo
    if (name === "MobileNo") {
      const onlyNumbers = value.replace(/\D/g, "").slice(0, 10);
      setForm((prev) => ({ ...prev, MobileNo: onlyNumbers }));
      return;
    }

    // ✅ PremiumAmount => Alphabets block karo
    if (name === "PremiumAmount") {
      const onlyNumbers = value.replace(/\D/g, "");
      setForm((prev) => ({ ...prev, PremiumAmount: onlyNumbers }));
      return;
    }

    // ✅ Amount => Alphabets block karo
    if (name === "Amount") {
      const onlyNumbers = value.replace(/\D/g, "");
      setForm((prev) => ({ ...prev, Amount: onlyNumbers }));
      return;
    }

    // ✅ Insurance company select => store meta + (optional) auto-fill
    if (name === "InsuranceCo") {
      const selected = insuranceCompanies.find((x) => x.value === value);
      setSelectedInsuranceMeta(selected?.meta || null);
      setForm((prev) => ({
        ...prev,
        InsuranceCo: value,
      }));
      return;
    }

    // ✅ PaymentMode change => dependent clear + store meta
    if (name === "PaymentMode") {
      const selected = paymentModes.find((x) => x.value === value);
      setSelectedPaymentMeta(selected?.meta || null);
      setForm((prev) => ({
        ...prev,
        PaymentMode: value,
        UTR: "",
        ChequeNo: "",
        BankName: "",
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // ✅ Vehicle fetch API
  const fetchVehicleByRegNo = async () => {
    if (!form.RegNo || form.RegNo.trim() === "") {
      showSideAlert("Please enter Vehicle Reg No", "warning");
      return;
    }
    if (!user?.Comp_Code) return;

    setIsLoading(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/Crm/getVehicleByRegNo`,
        { RegNo: form.RegNo.trim(), ...payload },
        {
          headers: {
            "Content-Type": "application/json",
            compcode: user.Comp_Code,
            name: user.name,
            loc_code: payload.loc_code,
          },
        }
      );

      const result = res?.data?.Result?.[0];

      if (result) {
        setForm((prev) => ({
          ...prev,
          isExisting: true,
          VehicleId: result.VehicleId ?? null,

          OwnerName: result.OwnerName ?? "",
          MobileNo: result.MobileNo ?? "",
          ModelVariant: result.ModelVariant ?? "",

          PolicyNo: result.PolicyNo ?? "",
          PolicyName: result.PolicyName ?? "",
          PolicyStartDate: result.PolicyStartDate ?? "",
          PolicyExpiryDate: result.PolicyExpiryDate ?? "",

          PrevPolicyNo: result.PrevPolicyNo ?? "",
          PrevExpiryDate: result.PrevExpiryDate ?? "",
          PrevInsuranceCo: result.PrevInsuranceCo ?? "",
        }));
        setRegNoLocked(true);
        showSideAlert("Vehicle found — details auto-filled", "success");
      } else {
        setRegNoLocked(false);
        showSideAlert("New vehicle — please enter details", "info");
      }
    } catch (err) {
      console.error(err);
      showSideAlert("Error checking vehicle, try again", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const validate = () => {
    if (!form.RegNo?.trim()) return "Vehicle Reg No is mandatory";

    if (!form.isExisting) {
      if (!form.OwnerName?.trim()) return "Owner Name is mandatory";
      if (!form.MobileNo?.trim()) return "Mobile No is mandatory";
      if (!form.ModelVariant?.trim()) return "Model/Variant is mandatory";
    }

    if (!form.InsuranceCo) return "Please select Insurance Company";
    if (!form.PolicyName?.trim()) return "Policy Name is mandatory";
    if (!form.PolicyStartDate) return "Policy Start Date is mandatory";
    if (!form.PolicyExpiryDate) return "Policy Expiry Date is mandatory";
    if (!form.PremiumAmount) return "Premium Amount is mandatory";

    if (!form.PaymentMode) return "Please select Payment Mode";
    if (!form.PaymentDate) return "Payment Date is mandatory";
    if (!form.Amount) return "Payment Amount is mandatory";

    if (["NEFT", "RTGS", "UPI", "CARD"].includes(form.PaymentMode)) {
      if (!form.UTR?.trim())
        return "UTR/Reference No is mandatory for selected payment mode";
    }

    if (["CHEQUE", "DD"].includes(form.PaymentMode)) {
      if (!form.ChequeNo?.trim()) return "Cheque/DD No is mandatory";
      if (!form.BankName?.trim()) return "Bank Name is mandatory";
    }

    if (!photoFile) return "Please upload Payment Proof photo";
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) {
      showSideAlert(error, "warning");
      return;
    }

    try {
      setIsLoading(true);

      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value ?? "");
      });
      formData.append("compcode", user?.Comp_Code || "");
      formData.append("EMPCODE", user?.EMPCODE || "");
      formData.append("loc_code", payload.loc_code || "");
      formData.append("PaymentProof", photoFile);

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/Crm/SaveInsuranceRenewal`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            compcode: user?.Comp_Code,
            name: user?.name,
            loc_code: payload.loc_code,
          },
        }
      );

      if (res?.data?.Status) {
        showSideAlert(res.data.Message || "Insurance renewal saved", "success");
        setForm(initialForm);
        setRegNoLocked(false);

        setSelectedInsuranceMeta(null);
        setSelectedPaymentMeta(null);

        setPhotoFile(null);
        if (photoPreview) URL.revokeObjectURL(photoPreview);
        setPhotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        showSideAlert(res?.data?.Message || "Save failed", "error");
      }
    } catch (err) {
      console.error("Error saving insurance renewal:", err);
      showSideAlert("Error saving record", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-2 w-full">
      <div className="col-span-12 rounded-t bg-header dark:bg-black px-2 md:px-6 py-2 border dark:border-borderColor-dark">
        <div className="flex justify-between gap-3">
          <h1 className="font-bold sm:text-sm md:text-lg lg:text-xl text-white dark:text-[#37a9dd] flex items-center gap-x-3 uppercase">
            <FaCarSide size={20} />
            Insurance Renewal
          </h1>
          <div className="flex gap-2">
            <Button variant={"save"} onClick={handleSave}>
              Save
            </Button>
            <Button variant={"print"} onClick={() => router.back()}>
              Back
            </Button>
          </div>
        </div>
      </div>

      {/* Vehicle Section */}
      <div className="grid grid-cols-12 mt-2 gap-2 md:gap-3 rounded-b p-2 md:p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow col-span-12">
        <div className="col-span-12 xl:col-span-3 md:col-span-6 flex gap-2">
          <div className="flex-1">
            <Einput
              type="text"
              title="Vehicle Reg No:"
              name="RegNo"
              value={form.RegNo}
              handleInputChange={handleInputChange}
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="save"
              onClick={fetchVehicleByRegNo}
              disabled={isLoading || !form.RegNo?.trim()}
              className="whitespace-nowrap"
            >
              Get Details
            </Button>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-3 md:col-span-6 flex">
          <Einput
            type="text"
            title="Customer Name:"
            name="OwnerName"
            value={form.OwnerName}
            handleInputChange={handleInputChange}
            onKeyDown={(e) => {
              // Number keys block karo (0-9)
              if (e.key >= "0" && e.key <= "9") {
                e.preventDefault();
              }
            }}
            disabled={regNoLocked}
          />
        </div>

        <div className="col-span-12 xl:col-span-3 md:col-span-6 flex">
          <Einput
            type="text"
            title="Mobile No:"
            name="MobileNo"
            value={form.MobileNo}
            handleInputChange={handleInputChange}
            disabled={regNoLocked}
            onKeyPress={(e) => {
              if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
              }
            }}
          />
        </div>

        <div className="col-span-12 xl:col-span-3 md:col-span-6 flex">
          <Einput
            type="text"
            title="Model/Variant:"
            name="ModelVariant"
            value={form.ModelVariant}
            handleInputChange={handleInputChange}
            disabled={regNoLocked}
          />
        </div>

        {form.isExisting && (
          <>
            <div className="col-span-12 xl:col-span-3 md:col-span-6 flex">
              <Einput
                type="text"
                title="Previous Policy No:"
                name="PrevPolicyNo"
                value={form.PrevPolicyNo}
                handleInputChange={handleInputChange}
                disabled
              />
            </div>

            <div className="col-span-12 xl:col-span-3 md:col-span-6 flex">
              <Einput
                type="text"
                title="Previous Expiry Date:"
                name="PrevExpiryDate"
                value={form.PrevExpiryDate}
                handleInputChange={handleInputChange}
                onKeyDown={(e) => {
                  // Number keys block karo (0-9)
                  if (e.key >= "0" && e.key <= "9") {
                    e.preventDefault();
                  }
                }}
                disabled
              />
            </div>
          </>
        )}
      </div>

      {/* Insurance Policy Section */}
      <div className="col-span-12 rounded-t bg-header dark:bg-black px-3 py-2 border border-borderColor dark:border-borderColor-dark mt-2">
        <h1 className="text-white dark:text-[#37a9dd] uppercase font-semibold text-sm">
          Insurance Policy Details
        </h1>
      </div>

      <div className="grid grid-cols-12 mt-2 gap-2 md:gap-3 rounded-b p-2 md:p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow col-span-12">
        <div className="col-span-12 xl:col-span-3 md:col-span-6 flex">
          <Eselect
            title="Insurance Company:"
            name="InsuranceCo"
            option={insuranceCompanies}
            initialValue={form.InsuranceCo}
            onKeyDown={(e) => {
              // Number keys block karo (0-9)
              if (e.key >= "0" && e.key <= "9") {
                e.preventDefault();
              }
            }}
            handleInputChange={handleInputChange}
            h={9}
          />
        </div>

        <div className="col-span-12 xl:col-span-3 md:col-span-6 flex">
          <Einput
            type="text"
            title="Policy No:"
            name="PolicyNo"
            value={form.PolicyNo}
            handleInputChange={handleInputChange}
          />
        </div>

        <div className="col-span-12 xl:col-span-3 md:col-span-6 flex">
          <Einput
            type="text"
            title="Policy Name:"
            name="PolicyName"
            value={form.PolicyName}
            onKeyDown={(e) => {
              // Number keys block karo (0-9)
              if (e.key >= "0" && e.key <= "9") {
                e.preventDefault();
              }
            }}
            handleInputChange={handleInputChange}
          />
        </div>

        <div className="col-span-12 xl:col-span-3 md:col-span-6 flex">
          <Ainput
            type="date"
            title="Policy Start Date:"
            name="PolicyStartDate"
            value={form.PolicyStartDate}
            handleInputChange={handleInputChange}
            disabled={true}
          />
        </div>

        <div className="col-span-12 xl:col-span-3 md:col-span-6 flex">
          <Ainput
            type="date"
            title="Policy Expiry Date:"
            name="PolicyExpiryDate"
            value={form.PolicyExpiryDate}
            handleInputChange={handleInputChange}
          />
        </div>

        <div className="col-span-12 xl:col-span-3 md:col-span-6 flex">
          <Einput
            type="text"
            title="Premium Amount:"
            name="PremiumAmount"
            value={form.PremiumAmount}
            handleInputChange={handleInputChange}
            onKeyPress={(e) => {
              if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
              }
            }}
          />
        </div>
      </div>

      {/* Payment Section */}
      <div className="col-span-12 rounded-t bg-header dark:bg-black px-3 py-2 border border-borderColor dark:border-borderColor-dark mt-2">
        <h1 className="text-white dark:text-[#37a9dd] uppercase font-semibold text-sm">
          Payment Details
        </h1>
      </div>

      <div className="grid grid-cols-12 mt-2 gap-2 md:gap-3 rounded-b p-2 md:p-4 bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow col-span-12">
        <div className="col-span-12 xl:col-span-3 md:col-span-6 flex">
          <Eselect
            title="Payment Mode:"
            name="PaymentMode"
            option={paymentModes}
            initialValue={form.PaymentMode}
            handleInputChange={handleInputChange}
            h={9}
            isSearchable={true}
            isClearable={true}
          />

        </div>

        <div className="col-span-12 xl:col-span-3 md:col-span-6 flex">
          <Ainput
            type="date"
            title="Payment Date:"
            name="PaymentDate"
            value={form.PaymentDate}
            handleInputChange={handleInputChange}
          />
        </div>

        <div className="col-span-12 xl:col-span-3 md:col-span-6 flex">
          <Einput
            type="text"
            title="Amount:"
            name="Amount"
            value={form.Amount}
            handleInputChange={handleInputChange}
            onKeyPress={(e) => {
              if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
              }
            }}
          />
        </div>

        {["NEFT", "RTGS", "UPI", "CARD"].includes(form.PaymentMode) && (
          <div className="col-span-12 xl:col-span-3 md:col-span-6 flex">
            <Einput
              type="text"
              title="UTR / Reference No:"
              name="UTR"
              value={form.UTR}
              handleInputChange={handleInputChange}
            />
          </div>
        )}

        {["CHEQUE", "DD"].includes(form.PaymentMode) && (
          <>
            <div className="col-span-12 xl:col-span-3 md:col-span-6 flex">
              <Einput
                type="text"
                title={form.PaymentMode === "DD" ? "DD No:" : "Cheque No:"}
                name="ChequeNo"
                value={form.ChequeNo}
                handleInputChange={handleInputChange}
              />
            </div>
            <div className="col-span-12 xl:col-span-3 md:col-span-6 flex">
              <Einput
                type="text"
                title="Bank Name:"
                name="BankName"
                value={form.BankName}
                handleInputChange={handleInputChange}
              />
            </div>
          </>
        )}

        <div className="col-span-12 xl:col-span-4 md:col-span-6 flex">
          <Einput
            type="text"
            title="Remarks:"
            name="Remarks"
            value={form.Remarks}
            handleInputChange={handleInputChange}
          />
        </div>

        <div className="col-span-12 xl:col-span-4 md:col-span-6">
          <label className="text-sm font-semibold block mb-1">
            Payment Proof:
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="text-sm"
          />
          {photoPreview && (
            <img
              src={photoPreview}
              alt="proof"
              className="h-[100px] mt-2 rounded border object-contain"
            />
          )}
        </div>
      </div>

      <HashloaderComponent isLoading={isLoading} />
    </div>
  );
}