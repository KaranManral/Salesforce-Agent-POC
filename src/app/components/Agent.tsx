// ChatBot component provides a full-featured chat interface for interacting with the Salesforce Einstein AI Agent.
// Handles session management, message sending, receiving, and UI state for a conversational experience.
'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Clock, Loader2 } from 'lucide-react';

// Message interface defines the structure of each chat message
interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export default function ChatBot() {
  // State for chat messages, input, and UI flags
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  
  // State variables for session management
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [isCreatingSession, setIsCreatingSession] = useState<boolean>(false);
  const [isClosingSession, setIsClosingSession] = useState<boolean>(false); // New state for closing session
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scrolls to the bottom of the chat when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Starts a new chat session with the AI agent
  const handleStartSession = async (): Promise<void> => {
    setIsCreatingSession(true);

    try {
      const response = await fetch('/api/agent/session/create', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === 'success' && data.messages.length > 0) {
        const initialBotMessage: Message = {
          id: `bot-${Date.now()}`,
          type: 'bot',
          content: data.messages[0].message,
          timestamp: new Date(),
        };
        setMessages([initialBotMessage]);
        setIsSessionActive(true);
      } else {
        throw new Error('Failed to start session: Invalid response format.');
      }
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Could not start a new session. Please try again later.');
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Sends a user message to the AI agent and handles the response
  const handleSendMessage = async (): Promise<void> => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isSending) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);
    setIsTyping(true);

    try {
      const payload = {
        msg: trimmedInput,
        vars: [],
      };

      const response = await fetch('/api/agent/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data.message === 'success' && data.data.length > 0) {
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          type: 'bot',
          content: data.data[0].message,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
         throw new Error('Invalid response from message API.');
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: `bot-error-${Date.now()}`,
        type: 'bot',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  // Closes the current chat session and resets state
  const handleCloseSession = async (): Promise<void> => {
    setIsClosingSession(true);
    try {
      const response = await fetch('/api/agent/session/delete', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.message === 'success') {
        // Reset the chat state to the initial screen
        setMessages([]);
        setInputValue('');
        setIsSessionActive(false);
      } else {
        throw new Error('Failed to close session.');
      }
    } catch (error) {
      console.error('Error closing session:', error);
      alert('Could not close the session properly. Please refresh the page.');
    } finally {
      setIsClosingSession(false);
    }
  };

  // Handles Enter key for sending messages
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Formats the timestamp for display
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Dynamically adjusts textarea height as user types
  const adjustTextareaHeight = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    setInputValue(textarea.value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 p-4 flex items-center justify-center">
      <div className="w-full max-w-4xl h-[700px] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 flex flex-col overflow-hidden">
        
        {!isSessionActive ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 text-center">AI Assistant Ready</h1>
            <p className="text-indigo-500">Click the button below to start your conversation.</p>
            <button
              onClick={handleStartSession}
              disabled={isCreatingSession}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold text-lg"
            >
              {isCreatingSession ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                'Start Session'
              )}
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <header className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-1">AI Assistant</h1>
                  <p className="text-indigo-100 text-sm">Powered by Next.js 15 • Always here to help</p>
                </div>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 animate-fade-in ${
                    message.type === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'bot'
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                      : 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                  }`}>
                    {message.type === 'bot' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  
                  <div className={`max-w-[70%] ${message.type === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`px-5 py-3 rounded-2xl shadow-sm ${
                      message.type === 'bot'
                        ? 'bg-white border border-indigo-100 rounded-bl-md'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-md'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1 mt-1 px-2 ${
                      message.type === 'user' ? 'flex-row-reverse' : ''
                    }`}>
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-3 animate-fade-in">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-indigo-100 rounded-2xl rounded-bl-md px-5 py-3 shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 bg-white border-t border-gray-100">
              <div className="flex gap-3 items-end bg-gray-50 rounded-2xl p-3 border-2 border-transparent focus-within:border-indigo-500 focus-within:bg-white transition-all duration-300">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={adjustTextareaHeight}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  className="flex-1 bg-transparent border-none outline-none resize-none min-h-[24px] max-h-[120px] text-sm placeholder-gray-500"
                  rows={1}
                  disabled={isSending}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isSending}
                  className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              {/* New Close Session Button */}
              <div className="text-center mt-3">
                <button
                  onClick={handleCloseSession}
                  disabled={isClosingSession}
                  className="text-xs bg-gradient-to-r from-gray-50 to-gray-200 p-2 rounded-md cursor-pointer text-red-600 hover:text-red-400 transition-colors disabled:opacity-50 flex items-center justify-center mx-auto"
                >
                  {isClosingSession && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  {isClosingSession ? 'Closing...' : 'Close Session'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .bg-grid-pattern {
          background-image: url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23ffffff' fill-opacity='0.1'%3e%3cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e");
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}