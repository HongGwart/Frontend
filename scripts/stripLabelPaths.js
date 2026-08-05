#!/usr/bin/env node
/**
 *
 * 배경(*_bg.svg)에는 벽/방 박스와 함께 방 번호 라벨("103", "102-2" 같은 id="숫자(-숫자)?"
 * <path>)이 한 덩어리 벡터 그림으로 박혀있다. 지도가 회전 가능해지면서 라벨은 회전 안 시키고
 * RoomLabelsLayer가 room 데이터(중심 좌표)로 새로 그리게 됐는데, 배경에 원래 라벨이 남아있으면
 * 이중으로(하나는 돌고 하나는 안 돌고) 보인다. 이 스크립트는 그 baked 라벨만 제거한다.
 *
 * svgToRoomShapes.js의 extractLabelId와 같은 id 패턴(숫자 또는 숫자-숫자)을 사용하므로,
 * 방 JSON의 room.id와 여기서 제거되는 id가 서로 대응하는지 로그로 비교해서 확인할 수 있다.
 *
 * 사용법:
 *   node stripLabelPaths.js <입력_bg.svg> [출력.svg]
 * 출력을 생략하면 입력 파일을 그대로 덮어쓴다.
 */

const fs = require('fs');

function main() {
  const [, , inputPath, outputPathArg] = process.argv;
  if (!inputPath) {
    console.error('사용법: node stripLabelPaths.js <입력_bg.svg> [출력.svg]');
    process.exit(1);
  }

  const svgText = fs.readFileSync(inputPath, 'utf8');
  // svgToRoomShapes.js의 extractLabelId와 동일한 id 패턴. self-closing <path .../> 하나가
  // 라벨 전체(여러 글자의 획이 합쳐진 한 개 path)인 경우만 대상으로 한다.
  const labelPathRegex = /<path id="\d+(?:-\d+)?"[^>]*\/>\s*/g;

  const removedIds = [];
  const result = svgText.replace(labelPathRegex, (match) => {
    const idMatch = match.match(/id="([^"]*)"/);
    removedIds.push(idMatch ? idMatch[1] : '?');
    return '';
  });

  if (removedIds.length === 0) {
    console.warn('[경고] 제거할 라벨 path(id="103" 같은 숫자)를 하나도 못 찾았습니다. 이미 제거된 파일이거나 패턴이 안 맞을 수 있습니다.');
  } else {
    console.log(`✓ 라벨 ${removedIds.length}개 제거: ${removedIds.join(', ')}`);
  }

  const outputPath = outputPathArg || inputPath;
  fs.writeFileSync(outputPath, result);
  console.log(`→ ${outputPath}`);
}

main();
