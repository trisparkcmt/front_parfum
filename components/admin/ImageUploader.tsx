'use client';

import { useState, useId, useRef } from 'react';
import { ImageIcon, UploadCloud } from 'lucide-react';
import AppImage from '@/components/ui/AppImage';

interface ImageUploaderProps {
  onFileSelect: (file: File) => void;
  initialImage?: string | null;
}

export default function ImageUploader({ onFileSelect, initialImage }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string>(initialImage || '');
  const uid = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onFileSelect(file);
    setPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">Main Image</p>

      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
        ref={inputRef}
        id={uid}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 cursor-pointer w-fit bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-foreground hover:bg-white/10 hover:border-gold/40 transition-all"
      >
        <UploadCloud size={15} className="text-gold" />
        Choose an Image
      </button>

      {preview ? (
        <div className="relative group w-full h-48 rounded-xl overflow-hidden border border-white/10">
          <AppImage src={preview} alt="preview" fill className="object-cover" />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
          >
            <span className="text-xs text-white font-medium flex items-center gap-1">
              <UploadCloud size={14} /> Change Image
            </span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center w-full h-48 rounded-xl bg-white/5 border border-dashed border-white/10 hover:border-gold/40 hover:bg-white/8 transition-all cursor-pointer"
        >
          <ImageIcon size={28} className="text-foreground/20 mb-2" />
          <span className="text-xs text-foreground/30">No image selected</span>
        </button>
      )}
    </div>
  );
}