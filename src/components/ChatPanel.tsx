import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ChatMessage, TimeSlot, RoomType, Suggestion } from '@/lib/reservation';
import { parseRequest, generateResponse, type ParsedRequest } from '@/lib/reservation';

interface ChatPanelProps {
  schedule: TimeSlot[];
  onConfirm: (time: string, room: RoomType, endTime?: string) => void;
  onParsedRequest: (req: ParsedRequest | null) => void;
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

export default function ChatPanel({ schedule, onConfirm, onParsedRequest }: ChatPanelProps) {
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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, showConfirmation]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const parsed = parseRequest(text);
      onParsedRequest(parsed);

      let aiMsg: ChatMessage;
      if (!parsed) {
        aiMsg = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: '죄송합니다. 요청을 이해하지 못했습니다.\n시간과 인원 수를 포함해서 다시 말씀해 주세요.\n\n예시: "내일 오후 3시에 6명 예약"',
        };
      } else {
        const response = generateResponse(schedule, parsed);
        aiMsg = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: response.content,
          suggestions: response.suggestions,
          parsedRequest: parsed,
        };
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
        {isTyping && <TypingIndicator />}
        {showConfirmation && <ConfirmationBanner />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
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
