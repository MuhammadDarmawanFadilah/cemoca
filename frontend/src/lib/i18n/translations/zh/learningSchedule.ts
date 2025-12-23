export const learningSchedule = {
  title: '学习计划调度配置',
  description: '配置并管理自动化学习推送的调度任务。',

  listTitle: '调度器列表',
  listDescription: '当前公司可用的调度任务。',

  active: '启用',
  inactive: '未启用',

  edit: '编辑',
  start: '启动',
  stop: '停止',
  configure: '配置',
  
    sendNow: {
      button: '立即发送',
      title: '立即发送',
      warningTitle: '今天的计划将被跳过',
      warningBody: '如果现在发送，调度器在今天的计划时间将不会再次发送。',
      cancel: '取消',
      confirm: '立即发送',
      sending: '发送中...',
      success: '已立即发送成功。今天的计划不会被调度器再次发送。',
    },

  editConfiguration: '编辑配置',
  newConfiguration: '配置调度器',

  table: {
    schedulerType: '调度类型',
    status: '状态',
    startDate: '开始日期',
    endDate: '结束日期',
    hour: '时间',
    media: '媒体',
    actions: '操作',
    noData: '暂无可用调度器',
  },

  step1: {
    title: '数据校验',
    subtitle: '前置数据检查',

    schedulerInfoTitle: '关于 {name}',

    targetCompanyCode: '目标公司代码',
    targetCompanyCodePlaceholder: '输入公司代码',
    adminNote: '管理员可以修改目标公司代码。',

    checkButton: '检查数据',
    recheckButton: '重新检查',
    checking: '正在检查前置数据...',

    agencyListData: 'Agency List 数据',
    agencyListAvailable: 'Agency List 数据已就绪。',
    agencyListMissing: '未找到该公司代码的 Agency List 数据。',

    policySalesData: 'Policy Sales 数据',
    policySalesAvailable: 'Policy Sales 数据已就绪。',
    policySalesMissing: '未找到该公司代码的 Policy Sales 数据。',

    incompleteDataTitle: '数据不完整',
    incompleteDataMessage: '请先补全主数据（Agency List 与 Policy Sales）后再继续。',

    nextButton: '继续',
  },

  step2: {
    title: '任务配置',

    schedulePeriod: '执行周期',
    startDate: '开始日期',
    endDate: '结束日期',

    executionTime: '执行时间',
    hour: '小时',
    hourPlaceholder: '选择小时',
    hourNote: '仅支持整点（00–23），调度器会在每天该小时执行。',

    mediaFormat: '媒体格式',

    backButton: '返回',
    nextButton: '下一步',
  },

  step3: {
    title: '通知',

    learningMaterial: '学习素材',
    learningMaterialPlaceholder: '从素材库选择 Learning Code...',
    browseButton: '浏览素材库',

    videoScript: '视频脚本（D-ID）',
    videoScriptPlaceholder: '输入视频生成文本，使用 :name 代表代理姓名。',
    videoScriptNote: '该文本将转换为生成视频的语音。',

    avatar: '头像（D-ID）',
    chooseAvatar: '选择头像',
    clearAvatar: '重置',
    avatarNotSelected: '未选择头像（使用默认）',

    availableAvatars: '可用头像',
    searchAvatar: '搜索头像...',
    refreshAvatars: '刷新',
    loadingAvatars: '加载头像中...',
    noAvatars: '没有可用头像。',
    createAtDID: '在 D-ID 创建',
    selected: '已选择',
    notFoundAvatar: '未找到',
    closeAvatarDialog: '关闭',

    previewMedia: '素材预览',
    openFilePreview: '打开文件预览',

    whatsappMessage: 'WhatsApp 消息',
    whatsappMessagePlaceholder: 'Hi :name，这是你今天的学习内容...',
    whatsappMessageNote: '使用 <code>:name</code> 自动插入代理姓名。',

    backButton: '返回',
    saveButton: '保存配置',
    saving: '保存中...',
  },

  browseDialog: {
    title: '选择 Learning Code',
    searchLabel: '搜索',
    searchPlaceholder: '输入以按 code 过滤（包含匹配）',
    searchHint: '浏览结果将按 code 包含你的输入进行过滤。',
    code: 'Code',
    title_column: '标题',
    duration: '时长',
    selectButton: '选择',
    closeButton: '关闭',
    noData: '未找到数据',
  },

  messages: {
    loadFailed: '加载数据失败',
    companyCodeRequired: '公司代码不能为空',
    checkFailed: '检查数据失败',
    loadLearningCodeFailed: '加载 Learning Code 失败',

    createSuccess: '配置创建成功',
    updateSuccess: '配置更新成功',
    activateSuccess: '调度器已启用',
    deactivateSuccess: '调度器已停用',

    saveFailed: '保存失败',
  },

  schedulerTypes: {
    TRAINING_14_DAY_MICRO_LEARNING: {
      name: 'Training 14 Day Micro Learning',
      shortDescription: '14 天未达成销售的代理将收到 micro learning。',
      description:
        '该调度任务会自动查找在 14 天内未达成销售目标的代理。\n\nPolicy date 距今天正好 14 天的代理，将会收到推送到其 WhatsApp 号码的 micro learning 内容。',
    },
    TRAINING_28_DAY_MICRO_LEARNING: {
      name: 'Training 28 Day Micro Learning',
      shortDescription: '在 28 天没有销售后向代理发送 micro learning。',
      description:
        '此调度器会自动查找 28 天内未达成销售的代理。\n\nPolicy date 为“距离今天 28 天”的代理将收到发送到其 WhatsApp 号码的 micro learning。',
    },
    WELCOME_NEW_JOINNER: {
      name: 'WELCOME NEW JOINNER',
      shortDescription: '向新任命的代理发送欢迎消息（appointment date=昨天）。',
      description:
        '此调度器会自动查找 appointment date 为昨天的新代理，并向其 WhatsApp 号码发送欢迎消息。',
    },
    HAPPY_BIRTHDAY_NOTIFICATION: {
      name: 'Happy Birthday Notification',
      shortDescription: '向今天生日的代理发送生日祝福消息。',
      description:
        '此调度器会根据 Agency List 自动查找生日为今天的代理，并向其 WhatsApp 号码发送生日祝福消息。\n\n如果同一天有多位代理生日，将会发送给所有目标。',
    },
    CONGRATULATION: {
      name: 'CONGRATULATION',
      shortDescription: '向本月 policy 数量不少于 2 的代理发送祝贺消息（每月一次）。',
      description:
        '此调度器会自动查找在本月提交 policy 数量不少于 2 的代理，并向其 WhatsApp 号码发送祝贺消息。\n\n同一代理在同一个月只会收到一次；若下个月再次满足条件，将可再次收到。',
    },
    PERFORMANCE_TRACKING_WITH_BALANCE_TO_GO: {
      name: 'Performance Tracking With Balance To Go',
      shortDescription: '本月 policy ≥ 2 且前一天已发送 CONGRATULATION 才发送业绩跟踪消息（每月一次）。',
      description:
        '此调度器与 CONGRATULATION 类似：目标为本月提交 policy 数量不少于 2 的代理。\n\n额外条件：代理必须在前一天（昨天）已收到 CONGRATULATION。该任务用于在 CONGRATULATION 发送后的次日运行。\n\n同一代理在同一个月只会收到一次；若下个月再次满足条件且前一天已发送 CONGRATULATION，将可再次收到。',
    },
  },
} as const;
