import { FileText, Brain } from 'lucide-react';
import type { ParsedRequest } from '@/lib/reservation';

interface Props {
  request: ParsedRequest | null;
}

export default function ParsedRequestCard({ request }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">예약 요청 분석</h3>
          <p className="text-xs text-muted-foreground">AI Parsed Request</p>
        </div>
      </div>

      {request ? (
        <div className="animate-fade-in space-y-2.5 text-sm">
          {[
            { label: '날짜', value: request.date },
            { label: '시간', value: request.endTime ? `${request.time}–${request.endTime}` : request.time },
            { label: '예약 시간', value: `${request.duration}시간` },
            { label: '인원', value: `${request.capacity}명` },
            { label: '스터디룸', value: request.room },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between rounded-lg bg-muted/60 px-4 py-2.5">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-semibold text-foreground">{value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center">
          <FileText className="mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            채팅으로 예약을 요청하시면<br />AI가 분석한 결과가 여기에 표시됩니다.
          </p>
        </div>
      )}
    </div>
  );
}
