"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImagePlus, X, Link2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUpload({ images, onImagesChange, maxImages = 10 }: ImageUploadProps) {
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (images.length >= maxImages) break;
      if (!file.type.startsWith("image/")) continue;

      // Create local preview URL
      const url = URL.createObjectURL(file);
      onImagesChange([...images, url]);
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleAddUrl() {
    const url = urlInput.trim();
    if (!url || images.length >= maxImages) return;
    if (!url.startsWith("http")) return;
    onImagesChange([...images, url]);
    setUrlInput("");
    setShowUrlInput(false);
  }

  function handleRemove(index: number) {
    const updated = images.filter((_, i) => i !== index);
    onImagesChange(updated);
  }

  return (
    <div className="space-y-3">
      {/* Image grid */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url, i) => (
            <div key={i} className="relative group">
              <img
                src={url}
                alt={`Imagem ${i + 1}`}
                className="h-20 w-20 rounded-lg object-cover border border-border/50"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect fill='%23333' width='80' height='80'/%3E%3Ctext fill='%23666' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='12'%3E❌%3C/text%3E%3C/svg%3E";
                }}
              />
              <button
                onClick={() => handleRemove(i)}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={images.length >= maxImages}
          className="gap-1.5"
        >
          <ImagePlus className="h-3.5 w-3.5" />
          Upload
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowUrlInput(!showUrlInput)}
          disabled={images.length >= maxImages}
          className="gap-1.5"
        >
          <Link2 className="h-3.5 w-3.5" />
          URL
        </Button>
        <Badge variant="secondary" className="text-[10px]">
          {images.length}/{maxImages}
        </Badge>
      </div>

      {/* URL input */}
      {showUrlInput && (
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://exemplo.com/imagem.jpg"
            className="text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
          />
          <Button size="sm" onClick={handleAddUrl}>
            Adicionar
          </Button>
        </div>
      )}
    </div>
  );
}
