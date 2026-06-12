"use client";

export async function fileToDownscaledDataUrl(
  file: File,
  maxDim = 1280,
  quality = 0.78,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("الملف يجب أن يكون صورة / File must be an image");
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("تعذّر قراءة الملف / Could not read file"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("تعذّر تحميل الصورة / Could not load image"));
    image.src = dataUrl;
  });

  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    if (width >= height) {
      height = Math.round((height / width) * maxDim);
      width = maxDim;
    } else {
      width = Math.round((width / height) * maxDim);
      height = maxDim;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}
