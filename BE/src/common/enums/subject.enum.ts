// Danh sách các môn học phổ biến
export enum Subject {
  // Môn chính
  Math = 'Toán',
  Literature = 'Ngữ văn',
  English = 'Tiếng Anh',
  Physics = 'Vật lý',
  Chemistry = 'Hóa học',
  Biology = 'Sinh học',
  History = 'Lịch sử',
  Geography = 'Địa lý',
  Civics = 'Giáo dục công dân',

  // Ngoại ngữ khác
  French = 'Tiếng Pháp',
  Chinese = 'Tiếng Trung',
  Japanese = 'Tiếng Nhật',
  Korean = 'Tiếng Hàn',

  // Môn năng khiếu
  Music = 'Âm nhạc',
  Art = 'Mỹ thuật',
  PE = 'Thể dục',

  // Tin học
  IT = 'Tin học',
  Programming = 'Lập trình',

  // Khác
  Science = 'Khoa học tự nhiên',
  SocialScience = 'Khoa học xã hội',
  Other = 'Khác',
}

// Danh sách môn học dạng array để sử dụng trong frontend
export const SUBJECT_LIST = Object.values(Subject);

// Group môn học theo nhóm
export const SUBJECT_GROUPS = {
  core: [Subject.Math, Subject.Literature, Subject.English],
  science: [Subject.Physics, Subject.Chemistry, Subject.Biology],
  social: [Subject.History, Subject.Geography, Subject.Civics],
  languages: [
    Subject.French,
    Subject.Chinese,
    Subject.Japanese,
    Subject.Korean,
  ],
  arts: [Subject.Music, Subject.Art, Subject.PE],
  tech: [Subject.IT, Subject.Programming],
  other: [Subject.Science, Subject.SocialScience, Subject.Other],
};
