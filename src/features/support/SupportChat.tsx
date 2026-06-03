'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUI } from '../../context/UIContext';

interface Message {
  id: string;
  type: 'text' | 'image';
  content: string;
  time: string;
  sender: 'me' | 'support';
}

const MOCK_RESPONSES = [
  "Hello! Thank you for reaching out to Wale Hotel Support. We've received your query and a representative will connect with you shortly.",
  "Got it! Let me check the reservation/room records for you. Just a moment...",
  "Understood. I have logged this issue with the main office. Is there anything else I can help you with?",
  "I can help you with room pricing, guest cancellations, or kitchen menu items. Please specify your query.",
  "We are currently experiencing high volume of room bookings, but we are here to support your workflow!"
];

export default function SupportChat() {
  const { setTitle } = useUI();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTitle('Support Chat');
    // Welcome message
    setMessages([
      {
        id: 'welcome',
        type: 'text',
        content: '👋 Welcome to Wale Support! Send a message or share a screenshot if you have any issues with check-in, billing, or menus.',
        time: getTimeString(),
        sender: 'support'
      }
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getTimeString = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'text',
      content: inputText.trim(),
      time: getTimeString(),
      sender: 'me'
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // Trigger auto response
    triggerAutoResponse();
  };

  const triggerAutoResponse = () => {
    setTimeout(() => {
      const responseText = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        type: 'text',
        content: responseText,
        time: getTimeString(),
        sender: 'support'
      };
      setMessages(prev => [...prev, botMsg]);
    }, 1500);
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size exceeds 5MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const imageMsg: Message = {
          id: Date.now().toString(),
          type: 'image',
          content: event.target.result as string,
          time: getTimeString(),
          sender: 'me'
        };
        setMessages(prev => [...prev, imageMsg]);
        triggerAutoResponse();
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="flex flex-col bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm h-[72vh] animate-fade-in">
      
      {/* Active Header */}
      <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center">
            🎧
          </div>
          <div>
            <h4 className="text-xs font-black leading-none">Internal Help Desk</h4>
            <span className="text-[9px] text-slate-400 font-bold block mt-0.5">Online Support Assistant</span>
          </div>
        </div>
        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
      </div>

      {/* Message History */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 custom-scrollbar">
        {messages.map((m) => {
          const isMe = m.sender === 'me';
          return (
            <div
              key={m.id}
              className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                  isMe
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-white border text-slate-700 rounded-tl-none'
                }`}
              >
                {m.type === 'text' ? (
                  <p>{m.content}</p>
                ) : (
                  <div className="space-y-1">
                    <img
                      src={m.content}
                      alt="Uploaded attachment"
                      className="max-w-full max-h-48 rounded-lg cursor-pointer"
                      onClick={() => window.open(m.content, '_blank')}
                    />
                    <span className="text-[9px] text-slate-400 block italic">Click image to expand</span>
                  </div>
                )}
                
                <div className="flex items-center justify-end gap-1 mt-1.5 opacity-60 text-[9px] select-none">
                  <span>{m.time}</span>
                  {isMe && <span>✓✓</span>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Footer Input */}
      <div className="p-4 bg-white border-t flex items-center gap-3">
        <button
          onClick={handleAttachClick}
          className="w-10 h-10 border border-slate-200 hover:border-amber-400 rounded-full flex flex-col items-center justify-center text-[10px] text-slate-400 font-bold gap-0.5 transition-colors cursor-pointer"
        >
          📷
          <span className="text-[7px]">Image</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        <input
          type="text"
          placeholder="Describe your issue or upload screenshot..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 px-4 py-3 rounded-full border border-slate-200 text-xs bg-white focus:outline-amber-500"
        />

        <button
          onClick={handleSend}
          className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-full cursor-pointer transition-colors shadow-sm"
        >
          Send
        </button>
      </div>

    </div>
  );
}
