import { useState } from 'react'
import './App.css'
import Chatbox from './assets/components/Chatbox'
import ChatboxInput from './assets/components/ChatBoxInput'
import Avatar from './assets/components/Avatar'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <div>
      <Chatbox/>
      <ChatboxInput/>
      <Avatar/>
      </div>
    </div>
  )
}

export default App
