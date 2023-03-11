import React, { useState } from 'react';
import './chatboxinput.css'
const defaultAvatar = 'https://cdn.discordapp.com/attachments/1070388301397250170/1072227534713921616/tmpu7e13o19.png';

export function ChatboxInput({ onSend }) {
  const [text, setText] = useState('');
  const [sender, setSender] = useState('');
  const [avatar, setAvatar] = useState('');

  const handleTextChange = (event) => {
    setText(event.target.value);
  };

  const handleSenderChange = (event) => {
    setSender(event.target.value);
  };

  const handleAvatarChange = (event) => {
    setAvatar(URL.createObjectURL(event.target.files[0]));
  };

  const handleSendClick = () => {
    onSend(sender || 'You', text, avatar);
    setText('');
  };

  return (
    <div className='inputBox'>
      <div className="send-input">
        <input
          type="file"
          id='avatar'
          accept="image/*"
          onChange={handleAvatarChange}
        />
        <img src={avatar || defaultAvatar} alt="avatar" className="avatar incoming-avatar" />
        <input
          type="text"
          id='input'
          value={sender}
          placeholder="Your name"
          onChange={handleSenderChange}
        />
        <input
          type="text"
          id='input' 
          value={text}
          placeholder="Type your message..."
          onChange={handleTextChange}
        />
        <button onClick={handleSendClick} id='send'>Send</button>
      </div>
    </div>
  );
}
export default ChatboxInput;