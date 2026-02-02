export const profile = {
  title: "โปรไฟล์",
  companyProfile: "โปรไฟล์บริษัท",
  companyProfileDesc: "จัดการโปรไฟล์และโลโก้บริษัทของคุณ",
  companyInfo: "ข้อมูลบริษัท",
  companyInfoDesc: "ข้อมูลพื้นฐานของบริษัท",
  companyPhoto: "รูปภาพบริษัท",
  companyPhotoDesc: "อัปโหลดโลโก้หรือรูปภาพบริษัทของคุณ",
  uploadPhoto: "อัปโหลดรูปภาพ",
  noPhoto: "ไม่มีรูปภาพ",
  companyNamePlaceholder: "บริษัท",
  companyCode: "รหัสบริษัท",
  companyCodePlaceholder: "กรอกรหัสบริษัท",
  resetCompanyCode: "รีเซ็ต",
  photoHint: "แนะนำรูปภาพสี่เหลี่ยมจัตุรัส",
  photoStorageNote: "",
  companyPhotoUploaded: "อัปโหลดรูปภาพบริษัทแล้ว",
  editProfile: "แก้ไขโปรไฟล์",
  editBiography: "แก้ไขประวัติ",
  personalInfo: "ข้อมูลส่วนตัว",
  changeAvatar: "เปลี่ยนภาพโปรไฟล์",
  updateSuccess: "อัปเดตโปรไฟล์สำเร็จแล้ว",
  changePassword: "เปลี่ยนรหัสผ่าน",
} as const;

export const settings = {
  title: "การตั้งค่า",
  general: "ทั่วไป",
  appearance: "รูปลักษณ์",
  notifications: "การแจ้งเตือน",
  security: "ความปลอดภัย",
  language: "ภาษา",
  timezone: "เขตเวลา",
  theme: "ธีม",
} as const;

export const errors = {
  general: "เกิดข้อผิดพลาด",
  notFound: "ไม่พบ",
  unauthorized: "ไม่ได้รับอนุญาต",
  forbidden: "ถูกห้าม",
  serverError: "เซิร์ฟเวอร์เกิดข้อผิดพลาด",
  networkError: "เครือข่ายเกิดข้อผิดพลาด",
  validationError: "ข้อมูลไม่ถูกต้อง",
  sessionExpired: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง",
} as const;

export const confirmation = {
  delete: "คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?",
  unsavedChanges: "คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก คุณแน่ใจหรือไม่ว่าต้องการออก?",
  logout: "คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?",
} as const;

export const time = {
  today: "วันนี้",
  yesterday: "เมื่อวาน",
  tomorrow: "พรุ่งนี้",
  thisWeek: "สัปดาห์นี้",
  lastWeek: "สัปดาห์ที่แล้ว",
  thisMonth: "เดือนนี้",
  lastMonth: "เดือนที่แล้ว",
  thisYear: "ปีนี้",
} as const;

export const languages = {
  en: "อังกฤษ",
  id: "อินโดนีเซีย",
  zh: "จีน",
  ja: "ญี่ปุ่น",
  ko: "เกาหลี",
  th: "ไทย",
  vi: "เวียดนาม",
  ms: "มาเลย์",
  tl: "ฟิลิปปินส์",
  hi: "ฮินดี",
} as const;
