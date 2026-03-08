import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ChatMessage, TimeSlot, RoomType, Suggestion } from '@/lib/reservation';
import { parseRequest, generateResponse, getTimesInRange, type ParsedRequest } from '@/lib/reservation';

interface CancelTarget {
  times: string[];
  room: RoomType;
  label: string;
}

interface DebugInfo {
  parsed: ParsedRequest | null;
  suggestions: Suggestion[];
  hasConflict: boolean;
}

interface ChatPanelProps {
  schedule: TimeSlot[];
  onConfirm: (time: string, room: RoomType, endTime?: string) => void;
  onCancel: (times: string[], room: RoomType) => void;
  onParsedRequest: (req: ParsedRequest | null) => void;
  onDebugInfo: (info: DebugInfo) => void;
}

function TypingIndicator() {
  return (
    <div className="flex animate-fade-in items-start gap-2">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary shadow-sm">
        <Bot className="h-3.5 w-3.5 text-primary-foreground" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-chat-ai px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function ConfirmationBanner() {
  return (
    <div className="flex animate-fade-in items-start gap-2">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-confirmed shadow-sm">
        <CheckCircle2 className="h-3.5 w-3.5 text-confirmed-foreground" />
      </div>
      <div className="rounded-2xl rounded-tl-sm border border-confirmed/30 bg-confirmed/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-confirmed" />
          <span className="text-sm font-semibold text-confirmed">예약이 확정되었습니다!</span>
        </div>
      </div>
    </div>
  );
}

export default function ChatPanel({ schedule, onConfirm, onCancel, onParsedRequest, onDebugInfo }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'ai',
      content: '안녕하세요! 스터디룸 예약 도우미입니다.\n원하시는 날짜, 시간, 인원을 말씀해 주세요.\n\n예시: "내일 오후 2시에 4명 방 예약해줘"',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingCancel, setPendingCancel] = useState<CancelTarget | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, showConfirmation]);

  const isLookupCommand = (text: string): boolean => {
    if (isCancelCommand(text)) return false;
    const patterns = ['내 예약', '예약 확인', '예약 보여', '예약 조회', '예약 현황'];
    return patterns.some(p => text.includes(p));
  };

  const isCancelCommand = (text: string): boolean => {
    return text.includes('취소');
  };

  /** Get confirmed reservations grouped into ranges by room */
  const getConfirmedRanges = (): CancelTarget[] => {
    const confirmed = schedule.filter(s => s.status === 'confirmed');
    if (confirmed.length === 0) return [];

    const grouped = new Map<RoomType, string[]>();
    for (const slot of confirmed) {
      const times = grouped.get(slot.room) || [];
      times.push(slot.time);
      grouped.set(slot.room, times);
    }

    const targets: CancelTarget[] = [];
    grouped.forEach((times, room) => {
      times.sort();
      let i = 0;
      while (i < times.length) {
        const start = times[i];
        const rangeTimes = [start];
        let endH = parseInt(start.split(':')[0]) + 1;
        while (i + 1 < times.length && parseInt(times[i + 1].split(':')[0]) === endH) {
          i++;
          rangeTimes.push(times[i]);
          endH = parseInt(times[i].split(':')[0]) + 1;
        }
        const endTime = `${endH.toString().padStart(2, '0')}:00`;
        targets.push({ times: rangeTimes, room, label: `${start}–${endTime} ${room}` });
        i++;
      }
    });
    return targets;
  };

  const buildCancelResponse = (text: string): { content: string; cancelTarget?: CancelTarget } => {
    const ranges = getConfirmedRanges();
    if (ranges.length === 0) {
      return { content: '현재 확정된 예약이 없어 취소할 수 없습니다.' };
    }

    // Check for "방금" (most recent)
    if (text.includes('방금')) {
      const target = ranges[ranges.length - 1];
      return {
        content: `다음 예약을 취소하시겠습니까?\n\n📌 내일 ${target.label}\n\n취소를 원하시면 아래 버튼을 눌러주세요.`,
        cancelTarget: target,
      };
    }

    // Try to match specific time/room from text
    const timeMatch = text.match(/(\d{1,2})\s*시/);
    const roomMatch = text.match(/(4|6|8)인실/);

    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      if (text.includes('오후') && hour < 12) hour += 12;
      const timeStr = `${hour.toString().padStart(2, '0')}:00`;

      const match = ranges.find(r => {
        const roomOk = !roomMatch || r.room === `${roomMatch[1]}인실`;
        const timeOk = r.times.includes(timeStr);
        return roomOk && timeOk;
      });

      if (match) {
        return {
          content: `다음 예약을 취소하시겠습니까?\n\n📌 내일 ${match.label}\n\n취소를 원하시면 아래 버튼을 눌러주세요.`,
          cancelTarget: match,
        };
      }
      return { content: `해당 시간(${timeStr})에 확정된 예약을 찾을 수 없습니다.` };
    }

    // No specific time — if only one reservation, target it; otherwise list them
    if (ranges.length === 1) {
      return {
        content: `다음 예약을 취소하시겠습니까?\n\n📌 내일 ${ranges[0].label}\n\n취소를 원하시면 아래 버튼을 눌러주세요.`,
        cancelTarget: ranges[0],
      };
    }

    let content = '취소할 예약을 선택해 주세요:\n';
    ranges.forEach((r, i) => {
      content += `\n${i + 1}. 내일 ${r.label}`;
    });
    content += '\n\n시간을 포함해서 다시 말씀해 주세요.\n예시: "16시 4인실 예약 취소해줘"';
    return { content };
  };

  const buildLookupResponse = (): string => {
    const confirmed = schedule.filter(s => s.status === 'confirmed');
    if (confirmed.length === 0) {
      return '현재 확정된 예약이 없습니다.\n새로운 예약을 원하시면 날짜, 시간, 인원을 말씀해 주세요.';
    }

    const grouped = new Map<RoomType, string[]>();
    for (const slot of confirmed) {
      const times = grouped.get(slot.room) || [];
      times.push(slot.time);
      grouped.set(slot.room, times);
    }

    let content = '📋 현재 확정된 예약 목록입니다:\n';
    grouped.forEach((times, room) => {
      times.sort();
      let i = 0;
      while (i < times.length) {
        const start = times[i];
        let endH = parseInt(start.split(':')[0]) + 1;
        while (i + 1 < times.length && parseInt(times[i + 1].split(':')[0]) === endH) {
          i++;
          endH = parseInt(times[i].split(':')[0]) + 1;
        }
        const endTime = `${endH.toString().padStart(2, '0')}:00`;
        content += `\n• 내일 ${start}–${endTime} ${room}`;
        i++;
      }
    });

    return content;
  };

  const handleCancelConfirm = () => {
    if (!pendingCancel) return;
    onCancel(pendingCancel.times, pendingCancel.room);
    const msg: ChatMessage = {
      id: Date.now().toString(),
      role: 'ai',
      content: `🗑️ 내일 ${pendingCancel.label} 예약이 취소되었습니다.\n다른 시간에 다시 예약하시려면 말씀해 주세요.`,
    };
    setMessages(prev => [...prev, msg]);
    setPendingCancel(null);
  };

  const handleCancelKeep = () => {
    const msg: ChatMessage = {
      id: Date.now().toString(),
      role: 'ai',
      content: '예약이 유지됩니다. 다른 도움이 필요하시면 말씀해 주세요!',
    };
    setMessages(prev => [...prev, msg]);
    setPendingCancel(null);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let aiMsg: ChatMessage;

      if (isCancelCommand(text)) {
        const result = buildCancelResponse(text);
        aiMsg = { id: (Date.now() + 1).toString(), role: 'ai', content: result.content };
        if (result.cancelTarget) setPendingCancel(result.cancelTarget);
        onParsedRequest(null);
        onDebugInfo({ parsed: null, suggestions: [], hasConflict: false });
      } else if (isLookupCommand(text)) {
        aiMsg = { id: (Date.now() + 1).toString(), role: 'ai', content: buildLookupResponse() };
        onParsedRequest(null);
        onDebugInfo({ parsed: null, suggestions: [], hasConflict: false });
      } else {
        const parsed = parseRequest(text);
        onParsedRequest(parsed);

        if (!parsed) {
          aiMsg = {
            id: (Date.now() + 1).toString(),
            role: 'ai',
            content: '죄송합니다. 요청을 이해하지 못했습니다.\n시간과 인원 수를 포함해서 다시 말씀해 주세요.\n\n예시: "내일 오후 3시에 6명 예약"',
          };
          onDebugInfo({ parsed: null, suggestions: [], hasConflict: false });
        } else {
          const response = generateResponse(schedule, parsed);
          const hasConflict = !!(response.suggestions && response.suggestions.length > 0);
          aiMsg = {
            id: (Date.now() + 1).toString(),
            role: 'ai',
            content: response.content,
            suggestions: response.suggestions,
            parsedRequest: parsed,
          };
          onDebugInfo({ parsed, suggestions: response.suggestions || [], hasConflict });
        }
      }

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const handleSuggestionClick = (s: Suggestion) => {
    onConfirm(s.time, s.room, s.endTime);
    setShowConfirmation(true);

    setTimeout(() => {
      const timeLabel = s.endTime ? `${s.time}–${s.endTime}` : s.time;
      const confirmMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'ai',
        content: `✅ ${timeLabel} ${s.room} 예약이 확정되었습니다.\n즐거운 스터디 되세요!`,
      };
      setMessages(prev => [...prev, confirmMsg]);
      setShowConfirmation(false);
    }, 1500);
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-border bg-card shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">AI 예약 도우미</h2>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-confirmed animate-pulse" />
            <p className="text-xs text-muted-foreground">온라인 · 자연어로 예약을 도와드립니다</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.map(msg => (
          <div key={msg.id} className={`flex animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="flex max-w-[85%] gap-2">
              {msg.role === 'ai' && (
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary shadow-sm">
                  <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              )}
              <div>
                <div
                  className={`text-sm leading-relaxed whitespace-pre-line shadow-sm ${
                    msg.role === 'user'
                      ? 'rounded-2xl rounded-tr-sm bg-chat-user px-4 py-3 text-chat-user-foreground'
                      : 'rounded-2xl rounded-tl-sm bg-chat-ai px-4 py-3 text-chat-ai-foreground'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {msg.suggestions.map((s, i) => (
                      <Button
                        key={i}
                        size="sm"
                        variant="outline"
                        className="rounded-full border-primary/50 text-primary shadow-sm transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:shadow-md"
                        onClick={() => handleSuggestionClick(s)}
                      >
                        {s.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary shadow-sm">
                  <User className="h-3.5 w-3.5 text-secondary-foreground" />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Cancel confirmation buttons */}
        {pendingCancel && (
          <div className="flex animate-fade-in items-start gap-2">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary shadow-sm">
              <Bot className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full border-destructive/50 text-destructive shadow-sm hover:bg-destructive hover:text-destructive-foreground"
                onClick={handleCancelConfirm}
              >
                취소 확인
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full border-primary/50 text-primary shadow-sm hover:bg-primary hover:text-primary-foreground"
                onClick={handleCancelKeep}
              >
                유지
              </Button>
            </div>
          </div>
        )}

        {isTyping && <TypingIndicator />}
        {showConfirmation && <ConfirmationBanner />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border p-4">
        <form
          className="flex gap-2"
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
        >
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="예약 요청을 입력하세요..."
            className="flex-1 rounded-full border-border bg-muted/50 px-4 focus-visible:ring-primary"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim()}
            className="rounded-full shadow-sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
