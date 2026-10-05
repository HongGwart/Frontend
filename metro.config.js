const { getDefaultConfig } = require('expo/metro-config');
const { createDevSaveMiddleware } = require('./scripts/devSaveMiddleware');

const config = getDefaultConfig(__dirname);

const { transformer, resolver } = config;

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter(ext => ext !== 'svg'),
  sourceExts: [...resolver.sourceExts, 'svg'],
};

// 개발용 지도 모드가 찍은 좌표를 프로젝트 JSON에 바로 저장하는 엔드포인트(scripts/devSaveMiddleware.js).
// 개발 서버에만 붙고 앱 번들에는 안 들어간다.
// 주의: server.enhanceMiddleware는 Metro에서 @deprecated로 표시돼 있다(metro-config types.d.ts). Expo/Metro를
// 올린 뒤 이 옵션이 무시되면 저장 요청이 그냥 Metro 기본 처리로 넘어가고, 로그에
// "[DEV_SAVE] 개발 서버에 저장 엔드포인트가 없어요"(src/utils/devSave.ts) 경고가 뜬다 — 그때는 여기부터 확인한다.
const devSave = createDevSaveMiddleware(__dirname);
const enhanceMiddleware = config.server.enhanceMiddleware;
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    const base = enhanceMiddleware ? enhanceMiddleware(middleware, server) : middleware;
    return (req, res, next) => devSave(req, res, () => base(req, res, next));
  },
};

module.exports = config;