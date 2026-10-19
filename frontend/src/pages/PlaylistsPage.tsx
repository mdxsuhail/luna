import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Playlist, PlaylistTrack, Book, Chapter } from '../types';
import { Modal } from '../components/common/Modal';
import { TapeStack } from '../components/common/TapeStack';
import {
  ListMusic,
  Plus,
  Play,
  Clock
} from 'lucide-react';

export const PlaylistsPage: React.FC = () => {
  const { playlists, books, setActiveBook, setActiveChapter, togglePlay, showNotification } = useApp();
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist>(playlists[0]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handlePlayTrack = (track: PlaylistTrack) => {
    const parentBook = books.find((b: Book) => b.id === track.bookId);
    if (parentBook) {
      setActiveBook(parentBook);
      const foundChapter = parentBook.chapters.find((c: Chapter) => track.chapterTitle.includes(c.title)) || parentBook.chapters[0];
      setActiveChapter(foundChapter);
      togglePlay();
      showNotification(`Playing track: ${track.chapterTitle}`);
    }
  };

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    showNotification(`Created playlist "${newTitle}" in local database`);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewDesc('');
  };

  return (
    <div className="page-container">
      {/* Page Header */}
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
          <h1 className="section-title">Playlists & Listening Queues</h1>
          <p className="section-subtitle">
            Curated offline audio sequences stored locally in SQLite database
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary"
        >
          <Plus size={14} />
          <span>New Playlist</span>
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 340px) 1fr',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Playlists Sidebar list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {playlists.map((pl: Playlist) => {
            const isSelected = selectedPlaylist.id === pl.id;
            return (
              <div
                key={pl.id}
                onClick={() => setSelectedPlaylist(pl)}
                style={{
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isSelected ? 'var(--bg-elevated)' : 'var(--bg-card)',
                  border: isSelected ? '1px solid var(--border-focus)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '6px' }}>
                  <ListMusic size={16} style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {pl.title}
                  </span>
                </div>

                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.4,
                    marginBottom: '12px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {pl.description}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span>{pl.trackCount} tracks</span>
                  <span>{pl.totalDuration}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Playlist Tracks Detail */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              paddingBottom: '20px',
              borderBottom: '1px solid var(--border-divider)',
              marginBottom: '20px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)' }}>
                {selectedPlaylist.title}
              </h2>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {selectedPlaylist.description}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => {
                  if (selectedPlaylist.tracks.length > 0) {
                    handlePlayTrack(selectedPlaylist.tracks[0]);
                  }
                }}
                className="btn btn-primary btn-sm"
              >
                <Play size={13} />
                <span>Play All</span>
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '22px' }}>
            <TapeStack
              heading="Listening queue"
              tapes={selectedPlaylist.tracks.map((track) => ({ id: track.id, title: track.chapterTitle, meta: track.duration + ' · ' + track.bookTitle, accent: '#d8a45d' }))}
              onSelect={(tape) => {
                const track = selectedPlaylist.tracks.find((item) => item.id === tape.id);
                if (track) handlePlayTrack(track);
              }}
            />
          </div>

          {/* Track List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {selectedPlaylist.tracks.map((track: PlaylistTrack, idx: number) => (
              <div
                key={track.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', width: '18px' }}>
                    {idx + 1}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 600,
                        color: 'var(--text-main)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={track.chapterTitle}
                    >
                      {track.chapterTitle}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {track.bookTitle} • {track.author}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    <Clock size={12} />
                    <span>{track.duration}</span>
                  </div>

                  <button
                    onClick={() => handlePlayTrack(track)}
                    className="icon-btn btn-ghost"
                    style={{ width: '30px', height: '30px' }}
                    title="Play track"
                  >
                    <Play size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Playlist Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Listening Playlist"
      >
        <form onSubmit={handleCreatePlaylist} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Playlist Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Morning Study & Focus"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              placeholder="Notes on the collection..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                fontSize: '13px',
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Playlist
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
