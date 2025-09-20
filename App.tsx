import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { db, auth, googleProvider } from './firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, query, writeBatch, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User, signInWithPopup } from 'firebase/auth';
import { generateSchedule } from './services/scheduleService';
import { DEFAULT_MEMBERS, KOREAN_HOLIDAYS, WEEKDAY_NAMES } from './constants';
import { Schedule, Holiday, Member, ChangeLogEntry, CheckResult, UserProfile } from './types';
import Calendar from './components/Calendar';
import MemberManager from './components/MemberManager';
import HolidayManager from './components/HolidayManager';
import ConfirmationModal from './components/ConfirmationModal';
import LoginModal from './components/LoginModal';
import ChangeLogModal from './components/ChangeLogModal';
import EmailModal from './components/EmailModal';
import BulkEmailModal from './components/BulkEmailModal';
import ReportModal from './components/ReportModal';
import { ChevronLeftIcon, ChevronRightIcon, UserGroupIcon, CalendarIcon, SwapIcon, ExclamationTriangleIcon, LockClosedIcon, ArrowRightOnRectangleIcon, ClockIcon, EnvelopeIcon, ShieldCheckIcon, CheckCircleIcon } from './components/icons';

// Helper functions for business day calculations
const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
};

const isHoliday = (date: Date, holidays: Holiday[]): boolean => {
  const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return holidays.some(h => h.date === dateString);
};

const isBusinessDay = (date: Date, holidays: Holiday[]): boolean => {
  return !isWeekend(date) && !isHoliday(date, holidays);
}

const getFirstBusinessDayOfMonth = (year: number, month: number, holidays: Holiday[]): Date => {
    let date = new Date(year, month, 1);
    while(!isBusinessDay(date, holidays)) {
        date.setDate(date.getDate() + 1);
    }
    return date;
}

const MAX_LOG_ENTRIES = 100;

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [referenceDate, setReferenceDate] = useState(new Date());

  // Firebase-backed state
  const [members, setMembers] = useState<Member[]>([]);
  const [customHolidays, setCustomHolidays] = useState<Holiday[]>([]);
  const [startMemberIndices, setStartMemberIndices] = useState<Record<string, number>>({});
  const [scheduleOverrides, setScheduleOverrides] = useState<Record<string, Record<number, string>>>({});
  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>([]);
  const [checkResults, setCheckResults] = useState<Record<string, CheckResult>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

  const pendingIndexCalculations = useRef(new Set<string>());
  const startMemberIndicesRef = useRef(startMemberIndices);
  startMemberIndicesRef.current = startMemberIndices;

  const isAdminMode = currentUserProfile?.role === 'admin';

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isSwapMode, setSwapMode] = useState(false);
  
  const [isMemberModalOpen, setMemberModalOpen] = useState(false);
  const [isHolidayModalOpen, setHolidayModalOpen] = useState(false);
  const [isResetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isLogModalOpen, setLogModalOpen] = useState(false);
  const [isEmailModalOpen, setEmailModalOpen] = useState(false);
  const [isBulkEmailModalOpen, setBulkEmailModalOpen] = useState(false);
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{member: Member, date: Date} | null>(null);
  const [emailTarget, setEmailTarget] = useState<{member: Member, date: Date} | null>(null);
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Firebase listeners
  useEffect(() => {
    const dataDocRef = (docId: string) => doc(db, 'app-data', docId);

    const unsubscribers = [
      onSnapshot(dataDocRef('members'), (doc) => {
        setMembers(doc.exists() ? doc.data().data : DEFAULT_MEMBERS);
        setIsLoading(false);
      }, () => setIsLoading(false)),
      onSnapshot(dataDocRef('customHolidays'), (doc) => setCustomHolidays(doc.exists() ? doc.data().data : [])),
      onSnapshot(dataDocRef('startMemberIndices'), (doc) => setStartMemberIndices(doc.exists() ? doc.data().data : {})),
      onSnapshot(dataDocRef('changeLog'), (doc) => setChangeLog(doc.exists() ? doc.data().data : [])),
      onSnapshot(query(collection(db, 'scheduleOverrides')), (snapshot) => {
        const overrides: Record<string, Record<number, string>> = {};
        snapshot.forEach(doc => { overrides[doc.id] = doc.data().data; });
        setScheduleOverrides(overrides);
      }),
       onSnapshot(query(collection(db, 'checkResults')), (snapshot) => {
        const results: Record<string, CheckResult> = {};
        snapshot.forEach(doc => { results[doc.id] = doc.data() as CheckResult; });
        setCheckResults(results);
      }),
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  }, []);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setCurrentUserProfile(userDoc.data() as UserProfile);
        } else {
          setCurrentUserProfile(null);
        }
      } else {
        setCurrentUserProfile(null);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addLogEntry = useCallback(async (description: string) => {
    const newEntry: ChangeLogEntry = {
        timestamp: new Date().toISOString(),
        description,
    };
    try {
        const logDocRef = doc(db, 'app-data', 'changeLog');
        const logDoc = await getDoc(logDocRef);
        const currentLog = logDoc.exists() ? logDoc.data().data : [];
        const updatedLog = [newEntry, ...currentLog.slice(0, MAX_LOG_ENTRIES - 1)];
        await setDoc(logDocRef, { data: updatedLog });
    } catch(e) { 
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error("Error adding log entry: ", errorMessage);
    }
  }, []);

  const allHolidays = useMemo(() => {
    const fixedHolidays = KOREAN_HOLIDAYS[year] || [];
    return [...fixedHolidays, ...customHolidays];
  }, [year, customHolidays]);
  
  const calculateAndStoreStartIndex = useCallback(async (targetYear: number, targetMonth: number) => {
    const targetMonthKey = `${targetYear}-${targetMonth}`;
    if (pendingIndexCalculations.current.has(targetMonthKey)) {
        return;
    }
  
    try {
        pendingIndexCalculations.current.add(targetMonthKey);
        const startIndicesDocRef = doc(db, 'app-data', 'startMemberIndices');
        const startIndicesDoc = await getDoc(startIndicesDocRef);
        const currentIndices = startIndicesDoc.exists() ? startIndicesDoc.data().data : {};
  
        if (currentIndices[targetMonthKey] !== undefined) {
            return; 
        }
  
        let lastDate = new Date(targetYear, targetMonth, 0);
        let lastMonthKey = `${lastDate.getFullYear()}-${lastDate.getMonth()}`;
        let attempts = 0;
        while (currentIndices[lastMonthKey] === undefined && attempts < 24) {
            lastDate = new Date(lastDate.getFullYear(), lastDate.getMonth(), 0);
            lastMonthKey = `${lastDate.getFullYear()}-${lastDate.getMonth()}`;
            attempts++;
        }
  
        const lastKnownIndex = currentIndices[lastMonthKey] ?? 0;
        const memberNames = members.map(m => m.name);
      
        if (memberNames.length === 0) return;

        const { nextMemberIndex: startIndexForTargetMonth } = generateSchedule(lastDate.getFullYear(), lastDate.getMonth(), memberNames, allHolidays, lastKnownIndex);
  
        const { nextMemberIndex: startIndexForNextMonth } = generateSchedule(targetYear, targetMonth, memberNames, allHolidays, startIndexForTargetMonth);
        
        const nextMonthDate = new Date(targetYear, targetMonth + 1, 1);
        const nextMonthKey = `${nextMonthDate.getFullYear()}-${nextMonthDate.getMonth()}`;

        await setDoc(startIndicesDocRef, {
            data: {
                ...currentIndices,
                [targetMonthKey]: startIndexForTargetMonth,
                [nextMonthKey]: startIndexForNextMonth,
            }
        }, { merge: true });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error calculating and storing start index for ${targetMonthKey}:`, errorMessage);
    } finally {
        pendingIndexCalculations.current.delete(targetMonthKey);
    }
  }, [members, allHolidays]);
  
  useEffect(() => {
    const monthKey = `${year}-${month}`;
    if (!isLoading && members.length > 0 && startMemberIndicesRef.current[monthKey] === undefined) {
        calculateAndStoreStartIndex(year, month);
    }
  }, [isLoading, members, year, month, calculateAndStoreStartIndex]);

  const { schedule, nextMemberIndex } = useMemo(() => {
    const monthKey = `${year}-${month}`;
    const memberNames = members.map(m => m.name);
    const startMemberIndex = startMemberIndices[monthKey] ?? 0;
    return generateSchedule(year, month, memberNames, allHolidays, startMemberIndex);
  }, [year, month, members, allHolidays, startMemberIndices]);

  const displaySchedule = useMemo(() => {
    const monthKey = `${year}-${month}`;
    const overrides = scheduleOverrides[monthKey] || {};
    if (Object.keys(overrides).length === 0) return schedule;
    const newSchedule: Schedule = new Map(schedule);
    for (const dayStr in overrides) {
      const day = parseInt(dayStr, 10);
      const member = overrides[day];
      const existingEntry = newSchedule.get(day);
      if (existingEntry) {
        newSchedule.set(day, { ...existingEntry, member, isOverridden: true });
      }
    }
    return newSchedule;
  }, [schedule, scheduleOverrides, year, month]);

    const { todayDuty, tomorrowDuty } = useMemo(() => {
    const today = referenceDate;
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    let foundTodayDutyMember: Member | null = null;
    let todayDutyDate: Date | null = null;
    if (isBusinessDay(today, allHolidays)) {
       const scheduleForDate = today.getFullYear() === year && today.getMonth() === month ? displaySchedule : 
          generateSchedule(today.getFullYear(), today.getMonth(), members.map(m=>m.name), allHolidays, 0).schedule;

       const memberName = scheduleForDate.get(today.getDate())?.member;
       if (memberName) {
         foundTodayDutyMember = members.find(m => m.name === memberName) || null;
         if(foundTodayDutyMember) todayDutyDate = today;
       }
    }

    let foundTomorrowDutyMember: Member | null = null;
    let nextDutyDay = new Date(tomorrow);
    while(!isBusinessDay(nextDutyDay, allHolidays)) {
        nextDutyDay.setDate(nextDutyDay.getDate() + 1);
    }
    
    let tomorrowMemberName: string | null = null;
    if (nextDutyDay.getFullYear() === year && nextDutyDay.getMonth() === month) {
        tomorrowMemberName = displaySchedule.get(nextDutyDay.getDate())?.member || null;
    } else {
        const nextMonthDate = new Date(year, month + 1, 1);
        const firstBusinessOfNextMonth = getFirstBusinessDayOfMonth(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), allHolidays);
        
        if (nextDutyDay.getTime() === firstBusinessOfNextMonth.getTime()) {
             const memberNames = members.map(m => m.name);
             if (memberNames.length > 0) {
                 tomorrowMemberName = memberNames[nextMemberIndex];
            }
        } else { // Handle cases far in the future
            const nextMonthSchedule = generateSchedule(nextDutyDay.getFullYear(), nextDutyDay.getMonth(), members.map(m=>m.name), allHolidays, 0).schedule;
            tomorrowMemberName = nextMonthSchedule.get(nextDutyDay.getDate())?.member || null;
        }
    }
    if (tomorrowMemberName) {
        foundTomorrowDutyMember = members.find(m => m.name === tomorrowMemberName) || null;
    }

    return { 
      todayDuty: { member: foundTodayDutyMember, date: todayDutyDate },
      tomorrowDuty: { member: foundTomorrowDutyMember, date: foundTomorrowDutyMember ? nextDutyDay : null } 
    };
  }, [referenceDate, displaySchedule, members, allHolidays, year, month, nextMemberIndex]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  }
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  }
  const handleSetToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setReferenceDate(today);
  };
  
  const onMembersSave = async (updatedMembers: Member[], isBulkUpdate: boolean) => {
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'app-data', 'members'), { data: updatedMembers });
      batch.set(doc(db, 'app-data', 'startMemberIndices'), { data: {} });
      
      const overridesCol = collection(db, 'scheduleOverrides');
      const overridesSnapshot = await getDocs(overridesCol);
      overridesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      await addLogEntry(isBulkUpdate ? '팀원 목록이 일괄 수정 기능으로 변경되었습니다.' : '팀원 목록이 변경되었습니다.');
      await addLogEntry('모든 월의 수동 변경사항이 초기화되고 스케줄이 재계산됩니다.');
      setMemberModalOpen(false);
    } catch (e) { 
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error("Error saving members: ", errorMessage);
    }
  };
  
  const onHolidaysSave = async (updatedHolidays: Holiday[]) => {
    try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'app-data', 'customHolidays'), { data: updatedHolidays });
        batch.set(doc(db, 'app-data', 'startMemberIndices'), { data: {} });
        await batch.commit();
        await addLogEntry('사용자 지정 휴일 목록이 변경되었습니다. 스케줄이 재계산됩니다.');
        setHolidayModalOpen(false);
    } catch(e) { 
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error("Error saving holidays: ", errorMessage);
    }
  };

  const handleDayClick = async (day: number) => {
    if (isSwapMode && isAdminMode) {
      const dayInfo = displaySchedule.get(day);
      if (!dayInfo || !dayInfo.member) { setSelectedDay(null); return; }
      if (selectedDay === null) { setSelectedDay(day); } 
      else {
        if (selectedDay === day) { setSelectedDay(null); return; }
        const firstMember = displaySchedule.get(selectedDay)?.member;
        const secondMember = dayInfo.member;
        if (firstMember && secondMember) {
          const monthKey = `${year}-${month}`;
          const overridesDocRef = doc(db, 'scheduleOverrides', monthKey);
          const currentOverridesDoc = await getDoc(overridesDocRef);
          const currentOverrides = currentOverridesDoc.exists() ? currentOverridesDoc.data().data : {};
          const newOverrides = { ...currentOverrides, [selectedDay]: secondMember, [day]: firstMember };
          await setDoc(overridesDocRef, { data: newOverrides });
          await addLogEntry(`${year}년 ${month + 1}월: '${firstMember}'(${selectedDay}일)와(과) '${secondMember}'(${day}일)의 담당이 교체되었습니다.`);
        }
        setSelectedDay(null);
        setSwapMode(false);
      }
    } else {
      setReferenceDate(new Date(year, month, day));
    }
  };
  
  const handleConfirmReset = async () => {
    const monthKey = `${year}-${month}`;
    await setDoc(doc(db, 'scheduleOverrides', monthKey), { data: {} });
    await addLogEntry(`${year}년 ${month + 1}월의 수동 변경사항이 초기화되었습니다.`);
    setResetConfirmOpen(false);
  };

  const handleToggleSwapMode = () => setSwapMode(isAdminMode && !isSwapMode);
  
  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setLoginModalOpen(false);
      await addLogEntry(`관리자(${email})가 로그인했습니다.`);
      return true;
    } catch (error) { 
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Login failed:", errorMessage); 
        return false; 
    }
  }

  const handleGoogleSignIn = async (): Promise<boolean> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists() && user.email) {
        const teamMemberMatch = members.find(m => m.email === user.email);
        if (teamMemberMatch) {
          const newUserProfile: UserProfile = {
            uid: user.uid,
            email: user.email,
            name: teamMemberMatch.name,
            role: 'member'
          };
          await setDoc(userDocRef, newUserProfile);
          setCurrentUserProfile(newUserProfile);
          await addLogEntry(`팀원 '${teamMemberMatch.name}'이(가) Google 계정으로 처음 로그인했습니다.`);
        } else {
          // Not in the member list, sign them out.
          await signOut(auth);
          return false;
        }
      }
      setLoginModalOpen(false);
      return true;
    } catch (error) { 
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Google Sign-In failed:", errorMessage); 
        return false; 
    }
  }
  
  const handleLogout = async () => {
      try {
          const userEmail = currentUserProfile?.email || '알수없음';
          await signOut(auth);
          await addLogEntry(`사용자(${userEmail})가 로그아웃했습니다.`);
      } catch (error) { 
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error("Logout failed:", errorMessage); 
      }
  }

  const handleSendEmailClick = (day: number) => {
    const memberName = displaySchedule.get(day)?.member;
    if (!memberName) return;
    const memberInfo = members.find(m => m.name === memberName);
    if (memberInfo) {
      setEmailTarget({member: memberInfo, date: new Date(year, month, day)});
      setEmailModalOpen(true);
    }
  };

  const handleSendEmailToMember = (member: Member, date: Date) => {
    setEmailTarget({ member, date });
    setEmailModalOpen(true);
  };
  
  const handleConfirmSendEmail = (subject: string, body: string) => {
    if (!emailTarget) return;
    window.location.href = `mailto:${emailTarget.member.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    addLogEntry(`'${emailTarget.member.name}'에게 이메일 전송을 시도했습니다.`);
    setEmailModalOpen(false);
  };

  const handleSendBulkEmail = (subject: string, body: string) => {
    const bccEmails = members.map(m => m.email).join(',');
    if (!bccEmails) return;
    window.location.href = `mailto:?bcc=${bccEmails}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    addLogEntry(`모든 팀원에게 이메일 일괄 전송을 시도했습니다.`);
    setBulkEmailModalOpen(false);
  };

  const formatReferenceDate = (date: Date): string => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const refDate = new Date(date);
      refDate.setHours(0, 0, 0, 0);
      const weekday = WEEKDAY_NAMES[refDate.getDay()];
      if (refDate.getTime() === today.getTime()) return `오늘 (${weekday})`;
      return `${refDate.getMonth() + 1}/${refDate.getDate()} (${weekday})`;
  };
  
  const handleOpenReportModal = () => {
    if (todayDuty.member && todayDuty.date) {
      setReportTarget({ member: todayDuty.member, date: todayDuty.date });
      setReportModalOpen(true);
    }
  };

  const handleSaveReport = async (result: CheckResult) => {
    if (!reportTarget) return;
    const dateKey = reportTarget.date.toISOString().split('T')[0];
    await setDoc(doc(db, 'checkResults', dateKey), result);
    const statusText = result.status === 'CompletedNormal' ? '정상' : '이슈 있음';
    const actor = currentUserProfile?.name || '알 수 없는 사용자';
    await addLogEntry(`${reportTarget.date.toLocaleDateString()} 점검이 '${actor}'에 의해 완료되었습니다. (결과: ${statusText})`);
    setReportModalOpen(false);
  };
  
  const referenceDateKey = referenceDate.toISOString().split('T')[0];
  const checkResultForDate = checkResults[referenceDateKey];
  const canPerformCheck = isAdminMode || (currentUserProfile && currentUserProfile.email === todayDuty.member?.email);

  if (isLoading || isAuthLoading) return <div className="flex justify-center items-center min-h-screen bg-slate-100"><p className="text-xl text-slate-600">데이터를 불러오는 중...</p></div>;

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-slate-300">
          <h1 className="text-3xl font-bold text-slate-700 mb-4 sm:mb-0">IT 오전 점검 스케줄러</h1>
          <div className="flex items-center space-x-2 flex-wrap justify-center">
             <button onClick={() => setLogModalOpen(true)} className="flex items-center bg-gray-200 text-gray-800 px-3 py-2 rounded-lg shadow-sm hover:bg-gray-300 transition-colors"><ClockIcon className="w-5 h-5 mr-2" />변경 기록</button>
             {currentUserProfile ? (
                 <div className="flex items-center space-x-2">
                    <div className="text-sm text-right">
                        <span className="font-semibold">{currentUserProfile.name}</span>
                        <span className={`text-xs ml-1 px-1.5 py-0.5 rounded ${isAdminMode ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{isAdminMode ? '관리자' : '팀원'}</span>
                    </div>
                    <button onClick={handleLogout} className="flex items-center bg-gray-600 text-white px-3 py-2 rounded-lg shadow hover:bg-gray-700 transition-colors"><ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />로그아웃</button>
                 </div>
             ) : (
                 <button onClick={() => setLoginModalOpen(true)} className="flex items-center bg-gray-600 text-white px-3 py-2 rounded-lg shadow hover:bg-gray-700 transition-colors"><LockClosedIcon className="w-5 h-5 mr-2" />로그인</button>
             )}
            <button onClick={() => setMemberModalOpen(true)} disabled={!isAdminMode} title={!isAdminMode ? '관리자 로그인이 필요합니다.' : '팀원 관리'} className="flex items-center bg-blue-600 text-white px-3 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><UserGroupIcon className="w-5 h-5 mr-2" />팀원 관리</button>
            <button onClick={() => setHolidayModalOpen(true)} disabled={!isAdminMode} title={!isAdminMode ? '관리자 로그인이 필요합니다.' : '휴일 관리'} className="flex items-center bg-teal-600 text-white px-3 py-2 rounded-lg shadow hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><CalendarIcon className="w-5 h-5 mr-2" />휴일 관리</button>
          </div>
        </header>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-slate-200 transition-colors" aria-label="Previous month"><ChevronLeftIcon className="w-6 h-6" /></button>
              <h2 className="text-2xl font-semibold w-48 text-center">{year}년 {month + 1}월</h2>
              <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-slate-200 transition-colors" aria-label="Next month"><ChevronRightIcon className="w-6 h-6" /></button>
               <button onClick={handleSetToday} className="bg-slate-200 text-slate-800 px-4 py-1.5 rounded-md hover:bg-slate-300 transition-colors text-sm font-medium">오늘</button>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-4">
                <div className="p-4 bg-indigo-50 rounded-lg flex flex-col justify-between w-60 h-32 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-indigo-600">{formatReferenceDate(referenceDate)} 담당자</p>
                            <p className="text-2xl font-bold text-indigo-800">{todayDuty.member?.name || '없음'}</p>
                        </div>
                        {isAdminMode && todayDuty.member && todayDuty.date && <button onClick={() => handleSendEmailToMember(todayDuty.member!, todayDuty.date!)} className="p-1.5 text-indigo-500 hover:bg-indigo-100 rounded-full transition-colors flex-shrink-0" title={`${todayDuty.member.name}에게 메일 보내기`}><EnvelopeIcon className="w-5 h-5" /></button>}
                    </div>
                    <div className="min-h-[36px] flex flex-col justify-end">
                        {todayDuty.member && (
                            <>
                            {checkResultForDate ? (
                                <div className="text-left">
                                {checkResultForDate.status === 'CompletedNormal' ? 
                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full"><CheckCircleIcon className="w-4 h-4 mr-1"/> 점검 완료 - 정상</span>
                                 : 
                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-full"><ExclamationTriangleIcon className="w-4 h-4 mr-1"/> 점검 완료 - 이슈 있음</span>
                                }
                                <button onClick={handleOpenReportModal} disabled={!canPerformCheck} className="ml-2 text-xs text-indigo-600 hover:underline disabled:text-slate-400 disabled:no-underline">결과 보기/수정</button>
                                </div>
                            ) : (
                                <button onClick={handleOpenReportModal} disabled={!canPerformCheck} title={!currentUserProfile ? '로그인이 필요합니다.' : (!canPerformCheck ? '점검 권한이 없습니다.' : '')} className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"><ShieldCheckIcon className="w-5 h-5 mr-2" />점검 시작</button>
                            )}
                            </>
                        )}
                    </div>
                </div>
                <div className="p-4 bg-sky-50 rounded-lg flex flex-col justify-between w-60 h-32 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                        <p className="text-sm font-medium text-sky-600">{tomorrowDuty.date ? `${formatReferenceDate(tomorrowDuty.date)} 담당자` : '다음 근무일'}</p>
                        <p className="text-2xl font-bold text-sky-800">{tomorrowDuty.member?.name || '없음'}</p>
                        </div>
                        {isAdminMode && tomorrowDuty.member && tomorrowDuty.date && <button onClick={() => handleSendEmailToMember(tomorrowDuty.member!, tomorrowDuty.date!)} className="p-1.5 text-sky-500 hover:bg-sky-100 rounded-full transition-colors flex-shrink-0" title={`${tomorrowDuty.member.name}에게 메일 보내기`}><EnvelopeIcon className="w-5 h-5" /></button>}
                    </div>
                    <div className="min-h-[36px]"></div>
                </div>
            </div>
          </div>
           <div className="flex justify-end items-center mb-4 space-x-2">
              <button onClick={handleToggleSwapMode} disabled={!isAdminMode} title={!isAdminMode ? '관리자 로그인이 필요합니다.' : '담당자 교체'} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isSwapMode ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-green-600 text-white hover:bg-green-700'}`}><SwapIcon className="w-5 h-5 mr-2"/>{isSwapMode ? '교체 취소' : '담당자 교체'}</button>
              {scheduleOverrides[`${year}-${month}`] && Object.keys(scheduleOverrides[`${year}-${month}`]).length > 0 && <button onClick={() => setResetConfirmOpen(true)} disabled={!isAdminMode} title={!isAdminMode ? '관리자 로그인이 필요합니다.' : '이번 달 변경사항 초기화'} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">이번 달 변경사항 초기화</button>}
          </div>
          <Calendar currentDate={currentDate} referenceDate={referenceDate} schedule={displaySchedule} holidays={allHolidays} onDayClick={handleDayClick} selectedDay={selectedDay} isSwapMode={isSwapMode} isAdminMode={isAdminMode} onSendEmailClick={handleSendEmailClick}/>
        </div>
      </div>
      
      {reportTarget && (
        <ReportModal isOpen={isReportModalOpen} onClose={() => setReportModalOpen(false)} dutyInfo={reportTarget} initialResult={checkResults[reportTarget.date.toISOString().split('T')[0]] || null} onSave={handleSaveReport}/>
      )}
      <ChangeLogModal isOpen={isLogModalOpen} onClose={() => setLogModalOpen(false)} log={changeLog}/>
      {isLoginModalOpen && <LoginModal isOpen={isLoginModalOpen} onClose={() => setLoginModalOpen(false)} onLogin={handleLogin} onGoogleSignIn={handleGoogleSignIn} />}
      {emailTarget && <EmailModal isOpen={isEmailModalOpen} onClose={() => setEmailModalOpen(false)} onSend={handleConfirmSendEmail} targetMember={emailTarget.member} date={emailTarget.date}/>}
      {isAdminMode && <BulkEmailModal isOpen={isBulkEmailModalOpen} onClose={() => setBulkEmailModalOpen(false)} onSend={handleSendBulkEmail} members={members} schedule={displaySchedule} currentDate={currentDate}/>}
      {isAdminMode && isMemberModalOpen && <MemberManager initialMembers={members} onSave={onMembersSave} onClose={() => setMemberModalOpen(false)} onOpenBulkEmailModal={() => setBulkEmailModalOpen(true)}/>}
      {isAdminMode && isHolidayModalOpen && <HolidayManager initialHolidays={customHolidays} onSave={onHolidaysSave} onClose={() => setHolidayModalOpen(false)}/>}
      {isAdminMode && <ConfirmationModal isOpen={isResetConfirmOpen} onClose={() => setResetConfirmOpen(false)} onConfirm={handleConfirmReset} title="변경사항 초기화 확인" confirmText="초기화" confirmColor="red"><div className="text-center"><ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4"/><p className="text-slate-600">이번 달에 수동으로 변경한 모든 담당자 교체 내역을 초기화하시겠습니까?<br/>이 작업은 되돌릴 수 없습니다.</p></div></ConfirmationModal>}
    </div>
  );
};

export default App;