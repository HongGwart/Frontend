#!/usr/bin/env node
/**
 *
 * 층 하나를 통째로 처리하는 오케스트레이터. 아래 4개를 순서대로 돌려서, 원본 SVG 한 장으로
 * IndoorMapView에 바로 꽂을 수 있는 산출물(_bg.svg / _doors.svg / _icons.svg / .json)을
 * 한 번에 만든다.
 *
 *   1. splitVisualLayers.js  - 배경/문/아이콘 SVG 3개로 분리
 *   2. stripLabelPaths.js    - 배경 SVG에서 박혀있는 방 번호 라벨 제거 (RoomLabelsLayer가 대신 그림)
 *   3. svgToRoomShapes.js    - 방 좌표 JSON 생성
 *   4. svgToIcons.js         - 같은 JSON에 아이콘 좌표 병합
 *
 * 사용법:
 *   node scripts/processFloor.js <입력.svg> [출력 디렉토리]
 * 출력 디렉토리를 생략하면 입력 파일과 같은 폴더에 만든다.
 *
 * 원본 SVG가 지켜야 하는 네이밍 규칙 (각 스크립트 상단 주석에 더 자세히):
 *   - 배경/방/문/아이콘을 전부 담는 최상위 그룹: id="Visual"
 *   - 방 hitbox: id="room_방이름" (또는 room, room_2... 자동 넘버링 + 안에 숫자 라벨)
 *   - 방 번호 라벨: id="103", id="102-1" 같은 숫자(-숫자) <path>
 *   - 문: id="door", "door_2", "door_3"...
 *   - 계단/엘리베이터: id="map_elevator", "map_stairs", "map_stairs_2"...
 *
 * 실행 로그에 [경고]가 뜨면 원본 SVG의 레이어 이름이 규칙과 안 맞는 부분이 있다는 뜻이니
 * Figma에서 레이어명을 고치고 다시 export하는 게 제일 확실하다.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SCRIPTS_DIR = __dirname;

function run(scriptName, args) {
  console.log(`\n▶ ${scriptName} ${args.map((a) => `"${a}"`).join(' ')}`);
  execFileSync('node', [path.join(SCRIPTS_DIR, scriptName), ...args], { stdio: 'inherit' });
}

function main() {
  const [, , inputPath, outDirArg] = process.argv;
  if (!inputPath) {
    console.error('사용법: node scripts/processFloor.js <입력.svg> [출력 디렉토리]');
    process.exit(1);
  }
  if (!fs.existsSync(inputPath)) {
    console.error(`[에러] 입력 파일을 찾을 수 없습니다: ${inputPath}`);
    process.exit(1);
  }

  const base = path.basename(inputPath, path.extname(inputPath));
  const inputDir = path.dirname(inputPath);
  const outDir = outDirArg || inputDir;
  fs.mkdirSync(outDir, { recursive: true });

  // splitVisualLayers.js는 항상 입력 파일과 같은 폴더에 <base>_bg.svg 등으로 만든다.
  // outDir이 입력 폴더와 다르면 만든 뒤에 옮긴다.
  run('splitVisualLayers.js', [inputPath]);

  const moved = {};
  for (const key of ['bg', 'doors', 'icons']) {
    const producedPath = path.join(inputDir, `${base}_${key}.svg`);
    const finalPath = path.join(outDir, `${base}_${key}.svg`);
    if (producedPath !== finalPath) {
      fs.renameSync(producedPath, finalPath);
    }
    moved[key] = finalPath;
  }

  const jsonPath = path.join(outDir, `${base}.json`);

  run('stripLabelPaths.js', [moved.bg]);
  // 방 좌표는 원본(문/아이콘까지 다 있는) SVG에서 뽑아야 방 순서·이름 인식이 안정적이다.
  run('svgToRoomShapes.js', [inputPath, jsonPath]);
  run('svgToIcons.js', [moved.icons, jsonPath]);

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`\n✓ "${base}" 층 처리 완료`);
  console.log(`  배경: ${moved.bg}`);
  console.log(`  문:   ${moved.doors}`);
  console.log(`  아이콘: ${moved.icons}`);
  console.log(`  데이터: ${jsonPath} (방 ${data.rooms.length}개, 아이콘 ${(data.icons ?? []).length}개)`);
  console.log(
    `\n위 로그에 [경고]가 하나도 없었는지, rooms/icons 개수가 실제 도면 개수와 맞는지 확인하세요.`
  );
}

main();
