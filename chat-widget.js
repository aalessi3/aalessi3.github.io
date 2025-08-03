(function() {
  'use strict';
  
  // Configuration
  const CONFIG = {
    API_URL: 'https://chatbot-4vq46tdcw-alex-alessis-projects.vercel.app/api/chat_gpt', // Replace with your actual Vercel URL
    WIDGET_ID: 'chatbot-widget-' + Date.now(),
  };
  
  // Conversation history
  let chatHistory = [];
  
  // Create widget HTML
  function createWidget() {
    const widgetHTML = `
      <div id="${CONFIG.WIDGET_ID}" style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 350px;
        height: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        z-index: 10000;
        display: none;
        flex-direction: column;
        overflow: hidden;
      ">
        <!-- Header -->
        <div style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px;
          font-weight: 600;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <span>Chat Assistant</span>
          <button id="close-chat" style="
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
          ">×</button>
        </div>
        
        <!-- Messages -->
        <div id="chat-messages" style="
          flex: 1;
          padding: 15px;
          overflow-y: auto;
          background: #f8f9fa;
        ">
          <div class="message bot-message">
            Hi! I'm your AI assistant. I'm powered by a real backend API! How can I help you today?
          </div>
        </div>
        
        <!-- Input -->
        <div style="
          padding: 15px;
          border-top: 1px solid #eee;
          background: white;
        ">
          <div style="display: flex; gap: 8px;">
            <input type="text" id="chat-input" placeholder="Type your message..." style="
              flex: 1;
              padding: 10px;
              border: 1px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              outline: none;
            ">
            <button id="send-message" style="
              background: #667eea;
              color: white;
              border: none;
              padding: 10px 15px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
            ">Send</button>
          </div>
        </div>
      </div>
      
      <!-- Toggle Button -->
      <button id="chat-toggle" style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
      ">💬</button>
    `;
    
    // Add CSS for messages
    const style = document.createElement('style');
    style.textContent = `
      .message {
        margin-bottom: 12px;
        padding: 10px 12px;
        border-radius: 8px;
        max-width: 80%;
        word-wrap: break-word;
        line-height: 1.4;
      }
      .user-message {
        background: #667eea;
        color: white;
        margin-left: auto;
        text-align: right;
      }
      .bot-message {
        background: white;
        color: #333;
        border: 1px solid #eee;
      }
      .typing {
        opacity: 0.7;
        font-style: italic;
        animation: pulse 1.5s ease-in-out infinite;
      }
      .error-message {
        background: #ffebee;
        color: #c62828;
        border: 1px solid #ffcdd2;
      }
      @keyframes pulse {
        0% { opacity: 0.5; }
        50% { opacity: 1; }
        100% { opacity: 0.5; }
      }
      #chat-messages {
        scrollbar-width: thin;
        scrollbar-color: #ccc transparent;
      }
      #chat-messages::-webkit-scrollbar {
        width: 6px;
      }
      #chat-messages::-webkit-scrollbar-track {
        background: transparent;
      }
      #chat-messages::-webkit-scrollbar-thumb {
        background: #ccc;
        border-radius: 3px;
      }
    `;
    
    document.head.appendChild(style);
    document.body.insertAdjacentHTML('beforeend', widgetHTML);
  }
  
  // Add message to chat
  function addMessage(content, isUser = false, isError = false) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'} ${isError ? 'error-message' : ''}`;
    messageDiv.textContent = content;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  // Send message to API
  async function sendMessage(message) {
    try {
      addMessage(message, true);
      
      // Disable input while processing
      const input = document.getElementById('chat-input');
      const sendBtn = document.getElementById('send-message');
      input.disabled = true;
      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending...';
      
      // Add typing indicator
      const messagesContainer = document.getElementById('chat-messages');
      const typingDiv = document.createElement('div');
      typingDiv.className = 'message bot-message typing';
      typingDiv.textContent = 'Assistant is thinking...';
      messagesContainer.appendChild(typingDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
      const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          history: chatHistory
        })
      });
      
      // Remove typing indicator
      typingDiv.remove();
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        addMessage(data.reply);
        
        // Update chat history
        chatHistory.push(
          { role: 'user', content: message },
          { role: 'assistant', content: data.reply }
        );
        
        // Keep history manageable (last 10 exchanges)
        if (chatHistory.length > 20) {
          chatHistory = chatHistory.slice(-20);
        }
        
        console.log('Backend response received:', data);
      } else {
        addMessage(data.error || 'Sorry, I encountered an error. Please try again.', false, true);
      }
    } catch (error) {
      // Remove typing indicator if it exists
      document.querySelector('.typing')?.remove();
      
      console.error('Chat error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Sorry, I\'m having trouble connecting. ';
      
      if (error.message.includes('Failed to fetch')) {
        errorMessage += 'Please check your internet connection and try again.';
      } else if (error.message.includes('HTTP 404')) {
        errorMessage += 'The chat service endpoint was not found.';
      } else if (error.message.includes('HTTP 500')) {
        errorMessage += 'There\'s a temporary server issue. Please try again in a moment.';
      } else {
        errorMessage += 'Please try again in a moment.';
      }
      
      addMessage(errorMessage, false, true);
    } finally {
      // Re-enable input
      const input = document.getElementById('chat-input');
      const sendBtn = document.getElementById('send-message');
      input.disabled = false;
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send';
      input.focus();
    }
  }
  
  // Initialize widget
  function initWidget() {
    createWidget();
    
    const widget = document.getElementById(CONFIG.WIDGET_ID);
    const toggleBtn = document.getElementById('chat-toggle');
    const closeBtn = document.getElementById('close-chat');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-message');
    
    // Toggle chat
    toggleBtn.addEventListener('click', () => {
      const isVisible = widget.style.display === 'flex';
      widget.style.display = isVisible ? 'none' : 'flex';
      toggleBtn.style.display = isVisible ? 'flex' : 'none';
      
      // Focus input when opening
      if (!isVisible) {
        setTimeout(() => input.focus(), 100);
      }
    });
    
    // Close chat
    closeBtn.addEventListener('click', () => {
      widget.style.display = 'none';
      toggleBtn.style.display = 'flex';
    });
    
    // Send message
    function handleSend() {
      const message = input.value.trim();
      if (message && !input.disabled) {
        sendMessage(message);
        input.value = '';
      }
    }
    
    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !input.disabled) {
        handleSend();
      }
    });
    
    // Test backend connection on load
    setTimeout(() => {
      console.log('Testing backend connection...');
      fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Connection test' })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log('✅ Backend connection successful!');
        } else {
          console.warn('⚠️ Backend responded but with error:', data.error);
        }
      })
      .catch(error => {
        console.error('❌ Backend connection failed:', error);
        console.log('Make sure your API_URL is correct:', CONFIG.API_URL);
      });
    }, 1000);
    
    console.log('Chatbot widget loaded! Backend URL:', CONFIG.API_URL);
  }
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();