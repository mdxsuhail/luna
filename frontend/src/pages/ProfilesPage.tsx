import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Bookmark, Clock3, LogIn, LogOut, Star, UserPlus, UsersRound } from 'lucide-react';
import { API_BASE_URL } from '../services/api';
import './ProfilesPage.css';

type UserProfile = { id:number; username:string; email:string; display_name:string; role:string; bio:string; skill:string; created_at:string };
type DemoProfile = { id:number; name:string; role:string; skill:string; rating:string; rate:string; hours:string; initials:string; avatarTone:string; cover:string; theme:'dark'|'light'; bio:string };
const demoProfiles: DemoProfile[] = [
 {id:1,name:'Liam O’Connor',role:'Visual Artist',skill:'Things',rating:'5.0',rate:'$99',hours:'12',initials:'LO',avatarTone:'coral',cover:'cosmic',theme:'dark',bio:'Visual storytelling and expressive digital artwork.'},
 {id:2,name:'Alex Turner',role:'Creative Director',skill:'Sketch',rating:'5.0',rate:'$150',hours:'24',initials:'AT',avatarTone:'sand',cover:'ember',theme:'light',bio:'Creative direction, concepts, and visual systems.'},
 {id:3,name:'Maya Chen',role:'Book Cover Designer',skill:'Editorial',rating:'4.9',rate:'$85',hours:'18',initials:'MC',avatarTone:'lilac',cover:'violet',theme:'light',bio:'Book covers and editorial design with a modern style.'},
 {id:4,name:'Noah Williams',role:'Sound Designer',skill:'Audio',rating:'4.8',rate:'$120',hours:'16',initials:'NW',avatarTone:'mint',cover:'ocean',theme:'dark',bio:'Sound design, audio textures, and immersive listening.'}
];
const initials = (name:string) => name.trim().split(/\\s+/).slice(0,2).map((part) => part[0]?.toUpperCase()).join('');
const getToken = () => window.sessionStorage.getItem('luna_profile_token') || '';

export const ProfilesPage: React.FC = () => {
 const [mode,setMode] = useState<'signin'|'signup'>('signup');
 const [user,setUser] = useState<UserProfile|null>(null);
 const [token,setToken] = useState(getToken);
 const [busy,setBusy] = useState(false);
 const [message,setMessage] = useState('');
 const [form,setForm] = useState({username:'',email:'',display_name:'',password:''});
 const [profileForm,setProfileForm] = useState({display_name:'',role:'',bio:'',skill:''});
 useEffect(() => {
  if (!token) return;
  const controller = new AbortController();
  fetch(API_BASE_URL + '/api/auth/me',{headers:{Authorization:'Bearer '+token},signal:controller.signal})
   .then(async (r) => { const p = await r.json().catch(()=>({})); if(!r.ok) throw new Error(p.detail || 'Session expired. Please sign in again.'); return p.user as UserProfile; })
   .then((u) => { setUser(u); setProfileForm({display_name:u.display_name,role:u.role,bio:u.bio,skill:u.skill}); })
   .catch((e:unknown) => { if(e instanceof Error && e.name==='AbortError') return; window.sessionStorage.removeItem('luna_profile_token'); setToken(''); setUser(null); setMessage(e instanceof Error ? e.message : 'Could not verify session.'); });
  return () => controller.abort();
 },[token]);
 const setField = (key:keyof typeof form,value:string) => setForm((old)=>({...old,[key]:value}));
 const submitAuth = async (event:React.FormEvent<HTMLFormElement>) => {
  event.preventDefault(); setMessage('');
  if(mode==='signup' && (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password))) { setMessage('Password must include at least one letter and one number.'); return; }
  setBusy(true);
  try {
   const body = mode==='signup' ? form : {username_or_email:form.username,password:form.password};
   const response = await fetch(API_BASE_URL + '/api/auth/' + mode,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   const payload = await response.json().catch(()=>({})); if(!response.ok) throw new Error(payload.detail || 'Unable to authenticate.');
   window.sessionStorage.setItem('luna_profile_token',payload.token); setToken(payload.token); setUser(payload.user);
   setProfileForm({display_name:payload.user.display_name,role:payload.user.role,bio:payload.user.bio,skill:payload.user.skill});
   setForm({username:'',email:'',display_name:'',password:''}); setMessage(mode==='signup'?'Account created and saved to the local database.':'Signed in successfully.');
  } catch(e) { setMessage(e instanceof Error ? e.message : 'Could not connect. Make sure the backend is running.'); } finally { setBusy(false); }
 };
 const saveProfile = async (event:React.FormEvent<HTMLFormElement>) => {
  event.preventDefault(); if(!token) return; setBusy(true); setMessage('');
  try { const r=await fetch(API_BASE_URL+'/api/auth/profile',{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(profileForm)}); const p=await r.json().catch(()=>({})); if(!r.ok) throw new Error(p.detail||'Could not save profile.'); setUser(p.user); setMessage('Profile changes saved to SQLite.'); }
  catch(e) { setMessage(e instanceof Error?e.message:'Could not save profile.'); } finally { setBusy(false); }
 };
 const signOut = async () => { setBusy(true); try { await fetch(API_BASE_URL+'/api/auth/signout',{method:'POST',headers:{Authorization:'Bearer '+token}}); } catch { /* Clear local session if backend is unavailable. */ } finally { window.sessionStorage.removeItem('luna_profile_token'); setToken(''); setUser(null); setMessage('You have signed out.'); setBusy(false); } };
 const card = (p:DemoProfile|UserProfile, own=false) => {
  const name='display_name' in p?p.display_name:p.name; const role=p.role; const skill=p.skill; const bio=p.bio;
  const cover='cover' in p?p.cover:'violet'; const theme='theme' in p?p.theme:'light'; const tone='avatarTone' in p?p.avatarTone:'lilac';
  return <article className={'profile-card profile-card--'+theme} key={p.id}><div className={'profile-cover profile-cover--'+cover}><span className='profile-cover-label'>LUNA / COMMUNITY</span><span className='profile-skill-chip'><span>✦</span>{skill}</span><div className={'profile-avatar profile-avatar--'+tone}>{initials(name)}</div></div><div className='profile-card-body'><div className='profile-heading-row'><div className='profile-name-block'><h2>{name}</h2><p>{role}</p></div>{own?<span className='profile-you-badge'>YOU</span>:<button className='profile-bookmark' type='button' aria-label={'Sample '+name+' profile'}><Bookmark size={16}/></button>}</div>{bio&&<p className='profile-card-bio'>{bio}</p>}{own?<div className='profile-account-meta'><span>@{'username' in p?p.username:''}</span><span>Account profile</span></div>:<div className='profile-stats'><div className='profile-stat'><Star size={15} fill='currentColor'/><strong>{p.rating}</strong><span>Rating</span></div><div className='profile-stat profile-stat--blue'><span className='profile-flag'>⚑</span><strong>{p.rate}</strong><span>Hourly</span></div><div className='profile-stat profile-stat--purple'><Clock3 size={15} fill='currentColor'/><strong>{p.hours}</strong><span>Month</span></div></div>}{!own&&<button className='profile-contact-button' type='button' onClick={()=>setMessage('This is a fictional sample profile; contact features are not connected.')}>View profile <ArrowUpRight size={14}/></button>}</div></article>;
 };
 return <div className='page-container profiles-page'>
  <header className='profiles-page-header'><div><p className='profiles-eyebrow'><UsersRound size={14}/> COMMUNITY / PROFILE EXPLORER</p><h1>People with a point of view.</h1><p className='profiles-intro'>Create a LUNA account, keep your profile in the local database, and explore the sample creative community.</p></div><span className='profiles-demo-label'>LOCAL ACCOUNT DEMO</span></header>
  {!user ? <section className='profiles-auth-layout'><div className='profiles-auth-art'><span className='profiles-auth-kicker'>YOUR SPACE, YOUR STORIES</span><div className='profiles-art-orb profiles-art-orb--one'/><div className='profiles-art-orb profiles-art-orb--two'/><div className='profiles-art-copy'><span>LUNA</span><h2>A profile that feels like you.</h2><p>Your details are saved to this LUNA installation’s SQLite database.</p></div></div>
   <div className='profiles-auth-panel'><div className='profiles-auth-tabs'><button type='button' className={mode==='signup'?'is-active':''} onClick={()=>{setMode('signup');setMessage('');}}>Create account</button><button type='button' className={mode==='signin'?'is-active':''} onClick={()=>{setMode('signin');setMessage('');}}>Sign in</button></div><h2>{mode==='signup'?'Join the community':'Welcome back'}</h2><p className='profiles-auth-subtitle'>{mode==='signup'?'Set up your profile in a few steps.':'Sign in with your username or email.'}</p>
    <form className='profiles-auth-form' onSubmit={submitAuth}>{mode==='signup'&&<><label>Display name<input required minLength={2} maxLength={60} autoComplete='name' value={form.display_name} onChange={e=>setField('display_name',e.target.value)} placeholder='How people see you'/></label><label>Username<input required minLength={3} maxLength={24} pattern='[A-Za-z0-9_-]+' autoComplete='username' value={form.username} onChange={e=>setField('username',e.target.value)} placeholder='your_username'/></label><label>Email address<input required type='email' maxLength={254} autoComplete='email' value={form.email} onChange={e=>setField('email',e.target.value)} placeholder='you@example.com'/></label></>}{mode==='signin'&&<label>Username or email<input required autoComplete='username' value={form.username} onChange={e=>setField('username',e.target.value)} placeholder='Username or email address'/></label>}<label>Password<input required type='password' minLength={mode==='signup'?10:1} maxLength={128} autoComplete={mode==='signup'?'new-password':'current-password'} value={form.password} onChange={e=>setField('password',e.target.value)} placeholder={mode==='signup'?'At least 10 characters, with a letter and number':'Your password'}/></label>{mode==='signup'&&<p className='profiles-password-note'>Use 10–128 characters, including at least one letter and one number. Passwords are hashed before storage.</p>}<button className='profiles-auth-submit' type='submit' disabled={busy}>{mode==='signup'?<UserPlus size={16}/>:<LogIn size={16}/ >}{busy?'Please wait…':mode==='signup'?'Create account':'Sign in'}</button></form>
    {message&&<p className='profiles-feedback' role='status'>{message}</p>}<p className='profiles-privacy-note'>Local development mode · email verification and password reset are not configured.</p></div></section>
   : <section className='profiles-account-layout'><div className='profiles-account-card'><div className='profiles-account-top'><div><span className='profiles-eyebrow'>SIGNED IN AS</span><h2>{user.display_name}</h2><p>@{user.username} · {user.email}</p></div><button type='button' className='profiles-signout' onClick={signOut} disabled={busy}><LogOut size={15}/> Sign out</button></div><form className='profiles-edit-form' onSubmit={saveProfile}><h3>Edit your profile</h3><label>Display name<input required minLength={2} maxLength={60} value={profileForm.display_name} onChange={e=>setProfileForm({...profileForm,display_name:e.target.value})}/></label><label>Role<input required minLength={2} maxLength={60} value={profileForm.role} onChange={e=>setProfileForm({...profileForm,role:e.target.value})} placeholder='Reader, student, designer…'/></label><label>Skill or interest<input required minLength={2} maxLength={40} value={profileForm.skill} onChange={e=>setProfileForm({...profileForm,skill:e.target.value})}/></label><label>Bio<textarea maxLength={300} rows={3} value={profileForm.bio} onChange={e=>setProfileForm({...profileForm,bio:e.target.value})} placeholder='A little about you'/></label><button className='profiles-auth-submit' type='submit' disabled={busy}>Save profile changes</button></form>{message&&<p className='profiles-feedback' role='status'>{message}</p>}</div><div className='profiles-account-preview'><p className='profiles-eyebrow'>YOUR PROFILE CARD</p>{card(user,true)}</div></section>}
  <section className='profiles-community-section'><div className='profiles-section-heading'><div><p className='profiles-eyebrow'>THE COMMUNITY</p><h2>Meet the creatives</h2></div><span>FICTIONAL SAMPLE PROFILES</span></div><div className='profiles-grid'>{demoProfiles.map(p=>card(p))}</div></section>
  <footer className='profiles-footer'><span>{user?'SIGNED-IN ACCOUNT + 04 SAMPLE PROFILES':'04 FICTIONAL SAMPLE PROFILES'}</span><span>DESIGNED FOR LUNA</span></footer>
 </div>;
};
export default ProfilesPage;