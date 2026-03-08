import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ChatMessage, TimeSlot, RoomType } from '@/lib/reservation';
import { parseRequest, generateResponse } from '@/lib/reservation';

interface ChatPanelProps {
  schedule: TimeSlot[];
  onConfirm: (time: string, room: RoomType) => void;
  onParsedRequest: (req: { date: string; time: string; capacity: number; room: RoomType } | null) => void;
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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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
    }, 800);
  };

  const handleSuggestionClick = (time: string, room: RoomType) => {
    onConfirm(time, room);
    const confirmMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'ai',
      content: `✅ ${time} ${room} 예약이 확정되었습니다.\n즐거운 스터디 되세요!`,
    };
    setMessages(prev => [...prev, confirmMsg]);
  };

  return (
    <div className="flex h-full flex-col rounded-lg border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
          <Bot className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">AI 예약 도우미</h2>
          <p className="text-xs text-muted-foreground">자연어로 예약을 도와드립니다</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="flex max-w-[85%] gap-2">
              {msg.role === 'ai' && (
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary">
                  <Bot className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
              <div>
                <div
                  className={`rounded-lg px-3 py-2 text-sm whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-chat-user text-chat-user-foreground'
                      : 'bg-chat-ai text-chat-ai-foreground'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msg.suggestions.map((s, i) => (
                      <Button
                        key={i}
                        size="sm"
                        variant="outline"
                        className="border-primary text-primary hover:bg-accent"
                        onClick={() => handleSuggestionClick(s.time, s.room)}
                      >
                        {s.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <User className="h-3 w-3 text-secondary-foreground" />
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex animate-fade-in items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
              <Bot className="h-3 w-3 text-primary-foreground" />
            </div>
            <div className="rounded-lg bg-chat-ai px-3 py-2 text-sm text-muted-foreground">
              입력 중...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3">
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
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
