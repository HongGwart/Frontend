module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  extends: [
    '@react-native', // React Native 프로젝트에 적합한 기본 ESLint 규칙
    'plugin:@typescript-eslint/recommended', // TypeScript에 특화된 권장 규칙 추가
    'plugin:react/recommended', // React 관련 규칙 적용. 잘못된 JSX 작성이나 기타 문제를 방지
    'plugin:prettier/recommended', // Prettier 설정 추가
  ],
  plugins: ['@typescript-eslint', 'react', 'prettier'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true, // JSX 구문을 파싱할 수 있도록 허용.
    },
  },
  rules: {
    // Example rules
    '@typescript-eslint/no-unused-vars': 'warn', // 사용되지 않는 변수가 있을 때 경고
    'react/jsx-boolean-value': ['warn', 'always'], //  JSX에서 불리언 값의 기본값을 명시적으로 지정하도록 경고
    'react/self-closing-comp': 'warn', // 내용이 없는 태그는 셀프 클로징 태그로 작성하라는 경고 표시
    'react/jsx-key': 'warn', // 리스트 렌더링 시 key 속성이 없는 경우 경고 표시
    // 'no-console': 'warn', // console.log와 같은 콘솔 사용을 경고
    'prettier/prettier': 'warn', // Prettier 규칙을 따르지 않는 경우 경고
  },
  settings: {
    react: {
      version: 'detect', // 로젝트에서 사용 중인 React 버전을 자동으로 탐지
    },
  },
};
