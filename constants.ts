
import { Holiday, Member } from './types';

export const DEFAULT_MEMBERS: Member[] = Array.from({ length: 21 }, (_, i) => ({ 
  id: crypto.randomUUID(),
  name: `팀원 ${i + 1}`,
  group: i % 2 === 0 ? '운영' : '기획',
  email: `member${i+1}@example.com`,
  phone: `010-1234-56${String(i+1).padStart(2, '0')}`
}));

export const KOREAN_HOLIDAYS: Record<number, Holiday[]> = {
  2024: [
    { date: '2024-01-01', name: '신정' },
    { date: '2024-02-09', name: '설날 연휴' },
    { date: '2024-02-10', name: '설날' },
    { date: '2024-02-11', name: '설날 연휴' },
    { date: '2024-02-12', name: '설날 연휴' },
    { date: '2024-03-01', name: '삼일절' },
    { date: '2024-04-10', name: '국회의원 선거' },
    { date: '2024-05-01', name: '근로자의 날' },
    { date: '2024-05-05', name: '어린이날' },
    { date: '2024-05-06', name: '어린이날 대체공휴일' },
    { date: '2024-05-15', name: '부처님 오신 날' },
    { date: '2024-06-06', name: '현충일' },
    { date: '2024-08-15', name: '광복절' },
    { date: '2024-09-16', name: '추석 연휴' },
    { date: '2024-09-17', name: '추석' },
    { date: '2024-09-18', name: '추석 연휴' },
    { date: '2024-10-03', name: '개천절' },
    { date: '2024-10-09', name: '한글날' },
    { date: '2024-12-25', name: '크리스마스' },
  ],
  2025: [
    { date: '2025-01-01', name: '신정' },
    { date: '2025-01-28', name: '설날 연휴' },
    { date: '2025-01-29', name: '설날' },
    { date: '2025-01-30', name: '설날 연휴' },
    { date: '2025-03-01', name: '삼일절' },
    { date: '2025-05-01', name: '근로자의 날' },
    { date: '2025-05-05', name: '어린이날' },
    { date: '2025-05-06', name: '부처님 오신 날' },
    { date: '2025-06-06', name: '현충일' },
    { date: '2025-08-15', name: '광복절' },
    { date: '2025-10-03', name: '개천절' },
    { date: '2025-10-05', name: '추석 연휴' },
    { date: '2025-10-06', name: '추석' },
    { date: '2025-10-07', name: '추석 연휴' },
    { date: '2025-10-09', name: '한글날' },
    { date: '2025-12-25', name: '크리스마스' },
  ]
};

export const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

export const CHECKLIST_ITEMS = [
  { text: 'LC 포털 로그인 중요화면 점검', defaultStatus: '특이사항없음' },
  { text: 'GA 포털 로그인 중요화면 점검', defaultStatus: '특이사항없음' },
  { text: '스마트비서 로그인 중요화면 점검', defaultStatus: '특이사항없음' },
  { text: '청약조회, 계약조회, 증권조회', defaultStatus: '정상' },
  { text: '오즈출력물 및 SMS, 팩스/EDMS뷰어', defaultStatus: '정상' },
  { text: '크롬 브라우져 서비스', defaultStatus: '정상' }
];