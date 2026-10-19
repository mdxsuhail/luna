import React, { useMemo, useState } from 'react';
import { Book } from '../../types';
import './ShelfCarousel.css';

export const ShelfCarousel: React.FC<{books:Book[];onOpen:(book:Book)=>void}> = ({books,onOpen}) => {
 const [active,setActive]=useState(0);
 const list=useMemo(()=>books,[books]);
 React.useEffect(()=>setActive(0),[books.length]);
 if(!list.length)return <div className="luna-shelf-empty">Your shelf is waiting. Import a PDF to place your first book here.</div>;
 const index=Math.min(active,list.length-1), current=list[index];
 const hue=(s:string)=>[...s].reduce((a,c)=>(a*31+c.charCodeAt(0))%360,7);
 return <section className="luna-shelf">
  <div className="luna-shelf-top"><div><span>THE PERSONAL ARCHIVE</span><h2>Your reading shelf</h2></div><small>{list.length.toString().padStart(2,'0')} BOOK{list.length===1?'':'S'}</small></div>
  <div className="luna-shelf-chips" aria-label="Choose a book">{list.map((b,i)=><button key={b.id} className={i===index?'selected':''} onClick={()=>setActive(i)} aria-pressed={i===index}>{b.title}</button>)}</div>
  <div className="luna-shelf-row">{list.map((b,i)=><button key={b.id} className={'luna-spine '+(i===index?'active':'')} style={{'--book-hue':hue(b.title)} as React.CSSProperties} onClick={()=>i===index?onOpen(b):setActive(i)} aria-label={i===index?'Open '+b.title:'Select '+b.title} aria-pressed={i===index}>{i===index?<div className="luna-cover"><span>LUNA / PDF</span><strong>{b.title}</strong><small>{b.totalPages||b.pageCount||'—'} pages</small></div>:<span className="luna-spine-title">{b.title}</span>}</button>)}</div>
  <div className="luna-shelf-meta"><button onClick={()=>setActive(Math.max(0,index-1))} disabled={index===0} aria-label="Previous book">←</button><div><h3>{current.title}</h3><p>{current.author||current.originalFilename||'PDF DOCUMENT'}</p><small>{current.totalPages||current.pageCount||'Unknown'} pages · {current.format}</small></div><button onClick={()=>setActive(Math.min(list.length-1,index+1))} disabled={index===list.length-1} aria-label="Next book">→</button></div>
 </section>;
};
