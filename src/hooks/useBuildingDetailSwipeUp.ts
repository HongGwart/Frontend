import { useEffect } from 'react';
import { Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Extrapolation, interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { SWIPE_UP_DISTANCE } from '@components/common/DismissibleBottomSheet';
import { BUILDING_DETAIL_HEADER_HEIGHT } from '@components/common/BuildingDetailContent';

const WINDOW_HEIGHT = Dimensions.get('window').height;

/**
 * 시설 카드를 위로 슬라이드하면 건물 상세보기(BuildingDetailHeader/Body)가 실시간으로
 * 딸려 올라오는 애니메이션 묶음. MapScreen에서 처음 만든 걸 SearchScreen과 공유하려고
 * 뽑아냈다 — 화면마다 SelectedFacility 모양이 달라서 buildingCode를 뽑아내는 부분만
 * 각 화면에 남겨두고, 그 다음(공유 translateY + 헤더/본문/카드 페이드 스타일 + 카드
 * exit 거리 계산)은 여기서 전부 처리한다.
 *
 * @param buildingCode 지금 열려있는 카드가 가리키는 건물 코드. 없으면(카드가 없거나
 *   좌표를 특정할 수 없는 타입) 애니메이션은 계산만 해두고 아무 효과도 없다.
 * @param resetKey 새 카드가 열릴 때마다 바뀌는 값(보통 selectedFacility 그 자체) —
 *   이전 드래그의 잔여 translateY가 다음 카드에 남아있지 않게 이 값이 바뀔 때마다 초기화한다.
 */
export function useBuildingDetailSwipeUp(buildingCode: string | null, resetKey: unknown) {
  const insets = useSafeAreaInsets();
  const detailHeaderHeight = BUILDING_DETAIL_HEADER_HEIGHT + insets.top;

  const swipeCardTranslateY = useSharedValue(0);
  useEffect(() => {
    swipeCardTranslateY.value = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  // 헤더는 커밋 지점(-SWIPE_UP_DISTANCE)까지 짧은 구간에서 빠르게 페이드+슬라이드로
  // 나타난다 — 헤더답게 훅 나타나는 편이 자연스럽다.
  const detailHeaderStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      swipeCardTranslateY.value,
      [0, -SWIPE_UP_DISTANCE],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      opacity: progress,
      transform: [{ translateY: (1 - progress) * -12 }],
    };
  });

  // 본문은 카드 이동 거리를 그대로 따라간다 — 시설 카드의 bottom(항상 0, 화면 진짜
  // 바닥)이 곧 본문의 top이 되도록, 헤더 아래에서 멈춘다.
  const detailBodyStyle = useAnimatedStyle(() => {
    const topY = WINDOW_HEIGHT + swipeCardTranslateY.value;
    const clampedTopY = Math.min(WINDOW_HEIGHT, Math.max(detailHeaderHeight, topY));
    return {
      transform: [{ translateY: clampedTopY }],
    };
  });

  // 카드와 상세 콘텐츠가 사진/설명/CTA 등 거의 같은 내용을 담고 있어서, 헤더/본문이
  // 나타나는 것과 같은 구간에서 카드를 반대로 페이드아웃시켜 두 겹으로 안 겹치게 한다.
  const cardFadeStyle = useAnimatedStyle(() => {
    if (!buildingCode) return { opacity: 1 };
    const progress = interpolate(
      swipeCardTranslateY.value,
      [0, -SWIPE_UP_DISTANCE],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity: 1 - progress };
  });

  // 상세 본문 미리보기가 완전히 자리잡으려면 화면 바닥에서 헤더 높이까지는 밀어올려야
  // 한다 — 카드 자체의 exit 애니메이션이 이보다 먼저 끝나면, 실제 화면 전환이 일어날
  // 때 미리보기가 아직 덜 올라온 채로 화면이 툭 끊겨 바뀌어 보인다.
  const minSwipeUpDistance = WINDOW_HEIGHT - detailHeaderHeight;

  return { swipeCardTranslateY, detailHeaderStyle, detailBodyStyle, cardFadeStyle, minSwipeUpDistance };
}
