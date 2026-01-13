export const subjects = [
  { value: "math", label: "Toán" },
  { value: "literature", label: "Ngữ văn" },
  { value: "english", label: "Tiếng Anh" },
  { value: "physics", label: "Vật lý" },
  { value: "chemistry", label: "Hóa học" },
  { value: "biology", label: "Sinh học" },
  { value: "history", label: "Lịch sử" },
  { value: "geography", label: "Địa lý" },
  { value: "informatics", label: "Tin học" },
  { value: "other", label: "Khác" },
];

export const getSubjectLabel = (value: string) => {
  const subject = subjects.find((s) => s.value === value);
  return subject ? subject.label : value;
};
