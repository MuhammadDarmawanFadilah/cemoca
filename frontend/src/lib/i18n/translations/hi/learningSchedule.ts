export const learningSchedule = {
  title: 'लर्निंग शेड्यूल कॉन्फ़िगरेशन',
  description: 'स्वचालित लर्निंग वितरण के लिए शेड्यूलर जॉब्स को कॉन्फ़िगर और प्रबंधित करें।',

  listTitle: 'शेड्यूलर सूची',
  listDescription: 'आपकी कंपनी के लिए उपलब्ध शेड्यूलर।',

  active: 'सक्रिय',
  inactive: 'निष्क्रिय',

  edit: 'संपादित करें',
  start: 'शुरू करें',
  stop: 'रोकें',
  configure: 'कॉन्फ़िगर करें',

  sendNow: {
    button: 'अभी भेजें',
    title: 'अभी भेजें',
    warningTitle: "आज का शेड्यूल छोड़ दिया जाएगा",
    warningBody: "यदि आप अभी भेजते हैं, तो शेड्यूलर आज निर्धारित घंटे पर फिर से नहीं भेजेगा।",
    cancel: 'रद्द करें',
    confirm: 'अभी भेजें',
    sending: 'भेजा जा रहा है...',
    success: "सफलतापूर्वक भेजा गया। आज का शेड्यूल शेड्यूलर द्वारा फिर से नहीं भेजा जाएगा।",
  },

  editConfiguration: 'कॉन्फ़िगरेशन संपादित करें',
  newConfiguration: 'शेड्यूलर कॉन्फ़िगर करें',

  table: {
    schedulerType: 'शेड्यूलर प्रकार',
    status: 'स्थिति',
    startDate: 'प्रारंभ तिथि',
    endDate: 'समाप्ति तिथि',
    hour: 'घंटा',
    media: 'मीडिया',
    actions: 'क्रियाएं',
    noData: 'कोई शेड्यूलर उपलब्ध नहीं है',
  },

  step1: {
    title: 'डेटा सत्यापित करें',
    subtitle: 'आवश्यक डेटा जांच',

    schedulerInfoTitle: '{name} के बारे में',

    targetCompanyCode: 'लक्षित कंपनी कोड',
    targetCompanyCodePlaceholder: 'कंपनी कोड दर्ज करें',
    adminNote: 'व्यवस्थापक लक्षित कंपनी कोड बदल सकते हैं।',

    checkButton: 'डेटा जांचें',
    recheckButton: 'पुनः जांचें',
    checking: 'आवश्यक डेटा की जांच की जा रही है...',

    agencyListData: 'एजेंसी सूची डेटा',
    agencyListAvailable: 'एजेंसी सूची उपलब्ध और तैयार है।',
    agencyListMissing: 'इस कंपनी कोड के लिए एजेंसी सूची डेटा नहीं मिला।',

    policySalesData: 'पॉलिसी बिक्री डेटा',
    policySalesAvailable: 'पॉलिसी बिक्री उपलब्ध और तैयार है।',
    policySalesMissing: 'इस कंपनी कोड के लिए पॉलिसी बिक्री डेटा नहीं मिला।',

    incompleteDataTitle: 'डेटा अपूर्ण',
    incompleteDataMessage: 'जारी रखने से पहले कृपया मास्टर डेटा (एजेंसी सूची और पॉलिसी बिक्री) पूरा करें।',

    nextButton: 'जारी रखें',
  },

  step2: {
    title: 'जॉब कॉन्फ़िगरेशन',

    schedulePeriod: 'शेड्यूल अवधि',
    startDate: 'प्रारंभ तिथि',
    endDate: 'समाप्ति तिथि',

    executionTime: 'निष्पादन समय',
    hour: 'घंटा',
    hourPlaceholder: 'घंटा चुनें',
    hourNote: 'केवल पूर्ण घंटे (00–23)। शेड्यूलर प्रतिदिन इस घंटे पर चलता है।',

    mediaFormat: 'मीडिया प्रारूप',

    backButton: 'पीछे',
    nextButton: 'अगला',
  },

  step3: {
    title: 'सूचना',

    learningMaterial: 'लर्निंग सामग्री',
    learningMaterialPlaceholder: 'लाइब्रेरी से लर्निंग कोड चुनें...',
    browseButton: 'लाइब्रेरी ब्राउज़ करें',

    videoScript: 'वीडियो स्क्रिप्ट',
    videoScriptPlaceholder: 'वीडियो जनरेटर के लिए पाठ दर्ज करें। एजेंट नाम के लिए :name का उपयोग करें।',
    videoScriptNote: 'यह पाठ उत्पन्न वीडियो के लिए कथन के रूप में उपयोग किया जाएगा।',

    avatar: 'अवतार',
    chooseAvatar: 'अवतार चुनें',
    clearAvatar: 'रीसेट करें',
    avatarNotSelected: 'कोई अवतार नहीं चुना गया (डिफ़ॉल्ट का उपयोग करें)',

    availableAvatars: 'उपलब्ध अवतार',
    searchAvatar: 'अवतार खोजें...',
    refreshAvatars: 'रीफ्रेश करें',
    loadingAvatars: 'अवतार लोड हो रहे हैं...',
    noAvatars: 'कोई अवतार उपलब्ध नहीं है।',
    createAtDID: 'HeyGen में प्रबंधित करें',
    selected: 'चयनित',
    notFoundAvatar: 'नहीं मिला',
    closeAvatarDialog: 'बंद करें',

    previewMedia: 'मीडिया पूर्वावलोकन',
    openFilePreview: 'फ़ाइल पूर्वावलोकन खोलें',

    whatsappMessage: 'WhatsApp संदेश',
    whatsappMessagePlaceholder: 'नमस्ते :name, यहाँ आज के लिए आपकी लर्निंग सामग्री है...',
    whatsappMessageNote: 'एजेंट नाम को स्वचालित रूप से सम्मिलित करने के लिए <code>:name</code> का उपयोग करें।',

    backButton: 'पीछे',
    saveButton: 'कॉन्फ़िगरेशन सहेजें',
    saving: 'सहेजा जा रहा है...',
  },

  browseDialog: {
    title: 'लर्निंग कोड चुनें',
    searchLabel: 'खोजें',
    searchPlaceholder: 'कोड द्वारा फ़िल्टर करने के लिए टाइप करें (शामिल है)',
    searchHint: 'ब्राउज़ उन परिणामों को फ़िल्टर करेगा जहां कोड में आपका इनपुट शामिल है।',
    code: 'कोड',
    title_column: 'शीर्षक',
    duration: 'अवधि',
    selectButton: 'चुनें',
    closeButton: 'बंद करें',
    noData: 'कोई डेटा नहीं मिला',
  },

  messages: {
    loadFailed: 'डेटा लोड करने में विफल',
    companyCodeRequired: 'कंपनी कोड आवश्यक है',
    checkFailed: 'डेटा जांचने में विफल',
    loadLearningCodeFailed: 'लर्निंग कोड लोड करने में विफल',

    createSuccess: 'कॉन्फ़िगरेशन सफलतापूर्वक बनाई गई',
    updateSuccess: 'कॉन्फ़िगरेशन सफलतापूर्वक अपडेट की गई',
    activateSuccess: 'शेड्यूलर सक्रिय किया गया',
    deactivateSuccess: 'शेड्यूलर निष्क्रिय किया गया',

    saveFailed: 'कॉन्फ़िगरेशन सहेजने में विफल',
  },

  schedulerTypes: {
    TRAINING_14_DAY_MICRO_LEARNING: {
      name: 'प्रशिक्षण 14 दिन माइक्रो लर्निंग',
      shortDescription: '14 दिनों के बाद बिना बिक्री वाले एजेंटों को माइक्रो लर्निंग भेजें।',
      description:
        'यह शेड्यूलर स्वचालित रूप से उन एजेंटों को ढूंढता है जिन्होंने 14 दिनों के बाद बिक्री नहीं की है।\n\nजिन एजेंटों की पॉलिसी तिथि आज से 14 दिन है, उन्हें अपने WhatsApp नंबर पर माइक्रो लर्निंग प्राप्त होगी।',
    },
    TRAINING_28_DAY_MICRO_LEARNING: {
      name: 'प्रशिक्षण 28 दिन माइक्रो लर्निंग',
      shortDescription: '28 दिनों के बाद बिना बिक्री वाले एजेंटों को माइक्रो लर्निंग भेजें।',
      description:
        'यह शेड्यूलर स्वचालित रूप से उन एजेंटों को ढूंढता है जिन्होंने 28 दिनों के बाद बिक्री नहीं की है।\n\nजिन एजेंटों की पॉलिसी तिथि आज से 28 दिन है, उन्हें अपने WhatsApp नंबर पर माइक्रो लर्निंग प्राप्त होगी।',
    },
    WELCOME_NEW_JOINNER: {
      name: 'नए सदस्य का स्वागत',
      shortDescription: 'नए नियुक्त एजेंटों (नियुक्ति तिथि = कल) को स्वागत संदेश भेजें।',
      description:
        'यह शेड्यूलर स्वचालित रूप से नए एजेंटों को ढूंढता है जिनकी नियुक्ति तिथि कल है और उनके WhatsApp नंबर पर स्वागत संदेश भेजता है।',
    },
    HAPPY_BIRTHDAY_NOTIFICATION: {
      name: 'जन्मदिन की शुभकामना सूचना',
      shortDescription: 'उन एजेंटों को जन्मदिन की शुभकामनाएं भेजें जिनका जन्मदिन आज है।',
      description:
        'यह शेड्यूलर स्वचालित रूप से उन एजेंटों को ढूंढता है जिनका जन्मदिन आज है (एजेंसी सूची के आधार पर) और उनके WhatsApp नंबर पर जन्मदिन की शुभकामनाएं भेजता है।\n\nयदि एक ही दिन कई एजेंटों का जन्मदिन है, तो शेड्यूलर सभी लक्ष्यों को भेजेगा।',
    },
    CONGRATULATION: {
      name: 'बधाई',
      shortDescription: 'वर्तमान महीने में कम से कम 2 पॉलिसियों वाले एजेंटों को बधाई भेजें (महीने में एक बार)।',
      description:
        'यह शेड्यूलर स्वचालित रूप से उन एजेंटों को ढूंढता है जिनके पास वर्तमान महीने में कम से कम 2 पॉलिसी सबमिशन हैं और उनके WhatsApp नंबर पर बधाई संदेश भेजता है।\n\nप्रत्येक एजेंट इसे महीने में केवल एक बार प्राप्त कर सकता है, और अगले महीने फिर से प्राप्त कर सकता है यदि वे मानदंडों को पूरा करते हैं।',
    },
    PERFORMANCE_TRACKING_WITH_BALANCE_TO_GO: {
      name: 'बैलेंस टू गो के साथ प्रदर्शन ट्रैकिंग',
      shortDescription: 'प्रदर्शन ट्रैकिंग भेजें (वर्तमान महीना >= 2 पॉलिसियां) केवल यदि कल CONGRATULATION भेजा गया था (महीने में एक बार)।',
      description:
        'यह शेड्यूलर CONGRATULATION के समान है: यह उन एजेंटों को लक्षित करता है जिनके पास वर्तमान महीने में कम से कम 2 पॉलिसी सबमिशन हैं।\n\nअतिरिक्त शर्त: एजेंट को पिछले दिन (कल) CONGRATULATION शेड्यूलर प्राप्त हुआ होना चाहिए। यह शेड्यूलर CONGRATULATION भेजे जाने के अगले दिन चलाने के लिए है।\n\nप्रत्येक एजेंट इसे महीने में केवल एक बार प्राप्त कर सकता है, और अगले महीने फिर से प्राप्त कर सकता है यदि वे मानदंडों को पूरा करते हैं और पिछले दिन CONGRATULATION भेजा गया था।',
    },
  },
} as const;
