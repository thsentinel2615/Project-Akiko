import Nav from 'react-bootstrap/Nav';
import './frontnav.css';

export default function FrontNav() {
  return (
    <>
      <Nav className="nav-wrapper" activeKey="/">
        <Nav.Item>
          <Nav.Link className="nav-link" href="/">Home</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link className="nav-link" href="/chat" eventKey="chat">Chat</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link className="nav-link" href="/characters" eventKey="characters">Characters</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link className="nav-link" href="/settings" eventKey="settings">Settings</Nav.Link>
        </Nav.Item>
      </Nav>
    </>
  );
}
