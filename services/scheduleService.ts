
import { Schedule, Holiday } from '../types';

const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
};

const isHoliday = (date: Date, holidays: Holiday[]): Holiday | undefined => {
  const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return holidays.find(h => h.date === dateString);
};

export const generateSchedule = (
  year: number,
  month: number,
  members: string[],
  holidays: Holiday[],
  startMemberIndex: number = 0
): { schedule: Schedule; nextMemberIndex: number } => {
  const schedule: Schedule = new Map();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let memberIndex = startMemberIndex;

  if (members.length === 0) {
    return { schedule, nextMemberIndex: 0 };
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    const holidayInfo = isHoliday(currentDate, holidays);
    
    if (isWeekend(currentDate) || holidayInfo) {
      schedule.set(day, { member: null, isHoliday: true, holidayName: holidayInfo?.name });
    } else {
      schedule.set(day, { member: members[memberIndex % members.length], isHoliday: false });
      memberIndex++;
    }
  }
  
  return { schedule, nextMemberIndex: memberIndex % members.length };
};
