import { common } from './common';
import { nav, auth, dashboard, users, roles } from './nav';
import { reportVideo } from './reportVideo';
import { reportPdf } from './reportPdf';
import { profile, settings, errors, confirmation, time, languages } from './misc';
import { learningModule } from './learningModule';
import { learningSchedule } from './learningSchedule';

export const ja = {
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
