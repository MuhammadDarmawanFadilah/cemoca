import { common } from './common';
import { nav } from './nav';
import { auth } from './auth';
import { dashboard } from './dashboard';
import { users } from './users';
import { roles } from './roles';
import { reportVideo } from './reportVideo';
import { reportPdf } from './reportPdf';
import { profile, settings, errors, confirmation, time, languages } from './misc';
import { learningModule } from './learningModule';
import { learningSchedule } from './learningSchedule';

export const hi = {
  common,
  nav,
  auth,
  dashboard,
  users,
  roles,
  reportVideo,
  reportPdf,
  learningSchedule,
  learningModule,
  profile,
  settings,
  errors,
  confirmation,
  time,
  languages,
} as const;

export type TranslationKeys = typeof hi;
