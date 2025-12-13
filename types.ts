export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface TranscriptionResponse {
  text: string;
}

export interface FileData {
  file: File;
  previewUrl: string;
  type: 'audio' | 'video';
}
