/** Mọi đường dẫn của ứng dụng khai báo tại đây; không viết chuỗi URL rải rác trong component. */
export const paths = {
  home: '/',
  login: '/dang-nhap',
  overview: '/tong-quan',
  plan: '/lo-trinh',
  goal: '/thiet-lap-muc-tieu',
  analysis: '/phan-tich',
  exams: '/kho-de-thi',
  samples: '/kho-bai-mau',
  practice: '/thi-thu',
  exam: (id: string) => `/thi-thu/${id}`,
  examPaper: (id: string) => `/thi-thu/${id}/de`,
  examAnswers: (id: string) => `/thi-thu/${id}/dap-an`,
  adminExams: '/quan-tri/de-thi',
  adminNewExam: '/quan-tri/de-thi/tao-moi',
} as const
