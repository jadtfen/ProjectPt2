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
        const { userId } = response.data;
        await sendVerificationEmail(email, userId);
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

  const sendVerificationEmail = async (email, userId) => {
    console.log('Sending verification email');
    console.log('Email:', email);
    console.log('User ID:', userId);

    try {
      const response = await axios.post(
        buildPath('api/auth/sendVerificationEmail'),
        { email, userId },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );

      console.log('Verification email response:', response);

      if (response.status === 200) {
        console.log('Verification email sent successfully');
        setMessage('Registration successful. Please check your email to verify your account.');
        navigate('/wait'); // Navigate to a waiting or confirmation page
      } else {
        console.log('Verification email sending failed:', response.data.message || 'Unknown error');
        setMessage(`Verification email sending failed: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Verification email sending error:', error);
      const errorMessage = error.response?.data?.message || 'Verification email sending failed: Unknown error';
      setMessage(errorMessage);
    }
  };

  const handleRegister = (event) => {
    event.preventDefault();
    if (registerEmail && registerUsername && registerPassword) {
      console.log('All fields provided');
      register(registerEmail, registerUsername, registerPassword);
    } else {
      console.log('Missing required fields');
      setMessage('All fields are required.');
    }
  };

  return (
    <div className="register-container">
      <div id="registerDiv">
        <form onSubmit={handleRegister}>
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
        {message && <span id="registerResult">{message}</span>}
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
