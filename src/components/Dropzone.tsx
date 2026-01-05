import { UploadCloud } from 'lucide-react';
import { useCallback, useState } from 'react';
import { cn } from '../lib/utils';

interface DropzoneProps {
    onFilesDropped: (files: File[]) => void;
    className?: string;
    disabled?: boolean;
}

export function Dropzone({ onFilesDropped, className, disabled }: DropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;

        const files = Array.from(e.dataTransfer.files).filter((file) =>
            file.type.startsWith('image/')
        );
        if (files.length > 0) {
            onFilesDropped(files);
        }
    }, [onFilesDropped, disabled]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && !disabled) {
            const files = Array.from(e.target.files).filter((file) =>
                file.type.startsWith('image/')
            );
            if (files.length > 0) {
                onFilesDropped(files);
            }
        }
        // Reset value to allow selecting same file again
        e.target.value = '';
    }, [onFilesDropped, disabled]);

    return (
        <div
            className={cn(
                "relative border-2 border-dashed transition-all duration-200 ease-in-out flex flex-col items-center justify-center p-16 text-center cursor-pointer group",
                isDragging
                    ? "border-[#0086CF] bg-slate-100 scale-[1.01]"
                    : "border-slate-300 hover:border-[#0086CF] hover:bg-slate-50",
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !disabled && document.getElementById('file-upload')?.click()}
        >
            <input
                type="file"
                id="file-upload"
                className="hidden"
                multiple
                accept="image/*"
                onChange={handleFileInput}
                disabled={disabled}
            />
            <div className={cn(
                "p-5 mb-5 transition-colors",
                isDragging ? "bg-[#0086CF] text-white" : "bg-slate-100 text-slate-600 group-hover:bg-[#0086CF] group-hover:text-white"
            )}>
                <UploadCloud className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-slate-900">
                Select or drop images
            </h3>
            <p className="text-base text-slate-600 group-hover:text-slate-700">
                Supports JPG, PNG, SVG, GIF, WebP
            </p>
        </div>
    );
}
