import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './styles/JoinPage.css';

const app_name = 'socialmoviebackend-4584a07ae955';

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
      console.log('Party invite code from URL:', code);
      setPartyInviteCode(code);
    }

    const storedUserId = localStorage.getItem('userID');
    if (storedUserId) {
      console.log('Stored user ID:', storedUserId);
      setUserId(storedUserId);
    } else {
      console.log('User ID not found. Please log in.');
      setMessage('User ID not found. Please log in.');
    }
  }, [query]);

  const handleJoinParty = async (event) => {
    event.preventDefault();
    console.log('Attempting to join party with code:', partyInviteCode);
    console.log('User ID:', userId);
    try {
      const response = await axios.post(buildPath('api/party/joinParty'), {
        partyInviteCode,
        userID: userId,
      }, {
        withCredentials: true,
      });

      console.log('Join party response:', response);

      const result = response.data;

      if (response.status === 200) {
        if (result.userAlreadyInParty) {
          console.log('User already in party.');
        } else {
          console.log('Successfully joined the party! Party ID:', result.partyID);
          setMessage(`Successfully joined the party! Party ID: ${result.partyID}`);
          const pollResponse = await axios.post(buildPath('api/poll/startPoll'), {
            partyID: result.partyID,
          });

          console.log('Start poll response:', pollResponse);

          const pollData = pollResponse.data;
          if (pollResponse.status === 200) {
            console.log('Poll started successfully! Poll ID:', pollData.pollID);
            localStorage.setItem('pollID', pollData.pollID);
            setMessage('Poll started successfully!');
            navigate('/home'); 
          } else {
            console.log('Error creating poll:', pollData.error || 'Unknown error');
            setMessage(`Error creating poll: ${pollData.error || 'Unknown error'}`);
          }
        }
      } else {
        console.log('Error response:', result.message || 'Unknown error occurred');
        setMessage(result.message || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Server error:', error);
      setMessage(error.response?.data?.message || 'Server error. Please try again later.');
    }
  };

  return (
    <div className="join-container">
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
