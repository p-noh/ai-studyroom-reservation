import { FileText } from 'lucide-react';
import type { ParsedRequest } from '@/lib/reservation';

interface Props {
  request: ParsedRequest | null;
}

export default function ParsedRequestCard({ request }: Props) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">예약 요청 분석</h3>
      </div>

      {request ? (
        <div className="animate-fade-in space-y-2 text-sm">
          <div className="flex justify-between rounded bg-muted px-3 py-1.5">
            <span className="text-muted-foreground">날짜</span>
            <span className="font-medium">{request.date}</span>
          </div>
          <div className="flex justify-between rounded bg-muted px-3 py-1.5">
            <span className="text-muted-foreground">시간</span>
            <span className="font-medium">{request.time}</span>
          </div>
          <div className="flex justify-between rounded bg-muted px-3 py-1.5">
            <span className="text-muted-foreground">인원</span>
            <span className="font-medium">{request.capacity}명</span>
          </div>
          <div className="flex justify-between rounded bg-muted px-3 py-1.5">
            <span className="text-muted-foreground">스터디룸</span>
            <span className="font-medium">{request.room}</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          채팅으로 예약을 요청하시면 AI가 분석한 결과가 여기에 표시됩니다.
        </p>
      )}
    </div>
  );
}
