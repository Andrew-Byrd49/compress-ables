import { ArrowRight, Loader2, Download, X } from 'lucide-react';
// import { cn } from '../lib/utils'; // Not used currently
import { type CompressionResult } from '../lib/compression';

export interface ProcessedFile {
    id: string;
    originalFile: File;
    previewUrl: string;
    status: 'pending' | 'processing' | 'done' | 'error';
    result?: CompressionResult;
    error?: string;
}

interface ImageListProps {
    files: ProcessedFile[];
    onRemove: (id: string) => void;
    onDownload: (file: ProcessedFile) => void;
}

function formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function ImageList({ files, onRemove, onDownload }: ImageListProps) {
    if (files.length === 0) return null;

    return (
        <div className="space-y-4">
            {files.map((file) => (
                <div
                    key={file.id}
                    className="bg-white border-2 border-slate-900 p-5 flex items-center gap-5 group transition-all hover:bg-slate-50"
                >
                    {/* Preview */}
                    <div className="w-20 h-20 bg-slate-100 flex-shrink-0 overflow-hidden relative border-2 border-slate-900">
                        <img src={file.previewUrl} alt={file.originalFile.name} className="w-full h-full object-cover" />
                        {file.status === 'processing' && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                <Loader2 className="w-7 h-7 text-slate-900 animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="text-base font-medium text-slate-900 truncate pr-2" title={file.originalFile.name}>
                                {file.originalFile.name}
                            </h4>
                            {file.status === 'done' && file.result && (
                                <span className="text-sm font-medium text-slate-900 bg-slate-100 px-3 py-1 flex-shrink-0 border-2 border-slate-900">
                                    -{Math.round(file.result.savings * 100)}%
                                </span>
                            )}
                        </div>

                        <div className="flex items-center text-sm text-slate-600 gap-3">
                            <span>{formatSize(file.originalFile.size)}</span>
                            {file.status === 'done' && file.result && (
                                <>
                                    <ArrowRight className="w-4 h-4 text-slate-400" />
                                    <span className="font-semibold text-slate-900">{formatSize(file.result.compressedSize)}</span>
                                </>
                            )}
                        </div>

                        {file.status === 'error' && (
                            <p className="text-sm text-red-600 mt-2">{file.error || 'Conversion failed'}</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {file.status === 'done' ? (
                            <button
                                onClick={() => onDownload(file)}
                                className="p-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                                title="Download"
                            >
                                <Download className="w-6 h-6" />
                            </button>
                        ) : (
                            <button
                                onClick={() => onRemove(file.id)}
                                className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                title="Remove"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
