export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // Base64 string for display
  isThinking?: boolean;
}

export interface Attachment {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export enum GeminiModel {
  PRO_PREVIEW = 'gemini-3-pro-preview',
  FLASH = 'gemini-2.5-flash',
}

export interface SavedItem {
  id: string;
  originalMessageId: string;
  content: string;
  timestamp: number;
  type: 'concept' | 'solution'; // Could be expanded later
}

export interface ProblemItem {
  id: string;
  image: string; // Base64
  mimeType: string;
  text: string;
  timestamp: number;
}

export interface ProgressReport {
  mastered: string[];
  struggling: string[];
  totalProblemsSolved: number;
  overallFeedback: string;
  lastUpdated: number;
}