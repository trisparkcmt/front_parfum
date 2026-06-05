import { useState, useEffect } from 'react';

interface ImageUploaderProps {
  onFileSelect: (file: File) => void;
}

export default function ImageUploader({ onFileSelect }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
        id="image-upload"
      />
      <label
        htmlFor="image-upload"
        className="cursor-pointer bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-foreground hover:bg-white/10 transition"
      >
        choisir une image
      </label>
      {preview && (
        <img
          src={preview}
          alt="preview"
          className="mt-2 w-full h-48 object-cover rounded-lg shadow-lg glassmorphism"
        />
      )}
    </div>
  );
}
