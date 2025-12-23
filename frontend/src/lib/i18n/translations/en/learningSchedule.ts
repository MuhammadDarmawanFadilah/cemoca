export const learningSchedule = {
  title: 'Learning Schedule Configuration',
  description: 'Configure and manage scheduler jobs for automated learning delivery.',

  listTitle: 'Scheduler List',
  listDescription: 'Schedulers available for your company.',

  active: 'ACTIVE',
  inactive: 'INACTIVE',

  edit: 'Edit',
  start: 'Start',
  stop: 'Stop',
  configure: 'Configure',

  sendNow: {
    button: 'Send Now',
    title: 'Send Now',
    warningTitle: "Today's schedule will be skipped",
    warningBody: "If you send now, the scheduler will not send again for today at the scheduled hour.",
    cancel: 'Cancel',
    confirm: 'Send Now',
    sending: 'Sending...',
    success: "Sent successfully. Today's schedule will not be sent again by the scheduler.",
  },

  editConfiguration: 'Edit Configuration',
  newConfiguration: 'Configure Scheduler',

  table: {
    schedulerType: 'Scheduler Type',
    status: 'Status',
    startDate: 'Start Date',
    endDate: 'End Date',
    hour: 'Hour',
    media: 'Media',
    actions: 'Actions',
    noData: 'No schedulers available',
  },

  step1: {
    title: 'Verify Data',
    subtitle: 'Prerequisite Data Check',

    schedulerInfoTitle: 'About {name}',

    targetCompanyCode: 'Target Company Code',
    targetCompanyCodePlaceholder: 'Enter Company Code',
    adminNote: 'Admins can change the target company code.',

    checkButton: 'Check Data',
    recheckButton: 'Re-check',
    checking: 'Checking prerequisite data...',

    agencyListData: 'Agency List Data',
    agencyListAvailable: 'Agency List is available and ready.',
    agencyListMissing: 'Agency List data was not found for this company code.',

    policySalesData: 'Policy Sales Data',
    policySalesAvailable: 'Policy Sales is available and ready.',
    policySalesMissing: 'Policy Sales data was not found for this company code.',

    incompleteDataTitle: 'Data Incomplete',
    incompleteDataMessage: 'Please complete master data (Agency List & Policy Sales) before continuing.',

    nextButton: 'Continue',
  },

  step2: {
    title: 'Job Configuration',

    schedulePeriod: 'Schedule Period',
    startDate: 'Start Date',
    endDate: 'End Date',

    executionTime: 'Execution Time',
    hour: 'Hour',
    hourPlaceholder: 'Select hour',
    hourNote: 'Only whole hours (00–23). The scheduler runs daily at this hour.',

    mediaFormat: 'Media Format',

    backButton: 'Back',
    nextButton: 'Next',
  },

  step3: {
    title: 'Notification',

    learningMaterial: 'Learning Material',
    learningMaterialPlaceholder: 'Select Learning Code from library...',
    browseButton: 'Browse Library',

    videoScript: 'Video Script (D-ID)',
    videoScriptPlaceholder: 'Enter text for the video generator. Use :name for agent name.',
    videoScriptNote: 'This text will be converted into voice for the generated video.',

    avatar: 'Avatar (D-ID)',
    chooseAvatar: 'Choose Avatar',
    clearAvatar: 'Reset',
    avatarNotSelected: 'No avatar selected (use default)',

    availableAvatars: 'Available avatars',
    searchAvatar: 'Search avatar...',
    refreshAvatars: 'Refresh',
    loadingAvatars: 'Loading avatars...',
    noAvatars: 'No avatars available.',
    createAtDID: 'Create at D-ID',
    selected: 'Selected',
    notFoundAvatar: 'Not found',
    closeAvatarDialog: 'Close',

    previewMedia: 'Media Preview',
    openFilePreview: 'Open File Preview',

    whatsappMessage: 'WhatsApp Message',
    whatsappMessagePlaceholder: 'Hi :name, here is your learning material for today...',
    whatsappMessageNote: 'Use <code>:name</code> to insert the agent name automatically.',

    backButton: 'Back',
    saveButton: 'Save Configuration',
    saving: 'Saving...',
  },

  browseDialog: {
    title: 'Select Learning Code',
    searchLabel: 'Search',
    searchPlaceholder: 'Type to filter by code (contains)',
    searchHint: 'Browse will filter results where the code contains your input.',
    code: 'Code',
    title_column: 'Title',
    duration: 'Duration',
    selectButton: 'Select',
    closeButton: 'Close',
    noData: 'No data found',
  },

  messages: {
    loadFailed: 'Failed to load data',
    companyCodeRequired: 'Company Code is required',
    checkFailed: 'Failed to check data',
    loadLearningCodeFailed: 'Failed to load Learning Code',

    createSuccess: 'Configuration created successfully',
    updateSuccess: 'Configuration updated successfully',
    activateSuccess: 'Scheduler activated',
    deactivateSuccess: 'Scheduler deactivated',

    saveFailed: 'Failed to save configuration',
  },

  schedulerTypes: {
    TRAINING_14_DAY_MICRO_LEARNING: {
      name: 'Training 14 Day Micro Learning',
      shortDescription: 'Send micro learning to agents after 14 days without sales.',
      description:
        'This scheduler automatically finds agents who have not reached sales after 14 days.\n\nAgents whose policy date is 14 days from today will receive micro learning to their WhatsApp number.',
    },
    TRAINING_28_DAY_MICRO_LEARNING: {
      name: 'Training 28 Day Micro Learning',
      shortDescription: 'Send micro learning to agents after 28 days without sales.',
      description:
        'This scheduler automatically finds agents who have not reached sales after 28 days.\n\nAgents whose policy date is 28 days from today will receive micro learning to their WhatsApp number.',
    },
    WELCOME_NEW_JOINNER: {
      name: 'Welcome New Joinner',
      shortDescription: 'Send a welcome message to newly appointed agents (appointment date = yesterday).',
      description:
        'This scheduler automatically finds new agents whose appointment date is yesterday and sends a welcome message to their WhatsApp number.',
    },
    HAPPY_BIRTHDAY_NOTIFICATION: {
      name: 'Happy Birthday Notification',
      shortDescription: 'Send birthday greetings to agents whose birthday is today.',
      description:
        'This scheduler automatically finds agents whose birthday is today (based on Agency List) and sends a birthday greeting to their WhatsApp number.\n\nIf many agents have birthdays on the same day, the scheduler will send to all targets.',
    },
    CONGRATULATION: {
      name: 'Congratulation',
      shortDescription: 'Send congratulations to agents with at least 2 policies in the current month (once per month).',
      description:
        'This scheduler automatically finds agents who have at least 2 policy submissions in the current month and sends a congratulation message to their WhatsApp number.\n\nEach agent can receive it only once per month, and can receive it again next month if they meet the criteria.',
    },
    PERFORMANCE_TRACKING_WITH_BALANCE_TO_GO: {
      name: 'Performance Tracking With Balance To Go',
      shortDescription: 'Send performance tracking (current month >= 2 policies) only if CONGRATULATION was sent yesterday (once per month).',
      description:
        'This scheduler is similar to CONGRATULATION: it targets agents who have at least 2 policy submissions in the current month.\n\nAdditional condition: the agent must have received the CONGRATULATION scheduler on the previous day (yesterday). This scheduler is intended to run the day after CONGRATULATION is sent.\n\nEach agent can receive it only once per month, and can receive it again next month if they meet the criteria and CONGRATULATION was sent the previous day.',
    },
  },
} as const;
