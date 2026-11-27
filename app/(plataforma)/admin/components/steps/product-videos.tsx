"use client";

import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormDataState } from "../../types/admin-types";

function Preview({ source, label }: { source: File | string; label: string }) {
  const [preview, setPreview] = useState<string>();
  useEffect(() => {
    if (typeof source === "string") return;
    const url = URL.createObjectURL(source);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [source]);
  return <video controls playsInline preload="metadata" aria-label={label}
    src={typeof source === "string" ? source : preview}
    className="aspect-video w-full rounded-lg bg-muted object-contain" />;
}

export function ProductVideos() {
  const { watch, setValue } = useFormContext<FormDataState>();
  const videos = watch("videos") ?? [];
  const [error, setError] = useState("");
  return (
    <section className="space-y-3 rounded-xl border bg-card p-4">
      <Label htmlFor="product-videos">Vídeos do produto</Label>
      <p id="video-formats" className="text-sm text-muted-foreground">MP4 ou WebM, até 50 MB por vídeo.</p>
      <Input id="product-videos" type="file" accept="video/mp4,video/webm" multiple aria-describedby="video-formats"
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? []);
          event.currentTarget.value = "";
          const invalid = files.find(file => !["video/mp4", "video/webm"].includes(file.type) || !file.size || file.size > 50 * 1024 * 1024);
          if (invalid) {
            setError(`Confira o formato e o tamanho de ${invalid.name}.`);
            return;
          }
          setError("");
          setValue("videos", [...videos, ...files], { shouldDirty: true });
        }} />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {videos.map((source, index) => {
          const label = typeof source === "string" ? `Vídeo ${index + 1}` : source.name;
          return <div key={typeof source === "string" ? source : `${source.name}-${index}`} className="space-y-1">
            <Preview source={source} label={label} />
            <Button type="button" variant="outline" aria-label={`Remover ${label}`} onClick={() =>
              setValue("videos", videos.filter((_, i) => i !== index), { shouldDirty: true })}>Remover vídeo</Button>
          </div>;
        })}
      </div>
    </section>
  );
}
