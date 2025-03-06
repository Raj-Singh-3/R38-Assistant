import React, { useState, useRef, useEffect } from 'react';
import { 
  SendHorizonal, 
  Mic, 
  Paperclip, 
  Bot, 
  Volume2, 
  VolumeX,
  Copy, 
  Trash2 
} from 'lucide-react';
import { useUser, UserButton } from '@clerk/clerk-react'; // Import UserButton
import Tesseract from 'tesseract.js';
import './Chatbot.css';

const Chatbot = () => {
  const { user } = useUser(); // Get authenticated user
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('text');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const speechSynthesisRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Initialize SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Stop after one sentence
      recognitionRef.current.interimResults = false; // Only final results
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false); // Stop listening after capturing speech
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    } else {
      console.warn('SpeechRecognition is not supported in this browser.');
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if the file is an image (PNG, JPG, JPEG)
    const allowedFormats = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedFormats.includes(file.type)) {
      window.alert("You can't share this file. Only PNG, JPG, and JPEG formats are allowed.");
      return;
    }

    // Extract text from the image using Tesseract.js
    setLoading(true);
    Tesseract.recognize(
      file,
      'eng', // Language
      {
        logger: (info) => {
          console.log(info); // Log progress (optional)
        },
      }
    )
      .then(({ data: { text } }) => {
        setInput(text); // Set extracted text as input
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error extracting text:', error);
        setLoading(false);
        window.alert('Failed to extract text from the image. Please try again.');
      });
  };

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
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
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
          <UserButton afterSignOutUrl="/" /> {/* Clerk UserButton */}
        </div>
      </div>

      <div className="messages-area">
        {/* {messages.length === 0 && (
          <div className="welcome-message">
            <p>Hi, {user?.firstName || 'User'}, how can I assist you?</p>
          </div>
        )}
         */}

        {messages.length === 0 && (
          <div className="welcome-message">
            <p>Hi {user?.firstName || 'User'}, I'm here to help! What can I do for you today?</p>
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
            onClick={() => fileInputRef.current.click()} 
          />
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".png,.jpg,.jpeg"
            onChange={handleFileUpload}
          />
          <Mic 
            className={`input-mode-icon ${mode === 'voice' ? 'active' : ''}`} 
            onClick={toggleListening} 
            style={{ backgroundColor: isListening ? '#007bff' : '' }}
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