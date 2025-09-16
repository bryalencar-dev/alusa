import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

async function ensureDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch {
    // Diretório já existe, ignorar erro
  }
}

function validateFile(file: File): { valid: boolean; error?: string } {
  // Validar tipo MIME
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Tipo de arquivo não permitido. Use JPG, PNG ou WebP.' };
  }

  // Validar tamanho
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'Arquivo muito grande. Máximo 5MB.' };
  }

  // Validar extensão
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: 'Extensão de arquivo não permitida.' };
  }

  return { valid: true };
}

export async function POST(req: Request) {
  try {
    await ensureDir();
    
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    // Validar arquivo
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Gerar nome único
    const ext = path.extname(file.name).toLowerCase();
    const filename = `${randomUUID()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    // Salvar arquivo
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, new Uint8Array(arrayBuffer));

    return NextResponse.json({ 
      url: `/uploads/${filename}`,
      size: file.size,
      type: file.type 
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor. Tente novamente.' 
    }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { url } = await req.json();
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL inválida.' }, { status: 400 });
    }

    // Validar que é um caminho de upload válido
    if (!url.startsWith('/uploads/')) {
      return NextResponse.json({ error: 'Caminho não permitido.' }, { status: 400 });
    }

    // Construir caminho do arquivo
    const filename = path.basename(url);
    const filePath = path.join(UPLOAD_DIR, filename);

    // Verificar se o arquivo está dentro do diretório permitido
    const resolvedPath = path.resolve(filePath);
    const resolvedUploadDir = path.resolve(UPLOAD_DIR);
    
    if (!resolvedPath.startsWith(resolvedUploadDir)) {
      return NextResponse.json({ error: 'Caminho não permitido.' }, { status: 400 });
    }

    // Tentar deletar arquivo (não falha se não existir)
    try {
      await fs.unlink(filePath);
    } catch {
      // Arquivo não existe, tudo bem
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor.' 
    }, { status: 500 });
  }
}