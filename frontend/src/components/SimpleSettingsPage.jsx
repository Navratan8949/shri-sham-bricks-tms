"use client";

import { useState, useEffect } from "react";
import api from "@/src/services/api";
import { toast } from "sonner";
import {
  Settings,
  Mail,
  Key,
  ExternalLink,
  Save,
  Send,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Info,
  Building,
} from "lucide-react";

export default function SimpleSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [sendingFleetAlert, setSendingFleetAlert] = useState(false);

  // Simplified settings state: Only Email, App Password, and Sender Name
  const [form, setForm] = useState({
    smtpUser: "",
    smtpPass: "",
    hasSmtpPass: false,
    smtpFromName: "Shri Shyam Bricks & Building Materials",
  });

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/settings");

      if (res.data?.data) {
        const d = res.data.data;
        setForm({
          smtpUser: d.smtpUser || "",
          smtpPass: "",
          hasSmtpPass: Boolean(d.hasSmtpPass),
          smtpFromName: d.smtpFromName || "Shri Shyam Bricks & Building Materials",
        });
      }
    } catch (e) {
      console.error("Could not load settings:", e);
      toast.error("Failed to load settings data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Save Settings: Fixed to smtp.gmail.com and Port 587
  const handleSaveSettings = async (e) => {
    e?.preventDefault();
    if (!form.smtpUser || !form.smtpUser.includes("@")) {
      toast.error("Please enter a valid Gmail address");
      return;
    }

    try {
      setSavingSmtp(true);
      const email = form.smtpUser.trim();
      const payload = {
        smtpHost: "smtp.gmail.com",
        smtpPort: 587,
        smtpUser: email,
        smtpFromEmail: email,
        smtpFromName: form.smtpFromName.trim() || "Shri Shyam Bricks & Building Materials",
      };

      if (form.smtpPass && form.smtpPass.trim()) {
        payload.smtpPass = form.smtpPass.trim().replace(/\s+/g, "");
      }

      const res = await api.put("/settings", payload);
      if (res.data?.success) {
        toast.success("Gmail SMTP settings saved successfully!");
        setForm((prev) => ({
          ...prev,
          smtpPass: "",
          hasSmtpPass: Boolean(payload.smtpPass || prev.hasSmtpPass),
        }));
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to save settings");
    } finally {
      setSavingSmtp(false);
    }
  };

  // Send Test Email to the configured Gmail address
  const handleTestEmail = async () => {
    if (!form.smtpUser || !form.smtpUser.includes("@")) {
      toast.error("Please enter a valid Gmail address first");
      return;
    }
    const recipient = form.smtpUser.trim();
    try {
      setTestingEmail(true);
      const res = await api.post("/settings/test-email", { email: recipient });
      if (res.data?.success) {
        toast.success(res.data.message || `Test verification email sent to ${recipient}!`);
      }
    } catch (e) {
      toast.error(
        e.response?.data?.message ||
          "SMTP test failed. Please verify your Gmail ID and 16-character Google App Password."
      );
    } finally {
      setTestingEmail(false);
    }
  };

  // Send Fleet & Dues Alert Digest to the configured Gmail address
  const handleSendFleetAlert = async () => {
    if (!form.smtpUser || !form.smtpUser.includes("@")) {
      toast.error("Please configure and save your Gmail address first");
      return;
    }
    const recipient = form.smtpUser.trim();
    try {
      setSendingFleetAlert(true);
      const res = await api.post("/alerts/send-email", { recipientEmail: recipient });
      if (res.data?.success) {
        toast.success(res.data.message || `Fleet & dues alert digest sent to ${recipient}!`);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to send fleet alert email");
    } finally {
      setSendingFleetAlert(false);
    }
  };

  const isSmtpConnected = Boolean(form.smtpUser && (form.hasSmtpPass || form.smtpPass));

  return (
    <div className="space-y-6 pb-16">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 border border-orange-200 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-orange-800">
              <Settings size={13} className="text-orange-600" />
              Gmail SMTP Configuration
            </span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            System Settings &amp; Gmail SMTP
          </h1>
          <p className="mt-1 text-xs text-stone-500 font-medium">
            गाड़ी कागजात समाप्ति (RTO Expiry) अलर्ट्स व ग्राहक बकाया रिपोर्ट सीधे आपके जीमेल पर
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadSettings}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 hover:border-orange-300 hover:text-orange-600 shadow-2xs transition cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-orange-600" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. GMAIL SMTP CARD (SIMPLIFIED TO 3 FIELDS ONLY) */}
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        {/* Card Header & Status Banner */}
        <div className="border-b border-stone-100 p-5 sm:p-6 bg-[#fcfbfa]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`grid h-12 w-12 place-items-center rounded-2xl ${
                  isSmtpConnected
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                <Mail size={22} />
              </div>
              <div>
                <h2 className="text-base font-black text-stone-900">
                  Gmail SMTP &amp; Automated Email Alerts
                </h2>
                <p className="text-xs text-stone-500 font-medium">
                  गाड़ी कागजात और बकाया पेमेंट की पूरी रिपोर्ट इसी जीमेल पते पर प्राप्त होगी
                </p>
              </div>
            </div>

            {/* Real-time Status Badge */}
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                  isSmtpConnected
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-amber-100 text-amber-800 border border-amber-200"
                }`}
              >
                {isSmtpConnected ? (
                  <>
                    <CheckCircle2 size={13} />
                    <span>Gmail Connected</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={13} />
                    <span>SMTP Pending Setup</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveSettings} className="p-5 sm:p-6 space-y-6">
          {/* Quick Help Guide */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900">
            <div className="flex items-start gap-2.5">
              <Info size={17} className="text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-blue-950">
                  💡 30 सेकंड में Google App Password कैसे बनाएं:
                </p>
                <p className="text-blue-800 leading-relaxed">
                  1. अपने <strong>Google Account</strong> (
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold underline text-blue-900"
                  >
                    Security &gt; 2-Step Verification
                  </a>
                  ) में जाएं।
                  <br />
                  2. <strong>App Passwords</strong> पर क्लिक करें, नाम रखें <em>&quot;Shri Shyam Bricks&quot;</em> और Generate करें।
                  <br />
                  3. 16-अक्षरों का कोड (जैसे: <code>abcd efgh ijkl mnop</code>) यहाँ <strong>Google App Password</strong> में पेस्ट करें।
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Field 1: Gmail ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-stone-800">
                Gmail Email Address (जीमेल पता) *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. shrishyambricksco@gmail.com"
                value={form.smtpUser}
                onChange={(e) => setForm({ ...form, smtpUser: e.target.value })}
                className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-orange-500 shadow-2xs"
              />
              <p className="text-[11px] text-stone-400 font-medium">
                अलर्ट्स इसी जीमेल से भेजे जाएंगे और इसी ईमेल पते पर प्राप्त होंगे।
              </p>
            </div>

            {/* Field 2: Google App Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-stone-800">
                  Google App Password (16-अंकों का ऐप पासवर्ड) *
                </label>
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold text-orange-600 hover:underline flex items-center gap-1"
                >
                  <span>Generate Code</span>
                  <ExternalLink size={11} />
                </a>
              </div>
              <div className="relative">
                <input
                  type="password"
                  placeholder={
                    form.hasSmtpPass
                      ? "•••••••••••• (Password Saved, enter new to change)"
                      : "abcd efgh ijkl mnop"
                  }
                  value={form.smtpPass}
                  onChange={(e) => setForm({ ...form, smtpPass: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 bg-white pl-9 pr-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-orange-500 font-mono shadow-2xs"
                />
                <Key size={14} className="absolute left-3 top-3 text-stone-400" />
              </div>
              <p className="text-[11px] text-stone-400 font-medium">
                Google 2-Step Verification से जनरेट किया हुआ 16-अक्षर का सुरक्षा कोड।
              </p>
            </div>

            {/* Field 3: Sender / Business Name */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-black text-stone-800">
                Sender Name / Business Name (ईमेल में प्रेषक का नाम)
              </label>
              <input
                type="text"
                placeholder="e.g. Shri Shyam Bricks & Building Materials"
                value={form.smtpFromName}
                onChange={(e) => setForm({ ...form, smtpFromName: e.target.value })}
                className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-orange-500 shadow-2xs"
              />
              <p className="text-[11px] text-stone-400 font-medium">
                जब ईमेल प्राप्त होगा, तब प्रेषक (Sender) के रूप में यह नाम दिखाई देगा।
              </p>
            </div>
          </div>

          {/* Fixed Server Parameters Note */}
          <div className="flex items-center gap-2 rounded-xl bg-stone-50 border border-stone-200/80 px-3.5 py-2 text-[11px] text-stone-500 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <span>
              Google Server: <strong className="font-mono text-stone-700">smtp.gmail.com</strong> • Port:{" "}
              <strong className="font-mono text-stone-700">587</strong> (TLS Secure Auto-configured)
            </span>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-stone-200">
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleTestEmail}
                disabled={testingEmail || !form.smtpUser}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-black text-stone-700 hover:border-orange-400 hover:text-orange-600 disabled:opacity-50 shadow-2xs transition cursor-pointer"
              >
                {testingEmail ? (
                  <RefreshCw size={14} className="animate-spin text-orange-600" />
                ) : (
                  <Send size={14} />
                )}
                <span>Send Test Verification Mail (टेस्ट ईमेल)</span>
              </button>

              <button
                type="button"
                onClick={handleSendFleetAlert}
                disabled={sendingFleetAlert || !form.smtpUser}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-black text-red-700 hover:bg-red-100 disabled:opacity-50 shadow-2xs transition cursor-pointer"
              >
                {sendingFleetAlert ? (
                  <RefreshCw size={14} className="animate-spin text-red-600" />
                ) : (
                  <Mail size={14} />
                )}
                <span>Send Fleet Compliance Digest Now (अलर्ट मेल भेजें)</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={savingSmtp}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-2.5 text-xs font-black text-white hover:bg-orange-700 disabled:opacity-50 shadow-xs transition cursor-pointer"
            >
              {savingSmtp ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              <span>Save SMTP Settings (सेव करें)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
