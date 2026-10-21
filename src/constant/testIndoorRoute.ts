import { LatLng } from '@utils/routePath';

/**
 * [개발용] 실내 길찾기 테스트 경로(R동 카페나무 → C동 816호)의 구간별 노드. 개발용 경로 노드 찍기 모드
 * (DevRouteNodePicker)로 지도에서 직접 탭해 모으고, Metro의 "[ROUTE_NODES]" 로그 JSON을
 * testRouteNodes.json에 붙여넣는다. 길찾기는 서버 경로만 쓰고, 이 데이터는 개발용 노드 찍기 도구에서만 쓴다.
 */
export const TEST_ROUTE_DEPARTURE_LABEL = 'R동 홍문관 카페나무';
export const TEST_ROUTE_DESTINATION_LABEL = 'C동 인문사회관 816호';

export interface TestRouteStage {
  key: string;
  /** 이 구간 노드를 찍을 때 지도에 깔아줄 평면도 층. 바깥 구간은 null */
  floorId: string | null;
  /** 찍기 패널/경로 카드에 쓰는 구간 이름 */
  title: string;
  from: string;
  to: string;
  /** 이 구간이 끝나고 다음 구간으로 넘어갈 때의 층 이동. 다음 구간이 같은 층 높이면 생략 */
  transition?: { type: 'stairs' | 'elevator'; from: string; to: string };
  /**
   * 긴 구간을 길 안내 카드 여러 장으로 나눌 노드 순서(0부터, 이 구간 노드 기준). 각 지점에서 꺾는 방향
   * (왼쪽/오른쪽)과 다음 지점까지 거리로 카드 문구를 만든다. 경로 보기의 구간 목록은 그대로 한 줄이다.
   */
  guidanceSplits?: number[];
}

export const TEST_ROUTE_STAGES: TestRouteStage[] = [
  {
    key: 'R_L',
    floorId: 'R_L',
    title: 'R동 로비층',
    from: '카페나무',
    to: '계단',
    transition: { type: 'stairs', from: 'R동 로비층', to: '1층' },
  },
  { key: 'R_1', floorId: 'R_1', title: 'R동 1층', from: '계단', to: 'R동 출입구' },
  // 바깥 구간(약 390m)은 안내 카드 한 장으로는 너무 길어서, 크게 꺾이는 지점 세 곳(노드 3·5·7)에서 나눈다.
  {
    key: 'outdoor',
    floorId: null,
    title: '바깥',
    from: 'R동 출입구',
    to: 'C동 출입구',
    guidanceSplits: [3, 5, 7],
  },
  {
    key: 'C_1',
    floorId: 'C_1',
    title: 'C동 1층',
    from: '출입구',
    to: '엘리베이터',
    transition: { type: 'elevator', from: 'C동 1층', to: '8층' },
  },
  { key: 'C_8', floorId: 'C_8', title: 'C동 8층', from: '엘리베이터', to: '816호' },
];

/** 구간 key → 그 구간에서 순서대로 찍은 노드 위경도 */
export type TestRouteNodes = Record<string, LatLng[]>;

export const TEST_ROUTE_NODES = require('./testRouteNodes.json') as TestRouteNodes;

// 개발용 노드 찍기 모드가 방금 찍은 노드. 파일 저장/HMR을 기다리지 않고 길찾기에서 바로 쓰려고 들고 있는다.
let runtimeNodes: TestRouteNodes = TEST_ROUTE_NODES;
export function setTestRouteNodes(nodes: TestRouteNodes) {
  runtimeNodes = nodes;
}

/** 노드가 2개 미만이라 아직 덜 찍은 구간 */
export function getIncompleteStages(nodes: TestRouteNodes = runtimeNodes) {
  return TEST_ROUTE_STAGES.filter(stage => (nodes[stage.key]?.length ?? 0) < 2);
}

