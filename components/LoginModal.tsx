import React, { useState, useEffect } from 'react';
import { LockClosedIcon } from './icons';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<boolean>;
  onGoogleSignIn: () => Promise<boolean>;
}

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.012,36.49,44,30.651,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin, onGoogleSignIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setError('');
      setIsLoggingIn(false);
    }
  }, [isOpen]);
  
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);
    const success = await onLogin(email, password);
    if (!success) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
    setIsLoggingIn(false);
  };

  const handleGoogleClick = async () => {
      setError('');
      setIsLoggingIn(true);
      const success = await onGoogleSignIn();
      if(!success) {
          setError('팀원 목록에 등록된 구글 계정이 아닙니다. 관리자에게 문의하세요.');
      }
      setIsLoggingIn(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm m-4">
        <div className="p-6 border-b text-center">
          <LockClosedIcon className="w-8 h-8 mx-auto text-slate-500 mb-2"/>
          <h3 className="text-xl font-semibold">로그인</h3>
          <p className="text-sm text-slate-500 mt-1">로그인하여 스케줄을 관리하세요.</p>
        </div>
        <div className="p-6">
            <button
                onClick={handleGoogleClick}
                disabled={isLoggingIn}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-slate-300 rounded-md shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
                <GoogleIcon />
                <span className="ml-3">Google로 로그인 (팀원용)</span>
            </button>

            <div className="my-4 flex items-center">
                <div className="flex-grow border-t border-slate-300"></div>
                <span className="flex-shrink mx-4 text-xs text-slate-500">또는</span>
                <div className="flex-grow border-t border-slate-300"></div>
            </div>
            
            <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email-input" className="block text-sm font-medium text-slate-700 mb-1">
                        관리자 이메일
                    </label>
                    <input id="email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                    <label htmlFor="password-input" className="block text-sm font-medium text-slate-700 mb-1">
                        관리자 비밀번호
                    </label>
                    <input id="password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500" required />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button type="submit" className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50" disabled={isLoggingIn}>
                    {isLoggingIn ? '로그인 중...' : '관리자 로그인'}
                </button>
            </form>
        </div>
        <div className="p-3 bg-slate-50 flex justify-end rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-md hover:bg-slate-300 text-sm" disabled={isLoggingIn}>
              닫기
            </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;