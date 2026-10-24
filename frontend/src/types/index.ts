export type PageType = 
  | 'dashboard'
  | 'library'
  | 'reader'
  | 'audiobooks'
  | 'playlists'
  | 'profiles'
  | 'settings'
  | 'developer'
  | 'about';

export type ReaderTheme = 'charcoal' | 'sepia' | 'paper' | 'oled';

// Raw SQLite book record returned by GET /api/books
export interface ApiBook {
  id: number;
  title: string;
  original_filename: string;
  stored_pdf_path: string;
  page_count: number;
  file_size_bytes?: number;
  import_timestamp: string;
  extracted_text_status: string;
}

// Health check response returned by GET /api/health
export interface ApiHealthResponse {
  status: string;
  app: string;
  database_initialized: boolean;
  database_path: string;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  pageNumber: number;
  audioDuration: string; // e.g., "14:20"
  audioSeconds: number;
  sampleContent: string[];
}

// Frontend Book model aligned with SQLite database schema + UI helpers
export interface Book {
  id: string | number;
  title: string;
  originalFilename?: string;
  storedPdfPath?: string;
  pageCount?: number;
  importTimestamp?: string;
  extractedTextStatus?: string;
  author: string;
  category: string;
  format: 'PDF' | 'EPUB';
  fileSize: string;
  totalPages: number;
  currentPage: number;
  progressPercentage: number;
  lastRead: string;
  coverHue: string;
  description: string;
  hasAudio: boolean;
  audioStatus: 'ready' | 'queued' | 'not_generated';
  audioDuration: string;
  chapters: Chapter[];
}

export interface PlaylistTrack {
  id: string;
  bookId: string | number;
  bookTitle: string;
  chapterTitle: string;
  author: string;
  duration: string;
  durationSeconds: number;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  trackCount: number;
  totalDuration: string;
  tracks: PlaylistTrack[];
  updatedAt: string;
}

export interface LibraryStats {
  totalBooks: number;
  totalAudioHours: number;
  readingStreakDays: number;
  localStorageMb: number;
  recentBooksCount: number;
}
