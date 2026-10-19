import React from 'react';
import { ArrowRight, BookOpen, Headphones, HardDrive, ShieldCheck, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './AboutPage.css';

export const AboutPage: React.FC = () => {
  const { setActivePage } = useApp();
  return <div className="page-container about-page">
    <div className="about-eyebrow"><Sparkles size={14}/> A QUIETER WAY TO READ</div>
    <section className="about-hero">
      <div className="about-hero-copy">
        <p className="about-kicker">MEET YOUR PERSONAL READING SPACE</p>
        <h1>Make room for<br/><em>the next chapter.</em></h1>
        <p className="about-lead">LUNA brings your PDF library and listening ambitions into one calm, personal space — designed to keep your books close and your data on your own device.</p>
        <div className="about-actions">
          <button className="btn btn-primary" onClick={() => setActivePage('library')}>Explore your library <ArrowRight size={15}/></button>
          <button className="btn btn-ghost" onClick={() => setActivePage('dashboard')}>Open dashboard</button>
        </div>
      </div>
      <div className="about-art" aria-label="Decorative stack of books">
        <div className="about-orbit orbit-one"/><div className="about-orbit orbit-two"/>
        <div className="about-book book-back">NOTES<br/><small>VOL. 02</small></div>
        <div className="about-book book-mid">A LIFE<br/>IN PAGES</div>
        <div className="about-book book-front"><span>LUNA / 001</span><strong>READ<br/>SLOWLY.</strong><small>YOUR LIBRARY, YOUR SPACE</small></div>
        <span className="about-star">✳</span>
      </div>
    </section>
    <div className="about-section-heading"><span>01 / THE IDEA</span><h2>Books deserve a place of their own.</h2><p>LUNA is an offline-first college project exploring a simple idea: reading and listening tools should feel personal, useful, and respectful of your files.</p></div>
    <section className="about-pillars">
      <article><div className="about-icon"><BookOpen size={20}/></div><span>01</span><h3>Read your way</h3><p>Import PDF documents into a local library and open them in the reader, with a shelf-inspired view for browsing.</p></article>
      <article><div className="about-icon"><Headphones size={20}/></div><span>02</span><h3>Build toward audio</h3><p>Explore the future of turning reading material into listening sessions. Audio synthesis is still under development.</p></article>
      <article><div className="about-icon"><HardDrive size={20}/></div><span>03</span><h3>Keep it local</h3><p>Book files and metadata are designed to stay on your machine in local storage, rather than requiring a paid cloud service.</p></article>
    </section>
    <section className="about-mission"><div><span>02 / OUR MISSION</span><h2>Less friction between you and the words.</h2></div><p>Our mission is to build an approachable, privacy-minded reading companion that can grow from a dependable PDF library into a thoughtful ebook-and-audiobook experience. We build in small steps, test honestly, and label unfinished features clearly.</p></section>
    <section className="about-note"><ShieldCheck size={20}/><div><strong>Built with transparency</strong><p>LUNA is a work in progress. PDF import and browser-based viewing are available; text-to-speech, full audio playback, OCR, and some reading-progress features are not yet complete. The current app is intended for local single-user use, not public internet deployment.</p></div></section>
    <footer className="about-footer"><span>LUNA / OFFLINE-FIRST READING</span><button onClick={() => setActivePage('library')}>Find your next read <ArrowRight size={14}/></button></footer>
  </div>;
};
