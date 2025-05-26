import { AiAvatar } from "@/components/mitr-ai/ai-avatar";
import { CameraFeed } from "@/components/mitr-ai/camera-feed";
import { ChatInterface } from "@/components/mitr-ai/chat-interface";
import { Toaster } from "@/components/ui/toaster"; // Import Toaster for error messages etc.

export default function Home() {
  return (
    <>
      <main className="flex flex-col items-center justify-start min-h-screen bg-background text-foreground p-4 pt-8 sm:p-8 selection:bg-primary/30 selection:text-primary-foreground">
        <div className="w-full max-w-5xl flex flex-col items-center gap-6 md:gap-8">
          {/* App Title */}
          <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-4 sm:mb-6 tracking-tight">
            Mitr AI
          </h1>

          {/* Avatar and Camera Feed Section */}
          {/* Order for mobile: Avatar on top, then Camera. For desktop: Camera, Avatar. */}
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-around gap-6 md:gap-10 w-full">
            <div className="order-2 md:order-1">
              <CameraFeed />
            </div>
            <div className="order-1 md:order-2">
              <AiAvatar />
            </div>
          </div>

          {/* Chat Interface Section */}
          <div className="w-full flex justify-center mt-4 md:mt-6">
            <ChatInterface />
          </div>
        </div>
      </main>
      <Toaster />
    </>
  );
}
