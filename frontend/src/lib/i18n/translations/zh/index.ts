import { common } from './common';
import { nav, auth, dashboard, users, roles } from './nav';
import { reportVideo } from './reportVideo';
import { reportPdf } from './reportPdf';
import { profile, settings, errors, confirmation, time, languages } from './misc';
import { learningModule } from './learningModule';

export const zh = {
  common,
  nav,
  auth,
  dashboard,
  users,
  roles,
  reportVideo,
  reportPdf,
  learningModule,
  profile,
  settings,
  errors,
  confirmation,
  time,
  languages,
} as const;
