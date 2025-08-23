"use client";
import { signOut } from 'next-auth/react';
import React from 'react';

export default function LogoutButton(){
  return (
    <button onClick={() => signOut({ callbackUrl: '/login' })} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', padding:'0.3rem 0.6rem', borderRadius:4, cursor:'pointer', fontSize:12 }}>
      Sair
    </button>
  );
}