import React from 'react';
import { FileData } from '../types';

interface MediaPreviewProps {
  data: FileData;
  onClear: () => void;
  disabled?: boolean;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({ data, onClear, disabled }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div className="flex items-center space-x-2 overflow-hidden">
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
            {data.type}
          </span>
          <span className="text-sm font-medium text-slate-700 truncate max-w-[200px] sm:max-w-xs" title={data.file.name}>
            {data.file.name}
          </span>
          <span className="text-xs text-slate-400">
            ({(data.file.size / (1024 * 1024)).toFixed(1)} MB)
          </span>
        </div>
        
        {!disabled && (
          <button 
            onClick={onClear}
            className="text-slate-400 hover:text-red-500 transition-colors p-1"
            title="Remove file"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-6 flex justify-center bg-slate-100">
        {data.type === 'video' ? (
          <video 
            src={data.previewUrl} 
            controls 
            className="max-h-[300px] w-full rounded-lg shadow-inner bg-black" 
          />
        ) : (
          <audio 
            src={data.previewUrl} 
            controls 
            className="w-full mt-2" 
          />
        )}
      </div>
    </div>
  );
};