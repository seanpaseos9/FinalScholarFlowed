import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserCheck, Mail, Building, Shield, CheckCircle2, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { UserProfile } from '../../types';
import { hashPassword } from '../../lib/crypto';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSave: (updatedUser: UserProfile) => Promise<void> | void;
  title?: string;
  allowRoleChange?: boolean;
  existingUsers?: UserProfile[];
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
  title = 'Edit Faculty / Staff Profile',
  allowRoleChange = false,
  existingUsers = [],
}) => {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [academicTitle, setAcademicTitle] = useState('');
  const [role, setRole] = useState<'staff' | 'admin'>('staff');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Parse and populate initial values
  const populateFromUser = (u: UserProfile) => {
    if (u.first_name || u.last_name) {
      setFirstName(u.first_name || '');
      setMiddleName(u.middle_name || '');
      setLastName(u.last_name || '');
    } else if (u.full_name) {
      const parts = u.full_name.trim().split(/\s+/);
      if (parts.length === 1) {
        setFirstName(parts[0]);
        setMiddleName('');
        setLastName('');
      } else if (parts.length === 2) {
        setFirstName(parts[0]);
        setMiddleName('');
        setLastName(parts[1]);
      } else {
        setFirstName(parts[0]);
        setMiddleName(parts.slice(1, -1).join(' '));
        setLastName(parts[parts.length - 1]);
      }
    } else {
      setFirstName('');
      setMiddleName('');
      setLastName('');
    }
    setDepartment(u.department || '');
    setEmail(u.email || '');
    setPassword('');
    setAcademicTitle(u.title || '');
    setRole(u.role || 'staff');
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowPassword(false);
  };

  useEffect(() => {
    if (user && isOpen) {
      populateFromUser(user);
    }
  }, [user, isOpen]);

  // Keyboard accessibility: Escape key dismisses modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !saving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, saving, onClose]);

  if (!isOpen || !user) return null;

  const hasActiveInput = Boolean(
    firstName || middleName || lastName || department || email || academicTitle || password
  );

  const handleClear = () => {
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setDepartment('');
    setEmail('');
    setAcademicTitle('');
    setPassword('');
    setErrorMessage(null);
  };

  const handleReset = () => {
    if (user) {
      populateFromUser(user);
    }
  };

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isDuplicateEmail = existingUsers.some(
    (u) => u.id !== user.id && u.email.trim().toLowerCase() === email.trim().toLowerCase()
  );

  const isFormValid =
    firstName.trim().length > 0 &&
    firstName.trim().length <= 50 &&
    middleName.trim().length <= 50 &&
    lastName.trim().length > 0 &&
    lastName.trim().length <= 50 &&
    isEmailValid &&
    !isDuplicateEmail &&
    department.trim().length > 0 &&
    academicTitle.trim().length > 0 &&
    (!user?.id?.startsWith('usr-faculty-') || password.trim().length >= 4 || !!user?.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!firstName.trim()) {
      setErrorMessage('Please enter faculty First Name.');
      return;
    }
    if (firstName.trim().length > 50) {
      setErrorMessage('First Name cannot exceed 50 characters.');
      return;
    }
    if (middleName.trim().length > 50) {
      setErrorMessage('Middle Name cannot exceed 50 characters.');
      return;
    }
    if (!lastName.trim()) {
      setErrorMessage('Please enter faculty Last Name.');
      return;
    }
    if (lastName.trim().length > 50) {
      setErrorMessage('Last Name cannot exceed 50 characters.');
      return;
    }
    if (!academicTitle.trim()) {
      setErrorMessage('Please enter an Academic Title / Position.');
      return;
    }
    if (!department.trim()) {
      setErrorMessage('Please enter the Department / Office.');
      return;
    }
    if (!email.trim() || !isEmailValid) {
      setErrorMessage('Please enter a valid institutional email address.');
      return;
    }
    if (isDuplicateEmail) {
      setErrorMessage(`A faculty account with email "${email.trim()}" already exists in the system.`);
      return;
    }

    setSaving(true);
    try {
      const rawPassword = password.trim();
      const hashedPassword = rawPassword
        ? await hashPassword(rawPassword)
        : (user.password || '');

      const constructedFullName = `${firstName.trim()} ${middleName.trim() ? `${middleName.trim()} ` : ''}${lastName.trim()}`.trim();

      const updated: UserProfile = {
        ...user,
        first_name: firstName.trim(),
        middle_name: middleName.trim() || undefined,
        last_name: lastName.trim(),
        full_name: constructedFullName,
        department: department.trim(),
        email: email.trim(),
        password: hashedPassword,
        title: academicTitle.trim(),
        role: allowRoleChange ? role : user.role,
        updated_at: new Date().toISOString(),
      };

      await onSave(updated);
      setSuccessMessage('Faculty profile updated successfully!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to update user profile:', err);
      setErrorMessage(err.message || 'Failed to update faculty profile. Please try again.');
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
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form Top Control Bar: Reset and Clear */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                Personal Information
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  disabled={!hasActiveInput}
                  onClick={handleClear}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    hasActiveInput
                      ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 cursor-pointer border border-rose-200'
                      : 'text-slate-400 bg-slate-100 cursor-not-allowed border border-slate-200'
                  }`}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Structured Faculty Name: First, Middle, Last */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[9px] font-mono ${firstName.length >= 50 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                    {firstName.length}/50
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Elena"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Middle Name
                  </label>
                  <span className={`text-[9px] font-mono ${middleName.length >= 50 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                    {middleName.length}/50
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={50}
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Marie"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[9px] font-mono ${lastName.length >= 50 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                    {lastName.length}/50
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Rostova"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Academic Title / Designation */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Academic Title / Position <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={academicTitle}
                onChange={(e) => setAcademicTitle(e.target.value)}
                placeholder="e.g. Associate Professor & Scholarship Head"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Department / Office <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  maxLength={100}
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
                  maxLength={100}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. staff@scholarflow.edu"
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:outline-none transition-all ${
                    isDuplicateEmail
                      ? 'bg-rose-50 border-2 border-rose-400 text-rose-900 focus:ring-rose-500'
                      : 'bg-slate-50 border border-slate-200 text-slate-900 focus:ring-indigo-500'
                  }`}
                />
              </div>
              {isDuplicateEmail && (
                <span className="text-[10px] text-rose-600 font-semibold block mt-1">
                  A faculty account with this email address already exists.
                </span>
              )}
            </div>

            {/* Password Field */}
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* System Role */}
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
                disabled={saving || !isFormValid}
                className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-900 rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
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
