
"use client";

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast'; // Ensure useToast is imported

export function CameraFeed() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('MediaDevices API not supported.');
        toast({
          variant: 'destructive',
          title: 'Camera Not Supported',
          description: 'Your browser does not support camera access.',
        });
        setHasCameraPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };

    getCameraPermission();

    // Cleanup function to stop the video stream when the component unmounts
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

  return (
    <Card className="w-40 h-56 sm:w-48 sm:h-64 md:w-56 md:h-[298px] rounded-lg shadow-lg overflow-hidden bg-muted/30 flex flex-col justify-center items-center">
      <CardContent className="p-0 w-full h-full flex flex-col justify-center items-center">
        <video ref={videoRef} className="w-full h-full object-cover rounded-lg" autoPlay muted playsInline />
        {hasCameraPermission === false && (
          <div className="absolute inset-0 flex flex-col justify-center items-center p-2 bg-background/80">
            <Alert variant="destructive" className="w-full max-w-xs text-center">
              <AlertTitle className="text-sm font-semibold">Camera Access Required</AlertTitle>
              <AlertDescription className="text-xs">
                Please allow camera access to see your video.
              </AlertDescription>
            </Alert>
          </div>
        )}
         {hasCameraPermission === null && (
          <div className="absolute inset-0 flex flex-col justify-center items-center p-2 bg-background/80">
            <p className="text-sm text-muted-foreground">Accessing camera...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
