import React, { useState, useEffect } from 'react';
import { Member, Schedule } from '../types';
import { PaperAirplaneIcon } from './icons';

interface BulkEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (subject: string, body: string) => void;
  members: Member[];
  schedule: Schedule;
  currentDate: Date;
}

const generateScheduleBody = (schedule: Schedule, members: Member[], currentDate: Date): string => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    let body = `안녕하세요.\n\n${year}년 ${month}월 IT 오전 점검 스케줄을 안내해 드립니다.\n\n`;

    const memberDuties: Record<string, number[]> = {};
    members.forEach(m => {
        memberDuties[m.name] = [];
    });

    schedule.forEach((dayInfo, day) => {
        if (dayInfo.member) {
            if (memberDuties[dayInfo.member]) {
                memberDuties[dayInfo.member].push(day);
            }
        }
    });

    members.forEach(member => {
        const duties = memberDuties[member.name];
        if (duties.length > 0) {
            body += `• ${member.name}님: ${duties.join(', ')}일\n`;
        }
    });
    
    body += `\n확인 부탁드립니다.\n\n감사합니다.`;
    return body;
};


const BulkEmailModal: React.FC<BulkEmailModalProps> = ({ isOpen, onClose, onSend, members, schedule, currentDate }) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (isOpen) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      const defaultSubject = `[IT 오전 점검] ${month}월 전체 스케줄 안내`;
      const defaultBody = generateScheduleBody(schedule, members, currentDate);
      
      setSubject(defaultSubject);
      setBody(defaultBody);
    }
  }, [isOpen, members, schedule, currentDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend(subject, body);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4">
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold">전체 메일 발송</h3>
          <p className="text-sm text-slate-500 mt-1">모든 팀원에게 이번 달 스케줄을 공지합니다.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    받는 사람
                </label>
                <p className="p-2 bg-slate-100 rounded-md text-slate-800">모든 팀원 ({members.length}명) - 숨은 참조(BCC)로 발송됩니다.</p>
            </div>
            <div>
                <label htmlFor="email-subject" className="block text-sm font-medium text-slate-700 mb-1">
                    제목
                </label>
                <input
                  id="email-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                />
            </div>
             <div>
                <label htmlFor="email-body" className="block text-sm font-medium text-slate-700 mb-1">
                    내용
                </label>
                <textarea
                  id="email-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 h-64 resize-y font-mono text-sm"
                  required
                />
            </div>
          </div>
          <div className="p-4 bg-slate-50 flex justify-end space-x-2 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-md hover:bg-slate-300">
              취소
            </button>
            <button type="submit" className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
              <PaperAirplaneIcon className="w-5 h-5 mr-2" />
              전체 메일 발송
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkEmailModal;