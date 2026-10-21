/**
 * [개발용] Metro 개발 서버에 붙이는 저장 엔드포인트. 앱의 개발용 지도 모드(건물 덮개 찍기)가 찍은 값을
 * POST /__dev/save 로 보내면 프로젝트 JSON 파일에 바로 써서, 로그를 복사해 붙여넣지 않아도 코드에 남는다
 * (앱을 껐다 켜도 유지). 저장 대상은 아래 TARGETS에 적힌 파일로만 제한한다.
 *
 * 요청 본문: { target: 'buildingMasks', data: object }
 */

const fs = require('fs');
const path = require('path');

const TARGETS = {
  buildingMasks: 'src/constant/buildingMasks.json',
};

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function createDevSaveMiddleware(projectRoot) {
  return (req, res, next) => {
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

      send(res, 200, { ok: true, file: relPath });
    });
  };
}

module.exports = { createDevSaveMiddleware };
