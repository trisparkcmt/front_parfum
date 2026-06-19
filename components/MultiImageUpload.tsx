'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { X, Upload, GripVertical } from 'lucide-react';

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
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const handleInputChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(index, file);
    }
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

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages[index] = {
      ...newImages[index],
      file: null,
      preview: null,
    };
    setImages(newImages);
    notifyParent(newImages);

    // Reset file input
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.value = '';
    }
  };

  const handleReorderImages = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
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

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-foreground mb-3">Images du produit</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {images.map((image, index) => (
          <div key={image.key} className="flex flex-col gap-1">
            <label className="block text-xs font-medium text-foreground/60 truncate">
              {image.label}
              {index === 0 && <span className="text-red-500 ml-1">*</span>}
            </label>

            <div
              className={`relative border border-dashed rounded transition-colors cursor-pointer ${
                draggedIndex === index
                  ? 'border-gold bg-gold/5'
                  : image.preview
                  ? 'border-white/10 bg-white/5'
                  : 'border-white/20 bg-white/[0.02] hover:border-white/30 hover:bg-white/5'
              }`}
              style={{ aspectRatio: '1' }}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => fileInputRefs.current[index]?.click()}
            >
              {image.preview ? (
                <div className="relative w-full h-full group">
                  <Image
                    src={image.preview}
                    alt={image.label}
                    fill
                    className="object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(index);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>

                  {index > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReorderImages(index, index - 1);
                      }}
                      disabled={index === 0}
                      className="absolute left-0.5 top-1/2 -translate-y-1/2 bg-gray-700/80 text-white p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    >
                      <GripVertical size={12} />
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center h-full"
                  onClick={() => fileInputRefs.current[index]?.click()}
                >
                  <Upload className="text-gray-400 mb-1" size={16} />
                  <p className="text-xs text-gray-500 text-center px-1 line-clamp-2">
                    Cliquer ou glisser
                  </p>
                </div>
              )}

              <input
                ref={(el) => {
                  if (el) fileInputRefs.current[index] = el;
                }}
                type="file"
                accept={accept}
                onChange={(e) => handleInputChange(index, e)}
                className="hidden"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
