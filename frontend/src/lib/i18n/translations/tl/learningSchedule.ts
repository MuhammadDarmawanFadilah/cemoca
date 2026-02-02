export const learningSchedule = {
  title: 'Konpigurasyon ng Learning Schedule',
  description: 'I-configure at pamahalaan ang mga scheduler jobs para sa automated learning delivery.',

  listTitle: 'Listahan ng Scheduler',
  listDescription: 'Mga scheduler na available para sa inyong kumpanya.',

  active: 'AKTIBO',
  inactive: 'HINDI AKTIBO',

  edit: 'I-edit',
  start: 'Simulan',
  stop: 'Ihinto',
  configure: 'I-configure',

  sendNow: {
    button: 'Ipadala Ngayon',
    title: 'Ipadala Ngayon',
    warningTitle: "Laktawan ang schedule ngayong araw",
    warningBody: "Kapag ipinadala ngayon, hindi na muling magpapadala ang scheduler para sa araw na ito sa naka-iskedyul na oras.",
    cancel: 'Kanselahin',
    confirm: 'Ipadala Ngayon',
    sending: 'Nagpapadala...',
    success: "Matagumpay na naipadala. Ang schedule ngayong araw ay hindi na muling ipapadala ng scheduler.",
  },

  editConfiguration: 'I-edit ang Konpigurasyon',
  newConfiguration: 'I-configure ang Scheduler',

  table: {
    schedulerType: 'Uri ng Scheduler',
    status: 'Katayuan',
    startDate: 'Petsa ng Pagsisimula',
    endDate: 'Petsa ng Pagtatapos',
    hour: 'Oras',
    media: 'Media',
    actions: 'Mga Aksyon',
    noData: 'Walang available na schedulers',
  },

  step1: {
    title: 'I-verify ang Data',
    subtitle: 'Pagsusuri ng Prerequisite Data',

    schedulerInfoTitle: 'Tungkol sa {name}',

    targetCompanyCode: 'Target Company Code',
    targetCompanyCodePlaceholder: 'Ilagay ang Company Code',
    adminNote: 'Ang mga admin ay maaaring baguhin ang target company code.',

    checkButton: 'Suriin ang Data',
    recheckButton: 'Suriin Muli',
    checking: 'Sinusuri ang prerequisite data...',

    agencyListData: 'Agency List Data',
    agencyListAvailable: 'Ang Agency List ay available at handa na.',
    agencyListMissing: 'Hindi natagpuan ang Agency List data para sa company code na ito.',

    policySalesData: 'Policy Sales Data',
    policySalesAvailable: 'Ang Policy Sales ay available at handa na.',
    policySalesMissing: 'Hindi natagpuan ang Policy Sales data para sa company code na ito.',

    incompleteDataTitle: 'Hindi Kumpleto ang Data',
    incompleteDataMessage: 'Mangyaring kumpletuhin ang master data (Agency List & Policy Sales) bago magpatuloy.',

    nextButton: 'Magpatuloy',
  },

  step2: {
    title: 'Konpigurasyon ng Job',

    schedulePeriod: 'Panahon ng Schedule',
    startDate: 'Petsa ng Pagsisimula',
    endDate: 'Petsa ng Pagtatapos',

    executionTime: 'Oras ng Pagtupad',
    hour: 'Oras',
    hourPlaceholder: 'Pumili ng oras',
    hourNote: 'Mga buong oras lamang (00–23). Ang scheduler ay tumatakbo araw-araw sa oras na ito.',

    mediaFormat: 'Format ng Media',

    backButton: 'Bumalik',
    nextButton: 'Susunod',
  },

  step3: {
    title: 'Notipikasyon',

    learningMaterial: 'Materyales sa Pag-aaral',
    learningMaterialPlaceholder: 'Pumili ng Learning Code mula sa library...',
    browseButton: 'Mag-browse sa Library',

    videoScript: 'Script ng Video',
    videoScriptPlaceholder: 'Ilagay ang teksto para sa video generator. Gamitin ang :name para sa pangalan ng agent.',
    videoScriptNote: 'Ang tekstong ito ay gagamitin bilang narration para sa video na bubuo.',

    avatar: 'Avatar',
    chooseAvatar: 'Pumili ng Avatar',
    clearAvatar: 'I-reset',
    avatarNotSelected: 'Walang napiling avatar (gumamit ng default)',

    availableAvatars: 'Mga available na avatars',
    searchAvatar: 'Maghanap ng avatar...',
    refreshAvatars: 'I-refresh',
    loadingAvatars: 'Nilo-load ang mga avatars...',
    noAvatars: 'Walang available na avatars.',
    createAtDID: 'Pamahalaan sa HeyGen',
    selected: 'Napili',
    notFoundAvatar: 'Hindi natagpuan',
    closeAvatarDialog: 'Isara',

    previewMedia: 'Preview ng Media',
    openFilePreview: 'Buksan ang File Preview',

    whatsappMessage: 'Mensahe sa WhatsApp',
    whatsappMessagePlaceholder: 'Hi :name, narito ang iyong materyales sa pag-aaral para ngayong araw...',
    whatsappMessageNote: 'Gamitin ang <code>:name</code> upang awtomatikong makapasok ang pangalan ng agent.',

    backButton: 'Bumalik',
    saveButton: 'I-save ang Konpigurasyon',
    saving: 'Ini-save...',
  },

  browseDialog: {
    title: 'Pumili ng Learning Code',
    searchLabel: 'Maghanap',
    searchPlaceholder: 'I-type upang mag-filter ayon sa code (naglalaman)',
    searchHint: 'Ang browse ay mag-filter ng mga resulta kung saan naglalaman ang code ng iyong input.',
    code: 'Code',
    title_column: 'Pamagat',
    duration: 'Tagal',
    selectButton: 'Pumili',
    closeButton: 'Isara',
    noData: 'Walang natagpuang data',
  },

  messages: {
    loadFailed: 'Nabigo sa pag-load ng data',
    companyCodeRequired: 'Kinakailangan ang Company Code',
    checkFailed: 'Nabigo sa pagsuri ng data',
    loadLearningCodeFailed: 'Nabigo sa pag-load ng Learning Code',

    createSuccess: 'Matagumpay na nalikha ang konpigurasyon',
    updateSuccess: 'Matagumpay na na-update ang konpigurasyon',
    activateSuccess: 'Naka-activate ang Scheduler',
    deactivateSuccess: 'Naka-deactivate ang Scheduler',

    saveFailed: 'Nabigo sa pag-save ng konpigurasyon',
  },

  schedulerTypes: {
    TRAINING_14_DAY_MICRO_LEARNING: {
      name: 'Training 14 Day Micro Learning',
      shortDescription: 'Magpadala ng micro learning sa mga agent pagkatapos ng 14 araw na walang benta.',
      description:
        'Ang scheduler na ito ay awtomatikong nakakahanap ng mga agent na hindi pa nakakaabot ng benta pagkatapos ng 14 araw.\n\nAng mga agent na ang petsa ng policy ay 14 araw mula ngayon ay makakatanggap ng micro learning sa kanilang WhatsApp number.',
    },
    TRAINING_28_DAY_MICRO_LEARNING: {
      name: 'Training 28 Day Micro Learning',
      shortDescription: 'Magpadala ng micro learning sa mga agent pagkatapos ng 28 araw na walang benta.',
      description:
        'Ang scheduler na ito ay awtomatikong nakakahanap ng mga agent na hindi pa nakakaabot ng benta pagkatapos ng 28 araw.\n\nAng mga agent na ang petsa ng policy ay 28 araw mula ngayon ay makakatanggap ng micro learning sa kanilang WhatsApp number.',
    },
    WELCOME_NEW_JOINNER: {
      name: 'Welcome New Joinner',
      shortDescription: 'Magpadala ng mensahe ng pagtanggap sa mga bagong agent (petsa ng appointment = kahapon).',
      description:
        'Ang scheduler na ito ay awtomatikong nakakahanap ng mga bagong agent na ang petsa ng appointment ay kahapon at nagpapadala ng mensahe ng pagtanggap sa kanilang WhatsApp number.',
    },
    HAPPY_BIRTHDAY_NOTIFICATION: {
      name: 'Happy Birthday Notification',
      shortDescription: 'Magpadala ng birthday greetings sa mga agent na ang kaarawan ay ngayong araw.',
      description:
        'Ang scheduler na ito ay awtomatikong nakakahanap ng mga agent na ang kaarawan ay ngayong araw (base sa Agency List) at nagpapadala ng birthday greeting sa kanilang WhatsApp number.\n\nKung maraming agent ang may kaarawan sa parehong araw, ang scheduler ay magpapadala sa lahat ng target.',
    },
    CONGRATULATION: {
      name: 'Congratulation',
      shortDescription: 'Magpadala ng pagbati sa mga agent na may hindi bababa sa 2 policies sa kasalukuyang buwan (isang beses kada buwan).',
      description:
        'Ang scheduler na ito ay awtomatikong nakakahanap ng mga agent na may hindi bababa sa 2 policy submissions sa kasalukuyang buwan at nagpapadala ng mensahe ng pagbati sa kanilang WhatsApp number.\n\nBawat agent ay maaaring makatanggap nito ng isang beses lamang kada buwan, at maaari muling makatanggap sa susunod na buwan kung nakakatugon sa pamantayan.',
    },
    PERFORMANCE_TRACKING_WITH_BALANCE_TO_GO: {
      name: 'Performance Tracking With Balance To Go',
      shortDescription: 'Magpadala ng performance tracking (kasalukuyang buwan >= 2 policies) kung ang CONGRATULATION ay naipadala kahapon (isang beses kada buwan).',
      description:
        'Ang scheduler na ito ay katulad ng CONGRATULATION: ito ay nakatuon sa mga agent na may hindi bababa sa 2 policy submissions sa kasalukuyang buwan.\n\nKaragdagang kondisyon: ang agent ay dapat nakatanggap ng CONGRATULATION scheduler noong nakaraang araw (kahapon). Ang scheduler na ito ay inilaan na tumakbo kinabukasan pagkatapos mapadala ang CONGRATULATION.\n\nBawat agent ay maaaring makatanggap nito ng isang beses lamang kada buwan, at maaari muling makatanggap sa susunod na buwan kung nakakatugon sa pamantayan at ang CONGRATULATION ay naipadala noong nakaraang araw.',
    },
  },
} as const;
