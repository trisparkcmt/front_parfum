'use client';

import { useId, useRef, useState } from 'react';
import { UploadCloud, X } from 'lucide-react';
import AppImage from '@/components/ui/AppImage';

interface ImageUploaderProps {
  /** Called when the user selects a file */
  onFileSelect: (file: File | null) => void;
  /** Controlled preview URL (blob URL or remote URL).
   *  When provided, the component renders it instead of using internal state. */
  preview?: string | null;
  label?: string;
}

export default function ImageUploader({ onFileSelect, preview, label = 'Image principale' }: ImageUploaderProps) {
  const uid = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    onFileSelect(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFile(e.target.files?.[0]);
    // Reset so the same file can be re-selected if needed
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  // Detect blob URLs — next/image cannot handle them; use a native <img> instead
  const isBlob = preview?.startsWith('blob:');

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">
        {label}
      </p>

      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
        ref={inputRef}
        id={uid}
      />

      {preview ? (
        <>
          <div className="relative group w-full h-48 rounded-xl overflow-hidden border border-white/10">
            {isBlob ? (
              // Native <img> for blob: URLs — next/image can't load them
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <AppImage src={preview} alt="preview" fill className="object-cover" />
            )}

            {/* Hover overlay: change image */}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            >
              <span className="text-xs text-white font-medium flex items-center gap-1.5">
                <UploadCloud size={14} /> Changer l&apos;image
              </span>
            </button>

            {/* Remove button */}
            <button
              type="button"
              onClick={() => onFileSelect(null)}
              className="absolute top-2 right-2 z-10 bg-black/60 hover:bg-red-500/80 text-white rounded-full p-1 transition-colors opacity-0 group-hover:opacity-100"
              title="Supprimer l'image"
            >
              <X size={12} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 cursor-pointer w-fit bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-foreground hover:bg-white/10 hover:border-gold/40 transition-all"
          >
            <UploadCloud size={15} className="text-gold" />
            Changer l&apos;image
          </button>
        </>
      ) : (
        <>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex flex-col items-center justify-center w-full h-48 rounded-xl border-2 border-dashed transition-all cursor-pointer select-none
              ${isDragging
                ? 'border-gold bg-gold/10 scale-[1.01]'
                : 'border-white/15 bg-white/5 hover:border-gold/40 hover:bg-white/[0.08]'
              }`}
          >
            <UploadCloud
              size={28}
              className={`mb-2 transition-colors ${isDragging ? 'text-gold' : 'text-foreground/25'}`}
            />
            <span className="text-xs font-medium text-foreground/50">
              {isDragging ? 'Déposer ici' : 'Glisser-déposer ou cliquer pour choisir'}
            </span>
            <span className="text-[10px] text-foreground/30 mt-1">PNG, JPG, WEBP — max 10 Mo</span>
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 cursor-pointer w-fit bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-foreground hover:bg-white/10 hover:border-gold/40 transition-all"
          >
            <UploadCloud size={15} className="text-gold" />
            Choisir une image
          </button>
        </>
      )}
    </div>
  );
}
