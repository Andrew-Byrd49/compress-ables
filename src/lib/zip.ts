import JSZip from 'jszip';

export async function generateZip(
    files: { name: string; blob: Blob }[]
): Promise<Blob> {
    const zip = new JSZip();

    files.forEach(({ name, blob }) => {
        zip.file(name, blob);
    });

    return zip.generateAsync({ type: 'blob' });
}
