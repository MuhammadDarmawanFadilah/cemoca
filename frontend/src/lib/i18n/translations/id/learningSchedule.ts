export const learningSchedule = {
  title: 'Konfigurasi Learning Schedule',
  description: 'Atur dan kelola scheduler untuk pengiriman materi pembelajaran otomatis.',

  listTitle: 'Daftar Scheduler',
  listDescription: 'Scheduler yang tersedia untuk perusahaan Anda.',

  active: 'AKTIF',
  inactive: 'NON AKTIF',

  edit: 'Edit',
  start: 'Start',
  stop: 'Stop',
  configure: 'Konfigurasi',

  sendNow: {
    button: 'Send Now',
    title: 'Kirim Sekarang',
    warningTitle: 'Jadwal hari ini akan diskip',
    warningBody: 'Jika Anda mengirimkan sekarang, scheduler untuk hari ini tidak akan mengirimkan lagi pada jam yang dijadwalkan.',
    cancel: 'Batal',
    confirm: 'Kirim Sekarang',
    sending: 'Mengirim...',
    success: 'Berhasil dikirim sekarang. Jadwal hari ini tidak akan dikirimkan lagi oleh scheduler.',
  },

  editConfiguration: 'Edit Konfigurasi',
  newConfiguration: 'Konfigurasi Scheduler',

  table: {
    schedulerType: 'Jenis Scheduler',
    status: 'Status',
    startDate: 'Tanggal Mulai',
    endDate: 'Tanggal Selesai',
    hour: 'Jam',
    media: 'Media',
    actions: 'Aksi',
    noData: 'Tidak ada scheduler tersedia',
  },

  step1: {
    title: 'Verifikasi Data',
    subtitle: 'Pengecekan Prasyarat Data',

    schedulerInfoTitle: 'Tentang {name}',

    targetCompanyCode: 'Target Company Code',
    targetCompanyCodePlaceholder: 'Masukkan Company Code',
    adminNote: 'Sebagai Admin, Anda dapat mengubah target company code.',

    checkButton: 'Cek Data',
    recheckButton: 'Cek Ulang',
    checking: 'Memeriksa ketersediaan data...',

    agencyListData: 'Data Agency List',
    agencyListAvailable: 'Data Agency List tersedia dan siap digunakan.',
    agencyListMissing: 'Data Agency List tidak ditemukan untuk company code ini.',

    policySalesData: 'Data Policy Sales',
    policySalesAvailable: 'Data Policy Sales tersedia dan siap digunakan.',
    policySalesMissing: 'Data Policy Sales tidak ditemukan untuk company code ini.',

    incompleteDataTitle: 'Data Belum Lengkap',
    incompleteDataMessage: 'Mohon lengkapi data master (Agency List & Policy Sales) terlebih dahulu sebelum melanjutkan.',

    nextButton: 'Lanjut',
  },

  step2: {
    title: 'Konfigurasi Job',

    schedulePeriod: 'Periode Jadwal',
    startDate: 'Tanggal Mulai',
    endDate: 'Tanggal Selesai',

    executionTime: 'Waktu Eksekusi',
    hour: 'Jam',
    hourPlaceholder: 'Pilih jam',
    hourNote: 'Hanya bisa pilih jam kelipatan 1 jam (00–23). Scheduler berjalan setiap hari pada jam ini.',

    mediaFormat: 'Format Media',

    backButton: 'Kembali',
    nextButton: 'Lanjut',
  },

  step3: {
    title: 'Notifikasi',

    learningMaterial: 'Learning Material',
    learningMaterialPlaceholder: 'Pilih Learning Code dari library...',
    browseButton: 'Browse Library',

    videoScript: 'Video Script',
    videoScriptPlaceholder: 'Masukkan teks untuk video generator. Gunakan :name untuk nama agent.',
    videoScriptNote: 'Teks ini akan digunakan sebagai narasi untuk video yang digenerate.',

    avatar: 'Avatar',
    chooseAvatar: 'Pilih Avatar',
    clearAvatar: 'Reset',
    avatarNotSelected: 'Belum memilih avatar (pakai default)',

    availableAvatars: 'Avatar tersedia',
    searchAvatar: 'Cari avatar...',
    refreshAvatars: 'Refresh',
    loadingAvatars: 'Memuat avatar...',
    noAvatars: 'Tidak ada avatar tersedia.',
    createAtDID: 'Kelola di HeyGen',
    selected: 'Dipilih',
    notFoundAvatar: 'Tidak ditemukan',
    closeAvatarDialog: 'Tutup',

    previewMedia: 'Preview Media',
    openFilePreview: 'Buka File Preview',

    whatsappMessage: 'Pesan WhatsApp',
    whatsappMessagePlaceholder: 'Halo :name, ini materi pembelajaran Anda hari ini...',
    whatsappMessageNote: 'Gunakan <code>:name</code> untuk menyisipkan nama agent secara otomatis.',

    backButton: 'Kembali',
    saveButton: 'Simpan Konfigurasi',
    saving: 'Menyimpan...',
  },

  browseDialog: {
    title: 'Pilih Learning Code',
    searchLabel: 'Cari',
    searchPlaceholder: 'Ketik untuk filter berdasarkan kode (contains)',
    searchHint: 'Browse akan memfilter hasil yang code-nya mengandung input Anda.',
    code: 'Code',
    title_column: 'Judul',
    duration: 'Durasi',
    selectButton: 'Pilih',
    closeButton: 'Tutup',
    noData: 'Tidak ada data ditemukan',
  },

  messages: {
    loadFailed: 'Gagal memuat data',
    companyCodeRequired: 'Company Code wajib diisi',
    checkFailed: 'Gagal cek data',
    loadLearningCodeFailed: 'Gagal memuat Learning Code',

    createSuccess: 'Konfigurasi berhasil dibuat',
    updateSuccess: 'Konfigurasi berhasil diupdate',
    activateSuccess: 'Scheduler diaktifkan',
    deactivateSuccess: 'Scheduler dinonaktifkan',

    saveFailed: 'Gagal menyimpan',
  },

  schedulerTypes: {
    TRAINING_14_DAY_MICRO_LEARNING: {
      name: 'Training 14 Day Micro Learning',
      shortDescription: 'Kirim micro learning ke agent setelah 14 hari tanpa penjualan.',
      description:
        'Scheduler ini otomatis mencari agent yang belum mencapai penjualan tepat setelah 14 hari.\n\nAgent dengan policy date tepat 14 hari dari hari ini akan dikirimkan micro learning ke nomor WhatsApp-nya.',
    },
    TRAINING_28_DAY_MICRO_LEARNING: {
      name: 'Training 28 Day Micro Learning',
      shortDescription: 'Kirim micro learning ke agent setelah 28 hari tanpa penjualan.',
      description:
        'Scheduler ini otomatis mencari agent yang belum mencapai penjualan tepat setelah 28 hari.\n\nAgent dengan policy date tepat 28 hari dari hari ini akan dikirimkan micro learning ke nomor WhatsApp-nya.',
    },
    WELCOME_NEW_JOINNER: {
      name: 'WELCOME NEW JOINNER',
      shortDescription: 'Kirim ucapan selamat datang untuk agent baru (appointment date = kemarin).',
      description:
        'Scheduler ini otomatis mencari agent baru dengan appointment date kemarin, lalu mengirimkan ucapan selamat datang ke nomor WhatsApp-nya.',
    },
    HAPPY_BIRTHDAY_NOTIFICATION: {
      name: 'Happy Birthday Notification',
      shortDescription: 'Kirim ucapan selamat ulang tahun untuk agent yang birthday-nya hari ini.',
      description:
        'Scheduler ini otomatis mencari agent yang tanggal birthday-nya hari ini (berdasarkan Agency List), lalu mengirimkan ucapan selamat ulang tahun ke nomor WhatsApp-nya.\n\nJika banyak agent yang ulang tahun pada hari yang sama, scheduler akan mengirimkan ke semua target tersebut.',
    },
    CONGRATULATION: {
      name: 'CONGRATULATION',
      shortDescription: 'Kirim ucapan selamat untuk agent dengan minimal 2 policy di bulan berjalan (1x per bulan).',
      description:
        'Scheduler ini otomatis mencari agent yang memiliki minimal 2 policy pada bulan berjalan, lalu mengirimkan ucapan selamat ke nomor WhatsApp-nya.\n\nPer agent hanya boleh menerima 1x dalam bulan yang sama, dan bisa menerima lagi di bulan berikutnya jika memenuhi kriteria.',
    },
    PERFORMANCE_TRACKING_WITH_BALANCE_TO_GO: {
      name: 'Performance Tracking With Balance To Go',
      shortDescription: 'Kirim performance tracking (bulan berjalan >= 2 policy) jika CONGRATULATION sudah terkirim kemarin (1x per bulan).',
      description:
        'Scheduler ini mirip dengan CONGRATULATION: target agent yang memiliki minimal 2 policy pada bulan berjalan.\n\nTambahan kondisi: agent harus sudah menerima CONGRATULATION pada hari sebelumnya (kemarin). Scheduler ini berjalan besok setelah CONGRATULATION terkirim.\n\nPer agent hanya boleh menerima 1x dalam bulan yang sama, dan bisa menerima lagi di bulan berikutnya jika memenuhi kriteria dan CONGRATULATION terkirim pada hari sebelumnya.',
    },
  },
} as const;
