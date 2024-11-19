// frontend/src/components/ChatInterface.jsx

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FiCopy } from 'react-icons/fi';
import './ChatInterface.css';

// Separate CodeBlock component to handle syntax highlighting and copy functionality
const CodeBlock = ({ language, children }) => {
  const [copied, setCopied] = useState(false);
  const copyToClipboard = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block">
      <SyntaxHighlighter style={darcula} language={language} PreTag="div">
        {children}
      </SyntaxHighlighter>
      <button className="copy-button" onClick={copyToClipboard}>
        {copied ? 'Copied!' : <FiCopy />}
      </button>
    </div>
  );
};

const ChatInterface = () => {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! How can I assist you today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Backend URL - adjust as needed
  const backendURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

  // Function to handle sending messages
  const handleSend = async () => {
    if (input.trim() === '') return;

    // Add user's message to the conversation
    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${backendURL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: input
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch assistant response.');
      }

      const data = await response.json();

      // Set conversation ID if it's a new conversation
      if (!conversationId) {
        setConversationId(data.conversation_id);
      }

      // Add assistant's reply to the conversation
      const assistantMessage = { role: 'assistant', content: data.reply };
      setMessages(prevMessages => [...prevMessages, assistantMessage]);

    } catch (error) {
      console.error(error);
      const errorMessage = { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press to send message
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Custom renderers for ReactMarkdown
  const renderers = {
    // Render code blocks with syntax highlighting and copy button
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';

      if (!inline && language) {
        return <CodeBlock language={language}>{children}</CodeBlock>;
      } else {
        return <code className="inline-code" {...props}>{children}</code>;
      }
    },
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-content">
              <ReactMarkdown components={renderers}>
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && (
          <div className="message assistant">
            <div className="message-content">Typing...</div>
          </div>
        )}
      </div>
      <div className="input-area">
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          onKeyPress={handleKeyPress}
          placeholder="Type your message here..."
        />
        <button onClick={handleSend} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;