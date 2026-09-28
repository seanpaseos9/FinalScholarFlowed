import {
  Scholarship,
  Application,
  FreezePeriod,
  InterviewSchedule,
  UserProfile,
  StaffApplication,
} from '../types';
async function requestApi(path: string, options: RequestInit): Promise<Response> {
  const response = await fetch(path, options);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with ${response.status}`);
  }
  return response;
}

/**
 * Data Synchronization Service
 * Ensures every create, edit, and delete action is completely recorded
 * through the Backend API server (which persists to Cloud Firestore),
 * and immediately reflected on the frontend by Firestore subscriptions.
 */

// -------------------------------------------------------------
// APPLICATIONS
// -------------------------------------------------------------

export async function syncCreateApplication(application: Application): Promise<Application> {
  await requestApi('/api/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(application),
  });
  return application;
}

export async function syncUpdateApplication(application: Application): Promise<Application> {
  await requestApi(`/api/applications/${application.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(application),
  });

  return application;
}

export async function syncDeleteApplication(id: string): Promise<void> {
  await requestApi(`/api/applications/${id}`, {
    method: 'DELETE',
  });
}

// -------------------------------------------------------------
// SCHOLARSHIPS
// -------------------------------------------------------------

export async function syncSaveScholarship(scholarship: Scholarship): Promise<Scholarship> {
  await requestApi(`/api/scholarships/${scholarship.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scholarship),
  });

  return scholarship;
}

export async function syncDeleteScholarship(id: string): Promise<void> {
  await requestApi(`/api/scholarships/${id}`, {
    method: 'DELETE',
  });
}

// -------------------------------------------------------------
// FREEZE PERIODS & INTERVIEWS
// -------------------------------------------------------------

export async function syncSaveFreezePeriod(period: FreezePeriod): Promise<FreezePeriod> {
  await requestApi('/api/freeze-periods', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(period),
  });

  return period;
}

export async function syncSaveInterview(interview: InterviewSchedule): Promise<InterviewSchedule> {
  await requestApi('/api/interviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(interview),
  });

  return interview;
}

export async function syncDeleteInterview(id: string): Promise<void> {
  await requestApi(`/api/interviews/${id}`, {
    method: 'DELETE',
  });
}

// -------------------------------------------------------------
// STAFF ACCOUNT APPLICATIONS
// -------------------------------------------------------------

export async function syncCreateStaffApplication(app: StaffApplication): Promise<StaffApplication> {
  await requestApi('/api/staff-applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(app),
  });
  return app;
}

export async function syncUpdateStaffApplication(app: StaffApplication): Promise<StaffApplication> {
  await requestApi(`/api/staff-applications/${app.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(app),
  });

  return app;
}

export async function syncSaveUser(user: UserProfile): Promise<UserProfile> {
  await requestApi(`/api/users/${user.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  return user;
}

// -------------------------------------------------------------
// INITIAL RECOVERY & SYNC FETCH
// -------------------------------------------------------------

export async function fetchAllBackendData() {
  const results = {
    scholarships: [] as Scholarship[],
    applications: [] as Application[],
    freezePeriods: [] as FreezePeriod[],
    interviews: [] as InterviewSchedule[],
    staffApplications: [] as StaffApplication[],
  };

  try {
    const [resSch, resApp, resFreeze, resInterviews, resStaffApps] = await Promise.allSettled([
      fetch('/api/scholarships').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/applications').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/freeze-periods').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/interviews').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/staff-applications').then((r) => (r.ok ? r.json() : null)),
    ]);

    if (resSch.status === 'fulfilled' && resSch.value?.scholarships) {
      results.scholarships = resSch.value.scholarships;
    }
    if (resApp.status === 'fulfilled' && resApp.value?.applications) {
      results.applications = resApp.value.applications;
    }
    if (resFreeze.status === 'fulfilled' && resFreeze.value?.freeze_periods) {
      results.freezePeriods = resFreeze.value.freeze_periods;
    }
    if (resInterviews.status === 'fulfilled' && resInterviews.value?.interviews) {
      results.interviews = resInterviews.value.interviews;
    }
    if (resStaffApps.status === 'fulfilled' && resStaffApps.value?.staff_applications) {
      results.staffApplications = resStaffApps.value.staff_applications;
    }
  } catch (err) {
    console.warn('Data sync initial fetch notice:', err);
  }

  return results;
}

