export type RoomType = '4인실' | '6인실' | '8인실';

export interface TimeSlot {
  time: string;
  room: RoomType;
  status: 'available' | 'booked' | 'confirmed';
  label?: string;
}

export interface ParsedRequest {
  date: string;
  time: string;
  endTime?: string;
  duration: number; // in hours
  capacity: number;
  room: RoomType;
}

export interface Suggestion {
  label: string;
  time: string;
  endTime?: string;
  room: RoomType;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  suggestions?: Suggestion[];
  parsedRequest?: ParsedRequest;
}

const ROOMS: RoomType[] = ['4인실', '6인실', '8인실'];
const TIMES = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

export function getInitialSchedule(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (const room of ROOMS) {
    for (const time of TIMES) {
      const isBooked =
        (time === '14:00' && room === '4인실') ||
        (time === '10:00' && room === '6인실') ||
        (time === '09:00' && room === '8인실') ||
        (time === '16:00' && room === '4인실') ||
        (time === '11:00' && room === '8인실');
      slots.push({ time, room, status: isBooked ? 'booked' : 'available' });
    }
  }
  return slots;
}

export function getRooms() { return ROOMS; }
export function getTimes() { return TIMES; }

function capacityToRoom(cap: number): RoomType {
  if (cap <= 4) return '4인실';
  if (cap <= 6) return '6인실';
  return '8인실';
}

function formatHour(h: number): string {
  return `${h.toString().padStart(2, '0')}:00`;
}

/** Get array of hourly slot times for a range. 14:00-16:00 → ['14:00','15:00'] */
export function getTimesInRange(startTime: string, endTime: string): string[] {
  const startH = parseInt(startTime.split(':')[0]);
  const endH = parseInt(endTime.split(':')[0]);
  const result: string[] = [];
  for (let h = startH; h < endH; h++) {
    result.push(formatHour(h));
  }
  return result;
}

export function parseRequest(text: string): ParsedRequest | null {
  let startHour: number | null = null;
  let endHour: number | null = null;

  // Range pattern: "14-16시", "14~16시", "14시-16시", "14시~16시", "14시부터 16시"
  const rangeMatch = text.match(/(\d{1,2})\s*시?\s*[-~부터]\s*(\d{1,2})\s*시/);
  if (rangeMatch) {
    startHour = parseInt(rangeMatch[1]);
    endHour = parseInt(rangeMatch[2]);
    if (text.includes('오후')) {
      if (startHour < 12) startHour += 12;
      if (endHour < 12) endHour += 12;
    }
  }

  // Single time: "14시", "오후 2시"
  if (startHour === null) {
    const timeMatch = text.match(/(\d{1,2})\s*시/);
    if (timeMatch) {
      startHour = parseInt(timeMatch[1]);
      if (text.includes('오후') && startHour < 12) startHour += 12;
      if (text.includes('오전') && startHour === 12) startHour = 0;
    }
  }

  if (startHour === null) return null;

  // Extract capacity
  let capacity = 4;
  const capMatch = text.match(/(\d+)\s*명/) || text.match(/(\d+)\s*인(?!실)/);
  if (capMatch) capacity = parseInt(capMatch[1]);

  // Room
  const roomMatch = text.match(/(4|6|8)인실/);
  const room = roomMatch ? (`${roomMatch[1]}인실` as RoomType) : capacityToRoom(capacity);

  const duration = endHour ? endHour - startHour : 1;
  const time = formatHour(startHour);

  return {
    date: '내일',
    time,
    endTime: endHour ? formatHour(endHour) : undefined,
    duration: Math.max(1, duration),
    capacity,
    room,
  };
}

/** Check if all slots in a range are available for a given room */
function isRangeAvailable(schedule: TimeSlot[], room: RoomType, times: string[]): boolean {
  return times.every(t => {
    const slot = schedule.find(s => s.room === room && s.time === t);
    return slot?.status === 'available';
  });
}

/** Find conflicting times in a range */
function getConflicts(schedule: TimeSlot[], room: RoomType, times: string[]): string[] {
  return times.filter(t => {
    const slot = schedule.find(s => s.room === room && s.time === t);
    return slot && slot.status !== 'available';
  });
}

function makeSuggestionLabel(startTime: string, endTime: string | undefined, room: RoomType): string {
  if (endTime) return `${startTime}–${endTime} ${room} 예약`;
  return `${startTime} ${room} 예약`;
}

export function findAlternatives(
  schedule: TimeSlot[],
  request: ParsedRequest
): Suggestion[] {
  const alts: Suggestion[] = [];
  const dur = request.duration;

  // Same room, next available consecutive block
  const startIdx = TIMES.indexOf(request.time);
  for (let i = startIdx + 1; i <= TIMES.length - dur; i++) {
    const candidateTimes = TIMES.slice(i, i + dur);
    if (isRangeAvailable(schedule, request.room, candidateTimes)) {
      const endTime = dur > 1 ? formatHour(parseInt(candidateTimes[dur - 1].split(':')[0]) + 1) : undefined;
      alts.push({
        label: makeSuggestionLabel(candidateTimes[0], endTime, request.room),
        time: candidateTimes[0],
        endTime,
        room: request.room,
      });
      break;
    }
  }

  // Same time range, larger room
  const biggerRooms = ROOMS.filter(r => parseInt(r) > parseInt(request.room));
  const requestTimes = dur > 1 && request.endTime
    ? getTimesInRange(request.time, request.endTime)
    : [request.time];

  for (const r of biggerRooms) {
    if (isRangeAvailable(schedule, r, requestTimes)) {
      alts.push({
        label: makeSuggestionLabel(request.time, request.endTime, r),
        time: request.time,
        endTime: request.endTime,
        room: r,
      });
      break;
    }
  }

  return alts;
}

export function generateResponse(
  schedule: TimeSlot[],
  request: ParsedRequest
): { content: string; suggestions?: Suggestion[] } {
  const dur = request.duration;
  const endTime = request.endTime ?? formatHour(parseInt(request.time.split(':')[0]) + 1);
  const requestTimes = getTimesInRange(request.time, endTime);
  const timeLabel = dur > 1 ? `${request.time}–${endTime}` : request.time;

  // Check all slots exist
  const allExist = requestTimes.every(t => schedule.some(s => s.time === t && s.room === request.room));
  if (!allExist) {
    return { content: '죄송합니다. 해당 시간대의 정보를 찾을 수 없습니다.' };
  }

  // Check if any slot is already confirmed
  const hasConfirmed = requestTimes.some(t => {
    const slot = schedule.find(s => s.time === t && s.room === request.room);
    return slot?.status === 'confirmed';
  });
  if (hasConfirmed) {
    return { content: '해당 시간은 이미 예약이 확정되어 있습니다.' };
  }

  // Check full availability
  if (isRangeAvailable(schedule, request.room, requestTimes)) {
    return {
      content: `${request.date} ${timeLabel} ${request.room} 예약이 가능합니다. 예약을 진행할까요?`,
      suggestions: [{
        label: makeSuggestionLabel(request.time, dur > 1 ? endTime : undefined, request.room),
        time: request.time,
        endTime: dur > 1 ? endTime : undefined,
        room: request.room,
      }],
    };
  }

  // Conflicts found
  const conflicts = getConflicts(schedule, request.room, requestTimes);
  const conflictStr = conflicts.join(', ');
  const alternatives = findAlternatives(schedule, request);

  return {
    content: `${timeLabel} ${request.room}의 ${conflictStr} 시간대가 이미 예약되어 있습니다.\n대신 아래 옵션을 추천드립니다:`,
    suggestions: alternatives,
  };
}
