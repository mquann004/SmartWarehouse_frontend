import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { apiFetch } from '../config/api';
import styles from './AIChatWidget.module.css';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

const AIChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Xin chào! Tôi là Trợ lý Kho Thông Minh. Bạn cần tôi giúp gì về hàng hóa hay cảm biến không?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const data = await apiFetch<{ answer: string }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: userMsg }),
      });
      setMessages(prev => [...prev, { role: 'ai', text: data.answer }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Xin lỗi, tôi gặp lỗi khi kết nối với máy chủ AI. Vui lòng kiểm tra lại cấu hình API Key.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.widgetContainer}>
      {/* Floating Button */}
      <button 
        className={`${styles.floatingBtn} ${isOpen ? styles.active : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        title="Trợ lý ảo AI"
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`glass-panel ${styles.chatWindow}`}>
          <div className={styles.chatHeader}>
            <div className={styles.botInfo}>
              <div className={styles.botAvatar}>
                <Bot size={20} />
              </div>
              <div>
                <h4>Trợ lý Gemini</h4>
                <span>Đang trực tuyến</span>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}><X size={18} /></button>
          </div>

          <div className={styles.messagesList}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`${styles.messageWrap} ${msg.role === 'ai' ? styles.aiWrap : styles.userWrap}`}>
                <div className={styles.msgAvatar}>
                  {msg.role === 'ai' ? <Bot size={14} /> : <User size={14} />}
                </div>
                <div className={styles.message}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className={`${styles.messageWrap} ${styles.aiWrap}`}>
                <div className={styles.msgAvatar}><Bot size={14} /></div>
                <div className={`${styles.message} ${styles.loadingMsg}`}>
                  <Loader2 size={16} className={styles.spin} />
                  <span>Đang suy nghĩ...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className={styles.chatInputWrap} onSubmit={handleSend}>
            <input 
              type="text" 
              placeholder="Hỏi về kho hàng..." 
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !input.trim()}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIChatWidget;
