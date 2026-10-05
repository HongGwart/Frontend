/** .env의 EXPO_PUBLIC_USE_MOCK=true면 서버를 부르지 않고 앱 안 더미 데이터만 쓴다(서버 장애·시연 대비). */
export const USE_MOCK_API = process.env.EXPO_PUBLIC_USE_MOCK === 'true';
