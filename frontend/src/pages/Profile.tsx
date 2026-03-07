import React, { useEffect, useState } from "react";
import api from "../api";
import { getUserData, storeUserData, UserData } from "../utils/authUtils";
import BackButton from "../components/BackButton";
import { motion } from "framer-motion";

// ─── Types matching the updated ProfileSerializer response ────────────────────
interface UserProfile {
  id: number;
  user: {
    id: number;
    username: string;
    first_name: string; // ✅ snake_case — matches Django / serializer
    last_name: string; // ✅ snake_case — matches Django / serializer
    email: string;
  };
  role: string;
  department?: string;
  student_class?: string;
  student_id?: string;
  phone?: string;
  address?: string;
  bio?: string;
}

// ─── Helper: initials from profile ───────────────────────────────────────────
const getInitials = (profile: UserProfile | null): string => {
  if (!profile) return "U";
  const f = profile.user?.first_name;
  const l = profile.user?.last_name;
  if (f && l) return `${f[0]}${l[0]}`.toUpperCase();
  if (f) return f[0].toUpperCase();
  return (profile.user?.username?.[0] ?? "U").toUpperCase();
};

const getDisplayName = (profile: UserProfile | null): string => {
  if (!profile) return "";
  const f = profile.user?.first_name;
  const l = profile.user?.last_name;
  if (f && l) return `${f} ${l}`;
  if (f) return f;
  return profile.user?.username ?? "";
};

const getRoleColor = (role: string) => {
  switch (role) {
    case "admin":
    case "super_admin":
      return "bg-red-100    dark:bg-red-900/40    text-red-800    dark:text-red-200";
    case "instructor":
      return "bg-blue-100   dark:bg-blue-900/40   text-blue-800   dark:text-blue-200";
    case "school_admin":
      return "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200";
    default:
      return "bg-green-100  dark:bg-green-900/40  text-green-800  dark:text-green-200";
  }
};

// ─── Component ────────────────────────────────────────────────────────────────
const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(
    null,
  );

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    bio: "",
  });

  // ── Fetch profile ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      // /profiles/me/ now returns nested user with first_name + last_name
      const res = await api.get("/profiles/me/");
      applyProfile(res.data);
    } catch {
      // fallback to list endpoint
      try {
        const res = await api.get("/profiles/");
        const profiles = res.data?.results ?? res.data;
        if (Array.isArray(profiles) && profiles.length > 0) {
          applyProfile(profiles[0]);
        } else {
          setMessage({ text: "Failed to load profile data", ok: false });
        }
      } catch {
        setMessage({ text: "Failed to load profile data", ok: false });
      }
    } finally {
      setLoading(false);
    }
  };

  const applyProfile = (data: UserProfile) => {
    setProfile(data);
    setFormData({
      first_name: data.user?.first_name ?? "",
      last_name: data.user?.last_name ?? "",
      email: data.user?.email ?? "",
      phone: data.phone ?? "",
      address: data.address ?? "",
      bio: data.bio ?? "",
    });
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setMessage(null);

    try {
      /*
       * Single PATCH to /profiles/update_me/
       * The new ProfileCreateUpdateSerializer.update() splits user fields
       * (first_name, last_name, email) from profile fields (phone, address, bio)
       * and saves both in one round-trip.
       * The response is a full ProfileSerializer payload — nested user included.
       */
      const res = await api.patch("/profiles/update_me/", {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        bio: formData.bio.trim(),
      });

      const updated: UserProfile = res.data;
      applyProfile(updated);

      // ── Sync localStorage so Navbar + Dashboard show updated name immediately
      const stored = getUserData();
      if (stored) {
        const synced: UserData = {
          ...stored,
          firstName: updated.user?.first_name ?? stored.firstName,
          lastName: updated.user?.last_name ?? stored.lastName,
          email: updated.user?.email ?? stored.email,
        };
        storeUserData(synced);
      }

      setEditing(false);
      setMessage({ text: "✅ Profile updated successfully!", ok: true });
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ??
        Object.values(err?.response?.data ?? {})[0] ??
        "Failed to update profile. Please try again.";
      setMessage({ text: `❌ ${detail}`, ok: false });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) applyProfile(profile); // reset form to last fetched state
    setEditing(false);
    setMessage(null);
  };

  // ── Field renderer (DRY) ───────────────────────────────────────────────────
  const Field = ({
    label,
    value,
    field,
    type = "text",
  }: {
    label: string;
    value: string;
    field: keyof typeof formData;
    type?: string;
  }) => (
    <div>
      <label
        className="block text-xs sm:text-sm font-medium text-gray-600
        dark:text-gray-400 mb-1"
      >
        {label}
      </label>
      {editing ? (
        type === "textarea" ? (
          <textarea
            value={formData[field]}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, [field]: e.target.value }))
            }
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600
              rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
              dark:bg-gray-700 dark:text-white resize-none"
          />
        ) : (
          <input
            type={type}
            value={formData[field]}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, [field]: e.target.value }))
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600
              rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
              dark:bg-gray-700 dark:text-white"
          />
        )
      ) : (
        <p
          className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/60 rounded-lg
          text-gray-900 dark:text-white min-h-[38px]"
        >
          {value || <span className="text-gray-400 italic">Not set</span>}
        </p>
      )}
    </div>
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div
            className="w-10 h-10 border-4 border-blue-600 border-t-transparent
            rounded-full animate-spin mx-auto mb-3"
          />
          <p className="text-gray-500 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 sm:p-6">
        <BackButton />
        <p className="text-center text-red-500 mt-8">
          Failed to load profile data
        </p>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 sm:p-6 max-w-4xl mx-auto"
    >
      <div className="mb-4 sm:mb-6">
        <BackButton />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* ── Header banner ───────────────────────────────────────────────── */}
        <div className="h-24 sm:h-32 bg-gradient-to-r from-blue-500 to-purple-600" />

        <div className="px-4 sm:px-8 pb-6 sm:pb-8">
          {/* ── Avatar + title row ─────────────────────────────────────────── */}
          <div
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between
            gap-4 -mt-12 sm:-mt-14 mb-6"
          >
            {/* Avatar */}
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full ring-4 ring-white
              dark:ring-gray-800 bg-gradient-to-br from-blue-500 to-purple-600
              flex items-center justify-center text-white text-2xl sm:text-3xl font-bold
              shrink-0"
            >
              {getInitials(profile)}
            </div>

            {/* Edit button — top-right on desktop, full-width on mobile below avatar */}
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="sm:mb-1 px-4 py-2 bg-blue-600 hover:bg-blue-700
                  text-white text-sm font-medium rounded-lg transition-colors
                  w-full sm:w-auto"
              >
                ✏️ Edit Profile
              </button>
            )}
          </div>

          {/* ── Display name + role badges ─────────────────────────────────── */}
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {getDisplayName(profile) || (
                <span className="text-gray-400 italic font-normal text-base">
                  No name set
                </span>
              )}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
              @{profile.user?.username}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(profile.role)}`}
              >
                {profile.role
                  .replace("_", " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
              {profile.department && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium
                  bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200"
                >
                  {profile.department.charAt(0).toUpperCase() +
                    profile.department.slice(1)}
                </span>
              )}
            </div>
          </div>

          {/* ── Status message ─────────────────────────────────────────────── */}
          {message && (
            <div
              className={`mb-6 p-3 sm:p-4 rounded-lg text-sm font-medium
              ${
                message.ok
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                  : "bg-red-50   dark:bg-red-900/20   text-red-700   dark:text-red-300"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* ── Main content grid ──────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Left: Student info card */}
            <div className="space-y-4">
              {(profile.student_id || profile.student_class) && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <h3
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300
                    uppercase tracking-wide mb-3"
                  >
                    Student Information
                  </h3>
                  {profile.student_id && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        Student ID
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {profile.student_id}
                      </span>
                    </div>
                  )}
                  {profile.student_class && (
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-gray-500 dark:text-gray-400">
                        Class
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {profile.student_class}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Bio */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <h3
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300
                  uppercase tracking-wide mb-3"
                >
                  Bio
                </h3>
                <Field
                  label=""
                  value={formData.bio}
                  field="bio"
                  type="textarea"
                />
              </div>
            </div>

            {/* Right: Editable personal fields */}
            <div>
              <h3
                className="text-sm font-semibold text-gray-700 dark:text-gray-300
                uppercase tracking-wide mb-4"
              >
                Personal Information
              </h3>
              <div className="space-y-4">
                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="First Name"
                    value={formData.first_name}
                    field="first_name"
                  />
                  <Field
                    label="Last Name"
                    value={formData.last_name}
                    field="last_name"
                  />
                </div>
                <Field
                  label="Email"
                  value={formData.email}
                  field="email"
                  type="email"
                />
                <Field
                  label="Phone"
                  value={formData.phone}
                  field="phone"
                  type="tel"
                />
                <Field
                  label="Address"
                  value={formData.address}
                  field="address"
                  type="textarea"
                />
              </div>

              {/* Save / Cancel */}
              {editing && (
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400
                      text-white px-4 py-2.5 rounded-lg text-sm font-medium
                      transition-colors"
                  >
                    {saving ? "Saving…" : "💾 Save Changes"}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700
                      dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200
                      px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;
