import React, { useState } from 'react';
import { AppStatus, FileData } from './types';
import { transcribeMedia } from './services/geminiService';
import { FileUploader } from './components/FileUploader';
import { MediaPreview } from './components/MediaPreview';
import { TranscriptionDisplay } from './components/TranscriptionDisplay';
import { AudioRecorder } from './components/AudioRecorder';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isRecordingMode, setIsRecordingMode] = useState(false);

  const handleFileSelect = (data: FileData) => {
    setFileData(data);
    setStatus(AppStatus.IDLE);
    setTranscription('');
    setError('');
    setIsRecordingMode(false);
  };

  const handleClearFile = () => {
    setFileData(null);
    setStatus(AppStatus.IDLE);
    setTranscription('');
    setError('');
    setIsRecordingMode(false);
  };

  const handleTranscribe = async () => {
    if (!fileData) return;

    setStatus(AppStatus.PROCESSING);
    setError('');
    
    try {
      const resultText = await transcribeMedia(fileData.file);
      setTranscription(resultText);
      setStatus(AppStatus.COMPLETED);
    } catch (err: any) {
      console.error(err);
      setStatus(AppStatus.ERROR);
      setError(err.message || "An unexpected error occurred.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 rounded-lg p-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-teal-600">
              BanglaScribe
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
               Powered by Gemini 2.5
             </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container max-w-3xl mx-auto px-4 py-8 sm:py-12">
        
        {/* Intro */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">
            Transcribe Bangla Audio to Text
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Upload a video, audio file, or record your voice and let our AI convert the speech into accurate Bangla text instantly.
          </p>
        </div>

        {/* Workspace */}
        <div className="space-y-8">
          
          {/* File Input / Preview / Recorder */}
          <div className={`rounded-2xl shadow-sm border border-slate-100 ${isRecordingMode ? 'bg-transparent border-0 shadow-none' : 'bg-white p-2'}`}>
            {!fileData ? (
              isRecordingMode ? (
                <AudioRecorder 
                  onFileReady={handleFileSelect} 
                  onCancel={() => setIsRecordingMode(false)} 
                />
              ) : (
                <FileUploader 
                  onFileSelect={handleFileSelect} 
                  onRecordClick={() => setIsRecordingMode(true)}
                />
              )
            ) : (
              <MediaPreview 
                data={fileData} 
                onClear={handleClearFile} 
                disabled={status === AppStatus.PROCESSING}
              />
            )}
          </div>

          {/* Action Area */}
          {fileData && status !== AppStatus.COMPLETED && (
            <div className="flex justify-center">
              <button
                onClick={handleTranscribe}
                disabled={status === AppStatus.PROCESSING}
                className={`
                  group relative flex items-center justify-center gap-3 px-8 py-4 rounded-full font-semibold text-lg shadow-lg shadow-emerald-200 transition-all duration-300
                  ${status === AppStatus.PROCESSING 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed w-full sm:w-auto' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 active:scale-95 w-full sm:w-auto'}
                `}
              >
                {status === AppStatus.PROCESSING ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Transcribing Media...</span>
                  </>
                ) : (
                  <>
                    <span>Start Transcription</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error Message */}
          {status === AppStatus.ERROR && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-600 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <div>
                <h4 className="text-red-800 font-semibold">Transcription Failed</h4>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Result Area */}
          {status === AppStatus.COMPLETED && (
             <div className="space-y-6">
                <TranscriptionDisplay text={transcription} />
                <div className="text-center">
                   <button 
                     onClick={handleClearFile}
                     className="text-slate-500 hover:text-slate-800 text-sm font-medium underline decoration-slate-300 underline-offset-4 hover:decoration-slate-500 transition-all"
                   >
                     Transcribe Another File
                   </button>
                </div>
             </div>
          )}
          
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-5xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} BanglaScribe. Built with Gemini 2.5 Flash.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;