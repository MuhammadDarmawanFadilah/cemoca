export const learningSchedule = {
  title: '学習スケジュール設定',
  description: '自動学習配信のスケジューラを設定・管理します。',

  listTitle: 'スケジューラ一覧',
  listDescription: '会社で利用可能なスケジューラです。',

  active: '有効',
  inactive: '無効',

  edit: '編集',
  start: '開始',
  stop: '停止',
  configure: '設定',

  sendNow: {
    button: '今すぐ送信',
    title: '今すぐ送信',
    warningTitle: '本日のスケジュールはスキップされます',
    warningBody: '今すぐ送信すると、本日の予定時刻にスケジューラーから再送信されません。',
    cancel: 'キャンセル',
    confirm: '今すぐ送信',
    sending: '送信中...',
    success: '今すぐ送信しました。本日のスケジュールはスケジューラーから再送信されません。',
  },
  editConfiguration: '設定を編集',
  newConfiguration: 'スケジューラ設定',

  table: {
    schedulerType: 'スケジューラ種別',
    status: 'ステータス',
    startDate: '開始日',
    endDate: '終了日',
    hour: '時刻',
    media: 'メディア',
    actions: '操作',
    noData: '利用可能なスケジューラがありません',
  },

  step1: {
    title: 'データ確認',
    subtitle: '前提データチェック',

    schedulerInfoTitle: '{name} について',

    targetCompanyCode: '対象 Company Code',
    targetCompanyCodePlaceholder: 'Company Code を入力',
    adminNote: '管理者は対象の Company Code を変更できます。',

    checkButton: 'データ確認',
    recheckButton: '再チェック',
    checking: '前提データを確認中...',

    agencyListData: 'Agency List データ',
    agencyListAvailable: 'Agency List データは利用可能です。',
    agencyListMissing: 'この Company Code の Agency List データが見つかりません。',

    policySalesData: 'Policy Sales データ',
    policySalesAvailable: 'Policy Sales データは利用可能です。',
    policySalesMissing: 'この Company Code の Policy Sales データが見つかりません。',

    incompleteDataTitle: 'データ不足',
    incompleteDataMessage: '続行する前にマスターデータ（Agency List と Policy Sales）を準備してください。',

    nextButton: '次へ',
  },

  step2: {
    title: 'ジョブ設定',

    schedulePeriod: '期間設定',
    startDate: '開始日',
    endDate: '終了日',

    executionTime: '実行時間',
    hour: '時（0〜23）',
    hourPlaceholder: '時刻を選択',
    hourNote: '1時間単位（00–23）のみ選択できます。スケジューラは毎日この時刻に実行されます。',

    mediaFormat: 'メディア形式',

    backButton: '戻る',
    nextButton: '次へ',
  },

  step3: {
    title: '通知',

    learningMaterial: 'Learning Material',
    learningMaterialPlaceholder: 'ライブラリから Learning Code を選択...',
    browseButton: 'ライブラリ参照',

    videoScript: '動画スクリプト',
    videoScriptPlaceholder: '動画生成のテキストを入力。:name で代理名を挿入します。',
    videoScriptNote: 'このテキストは生成動画のナレーションとして使用されます。',

    avatar: 'アバター',
    chooseAvatar: 'アバターを選択',
    clearAvatar: 'リセット',
    avatarNotSelected: '未選択（デフォルトを使用）',

    availableAvatars: '利用可能なアバター',
    searchAvatar: 'アバター検索...',
    refreshAvatars: '更新',
    loadingAvatars: 'アバター読み込み中...',
    noAvatars: '利用可能なアバターがありません。',
    createAtDID: 'HeyGenで管理',
    selected: '選択済み',
    notFoundAvatar: '見つかりません',
    closeAvatarDialog: '閉じる',

    previewMedia: 'プレビュー',
    openFilePreview: 'ファイルを開く',

    whatsappMessage: 'WhatsApp メッセージ',
    whatsappMessagePlaceholder: 'こんにちは :name、本日の学習内容はこちらです...',
    whatsappMessageNote: '<code>:name</code> を使うと代理名を自動挿入できます。',

    backButton: '戻る',
    saveButton: '保存',
    saving: '保存中...',
  },

  browseDialog: {
    title: 'Learning Code を選択',
    searchLabel: '検索',
    searchPlaceholder: 'code で絞り込み（部分一致）',
    searchHint: '入力した文字を含む code のみ表示します。',
    code: 'Code',
    title_column: 'タイトル',
    duration: '時間',
    selectButton: '選択',
    closeButton: '閉じる',
    noData: 'データがありません',
  },

  messages: {
    loadFailed: 'データの読み込みに失敗しました',
    companyCodeRequired: 'Company Code は必須です',
    checkFailed: 'データ確認に失敗しました',
    loadLearningCodeFailed: 'Learning Code の読み込みに失敗しました',

    createSuccess: '設定を作成しました',
    updateSuccess: '設定を更新しました',
    activateSuccess: 'スケジューラを有効化しました',
    deactivateSuccess: 'スケジューラを無効化しました',

    saveFailed: '保存に失敗しました',
  },

  schedulerTypes: {
    TRAINING_14_DAY_MICRO_LEARNING: {
      name: 'Training 14 Day Micro Learning',
      shortDescription: '14日間売上が達成できない代理へ micro learning を送信します。',
      description:
        'このスケジューラは、14日間売上が達成できていない代理を自動で抽出します。\n\nPolicy date が「今日から14日前」の代理に対して、WhatsApp 番号へ micro learning を送信します。',
    },
    TRAINING_28_DAY_MICRO_LEARNING: {
      name: 'Training 28 Day Micro Learning',
      shortDescription: '28日間売上が達成できない代理へ micro learning を送信します。',
      description:
        'このスケジューラは、28日間売上が達成できていない代理を自動で抽出します。\n\nPolicy date が「今日から28日前」の代理に対して、WhatsApp 番号へ micro learning を送信します。',
    },
    WELCOME_NEW_JOINNER: {
      name: 'WELCOME NEW JOINNER',
      shortDescription: '新規代理へ歓迎メッセージを送信します（appointment date＝昨日）。',
      description:
        'このスケジューラは、appointment date が「昨日」の新規代理を自動で抽出し、WhatsApp 番号へ歓迎メッセージを送信します。',
    },
    HAPPY_BIRTHDAY_NOTIFICATION: {
      name: 'Happy Birthday Notification',
      shortDescription: '誕生日が今日の代理へお祝いメッセージを送信します。',
      description:
        'このスケジューラは、誕生日が今日の代理（Agency List を参照）を自動で抽出し、WhatsApp 番号へお祝いメッセージを送信します。\n\n同日に誕生日の代理が複数いる場合は、全員へ送信します。',
    },
    CONGRATULATION: {
      name: 'CONGRATULATION',
      shortDescription: '当月の policy が 2 件以上の代理へお祝いメッセージを送信します（月1回）。',
      description:
        'このスケジューラは、当月の policy 提出が 2 件以上の代理を自動で抽出し、WhatsApp 番号へお祝いメッセージを送信します。\n\n同じ代理は同月内に 1 回のみ受信でき、翌月に条件を満たせば再度受信できます。',
    },
    PERFORMANCE_TRACKING_WITH_BALANCE_TO_GO: {
      name: 'Performance Tracking With Balance To Go',
      shortDescription: '当月 policy 2 件以上の代理へ送信（前日に CONGRATULATION 受信が条件、月1回）。',
      description:
        'このスケジューラは CONGRATULATION と同様に、当月の policy 提出が 2 件以上の代理を対象にします。\n\n追加条件: 前日（昨日）に CONGRATULATION を受信している必要があります。CONGRATULATION 送信の翌日に動作する想定です。\n\n同じ代理は同月内に 1 回のみ受信でき、翌月に条件を満たし、かつ前日に CONGRATULATION を受信していれば再度受信できます。',
    },
  },
} as const;
