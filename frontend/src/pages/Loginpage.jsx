import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getUser } from "../redux/users/user_actions";

export default function Loginpage() {
  const { auth, loading } = useSelector((state) => state.userReducer);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (auth) navigate("/notes", { replace: true });
  }, [auth, navigate]);

  const handleLogin = (event) => {
    event.preventDefault();
    dispatch(getUser({ email, password }));
  };

  return (
    <main className="auth-page">
      <section className="auth-layout">
        <header className="auth-heading">
          <span className="section-kicker">WELCOME BACK</span>
          <h1>Your space is waiting.</h1>
          <p>Sign in to pick up right where you left off.</p>
        </header>
        <Box as="form" className="auth-panel" onSubmit={handleLogin}>
          <Stack spacing={5}>
            <FormControl id="email" isRequired>
              <FormLabel>Email address</FormLabel>
              <Input
                autoComplete="email"
                type="email"
                value={email}
                placeholder="you@example.com"
                onChange={(event) => setEmail(event.target.value)}
              />
            </FormControl>
            <FormControl id="password" isRequired>
              <FormLabel>Password</FormLabel>
              <Input
                autoComplete="current-password"
                type="password"
                value={password}
                placeholder="Your password"
                onChange={(event) => setPassword(event.target.value)}
              />
            </FormControl>
            <Button className="auth-submit" type="submit" isLoading={loading}>
              Sign in
            </Button>
            <p className="auth-switch">
              New to Thunder Notes?{" "}
              <button type="button" onClick={() => navigate("/register")}>
                Create an account
              </button>
            </p>
          </Stack>
        </Box>
      </section>
    </main>
  );
}
