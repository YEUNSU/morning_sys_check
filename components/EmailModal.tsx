import React, { useState, useEffect } from 'react';
import { Member } from '../types';
import { EnvelopeIcon } from './icons';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (subject: string, body: string) => void;
  targetMember: Member;
  date: Date;
}

const EmailModal: React.FC<EmailModalProps> = ({ isOpen, onClose, onSend, targetMember, date }) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (isOpen) {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const defaultSubject = `[IT 오전 점검] ${month}월 ${day}일 담당자 안내`;
      const defaultBody = 
`안녕하세요, ${targetMember.name}님.

${year}년 ${month}월 ${day}일 IT 오전 점검 담당자이심을 알려드립니다.
확인 부탁드립니다.

감사합니다.
`;
      setSubject(defaultSubject);
      setBody(defaultBody);
    }
  }, [isOpen, targetMember, date]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend(subject, body);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4">
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold">담당자에게 메일 보내기</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    받는 사람
                </label>
                <p className="p-2 bg-slate-100 rounded-md text-slate-800">{targetMember.name} &lt;{targetMember.email}&gt;</p>
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
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 h-48 resize-y"
                  required
                />
            </div>
          </div>
          <div className="p-4 bg-slate-50 flex justify-end space-x-2 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-md hover:bg-slate-300">
              취소
            </button>
            <button type="submit" className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <EnvelopeIcon className="w-5 h-5 mr-2" />
              메일 보내기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailModal;