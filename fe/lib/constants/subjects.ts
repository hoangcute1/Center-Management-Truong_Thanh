// Danh sách các môn học phổ biến
export const SUBJECTS = {
  // Môn chính
  Math: "Toán",
  Literature: "Ngữ văn",
  English: "Tiếng Anh",
  Physics: "Vật lý",
  Chemistry: "Hóa học",
  Biology: "Sinh học",
  History: "Lịch sử",
  Geography: "Địa lý",
  Civics: "Giáo dục công dân",

  // Ngoại ngữ khác
  French: "Tiếng Pháp",
  Chinese: "Tiếng Trung",
  Japanese: "Tiếng Nhật",
  Korean: "Tiếng Hàn",

  // Môn năng khiếu
  Music: "Âm nhạc",
  Art: "Mỹ thuật",
  PE: "Thể dục",

  // Tin học
  IT: "Tin học",
  Programming: "Lập trình",

  // Khác
  Science: "Khoa học tự nhiên",
  SocialScience: "Khoa học xã hội",
  Other: "Khác",
} as const;

// Danh sách môn học dạng array
export const SUBJECT_LIST = Object.values(SUBJECTS);

// Group môn học theo nhóm
export const SUBJECT_GROUPS = {
  "Môn chính": [SUBJECTS.Math, SUBJECTS.Literature, SUBJECTS.English],
  "Khoa học tự nhiên": [SUBJECTS.Physics, SUBJECTS.Chemistry, SUBJECTS.Biology],
  "Khoa học xã hội": [SUBJECTS.History, SUBJECTS.Geography, SUBJECTS.Civics],
  "Ngoại ngữ": [
    SUBJECTS.French,
    SUBJECTS.Chinese,
    SUBJECTS.Japanese,
    SUBJECTS.Korean,
  ],
  "Năng khiếu": [SUBJECTS.Music, SUBJECTS.Art, SUBJECTS.PE],
  "Công nghệ": [SUBJECTS.IT, SUBJECTS.Programming],
  Khác: [SUBJECTS.Science, SUBJECTS.SocialScience, SUBJECTS.Other],
};

// Màu sắc cho từng môn
export const SUBJECT_COLORS: Record<string, string> = {
  [SUBJECTS.Math]: "bg-blue-100 text-blue-800",
  [SUBJECTS.Literature]: "bg-purple-100 text-purple-800",
  [SUBJECTS.English]: "bg-green-100 text-green-800",
  [SUBJECTS.Physics]: "bg-orange-100 text-orange-800",
  [SUBJECTS.Chemistry]: "bg-pink-100 text-pink-800",
  [SUBJECTS.Biology]: "bg-emerald-100 text-emerald-800",
  [SUBJECTS.History]: "bg-amber-100 text-amber-800",
  [SUBJECTS.Geography]: "bg-cyan-100 text-cyan-800",
  [SUBJECTS.Civics]: "bg-indigo-100 text-indigo-800",
  [SUBJECTS.French]: "bg-rose-100 text-rose-800",
  [SUBJECTS.Chinese]: "bg-red-100 text-red-800",
  [SUBJECTS.Japanese]: "bg-violet-100 text-violet-800",
  [SUBJECTS.Korean]: "bg-fuchsia-100 text-fuchsia-800",
  [SUBJECTS.Music]: "bg-yellow-100 text-yellow-800",
  [SUBJECTS.Art]: "bg-lime-100 text-lime-800",
  [SUBJECTS.PE]: "bg-teal-100 text-teal-800",
  [SUBJECTS.IT]: "bg-sky-100 text-sky-800",
  [SUBJECTS.Programming]: "bg-slate-100 text-slate-800",
  default: "bg-gray-100 text-gray-800",
};

export const getSubjectColor = (subject: string): string => {
  return SUBJECT_COLORS[subject] || SUBJECT_COLORS.default;
};
