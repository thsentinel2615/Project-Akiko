import './chatbox.css';
import ChatboxInput from './ChatBoxInput';
function Chatbox() {
    return (
<div className="message-box">
  <div className="incoming-message">
    <div className="avatar incoming-avatar">
        <img src='https://i.imgur.com/4qixpe4.png'/>
    </div>
    <div className="message-info">
      <p className="sender-name">Akiko</p>
      <p className="message-text">Placeholder incoming</p>
    </div>
  </div>
  <div className="outgoing-message">
    <div className="avatar outgoing-avatar">
    <img src='https://cdn.discordapp.com/attachments/1070388301397250170/1072227534713921616/tmpu7e13o19.png'/>
    </div>
    <div className="message-info">
      <p className="sender-name">Peepy</p>
      <p className="message-text">Placeholder outgoing</p>
    </div>
  </div>
</div>
    );
}

export default Chatbox;
