// 평면도 방 이름 다루기. 방 이름은 대부분 번호("101", "B102", "101-1")지만 글자 이름("제1열람실", "멀티미디어실")도 있다.

/** 번호로 된 방 이름인지("101", "B102", "J101", "101-1"). 글자 이름(열람실·강당 등)이면 false. */
export function isRoomNumber(name: string): boolean {
  return /^[A-Z]*\d+(?:-\d+)*$/.test(name);
}

/** 화면·검색에 쓰는 방 이름. 번호면 "호"를 붙이고("101호"), 글자 이름은 그대로 둔다("제1열람실"). */
export function roomDisplayName(name: string): string {
  return isRoomNumber(name) ? `${name}호` : name;
}

/**
 * 글자 폭(글자 크기 대비 em) 어림값. 숫자·영문만 생각하고 한 글자를 0.62em으로 잡으면 "제1열람실"처럼 한글이 섞인
 * 이름의 폭을 절반 가까이 작게 잡아서, 상자 폭이 모자라 "제1열…"로 잘린다.
 */
function charWidthEm(char: string): number {
  if (/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(char)) return 1;
  if (/[()[\]]/.test(char)) return 0.35;
  if (char === ' ') return 0.3;
  return 0.62;
}

/** 방 이름 한 줄의 폭(em). 글자 크기를 곱하면 pt가 된다. */
export function labelWidthEm(text: string): number {
  return [...text].reduce((sum, char) => sum + charWidthEm(char), 0);
}
