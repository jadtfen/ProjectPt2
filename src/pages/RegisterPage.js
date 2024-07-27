import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './styles/Register.css';

const app_name = 'socialmoviebackend-4584a07ae955'; 

function buildPath(route) {
  if (process.env.NODE_ENV === 'production') {
    return 'https://' + app_name + '.herokuapp.com/' + route;
  } else {
    return 'http://localhost:5000/' + route;
  }
}

function RegisterPage() {
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const register = async (email, name, password) => {
    console.log('Starting registration process');
    console.log('Email:', email);
    console.log('Username:', name);
    console.log('Password:', password);

    try {
      const response = await axios.post(
        buildPath('api/auth/register'),
        { email, name, password },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );

      console.log('Registration response:', response);

      if (response.status === 201) {
        console.log('Registration successful');
        setMessage('Registration successful. Please check your email to verify your account.');
        navigate('/wait'); // Navigate to a waiting or confirmation page
      } else {
        console.log('Registration failed:', response.data.message || 'Unknown error');
        setMessage(`Registration failed: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed: Unknown error';
      setMessage(errorMessage);
    }
  };

  return (
    <div className="register-container">
      <div id="registerDiv">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            console.log('Form submitted');
            register(registerEmail, registerUsername, registerPassword);
          }}
        >
          <span id="inner-title">REGISTER</span>
          <br />
          <input
            type="text"
            id="registerUsername"
            placeholder="Username"
            value={registerUsername}
            onChange={(e) => {
              console.log('Username changed:', e.target.value);
              setRegisterUsername(e.target.value);
            }}
          />
          <br />
          <input
            type="email"
            id="registerEmail"
            placeholder="Email"
            value={registerEmail}
            onChange={(e) => {
              console.log('Email changed:', e.target.value);
              setRegisterEmail(e.target.value);
            }}
          />
          <br />
          <input
            type="password"
            id="registerPassword"
            placeholder="Password"
            value={registerPassword}
            onChange={(e) => {
              console.log('Password changed:', e.target.value);
              setRegisterPassword(e.target.value);
            }}
          />
          <br />
          <input
            type="submit"
            id="registerButton"
            className="buttons"
            value="Register"
          />
        </form>
        <span id="registerResult">{message}</span>
        <div>
          <span>
            If you already have an account, <Link to="/login">Login</Link>
          </span>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
