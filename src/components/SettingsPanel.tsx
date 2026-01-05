import { Settings2 } from 'lucide-react';

interface SettingsPanelProps {
    quality: number;
    setQuality: (q: number) => void;
    format: 'webp' | 'avif';
    setFormat: (f: 'webp' | 'avif') => void;
    avifSupported: boolean;
    maxWidth: number | undefined;
    setMaxWidth: (w: number | undefined) => void;
    maxHeight: number | undefined;
    setMaxHeight: (h: number | undefined) => void;
    disabled?: boolean;
}

export function SettingsPanel({
    quality,
    setQuality,
    format,
    setFormat,
    avifSupported,
    maxWidth,
    setMaxWidth,
    maxHeight,
    setMaxHeight,
    disabled
}: SettingsPanelProps) {
    return (
        <div className="bg-white shadow-sm border-2 border-slate-900 p-7 h-fit sticky top-6">
            <div className="flex items-center gap-3 mb-7 text-slate-900">
                <Settings2 className="w-6 h-6 text-slate-900" />
                <h2 className="font-semibold text-lg">Compression Settings</h2>
            </div>

            <div className="space-y-7">
                {/* Format Selection */}
                <div className="space-y-4">
                    <label className="text-base font-medium text-slate-700">Format</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setFormat('webp')}
                            disabled={disabled}
                            className={`px-5 py-3 text-base font-medium border-2 transition-colors ${format === 'webp'
                                ? 'bg-[#0086CF] text-white border-[#0086CF] shadow-lg shadow-[#0086CF]/20'
                                : 'bg-white text-slate-900 border-slate-900 hover:border-[#0086CF] hover:bg-slate-50'
                                }`}
                        >
                            WebP
                        </button>
                        <button
                            onClick={() => setFormat('avif')}
                            disabled={disabled || !avifSupported}
                            className={`px-5 py-3 text-base font-medium border-2 transition-colors ${format === 'avif'
                                ? 'bg-[#0086CF] text-white border-[#0086CF] shadow-lg shadow-[#0086CF]/20'
                                : 'bg-white text-slate-900 border-slate-900 hover:border-[#0086CF] hover:bg-slate-50'
                                } ${!avifSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={!avifSupported ? 'Not supported by your browser' : ''}
                        >
                            AVIF
                        </button>
                    </div>
                    {!avifSupported && (
                        <p className="text-sm text-slate-600">
                            AVIF encoding is not supported in this browser.
                        </p>
                    )}
                </div>

                {/* Quality Slider */}
                <div className="space-y-4">
                    <div className="flex justify-between">
                        <label className="text-base font-medium text-slate-700">Quality</label>
                        <span className="text-base text-slate-900 font-mono">{Math.round(quality * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={quality}
                        onChange={(e) => setQuality(parseFloat(e.target.value))}
                        disabled={disabled}
                        className="w-full h-2 bg-slate-200 appearance-none cursor-pointer accent-slate-900"
                    />
                    <div className="flex justify-between text-sm text-slate-600 px-1">
                        <span>Low</span>
                        <span>High</span>
                    </div>
                </div>

                {/* Resize Options */}
                <div className="space-y-4">
                    <label className="text-base font-medium text-slate-700">Resize (Optional)</label>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm text-slate-500 mb-2 block">Max Width</label>
                            <input
                                type="number"
                                placeholder="Auto"
                                value={maxWidth || ''}
                                onChange={(e) => setMaxWidth(e.target.value ? parseInt(e.target.value) : undefined)}
                                disabled={disabled}
                                className="w-full px-4 py-3 text-base bg-white border-2 border-slate-900 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-slate-500 mb-2 block">Max Height</label>
                            <input
                                type="number"
                                placeholder="Auto"
                                value={maxHeight || ''}
                                onChange={(e) => setMaxHeight(e.target.value ? parseInt(e.target.value) : undefined)}
                                disabled={disabled}
                                className="w-full px-4 py-3 text-base bg-white border-2 border-slate-900 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
