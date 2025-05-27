
"use client";

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

export function CameraFeed() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isMounted, setIsMounted] = useState(false); // State to track client-side mount
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true); // Set to true once component mounts on client
  }, []);

  useEffect(() => {
    if (!isMounted) { // Only run camera logic if component is mounted
      return;
    }

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
        console.log('Attempting to get camera stream...');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        console.log('Camera stream obtained successfully.');
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log('Video stream assigned to video element.');
        } else {
          console.warn('videoRef.current is null, cannot assign stream.');
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        if (error instanceof Error) {
          console.error('Camera access error name:', error.name);
          console.error('Camera access error message:', error.message);
        }
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
  }, [isMounted, toast]); // Depend on isMounted

  if (!isMounted) {
    // Render a skeleton or placeholder on the server and initial client render
    return (
      <Card className="w-40 h-56 sm:w-48 sm:h-64 md:w-56 md:h-[298px] rounded-lg shadow-lg overflow-hidden bg-muted/30 flex flex-col justify-center items-center">
        <CardContent className="p-0 w-full h-full flex flex-col justify-center items-center">
          <Skeleton className="w-full h-full" />
        </CardContent>
      </Card>
    );
  }

  // Render the actual video feed and status messages only on the client after mount
  return (
    <Card className="w-40 h-56 sm:w-48 sm:h-64 md:w-56 md:h-[298px] rounded-lg shadow-lg overflow-hidden bg-muted/30 flex flex-col justify-center items-center">
      <CardContent className="p-0 w-full h-full flex flex-col justify-center items-center relative"> {/* Added relative for positioning alerts */}
        <video ref={videoRef} className="w-full h-full object-cover rounded-lg" autoPlay muted playsInline />
        
        {hasCameraPermission === false && (
          <div className="absolute inset-0 flex flex-col justify-center items-center p-2 bg-background/80 backdrop-blur-sm">
            <Alert variant="destructive" className="w-full max-w-xs text-center">
              <AlertTitle className="text-sm font-semibold">Camera Access Required</AlertTitle>
              <AlertDescription className="text-xs">
                Please allow camera access to see your video.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {hasCameraPermission === null && ( /* Only show "Accessing camera..." if permission state is truly null */
          <div className="absolute inset-0 flex flex-col justify-center items-center p-2 bg-background/80 backdrop-blur-sm">
            <p className="text-sm text-muted-foreground">Accessing camera...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
