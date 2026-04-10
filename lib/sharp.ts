// sharp is an optional dependency — import dynamically so the build
// doesn't fail if it's unavailable in a given environment.

async function getSharp() {
  try {
    const sharp = (await import('sharp')).default;
    return sharp;
  } catch {
    throw new Error('sharp is not available in this environment');
  }
}

/** PDF page → image. Uses pdf2pic-style approach via sharp + poppler.
 *  For PDF→image we rely on a different approach: Gotenberg renders to PNG
 *  and sharp handles image↔image conversions.
 */

export type ImageFormat = 'jpeg' | 'png' | 'webp';

/** Convert an image buffer from any format to the target format */
export async function convertImage(
  inputBuffer: Buffer,
  targetFormat: ImageFormat
): Promise<Buffer> {
  const sharp = await getSharp();
  return sharp(inputBuffer).toFormat(targetFormat).toBuffer();
}

/** Convert a PDF page to an image using sharp + pdf extraction.
 *  Requires that the PDF is first rasterised externally (e.g. via Gotenberg
 *  html-to-image route). This helper is for image-to-image post-processing.
 */
export async function pdfPageToImage(
  pngBuffer: Buffer,
  targetFormat: ImageFormat
): Promise<Buffer> {
  return convertImage(pngBuffer, targetFormat);
}

/** Resize an image to fit within maxWidth × maxHeight, preserving aspect ratio */
export async function resizeImage(
  buffer: Buffer,
  maxWidth: number,
  maxHeight: number,
  format: ImageFormat = 'png'
): Promise<Buffer> {
  const sharp = await getSharp();
  return sharp(buffer)
    .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
    .toFormat(format)
    .toBuffer();
}
