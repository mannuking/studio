
"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { generateAvatar, type GenerateAvatarInput } from '@/ai/flows/generate-avatar-flow';
import { useToast } from '@/hooks/use-toast';

const PLACEHOLDER_IMAGE = "https://placehold.co/320x320.png";
const PLACEHOLDER_AI_HINT = "human face";

export function AiAvatar() {
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAvatar = async () => {
      setIsLoading(true);
      try {
        const input: GenerateAvatarInput = {
          prompt: "Digital art avatar: Friendly young man, short dark hair, modern glasses, subtle beard. Head & shoulders portrait, welcoming smile, looking at camera. Clean, soft background. Professional & warm.",
        };
        const output = await generateAvatar(input);
        setAvatarSrc(output.imageDataUri);
      } catch (err) {
        console.error("Failed to generate avatar:", err);
        toast({
          variant: "destructive",
          title: "Avatar Generation Failed",
          description: "Could not generate a new avatar. Displaying default.",
        });
        // avatarSrc will remain null, so placeholder is used
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvatar();
  }, [toast]);

  const displaySrc = avatarSrc || PLACEHOLDER_IMAGE;
  const displayHint = avatarSrc ? "friendly avatar" : PLACEHOLDER_AI_HINT;

  return (
    <Card className="w-56 h-56 sm:w-64 sm:h-64 md:w-80 md:h-80 rounded-full shadow-xl overflow-hidden bg-accent/30 flex items-center justify-center aspect-square">
      <CardContent className="p-0 w-full h-full flex items-center justify-center">
        {isLoading && !avatarSrc ? (
          <Skeleton className="w-full h-full rounded-full" />
        ) : (
          <Image
            src={displaySrc}
            alt="AI Agent Avatar"
            width={320}
            height={320}
            className="object-cover w-full h-full rounded-full"
            data-ai-hint={displayHint}
            priority={displaySrc !== PLACEHOLDER_IMAGE}
            unoptimized={displaySrc.startsWith('data:image')} // Important for data URIs
          />
        )}
      </CardContent>
    </Card>
  );
}
