import React from 'react';
import { ChangeLogEntry } from '../types';

interface ChangeLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: ChangeLogEntry[];
}

const ChangeLogModal: React.FC<ChangeLogModalProps> = ({ isOpen, onClose, log }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 flex flex-col">
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold">변경 기록</h3>
          <p className="text-sm text-slate-500 mt-1">최근 100개의 변경사항이 표시됩니다.</p>
        </div>
        <div className="p-6 flex-grow overflow-y-auto max-h-[60vh]">
          {log.length === 0 ? (
            <p className="text-slate-500 text-center py-8">변경 기록이 없습니다.</p>
          ) : (
            <ul className="space-y-4">
              {log.map((entry, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 pt-1">
                     <div className="w-2 h-2 mt-1.5 rounded-full bg-slate-300"></div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-800 font-medium">
                      {entry.description}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(entry.timestamp).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-4 bg-slate-50 flex justify-end space-x-2 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-md hover:bg-slate-300">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangeLogModal;
