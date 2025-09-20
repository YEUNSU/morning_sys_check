import React, { useState, useEffect, useMemo } from 'react';
import { Member, CheckResult } from '../types';
import { CHECKLIST_ITEMS, WEEKDAY_NAMES } from '../constants';
import { ClipboardDocumentIcon } from './icons';

type ChecklistState = {
    [key: number]: {
        status: 'default' | 'issue';
        note: string;
    }
};

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dutyInfo: {
    member: Member;
    date: Date;
  };
  initialResult: CheckResult | null;
  onSave: (result: CheckResult) => void;
}


const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, dutyInfo, initialResult, onSave }) => {
  const [checklistState, setChecklistState] = useState<ChecklistState>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialResult) {
          setChecklistState(initialResult.checklist);
      } else {
        const initialStatus: ChecklistState = {};
        CHECKLIST_ITEMS.forEach((_, index) => {
            initialStatus[index] = { status: 'default', note: '' };
        });
        setChecklistState(initialStatus);
      }
      setCopied(false);
    }
  }, [isOpen, initialResult]);

  const handleStatusChange = (index: number, status: 'default' | 'issue') => {
    setChecklistState(prev => ({
        ...prev,
        [index]: { ...prev[index], status }
    }));
  };

  const handleNoteChange = (index: number, note: string) => {
     setChecklistState(prev => ({
        ...prev,
        [index]: { ...prev[index], note }
    }));
  };

  const formattedDate = useMemo(() => {
    const month = String(dutyInfo.date.getMonth() + 1).padStart(2, '0');
    const day = String(dutyInfo.date.getDate()).padStart(2, '0');
    const weekday = WEEKDAY_NAMES[dutyInfo.date.getDay()];
    return `${month}/${day}(${weekday})`;
  }, [dutyInfo.date]);

  const reportText = useMemo(() => {
    const header = `<IT개발파트 당직 점검 결과 보고>\n\n하기와 같이 ${formattedDate} 오전당직 점검결과 보고드립니다.\n`;
    const dutyPerson = `\n1. 당직자 : ${dutyInfo.member.name}\n`;
    const checkHeader = `\n2. 일일 당직자 점검 내용`;
    
    const checkDetails = CHECKLIST_ITEMS.map((item, index) => {
        const statusItem = checklistState[index];
        if (!statusItem) return ` - ${item.text} : `;
        
        const statusText = statusItem.status === 'issue' 
            ? statusItem.note || '이슈 발생'
            : item.defaultStatus;

        return ` - ${item.text} : ${statusText}`;
    }).join('\n');

    return `${header}${dutyPerson}${checkHeader}\n${checkDetails}`;
  }, [dutyInfo.member.name, formattedDate, checklistState]);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSave = () => {
    const hasIssues = Object.values(checklistState).some(item => item.status === 'issue');
    const result: CheckResult = {
        status: hasIssues ? 'CompletedWithIssues' : 'CompletedNormal',
        checklist: checklistState,
        timestamp: new Date().toISOString()
    };
    onSave(result);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 flex flex-col">
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold">오전 점검 수행</h3>
          <p className="text-sm text-slate-500 mt-1">오늘의 점검 결과를 입력하고 저장하세요.</p>
        </div>
        <div className="p-6 flex-grow overflow-y-auto max-h-[60vh] grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left side: Form */}
            <div className="space-y-4">
                <p className="font-medium"><strong>날짜:</strong> {formattedDate}</p>
                <p className="font-medium"><strong>당직자:</strong> {dutyInfo.member.name}</p>
                <hr/>
                <h4 className="font-semibold text-lg">점검 항목</h4>
                <div className="space-y-3">
                    {CHECKLIST_ITEMS.map((item, index) => {
                        const statusItem = checklistState[index];
                        const isIssue = statusItem?.status === 'issue';
                        return (
                            <div key={index} className="p-3 bg-slate-50 rounded-md">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-medium text-sm pr-2 flex-1">{item.text}</p>
                                    <span className={`flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${
                                        isIssue
                                        ? 'bg-red-100 text-red-800'
                                        : (item.defaultStatus === '정상' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800')
                                    }`}>
                                        {isIssue ? '이슈 발생' : item.defaultStatus}
                                    </span>
                                </div>
                                <div className="border-t border-slate-200 pt-2 mt-2 space-y-2">
                                    <div className="flex items-center space-x-4">
                                        <label className="flex items-center text-sm cursor-pointer">
                                            <input type="radio" name={`status-${index}`} value="default" 
                                                checked={!isIssue}
                                                onChange={() => handleStatusChange(index, 'default')}
                                                className="mr-1.5 focus:ring-blue-500"
                                            />
                                            {item.defaultStatus}
                                        </label>
                                         <label className="flex items-center text-sm cursor-pointer">
                                            <input type="radio" name={`status-${index}`} value="issue" 
                                                checked={isIssue}
                                                onChange={() => handleStatusChange(index, 'issue')}
                                                className="mr-1.5 focus:ring-red-500"
                                            />
                                            이슈 있음
                                        </label>
                                    </div>
                                    {isIssue && (
                                        <input 
                                            type="text"
                                            placeholder="이슈 내용을 입력하세요"
                                            value={statusItem?.note || ''}
                                            onChange={(e) => handleNoteChange(index, e.target.value)}
                                            className="w-full p-1.5 border rounded-md text-sm focus:ring-1 focus:ring-blue-500"
                                        />
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            {/* Right side: Preview */}
            <div>
                 <h4 className="font-semibold text-lg mb-2">보고서 미리보기 및 복사</h4>
                 <textarea
                    readOnly
                    value={reportText}
                    className="w-full p-2 border rounded-md bg-slate-100 h-96 resize-none font-mono text-xs"
                 />
            </div>
        </div>
        <div className="p-4 bg-slate-50 flex justify-between items-center rounded-b-lg">
           <button onClick={handleCopy} className={`flex items-center px-4 py-2 rounded-md transition-colors text-sm ${copied ? 'bg-green-100 text-green-800' : 'bg-slate-200 hover:bg-slate-300'}`}>
            <ClipboardDocumentIcon className="w-5 h-5 mr-2" />
            {copied ? '복사 완료!' : '보고서 복사'}
          </button>
          <div className="flex space-x-2">
            <button onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-md hover:bg-slate-300">
              취소
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              점검 완료 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;