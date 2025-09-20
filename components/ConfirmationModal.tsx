import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'red' | 'blue' | 'green';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Confirm',
  cancelText = '취소',
  confirmColor = 'blue',
}) => {
  if (!isOpen) return null;

  const colorClasses = {
    red: 'bg-red-600 hover:bg-red-700 text-white',
    blue: 'bg-blue-600 hover:bg-blue-700 text-white',
    green: 'bg-green-600 hover:bg-green-700 text-white',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold">{title}</h3>
        </div>
        <div className="p-6">
          {children}
        </div>
        <div className="p-4 bg-slate-50 flex justify-end space-x-2 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-md hover:bg-slate-300">
            {cancelText}
          </button>
          <button onClick={onConfirm} className={`px-4 py-2 rounded-md ${colorClasses[confirmColor]}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
