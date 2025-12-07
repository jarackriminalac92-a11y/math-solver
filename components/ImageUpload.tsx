import React, { useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Attachment } from '../types';

interface ImageUploadProps {
  onImageSelected: (attachment: Attachment) => void;
  onClear: () => void;
  currentAttachment: Attachment | null;
  disabled: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelected, onClear, currentAttachment, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 for preview and API
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const cleanBase64 = base64String.split(',')[1];
      
      onImageSelected({
        file,
        previewUrl: base64String, // Keeps the data:image... prefix for img src
        base64: cleanBase64,      // Raw base64 for API
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
    
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
        <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={disabled}
        />
        
        {currentAttachment ? (
            <div className="relative group inline-block">
                <img 
                    src={currentAttachment.previewUrl} 
                    alt="Preview" 
                    className="h-16 w-16 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                />
                <button
                    onClick={onClear}
                    className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 hover:bg-rose-600 transition-colors shadow-sm"
                    type="button"
                >
                    <X size={12} />
                </button>
            </div>
        ) : (
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="p-3 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-all duration-200 ease-in-out"
                title="Upload math problem"
            >
                <ImagePlus size={24} />
            </button>
        )}
    </div>
  );
};