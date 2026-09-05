import React, { useState, useEffect } from 'react';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { PortalSelection } from './components/portal/PortalSelection';
import { StudentPortal } from './components/student/StudentPortal';
import { StaffAdminLogin } from './components/auth/StaffAdminLogin';
import { StaffPanel } from './components/staff/StaffPanel';
import { AdminDashboard } from './components/admin/AdminDashboard';
import {
  getStoredActiveUser,
  saveStoredActiveUser,
} from './lib/storage';
import {
  seedFirestoreIfEmpty,
  subscribeScholarships,
  subscribeApplications,
  subscribeFreezePeriods,
  subscribeInterviews,
  subscribeUsers,
  saveScholarshipToFirestore,
  deleteScholarshipFromFirestore,
  createApplicationInFirestore,
  updateApplicationInFirestore,
  deleteApplicationFromFirestore,
  saveFreezePeriodToFirestore,
  resetFirestoreScholarships,
  saveUserToFirestore,
  deleteUserFromFirestore,
} from './lib/firebase';
import {
  fetchAllBackendData,
  syncCreateApplication,
  syncUpdateApplication,
  syncDeleteApplication,
  syncSaveScholarship,
  syncDeleteScholarship,
  syncSaveFreezePeriod,
} from './lib/dataSync';
import { Scholarship, Application, FreezePeriod, UserProfile, InterviewSchedule } from './types';
import { checkDuplicateApplication } from './lib/duplicateCheck';
import { logEvent } from './lib/logger';

export default function App() {
  const [activeUser, setActiveUser] = useState<UserProfile | null>(() => getStoredActiveUser());
  const [currentView, setCurrentView] = useState<'portal' | 'student' | 'login' | 'staff' | 'admin'>(() => {
    const user = getStoredActiveUser();
    const storedView = localStorage.getItem('scholarflow_current_view') as any;
    if (user) {
      if (storedView === 'admin' || storedView === 'staff') return storedView;
      return user.role === 'admin' ? 'admin' : 'staff';
    }
    if (storedView === 'student' || storedView === 'portal' || storedView === 'login') {
      return storedView;
    }
    return 'portal';
  });

  const changeView = (view: 'portal' | 'student' | 'login' | 'staff' | 'admin') => {
    setCurrentView(view);
    localStorage.setItem('scholarflow_current_view', view);
  };

  // Live Cloud Firestore Data State
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [freezePeriods, setFreezePeriods] = useState<FreezePeriod[]>([]);
  const [interviews, setInterviews] = useState<InterviewSchedule[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  // Initialize and connect live Cloud Firestore listeners & backend data sync on mount
  useEffect(() => {
    const loadedUser = getStoredActiveUser();
    setActiveUser(loadedUser);

    if (loadedUser) {
      const storedView = localStorage.getItem('scholarflow_current_view');
      // Session persistence fix: only restore valid views for the user's role.
      // Admin can access 'admin'. Staff can access 'staff'. Both are valid stored views.
      // Do NOT force-overwrite a valid stored view on refresh.
      const isValidAdminView = storedView === 'admin' && loadedUser.role === 'admin';
      const isValidStaffView = storedView === 'staff';
      if (isValidAdminView || isValidStaffView) {
        setCurrentView(storedView as any);
      } else {
        const defaultView = loadedUser.role === 'admin' ? 'admin' : 'staff';
        setCurrentView(defaultView);
        localStorage.setItem('scholarflow_current_view', defaultView);
      }
    }

    // Automatically seed Cloud Firestore database if collections are empty
    seedFirestoreIfEmpty().catch((err) => {
      console.warn('Initial Firestore setup notice:', err);
    });

    // Initial Fetch from backend REST API (fast immediate bootstrap)
    fetchAllBackendData().then((backendData) => {
      if (backendData.scholarships.length > 0) {
        setScholarships((prev) => (prev.length === 0 ? backendData.scholarships : prev));
      }
      if (backendData.applications.length > 0) {
        setApplications((prev) => (prev.length === 0 ? backendData.applications : prev));
      }
      if (backendData.freezePeriods.length > 0) {
        setFreezePeriods((prev) => (prev.length === 0 ? backendData.freezePeriods : prev));
      }
      if (backendData.interviews.length > 0) {
        setInterviews((prev) => (prev.length === 0 ? backendData.interviews : prev));
      }
    });

    // Real-time Cloud Firestore data subscriptions (pushes instant live updates to frontend)
    const unsubScholarships = subscribeScholarships((list) => {
      if (list && list.length > 0) setScholarships(list);
    });

    const unsubApplications = subscribeApplications((list) => {
      setApplications(list);
    });

    const unsubFreezePeriods = subscribeFreezePeriods((list) => {
      setFreezePeriods(list);
    });

    const unsubInterviews = subscribeInterviews((list) => {
      setInterviews(list);
    });

    // Real-time synchronization of faculty, staff, and professor accounts from Cloud Firestore
    const unsubUsers = subscribeUsers((list) => {
      setUsers(list);
      setActiveUser((prev) => {
        if (!prev) return null;
        const freshUser = list.find((u) => u.id === prev.id);
        if (freshUser) {
          saveStoredActiveUser(freshUser);
          return freshUser;
        }
        return prev;
      });
    });

    return () => {
      unsubScholarships();
      unsubApplications();
      unsubFreezePeriods();
      unsubInterviews();
      unsubUsers();
    };
  }, []);

  const handleLoginSuccess = (user: UserProfile) => {
    setActiveUser(user);
    saveStoredActiveUser(user);
    const targetView = user.role === 'admin' ? 'admin' : 'staff';
    changeView(targetView);
    logEvent('Security', 'Authentication', `User signed in: ${user.full_name} (${user.email}) — Role: ${user.role}`);
  };

  const handleLogout = () => {
    const currentUser = activeUser;
    setActiveUser(null);
    saveStoredActiveUser(null);
    localStorage.removeItem('scholarflow_current_view');
    setCurrentView('portal');
    if (currentUser) {
      logEvent('Security', 'Authentication', `User signed out: ${currentUser.full_name} (${currentUser.email})`);
    }
  };

  // Student Actions: Add Application (Completely recorded on Frontend, Backend API, and Cloud Firestore)
  const handleNewApplication = async (newApp: Application) => {
    // 1. Guard against duplicate application with same scholarship and same email or student ID
    const dupCheck = checkDuplicateApplication(
      applications,
      newApp.scholarship_id,
      newApp.email,
      newApp.student_number
    );
    if (dupCheck.isDuplicate) {
      console.warn('Blocked duplicate application submission:', dupCheck.message);
      throw new Error('You already applied for this scholarship');
    }

    // 2. Immediately reflect on frontend state (Optimistic update)
    setApplications((prev) => [newApp, ...prev.filter((a) => a.id !== newApp.id)]);

    // 3. Decrement slot count for target scholarship
    const targetSch = scholarships.find(s => s.id === newApp.scholarship_id || s.title === newApp.scholarship_title);
    if (targetSch && targetSch.slots_remaining > 0) {
      const updatedSch = {
        ...targetSch,
        slots_remaining: Math.max(0, targetSch.slots_remaining - 1)
      };
      setScholarships((prev) => prev.map(s => s.id === targetSch.id ? updatedSch : s));
      try {
        await syncSaveScholarship(updatedSch);
      } catch (err) {
        console.error('Failed to sync slot decrement:', err);
      }
    }

    try {
      await syncCreateApplication(newApp);
      logEvent('Info', 'Application', `New application submitted: ${newApp.reference_code} — ${newApp.first_name} ${newApp.last_name} for "${newApp.scholarship_title}"`);
    } catch (err: any) {
      console.error('Failed to sync application to backend/database:', err);
      if (err?.message?.includes('already applied')) {
        setApplications((prev) => prev.filter((a) => a.id !== newApp.id));
        throw err;
      }
    }
  };

  // Staff Actions: Edit & Delete Application (Completely recorded on Frontend, Backend API, and Cloud Firestore)
  const handleUpdateApplicationFromStaff = async (updatedApp: Application) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === updatedApp.id ? updatedApp : a))
    );

    try {
      await syncUpdateApplication(updatedApp);
      logEvent('Info', 'Application', `Application ${updatedApp.reference_code} status updated to "${updatedApp.status}" — ${updatedApp.first_name} ${updatedApp.last_name}`);
    } catch (err) {
      console.error('Failed to update application in backend/Firestore:', err);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    // Find application being deleted to restore target scholarship slot count
    const appToDelete = applications.find((a) => a.id === id);

    // Optimistically remove from UI immediately
    setApplications((prev) => prev.filter((a) => a.id !== id));

    // Slot restoration: must run BEFORE syncDeleteApplication to ensure the
    // Firestore snapshot update from deletion doesn't race-overwrite the slot count.
    if (appToDelete) {
      const targetSch = scholarships.find(
        (s) => s.id === appToDelete.scholarship_id || s.title === appToDelete.scholarship_title
      );
      if (targetSch) {
        const restoredSlots = Math.min(targetSch.slots, targetSch.slots_remaining + 1);
        const updatedSch = {
          ...targetSch,
          slots_remaining: restoredSlots,
        };
        // Update local state first
        setScholarships((prev) => prev.map((s) => (s.id === targetSch.id ? updatedSch : s)));
        try {
          // Persist restored slot count to both backend and Firestore
          await syncSaveScholarship(updatedSch);
          logEvent('Info', 'Scholarship', `Slot restored for "${targetSch.title}": ${targetSch.slots_remaining} → ${restoredSlots} (after application deletion)`);
        } catch (err) {
          console.error('Failed to sync restored slot count:', err);
        }
      }
      logEvent('Warning', 'Application', `Application deleted: ${appToDelete.reference_code} — ${appToDelete.first_name} ${appToDelete.last_name}`);
    }

    try {
      await syncDeleteApplication(id);
    } catch (err) {
      console.error('Failed to delete application from backend/Firestore:', err);
    }
  };

  const handleSaveFreezeAction = async (freezeRecord: FreezePeriod) => {
    setFreezePeriods((prev) => [freezeRecord, ...prev.filter((f) => f.id !== freezeRecord.id)]);

    try {
      await syncSaveFreezePeriod(freezeRecord);

      // Update targeted scholarships based on is_active (freeze vs unfreeze)
      const targeted = scholarships.filter(
        (s) => freezeRecord.scholarship_id === 'all' || s.id === freezeRecord.scholarship_id
      );
      const actionLabel = freezeRecord.is_active ? 'FROZEN' : 'UNFROZEN';
      for (const s of targeted) {
        const updated: Scholarship = {
          ...s,
          is_frozen: freezeRecord.is_active,
          freeze_note: freezeRecord.is_active ? freezeRecord.announcement_note : undefined,
        };
        setScholarships((prev) => prev.map((item) => (item.id === s.id ? updated : item)));
        await syncSaveScholarship(updated);
      }
      logEvent(
        freezeRecord.is_active ? 'Warning' : 'Info',
        'Freeze',
        `Scholarship ${actionLabel}: ${freezeRecord.scholarship_title || 'All Programs'} — "${freezeRecord.announcement_note}"`
      );
    } catch (err) {
      console.error('Failed to save freeze period to backend/Firestore:', err);
    }
  };

  // Admin Actions: Add, Edit, Delete Scholarship
  const handleSaveScholarshipFromAdmin = async (sch: Scholarship) => {
    const isNew = !scholarships.some((s) => s.id === sch.id);
    setScholarships((prev) => {
      const exists = prev.some((s) => s.id === sch.id);
      return exists ? prev.map((s) => (s.id === sch.id ? sch : s)) : [sch, ...prev];
    });

    try {
      await syncSaveScholarship(sch);
      logEvent('System', 'Scholarship', `Scholarship ${isNew ? 'created' : 'updated'}: "${sch.title}" (${sch.code}) — Slots: ${sch.slots}, Grant: ₱${sch.grant_amount.toLocaleString()}`);
    } catch (err) {
      console.error('Failed to save scholarship to backend/Firestore:', err);
    }
  };

  const handleDeleteScholarshipFromAdmin = async (id: string) => {
    const schToDelete = scholarships.find((s) => s.id === id);
    setScholarships((prev) => prev.filter((s) => s.id !== id));

    try {
      await syncDeleteScholarship(id);
      logEvent('Warning', 'Scholarship', `Scholarship deleted: "${schToDelete?.title || id}" (${schToDelete?.code || id})`);
    } catch (err) {
      console.error('Failed to delete scholarship from backend/Firestore:', err);
    }
  };

  const handleRestoreDefaultScholarships = async () => {
    try {
      await resetFirestoreScholarships();
    } catch (err) {
      console.error('Failed to restore default scholarships in Firestore:', err);
    }
  };

  // Faculty & User Accounts Update (Cloud Firestore & Backend API)
  const handleUpdateUser = async (updatedUser: UserProfile) => {
    try {
      setUsers((prev) => {
        const index = prev.findIndex((u) => u.id === updatedUser.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = updatedUser;
          return next;
        }
        return [...prev, updatedUser];
      });

      if (activeUser && activeUser.id === updatedUser.id) {
        setActiveUser(updatedUser);
        saveStoredActiveUser(updatedUser);
      }

      const firestorePromise = saveUserToFirestore(updatedUser).catch((err) => {
        console.error('Failed to update user profile in Firestore:', err);
      });

      const backendPromise = fetch(`/api/users/${updatedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      }).catch((backendErr) => {
        console.warn('Backend API notification notice:', backendErr);
      });

      await Promise.allSettled([firestorePromise, backendPromise]);
    } catch (err) {
      console.error('Failed to update user profile:', err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = users.find((u) => u.id === userId);
    try {
      setUsers((prev) => prev.filter((u) => u.id !== userId));

      const firestorePromise = deleteUserFromFirestore(userId).catch((err) => {
        console.error('Failed to delete user in Firestore:', err);
      });

      const backendPromise = fetch(`/api/users/${userId}`, { method: 'DELETE' }).catch((backendErr) => {
        console.warn('Backend API delete notice:', backendErr);
      });

      await Promise.allSettled([firestorePromise, backendPromise]);
      logEvent('Warning', 'UserManagement', `Staff account deleted: "${userToDelete?.full_name || userId}" (${userToDelete?.email || userId})`);
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-600 selection:text-white">
      
      {/* Universal Header */}
      <Header
        activeUser={activeUser}
        onLogout={handleLogout}
        currentView={currentView}
        onNavigate={view => {
          if (view === 'staff' && activeUser?.role !== 'staff') {
            changeView('login');
          } else if (view === 'admin' && activeUser?.role !== 'admin') {
            changeView('login');
          } else {
            changeView(view);
          }
        }}
      />

      {/* Main Page Views */}
      <main className="flex-1">
        {currentView === 'portal' && (
          <PortalSelection
            onSelectPortal={portal => changeView(portal)}
            openScholarshipsCount={scholarships.filter(s => !s.is_frozen).length}
          />
        )}

        {currentView === 'student' && (
          <StudentPortal
            scholarships={scholarships}
            applications={applications}
            freezePeriods={freezePeriods}
            onNewApplication={handleNewApplication}
          />
        )}

        {currentView === 'login' && (
          <StaffAdminLogin
            onLoginSuccess={handleLoginSuccess}
            onBackToPortal={() => changeView('portal')}
          />
        )}

        {currentView === 'staff' && activeUser && (
          <StaffPanel
            user={activeUser}
            scholarships={scholarships}
            applications={applications}
            freezePeriods={freezePeriods}
            interviews={interviews}
            onUpdateApplication={handleUpdateApplicationFromStaff}
            onDeleteApplication={handleDeleteApplication}
            onSaveFreeze={handleSaveFreezeAction}
            onUpdateUser={handleUpdateUser}
          />
        )}

        {currentView === 'admin' && activeUser && (
          <AdminDashboard
            user={activeUser}
            users={users}
            scholarships={scholarships}
            applications={applications}
            onSaveScholarship={handleSaveScholarshipFromAdmin}
            onDeleteScholarship={handleDeleteScholarshipFromAdmin}
            onRestoreDefaultScholarships={handleRestoreDefaultScholarships}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        )}
      </main>

      {/* Universal Footer */}
      <Footer />

    </div>
  );
}
