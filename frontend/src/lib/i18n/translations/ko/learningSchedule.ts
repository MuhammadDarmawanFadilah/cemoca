export const learningSchedule = {
  title: '학습 스케줄 설정',
  description: '자동 학습 전송을 위한 스케줄러 작업을 설정/관리합니다.',

  listTitle: '스케줄러 목록',
  listDescription: '회사에서 사용할 수 있는 스케줄러입니다.',

  active: '활성',
  inactive: '비활성',

  edit: '편집',
  start: '시작',
  stop: '중지',
  configure: '설정',

  sendNow: {
    button: '지금 보내기',
    title: '지금 보내기',
    warningTitle: '오늘 일정은 스킵됩니다',
    warningBody: '지금 보내면 오늘 예약 시간에는 스케줄러가 다시 보내지 않습니다.',
    cancel: '취소',
    confirm: '지금 보내기',
    sending: '전송 중...',
    success: '지금 전송했습니다. 오늘 일정은 스케줄러가 다시 보내지 않습니다.',
  },

  editConfiguration: '설정 편집',
  newConfiguration: '스케줄러 설정',

  table: {
    schedulerType: '스케줄러 유형',
    status: '상태',
    startDate: '시작일',
    endDate: '종료일',
    hour: '시간',
    media: '미디어',
    actions: '작업',
    noData: '사용 가능한 스케줄러가 없습니다',
  },

  step1: {
    title: '데이터 확인',
    subtitle: '사전 데이터 체크',

    schedulerInfoTitle: '{name} 안내',

    targetCompanyCode: '대상 Company Code',
    targetCompanyCodePlaceholder: 'Company Code 입력',
    adminNote: '관리자는 대상 Company Code 를 변경할 수 있습니다.',

    checkButton: '데이터 확인',
    recheckButton: '다시 확인',
    checking: '사전 데이터를 확인하는 중...',

    agencyListData: 'Agency List 데이터',
    agencyListAvailable: 'Agency List 데이터가 준비되었습니다.',
    agencyListMissing: '해당 Company Code 의 Agency List 데이터를 찾을 수 없습니다.',

    policySalesData: 'Policy Sales 데이터',
    policySalesAvailable: 'Policy Sales 데이터가 준비되었습니다.',
    policySalesMissing: '해당 Company Code 의 Policy Sales 데이터를 찾을 수 없습니다.',

    incompleteDataTitle: '데이터 부족',
    incompleteDataMessage: '계속하기 전에 마스터 데이터(Agency List 및 Policy Sales)를 먼저 준비해 주세요.',

    nextButton: '다음',
  },

  step2: {
    title: '작업 설정',

    schedulePeriod: '기간 설정',
    startDate: '시작일',
    endDate: '종료일',

    executionTime: '실행 시간',
    hour: '시간',
    hourPlaceholder: '시간 선택',
    hourNote: '정시(00–23)만 선택할 수 있습니다. 스케줄러는 매일 해당 시간에 실행됩니다.',

    mediaFormat: '미디어 형식',

    backButton: '뒤로',
    nextButton: '다음',
  },

  step3: {
    title: '알림',

    learningMaterial: 'Learning Material',
    learningMaterialPlaceholder: '라이브러리에서 Learning Code 선택...',
    browseButton: '라이브러리 찾기',

    videoScript: '비디오 스크립트(D-ID)',
    videoScriptPlaceholder: '비디오 생성용 텍스트를 입력하세요. :name 으로 에이전트 이름을 넣을 수 있습니다.',
    videoScriptNote: '이 텍스트는 생성된 비디오의 음성으로 변환됩니다.',

    avatar: '아바타(D-ID)',
    chooseAvatar: '아바타 선택',
    clearAvatar: '리셋',
    avatarNotSelected: '선택된 아바타 없음(기본 사용)',

    availableAvatars: '사용 가능한 아바타',
    searchAvatar: '아바타 검색...',
    refreshAvatars: '새로고침',
    loadingAvatars: '아바타 로딩 중...',
    noAvatars: '사용 가능한 아바타가 없습니다.',
    createAtDID: 'D-ID에서 생성',
    selected: '선택됨',
    notFoundAvatar: '찾을 수 없음',
    closeAvatarDialog: '닫기',

    previewMedia: '미리보기',
    openFilePreview: '파일 미리보기 열기',

    whatsappMessage: 'WhatsApp 메시지',
    whatsappMessagePlaceholder: '안녕하세요 :name, 오늘의 학습 자료입니다...',
    whatsappMessageNote: '<code>:name</code> 을 사용하면 에이전트 이름을 자동으로 삽입합니다.',

    backButton: '뒤로',
    saveButton: '저장',
    saving: '저장 중...',
  },

  browseDialog: {
    title: 'Learning Code 선택',
    searchLabel: '검색',
    searchPlaceholder: 'code 로 필터(포함 검색)',
    searchHint: '입력한 값을 code 가 포함하는 항목만 표시합니다.',
    code: 'Code',
    title_column: '제목',
    duration: '시간',
    selectButton: '선택',
    closeButton: '닫기',
    noData: '데이터가 없습니다',
  },

  messages: {
    loadFailed: '데이터 로드 실패',
    companyCodeRequired: 'Company Code 는 필수입니다',
    checkFailed: '데이터 확인 실패',
    loadLearningCodeFailed: 'Learning Code 로드 실패',

    createSuccess: '설정이 생성되었습니다',
    updateSuccess: '설정이 업데이트되었습니다',
    activateSuccess: '스케줄러가 활성화되었습니다',
    deactivateSuccess: '스케줄러가 비활성화되었습니다',

    saveFailed: '저장 실패',
  },

  schedulerTypes: {
    TRAINING_14_DAY_MICRO_LEARNING: {
      name: 'Training 14 Day Micro Learning',
      shortDescription: '14일 동안 판매가 없는 에이전트에게 micro learning 을 전송합니다.',
      description:
        '이 스케줄러는 14일 동안 판매 성과가 없는 에이전트를 자동으로 찾습니다.\n\nPolicy date 가 오늘 기준 14일인 에이전트에게 WhatsApp 번호로 micro learning 을 전송합니다.',
    },
    TRAINING_28_DAY_MICRO_LEARNING: {
      name: 'Training 28 Day Micro Learning',
      shortDescription: '28일 동안 판매가 없는 에이전트에게 micro learning 을 전송합니다.',
      description:
        '이 스케줄러는 28일 동안 판매 성과가 없는 에이전트를 자동으로 찾습니다.\n\nPolicy date 가 오늘 기준 28일인 에이전트에게 WhatsApp 번호로 micro learning 을 전송합니다.',
    },
    WELCOME_NEW_JOINNER: {
      name: 'WELCOME NEW JOINNER',
      shortDescription: '신규 임명 에이전트에게 환영 메시지를 전송합니다(appointment date=어제).',
      description:
        '이 스케줄러는 appointment date 가 어제인 신규 에이전트를 자동으로 찾아 WhatsApp 번호로 환영 메시지를 전송합니다.',
    },
    HAPPY_BIRTHDAY_NOTIFICATION: {
      name: 'Happy Birthday Notification',
      shortDescription: '오늘 생일인 에이전트에게 생일 축하 메시지를 전송합니다.',
      description:
        '이 스케줄러는 Agency List 기준으로 생일이 오늘인 에이전트를 자동으로 찾아 WhatsApp 번호로 생일 축하 메시지를 전송합니다.\n\n같은 날 생일인 에이전트가 여러 명이면 대상 전체에게 전송합니다.',
    },
    CONGRATULATION: {
      name: 'CONGRATULATION',
      shortDescription: '이번 달 policy 가 2건 이상인 에이전트에게 축하 메시지를 전송합니다(월 1회).',
      description:
        '이 스케줄러는 이번 달에 policy 제출이 2건 이상인 에이전트를 자동으로 찾아 WhatsApp 번호로 축하 메시지를 전송합니다.\n\n동일 에이전트는 같은 달에 1회만 수신 가능하며, 다음 달에 조건을 충족하면 다시 수신할 수 있습니다.',
    },
    PERFORMANCE_TRACKING_WITH_BALANCE_TO_GO: {
      name: 'Performance Tracking With Balance To Go',
      shortDescription: '이번 달 policy 2건 이상 + 전날 CONGRATULATION 수신 조건으로 성과 트래킹 메시지를 전송합니다(월 1회).',
      description:
        '이 스케줄러는 CONGRATULATION 과 동일하게 이번 달 policy 제출이 2건 이상인 에이전트를 대상으로 합니다.\n\n추가 조건: 전날(어제) CONGRATULATION 을 이미 수신해야 합니다. CONGRATULATION 전송 다음 날 실행을 가정합니다.\n\n동일 에이전트는 같은 달에 1회만 수신 가능하며, 다음 달에도 조건을 충족하고 전날 CONGRATULATION 을 수신했다면 다시 수신할 수 있습니다.',
    },
  },
} as const;
