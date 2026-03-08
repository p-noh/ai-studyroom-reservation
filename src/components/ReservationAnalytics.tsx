import { Zap, TrendingUp, AlertCircle } from 'lucide-react';
import { type TimeSlot, type RoomType } from '@/lib/reservation';

interface ReservationAnalyticsProps {
  schedule: TimeSlot[];
}

interface RoomAnalysis {
  room: RoomType;
  booked: number;
  available: number;
  rate: number;
}

export default function ReservationAnalytics({ schedule }: ReservationAnalyticsProps) {
  // Analyze room usage rates
  const analyzeRooms = (): RoomAnalysis[] => {
    const rooms: RoomType[] = ['4인실', '6인실', '8인실'];
    return rooms.map(room => {
      const roomSlots = schedule.filter(s => s.room === room);
      const booked = roomSlots.filter(s => s.status === 'booked' || s.status === 'confirmed').length;
      const available = roomSlots.filter(s => s.status === 'available').length;
      const rate = available > 0 ? Math.round((booked / (booked + available)) * 100) : 0;
      return { room, booked, available, rate };
    });
  };

  // Identify busy time slots
  const analyzeBusyTimes = (): string[] => {
    const timeSlotMap = new Map<string, number>();
    schedule.forEach(slot => {
      if (slot.status !== 'available') {
        const count = timeSlotMap.get(slot.time) || 0;
        timeSlotMap.set(slot.time, count + 1);
      }
    });

    const sorted = Array.from(timeSlotMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([time]) => time);

    return sorted;
  };

  const roomAnalysis = analyzeRooms();
  const busyTimes = analyzeBusyTimes();
  
  // Generate insights
  const highestRate = roomAnalysis.reduce((max, room) => 
    room.rate > max.rate ? room : max
  );
  
  const lowestRate = roomAnalysis.reduce((min, room) => 
    room.rate < min.rate ? room : min
  );

  const insights = [
    {
      icon: TrendingUp,
      text: `현재 ${highestRate.room} 예약률이 가장 높습니다. (${highestRate.rate}%)`,
    },
    busyTimes.length > 0 && {
      icon: AlertCircle,
      text: `${busyTimes.join(', ')} 시간대 예약이 집중되어 있습니다.`,
    },
    {
      icon: Zap,
      text: `${lowestRate.room}은 비교적 여유가 있어 대체 예약에 유리합니다.`,
    },
  ].filter(Boolean) as Array<{ icon: any; text: string }>;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">AI 예약 분석</h3>
          <p className="text-xs text-muted-foreground">Real-time Reservation Analytics</p>
        </div>
      </div>

      <div className="space-y-4">
        {insights.map((insight, idx) => {
          const Icon = insight.icon;
          return (
            <div key={idx} className="flex items-start gap-3 rounded-lg bg-secondary/20 p-4">
              <Icon className="h-5 w-5 flex-shrink-0 text-primary mt-0.5" />
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {insight.text}
              </p>
            </div>
          );
        })}
      </div>

      {/* Room status summary */}
      <div className="mt-6 space-y-2 border-t border-border pt-6">
        <h4 className="text-sm font-semibold text-foreground">방별 현황</h4>
        <div className="space-y-2">
          {roomAnalysis.map(room => (
            <div key={room.room} className="flex items-center justify-between text-sm">
              <span className="text-foreground font-medium">{room.room}</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 rounded-full bg-secondary/40 overflow-hidden">
                  <div
                    className="h-full bg-primary/70 transition-all"
                    style={{ width: `${room.rate}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {room.rate}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
