import React, { ReactNode, useState } from 'react';
import './FolderStack.css';
export interface FolderPanel { code:string; label:string; tone:string; content:ReactNode; }
export const FolderStack:React.FC<{panels:FolderPanel[]}> = ({panels}) => {
 const [opened,setOpened]=useState(0);
 return <div className="luna-folders">{panels.map((p,i)=><section key={p.code} className={'luna-folder '+(opened===i?'is-open':'')} style={{'--folder-tone':p.tone} as React.CSSProperties}><button className="luna-folder-tab" onClick={()=>setOpened(i)} aria-expanded={opened===i}><small>{p.code}</small><strong>{p.label}</strong></button>{opened===i&&<div className="luna-folder-content">{p.content}</div>}</section>)}</div>;
};
