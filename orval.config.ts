import { defineConfig, type InputTransformerFn } from 'orval';

/**
 * 백엔드 Swagger(OpenAPI)에서 요청 함수·타입·TanStack Query 훅·zod 스키마를 생성한다.
 *   npm run api:gen
 * 생성물(src/api/generated)은 손으로 고치지 않는다 — 서버 스펙이 바뀌면 다시 생성한다.
 * 관리자 API(/api/admin/**)는 앱에서 안 쓰므로 태그로 걸러 앱용 API만 만든다. 같은 태그에 관리자 API가 섞여 있는 경우
 * (예: "평면도 기준 꼭짓점"의 저장 API)도 있어서, 아래 transformer로 관리자 경로를 한 번 더 뺀다.
 */
const SPEC_URL = process.env.OPENAPI_SPEC ?? 'https://dev-api.honggwart.com/v3/api-docs';
const APP_TAGS = ['검색', '길찾기', '평면도 기준 꼭짓점', '장소', '장소 소개'];

// 서버 operationId가 "get"처럼 뜻이 안 드러나는 경우 생성 함수/훅 이름을 여기서 정한다(경로 → 이름).
const OPERATION_NAMES: Record<string, string> = {
  '/api/layers/{layerId}/floor-plan-corners': 'floorPlanCorners',
  '/api/places/{placeId}': 'placeDetail',
  '/api/places': 'placeBatch',
  '/api/nodes/{nodeId}/place-info': 'nodePlaceInfo',
  '/api/place-infos': 'placeInfos',
  '/api/buildings/{buildingCode}': 'building',
};

const keepAppApis: InputTransformerFn = spec => {
  // Springdoc의 nullable $ref가 anyOf: [{type: 'null', $ref}, {}]로 나오는 경우
  // Orval은 unknown을 만든다. 서버 DTO의 nullable 참조를 명시적인 union으로 정규화한다.
  const normalize = (value: any): any => {
    if (Array.isArray(value)) return value.map(normalize);
    if (!value || typeof value !== 'object') return value;
    if (value.anyOf?.length === 2 && value.anyOf.some((item: any) => Object.keys(item).length === 0)) {
      const typed = value.anyOf.find((item: any) => Object.keys(item).length > 0);
      if (typed?.$ref && typed.type === 'null') return { anyOf: [{ $ref: typed.$ref }, { type: 'null' }] };
      if (Array.isArray(typed?.type) && typed.type.includes('null')) {
        return { ...typed, ...(typed.enum ? { enum: [...typed.enum, null] } : {}) };
      }
    }
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalize(item)]));
  };
  const normalized = normalize(spec);
  // 서로 다른 Java 중첩 record가 FacilitySummary라는 이름을 공유한다.
  // 노드 상세는 category/onCampus만 반환하므로 소개 API의 필수 필드를 요구하면 안 된다.
  const schemas = normalized.components?.schemas;
  if (schemas?.NodeDetailResponse?.properties?.facility) {
    schemas.NodeFacilitySummary = {
      type: 'object', required: ['category', 'onCampus'],
      properties: { category: { type: 'string' }, onCampus: { type: 'boolean' } },
    };
    schemas.NodeDetailResponse.properties.facility = { $ref: '#/components/schemas/NodeFacilitySummary' };
  }
  // 기존 DTO의 null 반환이 Swagger 타입에 빠져 있다. Backend의 응답 DTO/핸드오프 계약에
  // 명시된 필드만 보완한다. 실제 null을 0/빈 문자열로 바꾸지 않는다.
  const nullableFields: Record<string, string[]> = {
    NodeSuggestionResponse: ['category', 'placeId', 'placeKind', 'entranceCount'],
    NodeDetailResponse: ['floor', 'roomNumber', 'parent', 'facility', 'placeId'],
    EndpointDto: ['entranceName'],
    ContextDto: ['buildingNodeId', 'buildingName', 'floor'],
    PolylinePointDto: ['floor'],
    StepDto: ['bearing', 'road', 'landmark'],
    FloorChangeMetaDto: ['fromFloor', 'toFloor'],
    PlaceInfoResponse: ['placeId'],
    BuildingInfoResponse: ['placeId'],
    Detail: ['buildingPlaceId', 'floor', 'floorOrder', 'roomNumber', 'legacyNodeId', 'placeInfo', 'facility'],
    PlaceMember: ['floor', 'layerId'],
    FacilityContent: ['introduction', 'operatingHoursText', 'legacyFacilityId'],
    Response: ['imageId'],
    EntranceSummary: ['role', 'lat', 'lng', 'floor', 'floorOrder'],
  };
  for (const [name, fields] of Object.entries(nullableFields)) {
    const properties = normalized.components?.schemas?.[name]?.properties;
    for (const field of fields) {
      const schema = properties?.[field];
      if (!schema || (Array.isArray(schema.type) && schema.type.includes('null'))) continue;
      properties[field] = schema.$ref
        ? { anyOf: [{ ...schema }, { type: 'null' }] }
        : { ...schema, type: [schema.type, 'null'] };
    }
  }
  const paths = Object.fromEntries(
    Object.entries(spec.paths ?? {})
      .filter(([path]) => !path.startsWith('/api/admin/'))
      .map(([path, item]) => {
        const name = OPERATION_NAMES[path];
        if (!name || !item?.get) return [path, item];
        return [path, { ...item, get: { ...item.get, operationId: name } }];
      }),
  );
  return { ...normalized, paths };
};
const input = {
  target: SPEC_URL,
  filters: { mode: 'include' as const, tags: APP_TAGS },
  override: { transformer: keepAppApis },
};

export default defineConfig({
  honggwart: {
    input,
    output: {
      mode: 'split',
      // 서버에서 빠진 스키마 파일이 남지 않게 매번 비우고 다시 만든다.
      clean: true,
      target: 'src/api/generated/honggwart.ts',
      schemas: 'src/api/generated/model',
      client: 'react-query',
      httpClient: 'axios',
      override: {
        // 모든 요청이 공통 axios 인스턴스(baseURL·에러 정규화)를 거치게 한다.
        mutator: { path: 'src/api/client.ts', name: 'apiRequest' },
        query: { useQuery: true, signal: true },
      },
    },
  },
  honggwartZod: {
    input,
    output: {
      mode: 'single',
      target: 'src/api/generated/honggwart.zod.ts',
      client: 'zod',
    },
  },
});
