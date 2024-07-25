import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Import Link
import './styles/Register.css';

function RegisterPage() {
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [message, setMessage] = useState('');

  const register = async (email, name, password) => {
    try {
      // Call the registration API
      const registerResponse = await axios.post(
        'https://socialmoviebackend-4584a07ae955.herokuapp.com/api/auth/register',
        { email, name, password },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );

      console.log('Registration response:', registerResponse);
      console.log('Registration data:', registerResponse.data);

      if (registerResponse.status === 201) {
        // Successful registration
        console.log('Registration successful');
        setMessage('Registration successful. Please check your email to verify your account.');

        // Extract the email token from the response if necessary
        const emailToken = registerResponse.data.emailToken;

        // Call the email verification API
        await sendVerificationEmail(email, emailToken);

        // Redirect or update the UI
        window.location.href = '/wait';
      } else {
        // Registration failed
        console.log('Registration failed');
        console.log('Registration error:', registerResponse.data.error);
        setMessage(`Registration failed: ${registerResponse.data.error}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage('Registration failed');
    }
  };

  const sendVerificationEmail = async (email, emailToken) => {
    try {
      // Call the email verification API
      const response = await axios.post(
        'https://socialmoviebackend-4584a07ae955.herokuapp.com/api/auth/sendEmail',
        { email, emailToken },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );

      console.log('Send email response:', response);
      console.log('Send email data:', response.data);

      if (response.status === 200) {
        console.log('Verification email sent');
      } else {
        console.log('Failed to send verification email');
        console.log('Send email error:', response.data.error);
        setMessage(`Failed to send verification email: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Send email error:', error);
      setMessage('Failed to send verification email');
    }
  };

  return (
    <div className="container">
      <div id="registerDiv">
        <form
          onSubmit={(e) => {
            e.preventDefault();
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
            onChange={(e) => setRegisterUsername(e.target.value)}
          />
          <br />
          <input
            type="email"
            id="registerEmail"
            placeholder="Email"
            value={registerEmail}
            onChange={(e) => setRegisterEmail(e.target.value)}
          />
          <br />
          <input
            type="password"
            id="registerPassword"
            placeholder="Password"
            value={registerPassword}
            onChange={(e) => setRegisterPassword(e.target.value)}
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
