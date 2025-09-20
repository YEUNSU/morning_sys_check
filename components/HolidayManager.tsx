
import React, { useState } from 'react';
import { Holiday } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface HolidayManagerProps {
  initialHolidays: Holiday[];
  onSave: (holidays: Holiday[]) => void;
  onClose: () => void;
}

const HolidayManager: React.FC<HolidayManagerProps> = ({ initialHolidays, onSave, onClose }) => {
  const [holidays, setHolidays] = useState([...initialHolidays].sort((a,b) => a.date.localeCompare(b.date)));
  const [newHoliday, setNewHoliday] = useState<Holiday>({ date: '', name: '' });

  const handleAddHoliday = () => {
    if (newHoliday.date && newHoliday.name.trim()) {
      const updatedHolidays = [...holidays, newHoliday].sort((a, b) => a.date.localeCompare(b.date));
      setHolidays(updatedHolidays);
      setNewHoliday({ date: '', name: '' });
    }
  };
  
  const handleRemoveHoliday = (date: string) => {
    setHolidays(holidays.filter(h => h.date !== date));
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4">
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold">사용자 지정 휴일 관리</h3>
          <p className="text-sm text-slate-500 mt-1">임시 공휴일이나 회사 휴일을 추가하여 점검에서 제외하세요.</p>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
            <input
              type="date"
              value={newHoliday.date}
              onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
              className="sm:col-span-1 p-2 border rounded-md focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="text"
              value={newHoliday.name}
              onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
              placeholder="휴일 이름"
              className="sm:col-span-2 p-2 border rounded-md focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
              onClick={handleAddHoliday}
              className="w-full bg-teal-600 text-white p-2 rounded-md hover:bg-teal-700 flex items-center justify-center"
            >
              <PlusIcon className="w-5 h-5 mr-2"/>
              휴일 추가
          </button>
          <ul className="space-y-2 mt-4">
            {holidays.map((holiday) => (
              <li key={holiday.date} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
                <div>
                  <span className="font-medium">{holiday.date}</span>
                  <span className="text-slate-600 ml-2">{holiday.name}</span>
                </div>
                <button onClick={() => handleRemoveHoliday(holiday.date)} className="p-1 text-red-500 hover:text-red-700">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 bg-slate-50 flex justify-end space-x-2 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-md hover:bg-slate-300">
            취소
          </button>
          <button onClick={() => onSave(holidays)} className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700">
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default HolidayManager;
