import { useEffect, useState } from 'react';
import { Dropzone } from './components/Dropzone';
import { SettingsPanel } from './components/SettingsPanel';
import { ImageList, type ProcessedFile } from './components/ImageList';
import { compressImage, checkAvifSupport, type CompressionOptions } from './lib/compression';
import { generateZip } from './lib/zip';
import { Download, Loader2 } from 'lucide-react';

// using simple random id for now to avoid extra dep if possible, but uuid is better. 
// I'll use crypto.randomUUID() if available or Math.random

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 9);
}

function App() {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [quality, setQuality] = useState(1.0);
  const [format, setFormat] = useState<'webp' | 'avif'>('avif');
  const [maxWidth, setMaxWidth] = useState<number | undefined>(undefined);
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  const [avifSupported, setAvifSupported] = useState(false);

  useEffect(() => {
    checkAvifSupport().then((isSupported) => {
      setAvifSupported(isSupported);
      // If not supported, fallback to webp
      if (!isSupported) {
        setFormat('webp');
      } else {
        // If supported and we want it default, ensure it is set (though it is state default)
        setFormat('avif');
      }
    });
  }, []);

  const handleFilesDropped = (newFiles: File[]) => {
    const processedFiles: ProcessedFile[] = newFiles.map(file => ({
      id: generateId(),
      originalFile: file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending'
    }));
    setFiles(prev => [...prev, ...processedFiles]);
  };

  const handleRemove = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) URL.revokeObjectURL(file.previewUrl);
      return prev.filter(f => f.id !== id);
    });
  };

  const handleConvert = async () => {
    setIsProcessing(true);

    // Process sequentially to be safe, or parallel. Browser concurrency handles parallel mostly fine 
    // but too many canvas ops can lag. 
    // Let's do batches of 3-5 or just all at once and let loop handle it?
    // For 20-30 images, we should probably do a limited concurrency queue, but `compressorjs` 
    // is async. Let's try simple map first.

    const options: CompressionOptions = {
      quality: quality * 0.9, // Visual 100% (1.0) maps to Actual 90% (0.9)
      format,
      maxWidth,
      maxHeight
    };

    const newFiles = [...files];
    const pendingIndices = newFiles.reduce<number[]>((acc, file, index) => {
      if (file.status === 'pending' || file.status === 'error') acc.push(index);
      return acc;
    }, []);

    for (const index of pendingIndices) {
      newFiles[index] = { ...newFiles[index], status: 'processing' };
      setFiles([...newFiles]);

      try {
        const result = await compressImage(newFiles[index].originalFile, options);
        newFiles[index] = {
          ...newFiles[index],
          status: 'done',
          result
        };
      } catch (error) {
        console.error(error);
        newFiles[index] = {
          ...newFiles[index],
          status: 'error',
          error: (error as Error).message
        };
      }
      setFiles([...newFiles]);
      // Small delay to allow UI to update
      await new Promise(r => setTimeout(r, 20));
    }

    setIsProcessing(false);
  };

  const handleDownload = (file: ProcessedFile) => {
    if (!file.result) return;
    const url = URL.createObjectURL(file.result.blob);
    const link = document.createElement('a');
    link.href = url;
    const nameParts = file.originalFile.name.split('.');
    nameParts.pop();
    link.download = `${nameParts.join('.')}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = async () => {
    const completedFiles = files.filter(f => f.status === 'done' && f.result);
    if (completedFiles.length === 0) return;

    const zipFiles = completedFiles.map(f => {
      const nameParts = f.originalFile.name.split('.');
      nameParts.pop();
      return {
        name: `${nameParts.join('.')}.${format}`,
        blob: f.result!.blob
      };
    });

    const zipBlob = await generateZip(zipFiles);
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12); // YYYYMMDDHHMM
    link.download = `imagereduct_${timestamp}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Stats
  const completedCount = files.filter(f => f.status === 'done').length;
  const totalOriginalSize = files.filter(f => f.status === 'done').reduce((acc, f) => acc + (f.result?.originalSize || 0), 0);
  const totalCompressedSize = files.filter(f => f.status === 'done').reduce((acc, f) => acc + (f.result?.compressedSize || 0), 0);
  const totalSavings = totalOriginalSize > 0 ? (1 - totalCompressedSize / totalOriginalSize) : 0;

  return (
    <div className="min-h-screen bg-white flex flex-col selection:bg-slate-200 text-slate-900">
      {/* Minimal Header Line */}
      <div className="h-[7px] bg-[#0086CF] sticky top-0 z-50 w-full" />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">

        {/* Left Column: Settings */}
        <div className="lg:col-span-1 order-2 lg:order-1 space-y-8">
          <SettingsPanel
            quality={quality}
            setQuality={setQuality}
            format={format}
            setFormat={setFormat}
            avifSupported={avifSupported}
            maxWidth={maxWidth}
            setMaxWidth={setMaxWidth}
            maxHeight={maxHeight}
            setMaxHeight={setMaxHeight}
            disabled={isProcessing}
          />

          <div className="bg-slate-100 border-2 border-slate-900 p-6 text-base text-slate-700">
            <h4 className="font-bold mb-3 text-slate-900 text-lg">
              Why Client-side?
            </h4>
            <p className="leading-relaxed">
              Your images never leave your device. All compression happens locally in your browser.
            </p>
          </div>
        </div>

        {/* Right Column: Upload & Results */}
        <div className="lg:col-span-2 space-y-8 order-1 lg:order-2">

          <Dropzone onFilesDropped={handleFilesDropped} disabled={isProcessing} />

          {files.length > 0 && (
            <div className="bg-white shadow-xl border-2 border-slate-900 overflow-hidden">
              <div className="p-5 border-b-2 border-slate-900 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-5">
                  <h3 className="font-semibold text-slate-900 text-lg">Images ({files.length})</h3>
                  {completedCount > 0 && (
                    <span className="text-base font-medium text-slate-900">
                      Saved {formatSize(totalOriginalSize - totalCompressedSize)} ({Math.round(totalSavings * 100)}%)
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setFiles([])}
                    disabled={isProcessing}
                    className="text-base text-slate-600 hover:text-slate-900 px-4 py-2 hover:bg-slate-100 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="p-5 max-h-[600px] overflow-y-auto custom-scrollbar">
                <ImageList
                  files={files}
                  onRemove={handleRemove}
                  onDownload={handleDownload}
                />
              </div>

              <div className="p-5 border-t-2 border-slate-900 bg-white flex justify-end gap-4 sticky bottom-0 z-10">
                {completedCount > 0 && (
                  <button
                    onClick={handleDownloadAll}
                    className="flex items-center gap-3 px-7 py-3 text-base bg-white text-slate-900 border-2 border-slate-900 font-medium hover:bg-[#0086CF] hover:text-white hover:border-[#0086CF] transition-all shadow-sm"
                  >
                    <Download className="w-5 h-5" /> Download ZIP
                  </button>
                )}
                <button
                  onClick={handleConvert}
                  disabled={isProcessing || files.every(f => f.status === 'done')}
                  className="flex items-center gap-3 px-7 py-3 text-base bg-[#0086CF] text-white font-medium hover:bg-[#0075b5] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none hover:translate-y-[-1px] active:translate-y-[0px]"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      Convert All
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default App;
