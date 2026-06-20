'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { X, Upload } from 'lucide-react';

interface ImageFile {
  key: 'image_principale' | 'image_supp_1' | 'image_supp_2' | 'image_supp_3' | 'image_supp_4';
  file: File | null;
  preview: string | null;
  label: string;
}

interface MultiImageUploadProps {
  onImagesChange: (images: { [key: string]: File | null }) => void;
  maxSize?: number; // in bytes, default 5MB
  accept?: string;
}

export const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  onImagesChange,
  maxSize = 5 * 1024 * 1024,
  accept = 'image/jpeg,image/png,image/webp',
}) => {
  const [images, setImages] = useState<ImageFile[]>([
    { key: 'image_principale', file: null, preview: null, label: 'Image Principale' },
    { key: 'image_supp_1', file: null, preview: null, label: 'Image Supplémentaire 1' },
    { key: 'image_supp_2', file: null, preview: null, label: 'Image Supplémentaire 2' },
    { key: 'image_supp_3', file: null, preview: null, label: 'Image Supplémentaire 3' },
    { key: 'image_supp_4', file: null, preview: null, label: 'Image Supplémentaire 4' },
  ]);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const principalInputRef = useRef<HTMLInputElement | null>(null);
  const supplementaryInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (index: number, file: File | null) => {
    if (!file) return;

    // Validate file type
    const validTypes = accept.split(',');
    if (!validTypes.includes(file.type)) {
      alert(`Invalid file type. Accepted: ${accept}`);
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      alert(`File too large. Maximum size: ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const newImages = [...images];
      newImages[index] = {
        ...newImages[index],
        file,
        preview: e.target?.result as string,
      };
      setImages(newImages);
      notifyParent(newImages);
    };
    reader.readAsDataURL(file);
  };

  const handleBulkSupplementaryFiles = (files: FileList | null) => {
    if (!files) return;

    const newImages = [...images];
    let fileIndex = 1; // Start from image_supp_1

    Array.from(files).forEach((file) => {
      if (fileIndex > 4) return; // Max 4 supplementary images

      // Validate file type
      const validTypes = accept.split(',');
      if (!validTypes.includes(file.type)) {
        console.warn(`Skipping invalid file type: ${file.type}`);
        return;
      }

      // Validate file size
      if (file.size > maxSize) {
        console.warn(`Skipping oversized file: ${file.name}`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        newImages[fileIndex] = {
          ...newImages[fileIndex],
          file,
          preview: e.target?.result as string,
        };
        setImages([...newImages]);
        notifyParent(newImages);
      };
      reader.readAsDataURL(file);
      fileIndex++;
    });
  };

  const handleInputChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(index, file);
    }
  };

  const handleSupplementaryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleBulkSupplementaryFiles(event.target.files);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedIndex(null);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(index, file);
    }
  };

  const handleDropSupplementary = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedIndex(null);
    handleBulkSupplementaryFiles(e.dataTransfer.files);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages[index] = {
      ...newImages[index],
      file: null,
      preview: null,
    };
    setImages(newImages);
    notifyParent(newImages);
  };

  const notifyParent = (imagesList: ImageFile[]) => {
    const imageMap: { [key: string]: File | null } = {};
    imagesList.forEach((img) => {
      imageMap[img.key] = img.file;
    });
    onImagesChange(imageMap);
  };

  const principalImage = images[0];
  const supplementaryImages = images.slice(1);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Image Principale *</h3>
        <div
          className={`relative border-2 border-dashed rounded-xl transition-colors cursor-pointer p-8 ${
            draggedIndex === 0
              ? 'border-gold bg-gold/5'
              : principalImage.preview
              ? 'border-white/10 bg-white/5'
              : 'border-white/20 bg-white/[0.02] hover:border-white/30 hover:bg-white/5'
          }`}
          onDragOver={(e) => handleDragOver(e, 0)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 0)}
          onClick={() => principalInputRef.current?.click()}
        >
          {principalImage.preview ? (
            <div className="relative w-full h-64 group">
              <Image
                src={principalImage.preview}
                alt={principalImage.label}
                fill
                className="object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage(0);
                }}
                className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-lg"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center">
              <Upload className="text-gold mb-2" size={32} />
              <p className="text-sm font-medium text-foreground mb-1">Cliquer pour ajouter l'image principale</p>
              <p className="text-xs text-foreground/40">ou glisser-déposer une image</p>
            </div>
          )}

          <input
            ref={principalInputRef}
            type="file"
            accept={accept}
            onChange={(e) => handleInputChange(0, e)}
            className="hidden"
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Images Supplémentaires</h3>
        <div
          className={`relative border-2 border-dashed rounded-xl transition-colors cursor-pointer p-8 ${
            draggedIndex === -1
              ? 'border-gold bg-gold/5'
              : 'border-white/20 bg-white/[0.02] hover:border-white/30 hover:bg-white/5'
          }`}
          onDragOver={(e) => handleDragOver(e, -1)}
          onDragLeave={handleDragLeave}
          onDrop={handleDropSupplementary}
          onClick={() => supplementaryInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <Upload className="text-gold mb-2" size={32} />
            <p className="text-sm font-medium text-foreground mb-1">Cliquer pour ajouter plusieurs images</p>
            <p className="text-xs text-foreground/40">ou glisser-déposer jusqu'à 4 images à la fois</p>
          </div>

          <input
            ref={supplementaryInputRef}
            type="file"
            multiple
            accept={accept}
            onChange={handleSupplementaryChange}
            className="hidden"
          />
        </div>

        {supplementaryImages.some((img) => img.preview) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {supplementaryImages.map((image, index) => (
              <div key={image.key} className="flex flex-col gap-2">
                <label className="block text-xs font-medium text-foreground/60">{image.label}</label>
                <div className="relative group">
                  {image.preview ? (
                    <>
                      <Image
                        src={image.preview}
                        alt={image.label}
                        width={150}
                        height={150}
                        className="w-full h-32 object-cover rounded-lg border border-white/10"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(index + 1);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-32 border border-dashed border-white/10 rounded-lg bg-white/[0.02] flex items-center justify-center text-foreground/30">
                      —
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
