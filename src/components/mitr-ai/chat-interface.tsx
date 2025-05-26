
"use client";

import type { FormEvent } from 'react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SendHorizonal as SendIcon, User, Bot, Mic, MicOff } from 'lucide-react';
import { contextAwareResponse, type ContextAwareResponseInput } from '@/ai/flows/context-aware-response';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  speaker: 'user' | 'ai';
  text: string;
}

export function ChatInterface() {
  const [userInput, setUserInput] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Message[]>([
    { id: crypto.randomUUID(), speaker: 'ai', text: "Hello! I'm Mitr AI. How can I help you today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // --- Speech Synthesis (Voice Introduction) ---
  const [spokenIntroId, setSpokenIntroId] = useState<string | null>(null);
  const initialAiMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (conversationHistory.length > 0 && conversationHistory[0].speaker === 'ai' && !initialAiMessageIdRef.current) {
      initialAiMessageIdRef.current = conversationHistory[0].id;
    }

    const messageToSpeak = conversationHistory.find(
      (msg) => msg.id === initialAiMessageIdRef.current && msg.speaker === 'ai' && msg.id !== spokenIntroId
    );

    if (messageToSpeak) {
      if ('speechSynthesis' in window && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(messageToSpeak.text);
        
        const speak = () => {
          window.speechSynthesis.cancel(); // Cancel any ongoing speech

          const voices = window.speechSynthesis.getVoices();
          const englishGoogleVoice = voices.find(voice => voice.lang.startsWith('en-') && voice.name.includes('Google'));
          const defaultVoice = voices.find(voice => voice.default);
          utterance.voice = englishGoogleVoice || defaultVoice || voices.find(voice => voice.lang.startsWith('en-')) || null;
          
          utterance.onend = () => {
            setSpokenIntroId(messageToSpeak.id);
          };
          utterance.onerror = (event) => {
            console.error("Speech synthesis error:", event);
            // Don't toast here as it might be too intrusive for a non-critical feature failing silently.
            setSpokenIntroId(messageToSpeak.id); 
          };
          window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length === 0) {
          window.speechSynthesis.onvoiceschanged = speak;
        } else {
          speak();
        }
      } else {
        setSpokenIntroId(messageToSpeak.id); // Mark as "done" if API not supported
      }
    }
    return () => {
      if ('speechSynthesis' in window && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [conversationHistory, spokenIntroId, toast]);


  // --- Speech Recognition (Voice Input) ---
  const [isListening, setIsListening] = useState(false);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const recognitionInstance = new SpeechRecognitionAPI();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onresult = (event) => {
          const currentTranscript = event.results[0][0].transcript;
          setUserInput(prev => prev ? prev + ' ' + currentTranscript : currentTranscript);
        };

        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          let errorMessage = 'Speech recognition error.';
          if (event.error === 'no-speech') {
            errorMessage = 'No speech was detected. Please try again.';
          } else if (event.error === 'audio-capture') {
            errorMessage = 'Microphone is not available or not working.';
          } else if (event.error === 'not-allowed') {
            errorMessage = 'Permission to use microphone was denied. Please enable it in your browser settings.';
          } else if (event.error === 'aborted') {
            // This can happen if the user clicks the mic off button, so it's not necessarily an error to show.
            console.log('Speech recognition aborted.');
            setIsListening(false);
            return;
          }
          toast({ variant: "destructive", title: "Speech Error", description: errorMessage });
          setIsListening(false);
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };
        speechRecognitionRef.current = recognitionInstance;
      } else {
        // Speech Recognition API not supported
        // Mic button will be disabled or show a toast on click
      }
    }
  }, [toast]);

  const handleToggleListening = () => {
    if (!speechRecognitionRef.current) {
      toast({ variant: "destructive", title: "Unsupported", description: "Speech recognition is not supported by your browser." });
      return;
    }

    if (isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        speechRecognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Error starting speech recognition:", e);
        toast({ variant: "destructive", title: "Mic Error", description: "Could not start voice input. Check microphone permissions and ensure no other app is using the mic."});
        setIsListening(false);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [conversationHistory, isLoading]);

  const formatConversationHistoryForAI = (history: Message[]): string => {
    const relevantHistory = history.length === 1 && history[0].text === "Hello! I'm Mitr AI. How can I help you today?" 
      ? [] 
      : history;
    return relevantHistory.map(msg => `${msg.speaker === 'user' ? 'User' : 'AI'}: ${msg.text}`).join('\n');
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const newUserMessage: Message = { id: crypto.randomUUID(), speaker: 'user', text: userInput.trim() };
    const historyForAI = formatConversationHistoryForAI(conversationHistory);
    
    setConversationHistory(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);
    setError(null);

    try {
      const aiInput: ContextAwareResponseInput = {
        userInput: newUserMessage.text,
        conversationHistory: historyForAI,
      };
      const aiOutput = await contextAwareResponse(aiInput);
      const aiMessage: Message = { id: crypto.randomUUID(), speaker: 'ai', text: aiOutput.response };
      setConversationHistory(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error("Error calling AI:", err);
      const errorMessageText = "Sorry, I couldn't get a response right now. Please try again later.";
      setError(errorMessageText);
      const errorMessage: Message = { id: crypto.randomUUID(), speaker: 'ai', text: errorMessageText };
      setConversationHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitForm = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="w-full max-w-2xl shadow-xl bg-card flex flex-col h-[calc(100vh-20rem)] sm:h-[calc(100vh-24rem)] md:h-[500px] max-h-[500px]">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="text-xl text-center text-primary-foreground bg-primary py-3 rounded-t-lg -mx-6 -mt-6 px-6">
          Mitr AI Conversation
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-4">
        <ScrollArea className="h-full w-full pr-2">
          <div className="space-y-4">
            {conversationHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2.5 animate-fadeIn ${
                  msg.speaker === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.speaker === 'ai' && <Bot className="w-6 h-6 text-primary flex-shrink-0 mb-1" aria-label="AI icon" />}
                <div
                  className={`p-3 rounded-xl max-w-[80%] shadow ${
                    msg.speaker === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-accent text-accent-foreground rounded-bl-none'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
                {msg.speaker === 'user' && <User className="w-6 h-6 text-muted-foreground flex-shrink-0 mb-1" aria-label="User icon" />}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-end gap-2.5 justify-start animate-fadeIn">
                <Bot className="w-6 h-6 text-primary flex-shrink-0 mb-1" />
                <div className="p-3 rounded-xl bg-accent text-accent-foreground max-w-[80%] shadow rounded-bl-none">
                  <p className="text-sm italic">Mitr AI is thinking...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 border-t flex-shrink-0">
        <form onSubmit={handleSubmitForm} className="flex w-full items-center gap-2">
          <Textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={isListening ? "Listening..." : "Type your message..."}
            className="flex-grow resize-none rounded-full py-2 px-4 min-h-[44px] max-h-[100px]"
            rows={1}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isListening}
            aria-label="Your message"
          />
          <Button 
            type="button" 
            size="icon" 
            variant="ghost" 
            onClick={handleToggleListening} 
            disabled={isLoading || !speechRecognitionRef.current} 
            className="rounded-full w-11 h-11 flex-shrink-0 hover:bg-accent"
            aria-label={isListening ? "Stop listening" : "Start listening with microphone"}
          >
            {isListening ? <MicOff className="w-5 h-5 text-destructive" /> : <Mic className="w-5 h-5 text-primary" />}
          </Button>
          <Button 
            type="submit" 
            size="icon" 
            className="rounded-full w-11 h-11 bg-primary hover:bg-primary/90 flex-shrink-0" 
            disabled={isLoading || !userInput.trim() || isListening} 
            aria-label="Send message"
          >
            <SendIcon className="w-5 h-5" />
          </Button>
        </form>
      </CardFooter>
       {error && <p className="text-xs text-destructive text-center px-4 pb-2 flex-shrink-0">{error}</p>}
    </Card>
  );
}

