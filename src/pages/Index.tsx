import { useState, useCallback } from 'react';
import { CalendarDays, Sparkles } from 'lucide-react';
import ChatPanel from '@/components/ChatPanel';
import Timetable from '@/components/Timetable';
import ParsedRequestCard from '@/components/ParsedRequestCard';
import { getInitialSchedule, type TimeSlot, type RoomType, type ParsedRequest } from '@/lib/reservation';

export default function Index() {
  const [schedule, setSchedule] = useState<TimeSlot[]>(getInitialSchedule);
  const [parsedRequest, setParsedRequest] = useState<ParsedRequest | null>(null);

  const handleConfirm = useCallback((time: string, room: RoomType) => {
    setSchedule(prev =>
      prev.map(slot =>
        slot.time === time && slot.room === room ? { ...slot, status: 'confirmed' as const } : slot
      )
    );
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-card px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <CalendarDays className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="flex items-center gap-1.5 text-base font-bold">
              스터디룸 예약 시스템
              <Sparkles className="h-4 w-4 text-primary" />
            </h1>
            <p className="text-xs text-muted-foreground">AI 기반 스마트 예약 도우미</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 gap-5 p-5">
        {/* Left — Chat (5 parts) */}
        <section className="flex w-5/12 flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
          <ChatPanel schedule={schedule} onConfirm={handleConfirm} onParsedRequest={setParsedRequest} />
        </section>

        {/* Right — Dashboard (7 parts) */}
        <section className="flex w-7/12 flex-col gap-4">
          <Timetable schedule={schedule} />
          <ParsedRequestCard request={parsedRequest} />
        </section>
      </main>
    </div>
  );
}
