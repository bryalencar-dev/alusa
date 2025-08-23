import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as storageModule from '../src/storage';

// Helper para criar buffer
const buf = Buffer.from('teste');

describe('storage adapter', () => {
  beforeEach(()=>{
    vi.resetModules();
  });

  it('local upload/delete', async () => {
    const s = storageModule.getStorage();
    const up = await s.uploadFile(buf, 'arquivo.txt', 'text/plain');
    expect(up.url).toContain('/uploads/');
    await s.deleteFile(up.url); // não deve lançar
  });

  it('s3 adapter', async () => {
    process.env.STORAGE_DRIVER = 's3';
    process.env.AWS_BUCKET = 'bkt';
    process.env.AWS_REGION = 'us-east-1';
    const send = vi.fn().mockResolvedValue({});
    vi.doMock('@aws-sdk/client-s3', () => ({
      S3Client: vi.fn(()=>({ send })),
      PutObjectCommand: vi.fn((v)=>v),
      DeleteObjectCommand: vi.fn((v)=>v)
    }));
    const mod = await import('../src/storage');
    const s = mod.getStorage();
    const up = await s.uploadFile(buf, 'foto.png', 'image/png');
    expect(up.url).toContain('https://bkt.s3.us-east-1.amazonaws.com/');
    await s.deleteFile(up.url);
    expect(send).toHaveBeenCalled();
  });

  it('cloudinary adapter', async () => {
    process.env.STORAGE_DRIVER = 'cloudinary';
    const uploader = { upload: vi.fn().mockResolvedValue({ secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/alusa/foto.png' }), destroy: vi.fn().mockResolvedValue({}) };
    vi.doMock('cloudinary', () => ({ v2: { uploader } }));
    const mod = await import('../src/storage');
    const s = mod.getStorage();
    const up = await s.uploadFile(buf, 'foto.png', 'image/png');
    expect(up.url).toContain('cloudinary.com');
    await s.deleteFile(up.url);
    expect(uploader.destroy).toHaveBeenCalled();
  });
});
