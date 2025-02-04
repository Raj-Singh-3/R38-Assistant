import React, { useState, useRef, useEffect } from 'react';
import { 
  SendHorizonal, 
  Mic, 
  Paperclip, 
  Users, 
  Bot, 
  Smile, 
  Volume2, 
  VolumeX,
  Copy, 
  Trash2 
} from 'lucide-react';
import './Chatbot.css';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('text');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);
  const speechSynthesisRef = useRef(null);

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    const newMessage = { 
      text: input, 
      sender: 'user', 
      timestamp: new Date().toLocaleTimeString(),
      options: ['Copy', 'Delete']
    };
    
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput('');

    try {
      // const response = await fetch("http://localhost:5000/chat", {
      const response = await fetch("https://useless-85e9.onrender.com/chat", {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      
      const data = await response.json();
      const botResponse = {
        text: data.response,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString(),
        options: ['Copy', 'Speak']
      };
      
      setMessages([...updatedMessages, botResponse]);
    } catch (error) {
      console.error("Chat Error:", error);
      const errorResponse = {
        text: "Sorry, there was an error processing your message.",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString(),
        options: ['Copy']
      };
      setMessages([...updatedMessages, errorResponse]);
    }
    
    setLoading(false);
  };

  const handleMessageAction = (index, action) => {
    const updatedMessages = [...messages];
    switch(action) {
      case 'Copy':
        navigator.clipboard.writeText(updatedMessages[index].text);
        break;
      case 'Delete':
        updatedMessages.splice(index, 1);
        setMessages(updatedMessages);
        break;
      case 'Speak':
        if (isSpeaking) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
        } else {
          const utterance = new SpeechSynthesisUtterance(updatedMessages[index].text);
          speechSynthesisRef.current = utterance;
          window.speechSynthesis.speak(utterance);
          setIsSpeaking(true);

          utterance.onend = () => {
            setIsSpeaking(false);
          };
        }
        break;
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="header-left">
          <Bot className="header-icon" />
          <div>
            <h2>R38 Assistant</h2>
            <span className="status-indicator">Online</span>
          </div>
        </div>
        <div className="header-right">
          <Users className="icon-button" />
          <Smile className="icon-button" />
        </div>
      </div>

      <div className="messages-area">
        {messages.length === 0 && (
          <div className="welcome-message">
            <p>🤖 Start a conversation with your AI assistant</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`message ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`}
          >
            <div className="message-content">
              <p>{msg.text}</p>
              <span className="message-timestamp">{msg.timestamp}</span>
              <div className="message-actions">
                {msg.options.map((action, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleMessageAction(index, action)}
                  >
                    {action === 'Copy' && <Copy size={16} />}
                    {action === 'Delete' && <Trash2 size={16} />}
                    {action === 'Speak' && (
                      isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-section">
        <div className="input-modes">
          <Paperclip 
            className={`input-mode-icon ${mode === 'file' ? 'active' : ''}`} 
            onClick={() => setMode('file')} 
          />
          <Mic 
            className={`input-mode-icon ${mode === 'voice' ? 'active' : ''}`} 
            onClick={() => setMode('voice')} 
          />
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button 
          onClick={sendMessage} 
          disabled={loading || !input.trim()}
        >
          {loading ? '...' : <SendHorizonal />}
        </button>
      </div>
    </div>
  );
};

export default Chatbot;