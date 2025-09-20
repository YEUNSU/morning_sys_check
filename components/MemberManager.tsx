import React, { useState } from 'react';
import { PlusIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, PencilSquareIcon, PaperAirplaneIcon } from './icons';
import { Member } from '../types';

interface MemberManagerProps {
  initialMembers: Member[];
  onSave: (members: Member[], isBulkUpdate: boolean) => void;
  onClose: () => void;
  onOpenBulkEmailModal: () => void;
}

const MemberManager: React.FC<MemberManagerProps> = ({ initialMembers, onSave, onClose, onOpenBulkEmailModal }) => {
  const [members, setMembers] = useState([...initialMembers]);
  const [newMember, setNewMember] = useState({ name: '', group: '운영' as '운영' | '기획', email: '', phone: '' });
  const [error, setError] = useState('');
  const [isBulkEdit, setBulkEdit] = useState(false);
  const [bulkText, setBulkText] = useState('');
  
  const switchToBulkEdit = () => {
    setBulkText(members.map(m => `${m.name},${m.group},${m.email},${m.phone}`).join('\n'));
    setBulkEdit(true);
    setError('');
  };

  const switchToListEdit = () => {
    setBulkEdit(false);
    setError('');
  };

  const handleAddMember = () => {
    if (!newMember.name.trim() || !newMember.email.trim() || !newMember.phone.trim()) {
      setError('모든 필드를 입력해주세요.');
      return;
    }
    if (members.some(m => m.name.trim() === newMember.name.trim())) {
      setError('이미 존재하는 팀원 이름입니다.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(newMember.email.trim())) {
        setError('유효한 이메일 형식이 아닙니다.');
        return;
    }

    setMembers([...members, { ...newMember, id: crypto.randomUUID() }]);
    setNewMember({ name: '', group: '운영', email: '', phone: '' });
    setError('');
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };
  
  const handleMoveMember = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === members.length - 1) return;

    const newMembers = [...members];
    const memberToMove = newMembers[index];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    newMembers[index] = newMembers[swapIndex];
    newMembers[swapIndex] = memberToMove;
    setMembers(newMembers);
  };

  const handleSave = () => {
    if (isBulkEdit) {
      const lines = bulkText.split('\n').map(line => line.trim()).filter(line => line);
      const newMemberList: Member[] = [];
      const errors: string[] = [];
      const names = new Set<string>();
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split(',');
        if (parts.length !== 4) {
          errors.push(`${i+1}번째 줄 형식이 잘못되었습니다. (예: 이름,그룹,이메일,연락처)`);
          continue;
        }
        
        const name = parts[0].trim();
        const group = parts[1].trim() as '운영' | '기획';
        const email = parts[2].trim();
        const phone = parts[3].trim();
        
        if (!name || !group || !email || !phone) {
          errors.push(`${i+1}번째 줄에 비어있는 항목이 있습니다.`);
          continue;
        }

        if (group !== '운영' && group !== '기획') {
          errors.push(`${i+1}번째 줄의 그룹이 잘못되었습니다. ('운영' 또는 '기획'만 가능)`);
          continue;
        }

        if (!/^\S+@\S+\.\S+$/.test(email)) {
            errors.push(`${i+1}번째 줄의 이메일 형식이 유효하지 않습니다: ${email}`);
            continue;
        }

        if (names.has(name)) {
            errors.push(`${i+1}번째 줄에 중복된 이름이 있습니다: ${name}`);
            continue;
        }

        names.add(name);
        newMemberList.push({ id: crypto.randomUUID(), name, group, email, phone });
      }

      if (errors.length > 0) {
        setError(errors.join('\n'));
        return;
      }
      onSave(newMemberList, true);
    } else {
      onSave(members, false);
    }
  };
  
  const renderListView = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 mb-2 items-center">
        <input
          type="text"
          value={newMember.name}
          onChange={(e) => setNewMember({...newMember, name: e.target.value})}
          placeholder="이름"
          className="sm:col-span-2 p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={newMember.group}
          onChange={(e) => setNewMember({...newMember, group: e.target.value as '운영' | '기획'})}
          className="sm:col-span-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="운영">운영</option>
          <option value="기획">기획</option>
        </select>
         <input
          type="email"
          value={newMember.email}
          onChange={(e) => setNewMember({...newMember, email: e.target.value})}
          placeholder="이메일"
          className="sm:col-span-2 p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
        />
         <input
          type="text"
          value={newMember.phone}
          onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
          placeholder="연락처"
          className="sm:col-span-2 p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAddMember}
          className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 flex items-center justify-center sm:col-span-1 h-full"
        >
          <PlusIcon className="w-5 h-5"/>
          <span className="sm:hidden ml-2">추가</span>
        </button>
      </div>
      {error && <p className="text-red-500 text-sm mb-4 whitespace-pre-wrap">{error}</p>}
      <ul className="space-y-2">
        {members.map((member, index) => (
          <li key={member.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
            <div className="flex items-center">
                <span className="font-medium mr-4 text-slate-500">{index + 1}.</span>
                <div>
                    <p className="font-semibold text-slate-800">{member.name}
                      <span className={`text-xs ml-2 px-2 py-0.5 rounded-full ${member.group === '운영' ? 'bg-sky-100 text-sky-800' : 'bg-lime-100 text-lime-800'}`}>{member.group}</span>
                    </p>
                    <p className="text-sm text-slate-500 mt-1">{member.email} / {member.phone}</p>
                </div>
            </div>
            <div className="flex items-center space-x-1">
                <button onClick={() => handleMoveMember(index, 'up')} className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30" disabled={index === 0}>
                <ArrowUpIcon className="w-4 h-4" />
              </button>
                <button onClick={() => handleMoveMember(index, 'down')} className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30" disabled={index === members.length-1}>
                <ArrowDownIcon className="w-4 h-4" />
              </button>
              <button onClick={() => handleRemoveMember(member.id)} className="p-1 text-red-500 hover:text-red-700">
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
  
  const renderBulkEditView = () => (
     <>
        <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 h-64 resize-y font-mono text-sm"
            placeholder="한 줄에 한 명씩 '이름,그룹,이메일,연락처' 형식으로 입력하세요. (그룹은 '운영' 또는 '기획')"
        />
        {error && <p className="text-red-500 text-sm mt-2 whitespace-pre-wrap">{error}</p>}
     </>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold">팀원 관리</h3>
            <p className="text-sm text-slate-500 mt-1">
                {isBulkEdit ? "팀원 목록을 텍스트로 수정합니다." : "점검 순서는 목록의 순서대로 배정됩니다."}
            </p>
          </div>
          <button 
            onClick={isBulkEdit ? switchToListEdit : switchToBulkEdit}
            className="text-sm bg-slate-200 text-slate-800 px-3 py-1.5 rounded-md hover:bg-slate-300 transition-colors flex items-center"
          >
            <PencilSquareIcon className="w-4 h-4 mr-2"/>
            {isBulkEdit ? '목록으로 돌아가기' : '일괄 수정'}
          </button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {isBulkEdit ? renderBulkEditView() : renderListView()}
        </div>
        <div className="p-4 bg-slate-50 flex justify-between items-center rounded-b-lg">
           <button
            onClick={onOpenBulkEmailModal}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
          >
            <PaperAirplaneIcon className="w-5 h-5 mr-2" />
            전체 메일 발송
          </button>
          <div className="flex space-x-2">
            <button onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-md hover:bg-slate-300">
              취소
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberManager;