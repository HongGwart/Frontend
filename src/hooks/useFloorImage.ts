//
// 건물 도면 SVG를 더 이상 앱 번들에 다 넣지 않고, 서버에서 필요할 때만
// 받아와서 기기 디스크에 캐싱한다. 90개 건물 × 여러 층을 다 번들에
// 넣으면 설치 용량이 "고대로"(113MB)처럼 커지므로, 사용자가 실제로
// 들어가는 건물만 다운로드되도록 한다.
//
// 캐시 키는 buildingId-floor 조합으로, 한 번 받은 파일은 앱을
// 재시작해도 디스크에 남아있어 다시 안 받는다.

import { useEffect, useState } from 'react';
import RNFS from 'react-native-fs';

const SVG_BASE_URL = ''; // TODO: 실제 S3/서버 주소로 교체 (예: https://cdn.honggwart.app/floors)
const CACHE_DIR = `${RNFS.CachesDirectoryPath}/floorImages`;

interface UseFloorImageResult {
  svgXml: string | null;
  isLoading: boolean;
  error: Error | null;
}

function cacheFilePath(buildingId: number, floor: number): string {
  return `${CACHE_DIR}/building${buildingId}-floor${floor}.svg`;
}

async function ensureCacheDirExists(): Promise<void> {
  const exists = await RNFS.exists(CACHE_DIR);
  if (!exists) {
    await RNFS.mkdir(CACHE_DIR);
  }
}

/**
 * 1. 디스크 캐시에 파일이 있으면 그걸 즉시 읽어서 반환한다 (네트워크 요청 없음).
 * 2. 없으면 서버에서 다운로드한 뒤 디스크에 저장하고, 그 내용을 반환한다.
 */
async function loadFloorSvg(
  buildingId: number,
  floor: number,
): Promise<string> {
  await ensureCacheDirExists();
  const filePath = cacheFilePath(buildingId, floor);

  const cached = await RNFS.exists(filePath);
  if (cached) {
    return RNFS.readFile(filePath, 'utf8');
  }

  const url = `${SVG_BASE_URL}/building${buildingId}-floor${floor}.svg`;
  const response = await RNFS.downloadFile({
    fromUrl: url,
    toFile: filePath,
  }).promise;

  if (response.statusCode !== 200) {
    throw new Error(
      `도면 다운로드 실패 (status ${response.statusCode}): ${url}`,
    );
  }

  return RNFS.readFile(filePath, 'utf8');
}

export function useFloorImage(
  buildingId: number,
  floor: number,
): UseFloorImageResult {
  const [svgXml, setSvgXml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    loadFloorSvg(buildingId, floor)
      .then(xml => {
        if (!cancelled) setSvgXml(xml);
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [buildingId, floor]);

  return { svgXml, isLoading, error };
}

/**
 * 캐시 전체 용량 확인 (설정 화면에 "지도 캐시 비우기" 메뉴 만들 때 사용 가능)
 */
export async function getFloorImageCacheSize(): Promise<number> {
  const exists = await RNFS.exists(CACHE_DIR);
  if (!exists) return 0;
  const files = await RNFS.readDir(CACHE_DIR);
  return files.reduce((sum, f) => sum + f.size, 0);
}

export async function clearFloorImageCache(): Promise<void> {
  const exists = await RNFS.exists(CACHE_DIR);
  if (exists) {
    await RNFS.unlink(CACHE_DIR);
  }
}
