import { useState, useCallback } from 'react';
import { CalendarDays, Sparkles } from 'lucide-react';
import ChatPanel from '@/components/ChatPanel';
import Timetable from '@/components/Timetable';
import ParsedRequestCard from '@/components/ParsedRequestCard';
import { getInitialSchedule, getTimesInRange, type TimeSlot, type RoomType, type ParsedRequest } from '@/lib/reservation';

export default function Index() {
  const [schedule, setSchedule] = useState<TimeSlot[]>(getInitialSchedule);
  const [parsedRequest, setParsedRequest] = useState<ParsedRequest | null>(null);

  const handleConfirm = useCallback((time: string, room: RoomType, endTime?: string) => {
    const times = endTime ? getTimesInRange(time, endTime) : [time];
    setSchedule(prev =>
      prev.map(slot =>
        times.includes(slot.time) && slot.room === room ? { ...slot, status: 'confirmed' as const } : slot
      )
    );
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-5 shadow-sm">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-md">
              <CalendarDays className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
                AI 기반 스터디룸 예약 시스템
                <Sparkles className="h-5 w-5 text-primary" />
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                자연어 예약 요청을 이해하고 예약 충돌 시 대안을 추천하는 스마트 예약 도우미
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 gap-6 p-6">
        {/* Left — Chat */}
        <section className="flex w-5/12 flex-col" style={{ minHeight: 'calc(100vh - 140px)' }}>
          <ChatPanel schedule={schedule} onConfirm={handleConfirm} onParsedRequest={setParsedRequest} />
        </section>

        {/* Right — Dashboard */}
        <section className="flex w-7/12 flex-col gap-5">
          <Timetable schedule={schedule} />
          <ParsedRequestCard request={parsedRequest} />
        </section>
      </main>
    </div>
  );
}
