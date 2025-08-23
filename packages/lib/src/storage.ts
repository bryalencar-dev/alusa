import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, DeleteObjectCommand, type StorageClass } from '@aws-sdk/client-s3';
import { v2 as cloudinary } from 'cloudinary';

export interface UploadResult { url: string }
export interface StorageDriver {
  uploadFile(buffer: Buffer, filename: string, mimeType: string): Promise<UploadResult>;
  deleteFile(url: string): Promise<void>;
}

const driver = process.env.STORAGE_DRIVER || 'local';

function sanitizeFilename(name: string){
  return name.replace(/[^a-zA-Z0-9._-]/g,'_');
}

class LocalStorage implements StorageDriver {
  baseDir: string;
  baseUrl: string;
  constructor(){
    this.baseDir = path.join(process.cwd(), 'public', 'uploads');
    if(!fs.existsSync(this.baseDir)) fs.mkdirSync(this.baseDir, { recursive: true });
    this.baseUrl = '/uploads';
  }
  async uploadFile(buffer: Buffer, filename: string){
    const safe = Date.now()+'-'+sanitizeFilename(filename);
    const filePath = path.join(this.baseDir, safe);
    await fs.promises.writeFile(filePath, buffer);
    return { url: `${this.baseUrl}/${safe}` };
  }
  async deleteFile(url: string){
    const name = url.split('/').pop();
    if(!name) return;
    const filePath = path.join(this.baseDir, name);
    if(fs.existsSync(filePath)) await fs.promises.unlink(filePath);
  }
}

class S3Storage implements StorageDriver {
  client: S3Client;
  bucket: string;
  constructor(){
    this.bucket = process.env.AWS_BUCKET!;
    this.client = new S3Client({ region: process.env.AWS_REGION });
  }
  async uploadFile(buffer: Buffer, filename: string, mimeType: string){
    const key = Date.now()+'-'+sanitizeFilename(filename);
  const allowed = ['STANDARD','STANDARD_IA','ONEZONE_IA','INTELLIGENT_TIERING','GLACIER','DEEP_ARCHIVE','REDUCED_REDUNDANCY'] as const;
  const envVal = process.env.AWS_S3_STORAGE_CLASS || 'STANDARD';
  const storageClassEnv = (allowed as readonly string[]).includes(envVal) ? envVal : 'STANDARD';
  await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buffer, ContentType: mimeType, StorageClass: storageClassEnv as StorageClass }));
    const url = `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    return { url };
  }
  async deleteFile(url: string){
    const key = url.split('/').pop();
    if(!key) return;
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

class CloudinaryStorage implements StorageDriver {
  constructor(){
    // CLOUDINARY_URL já faz config automática
  }
  async uploadFile(buffer: Buffer, filename: string, mimeType: string){
    const b64 = `data:${mimeType};base64,${buffer.toString('base64')}`;
  const res = await cloudinary.uploader.upload(b64, { folder: 'alusa', public_id: Date.now()+'-'+sanitizeFilename(filename), transformation: [{ width: 1600, crop: 'limit' }] });
    return { url: res.secure_url };
  }
  async deleteFile(url: string){
    // extrai public_id
    const parts = url.split('/');
    const file = parts.pop();
    if(!file) return;
    const [public_id] = file.split('.');
  try { await cloudinary.uploader.destroy(`alusa/${public_id}`); } catch { /* ignore */ }
  }
}

let storage: StorageDriver;
if(driver === 's3') storage = new S3Storage();
else if(driver === 'cloudinary') storage = new CloudinaryStorage();
else storage = new LocalStorage();

export function getStorage(){ return storage; }
export const uploadFile = (buffer: Buffer, filename: string, mimeType: string) => storage.uploadFile(buffer, filename, mimeType);
export const deleteFile = (url: string) => storage.deleteFile(url);
