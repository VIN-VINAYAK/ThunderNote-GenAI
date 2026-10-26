import { Avatar, Menu, MenuButton, MenuItem, MenuList } from "@chakra-ui/react";
import { FiArrowUpRight, FiGrid, FiLogOut, FiZap } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { LOGOUT } from "../../../redux/users/user_types";
import { useTheme } from "../../../ThemeContext";

export default function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { auth, user } = useSelector((state) => state.userReducer);
  const { theme, setTheme } = useTheme();

  const themes = [
    { key: "light", label: "White · Sky & Crimson" },
    { key: "dark", label: "Dark" },
  ];

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <button
          className="brand"
          type="button"
          onClick={() => navigate("/")}
          aria-label="Thunder Notes home"
        >
          <span className="brand-mark"><FiZap /></span>
          <span>thunder <span className="brand-light">notes</span></span>
        </button>

        <nav className="header-actions" aria-label="Main navigation">
          <div className="theme-selector">
            <select
              className="theme-select"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              aria-label="Color theme"
            >
              {themes.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>

          {auth ? (
            <>
              <button
                className="button-secondary header-notes-link"
                onClick={() => navigate("/notes")}
              >
                <FiGrid /> My notes
              </button>
              <Menu>
                <MenuButton as="button" className="profile-button" aria-label="Open profile menu">
                  <Avatar
                    name={typeof user === "string" ? user : ""}
                    size="sm"
                    className="profile-avatar"
                  />
                  <span className="profile-name">{typeof user === "string" ? user : "Account"}</span>
                </MenuButton>
                <MenuList className="profile-menu">
                  <MenuItem onClick={() => navigate("/notes")}>
                    <FiGrid /> My notes
                  </MenuItem>
                  <MenuItem onClick={() => dispatch({ type: LOGOUT })}>
                    <FiLogOut /> Sign out
                  </MenuItem>
                </MenuList>
              </Menu>
            </>
          ) : (
            <>
              <button className="header-signin" onClick={() => navigate("/login")}>
                Sign in
              </button>
              <button className="button-primary header-cta" onClick={() => navigate("/register")}>
                Get started <FiArrowUpRight />
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
