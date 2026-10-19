import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Book, Chapter, PageType, Playlist, ReaderTheme, ApiBook, ApiHealthResponse } from '../types';
import { mockPlaylists } from '../data/mockData';
import { fetchHealth, fetchBooks, adaptApiBook } from '../services/api';

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
  const [voiceProfile, setVoiceProfile] = useState<string>('Luna Calm (Local Neural)');
  
  // Toast notifications
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  const dismissNotification = () => setNotification(null);

  const togglePlay = async () => {
    if (!activeBook) {
      showNotification('No book loaded. Select a PDF from My Library first.');
      return;
    }
    if (!('speechSynthesis' in window)) {
      showNotification('Text-to-speech is not supported by this browser. Try Chrome or Edge.');
      return;
    }
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      return;
    }
    try {
      if (window.speechSynthesis.paused && window.speechSynthesis.speaking) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
        return;
      }
      window.speechSynthesis.cancel();
      const response = await fetch(`http://127.0.0.1:8000/api/books/${activeBook.id}/text?page=1`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Could not extract text from this PDF.');
      if (!data.text || !data.text.trim()) {
        throw new Error(data.message || 'No selectable text found. Scanned PDFs need OCR before speech can read them.');
      }
      const utterance = new SpeechSynthesisUtterance(data.text);
      utterance.rate = playbackSpeed;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = (event) => {
        setIsPlaying(false);
        if (event.error !== 'canceled' && event.error !== 'interrupted') {
          showNotification(`Speech playback failed: ${event.error}. Try another browser.`);
        }
      };
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    } catch (error) {
      setIsPlaying(false);
      showNotification(error instanceof Error ? error.message : 'Unable to start text-to-speech.');
    }
  };

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
    setActiveChapter(targetChapter);
    setIsPlaying(true);
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
