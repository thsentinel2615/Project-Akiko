import React from "react";
import { Nav, NavLink, NavMenu }
	from "./navbarelements";

const Navbar = () => {
return (
	<>
	<Nav>
		<NavMenu>
		<NavLink to="/" activeStyle>
			<b>Home</b>
		</NavLink>
		<NavLink to="/chat" activeStyle>
			<b>Chat</b>
		</NavLink>
		<NavLink to="/characters" activeStyle>
			<b>Characters</b>
		</NavLink>
		<NavLink to="/settings" activeStyle>
			<b>Settings</b>
		</NavLink>
		</NavMenu>
	</Nav>
	</>
);
};

export default Navbar;
