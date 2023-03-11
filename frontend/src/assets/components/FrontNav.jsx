import Nav from 'react-bootstrap/Nav';
import './frontnav.css';

export default function FrontNav() {
  return (
    <>
      <Nav className="nav-wrapper" activeKey="/home">
        <Nav.Item>
          <Nav.Link className="nav-link" href="/home">Active</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link className="nav-link" eventKey="link-1">Link</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link className="nav-link" eventKey="link-2">Link</Nav.Link>
        </Nav.Item>
      </Nav>
    </>
  );
}
