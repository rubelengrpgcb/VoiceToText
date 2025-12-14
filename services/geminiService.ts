import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'FAKE_API_KEY_FOR_DEVELOPMENT' });

const MAX_INLINE_SIZE = 20 * 1024 * 1024; // 20MB limit for inline data

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

const waitForFileActive = async (fileName: string, apiKey: string): Promise<void> => {
  const statusUrl = `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`;
  
  // Poll every 2 seconds
  while (true) {
    const res = await fetch(statusUrl);
    if (!res.ok) throw new Error(`Failed to check file status: ${res.statusText}`);
    
    const data = await res.json();
    if (data.state === 'ACTIVE') return;
    if (data.state === 'FAILED') throw new Error('File processing failed on Gemini server.');
    
    // Wait 2 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
};

const uploadFileToGemini = async (file: File): Promise<{ uri: string, mimeType: string }> => {
  const API_KEY = process.env.API_KEY || 'FAKE_API_KEY_FOR_DEVELOPMENT';
  if (!API_KEY) throw new Error("API Key is missing.");

  // 1. Initiate Resumable Upload
  const startUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${API_KEY}`;
  const startHeaders = {
    'X-Goog-Upload-Protocol': 'resumable',
    'X-Goog-Upload-Command': 'start',
    'X-Goog-Upload-Header-Content-Length': file.size.toString(),
    'X-Goog-Upload-Header-Content-Type': file.type || 'application/octet-stream',
    'Content-Type': 'application/json'
  };

  const startResponse = await fetch(startUrl, {
    method: 'POST',
    headers: startHeaders,
    body: JSON.stringify({ file: { display_name: file.name } })
  });

  if (!startResponse.ok) {
    throw new Error(`Failed to initiate upload. API returned ${startResponse.status}. (Note: Large file uploads may require a proxy if CORS is blocked).`);
  }

  const uploadUrl = startResponse.headers.get('X-Goog-Upload-URL');
  if (!uploadUrl) {
    throw new Error("Failed to retrieve upload URL from Gemini API.");
  }

  // 2. Upload the file bytes
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Length': file.size.toString(),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize'
    },
    body: file
  });

  if (!uploadResponse.ok) {
    throw new Error(`File upload failed with status ${uploadResponse.status}.`);
  }

  const uploadResult = await uploadResponse.json();
  const fileUri = uploadResult.file.uri;
  const fileName = uploadResult.file.name; // e.g., files/123xyz

  // 3. Wait for the file to be ready (ACTIVE state)
  await waitForFileActive(fileName, API_KEY);

  return { uri: fileUri, mimeType: uploadResult.file.mimeType };
};

export const transcribeMedia = async (file: File): Promise<string> => {
  if (!process.env.API_KEY || 'FAKE_API_KEY_FOR_DEVELOPMENT') {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  let contentPart: any;

  try {
    if (file.size < MAX_INLINE_SIZE) {
      // Small file: Use inline data (faster, no upload needed)
      const base64Data = await fileToBase64(file);
      contentPart = {
        inlineData: {
          mimeType: file.type || 'application/octet-stream',
          data: base64Data
        }
      };
    } else {
      // Large file: Use File API Upload
      const { uri, mimeType } = await uploadFileToGemini(file);
      contentPart = {
        fileData: {
          mimeType: mimeType,
          fileUri: uri
        }
      };
    }

    // Using gemini-2.5-flash for speed and multimodal capabilities
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          contentPart,
          {
            text: `Please transcribe the spoken audio in this file directly into Bangla (Bengali) text.
            
            Rules:
            1. Output ONLY the transcription in Bangla script.
            2. If there are multiple speakers, label them as 'Speaker 1:', 'Speaker 2:', etc. in English or Bangla.
            3. Ignore background noise.
            4. Format the output with clear paragraph breaks.`
          }
        ]
      },
      config: {
        temperature: 0.3,
      }
    });

    if (!response.text) {
      throw new Error("No transcription was generated.");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini Transcription Error:", error);
    // Provide a more helpful error message for common upload issues
    if (error.message.includes('Failed to fetch') && file.size >= MAX_INLINE_SIZE) {
       throw new Error("Network error during large file upload. This may be due to browser CORS restrictions on the Upload API. Try a smaller file (< 20MB) or use a backend proxy.");
    }
    throw new Error(error.message || "Failed to transcribe media.");
  }
};