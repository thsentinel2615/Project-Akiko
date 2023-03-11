import React from "react";
import { Nav, NavLink, NavMenu }
	from "./navbarelements";

const Navbar = () => {
return (
	<>
	<Nav>
		<NavMenu>
		<NavLink to="/" activeStyle>
			Home
		</NavLink>
		<NavLink to="/chat" activeStyle>
			Chat
		</NavLink>
		<NavLink to="/characters" activeStyle>
			Characters
		</NavLink>
		<NavLink to="/settings" activeStyle>
			Settings
		</NavLink>
		</NavMenu>
	</Nav>
	</>
);
};

export default Navbar;
