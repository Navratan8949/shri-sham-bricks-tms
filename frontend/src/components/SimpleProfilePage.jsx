"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/src/services/api";
import {
  getStoredUser,
  saveSession,
  getToken,
  clearSession,
  setActiveCompany,
  useActiveCompany,
  getFileUrl,
} from "@/src/lib/auth";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Shield,
  KeyRound,
  Building2,
  Save,
  LogOut,
  RefreshCw,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Truck,
  MapPin,
  ClipboardList,
  Fuel,
  CreditCard,
  Settings,
  ChevronRight,
  Camera,
  Upload,
  Trash2,
} from "lucide-react";

export default function SimpleProfilePage() {
  const router = useRouter();
  const activeCompany = useActiveCompany();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'security' | 'company'
  const [user, setUser] = useState(null);
  const [companyId, setCompanyId] = useState(null);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "super_admin",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Avatar / Profile Photo State
  const fileInputRef = useRef(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [removeImageRequested, setRemoveImageRequested] = useState(false);

  // Password Form State
  const [passForm, setPassForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  // Company Form State
  const [companyForm, setCompanyForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "Jaipur",
    state: "Rajasthan",
    gstNumber: "",
  });
  const [savingCompany, setSavingCompany] = useState(false);

  // Load Current User & Company Data
  const loadProfile = async () => {
    try {
      setLoading(true);
      const [userRes, compRes] = await Promise.allSettled([
        api.get("/auth/me"),
        api.get("/companies/active"),
      ]);

      if (userRes.status === "fulfilled" && userRes.value.data?.user) {
        const u = userRes.value.data.user;
        setUser(u);
        setProfileForm({
          name: u.name || "Super Admin",
          email: u.email || "",
          phone: u.phone || "+91 98290 12345",
          role: u.role || "super_admin",
        });
        if (u.profileImage) {
          setProfileImagePreview(getFileUrl(u.profileImage));
        } else {
          setProfileImagePreview(null);
        }
        setProfileImageFile(null);
        setRemoveImageRequested(false);
        saveSession(getToken(), u);
      } else {
        const local = getStoredUser();
        if (local) {
          setUser(local);
          setProfileForm({
            name: local.name || "Super Admin",
            email: local.email || "",
            phone: local.phone || "+91 98290 12345",
            role: local.role || "super_admin",
          });
          if (local.profileImage) {
            setProfileImagePreview(getFileUrl(local.profileImage));
          } else {
            setProfileImagePreview(null);
          }
          setProfileImageFile(null);
          setRemoveImageRequested(false);
        }
      }

      if (compRes.status === "fulfilled" && compRes.value.data?.data) {
        const c = compRes.value.data.data;
        setCompanyId(c._id);
        setCompanyForm({
          name: c.name || "Shri Shyam Bricks & Building Materials",
          phone: c.phone || "+91 98290 54321",
          email: c.email || "shrishyambricksco@gmail.com",
          address: c.address || "Plot No 14, Shri Shyam Kiln Complex, Tonk Road, Sanganer",
          city: c.city || "Jaipur",
          state: c.state || "Rajasthan",
          gstNumber: c.gstNumber || c.gstin || "08AAACS1234A1Z5",
        });
      }
    } catch (e) {
      console.warn("Could not load user profile:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Handle Photo Picker Selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return toast.error("कृपया वैध फोटो फ़ाइल (JPG, PNG, WebP) अपलोड करें");
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast.error("फोटो का साइज 5MB से कम होना चाहिए");
    }

    setProfileImageFile(file);
    setRemoveImageRequested(false);
    const objectUrl = URL.createObjectURL(file);
    setProfileImagePreview(objectUrl);
  };

  // Handle Remove Photo
  const handleRemoveImage = () => {
    setProfileImageFile(null);
    setProfileImagePreview(null);
    setRemoveImageRequested(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Update Profile Info
  const handleUpdateProfile = async (e) => {
    e?.preventDefault();
    if (!profileForm.name.trim()) {
      return toast.error("Name is required");
    }

    try {
      setSavingProfile(true);

      let res;
      // If a new photo file was chosen or removal was requested, send FormData
      if (profileImageFile || removeImageRequested) {
        const formData = new FormData();
        formData.append("name", profileForm.name.trim());
        formData.append("phone", profileForm.phone.trim());
        if (profileImageFile) {
          formData.append("profileImage", profileImageFile);
        } else if (removeImageRequested) {
          formData.append("profileImage", "");
        }
        res = await api.post("/auth/update-profile", formData);
      } else {
        res = await api.post("/auth/update-profile", {
          name: profileForm.name.trim(),
          phone: profileForm.phone.trim(),
        });
      }

      if (res.data?.success) {
        toast.success("Profile updated successfully! (प्रोफ़ाइल सुरक्षित हो गई)");
        const updated = res.data.user || {
          ...user,
          name: profileForm.name.trim(),
          phone: profileForm.phone.trim(),
          profileImage: profileImageFile
            ? profileImagePreview
            : removeImageRequested
            ? ""
            : user?.profileImage,
        };
        setUser(updated);
        if (updated.profileImage) {
          setProfileImagePreview(getFileUrl(updated.profileImage));
        } else {
          setProfileImagePreview(null);
        }
        setProfileImageFile(null);
        setRemoveImageRequested(false);
        saveSession(getToken(), updated);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e?.preventDefault();
    if (!passForm.currentPassword) {
      return toast.error("Current password is required");
    }
    if (!passForm.newPassword || passForm.newPassword.length < 6) {
      return toast.error("New password must be at least 6 characters long");
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      return toast.error("New password and confirmation do not match");
    }

    try {
      setSavingPass(true);
      const res = await api.post("/auth/change-password", {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      });

      if (res.data?.success) {
        toast.success("Password changed successfully!");
        setPassForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Invalid current password");
    } finally {
      setSavingPass(false);
    }
  };

  // Update Company Details
  const handleUpdateCompany = async (e) => {
    e?.preventDefault();
    if (!companyForm.name.trim()) {
      return toast.error("Firm / Company name is required");
    }

    try {
      setSavingCompany(true);
      const targetId = companyId || activeCompany?._id || "active";
      const res = await api.put(`/companies/${targetId}`, companyForm);

      if (res.data?.success && res.data?.data) {
        const updatedComp = res.data.data;
        setActiveCompany(updatedComp);
        setCompanyId(updatedComp._id);
        setCompanyForm((prev) => ({
          ...prev,
          name: updatedComp.name || prev.name,
          phone: updatedComp.phone || prev.phone,
          email: updatedComp.email || prev.email,
          address: updatedComp.address || prev.address,
          city: updatedComp.city || prev.city,
          state: updatedComp.state || prev.state,
          gstNumber: updatedComp.gstNumber || prev.gstNumber,
        }));
        toast.success("Business & Firm details updated successfully!");
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update company info");
    } finally {
      setSavingCompany(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    router.replace("/login");
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. TOP PROFILE HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-sm">
        {/* Decorative background watermark */}
        <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-gradient-to-br from-orange-100 to-amber-50 opacity-60 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Avatar & Identification */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative group shrink-0">
              <div className="relative grid h-18 w-18 sm:h-20 sm:w-20 place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white font-black text-2xl sm:text-3xl shadow-lg shadow-orange-500/25 overflow-hidden border-2 border-white">
                {profileImagePreview ? (
                  <img
                    src={profileImagePreview}
                    alt="Profile Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  profileForm.name?.slice(0, 1)?.toUpperCase() || "A"
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Change Photo (फोटो बदलें)"
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-white shadow-md hover:bg-orange-600 transition border border-white cursor-pointer"
              >
                <Camera size={12} />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-900">
                  <Shield size={11} className="text-amber-700" />
                  Super Admin (मालिक / पूर्ण नियंत्रण)
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Active Session
                </span>
              </div>

              <h1 className="mt-1 text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                {profileForm.name || "Super Admin"}
              </h1>

              <p className="text-xs sm:text-sm text-stone-500 mt-0.5 font-medium flex items-center gap-2 flex-wrap">
                <span className="text-stone-700 font-semibold">{profileForm.email || "admin@shrishyambricks.com"}</span>
                <span>•</span>
                <span>{companyForm.name || "Shri Shyam Bricks & Building Materials"}</span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={loadProfile}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 hover:border-orange-300 hover:text-orange-600 shadow-2xs transition cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? "animate-spin text-orange-600" : ""} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 shadow-2xs transition cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sign out (लॉगआउट)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION TABS (HORIZONTALLY SCROLLABLE ON MOBILE) */}
      <div className="flex items-center gap-2 border-b border-stone-200 bg-transparent pb-2 overflow-x-auto no-scrollbar scroll-smooth">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`shrink-0 whitespace-nowrap flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition cursor-pointer ${
            activeTab === "profile"
              ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
              : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 bg-white border border-stone-200/80"
          }`}
        >
          <User size={15} />
          <span>Profile Details (प्रोफ़ाइल विवरण)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`shrink-0 whitespace-nowrap flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition cursor-pointer ${
            activeTab === "security"
              ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
              : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 bg-white border border-stone-200/80"
          }`}
        >
          <KeyRound size={15} />
          <span>Security &amp; Password (पासवर्ड बदलें)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("company")}
          className={`shrink-0 whitespace-nowrap flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition cursor-pointer ${
            activeTab === "company"
              ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
              : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 bg-white border border-stone-200/80"
          }`}
        >
          <Building2 size={15} />
          <span>Business &amp; Firm (कंपनी विवरण)</span>
        </button>
      </div>

      {/* 3. TAB CONTENT */}
      {/* TAB A: PROFILE DETAILS */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Profile Form */}
          <div className="lg:col-span-2 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
            <div className="border-b border-stone-100 p-5 sm:p-6 bg-[#fcfbfa]">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-100 text-orange-700">
                  <User size={18} />
                </div>
                <div>
                  <h2 className="text-base font-black text-stone-900">
                    Administrator Profile Info
                  </h2>
                  <p className="text-xs text-stone-500 font-medium">
                    सुपर एडमिन का नाम, लॉगिन ईमेल व संपर्क नंबर
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="p-5 sm:p-6 space-y-5">
              {/* Profile Photo Uploader Card */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl border border-stone-200/90 bg-stone-50/70">
                <div className="relative grid h-20 w-20 place-items-center rounded-2xl bg-stone-200 text-stone-700 font-black text-2xl overflow-hidden shrink-0 border border-stone-300 shadow-2xs">
                  {profileImagePreview ? (
                    <img
                      src={profileImagePreview}
                      alt="Profile Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User size={34} className="text-stone-400" />
                  )}
                </div>

                <div className="space-y-2 flex-1 text-center sm:text-left">
                  <div>
                    <h3 className="text-xs font-black text-stone-900">
                      Super Admin Profile Photo (एडमिन प्रोफ़ाइल फोटो)
                    </h3>
                    <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                      JPG, PNG या WebP फॉर्मेट (अधिकतम 5MB)। यह फोटो हेडर, साइडबार व प्रोफाइल पर दिखेगी।
                    </p>
                  </div>

                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-0.5 flex-wrap">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-bold text-stone-700 hover:border-orange-400 hover:text-orange-600 shadow-2xs transition cursor-pointer"
                    >
                      <Upload size={13} />
                      <span>{profileImagePreview ? "Change Photo (फोटो बदलें)" : "Upload Photo (फोटो अपलोड करें)"}</span>
                    </button>

                    {profileImagePreview && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>Remove (हटाएं)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Full Name */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-black text-stone-800">
                    Full Name (पूरा नाम) *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, name: e.target.value })
                    }
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-orange-500 shadow-2xs font-semibold"
                  />
                </div>

                {/* Email Address (Login Username) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-stone-800">
                    Login Email Address (लॉगिन ईमेल)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={profileForm.email}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs text-stone-600 outline-none cursor-not-allowed shadow-2xs font-mono"
                  />
                  <p className="text-[10px] text-stone-400">
                    लॉगिन ईमेल सुरक्षा कारणों से फिक्स है।
                  </p>
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-stone-800">
                    Mobile Phone Number (मोबाइल नंबर)
                  </label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, phone: e.target.value })
                    }
                    placeholder="e.g. +91 98290 12345"
                    className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-orange-500 shadow-2xs font-mono font-semibold"
                  />
                </div>

                {/* Role (Read only badge) */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-black text-stone-800">
                    System Authorization Role (अधिकार स्तर)
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/70 p-3">
                    <Shield size={16} className="text-amber-600" />
                    <div>
                      <p className="text-xs font-black text-stone-900">
                        Master Super Admin (सर्वोच्च एडमिनिस्ट्रेटर)
                      </p>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        ग्राहक ऑर्डर्स, गाड़ी खर्च, फ्लीट कागजात, ड्राइवर वेतन, और जीमेल सेटिंग्स का पूरा नियंत्रण।
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-2.5 text-xs font-black text-white hover:bg-orange-700 disabled:opacity-50 shadow-xs transition cursor-pointer"
                >
                  {savingProfile ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  <span>Save Profile Changes (प्रोफ़ाइल सुरक्षित करें)</span>
                </button>
              </div>
            </form>
          </div>

          {/* Side Privileges Card */}
          <div className="space-y-4">
            <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm">
              <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                <span>Super Admin Privileges</span>
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                इस खाते के पास संपूर्ण सिस्टम की सभी प्रमुख शक्तियां सक्रिय हैं:
              </p>

              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex items-start gap-2.5 rounded-xl bg-orange-50/60 p-2.5 border border-orange-100">
                  <Truck size={15} className="text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-stone-800">Fleet &amp; RTO Expiries:</span>
                    <p className="text-[11px] text-stone-600">गाड़ियों के सभी 6 कागजात (RC, Insurance, Fitness, Permit, PUC, Tax) प्रबंधन।</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50/60 p-2.5 border border-emerald-100">
                  <ClipboardList size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-stone-800">Customer Orders &amp; Due Dues:</span>
                    <p className="text-[11px] text-stone-600">पार्टी वाइज माल डिलीवरी, जीएसटी गणना और बकाया राशि वसूली रजिस्टर।</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl bg-blue-50/60 p-2.5 border border-blue-100">
                  <Mail size={15} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-stone-800">Gmail SMTP &amp; Alerts:</span>
                    <p className="text-[11px] text-stone-600">स्वचालित ईमेल अलर्ट्स व दैनिक फ्लीट ऑडिट डिस्पैच।</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-stone-100">
                <Link
                  href="/settings"
                  className="flex items-center justify-between text-xs font-bold text-orange-600 hover:underline"
                >
                  <span>Go to Gmail SMTP Settings &rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB B: SECURITY & PASSWORD */}
      {activeTab === "security" && (
        <div className="max-w-2xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 p-5 sm:p-6 bg-[#fcfbfa]">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-800">
                <Lock size={18} />
              </div>
              <div>
                <h2 className="text-base font-black text-stone-900">
                  Change Account Password (पासवर्ड बदलें)
                </h2>
                <p className="text-xs text-stone-500 font-medium">
                  अपने खाते की सुरक्षा के लिए नियमित रूप से पासवर्ड अपडेट करें
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="p-5 sm:p-6 space-y-4">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-stone-800">
                Current Password (वर्तमान पासवर्ड) *
              </label>
              <div className="relative">
                <input
                  type={showCurrentPass ? "text" : "password"}
                  required
                  placeholder="अपना पुराना पासवर्ड दर्ज करें"
                  value={passForm.currentPassword}
                  onChange={(e) =>
                    setPassForm({ ...passForm, currentPassword: e.target.value })
                  }
                  className="w-full rounded-xl border border-stone-200 bg-white pl-3.5 pr-10 py-2.5 text-xs text-stone-900 outline-none focus:border-orange-500 shadow-2xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700"
                >
                  {showCurrentPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-stone-800">
                New Password (नया पासवर्ड) *
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? "text" : "password"}
                  required
                  placeholder="कम से कम 6 अक्षरों का नया पासवर्ड"
                  value={passForm.newPassword}
                  onChange={(e) =>
                    setPassForm({ ...passForm, newPassword: e.target.value })
                  }
                  className="w-full rounded-xl border border-stone-200 bg-white pl-3.5 pr-10 py-2.5 text-xs text-stone-900 outline-none focus:border-orange-500 shadow-2xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700"
                >
                  {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="text-[10px] text-stone-400">
                मजबूत पासवर्ड में अक्षर और अंक दोनों शामिल करें।
              </p>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-stone-800">
                Confirm New Password (नए पासवर्ड की पुष्टि करें) *
              </label>
              <input
                type="password"
                required
                placeholder="नया पासवर्ड दोबारा दर्ज करें"
                value={passForm.confirmPassword}
                onChange={(e) =>
                  setPassForm({ ...passForm, confirmPassword: e.target.value })
                }
                className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-orange-500 shadow-2xs font-mono"
              />
            </div>

            {/* Action Button */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
              <button
                type="submit"
                disabled={savingPass}
                className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-6 py-2.5 text-xs font-black text-white hover:bg-stone-800 disabled:opacity-50 shadow-xs transition cursor-pointer"
              >
                {savingPass ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Lock size={14} />
                )}
                <span>Update Password (पासवर्ड बदलें)</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB C: COMPANY & BUSINESS IDENTITY */}
      {activeTab === "company" && (
        <div className="max-w-3xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 p-5 sm:p-6 bg-[#fcfbfa]">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-100 text-orange-700">
                <Building2 size={18} />
              </div>
              <div>
                <h2 className="text-base font-black text-stone-900">
                  Business &amp; Firm Identity (कंपनी का विवरण)
                </h2>
                <p className="text-xs text-stone-500 font-medium">
                  ईंट भट्ठा व बिल्डिंग मटेरियल फर्म का नाम, पता, व जीएसटी नंबर
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdateCompany} className="p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-black text-stone-800">
                  Firm / Company Name (फर्म का नाम) *
                </label>
                <input
                  type="text"
                  required
                  value={companyForm.name}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-orange-500 shadow-2xs font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-stone-800">
                  GSTIN Number (जीएसटी नंबर)
                </label>
                <input
                  type="text"
                  value={companyForm.gstNumber}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      gstNumber: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g. 08AAACS1234A1Z5"
                  className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-orange-500 shadow-2xs font-mono uppercase font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-stone-800">
                  Office Phone / Mobile
                </label>
                <input
                  type="tel"
                  value={companyForm.phone}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, phone: e.target.value })
                  }
                  className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs text-stone-900 outline-none focus:border-orange-500 shadow-2xs font-mono"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-black text-stone-800">
                  Yard / Kiln Complex Address (भट्ठा / यार्ड का पता)
                </label>
                <textarea
                  rows={3}
                  value={companyForm.address}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, address: e.target.value })
                  }
                  className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs text-stone-900 outline-none focus:border-orange-500 shadow-2xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
              <button
                type="submit"
                disabled={savingCompany}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-2.5 text-xs font-black text-white hover:bg-orange-700 disabled:opacity-50 shadow-xs transition cursor-pointer"
              >
                {savingCompany ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                <span>Save Business Info (कंपनी विवरण सुरक्षित करें)</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

