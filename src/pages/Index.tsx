import { useState, useCallback } from 'react';
import { CalendarDays, Sparkles } from 'lucide-react';
import ChatPanel from '@/components/ChatPanel';
import Timetable from '@/components/Timetable';
import ParsedRequestCard from '@/components/ParsedRequestCard';
import ReservationAnalytics from '@/components/ReservationAnalytics';
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
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card px-4 py-3 shadow-sm md:px-6 md:py-5">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary shadow-md md:h-12 md:w-12">
              <CalendarDays className="h-5 w-5 text-primary-foreground md:h-6 md:w-6" />
            </div>
            <div>
              <h1 className="flex items-center gap-2 text-base font-bold text-foreground md:text-xl">
                AI 기반 스터디룸 예약 시스템
                <Sparkles className="h-4 w-4 text-primary md:h-5 md:w-5" />
              </h1>
              <p className="mt-0.5 hidden text-sm text-muted-foreground sm:block">
                자연어 예약 요청을 이해하고 예약 충돌 시 대안을 추천하는 스마트 예약 도우미
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 overflow-hidden p-4 md:flex-row md:gap-6 md:p-6">
        {/* Chat */}
        <section className="flex h-[60vh] flex-col overflow-hidden md:h-auto md:w-[47%]">
          <ChatPanel schedule={schedule} onConfirm={handleConfirm} onParsedRequest={setParsedRequest} />
        </section>

        {/* Dashboard */}
        <section className="flex-1 space-y-5 overflow-y-auto md:w-[53%]">
          <Timetable schedule={schedule} />
          <ParsedRequestCard request={parsedRequest} />
          <ReservationAnalytics schedule={schedule} />
        </section>
      </main>
    </div>
  );
}
