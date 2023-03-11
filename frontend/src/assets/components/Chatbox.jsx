import React, { useState } from 'react';
import './chatbox.css';
import ChatboxInput from './ChatBoxInput';

function Chatbox() {
  const [messages, setMessages] = useState([]);

  const handleMessageSend = (sender, text, avatar) => {
    const newMessage = {
      sender: sender,
      text: text,
      avatar: avatar || 'https://cdn.discordapp.com/attachments/1070388301397250170/1072227534713921616/tmpu7e13o19.png',
      isIncoming: false,
    };
    setMessages([...messages, newMessage]);
  };
  

  return (
    <div className="chatbox-wrapper">
      <div className="message-box">
        {messages.map((message, index) => (
          <div key={index} className={message.isIncoming ? "incoming-message" : "outgoing-message"}>
            <div className={message.isIncoming ? "avatar incoming-avatar" : "avatar outgoing-avatar"}>
              <img src={message.avatar} />
            </div>
            <div className="message-info">
              <p className="sender-name">{message.sender}</p>
              <p className="message-text">{message.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="chatbox-input-container">
        <ChatboxInput onSend={handleMessageSend} />
      </div>
    </div>
  );
}

export default Chatbox;
