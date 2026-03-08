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
  capacity: number;
  room: RoomType;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  suggestions?: { label: string; time: string; room: RoomType }[];
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

export function parseRequest(text: string): ParsedRequest | null {
  // Extract time
  let time: string | null = null;
  const timeMatch = text.match(/(\d{1,2})\s*시/);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1]);
    if (text.includes('오후') && hour < 12) hour += 12;
    if (text.includes('오전') && hour === 12) hour = 0;
    time = `${hour.toString().padStart(2, '0')}:00`;
  }

  // Extract capacity
  let capacity = 4;
  const capMatch = text.match(/(\d+)\s*명/) || text.match(/(\d+)\s*인/);
  if (capMatch) capacity = parseInt(capMatch[1]);

  // Check for specific room mention
  const roomMatch = text.match(/(4|6|8)인실/);
  const room = roomMatch ? (`${roomMatch[1]}인실` as RoomType) : capacityToRoom(capacity);

  if (!time) return null;

  return { date: '내일', time, capacity, room };
}

export function findAlternatives(
  schedule: TimeSlot[],
  request: ParsedRequest
): { label: string; time: string; room: RoomType }[] {
  const alts: { label: string; time: string; room: RoomType }[] = [];

  // Same room, next available time
  const sameRoomSlots = schedule
    .filter(s => s.room === request.room && s.status === 'available' && s.time >= request.time)
    .sort((a, b) => a.time.localeCompare(b.time));
  if (sameRoomSlots.length > 0) {
    const s = sameRoomSlots[0];
    alts.push({ label: `${s.time} ${s.room} 예약`, time: s.time, room: s.room });
  }

  // Same time, larger room
  const biggerRooms = ROOMS.filter(r => parseInt(r) > parseInt(request.room));
  for (const r of biggerRooms) {
    const slot = schedule.find(s => s.room === r && s.time === request.time && s.status === 'available');
    if (slot) {
      alts.push({ label: `${slot.time} ${slot.room} 예약`, time: slot.time, room: slot.room });
      break;
    }
  }

  return alts;
}

export function generateResponse(
  schedule: TimeSlot[],
  request: ParsedRequest
): { content: string; suggestions?: { label: string; time: string; room: RoomType }[] } {
  const targetSlot = schedule.find(s => s.time === request.time && s.room === request.room);

  if (!targetSlot) {
    return { content: '죄송합니다. 해당 시간대의 정보를 찾을 수 없습니다.' };
  }

  if (targetSlot.status === 'available') {
    return {
      content: `${request.date} ${request.time} ${request.room} 예약이 가능합니다. 예약을 진행할까요?`,
      suggestions: [{ label: `${request.time} ${request.room} 예약`, time: request.time, room: request.room }],
    };
  }

  if (targetSlot.status === 'confirmed') {
    return { content: '해당 시간은 이미 예약이 확정되어 있습니다.' };
  }

  // Booked — find alternatives
  const alternatives = findAlternatives(schedule, request);
  return {
    content: `해당 시간의 ${request.room}은 이미 예약되어 있습니다.\n대신 아래 옵션을 추천드립니다:`,
    suggestions: alternatives,
  };
}
