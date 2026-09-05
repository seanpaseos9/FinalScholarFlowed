import { Application } from '../types';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingApp?: Application;
  matchType?: 'both' | 'email' | 'student_number';
  message: string;
}

/**
 * Validates if an applicant has already applied for the same scholarship program
 * based on their institutional email address or student ID number.
 */
export function checkDuplicateApplication(
  applications: Application[],
  scholarshipId: string,
  email?: string,
  studentNumber?: string
): DuplicateCheckResult {
  const normEmail = email?.trim().toLowerCase();
  const cleanId = studentNumber?.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  if (!normEmail && !cleanId) {
    return { isDuplicate: false, message: '' };
  }

  const existingApp = applications.find(app => {
    if (app.scholarship_id !== scholarshipId) return false;

    const appEmail = app.email?.trim().toLowerCase();
    const appCleanId = app.student_number?.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    const emailMatch = Boolean(normEmail && appEmail && appEmail === normEmail);
    const idMatch = Boolean(cleanId && appCleanId && appCleanId === cleanId);

    return emailMatch || idMatch;
  });

  if (!existingApp) {
    return { isDuplicate: false, message: '' };
  }

  const appEmail = existingApp.email?.trim().toLowerCase();
  const appCleanId = existingApp.student_number?.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  const emailMatch = Boolean(normEmail && appEmail && appEmail === normEmail);
  const idMatch = Boolean(cleanId && appCleanId && appCleanId === cleanId);

  let matchType: 'both' | 'email' | 'student_number' = 'both';
  if (emailMatch && idMatch) {
    matchType = 'both';
  } else if (emailMatch) {
    matchType = 'email';
  } else {
    matchType = 'student_number';
  }

  return {
    isDuplicate: true,
    existingApp,
    matchType,
    message: 'You already applied for this scholarship',
  };
}
