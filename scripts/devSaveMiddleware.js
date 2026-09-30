/**
 * [개발용] Metro 개발 서버에 붙이는 저장 엔드포인트. 앱의 개발용 지도 모드(🏢 평면도 앉히기, 🧭 경로 노드
 * 찍기)가 찍은 값을 POST /__dev/save 로 보내면 프로젝트 JSON 파일에 바로 써서, 로그를 복사해 붙여넣지
 * 않아도 동 마커 좌표처럼 코드에 남는다(앱을 껐다 켜도 유지). 평면도 기준점이면 renderFloorOverlay.js도
 * 이어서 돌려 PNG까지 새로 굽는다. 저장 대상은 아래 TARGETS에 적힌 파일로만 제한한다.
 *
 * 요청 본문: { target: 'floorGeoAnchors' | 'testRouteNodes', data: object, render?: string[] }
 * 구운 층은 응답의 overlays에 region과 PNG 주소(GET /__dev/floor-overlay/{층}.png)를 담아 돌려준다 — 앱이
 * 새로고침(HMR)을 기다리지 않고 그 주소로 바로 평면도를 띄울 수 있게.
 */

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const OVERLAY_DIR = 'src/assets/floorOverlays';
const OVERLAY_INDEX = 'src/constant/floorOverlayImages.ts';

const TARGETS = {
  floorGeoAnchors: 'src/constant/floorGeoAnchors.json',
  testRouteNodes: 'src/constant/testRouteNodes.json',
};

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

/** renderFloorOverlay.js가 floorOverlayImages.ts에 남기는 DATA 블록(층별 region/anchors)을 읽는다. */
function readOverlayIndex(projectRoot) {
  const text = fs.readFileSync(path.join(projectRoot, OVERLAY_INDEX), 'utf8');
  const m = text.match(/\/\* DATA ([\s\S]*?) DATA \*\//);
  return m ? JSON.parse(m[1]) : {};
}

function createDevSaveMiddleware(projectRoot) {
  return (req, res, next) => {
    // 구워둔 평면도 PNG를 그대로 내려준다 (앱이 httpUri로 바로 띄우는 용도)
    const pngMatch = req.method === 'GET' && req.url && req.url.match(/^\/__dev\/floor-overlay\/([A-Z0-9_]+)\.png/);
    if (pngMatch) {
      const file = path.join(projectRoot, OVERLAY_DIR, `${pngMatch[1]}.png`);
      if (!fs.existsSync(file)) return send(res, 404, { ok: false, error: 'PNG 없음' });
      res.statusCode = 200;
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'no-store');
      return res.end(fs.readFileSync(file));
    }

    if (req.method !== 'POST' || !req.url || !req.url.startsWith('/__dev/save')) return next();

    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
    });
    req.on('end', () => {
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        return send(res, 400, { ok: false, error: 'JSON 본문이 아닙니다' });
      }
      const relPath = TARGETS[body.target];
      if (!relPath || typeof body.data !== 'object' || body.data === null) {
        return send(res, 400, { ok: false, error: `저장할 수 없는 대상: ${body.target}` });
      }

      fs.writeFileSync(path.join(projectRoot, relPath), `${JSON.stringify(body.data, null, 2)}\n`);
      console.log(`[dev-save] ${relPath} 저장`);

      const render = Array.isArray(body.render)
        ? body.render.filter(id => typeof id === 'string' && /^[A-Z0-9_]+$/.test(id) && body.data[id])
        : [];
      if (body.target !== 'floorGeoAnchors' || render.length === 0) {
        return send(res, 200, { ok: true, file: relPath });
      }

      execFile(
        process.execPath,
        [path.join(projectRoot, 'scripts/renderFloorOverlay.js'), ...render],
        { cwd: projectRoot },
        (error, stdout, stderr) => {
          const log = `${stdout}${stderr}`.trim();
          console.log(`[dev-save] renderFloorOverlay ${render.join(' ')}\n${log}`);
          if (error) return send(res, 500, { ok: false, file: relPath, rendered: render, log });
          const index = readOverlayIndex(projectRoot);
          const overlays = {};
          for (const id of render) {
            if (!index[id]) continue;
            overlays[id] = { ...index[id], path: `__dev/floor-overlay/${id}.png?v=${Date.now()}` };
          }
          send(res, 200, { ok: true, file: relPath, rendered: render, overlays, log });
        },
      );
    });
  };
}

module.exports = { createDevSaveMiddleware };
