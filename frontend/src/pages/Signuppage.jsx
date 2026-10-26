import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
} from "@chakra-ui/react";
import { useState } from "react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../constants/config";

export default function Signuppage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await axios.post(`${BASE_URL}/user/register`, {
        name,
        email,
        password,
      });
      const { message, status } = response.data;
      alert(message);
      if (status === 1) navigate("/login");
    } catch (error) {
      console.error("Registration failed:", error);
      alert(error.response?.data?.message || "Unable to create your account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-layout">
        <header className="auth-heading">
          <span className="section-kicker">A FRESH PAGE</span>
          <h1>Start with a thought.</h1>
          <p>Create your account and give your ideas a place to grow.</p>
        </header>
        <Box as="form" className="auth-panel" onSubmit={handleSignUp}>
          <Stack spacing={4}>
            <FormControl id="userName" isRequired>
              <FormLabel>Your name</FormLabel>
              <Input
                autoComplete="name"
                type="text"
                value={name}
                placeholder="How should we call you?"
                onChange={(event) => setName(event.target.value)}
              />
            </FormControl>
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
              <InputGroup>
                <Input
                  autoComplete="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  placeholder="Create a password"
                  onChange={(event) => setPassword(event.target.value)}
                />
                <InputRightElement>
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    {showPassword ? <ViewIcon /> : <ViewOffIcon />}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>
            <Button className="auth-submit" type="submit" isLoading={isSubmitting}>
              Create account
            </Button>
            <p className="auth-switch">
              Already have an account?{" "}
              <button type="button" onClick={() => navigate("/login")}>
                Sign in
              </button>
            </p>
          </Stack>
        </Box>
      </section>
    </main>
  );
}
