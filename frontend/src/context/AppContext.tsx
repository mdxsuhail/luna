import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Book, Chapter, PageType, Playlist, ReaderTheme, ApiBook, ApiHealthResponse } from '../types';
import { mockPlaylists } from '../data/mockData';
import { fetchHealth, fetchBooks, adaptApiBook, API_BASE_URL } from '../services/api';

interface AppContextType {
  activePage: PageType;
  setActivePage: (page: PageType) => void;
  books: Book[];
  apiBooks: ApiBook[];
  isLoadingBooks: boolean;
  apiError: string | null;
  isBackendOnline: boolean;
  backendHealth: ApiHealthResponse | null;
  refreshBooks: () => Promise<void>;
  activeBook: Book | null;
  setActiveBook: (book: Book | null) => void;
  activeChapter: Chapter | null;
  setActiveChapter: (chapter: Chapter | null) => void;
  readerTheme: ReaderTheme;
  setReaderTheme: (theme: ReaderTheme) => void;
  readerFontSize: number;
  setReaderFontSize: (size: number) => void;
  readerPage: number;
  setReaderPage: (page: number) => void;
  isPlaying: boolean;
  togglePlay: () => void;
  audioPositionSeconds: number;
  setAudioPositionSeconds: (pos: number) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  voiceProfile: string;
  setVoiceProfile: (voice: string) => void;
  playlists: Playlist[];
  openBookInReader: (book: Book, chapter?: Chapter) => void;
  playBookAudio: (book: Book, chapter?: Chapter) => void;
  notification: string | null;
  showNotification: (msg: string) => void;
  dismissNotification: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<PageType>('dashboard');
  
  // Real API state
  const [books, setBooks] = useState<Book[]>([]);
  const [apiBooks, setApiBooks] = useState<ApiBook[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);
  const [backendHealth, setBackendHealth] = useState<ApiHealthResponse | null>(null);

  // Playlists remain local/client-side until playlist backend API is implemented
  const [playlists] = useState<Playlist[]>(mockPlaylists);
  
  // Active reading and audio session
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  
  // Reader state
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>('charcoal');
  const [readerFontSize, setReaderFontSize] = useState<number>(18);
  const [readerPage, setReaderPage] = useState<number>(1);
  
  // Audio player state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioPositionSeconds, setAudioPositionSeconds] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [voiceProfile, setVoiceProfile] = useState<string>('Default browser voice');
  const speechSessionRef = useRef(0);
  const speechPageRef = useRef(1);
  const speechBookIdRef = useRef<string | number | null>(null);
  const speechPausedRef = useRef(false);
  
  // Toast notifications
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  const dismissNotification = () => setNotification(null);

  const stopSpeech = useCallback(() => {
    speechSessionRef.current += 1;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    speechPausedRef.current = false;
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (!activeBook) {
      showNotification('Open a PDF from My Library first, then press Play.');
      return;
    }
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      showNotification('Text-to-speech is unavailable in this browser. Try the latest Chrome or Edge.');
      return;
    }

    // Resume the existing browser speech queue instead of canceling it and
    // restarting the current PDF page from the beginning.
    if (speechPausedRef.current) {
      window.speechSynthesis.resume();
      speechPausedRef.current = false;
      setIsPlaying(true);
      return;
    }

    // Pause keeps the current utterance and its position in the browser queue.
    if (isPlaying) {
      window.speechSynthesis.pause();
      speechPausedRef.current = true;
      setIsPlaying(false);
      return;
    }

    const sessionId = ++speechSessionRef.current;
    const book = activeBook;
    speechBookIdRef.current = book.id;
    speechPageRef.current = Math.max(1, activeChapter?.pageNumber || readerPage || book.currentPage || 1);
    let totalPages = Math.max(1, book.totalPages || 1);

    const readNextPage = async () => {
      if (speechSessionRef.current !== sessionId || speechBookIdRef.current !== book.id) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/books/${book.id}/text?page=${speechPageRef.current}`);
        const payload = await response.json().catch(() => ({}));
        if (speechSessionRef.current !== sessionId) return;
        if (!response.ok) {
          throw new Error(payload.detail || `Could not extract text from page ${speechPageRef.current} (HTTP ${response.status}).`);
        }
        totalPages = Number(payload.page_count) || totalPages;
        const pageText = typeof payload.text === 'string' ? payload.text.trim() : '';
        if (!pageText) {
          throw new Error(payload.message || `No selectable text found on page ${speechPageRef.current}. This PDF may be scanned and require OCR.`);
        }

        // Split long pages into small utterances. Some browser speech engines
        // truncate long utterances or fail without reporting a useful error.
        const sentences = pageText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [pageText];
        const chunks: string[] = [];
        let buffer = '';
        for (const sentence of sentences) {
          const cleanSentence = sentence.trim();
          if (!cleanSentence) continue;
          if (buffer && (buffer.length + cleanSentence.length + 1) > 240) {
            chunks.push(buffer);
            buffer = '';
          }
          if (cleanSentence.length > 240) {
            if (buffer) chunks.push(buffer);
            buffer = '';
            for (let offset = 0; offset < cleanSentence.length; offset += 240) {
              chunks.push(cleanSentence.slice(offset, offset + 240));
            }
          } else {
            buffer = buffer ? `${buffer} ${cleanSentence}` : cleanSentence;
          }
        }
        if (buffer) chunks.push(buffer);
        let chunkIndex = 0;
        const speakNextChunk = () => {
          if (speechSessionRef.current !== sessionId) return;
          if (chunkIndex >= chunks.length) {
            if (speechPageRef.current < totalPages) {
              speechPageRef.current += 1;
              setReaderPage(speechPageRef.current);
              void readNextPage();
            } else {
              setIsPlaying(false);
              speechPausedRef.current = false;
              speechBookIdRef.current = null;
              showNotification('Finished reading the PDF aloud.');
            }
            return;
          }
          const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex++]);
          utterance.rate = Math.min(2, Math.max(0.5, playbackSpeed));
          const voices = window.speechSynthesis.getVoices();
          const languageVoice = voices.find((voice) => /^en([-_]|$)/i.test(voice.lang));
          if (languageVoice) utterance.voice = languageVoice;
          utterance.onend = speakNextChunk;
          utterance.onerror = (event) => {
            if (speechSessionRef.current !== sessionId) return;
            setIsPlaying(false);
            speechPausedRef.current = false;
            if (event.error !== 'canceled' && event.error !== 'interrupted') {
              showNotification(`Speech playback failed (${event.error}). Check your device volume and browser speech settings, then try again.`);
            }
          };
          window.speechSynthesis.speak(utterance);
        };
        speakNextChunk();
      } catch (error) {
        if (speechSessionRef.current !== sessionId) return;
        setIsPlaying(false);
        speechPausedRef.current = false;
        speechBookIdRef.current = null;
        showNotification(error instanceof Error ? error.message : 'Unable to read this PDF aloud.');
      }
    };

    window.speechSynthesis.cancel();
    speechPausedRef.current = false;
    setIsPlaying(true);
    setAudioPositionSeconds(0);
    void readNextPage();
  }, [activeBook, activeChapter, readerPage, isPlaying, playbackSpeed]);

  // Track elapsed narration time while browser speech is actively playing.
  // Browser speech synthesis does not expose a reliable total duration, so this
  // is an elapsed-time clock rather than a seekable audio-file timeline.
  useEffect(() => {
    if (!isPlaying) return;
    const timerId = window.setInterval(() => {
      setAudioPositionSeconds((seconds) => seconds + 1);
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [isPlaying]);

  useEffect(() => () => {
    speechSessionRef.current += 1;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  /**
   * Fetches health status and books from the FastAPI backend.
   */
  const refreshBooks = useCallback(async () => {
    setIsLoadingBooks(true);
    setApiError(null);

    try {
      // 1. Check backend health
      const health = await fetchHealth();
      setBackendHealth(health);
      setIsBackendOnline(true);

      // 2. Fetch books from SQLite
      const rawBooks = await fetchBooks();
      setApiBooks(rawBooks);

      const adapted = rawBooks.map(adaptApiBook);
      setBooks(adapted);

      // If active book is not set or was removed, set to first available or null
      setActiveBook((current) => {
        if (!current && adapted.length > 0) return adapted[0];
        if (current && !adapted.some((b) => b.id === current.id)) {
          return adapted.length > 0 ? adapted[0] : null;
        }
        return current;
      });
    } catch (err: any) {
      setIsBackendOnline(false);
      setBackendHealth(null);
      setBooks([]);
      setApiBooks([]);
      setActiveBook(null);
      const message = err.message || 'Unable to connect to LUNA backend.';
      setApiError(message);
    } finally {
      setIsLoadingBooks(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    refreshBooks();
  }, [refreshBooks]);

  const openBookInReader = (book: Book, chapter?: Chapter) => {
    // Prevent speech from the previous book continuing after navigation.
    stopSpeech();
    setActiveBook(book);
    if (chapter) {
      setActiveChapter(chapter);
      setReaderPage(chapter.pageNumber);
    } else {
      setActiveChapter(
        book.chapters[0] || {
          id: `c-${book.id}`,
          number: 1,
          title: 'Introduction & Chapter 1',
          pageNumber: book.currentPage || 1,
          audioDuration: '10:00',
          audioSeconds: 600,
          sampleContent: [
            `Reading preview for: ${book.title}`,
            `Original file: ${book.originalFilename}. This document is registered in the local SQLite database.`,
            'Direct binary rendering via local PDF engine will unpack full document pages into this viewport in subsequent phases.'
          ],
        }
      );
      setReaderPage(book.currentPage || 1);
    }
    setActivePage('reader');
  };

  const playBookAudio = (book: Book, chapter?: Chapter) => {
    setActiveBook(book);
    const targetChapter = chapter || book.chapters[0] || {
      id: `audio-${book.id}`,
      number: 1,
      title: 'Chapter 1: Audio Synthesis',
      pageNumber: 1,
      audioDuration: '10:00',
      audioSeconds: 600,
      sampleContent: ['Audio synthesis ready.']
    };
    // Loading a book is not the same as starting speech playback.
    // Keep Play in its ready state until the user explicitly presses it.
    stopSpeech();
    speechPageRef.current = Math.max(1, targetChapter.pageNumber || 1);
    setActiveChapter(targetChapter);
    setIsPlaying(false);
    setActivePage('audiobooks');
  };

  return (
    <AppContext.Provider
      value={{
        activePage,
        setActivePage,
        books,
        apiBooks,
        isLoadingBooks,
        apiError,
        isBackendOnline,
        backendHealth,
        refreshBooks,
        activeBook,
        setActiveBook,
        activeChapter,
        setActiveChapter,
        readerTheme,
        setReaderTheme,
        readerFontSize,
        setReaderFontSize,
        readerPage,
        setReaderPage,
        isPlaying,
        togglePlay,
        audioPositionSeconds,
        setAudioPositionSeconds,
        playbackSpeed,
        setPlaybackSpeed,
        voiceProfile,
        setVoiceProfile,
        playlists,
        openBookInReader,
        playBookAudio,
        notification,
        showNotification,
        dismissNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
