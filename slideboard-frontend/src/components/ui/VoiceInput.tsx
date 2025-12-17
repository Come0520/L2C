'use client';

import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface VoiceInputProps {
    onTranscript: (text: string) => void;
    language?: string;
    continuous?: boolean;
}

/**
 * 语音输入组件
 * 
 * 使用 Web Speech API 实现语音识别
 * 支持连续识别和实时转录
 */
export function VoiceInput({
    onTranscript,
    language = 'zh-CN',
    continuous = true
}: VoiceInputProps) {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const [transcript, setTranscript] = useState('');
    // Web Speech API 类型在不同浏览器中定义不一致，使用 any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // 获取 SpeechRecognition（兼容不同浏览器）
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setIsSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = continuous;
        recognition.interimResults = true;
        recognition.lang = language;
        recognition.maxAlternatives = 1;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcriptPart = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcriptPart;
                } else {
                    interimTranscript += transcriptPart;
                }
            }

            const fullTranscript = finalTranscript || interimTranscript;
            setTranscript(fullTranscript);
            onTranscript(fullTranscript);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                alert('请允许麦克风权限以使用语音输入');
            }
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [language, continuous, onTranscript]);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('您的浏览器不支持语音识别。请使用 Chrome、Edge 或 Safari 浏览器。');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setTranscript('');
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    if (!isSupported) {
        return (
            <div className="text-sm text-gray-500">
                您的浏览器不支持语音输入
            </div>
        );
    }

    return (
        <div className="flex items-center space-x-2">
            <button
                onClick={toggleListening}
                className={`p-3 rounded-full transition-all ${isListening
                    ? 'bg-red-500 text-white animate-pulse shadow-lg'
                    : 'bg-blue-500 text-white hover:bg-blue-600 shadow'
                    }`}
                title={isListening ? '停止录音' : '开始录音'}
            >
                {isListening ? (
                    <MicOff className="h-5 w-5" />
                ) : (
                    <Mic className="h-5 w-5" />
                )}
            </button>

            {isListening && (
                <div className="flex items-center space-x-2 text-sm">
                    <Volume2 className="h-4 w-4 text-red-500 animate-pulse" />
                    <span className="text-gray-600">正在听...</span>
                </div>
            )}

            {transcript && !isListening && (
                <div className="text-sm text-gray-500 max-w-xs truncate">
                    已识别：{transcript}
                </div>
            )}
        </div>
    );
}
