import { getRooms, getTimes, type TimeSlot, type RoomType } from '@/lib/reservation';
import { Clock } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface TimetableProps {
  schedule: TimeSlot[];
}

const getStatusLabel = (status: string): string => {
  if (status === 'booked') return '예약됨';
  if (status === 'confirmed') return '내 예약';
  return '예약 가능';
};

export default function Timetable({ schedule }: TimetableProps) {
  const rooms = getRooms();
  const times = getTimes();

  const getSlot = (room: RoomType, time: string) =>
    schedule.find(s => s.room === room && s.time === time);

  return (
    <TooltipProvider>
      <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">내일 예약 현황</h3>
            <p className="text-xs text-muted-foreground">Study Room Availability</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="sticky left-0 z-10 bg-secondary/30 px-4 py-3 text-left font-semibold text-foreground">
                  스터디룸
                </th>
                {times.map(t => (
                  <th key={t} className="px-2 py-3 text-center font-semibold text-foreground">
                    <div className="text-sm">{t}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rooms.map((room, idx) => (
                <tr key={room} className={idx % 2 === 0 ? 'bg-background/50' : 'bg-card'}>
                  <td className="sticky left-0 z-10 bg-inherit px-4 py-4 font-semibold text-foreground">
                    {room}
                  </td>
                  {times.map(time => {
                    const slot = getSlot(room, time);
                    const status = slot?.status ?? 'available';
                    const statusLabel = getStatusLabel(status);

                    const getStyles = () => {
                      switch (status) {
                        case 'booked':
                          return 'bg-booked hover:bg-booked/90 text-booked-foreground shadow-md';
                        case 'confirmed':
                          return 'bg-confirmed hover:bg-confirmed/90 text-confirmed-foreground shadow-md';
                        default:
                          return 'bg-available hover:bg-available/90 text-available-foreground shadow-md';
                      }
                    };

                    return (
                      <td key={time} className="px-2 py-3">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`flex h-10 w-full items-center justify-center rounded-lg font-semibold text-xs transition-all duration-200 cursor-help ${getStyles()}`}
                            >
                              {status === 'booked' ? '예약' : status === 'confirmed' ? '확정' : '가능'}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs font-medium">
                            {statusLabel}
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 flex gap-6">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-md bg-available shadow-sm" />
            <span className="text-sm font-medium text-foreground">예약 가능</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-md bg-booked shadow-sm" />
            <span className="text-sm font-medium text-foreground">예약됨</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-md bg-confirmed shadow-sm" />
            <span className="text-sm font-medium text-foreground">내 예약</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
