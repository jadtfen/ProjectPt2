import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './styles/JoinPage.css';

const app_name = 'socialmoviebackend-4584a07ae955'; // Define the app_name

function buildPath(route) {
  if (process.env.NODE_ENV === 'production') {
    return 'https://' + app_name + '.herokuapp.com/' + route;
  } else {
    return 'http://localhost:5000/' + route;
  }
}

const JoinPage = () => {
  const [partyInviteCode, setPartyInviteCode] = useState('');
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState('');
  const navigate = useNavigate();

  const useQuery = () => {
    return new URLSearchParams(useLocation().search);
  };

  const query = useQuery();

  useEffect(() => {
    const code = query.get('code');
    if (code) {
      setPartyInviteCode(code);
    }

    const storedUserId = localStorage.getItem('userID');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      setMessage('User ID not found. Please log in.');
    }
  }, [query]);

  const handleJoinParty = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(buildPath('api/party/joinParty'), {
        partyInviteCode,
        userID: userId,
      }, {
        withCredentials: true,
      });

      const result = response.data;

      if (response.status === 200) {
        if (result.userAlreadyInParty) {
          navigate('/home');
        } else {
          setMessage(`Successfully joined the party! Party ID: ${result.partyID}`);
          const pollResponse = await axios.post(buildPath('api/poll/startPoll'), {
            partyID: result.partyID,
          });

          const pollData = pollResponse.data;
          if (pollResponse.status === 200) {
            localStorage.setItem('pollID', pollData.pollID);
            setMessage('Poll started successfully!');
            navigate('/home'); // Redirect to home page after starting poll
          } else {
            setMessage(`Error creating poll: ${pollData.error || 'Unknown error'}`);
          }
        }
      } else {
        setMessage(result.message || 'Unknown error occurred');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Server error. Please try again later.');
    }
  };

  return (
    <div className="container">
      <div id="joinDiv">
        <form onSubmit={handleJoinParty}>
          <span id="inner-title">JOIN PARTY</span><br />
          <input
            type="text"
            className="inputField"
            value={partyInviteCode}
            onChange={(e) => setPartyInviteCode(e.target.value)}
            placeholder="Party Invite Code"
            required
          /><br />
          <input
            type="submit"
            id="joinButton"
            value="Join Party"
          />
        </form>
        {message && <p id="joinResult">{message}</p>}
        <div className="create-party">
          <span>Don't have a party invite code? <a href="/createParty" id="createPartyLink">Create a Party</a></span>
        </div>
      </div>
    </div>
  );
};

export default JoinPage;
