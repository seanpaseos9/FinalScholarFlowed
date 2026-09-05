import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserCheck, Mail, Building, Shield, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';
import { UserProfile } from '../../types';
import { hashPassword } from '../../lib/crypto';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSave: (updatedUser: UserProfile) => Promise<void> | void;
  title?: string;
  allowRoleChange?: boolean;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
  title = 'Edit Faculty / Staff Profile',
  allowRoleChange = false,
}) => {
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [academicTitle, setAcademicTitle] = useState('');
  const [role, setRole] = useState<'staff' | 'admin'>('staff');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setDepartment(user.department || '');
      setEmail(user.email || '');
      setPassword(''); // Leave blank — user types a new password to change it; blank = keep existing hash
      setAcademicTitle(user.title || '');
      setRole(user.role || 'staff');
      setSuccessMessage(null);
      setShowPassword(false);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    setSaving(true);
    try {
      // Hash the password before persisting — never store plaintext
      // If user left the password field blank, preserve the existing stored hash
      const rawPassword = password.trim();
      const hashedPassword = rawPassword
        ? await hashPassword(rawPassword)
        : (user.password || ''); // keep existing hash

      const updated: UserProfile = {
        ...user,
        full_name: fullName.trim(),
        department: department.trim(),
        email: email.trim(),
        password: hashedPassword,
        title: academicTitle.trim(),
        role: allowRoleChange ? role : user.role,
        updated_at: new Date().toISOString(),
      };

      await onSave(updated);
      setSuccessMessage('Profile updated successfully! Changes are live.');
      // Auto-close after showing success feedback
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      console.error('Failed to update user profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight text-white">{title}</h3>
                <p className="text-xs text-slate-400">Configure reviewer profile and access credentials</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Full Name Input (e.g. Prof Name) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name / Professor Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Prof. Elena Rostova or Dr. Marcus Vance"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>

            {/* Academic Title / Designation */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Academic Title / Position
              </label>
              <input
                type="text"
                value={academicTitle}
                onChange={(e) => setAcademicTitle(e.target.value)}
                placeholder="e.g. Associate Professor & Scholarship Head"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Department / Office
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Student Affairs & Financial Aid Services"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Institutional Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Institutional Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. staff@scholarflow.edu"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Written Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Login Password <span className="text-slate-400 font-normal">(leave blank to keep current)</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  minLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password (min. 4 chars), or leave blank to keep current"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Reviewers use this password along with their institutional email to sign in to the portal.
              </p>
            </div>

            {/* System Role (Fixed to current role or Staff only) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                System Role
              </label>
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-700">
                <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-semibold text-slate-800">
                  {user.role === 'admin' ? 'System Administrator' : 'Staff Coordinator / Faculty Reviewer'}
                </span>
                <span className="ml-auto bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-100">
                  {user.role === 'admin' ? 'Admin' : 'Staff Only'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-indigo-600 rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
              >
                {saving ? (
                  <span>Saving Changes...</span>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 text-indigo-400" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
