import './chatboxinput.css'
function ChatboxInput() {
    return(
<div className='inputBox'>
  <div className="send-input">
    <form>
      <input type='text' id='input' placeholder='Type your message here...' />
      <button type='submit' id='send'>Send</button>
    </form>
  </div>
</div>
    );
}

export default ChatboxInput;