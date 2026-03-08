import { getRooms, getTimes, type TimeSlot, type RoomType } from '@/lib/reservation';
import { Clock } from 'lucide-react';

interface TimetableProps {
  schedule: TimeSlot[];
}

export default function Timetable({ schedule }: TimetableProps) {
  const rooms = getRooms();
  const times = getTimes();

  const getSlot = (room: RoomType, time: string) =>
    schedule.find(s => s.room === room && s.time === time);

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">내일 예약 현황</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-card px-2 py-1.5 text-left font-medium text-muted-foreground">
                스터디룸
              </th>
              {times.map(t => (
                <th key={t} className="px-1.5 py-1.5 text-center font-medium text-muted-foreground">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room}>
                <td className="sticky left-0 bg-card px-2 py-1 font-medium">{room}</td>
                {times.map(time => {
                  const slot = getSlot(room, time);
                  const status = slot?.status ?? 'available';
                  return (
                    <td key={time} className="px-1 py-1">
                      <div
                        className={`flex h-8 items-center justify-center rounded text-[10px] font-medium transition-colors ${
                          status === 'booked'
                            ? 'bg-booked text-booked-foreground'
                            : status === 'confirmed'
                            ? 'bg-confirmed text-confirmed-foreground'
                            : 'bg-available text-available-foreground'
                        }`}
                      >
                        {status === 'booked' ? '예약' : status === 'confirmed' ? '확정' : '가능'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-available" /> 예약 가능
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-booked" /> 예약됨
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-confirmed" /> 내 예약
        </div>
      </div>
    </div>
  );
}
