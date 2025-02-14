import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const fileType = formData.get('fileType'); // 'logo' or 'player' or 'attach'
    const fileHash = formData.get('fileHash');
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file received' },
        { status: 400 }
      );
    }
    // Check file size (100MB limit)
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > 100) {
      return NextResponse.json(
        { error: 'File size exceeds 100MB limit' },
        { status: 400 }
      );
    }

    // 生成文件路径
    // const timestamp = new Date().getTime();

    // Calculate file hash
    const fileBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const fileHash2 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    console.log("file's uploaded hash and current calculated hash:", fileHash, fileHash2);
    if (fileHash != fileHash2) {
      return NextResponse.json(
        { error: 'File hash not matched.' },
        { status: 400 }
      );
    }

    const fileName = fileHash2;
    const filePath = `agents/${fileType}/${fileName}`;
    // Check if file already exists in Vercel Blob Storage
    try {
      const response = await fetch(`https://ow4jqcktznwgjxis.public.blob.vercel-storage.com/${filePath}`, { method: "HEAD" });
      if (response.status === 200) {
        return NextResponse.json(
          { error: 'File with this name already exists' },
          { status: 409 }
        );
      }
    } catch (error) {
      // Error checking file existence - continue with upload
      console.error('Error checking file existence:', error);
    }

    // 上传到 Vercel Blob Storage
    const { url } = await put(filePath, file, {
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