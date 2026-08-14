import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from './Header';
import NavigationBar, { NavigationTab } from './NavigationBar';

/**
 * 탭(경로)별 상단 헤더 노출 여부와 타이틀. 여기 없는 탭은 헤더 없이 화면을 그대로 그린다.
 * 화면이 자체적으로 상단 UI(검색바 등)를 갖고 있는 경우(map)는 헤더를 쓰지 않는다.
 */
const HEADER_TITLE_BY_TAB: Partial<Record<NavigationTab, string>> = {
  facility: '편의시설',
};

interface AppLayoutProps {
  activeTab: NavigationTab;
  onTabPress: (tab: NavigationTab) => void;
  onHeaderBackPress?: () => void;
  children: React.ReactNode;
}

/**
 * 앱의 전체적인 뼈대(상단 헤더 + 화면 콘텐츠 + 하단 내비게이션 바)를 담당하는 레이아웃.
 * 화면(screen) 컴포넌트는 헤더 유무를 신경 쓸 필요 없이 children으로 꽂히기만 하면 되고,
 * 탭별 헤더 노출 여부는 이 파일의 HEADER_TITLE_BY_TAB 설정 한 곳에서만 관리한다.
 */
export default function AppLayout({
  activeTab,
  onTabPress,
  onHeaderBackPress,
  children,
}: AppLayoutProps) {
  const insets = useSafeAreaInsets();
  const headerTitle = HEADER_TITLE_BY_TAB[activeTab];

  return (
    <View style={styles.container}>
      <View style={styles.screen}>
        {headerTitle && (
          <View style={{ paddingTop: insets.top }}>
            <Header title={headerTitle} onBackPress={onHeaderBackPress} />
          </View>
        )}
        {children}
      </View>
      <NavigationBar activeTab={activeTab} onTabPress={onTabPress} bottomInset={insets.bottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screen: { flex: 1 },
});
