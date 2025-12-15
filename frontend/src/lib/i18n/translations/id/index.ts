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

export const id = {
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
