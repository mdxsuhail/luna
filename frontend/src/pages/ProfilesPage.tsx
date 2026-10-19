import React from 'react';
import { ArrowUpRight, Bookmark, Clock3, Star, UsersRound } from 'lucide-react';
import './ProfilesPage.css';

type Profile = {
  id: number;
  name: string;
  role: string;
  skill: string;
  rating: string;
  rate: string;
  hours: string;
  initials: string;
  avatarTone: string;
  cover: string;
  theme: 'dark' | 'light';
};

const demoProfiles: Profile[] = [
  {
    id: 1,
    name: 'Liam O’Connor',
    role: 'Visual Artist',
    skill: 'Things',
    rating: '5.0',
    rate: '$99',
    hours: '12',
    initials: 'LO',
    avatarTone: 'coral',
    cover: 'cosmic',
    theme: 'dark',
  },
  {
    id: 2,
    name: 'Alex Turner',
    role: 'Creative Director',
    skill: 'Sketch',
    rating: '5.0',
    rate: '$150',
    hours: '24',
    initials: 'AT',
    avatarTone: 'sand',
    cover: 'ember',
    theme: 'light',
  },
  {
    id: 3,
    name: 'Maya Chen',
    role: 'Book Cover Designer',
    skill: 'Editorial',
    rating: '4.9',
    rate: '$85',
    hours: '18',
    initials: 'MC',
    avatarTone: 'lilac',
    cover: 'violet',
    theme: 'light',
  },
  {
    id: 4,
    name: 'Noah Williams',
    role: 'Sound Designer',
    skill: 'Audio',
    rating: '4.8',
    rate: '$120',
    hours: '16',
    initials: 'NW',
    avatarTone: 'mint',
    cover: 'ocean',
    theme: 'dark',
  },
];

const ProfileCard: React.FC<{ profile: Profile }> = ({ profile }) => (
  <article className={`profile-card profile-card--${profile.theme}`}>
    <div className={`profile-cover profile-cover--${profile.cover}`}>
      <span className="profile-cover-label">LUNA / CREATIVE DIRECTORY</span>
      <span className="profile-skill-chip"><span aria-hidden="true">✦</span>{profile.skill}</span>
      <div className={`profile-avatar profile-avatar--${profile.avatarTone}`} aria-label={`${profile.name} avatar`}>
        {profile.initials}
      </div>
    </div>

    <div className="profile-card-body">
      <div className="profile-heading-row">
        <div className="profile-name-block">
          <h2>{profile.name}</h2>
          <p>{profile.role}</p>
        </div>
        <button className="profile-bookmark" type="button" aria-label={`Save ${profile.name} profile`} title="Demo action">
          <Bookmark size={16} />
        </button>
      </div>

      <div className="profile-stats" aria-label="Sample profile statistics">
        <div className="profile-stat">
          <Star size={15} fill="currentColor" />
          <strong>{profile.rating}</strong>
          <span>Rating</span>
        </div>
        <div className="profile-stat profile-stat--blue">
          <span className="profile-flag" aria-hidden="true">⚑</span>
          <strong>{profile.rate}</strong>
          <span>Hourly</span>
        </div>
        <div className="profile-stat profile-stat--purple">
          <Clock3 size={15} fill="currentColor" />
          <strong>{profile.hours}</strong>
          <span>Month</span>
        </div>
      </div>

      <button className="profile-contact-button" type="button" onClick={() => window.alert('This is a sample profile for the LUNA UI demo. Contact features are not connected.')}>
        View profile <ArrowUpRight size={14} />
      </button>
    </div>
  </article>
);

export const ProfilesPage: React.FC = () => (
  <div className="page-container profiles-page">
    <header className="profiles-page-header">
      <div>
        <p className="profiles-eyebrow"><UsersRound size={14} /> COMMUNITY / PROFILE EXPLORER</p>
        <h1>People with a point of view.</h1>
        <p className="profiles-intro">
          A visual profile-card concept for the LUNA community. These fictional profiles and statistics are sample content only.
        </p>
      </div>
      <span className="profiles-demo-label">DEMO CONTENT</span>
    </header>

    <section className="profiles-grid" aria-label="Sample community profiles">
      {demoProfiles.map((profile) => <ProfileCard key={profile.id} profile={profile} />)}
    </section>

    <footer className="profiles-footer">
      <span>04 PROFILES / FICTIONAL SAMPLE DATA</span>
      <span>DESIGNED FOR LUNA</span>
    </footer>
  </div>
);

export default ProfilesPage;
