const MAX_BYTES = 5 * 1024 * 1024;
const MAX_EDGE = 2560;
const WEBP_MIME = "image/webp";

function webpFileName(originalName: string): string {
  const base = originalName.replace(/\.[^.]+$/, "") || "image";
  return `${base}.webp`;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 읽을 수 없습니다"));
    };
    img.src = url;
  });
}

function canvasToWebpBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("WebP 변환 실패"))),
      WEBP_MIME,
      quality,
    );
  });
}

async function renderWebp(
  file: File,
  maxEdge: number,
  quality: number,
): Promise<Blob> {
  const img = await loadImage(file);
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  w = Math.max(1, Math.round(w * scale));
  h = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas를 사용할 수 없습니다");
  ctx.drawImage(img, 0, 0, w, h);
  return canvasToWebpBlob(canvas, quality);
}

async function convertToWebpUnderLimit(file: File): Promise<File> {
  const edges = [MAX_EDGE, 2048, 1600, 1280];
  const qualities = [0.85, 0.75, 0.65, 0.55];

  for (const edge of edges) {
    for (const quality of qualities) {
      const blob = await renderWebp(file, edge, quality);
      if (blob.size <= MAX_BYTES) {
        return new File([blob], webpFileName(file.name), { type: WEBP_MIME });
      }
    }
  }

  throw new Error("5MB 이하로 줄일 수 없습니다");
}

/** 갤러리 업로드용: 필요 시 WebP로 변환·압축 (서버 5MB 제한 대응) */
export async function prepareGalleryUploadFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 업로드할 수 있습니다");
  }

  if (file.type === "image/gif") {
    if (file.size > MAX_BYTES) {
      throw new Error("GIF는 5MB 이하만 업로드할 수 있습니다");
    }
    return file;
  }

  if (file.type === "image/webp" && file.size <= MAX_BYTES) {
    return file;
  }

  const needsConvert =
    file.type === "image/jpeg" ||
    file.type === "image/png" ||
    file.size > MAX_BYTES;

  if (!needsConvert) return file;

  return convertToWebpUnderLimit(file);
}
