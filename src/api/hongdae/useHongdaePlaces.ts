import { HONGDAE_PLACES, HONGDAE_PLACES_AS_OF } from '@constant/hongdaePlaces';

/**
 * 주변상권 장소 목록. 지금은 앱에 넣어 둔 확인된 정보(constant/hongdaePlaces)를 돌려준다.
 * 서버 API가 생기면 여기서만 생성 쿼리 훅으로 바꾸고, 응답 전·실패 시에는 이 값을 그대로 보여준다 — 화면은 그대로 둔다.
 */
export function useHongdaePlaces() {
  return { places: HONGDAE_PLACES, asOf: HONGDAE_PLACES_AS_OF };
}
