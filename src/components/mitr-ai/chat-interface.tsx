"use client";

import type { FormEvent } from 'react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SendHorizonal as SendIcon, User, Bot } from 'lucide-react';
import { contextAwareResponse, type ContextAwareResponseInput } from '@/ai/flows/context-aware-response';

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [conversationHistory, isLoading]);

  const formatConversationHistoryForAI = (history: Message[]): string => {
    // Exclude the initial greeting from history sent to AI if it's the only AI message
    const relevantHistory = history.length === 1 && history[0].text === "Hello! I'm Mitr AI. How can I help you today?" 
      ? [] 
      : history;
    return relevantHistory.map(msg => `${msg.speaker === 'user' ? 'User' : 'AI'}: ${msg.text}`).join('\n');
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const newUserMessage: Message = { id: crypto.randomUUID(), speaker: 'user', text: userInput.trim() };
    // Store current conversation to pass to AI before adding the new user message to it for the AI context
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
            placeholder="Type your message..."
            className="flex-grow resize-none rounded-full py-2 px-4 min-h-[44px] max-h-[100px]"
            rows={1}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            aria-label="Your message"
          />
          <Button type="submit" size="icon" className="rounded-full w-11 h-11 bg-primary hover:bg-primary/90" disabled={isLoading || !userInput.trim()} aria-label="Send message">
            <SendIcon className="w-5 h-5" />
          </Button>
        </form>
      </CardFooter>
       {error && <p className="text-xs text-destructive text-center px-4 pb-2 flex-shrink-0">{error}</p>}
    </Card>
  );
}
