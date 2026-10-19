/**
 * Centralized API client for communicating with the LUNA FastAPI backend.
 * Base URL: http://127.0.0.1:8000
 */

import { ApiBook, ApiHealthResponse, Book } from '../types';

export const API_BASE_URL = 'http://127.0.0.1:8000';

const COVER_HUES = [
  '#1e293b', // Slate
  '#27272a', // Zinc
  '#172554', // Midnight
  '#1f2937', // Charcoal
  '#312e81', // Indigo
  '#292524', // Warm Charcoal
];

/**
 * Maps an API book object from SQLite into the frontend Book model.
 */
export function adaptApiBook(apiBook: ApiBook): Book {
  const hueIndex = Math.abs(apiBook.id) % COVER_HUES.length;
  const coverHue = COVER_HUES[hueIndex];

  return {
    id: apiBook.id,
    title: apiBook.title,
    originalFilename: apiBook.original_filename,
    storedPdfPath: apiBook.stored_pdf_path,
    pageCount: apiBook.page_count,
    importTimestamp: apiBook.import_timestamp,
    extractedTextStatus: apiBook.extracted_text_status,
    author: 'Local File',
    category: 'Document',
    format: 'PDF',
    fileSize: typeof apiBook.file_size_bytes === 'number' ? `${(apiBook.file_size_bytes / (1024 * 1024)).toFixed(2)} MB` : 'Unknown size',
    totalPages: apiBook.page_count || 1,
    currentPage: 1,
    progressPercentage: 0,
    lastRead: apiBook.import_timestamp ? `Imported ${apiBook.import_timestamp}` : 'Not started',
    coverHue,
    description: `Original file: ${apiBook.original_filename}. Stored locally in SQLite database.`,
    hasAudio: false,
    audioStatus: 'not_generated',
    audioDuration: 'None',
    chapters: [],
  };
}

/**
 * Checks backend health and SQLite database readiness.
 */
export async function fetchHealth(): Promise<ApiHealthResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Health check responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Connection to LUNA backend timed out after 4 seconds.');
    }
    throw new Error(
      `Unable to connect to LUNA backend at ${API_BASE_URL}. Ensure the FastAPI server is running.`
    );
  }
}

/**
 * Fetches the list of books from the SQLite database via GET /api/books.
 */
export async function fetchBooks(): Promise<ApiBook[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/books`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Books request failed with HTTP ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request to /api/books timed out after 5 seconds.');
    }
    throw new Error(
      `Could not retrieve books from SQLite. Backend at ${API_BASE_URL} is unreachable.`
    );
  }
}

/**
 * Uploads a local PDF eBook file to the backend via POST /api/books/import.
 * Employs standard multipart/form-data with size and MIME validation on backend.
 */
export async function uploadBookPdf(file: File, signal?: AbortSignal): Promise<ApiBook> {
  const formData = new FormData();
  formData.append('file', file);
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 30000);
  const abortFromCaller = () => controller.abort();
  signal?.addEventListener('abort', abortFromCaller, { once: true });

  try {
    const response = await fetch(`${API_BASE_URL}/api/books/import`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorMessage = `Upload failed with HTTP ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson && errorJson.detail) errorMessage = errorJson.detail;
      } catch {
        // Ignore a non-JSON error response.
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(signal?.aborted ? 'PDF upload was cancelled.' : 'PDF upload timed out after 30 seconds. Please try again.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}

/**
 * Returns the secure streaming URL for an indexed book's PDF file.
 */
export function getBookPdfUrl(bookId: number | string): string {
  return `${API_BASE_URL}/api/books/${encodeURIComponent(String(bookId))}/pdf`;
}


/** Deletes a registered PDF and its local metadata. */
export async function deleteBookPdf(bookId: number | string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/books/${encodeURIComponent(String(bookId))}`, { method: 'DELETE' });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.detail || `Could not delete PDF (HTTP ${response.status}).`);
}
