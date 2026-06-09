"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square } from 'lucide-react';
import { motion } from 'motion/react';

interface VoiceInputProps {
  currentText: string;
  onTranscriptChange: (text: string) => void;
  className?: string;
}

export function VoiceInput({ currentText, onTranscriptChange, className = "" }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [baselineText, setBaselineText] = useState("");
  const recognitionRef = useRef<any>(null);
  const baselineRef = useRef<string>("");
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          
          if (finalTranscript) {
            const newBaseline = baselineRef.current + (baselineRef.current && !baselineRef.current.endsWith(" ") ? " " : "") + finalTranscript;
            baselineRef.current = newBaseline;
            setBaselineText(newBaseline);
            onTranscriptChange(newBaseline);
          } else if (interimTranscript) {
            const current = baselineRef.current + (baselineRef.current && !baselineRef.current.endsWith(" ") ? " " : "") + interimTranscript;
            onTranscriptChange(current);
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsRecording(false);
        };
        
        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      } else {
        setIsSupported(false);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleRecording = () => {
    if (!isSupported) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      try {
        baselineRef.current = currentText;
        setBaselineText(currentText);
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err) {
         console.error(err);
      }
    }
  };

  if (!isSupported) return null;

  return (
    <button
      onClick={toggleRecording}
      suppressHydrationWarning
      title={isRecording ? "Stop Recording" : "Start Voice Input"}
      className={`flex items-center justify-center p-1.5 rounded transition-all ${isRecording ? "bg-red-500/20 text-red-500 border border-red-500/50" : "bg-ms-panel hover:bg-ms-panel-light text-ms-text-muted hover:text-ms-green border border-transparent"} ${className}`}
    >
      {isRecording ? (
        <motion.div
           animate={{ scale: [1, 1.2, 1] }}
           transition={{ repeat: Infinity, duration: 1.5 }}
           className="flex items-center gap-2"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
        </motion.div>
      ) : (
        <Mic className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
