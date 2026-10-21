/**
 * 운영 시간 원자료 → 지금 시각 기준 운영 상태. 가게·건물 데이터는 "운영 중" 같은 문구가 아니라 요일별 시간을
 * 들고 있고, 화면은 이 함수로 상태 문구를 만든다(나중에 서버 API도 같은 형태로 받는다).
 *
 * 시각은 기기 시간대와 상관없이 한국 시간(UTC+9, 서머타임 없음)으로 계산한다.
 */

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/** 하루 중 한 구간. "HH:MM". close가 open보다 이르면(예: 18:00–02:00) 다음 날 새벽까지 이어지는 구간이다. */
export interface TimeRange {
  open: string;
  close: string;
}

/**
 * - always: 24시간 연중무휴
 * - weekly: 요일별 운영 구간. 빈 배열 = 그날 휴무, 구간 여러 개 = 브레이크 타임
 */
export type OperatingHours = { kind: 'always' } | { kind: 'weekly'; days: Record<Weekday, TimeRange[]> };

export interface OperatingStatus {
  isOpen: boolean;
  /** "운영 중" / "운영 종료" / "휴무" */
  statusText: string;
  /** "22:00에 운영 종료" / "내일 11:00 운영 시작" / "24시간 운영" */
  detailText: string;
  /** 목록 한 줄용 오늘 운영 시간. "08:00 - 22:00" / "24시간" / "오늘 휴무" */
  todayText: string;
}

const WEEKDAYS: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const WEEKDAY_LABEL: Record<Weekday, string> = {
  mon: '월',
  tue: '화',
  wed: '수',
  thu: '목',
  fri: '금',
  sat: '토',
  sun: '일',
};
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MINUTES = 24 * 60;

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/** 한국 시간 기준 요일 인덱스(0=일)와 자정부터 지난 분 */
function kstNow(now: Date) {
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  return { dayIndex: kst.getUTCDay(), minutes: kst.getUTCHours() * 60 + kst.getUTCMinutes() };
}

/** 요일 인덱스의 구간들을 그 날 0시 기준 분 단위 [시작, 끝)으로. 자정을 넘는 구간은 끝이 1440을 넘는다. */
function rangesOf(hours: Extract<OperatingHours, { kind: 'weekly' }>, dayIndex: number) {
  return (hours.days[WEEKDAYS.at(((dayIndex % 7) + 7) % 7) ?? 'sun'] ?? []).map(({ open, close }) => {
    const start = toMinutes(open);
    let end = toMinutes(close);
    if (end <= start) end += DAY_MINUTES;
    return { start, end, open, close };
  });
}

export function getOperatingStatus(hours: OperatingHours, now: Date = new Date()): OperatingStatus {
  if (hours.kind === 'always') {
    return { isOpen: true, statusText: '운영 중', detailText: '24시간 운영', todayText: '24시간' };
  }
  const { dayIndex, minutes } = kstNow(now);
  const today = rangesOf(hours, dayIndex);
  const todayText = today.length > 0 ? today.map(r => `${r.open} - ${r.close}`).join(', ') : '오늘 휴무';

  // 지금 열려 있는 구간: 오늘 구간, 또는 어제 시작해 자정을 넘긴 구간.
  const current =
    today.find(r => minutes >= r.start && minutes < r.end) ??
    rangesOf(hours, dayIndex - 1).find(r => minutes + DAY_MINUTES < r.end);
  if (current) {
    return { isOpen: true, statusText: '운영 중', detailText: `${current.close}에 운영 종료`, todayText };
  }

  // 다음에 여는 때: 오늘 남은 구간 → 내일 → 그 다음 요일들.
  const laterToday = today.find(r => r.start > minutes);
  if (laterToday) {
    return { isOpen: false, statusText: '운영 종료', detailText: `${laterToday.open}에 운영 시작`, todayText };
  }
  for (let offset = 1; offset <= 7; offset += 1) {
    const next = rangesOf(hours, dayIndex + offset)[0];
    if (!next) continue;
    const day = WEEKDAYS.at((dayIndex + offset) % 7) ?? 'sun';
    const when = offset === 1 ? '내일' : `${WEEKDAY_LABEL[day]}요일`;
    return {
      isOpen: false,
      statusText: today.length > 0 ? '운영 종료' : '휴무',
      detailText: `${when} ${next.open} 운영 시작`,
      todayText,
    };
  }
  return { isOpen: false, statusText: '휴무', detailText: '운영 시간 정보 없음', todayText };
}

/** 매일 같은 시간 운영 */
export const everyDay = (open: string, close: string): OperatingHours => {
  const range = [{ open, close }];
  return {
    kind: 'weekly',
    days: { mon: range, tue: range, wed: range, thu: range, fri: range, sat: range, sun: range },
  };
};

/**
 * 서버 운영시간 원문("05:00 - 23:00")을 매일 같은 시간으로 읽는다. "00:00 - 24:00"은 24시간 운영.
 * 형식이 다르면(요일별 문구 등) 추정하지 않고 undefined — 화면은 운영 시간 줄을 뺀다.
 */
export function parseOperatingHoursText(text: string | null | undefined): OperatingHours | undefined {
  const match = text?.trim().match(/^(\d{1,2}):(\d{2})\s*[-–~]\s*(\d{1,2}):(\d{2})$/);
  if (!match) return undefined;
  const [, oh, om, ch, cm] = match;
  if (Number(oh) === 0 && om === '00' && ch === '24' && cm === '00') return { kind: 'always' };
  return everyDay(`${oh.padStart(2, '0')}:${om}`, `${ch.padStart(2, '0')}:${cm}`);
}
