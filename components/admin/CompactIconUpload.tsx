'use client';

import { useState, useId, useEffect } from 'react';
import AppImage from '@/components/ui/AppImage';
import { Upload, X } from 'lucide-react';

interface CompactIconUploadProps {
  onFileSelect: (file: File | null) => void;
  initialImage?: string | null;
  label?: string;
}

export default function CompactIconUpload({
  onFileSelect,
  initialImage,
  label = 'Icône',
}: CompactIconUploadProps) {
  const [preview, setPreview] = useState<string>(initialImage || '');
  const uid = useId();

  useEffect(() => {
    setPreview(initialImage || '');
  }, [initialImage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPreview('');
    onFileSelect(null);
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-foreground/60">{label}</label>
      <div
        className="relative border border-dashed border-white/20 rounded-lg bg-white/[0.02] hover:border-white/30 hover:bg-white/5 transition-colors cursor-pointer overflow-hidden"
        style={{ width: 80, height: 80 }}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          className="hidden"
          id={uid}
        />
        {preview ? (
          <div className="relative w-full h-full group">
            <AppImage src={preview} alt="preview" fill className="object-cover rounded-lg" />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <X size={10} />
            </button>
            <label
              htmlFor={uid}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            >
              <Upload size={14} className="text-white" />
            </label>
          </div>
        ) : (
          <label
            htmlFor={uid}
            className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
          >
            <Upload className="text-foreground/30 mb-0.5" size={16} />
            <span className="text-[10px] text-foreground/30 text-center px-1">Ajouter</span>
          </label>
        )}
      </div>
    </div>
  );
}
