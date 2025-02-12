'use client';

import Image from 'next/image'
import Link from 'next/link'
import styles from './page.module.css'
// import xLogo from 'assets/xLogo.png';
// import telegram from 'assets/telegram.png';
// import discord from 'assets/discord.png';
// import gitbook from 'assets/gitbook.png';

export default function Footer() {  
  return (
    <div className={`${styles['footer']} flex-col justify-center align-center`}>
      <div className={`${styles['image-wrapper_20']} flex-row justify-between`}>
        <Link target="_blank" href="https://x.com/0xaimaster" rel="noopener noreferrer">     
          <Image
            className={`${styles['label_17']}`}
            src={
              require('assets/img/x.png')
            }
          />
        </Link>
        <Link target="_blank" href="https://github.com/" rel="noopener noreferrer"> 
          <Image
            className={`${styles['label_17']}`}
            src={
              require('assets/img/github.png')
            }
          />
        </Link>
      </div>
      <span className={`${styles['text_64']}`}>DeAI Developer Community©2021-2024</span>
    </div>
  )
}
