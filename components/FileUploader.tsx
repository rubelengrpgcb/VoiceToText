import React, { useCallback, useRef, useState } from 'react';
import { FileData } from '../types';

interface FileUploaderProps {
  onFileSelect: (data: FileData) => void;
  onRecordClick: () => void;
  disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, onRecordClick, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file) return;
    
    // Validate type
    const isAudio = file.type.startsWith('audio/');
    const isVideo = file.type.startsWith('video/');

    if (!isAudio && !isVideo) {
      alert("Please upload a valid audio or video file.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    onFileSelect({
      file,
      previewUrl,
      type: isVideo ? 'video' : 'audio'
    });
  }, [onFileSelect]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ease-in-out flex flex-col items-center justify-center text-center
        ${isDragging ? 'border-emerald-500 bg-emerald-50 scale-[1.01]' : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        accept="audio/*,video/*"
        onChange={onChange}
        disabled={disabled}
      />
      
      <div className="bg-emerald-100 p-4 rounded-full mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-emerald-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
        </svg>
      </div>

      <h3 className="text-lg font-semibold text-slate-700 mb-2">
        Upload Audio or Video
      </h3>
      <p className="text-sm text-slate-500 max-w-xs mx-auto mb-6">
        Drag & drop or click to browse. Supports MP3, WAV, MP4, MOV, etc. (Max 18MB)
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm justify-center">
        <button 
          type="button"
          disabled={disabled}
          onClick={() => !disabled && inputRef.current?.click()}
          className="flex-1 px-4 py-2.5 bg-white border border-slate-200 shadow-sm rounded-lg text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
        >
          Select File
        </button>
        
        <div className="relative flex items-center justify-center sm:hidden py-1">
          <span className="text-xs text-slate-400 bg-transparent px-2">OR</span>
        </div>

        <button 
          type="button"
          disabled={disabled}
          onClick={onRecordClick}
          className="flex-1 px-4 py-2.5 bg-emerald-600 border border-transparent shadow-sm rounded-lg text-sm font-medium text-white hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
          Record Voice
        </button>
      </div>
    </div>
  );
};