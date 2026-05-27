"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { sleep } from "@/services/delay";

const SELECT_CLS =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";
const LABEL_CLS = "mb-1 block text-[13px] font-semibold text-ink";

export default function BankAccountContent() {
  const toast = useToast();
  const [partyType, setPartyType] = useState("Agency");
  const [accountName, setAccountName] = useState("");
  const [accountCode, setAccountCode] = useState("");
  const [loginName, setLoginName] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [holderName, setHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accountType, setAccountType] = useState("Saving");
  const [branchName, setBranchName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) { toast.push({ title: "Enter account name", tone: "warn" }); return; }
    if (!accountNo.trim()) { toast.push({ title: "Enter bank account number", tone: "warn" }); return; }
    if (!holderName.trim()) { toast.push({ title: "Enter account holder name", tone: "warn" }); return; }
    if (!bankName.trim()) { toast.push({ title: "Enter bank name", tone: "warn" }); return; }
    if (!ifsc.trim()) { toast.push({ title: "Enter IFSC code", tone: "warn" }); return; }
    if (!branchName.trim()) { toast.push({ title: "Enter branch name", tone: "warn" }); return; }
    setSubmitting(true);
    await sleep(1200);
    toast.push({ title: "Bank details saved!", description: "Your bank account details have been updated.", tone: "success" });
    setSubmitting(false);
  };

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-[15px] font-bold text-ink">Bank Details</h2>
      </div>
      <form onSubmit={onSubmit} className="p-5 flex flex-col gap-4">
        <div>
          <label className={LABEL_CLS}>Party Type *</label>
          <select value={partyType} onChange={(e) => setPartyType(e.target.value)} className={SELECT_CLS}>
            <option value="Agency">Agency</option>
          </select>
        </div>

        <Input
          label="Account Name *"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          placeholder=""
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Account Code *"
            value={accountCode}
            onChange={(e) => setAccountCode(e.target.value)}
            placeholder="F8329"
          />
          <Input
            label="Login Name *"
            value={loginName}
            onChange={(e) => setLoginName(e.target.value)}
            placeholder="F8329"
          />
        </div>

        <Input
          label="Bank Account Number *"
          value={accountNo}
          onChange={(e) => setAccountNo(e.target.value)}
          placeholder=""
        />
        <Input
          label="Bank Account Holder's Name *"
          value={holderName}
          onChange={(e) => setHolderName(e.target.value)}
          placeholder=""
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Bank Name *"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder=""
          />
          <Input
            label="IFSC Code *"
            value={ifsc}
            onChange={(e) => setIfsc(e.target.value)}
            placeholder=""
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Branch Account Type *</label>
            <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className={SELECT_CLS}>
              <option value="Saving">Saving</option>
              <option value="Current">Current</option>
              <option value="OD">OD</option>
            </select>
          </div>
          <Input
            label="Branch Name *"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            placeholder=""
          />
        </div>

        <div>
          <label className={LABEL_CLS}>Current Status</label>
          <input
            type="text"
            value="Active"
            readOnly
            className="w-full rounded-lg border border-border bg-zinc-50 px-3 py-2 text-[13px] text-ink-muted cursor-not-allowed"
          />
        </div>

        <div>
          <label className={LABEL_CLS}>Bank Document (Cancelled Cheque)</label>
          <input
            type="file"
            accept="image/*,.pdf"
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-[13px] text-ink file:mr-3 file:rounded file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:text-[12px] file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" size="md" loading={submitting}>
            Save Bank Details
          </Button>
        </div>
      </form>
    </div>
  );
}
