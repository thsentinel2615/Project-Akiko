import { useState } from 'react'
import './App.css'
import Chatbox from './assets/components/Chatbox'
import Avatar from './assets/components/Avatar'
import FrontNav from './assets/components/FrontNav'
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <header>
      <FrontNav/>
      </header>
      <body>
      <Avatar/>
      <Chatbox />
      </body>
    </div>
  )
}

export default App
