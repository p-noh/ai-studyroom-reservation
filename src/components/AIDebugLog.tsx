import { useState } from 'react';
import { ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import type { ParsedRequest, Suggestion } from '@/lib/reservation';

interface DebugData {
  intent: string;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  people: number | null;
  room_type: string | null;
  status: string;
  alternatives: { label: string; time: string; room: string }[];
}

interface AIDebugLogProps {
  parsedRequest: ParsedRequest | null;
  suggestions?: Suggestion[];
  hasConflict?: boolean;
}

function buildDebugData(req: ParsedRequest | null, suggestions: Suggestion[], hasConflict: boolean): DebugData {
  if (!req) {
    return {
      intent: 'none',
      date: null,
      start_time: null,
      end_time: null,
      people: null,
      room_type: null,
      status: 'waiting',
      alternatives: [],
    };
  }

  return {
    intent: 'reservation',
    date: req.date,
    start_time: req.time,
    end_time: req.endTime ?? null,
    people: req.capacity,
    room_type: req.room,
    status: hasConflict ? 'conflict' : 'available',
    alternatives: suggestions.map(s => ({ label: s.label, time: s.time, room: s.room })),
  };
}

export default function AIDebugLog({ parsedRequest, suggestions = [], hasConflict = false }: AIDebugLogProps) {
  const [open, setOpen] = useState(false);
  const data = buildDebugData(parsedRequest, suggestions, hasConflict);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]">
      <button
        onClick={() => setOpen(v => !v)}
        className="ml-auto flex items-center gap-2 rounded-t-lg bg-[hsl(220,13%,14%)] px-3 py-1.5 text-xs font-mono text-[hsl(142,71%,65%)] shadow-lg hover:bg-[hsl(220,13%,18%)] transition-colors"
      >
        <Terminal className="h-3.5 w-3.5" />
        AI Debug Log
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
      </button>
      {open && (
        <div className="max-h-64 overflow-y-auto rounded-b-lg rounded-tl-lg bg-[hsl(220,13%,10%)] p-3 shadow-lg border border-[hsl(220,13%,20%)]">
          <pre className="font-mono text-[11px] leading-relaxed text-[hsl(210,14%,75%)] whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
