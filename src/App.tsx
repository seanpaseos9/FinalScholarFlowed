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

export default function App() {
  const [currentView, setCurrentView] = useState<'portal' | 'student' | 'login' | 'staff' | 'admin'>('portal');
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);

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
      if (loadedUser.role === 'admin') setCurrentView('admin');
      else if (loadedUser.role === 'staff') setCurrentView('staff');
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
      // If active user is logged in, automatically reflect any changes made to their profile in Cloud Firestore!
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

  // Auth Callbacks
  const handleLoginSuccess = (user: UserProfile) => {
    setActiveUser(user);
    if (user.role === 'admin') {
      setCurrentView('admin');
    } else {
      setCurrentView('staff');
    }
  };

  const handleLogout = () => {
    setActiveUser(null);
    saveStoredActiveUser(null);
    setCurrentView('portal');
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

    // Decrement slot count in frontend state
    const targetSch = scholarships.find((s) => s.id === newApp.scholarship_id);
    if (targetSch && targetSch.slots_remaining > 0) {
      const updatedSch = { ...targetSch, slots_remaining: targetSch.slots_remaining - 1 };
      setScholarships((prev) => prev.map((s) => (s.id === targetSch.id ? updatedSch : s)));
      syncSaveScholarship(updatedSch).catch((err) => console.warn('Slot update notice:', err));
    }

    // 3. Persist to Backend REST API & Cloud Firestore Database
    try {
      await syncCreateApplication(newApp);
    } catch (err: any) {
      console.error('Failed to sync application to backend/database:', err);
      // Revert frontend state if duplicate rejection from backend
      if (err?.message?.includes('already applied')) {
        setApplications((prev) => prev.filter((a) => a.id !== newApp.id));
        throw err;
      }
    }
  };

  // Staff Actions: Edit & Delete Application (Completely recorded on Frontend, Backend API, and Cloud Firestore)
  const handleUpdateApplicationFromStaff = async (updatedApp: Application) => {
    // Immediately reflect on frontend state
    setApplications((prev) =>
      prev.map((a) => (a.id === updatedApp.id ? updatedApp : a))
    );

    // Persist to Backend REST API & Cloud Firestore Database
    try {
      await syncUpdateApplication(updatedApp);
    } catch (err) {
      console.error('Failed to update application in backend/Firestore:', err);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    // Immediately reflect on frontend state
    setApplications((prev) => prev.filter((a) => a.id !== id));

    // Persist deletion to Backend REST API & Cloud Firestore Database
    try {
      await syncDeleteApplication(id);
    } catch (err) {
      console.error('Failed to delete application from backend/Firestore:', err);
    }
  };

  const handleSaveFreezeAction = async (freezeRecord: FreezePeriod) => {
    // Immediately reflect on frontend state
    setFreezePeriods((prev) => [freezeRecord, ...prev.filter((f) => f.id !== freezeRecord.id)]);

    try {
      await syncSaveFreezePeriod(freezeRecord);

      // If freeze is active, update targeted scholarships
      if (freezeRecord.is_active) {
        const targeted = scholarships.filter(
          (s) => freezeRecord.scholarship_id === 'all' || s.id === freezeRecord.scholarship_id
        );
        for (const s of targeted) {
          const updated = {
            ...s,
            is_frozen: true,
            freeze_note: freezeRecord.announcement_note,
          };
          setScholarships((prev) => prev.map((item) => (item.id === s.id ? updated : item)));
          await syncSaveScholarship(updated);
        }
      }
    } catch (err) {
      console.error('Failed to save freeze period to backend/Firestore:', err);
    }
  };

  // Admin Actions: Add, Edit, Delete Scholarship (Completely recorded on Frontend, Backend API, and Cloud Firestore)
  const handleSaveScholarshipFromAdmin = async (sch: Scholarship) => {
    // Immediately reflect on frontend state
    setScholarships((prev) => {
      const exists = prev.some((s) => s.id === sch.id);
      return exists ? prev.map((s) => (s.id === sch.id ? sch : s)) : [sch, ...prev];
    });

    try {
      await syncSaveScholarship(sch);
    } catch (err) {
      console.error('Failed to save scholarship to backend/Firestore:', err);
    }
  };

  const handleDeleteScholarshipFromAdmin = async (id: string) => {
    // Immediately reflect on frontend state
    setScholarships((prev) => prev.filter((s) => s.id !== id));

    try {
      await syncDeleteScholarship(id);
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
      // Optimistic update so UI reflects immediately
      setUsers((prev) => {
        const index = prev.findIndex((u) => u.id === updatedUser.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = updatedUser;
          return next;
        }
        return [...prev, updatedUser];
      });

      // If updating currently logged in user, refresh immediate local state
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
    try {
      setUsers((prev) => prev.filter((u) => u.id !== userId));

      const firestorePromise = deleteUserFromFirestore(userId).catch((err) => {
        console.error('Failed to delete user in Firestore:', err);
      });

      const backendPromise = fetch(`/api/users/${userId}`, { method: 'DELETE' }).catch((backendErr) => {
        console.warn('Backend API delete notice:', backendErr);
      });

      await Promise.allSettled([firestorePromise, backendPromise]);
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
            setCurrentView('login');
          } else if (view === 'admin' && activeUser?.role !== 'admin') {
            setCurrentView('login');
          } else {
            setCurrentView(view);
          }
        }}
      />

      {/* Main Page Views */}
      <main className="flex-1">
        {currentView === 'portal' && (
          <PortalSelection
            onSelectPortal={portal => setCurrentView(portal)}
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
            onBackToPortal={() => setCurrentView('portal')}
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
