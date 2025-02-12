// app/api/tts/route.js
import OpenAI from "openai";
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const fileType = formData.get('fileType'); // 'logo' or 'content'
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file received' },
        { status: 400 }
      );
    }

    // 生成文件路径
    const timestamp = new Date().getTime();
    const path = `agents/${fileType}/${file.name}`;

    // 上传到 Vercel Blob Storage
    const { url } = await put(path, file, {
      access: 'public',
      addRandomSuffix: false
    });

    return NextResponse.json({ success: true, url });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}