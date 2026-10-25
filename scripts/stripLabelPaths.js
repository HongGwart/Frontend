#!/usr/bin/env node
/**
 *
 * 배경(*_bg.svg)에는 벽/방 박스와 함께 방 번호 라벨("103", "102-2" 같은 id="숫자(-숫자)?"
 * <path>)이 한 덩어리 벡터 그림으로 박혀있다. 지도가 회전 가능해지면서 라벨은 회전 안 시키고
 * RoomLabelsLayer가 room 데이터(중심 좌표)로 새로 그리게 됐는데, 배경에 원래 라벨이 남아있으면
 * 이중으로(하나는 돌고 하나는 안 돌고) 보인다. 이 스크립트는 그 baked 라벨만 제거한다.
 *
 * 예전 svgToRoomShapes.js(Visual 방식)의 라벨 인식과 같은 id 패턴(숫자 또는 숫자-숫자)을 사용하므로,
 * 방 JSON의 room.id와 여기서 제거되는 id가 서로 대응하는지 로그로 비교해서 확인할 수 있다.
 *
 * "계단 세미나실", "Hall"처럼 글자로 된 방 이름 라벨은 숫자 패턴에 안 걸린다. --rooms=<층 JSON>을 주면
 * id가 그 층 방 이름과 같은 path도 지운다(renderFloorOverlay.js가 PNG에서 빼는 것과 같은 기준). 안 지우면
 * 내부 지도에서 배경 글자와 RoomLabelsLayer 글자가 겹쳐 보인다.
 *
 * 사용법:
 *   node stripLabelPaths.js <입력_bg.svg> [출력.svg] [--rooms=<층.json>]
 * 출력을 생략하면 입력 파일을 그대로 덮어쓴다.
 */

const fs = require('fs');

// Figma가 한글 id를 UTF-8 바이트 단위 문자 참조(&#234;&#179;...)로 내보내서 풀어서 비교한다.
// 같은 이름이 겹치면 붙는 "_2" 같은 꼬리는 뗀다.
const decodeSvgId = (id) =>
  Buffer.from(id.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code))), 'latin1')
    .toString('utf8')
    .replace(/_\d+$/, '');

function main() {
  const args = process.argv.slice(2);
  const roomsArg = args.find((arg) => arg.startsWith('--rooms='));
  const [inputPath, outputPathArg] = args.filter((arg) => !arg.startsWith('--'));
  if (!inputPath) {
    console.error('사용법: node stripLabelPaths.js <입력_bg.svg> [출력.svg] [--rooms=<층.json>]');
    process.exit(1);
  }
  const roomNames = new Set(
    roomsArg
      ? JSON.parse(fs.readFileSync(roomsArg.slice('--rooms='.length), 'utf8')).rooms.map((room) => room.label ?? room.id)
      : [],
  );

  const svgText = fs.readFileSync(inputPath, 'utf8');
  // 예전 svgToRoomShapes.js(Visual 방식)의 라벨 인식과 동일한 id 패턴. self-closing <path .../> 하나가
  // 라벨 전체(여러 글자의 획이 합쳐진 한 개 path)인 경우만 대상으로 한다.
  // 예전 svgToRoomShapes.js(Visual 방식)의 라벨 인식과 동일하게, G동 "B110"처럼 앞에 알파벳 한 글자가
  // 붙는 번호 체계도 허용한다.
  // Figma에서 같은 라벨 이름이 겹치면 "106_2"처럼 뒤에 "_숫자"가 자동으로 붙는데,
  // 이것도 결국 같은 종류의 baked 숫자 라벨이므로 같이 제거 대상에 포함한다.
  const labelPathRegex = /<path id="[A-Za-z]?\d+(?:-\d+)?(?:_\d+)?"[^>]*\/>\s*/g;

  const removedIds = [];
  const result = svgText
    .replace(labelPathRegex, (match) => {
      const idMatch = match.match(/id="([^"]*)"/);
      removedIds.push(idMatch ? idMatch[1] : '?');
      return '';
    })
    .replace(/<path id="([^"]*)"[^>]*\/>\s*/g, (match, id) => {
      if (!roomNames.has(decodeSvgId(id))) return match;
      removedIds.push(decodeSvgId(id));
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
