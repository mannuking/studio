import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

export function CameraFeed() {
  return (
    <Card className="w-40 h-56 sm:w-48 sm:h-64 md:w-56 md:h-[298px] rounded-lg shadow-lg overflow-hidden bg-muted/30">
      {/* The CardContent padding is removed to allow image to fill the card */}
      <CardContent className="p-0 w-full h-full">
        <Image
          src="https://placehold.co/224x298.png" // Placeholder for camera feed, matches md:w-56 md:h-[298px]
          alt="User Camera Feed"
          width={224} // Corresponds to md:w-56 (56*4=224)
          height={298} // Corresponds to md:h-[298px] (approx aspect ratio)
          className="object-cover w-full h-full"
          data-ai-hint="webcam view"
        />
      </CardContent>
    </Card>
  );
}
