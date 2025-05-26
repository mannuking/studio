import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

export function AiAvatar() {
  return (
    <Card className="w-56 h-56 sm:w-64 sm:h-64 md:w-80 md:h-80 rounded-full shadow-xl overflow-hidden bg-accent/30 flex items-center justify-center aspect-square">
      {/* The CardContent padding is removed to allow image to fill the card */}
      <CardContent className="p-0 w-full h-full flex items-center justify-center">
        <Image
          src="https://placehold.co/320x320.png" // Placeholder for avatar, matches md:w-80 md:h-80
          alt="AI Agent Avatar"
          width={320}
          height={320}
          className="object-cover w-full h-full rounded-full"
          data-ai-hint="human face"
          priority
        />
      </CardContent>
    </Card>
  );
}
