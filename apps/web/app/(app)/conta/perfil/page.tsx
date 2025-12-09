'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  fetchCurrentProfile,
  updateCurrentProfile,
  type UpdateProfilePayload,
} from '@/features/account/services/profile-service';
import type { UserProfileWithSchool } from '@/features/account/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { pushToast } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PROFILE_LOCALE_OPTIONS, PROFILE_THEME_OPTIONS } from '@/lib/profile-preferences';
import { updateSchool, updateSchoolAddress, type SchoolAddress } from '@/features/account/services/profile-service';
import { EditActions } from '@/components/ui/edit-actions';
import { disabledInputClasses, formatCepBR, formatCpfCnpjBR, formatPhoneBR, isValidCepBR, isValidCpfCnpjBR, isValidPhoneBR, onlyDigits } from '@/lib/formatters';
import { ImageCropDialog } from '@/components/image/ImageCropDialog';
import { useUserStore } from '@/lib/stores/user-store';
import { Edit } from '@/components/icons/icons';

export default function ContaPerfilPage() {
  const [profile, setProfile] = useState<UserProfileWithSchool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edição - Dados pessoais
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);

  // Edição - Preferências
  const [isEditingPrefs, setIsEditingPrefs] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // Form fields - pessoais
  const [formName, setFormName] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formBio, setFormBio] = useState('');

  // Form fields - preferências
  const [formLocale, setFormLocale] = useState('pt-BR');
  const [formTheme, setFormTheme] = useState('system');

  // Foto de perfil
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  // Crop de imagem
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  // User store para atualizar avatar globalmente
  const updateUser = useUserStore((state) => state.updateUser);

  // Escola (Conta)
  const [isEditingSchool, setIsEditingSchool] = useState(false);
  const [isSavingSchool, setIsSavingSchool] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [schoolCpfCnpj, setSchoolCpfCnpj] = useState('');

  // Endereço da escola
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [schoolAddress, setSchoolAddress] = useState<SchoolAddress>({ street: '', number: '', district: '', city: '', state: '', cep: '' });

  useEffect(() => {
    let mounted = true;
    fetchCurrentProfile()
      .then((data) => {
        if (!mounted) return;
        setProfile(data);
        setLoading(false);
        // Inicializa formulários
        setFormName(data.name ?? '');
        setFormTelefone(data.telefone ? formatPhoneBR(data.telefone) : '');
        setFormBio(data.bio ?? '');
        setFormLocale(data.locale ?? 'pt-BR');
        setFormTheme(data.theme ?? 'system');
        setSchoolName(data.school?.name ?? '');
        setSchoolCpfCnpj(data.school?.cpfCnpj ?? '');
        if (data.school?.address) {
          setSchoolAddress({
            street: data.school.address.street || '',
            number: data.school.address.number || '',
            district: data.school.address.district || '',
            city: data.school.address.city || '',
            state: data.school.address.state || '',
            cep: data.school.address.cep || '',
          });
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Erro ao carregar perfil');
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Handler para selecionar arquivo e abrir crop
  const handleFileSelect = useCallback((file: File) => {
    console.log('📸 handleFileSelect chamado com arquivo:', file.name, file.type, file.size);
    
    if (!file.type.startsWith('image/')) {
      console.error('❌ Tipo de arquivo inválido:', file.type);
      pushToast({ title: 'Erro', description: 'Selecione uma imagem válida (JPG, PNG ou WebP)', variant: 'error' });
      return;
    }

    const MAX_SIZE = 15 * 1024 * 1024; // 15MB
    if (file.size > MAX_SIZE) {
      console.error('❌ Arquivo muito grande:', file.size);
      pushToast({ title: 'Erro', description: 'A imagem deve ter no máximo 15MB', variant: 'error' });
      return;
    }

    console.log('✅ Arquivo válido, iniciando leitura...');
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      console.log('✅ Arquivo carregado, tamanho do data URL:', typeof result === 'string' ? result.length : 0);
      if (typeof result === 'string') {
        setImageToCrop(result);
        setCropDialogOpen(true);
        console.log('✅ Dialog de crop aberto!');
      }
    };
    reader.onerror = (error) => {
      console.error('❌ Erro ao ler arquivo:', error);
      pushToast({ title: 'Erro', description: 'Não foi possível carregar a imagem', variant: 'error' });
    };
    reader.readAsDataURL(file);
  }, []);

  // Handler após aplicar crop
  const handleCropApply = useCallback(async (result: { blob: Blob; dataUrl: string }) => {
    console.log('🎨 handleCropApply chamado!', {
      hasProfile: !!profile,
      blobSize: result.blob.size,
      dataUrlLength: result.dataUrl.length
    });
    
    if (!profile) {
      console.error('❌ Profile não disponível');
      return;
    }
    
    setIsUploadingPhoto(true);
    setPhotoPreview(result.dataUrl);
    setCropDialogOpen(false);
    console.log('📤 Iniciando upload...');
    
    try {
      const form = new FormData();
      form.append('file', result.blob, 'profile.jpg');
      console.log('📤 Enviando para /api/upload...');
      
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const json = await res.json();
      console.log('📥 Resposta do upload:', { ok: res.ok, status: res.status, json });
      
      if (!res.ok) throw new Error(json?.error || 'Falha no upload');

      console.log('✅ Upload bem-sucedido! URL:', json.url);
      console.log('📝 Atualizando perfil APENAS com foto...');

      // Atualizar APENAS a foto via API diretamente
      const res2 = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foto: json.url }),
      });

      if (!res2.ok) {
        const errorJson = await res2.json();
        console.error('❌ Erro ao atualizar foto no perfil:', errorJson);
        throw new Error(errorJson?.error || 'Falha ao atualizar foto no perfil');
      }

      const updated = await res2.json();
      console.log('✅ Resposta da API:', updated);
      
      console.log('✅ Perfil atualizado!', updated);
      setProfile((prev) => (prev ? { ...prev, ...updated } : updated as UserProfileWithSchool));

      // Atualizar store global e disparar evento para atualizar header/sidebar
      try {
        console.log('🔄 Atualizando store global...');
        updateUser({ foto: json.url });
        window.dispatchEvent(new CustomEvent('user:updated', { 
          detail: { foto: json.url } 
        }));
        console.log('✅ Store atualizada e evento disparado!');
      } catch (storeError) {
        console.error('⚠️ Erro ao atualizar store (não-crítico):', storeError);
      }

      pushToast({ title: 'Sucesso', description: 'Foto atualizada com sucesso!' });
    } catch (e) {
      console.error('❌ Erro no handleCropApply:', e);
      const message = e instanceof Error ? e.message : 'Falha ao enviar foto';
      pushToast({ title: 'Erro', description: message, variant: 'error' });
    } finally {
      setIsUploadingPhoto(false);
      setPhotoPreview(null);
      setImageToCrop(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      console.log('🏁 handleCropApply finalizado');
    }
  }, [profile, updateUser]);

  const handleRemovePhoto = useCallback(async () => {
    if (!profile) return;
    setIsUploadingPhoto(true);
    try {
      // Atualizar APENAS a foto via API diretamente
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foto: null }),
      });

      if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(errorJson?.error || 'Falha ao remover foto');
      }

      const updated = await res.json();
      setProfile((prev) => (prev ? { ...prev, ...updated } : updated as UserProfileWithSchool));

      // Atualizar store global e disparar evento para atualizar header/sidebar
      try {
        updateUser({ foto: null });
        window.dispatchEvent(new CustomEvent('user:updated', { 
          detail: { foto: null } 
        }));
      } catch {
        // Ignore errors - não é crítico
      }

      pushToast({ title: 'Sucesso', description: 'Foto removida com sucesso!' });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Falha ao remover foto';
      pushToast({ title: 'Erro', description: message, variant: 'error' });
    } finally {
      setIsUploadingPhoto(false);
    }
  }, [profile, updateUser]);

  // Loading state
  if (loading) {
    return (
      <section className="space-y-6 pb-8">
        <header>
          <div className="h-7 w-56"><Skeleton className="h-7 w-56" /></div>
        </header>
        <Card className="border bg-white rounded-xl shadow-sm">
          <CardHeader className="pb-2">
            <div className="space-y-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-64" />
            </div>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </CardContent>
        </Card>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border bg-white rounded-xl shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-8 w-20" />
              </div>
              <Skeleton className="h-3 w-64 mt-1" />
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        ))}
      </section>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <section className="space-y-6">
        <div className="text-sm text-destructive">{error || 'Erro ao carregar perfil.'}</div>
      </section>
    );
  }

  async function handleSavePersonal() {
    if (!profile) return;
    setIsSavingPersonal(true);
    try {
      // Garantir valores válidos para locale e theme
      const validLocale = (profile.locale === 'pt-BR' || profile.locale === 'en-US') ? profile.locale : 'pt-BR';
      const validTheme = (profile.theme === 'system' || profile.theme === 'light' || profile.theme === 'dark') ? profile.theme : 'system';

      const payload: UpdateProfilePayload = {
        name: formName,
        telefone: formTelefone,
        bio: formBio,
        locale: validLocale as UpdateProfilePayload['locale'],
        theme: validTheme as UpdateProfilePayload['theme'],
      };
      const updated = await updateCurrentProfile(payload);
      setProfile((prev) => (prev ? { ...prev, ...updated } : ({ ...updated, school: profile.school } as UserProfileWithSchool)));
      pushToast({ title: 'Sucesso', description: 'Perfil atualizado.' });
      setIsEditingPersonal(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Falha ao salvar';
      pushToast({ title: 'Erro', description: message, variant: 'error' });
    } finally {
      setIsSavingPersonal(false);
    }
  }

  async function handleSavePrefs() {
    if (!profile) return;
    setIsSavingPrefs(true);
    try {
      const payload: UpdateProfilePayload = {
        name: profile.name,
        telefone: profile.telefone ?? undefined,
        bio: profile.bio ?? undefined,
        locale: formLocale as UpdateProfilePayload['locale'],
        theme: formTheme as UpdateProfilePayload['theme'],
      };
      const updated = await updateCurrentProfile(payload);
      setProfile((prev) => (prev ? { ...prev, ...updated } : ({ ...updated, school: profile.school } as UserProfileWithSchool)));
      pushToast({ title: 'Sucesso', description: 'Preferências atualizadas.' });
      setIsEditingPrefs(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Falha ao salvar';
      pushToast({ title: 'Erro', description: message, variant: 'error' });
    } finally {
      setIsSavingPrefs(false);
    }
  }

  async function handleSaveSchool() {
    setIsSavingSchool(true);
    try {
      const updated = await updateSchool({ name: schoolName, cpfCnpj: schoolCpfCnpj });
      setProfile((prev) => (prev ? { ...prev, school: { ...prev.school, ...updated } as UserProfileWithSchool['school'] } : prev));
      pushToast({ title: 'Sucesso', description: 'Dados da escola atualizados.' });
      setIsEditingSchool(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Falha ao salvar';
      pushToast({ title: 'Erro', description: message, variant: 'error' });
    } finally {
      setIsSavingSchool(false);
    }
  }

  async function handleSaveAddress() {
    setIsSavingAddress(true);
    try {
      const updated = await updateSchoolAddress(schoolAddress);
      setSchoolAddress(updated);
      pushToast({ title: 'Sucesso', description: 'Endereço atualizado.' });
      setIsEditingAddress(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Falha ao salvar';
      pushToast({ title: 'Erro', description: message, variant: 'error' });
    } finally {
      setIsSavingAddress(false);
    }
  }

  const personalDirty =
    formName.trim() !== (profile.name ?? '') ||
    onlyDigits(formTelefone) !== onlyDigits(profile.telefone ?? '') ||
    (formBio ?? '') !== (profile.bio ?? '');

  const prefsDirty = formLocale !== profile.locale || formTheme !== profile.theme;

  const schoolDirty =
    schoolName.trim() !== (profile.school?.name ?? '') ||
    onlyDigits(schoolCpfCnpj) !== onlyDigits(profile.school?.cpfCnpj ?? '');

  const addr = profile.school?.address ?? {};
  const addressDirty =
    (schoolAddress.street || '') !== (addr.street || '') ||
    (schoolAddress.number || '') !== (addr.number || '') ||
    (schoolAddress.district || '') !== (addr.district || '') ||
    (schoolAddress.city || '') !== (addr.city || '') ||
    (schoolAddress.state || '') !== (addr.state || '') ||
    onlyDigits(schoolAddress.cep || '') !== onlyDigits(addr.cep || '');

  return (
    <section
      aria-labelledby="perfil-title"
      className="space-y-6 rounded-lg bg-white p-6 md:p-8"
    >
      <header className="space-y-1">
        <h2
          id="perfil-title"
          className="text-xl md:text-2xl font-medium tracking-tight text-gray-900"
        >
          Altere seus dados
        </h2>
        <p className="text-sm text-gray-600">
          Atualize sua foto de perfil, dados pessoais e informações da escola.
        </p>
      </header>

      {/* Foto do perfil */}
      <Card className="border bg-white rounded-xl shadow-sm">
        <CardHeader className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">Foto do perfil</CardTitle>
              <CardDescription className="mt-1 text-sm text-gray-600">
                Personalize sua foto de perfil. Recomendamos uma imagem quadrada de alta qualidade.
              </CardDescription>
            </div>
            {isUploadingPhoto && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-700" />
                <span className="text-sm font-medium">Enviando...</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-6 py-6">
          <div className="flex items-start gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-2 border-gray-200 shadow-sm">
                <AvatarImage 
                  src={photoPreview ?? profile.foto ?? undefined} 
                  alt={profile.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-2xl font-semibold">
                  {profile.name?.[0]?.toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>
              {isUploadingPhoto && (
                <div className="absolute inset-0 bg-white/80 rounded-full grid place-items-center backdrop-blur-sm">
                  <div className="h-8 w-8 rounded-full border-3 border-violet-300 border-t-violet-600 animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900 mb-1">Requisitos da imagem:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs text-gray-500">
                  <li>Formatos aceitos: JPG, PNG ou WebP</li>
                  <li>Tamanho máximo: 15MB</li>
                  <li>Recomendado: imagem quadrada com pelo menos 512x512px</li>
                </ul>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="sr-only"
                  aria-label="Selecionar foto de perfil"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                    e.target.value = '';
                  }}
                />
                <Button 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isUploadingPhoto}
                  className="bg-violet-600 text-white hover:bg-violet-700"
                >
                  {isUploadingPhoto ? 'Processando...' : profile.foto ? 'Alterar foto' : 'Adicionar foto'}
                </Button>
                {profile.foto && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleRemovePhoto} 
                    disabled={isUploadingPhoto}
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                  >
                    Remover foto
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 1. Dados pessoais */}
      <Card className={`bg-white rounded-xl border shadow-sm transition-all duration-200 ${
        isEditingPersonal
          ? 'border-indigo-400 shadow-indigo-100 ring-2 ring-indigo-100'
          : 'border-gray-200'
      }`}>
        <CardHeader className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">Dados pessoais</CardTitle>
              <CardDescription className="mt-1 text-sm text-gray-600">
                Informações básicas e de contato do usuário
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isEditingPersonal && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                  <Edit className="h-4 w-4" />
                  <span className="text-sm font-medium">Modo de edição</span>
                </div>
              )}
              <EditActions
                isEditing={isEditingPersonal}
                isSaving={isSavingPersonal}
                onEdit={() => {
                  setIsEditingPersonal(true);
                  setTimeout(() => nameInputRef.current?.focus(), 0);
                }}
                onCancel={() => {
                  setFormName(profile.name ?? '');
                  setFormTelefone(profile.telefone ? formatPhoneBR(profile.telefone) : '');
                  setFormBio(profile.bio ?? '');
                  setIsEditingPersonal(false);
                }}
                onSave={handleSavePersonal}
                saveDisabled={!personalDirty || (formTelefone.length > 0 && !isValidPhoneBR(formTelefone))}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-6 grid gap-4 sm:grid-cols-2">
          <div className="grid grid-cols-2 gap-4 sm:col-span-2">
            <div>
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                disabled={!isEditingPersonal}
                ref={nameInputRef}
                className={disabledInputClasses(!isEditingPersonal)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">E-mail</Label>
              <Input
                value={profile.email}
                disabled
                className="bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Telefone</Label>
              <Input
                value={formTelefone}
                onChange={(e) => setFormTelefone(formatPhoneBR(e.target.value))}
                placeholder="(00) 00000-0000"
                disabled={!isEditingPersonal}
                className={disabledInputClasses(!isEditingPersonal)}
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Bio</Label>
              <Textarea
                value={formBio}
                onChange={(e) => setFormBio(e.target.value)}
                rows={3}
                disabled={!isEditingPersonal}
                className={disabledInputClasses(!isEditingPersonal)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Dados da escola */}
      <Card className={`bg-white rounded-xl border shadow-sm transition-all duration-200 ${
        isEditingSchool
          ? 'border-indigo-400 shadow-indigo-100 ring-2 ring-indigo-100'
          : 'border-gray-200'
      }`}>
        <CardHeader className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">Dados da escola</CardTitle>
              <CardDescription className="mt-1 text-sm text-gray-600">
                Informações da instituição vinculada à sua conta
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isEditingSchool && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                  <Edit className="h-4 w-4" />
                  <span className="text-sm font-medium">Modo de edição</span>
                </div>
              )}
              <EditActions
                isEditing={isEditingSchool}
                isSaving={isSavingSchool}
                onEdit={() => setIsEditingSchool(true)}
                onCancel={() => {
                  setSchoolName(profile.school?.name || '');
                  setSchoolCpfCnpj(profile.school?.cpfCnpj || '');
                  setIsEditingSchool(false);
                }}
                onSave={handleSaveSchool}
                saveDisabled={!schoolDirty || (schoolCpfCnpj ? !isValidCpfCnpjBR(schoolCpfCnpj) : false)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-6 grid gap-2 sm:grid-cols-2">
          <div>
            <Label className="text-xs text-muted-foreground">Nome da escola</Label>
            <Input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} disabled={!isEditingSchool} className={disabledInputClasses(!isEditingSchool)} />
            <Label className="text-xs text-muted-foreground mt-2">CNPJ/CPF</Label>
            <Input value={formatCpfCnpjBR(schoolCpfCnpj)} onChange={(e) => setSchoolCpfCnpj(onlyDigits(e.target.value))} disabled={!isEditingSchool} className={disabledInputClasses(!isEditingSchool)} />
            <Label className="text-xs text-muted-foreground mt-2">Status</Label>
            <Input
              value={profile.school?.status || 'Não informado'}
              disabled
              className="bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">ID da escola</Label>
            <Input
              value={profile.school?.id || 'Não informado'}
              disabled
              className="bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed"
            />
            <Label className="text-xs text-muted-foreground mt-2">Proprietário</Label>
            <Input
              value={profile.school?.ownerUserId || 'Não informado'}
              disabled
              className="bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed"
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. Endereço */}
      <Card className={`bg-white rounded-xl border shadow-sm transition-all duration-200 ${
        isEditingAddress
          ? 'border-indigo-400 shadow-indigo-100 ring-2 ring-indigo-100'
          : 'border-gray-200'
      }`}>
        <CardHeader className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">Endereço da escola</CardTitle>
              <CardDescription className="mt-1 text-sm text-gray-600">
                Localização física da instituição
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isEditingAddress && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                  <Edit className="h-4 w-4" />
                  <span className="text-sm font-medium">Modo de edição</span>
                </div>
              )}
              <EditActions
                isEditing={isEditingAddress}
                isSaving={isSavingAddress}
                onEdit={() => setIsEditingAddress(true)}
                onCancel={() => {
                  const a = profile.school?.address || {};
                  setSchoolAddress({
                    street: a.street || '',
                    number: a.number || '',
                    district: a.district || '',
                    city: a.city || '',
                    state: a.state || '',
                    cep: a.cep || '',
                  });
                  setIsEditingAddress(false);
                }}
                onSave={async () => {
                  await handleSaveAddress();
                  // sync back into profile for dirty check
                  setProfile((prev) =>
                    prev
                      ? {
                          ...prev,
                          school: prev.school
                            ? {
                                ...prev.school,
                                address: { ...schoolAddress },
                              }
                            : prev.school,
                        }
                      : prev,
                  );
                }}
                saveDisabled={!addressDirty || (schoolAddress.cep ? !isValidCepBR(schoolAddress.cep) : false)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-6 grid gap-2 sm:grid-cols-2">
          <div>
            <Label className="text-xs text-muted-foreground">Rua</Label>
            <Input value={schoolAddress.street || ''} onChange={(e) => setSchoolAddress({ ...schoolAddress, street: e.target.value })} disabled={!isEditingAddress} className={disabledInputClasses(!isEditingAddress)} />
            <Label className="text-xs text-muted-foreground mt-2">Número</Label>
            <Input value={schoolAddress.number || ''} onChange={(e) => setSchoolAddress({ ...schoolAddress, number: e.target.value })} disabled={!isEditingAddress} className={disabledInputClasses(!isEditingAddress)} />
            <Label className="text-xs text-muted-foreground mt-2">Bairro</Label>
            <Input value={schoolAddress.district || ''} onChange={(e) => setSchoolAddress({ ...schoolAddress, district: e.target.value })} disabled={!isEditingAddress} className={disabledInputClasses(!isEditingAddress)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Cidade</Label>
            <Input value={schoolAddress.city || ''} onChange={(e) => setSchoolAddress({ ...schoolAddress, city: e.target.value })} disabled={!isEditingAddress} className={disabledInputClasses(!isEditingAddress)} />
            <Label className="text-xs text-muted-foreground mt-2">Estado</Label>
            <Input value={(schoolAddress.state || '').toUpperCase()} onChange={(e) => setSchoolAddress({ ...schoolAddress, state: e.target.value.toUpperCase().slice(0, 2) })} disabled={!isEditingAddress} className={disabledInputClasses(!isEditingAddress)} />
            <Label className="text-xs text-muted-foreground mt-2">CEP</Label>
            <Input value={formatCepBR(schoolAddress.cep || '')} onChange={(e) => setSchoolAddress({ ...schoolAddress, cep: onlyDigits(e.target.value) })} disabled={!isEditingAddress} className={disabledInputClasses(!isEditingAddress)} />
          </div>
        </CardContent>
      </Card>

      {/* 4. Preferências */}
      <Card className={`bg-white rounded-xl border shadow-sm transition-all duration-200 ${
        isEditingPrefs
          ? 'border-indigo-400 shadow-indigo-100 ring-2 ring-indigo-100'
          : 'border-gray-200'
      }`}>
        <CardHeader className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">Preferências</CardTitle>
              <CardDescription className="mt-1 text-sm text-gray-600">
                Personalize sua experiência na plataforma
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isEditingPrefs && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                  <Edit className="h-4 w-4" />
                  <span className="text-sm font-medium">Modo de edição</span>
                </div>
              )}
              <EditActions
                isEditing={isEditingPrefs}
                isSaving={isSavingPrefs}
                onEdit={() => setIsEditingPrefs(true)}
                onCancel={() => {
                  setFormLocale(profile.locale ?? 'pt-BR');
                  setFormTheme(profile.theme ?? 'system');
                  setIsEditingPrefs(false);
                }}
                onSave={handleSavePrefs}
                saveDisabled={!prefsDirty}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-6 grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs text-muted-foreground">Tema</Label>
            {isEditingPrefs ? (
              <Select value={formTheme} onValueChange={setFormTheme}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROFILE_THEME_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={profile.theme || 'system'}
                disabled
                className="bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed"
              />
            )}
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Idioma</Label>
            {isEditingPrefs ? (
              <Select value={formLocale} onValueChange={setFormLocale}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROFILE_LOCALE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={profile.locale || 'pt-BR'}
                disabled
                className="bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de crop de imagem */}
      {(() => {
        console.log('🖼️ Renderizando ImageCropDialog:', { 
          cropDialogOpen, 
          hasImageToCrop: !!imageToCrop,
          imageToCropLength: imageToCrop?.length 
        });
        return null;
      })()}
      <ImageCropDialog
        open={cropDialogOpen}
        onOpenChange={(open) => {
          console.log('📊 Dialog onOpenChange:', open);
          setCropDialogOpen(open);
        }}
        src={imageToCrop}
        aspect={1}
        round={true}
        maxZoom={3}
        exportMime="image/jpeg"
        exportQuality={0.9}
        exportSize={512}
        title="Ajustar foto de perfil"
        onApply={handleCropApply}
      />
    </section>
  );
}
