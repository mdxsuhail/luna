import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { BookCard } from '../components/library/BookCard';
import { BookListRow } from '../components/library/BookListRow';
import { Modal } from '../components/common/Modal';
import { Book, ApiBook } from '../types';
import { uploadBookPdf, getBookPdfUrl } from '../services/api';
import {
  Search,
  LayoutGrid,
  List,
  Upload,
  HardDrive,
  BookOpen,
  Headphones,
  RefreshCw,
  AlertCircle,
  Database,
  CheckCircle2,
  FileUp,
  X,
  FileText,
  Download,
} from 'lucide-react';

export const LibraryPage: React.FC = () => {
  const {
    books,
    isLoadingBooks,
    apiError,
    isBackendOnline,
    backendHealth,
    refreshBooks,
    openBookInReader,
    playBookAudio,
    showNotification,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Import Modal & Upload State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessBook, setUploadSuccessBook] = useState<ApiBook | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const categories = ['All', 'Document', 'Philosophy', 'Engineering', 'Science'];

  const filteredBooks = books.filter((b: Book) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.originalFilename || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenImportModal = () => {
    setSelectedFile(null);
    setUploadError(null);
    setUploadSuccessBook(null);
    setIsImportModalOpen(true);
  };

  const handleCloseImportModal = () => {
    if (isUploading) return;
    setIsImportModalOpen(false);
    setSelectedFile(null);
    setUploadError(null);
    setUploadSuccessBook(null);
  };

  const handleFileChosen = (file: File) => {
    setUploadError(null);
    setUploadSuccessBook(null);

    // Validate file extension and MIME
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setUploadError('Invalid file type. Please select a genuine PDF document (.pdf).');
      return;
    }

    // Client-side 50 MB size limit check
    const maxSizeBytes = 50 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setUploadError(
        `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 50 MB.`
      );
      return;
    }

    if (file.size === 0) {
      setUploadError('Selected file is empty (0 bytes).');
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChosen(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChosen(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const newBook = await uploadBookPdf(selectedFile);
      setUploadSuccessBook(newBook);
      setSelectedFile(null);
      // Immediately refresh books from SQLite database
      await refreshBooks();
      showNotification(`Imported "${newBook.title}" (${newBook.page_count} pages) into local SQLite library!`);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to import PDF file.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Top Controls Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 className="section-title">My eBook Library</h1>
          <p className="section-subtitle">
            {isBackendOnline
              ? `${books.length} offline books indexed in SQLite database`
              : 'Connecting to local storage database...'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => refreshBooks()}
            disabled={isLoadingBooks}
            className="btn btn-ghost"
            style={{ border: '1px solid var(--border-subtle)', gap: 6 }}
            title="Refresh books list from SQLite database"
          >
            <RefreshCw size={14} className={isLoadingBooks ? 'spin-animation' : ''} />
            <span>{isLoadingBooks ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={handleOpenImportModal}
            className="btn btn-primary"
          >
            <Upload size={14} />
            <span>Import eBook (.pdf)</span>
          </button>
        </div>
      </div>

      {/* Backend Error State Banner */}
      {apiError && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <AlertCircle size={20} style={{ color: 'var(--accent-rose)', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fca5a5' }}>
                Backend Service Offline
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                {apiError}
              </p>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Run <code>python -m uvicorn main:app --reload</code> inside <code>backend/</code> to activate the server.
              </div>
            </div>
          </div>

          <button
            onClick={() => refreshBooks()}
            className="btn btn-sm btn-ghost"
            style={{ border: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}
          >
            <RefreshCw size={12} />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: '24px',
        }}
      >
        {/* Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 12px',
            flex: '1 1 240px',
            maxWidth: '360px',
          }}
        >
          <Search size={15} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search titles, filenames..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-main)',
              fontSize: '13px',
              width: '100%',
            }}
          />
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="btn btn-sm"
              style={{
                backgroundColor: selectedCategory === cat ? 'var(--bg-elevated)' : 'transparent',
                borderColor: selectedCategory === cat ? 'var(--border-focus)' : 'transparent',
                color: selectedCategory === cat ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: selectedCategory === cat ? 600 : 400,
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            onClick={() => setViewMode('grid')}
            className="icon-btn btn-ghost"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: viewMode === 'grid' ? 'var(--bg-elevated)' : 'transparent',
              color: viewMode === 'grid' ? 'var(--text-main)' : 'var(--text-muted)',
            }}
            title="Grid View"
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className="icon-btn btn-ghost"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: viewMode === 'list' ? 'var(--bg-elevated)' : 'transparent',
              color: viewMode === 'list' ? 'var(--text-main)' : 'var(--text-muted)',
            }}
            title="List View"
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoadingBooks ? (
        <div
          style={{
            padding: '80px 20px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <RefreshCw size={28} className="spin-animation" style={{ color: 'var(--accent-primary)' }} />
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>
            Querying SQLite Database...
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Reading records from <code>/api/books</code> at http://127.0.0.1:8000
          </p>
        </div>
      ) : books.length === 0 ? (
        /* Empty Library State (Zero Books in Database) */
        <div
          style={{
            padding: '70px 24px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
            }}
          >
            <Database size={28} />
          </div>

          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
              Your Library is Empty
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.5 }}>
              The local SQLite database (<code>local-data/database/luna.db</code>) is active and contains 0 books.
              Imported PDF files will be indexed here as you populate your local storage.
            </p>
          </div>

          {backendHealth && (
            <div
              style={{
                fontSize: '11.5px',
                color: 'var(--accent-emerald)',
                backgroundColor: 'rgba(52, 211, 153, 0.08)',
                border: '1px solid rgba(52, 211, 153, 0.2)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              Connected to {backendHealth.app} • SQLite schema ready
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={() => refreshBooks()}
              className="btn btn-ghost"
              style={{ border: '1px solid var(--border-subtle)' }}
            >
              <RefreshCw size={14} />
              <span>Refresh Database</span>
            </button>
            <button
              onClick={handleOpenImportModal}
              className="btn btn-primary"
            >
              <Upload size={14} />
              <span>Import Information</span>
            </button>
          </div>
        </div>
      ) : filteredBooks.length === 0 ? (
        /* Search Filter No Match State */
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            No books found matching "{searchQuery}".
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Populated Grid View */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredBooks.map((book: Book) => (
            <BookCard
              key={book.id}
              book={book}
              onOpenDetails={(b: Book) => setSelectedBook(b)}
            />
          ))}
        </div>
      ) : (
        /* Populated List View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredBooks.map((book: Book) => (
            <BookListRow
              key={book.id}
              book={book}
              onOpenDetails={(b: Book) => setSelectedBook(b)}
            />
          ))}
        </div>
      )}

      {/* Book Details Modal */}
      {selectedBook && (
        <Modal
          isOpen={!!selectedBook}
          onClose={() => setSelectedBook(null)}
          title="Book Details & Offline Storage"
        >
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <div
              style={{
                width: '90px',
                height: '128px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: selectedBook.coverHue,
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                flexShrink: 0,
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <span style={{ fontSize: '10px', color: '#fff' }}>{selectedBook.format}</span>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#fff' }}>
                {selectedBook.title.substring(0, 20)}...
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
                {selectedBook.title}
              </h3>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {selectedBook.originalFilename}
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <div><strong style={{ color: 'var(--text-secondary)' }}>Format:</strong> {selectedBook.format}</div>
                <div><strong style={{ color: 'var(--text-secondary)' }}>Size:</strong> {selectedBook.fileSize}</div>
                <div><strong style={{ color: 'var(--text-secondary)' }}>Pages:</strong> {selectedBook.totalPages}</div>
              </div>

              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '12px', lineHeight: 1.5 }}>
                {selectedBook.description}
              </p>
            </div>
          </div>

          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--bg-input)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '20px',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
              <HardDrive size={13} />
              <span>Target File Path:</span>
            </div>
            <code style={{ display: 'block', marginTop: '4px', color: 'var(--accent-primary)' }}>
              {selectedBook.storedPdfPath || `local-data/books/${selectedBook.originalFilename}`}
            </code>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
            <a
              href={getBookPdfUrl(selectedBook.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
              style={{ border: '1px solid var(--border-subtle)', textDecoration: 'none' }}
              title="Stream PDF directly from local-data/books/"
            >
              <Download size={14} />
              <span>Stream PDF</span>
            </a>

            <button
              onClick={() => {
                const b = selectedBook;
                setSelectedBook(null);
                openBookInReader(b);
              }}
              className="btn btn-primary"
            >
              <BookOpen size={14} />
              <span>Open in Reader</span>
            </button>
            {selectedBook.hasAudio && (
              <button
                onClick={() => {
                  const b = selectedBook;
                  setSelectedBook(null);
                  playBookAudio(b);
                }}
                className="btn btn-ghost"
                style={{ border: '1px solid var(--border-subtle)' }}
              >
                <Headphones size={14} />
                <span>Play Audiobook</span>
              </button>
            )}
          </div>
        </Modal>
      )}

      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        title="Import Offline PDF eBook"
        width="560px"
      >
        {uploadSuccessBook ? (
          <div style={{ textAlign: 'center', padding: '12px 4px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: 'rgba(52, 211, 153, 0.12)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'var(--accent-emerald)',
              }}
            >
              <CheckCircle2 size={28} />
            </div>

            <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
              Import Succeeded!
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Your document has been parsed with pypdf and recorded into the local SQLite database.
            </p>

            {/* Imported Book Card Summary */}
            <div
              style={{
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                textAlign: 'left',
                marginBottom: '24px',
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>
                {uploadSuccessBook.title}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Source: {uploadSuccessBook.original_filename}
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  marginTop: '12px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  borderTop: '1px solid var(--border-divider)',
                  paddingTop: '10px',
                }}
              >
                <div>
                  <strong style={{ color: 'var(--text-main)' }}>Pages:</strong>{' '}
                  {uploadSuccessBook.page_count}
                </div>
                <div>
                  <strong style={{ color: 'var(--text-main)' }}>Storage:</strong>{' '}
                  <code>{uploadSuccessBook.stored_pdf_path}</code>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                onClick={() => {
                  setUploadSuccessBook(null);
                  setSelectedFile(null);
                  setUploadError(null);
                }}
                className="btn btn-ghost"
                style={{ border: '1px solid var(--border-subtle)' }}
              >
                <FileUp size={14} />
                <span>Import Another PDF</span>
              </button>
              <button
                onClick={handleCloseImportModal}
                className="btn btn-primary"
              >
                <span>Done & View in Library</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Select a PDF eBook from your computer. The document will be saved locally to{' '}
              <code>local-data/books/</code> and indexed in SQLite.
            </p>

            {/* Hidden Native File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,application/pdf"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              disabled={isUploading}
            />

            {/* Drag & Drop Target Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                if (!isUploading && fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
              style={{
                border: isDragging
                  ? '2px dashed var(--accent-primary)'
                  : '2px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isDragging ? 'var(--bg-card-hover)' : 'var(--bg-input)',
                padding: '28px 20px',
                textAlign: 'center',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '16px',
              }}
            >
              {selectedFile ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(129, 140, 248, 0.15)',
                      color: 'var(--accent-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileText size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', wordBreak: 'break-all' }}>
                      {selectedFile.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to import
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    disabled={isUploading}
                    className="btn btn-sm btn-ghost"
                    style={{ border: '1px solid var(--border-subtle)', marginTop: '4px', gap: '4px' }}
                  >
                    <X size={12} />
                    <span>Choose different file</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    <FileUp size={20} />
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-main)' }}>
                    Drop your PDF here, or <span style={{ color: 'var(--accent-primary)' }}>browse</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Standard PDF documents up to 50 MB
                  </div>
                </div>
              )}
            </div>

            {/* Error Message Banner */}
            {uploadError && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  marginBottom: '16px',
                }}
              >
                <AlertCircle size={16} style={{ color: 'var(--accent-rose)', marginTop: '2px', flexShrink: 0 }} />
                <div style={{ fontSize: '12.5px', color: '#fca5a5', lineHeight: 1.4 }}>
                  {uploadError}
                </div>
              </div>
            )}

            {/* In-Flight Uploading Indicator */}
            {isUploading && (
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-focus)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                <RefreshCw size={16} className="spin-animation" style={{ color: 'var(--accent-primary)' }} />
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  Uploading & extracting metadata with pypdf...
                </div>
              </div>
            )}

            {/* Dialog Footer Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={handleCloseImportModal}
                disabled={isUploading}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="btn btn-primary"
                style={{ minWidth: '120px' }}
              >
                {isUploading ? (
                  <>
                    <RefreshCw size={14} className="spin-animation" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    <span>Import Book</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

