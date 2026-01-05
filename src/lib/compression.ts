import Compressor from 'compressorjs';

export interface CompressionOptions {
    quality: number; // 0 to 1
    maxWidth?: number;
    maxHeight?: number;
    format: 'webp' | 'avif';
}

export type CompressionResult = {
    blob: Blob;
    width: number;
    height: number;
    originalSize: number;
    compressedSize: number;
    savings: number;
};

export async function checkAvifSupport(): Promise<boolean> {
    if (typeof document === 'undefined') return false;

    // We primarily care about ENCODING support since this is a compression tool.
    // Most modern browsers support decoding, but few support encoding via canvas yet.

    // Check 1: canvas.toDataURL (Standard encoding check)
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const dataUrl = canvas.toDataURL('image/avif');
        if (dataUrl.startsWith('data:image/avif')) return true;
    } catch (e) {
        // Fall through
    }

    // Check 2: canvas.toBlob (Alternative encoding check)
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return await new Promise((resolve) => {
            try {
                canvas.toBlob((blob) => {
                    resolve(blob?.type === 'image/avif');
                }, 'image/avif');
            } catch (e) {
                resolve(false);
            }
        });
    } catch (e) {
        return false;
    }
}

export function compressImage(
    file: File,
    options: CompressionOptions
): Promise<CompressionResult> {
    return new Promise((resolve, reject) => {
        const mimeType = options.format === 'avif' ? 'image/avif' : 'image/webp';

        new Compressor(file, {
            quality: options.quality,
            maxWidth: options.maxWidth,
            maxHeight: options.maxHeight,
            mimeType: mimeType,
            convertSize: Infinity, // Ensure it always converts even if larger (for format change)
            success(result) {
                // success returns a Blob
                const blob = result as Blob;

                // Safety check: specific format requested but got PNG fallback?
                if (options.format === 'avif' && blob.type !== 'image/avif') {
                    // Browser silently fell back to PNG/JPEG because AVIF is not supported
                    reject(new Error('Browser does not support AVIF encoding.'));
                    return;
                }
                if (options.format === 'webp' && blob.type !== 'image/webp') {
                    reject(new Error('Browser does not support WebP encoding.'));
                    return;
                }

                // We need dimensions. Compressorjs doesn't give them directly in result.
                // We can get them by creating an Image bitmap.
                createImageBitmap(blob).then((bmp) => {
                    resolve({
                        blob,
                        width: bmp.width,
                        height: bmp.height,
                        originalSize: file.size,
                        compressedSize: blob.size,
                        savings: Math.max(0, 1 - (blob.size / file.size)),
                    });
                    bmp.close();
                }).catch(() => {
                    // Fallback if createImageBitmap fails
                    resolve({
                        blob,
                        width: 0,
                        height: 0,
                        originalSize: file.size,
                        compressedSize: blob.size,
                        savings: Math.max(0, 1 - (blob.size / file.size)),
                    });
                });
            },
            error(err) {
                reject(err);
            },
        });
    });
}
