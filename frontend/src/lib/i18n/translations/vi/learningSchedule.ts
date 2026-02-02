export const learningSchedule = {
  title: 'Cấu hình Lịch Học tập',
  description: 'Cấu hình và quản lý công việc lịch trình để cung cấp học tập tự động.',

  listTitle: 'Danh sách Lịch trình',
  listDescription: 'Lịch trình có sẵn cho công ty của bạn.',

  active: 'HOẠT ĐỘNG',
  inactive: 'KHÔNG HOẠT ĐỘNG',

  edit: 'Sửa',
  start: 'Bắt đầu',
  stop: 'Dừng',
  configure: 'Cấu hình',

  sendNow: {
    button: 'Gửi Ngay',
    title: 'Gửi Ngay',
    warningTitle: "Lịch trình hôm nay sẽ bị bỏ qua",
    warningBody: "Nếu bạn gửi ngay, lịch trình sẽ không gửi lại vào hôm nay tại giờ đã lên lịch.",
    cancel: 'Hủy',
    confirm: 'Gửi Ngay',
    sending: 'Đang gửi...',
    success: "Đã gửi thành công. Lịch trình hôm nay sẽ không được gửi lại bởi lịch trình.",
  },

  editConfiguration: 'Sửa Cấu hình',
  newConfiguration: 'Cấu hình Lịch trình',

  table: {
    schedulerType: 'Loại Lịch trình',
    status: 'Trạng thái',
    startDate: 'Ngày Bắt đầu',
    endDate: 'Ngày Kết thúc',
    hour: 'Giờ',
    media: 'Phương tiện',
    actions: 'Hành động',
    noData: 'Không có lịch trình nào',
  },

  step1: {
    title: 'Xác minh Dữ liệu',
    subtitle: 'Kiểm tra Dữ liệu Tiên quyết',

    schedulerInfoTitle: 'Về {name}',

    targetCompanyCode: 'Mã Công ty Đích',
    targetCompanyCodePlaceholder: 'Nhập Mã Công ty',
    adminNote: 'Quản trị viên có thể thay đổi mã công ty đích.',

    checkButton: 'Kiểm tra Dữ liệu',
    recheckButton: 'Kiểm tra lại',
    checking: 'Đang kiểm tra dữ liệu tiên quyết...',

    agencyListData: 'Dữ liệu Danh sách Đại lý',
    agencyListAvailable: 'Danh sách Đại lý có sẵn và sẵn sàng.',
    agencyListMissing: 'Không tìm thấy dữ liệu Danh sách Đại lý cho mã công ty này.',

    policySalesData: 'Dữ liệu Bán Hợp đồng',
    policySalesAvailable: 'Bán Hợp đồng có sẵn và sẵn sàng.',
    policySalesMissing: 'Không tìm thấy dữ liệu Bán Hợp đồng cho mã công ty này.',

    incompleteDataTitle: 'Dữ liệu Không đầy đủ',
    incompleteDataMessage: 'Vui lòng hoàn thành dữ liệu chính (Danh sách Đại lý & Bán Hợp đồng) trước khi tiếp tục.',

    nextButton: 'Tiếp tục',
  },

  step2: {
    title: 'Cấu hình Công việc',

    schedulePeriod: 'Khoảng thời gian Lịch trình',
    startDate: 'Ngày Bắt đầu',
    endDate: 'Ngày Kết thúc',

    executionTime: 'Thời gian Thực thi',
    hour: 'Giờ',
    hourPlaceholder: 'Chọn giờ',
    hourNote: 'Chỉ giờ nguyên (00–23). Lịch trình chạy hàng ngày vào giờ này.',

    mediaFormat: 'Định dạng Phương tiện',

    backButton: 'Quay lại',
    nextButton: 'Tiếp theo',
  },

  step3: {
    title: 'Thông báo',

    learningMaterial: 'Tài liệu Học tập',
    learningMaterialPlaceholder: 'Chọn Mã Học tập từ thư viện...',
    browseButton: 'Duyệt Thư viện',

    videoScript: 'Kịch bản Video',
    videoScriptPlaceholder: 'Nhập văn bản cho trình tạo video. Dùng :name cho tên đại lý.',
    videoScriptNote: 'Văn bản này sẽ được sử dụng làm lời kể cho video được tạo.',

    avatar: 'Avatar',
    chooseAvatar: 'Chọn Avatar',
    clearAvatar: 'Đặt lại',
    avatarNotSelected: 'Chưa chọn avatar (dùng mặc định)',

    availableAvatars: 'Avatar có sẵn',
    searchAvatar: 'Tìm kiếm avatar...',
    refreshAvatars: 'Làm mới',
    loadingAvatars: 'Đang tải avatar...',
    noAvatars: 'Không có avatar nào.',
    createAtDID: 'Quản lý trong HeyGen',
    selected: 'Đã chọn',
    notFoundAvatar: 'Không tìm thấy',
    closeAvatarDialog: 'Đóng',

    previewMedia: 'Xem trước Phương tiện',
    openFilePreview: 'Mở Xem trước Tệp',

    whatsappMessage: 'Tin nhắn WhatsApp',
    whatsappMessagePlaceholder: 'Xin chào :name, đây là tài liệu học tập của bạn cho hôm nay...',
    whatsappMessageNote: 'Dùng <code>:name</code> để chèn tên đại lý tự động.',

    backButton: 'Quay lại',
    saveButton: 'Lưu Cấu hình',
    saving: 'Đang lưu...',
  },

  browseDialog: {
    title: 'Chọn Mã Học tập',
    searchLabel: 'Tìm kiếm',
    searchPlaceholder: 'Nhập để lọc theo mã (chứa)',
    searchHint: 'Duyệt sẽ lọc kết quả nơi mã chứa đầu vào của bạn.',
    code: 'Mã',
    title_column: 'Tiêu đề',
    duration: 'Thời lượng',
    selectButton: 'Chọn',
    closeButton: 'Đóng',
    noData: 'Không tìm thấy dữ liệu',
  },

  messages: {
    loadFailed: 'Không thể tải dữ liệu',
    companyCodeRequired: 'Mã Công ty là bắt buộc',
    checkFailed: 'Không thể kiểm tra dữ liệu',
    loadLearningCodeFailed: 'Không thể tải Mã Học tập',

    createSuccess: 'Đã tạo cấu hình thành công',
    updateSuccess: 'Đã cập nhật cấu hình thành công',
    activateSuccess: 'Đã kích hoạt lịch trình',
    deactivateSuccess: 'Đã hủy kích hoạt lịch trình',

    saveFailed: 'Không thể lưu cấu hình',
  },

  schedulerTypes: {
    TRAINING_14_DAY_MICRO_LEARNING: {
      name: 'Đào tạo 14 Ngày Micro Learning',
      shortDescription: 'Gửi micro learning cho đại lý sau 14 ngày không có doanh số.',
      description:
        'Lịch trình này tự động tìm các đại lý chưa đạt doanh số sau 14 ngày.\n\nCác đại lý có ngày hợp đồng là 14 ngày từ hôm nay sẽ nhận micro learning đến số WhatsApp của họ.',
    },
    TRAINING_28_DAY_MICRO_LEARNING: {
      name: 'Đào tạo 28 Ngày Micro Learning',
      shortDescription: 'Gửi micro learning cho đại lý sau 28 ngày không có doanh số.',
      description:
        'Lịch trình này tự động tìm các đại lý chưa đạt doanh số sau 28 ngày.\n\nCác đại lý có ngày hợp đồng là 28 ngày từ hôm nay sẽ nhận micro learning đến số WhatsApp của họ.',
    },
    WELCOME_NEW_JOINNER: {
      name: 'Chào mừng Thành viên Mới',
      shortDescription: 'Gửi tin nhắn chào mừng đến các đại lý mới được bổ nhiệm (ngày bổ nhiệm = hôm qua).',
      description:
        'Lịch trình này tự động tìm các đại lý mới có ngày bổ nhiệm là hôm qua và gửi tin nhắn chào mừng đến số WhatsApp của họ.',
    },
    HAPPY_BIRTHDAY_NOTIFICATION: {
      name: 'Thông báo Sinh nhật Vui vẻ',
      shortDescription: 'Gửi lời chúc sinh nhật đến các đại lý có sinh nhật hôm nay.',
      description:
        'Lịch trình này tự động tìm các đại lý có sinh nhật hôm nay (dựa trên Danh sách Đại lý) và gửi lời chúc sinh nhật đến số WhatsApp của họ.\n\nNếu nhiều đại lý có sinh nhật cùng ngày, lịch trình sẽ gửi đến tất cả các mục tiêu.',
    },
    CONGRATULATION: {
      name: 'Chúc mừng',
      shortDescription: 'Gửi lời chúc mừng đến các đại lý có ít nhất 2 hợp đồng trong tháng hiện tại (một lần mỗi tháng).',
      description:
        'Lịch trình này tự động tìm các đại lý có ít nhất 2 nộp hợp đồng trong tháng hiện tại và gửi tin nhắn chúc mừng đến số WhatsApp của họ.\n\nMỗi đại lý chỉ có thể nhận một lần mỗi tháng, và có thể nhận lại vào tháng sau nếu đáp ứng tiêu chí.',
    },
    PERFORMANCE_TRACKING_WITH_BALANCE_TO_GO: {
      name: 'Theo dõi Hiệu suất Với Số dư Cần đi',
      shortDescription: 'Gửi theo dõi hiệu suất (tháng hiện tại >= 2 hợp đồng) chỉ khi CONGRATULATION được gửi hôm qua (một lần mỗi tháng).',
      description:
        'Lịch trình này tương tự như CONGRATULATION: nó nhắm đến các đại lý có ít nhất 2 nộp hợp đồng trong tháng hiện tại.\n\nĐiều kiện bổ sung: đại lý phải đã nhận lịch trình CONGRATULATION vào ngày trước đó (hôm qua). Lịch trình này được thiết kế để chạy ngày sau khi CONGRATULATION được gửi.\n\nMỗi đại lý chỉ có thể nhận một lần mỗi tháng, và có thể nhận lại vào tháng sau nếu đáp ứng tiêu chí và CONGRATULATION được gửi ngày trước đó.',
    },
  },
} as const;
