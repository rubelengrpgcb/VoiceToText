import React, { useState, useRef, useEffect } from 'react';
import { FileData } from '../types';

interface AudioRecorderProps {
  onFileReady: (data: FileData) => void;
  onCancel: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onFileReady, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [permissionError, setPermissionError] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopTracks();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const startRecording = async () => {
    try {
      setPermissionError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `recording_${new Date().getTime()}.webm`, { type: 'audio/webm' });
        const previewUrl = URL.createObjectURL(blob);
        
        onFileReady({
          file,
          previewUrl,
          type: 'audio'
        });
        stopTracks();
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      setDuration(0);
      timerIntervalRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      setPermissionError("Could not access microphone. Please allow permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 flex flex-col items-center justify-center min-h-[300px] shadow-sm animate-fade-in">
      
      {permissionError ? (
        <div className="text-center">
           <div className="bg-red-100 p-4 rounded-full inline-flex mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-red-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
           </div>
           <p className="text-red-600 font-medium mb-4">{permissionError}</p>
           <button onClick={onCancel} className="text-slate-500 hover:text-slate-800 underline">Go Back</button>
        </div>
      ) : (
        <>
          <div className="relative mb-8">
            {isRecording && (
              <div className="absolute inset-0 rounded-full bg-red-100 animate-ping"></div>
            )}
            <div className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-300 ${isRecording ? 'bg-red-500 shadow-red-200 shadow-xl' : 'bg-slate-100'}`}>
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-10 h-10 ${isRecording ? 'text-white' : 'text-slate-400'}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
          </div>

          <div className="text-center mb-8">
            <div className="text-4xl font-mono font-bold text-slate-800 tracking-wider">
              {formatTime(duration)}
            </div>
            <p className="text-sm text-slate-400 mt-2 font-medium uppercase tracking-widest">
              {isRecording ? 'Recording...' : 'Ready to Record'}
            </p>
          </div>

          <div className="flex gap-4">
            {!isRecording ? (
              <>
                <button
                  onClick={onCancel}
                  className="px-6 py-2.5 rounded-full border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 hover:border-slate-400 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={startRecording}
                  className="px-6 py-2.5 rounded-full bg-emerald-600 text-white font-medium hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95"
                >
                  Start Recording
                </button>
              </>
            ) : (
              <button
                onClick={stopRecording}
                className="px-8 py-3 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center gap-2"
              >
                <div className="w-3 h-3 bg-white rounded-sm"></div>
                Stop Recording
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};