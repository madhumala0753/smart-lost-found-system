import React, { useState } from 'react';
import { User, Mail, IdCard, Building, ShieldCheck, Check, Save, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfileDoc } from '../services/authService';

export const ProfilePage: React.FC = () => {
  const { userProfile, currentUser, isAdmin, refreshProfile, logout } = useAuth();

  const [fullName, setFullName] = useState(userProfile?.fullName || '');
  const [studentId, setStudentId] = useState(userProfile?.studentId || '');
  const [department, setDepartment] = useState(userProfile?.department || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await updateUserProfileDoc(currentUser.uid, {
        fullName: fullName.trim(),
        studentId: studentId.trim(),
        department: department.trim(),
      });
      await refreshProfile();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error('Error updating profile:', e);
      alert('Failed to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Campus Profile & Credentials
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage your verified college credentials, department, and contact info.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Banner with Avatar */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-6 sm:p-8 text-white flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-400 to-blue-500 text-slate-950 font-extrabold text-2xl flex items-center justify-center shadow-md shrink-0">
            {userProfile?.fullName?.charAt(0).toUpperCase() || 'U'}
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white truncate">
                {userProfile?.fullName || 'Campus Member'}
              </h3>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 truncate">{userProfile?.email}</p>
            <div className="text-[11px] text-teal-300 font-medium">
              Role: {isAdmin ? 'Campus Safety Administrator' : 'Student / Reporter'}
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Profile details updated successfully!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              College Email (Fixed)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="email"
                disabled
                value={userProfile?.email || ''}
                className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed outline-hidden"
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Associated with your authenticated Firebase login session.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student / Staff ID
              </label>
              <div className="relative">
                <IdCard className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. 892341"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department / Major
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
