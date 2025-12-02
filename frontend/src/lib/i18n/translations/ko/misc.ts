export const profile = {
  title: "프로필",
  editProfile: "프로필 편집",
  editBiography: "자기소개 편집",
  personalInfo: "개인 정보",
  changeAvatar: "아바타 변경",
  updateSuccess: "프로필이 업데이트되었습니다",
  changePassword: "비밀번호 변경",
} as const;

export const settings = {
  title: "설정",
  general: "일반",
  appearance: "외관",
  notifications: "알림",
  security: "보안",
  language: "언어",
  timezone: "시간대",
  theme: "테마",
} as const;

export const errors = {
  general: "오류가 발생했습니다",
  notFound: "찾을 수 없습니다",
  unauthorized: "인증되지 않았습니다",
  forbidden: "접근이 금지되었습니다",
  serverError: "서버 오류",
  networkError: "네트워크 오류",
  validationError: "유효성 검사 오류",
  sessionExpired: "세션이 만료되었습니다. 다시 로그인해 주세요",
} as const;

export const confirmation = {
  delete: "이 항목을 삭제하시겠습니까?",
  unsavedChanges: "저장하지 않은 변경 사항이 있습니다. 나가시겠습니까?",
  logout: "로그아웃 하시겠습니까?",
} as const;

export const time = {
  today: "오늘",
  yesterday: "어제",
  tomorrow: "내일",
  thisWeek: "이번 주",
  lastWeek: "지난 주",
  thisMonth: "이번 달",
  lastMonth: "지난 달",
  thisYear: "올해",
} as const;

export const languages = {
  en: "영어",
  id: "인도네시아어",
  zh: "중국어",
  ja: "일본어",
  ko: "한국어",
  th: "태국어",
  vi: "베트남어",
  ms: "말레이어",
  tl: "필리핀어",
  hi: "힌디어",
} as const;
