import React from 'react';
import { Schedule, Holiday } from '../types';
import { WEEKDAY_NAMES } from '../constants';
import { EnvelopeIcon } from './icons';

interface CalendarProps {
  currentDate: Date;
  referenceDate: Date;
  schedule: Schedule;
  holidays: Holiday[];
  onDayClick: (day: number) => void;
  selectedDay: number | null;
  isSwapMode: boolean;
  isAdminMode: boolean;
  onSendEmailClick: (day: number) => void;
}

const Calendar: React.FC<CalendarProps> = ({ currentDate, referenceDate, schedule, onDayClick, selectedDay, isSwapMode, isAdminMode, onSendEmailClick }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const handleEmailButtonClick = (e: React.MouseEvent, day: number) => {
    e.stopPropagation();
    onSendEmailClick(day);
  };

  const renderDays = () => {
    const days = [];
    // Blank cells for days before the first of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="border-r border-b border-slate-200"></div>);
    }

    // Cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayInfo = schedule.get(day);
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
      const isReferenceDay = referenceDate.getFullYear() === year && referenceDate.getMonth() === month && referenceDate.getDate() === day;

      const cellDate = new Date(year, month, day);
      const dayOfWeek = cellDate.getDay();
      const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;

      const cellClasses = [
        "relative p-2 h-28 border-r border-b border-slate-200 flex flex-col transition-all duration-150",
        isSwapMode ? (dayInfo?.member ? 'cursor-pointer hover:bg-slate-100' : '') : 'cursor-pointer hover:bg-slate-100',
        isToday ? "bg-blue-50" : (isReferenceDay ? "bg-yellow-50" : (isWeekendDay || dayInfo?.isHoliday ? "bg-slate-50" : "bg-white")),
        selectedDay === day ? "ring-2 ring-blue-500 z-10" : ""
      ].join(" ");
      
      const dateClasses = [
        "font-semibold text-sm",
        isToday ? "bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center" : "w-7 h-7 flex items-center justify-center",
        dayOfWeek === 0 ? "text-red-500" : "", // Sunday
        dayOfWeek === 6 ? "text-blue-500" : "", // Saturday
      ].join(" ");

      days.push(
        <div key={day} className={cellClasses} onClick={() => onDayClick(day)}>
          <div className={dateClasses}>{day}</div>
          <div className="mt-1 flex-grow overflow-y-auto">
            {dayInfo?.member && (
              <div className="group bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-1 rounded-md flex justify-between items-center">
                <span>
                  {dayInfo.member}{dayInfo.isOverridden && <span className="ml-1 text-red-500">*</span>}
                </span>
                {isAdminMode && (
                   <button 
                      onClick={(e) => handleEmailButtonClick(e, day)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600 hover:text-indigo-800"
                      title={`${dayInfo.member}에게 메일 보내기`}
                    >
                     <EnvelopeIcon className="w-4 h-4" />
                   </button>
                )}
              </div>
            )}
             {dayInfo?.isHoliday && dayInfo.holidayName && (
               <div className="text-red-600 text-xs font-semibold mt-1">
                {dayInfo.holidayName}
              </div>
            )}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="grid grid-cols-7 border-t border-l border-slate-200">
      {WEEKDAY_NAMES.map((day, index) => (
        <div
          key={day}
          className={`font-bold text-center py-3 border-r border-b border-slate-200 bg-slate-100
            ${index === 0 ? 'text-red-500' : ''}
            ${index === 6 ? 'text-blue-500' : ''}
          `}
        >
          {day}
        </div>
      ))}
      {renderDays()}
    </div>
  );
};

export default Calendar;