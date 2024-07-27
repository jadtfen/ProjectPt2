import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './styles/SearchPage.css';

const app_name = 'socialmoviebackend-4584a07ae955';

function buildPath(route) {
  if (process.env.NODE_ENV === 'production') {
    return 'https://' + app_name + '.herokuapp.com/' + route;
  } else {
    return 'http://localhost:5000/' + route;
  }
}

const SearchPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [allMovies, setAllMovies] = useState([]);
  const [showingAllMovies, setShowingAllMovies] = useState(true);
  const navigate = useNavigate();
  const [pollID, setPollID] = useState(localStorage.getItem('pollID') || '');
  const [partyID, setPartyID] = useState(localStorage.getItem('partyID') || '');

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        console.log('Fetching all movies...');
        const response = await fetch(buildPath('api/displayMovies'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        const responseData = await response.text(); // Get response as text
        console.log('Fetch movies response:', responseData);

        if (!response.ok) {
          console.log('Response not OK, status:', response.status);
          console.log('Response body:', responseData);
          setErrorMessage('Failed to fetch movies. Please try again later.');
          return;
        }

        try {
          const data = JSON.parse(responseData); // Parse successful JSON
          console.log('Fetched movies:', data);
          setAllMovies(data);
          setErrorMessage('');
        } catch (e) {
          console.error('Error parsing JSON:', e);
          console.log('Response body was not JSON:', responseData);
          setErrorMessage('Failed to fetch movies. Please try again later.');
        }
      } catch (error) {
        console.error('Fetch movies error:', error);
        setErrorMessage('Failed to fetch movies. Please try again later.');
        setAllMovies([]);
      }
    };

    fetchMovies();
  }, []);

  const handleSearch = async () => {
    if (searchTerm === '') {
      setShowingAllMovies(true);
    } else {
      try {
        console.log('Searching for movies with term:', searchTerm);
        const response = await fetch(buildPath('api/searchMovie'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ search: searchTerm }),
          credentials: 'include',
        });

        const responseData = await response.text(); // Get response as text
        console.log('Search response:', responseData);

        if (!response.ok) {
          console.log('Response not OK, status:', response.status);
          console.log('Response body:', responseData);
          setErrorMessage('Search failed. Please try again later.');
          setShowingAllMovies(true);
          return;
        }

        try {
          const data = JSON.parse(responseData); // Parse successful JSON
          setAllMovies(data);
          setShowingAllMovies(false);
          setErrorMessage('');
        } catch (e) {
          console.error('Error parsing JSON:', e);
          console.log('Response body was not JSON:', responseData);
          setErrorMessage('Search failed. Please try again later.');
          setShowingAllMovies(true);
        }
      } catch (error) {
        console.error('Search error:', error);
        setErrorMessage('Search failed. Please try again later.');
        setAllMovies([]);
        setShowingAllMovies(true);
      }
    }
  };

  const handleAddToPoll = async (movieID) => {
    const partyID = localStorage.getItem('partyID');
    const userId = localStorage.getItem('userID');

    // Ensure movieID is a number
    const movieIDNumber = Number(movieID);

    if (isNaN(movieIDNumber)) {
      console.error('Invalid movie ID:', movieID);
      setErrorMessage('Invalid movie ID.');
      return;
    }

    try {
      console.log('Adding movie to poll with ID:', movieIDNumber);
      const response = await fetch(buildPath('api/poll/addMovieToPoll'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ movieID: movieIDNumber, partyID, userId }),
        credentials: 'include',
      });

      const result = await response.text(); // Get response as text
      console.log('Add to poll response:', result);

      if (response.ok) {
        try {
          const resultData = JSON.parse(result); // Parse successful JSON
          console.log('Movie added to poll:', resultData);

          // Save movie to localStorage
          const existingMovies = JSON.parse(localStorage.getItem('pollMovies')) || [];
          if (!existingMovies.includes(movieIDNumber)) {
            existingMovies.push(movieIDNumber);
            localStorage.setItem('pollMovies', JSON.stringify(existingMovies));
          }
        } catch (e) {
          console.error('Error parsing JSON:', e);
          console.log('Response body was not JSON:', result);
          setErrorMessage('Failed to add movie to poll. Please try again later.');
        }
      } else {
        const errorData = JSON.parse(result); // Parse error JSON
        console.error('Error adding movie to poll:', errorData.error);
        setErrorMessage(errorData.error || 'Failed to add movie to poll.');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setErrorMessage('Failed to add movie to poll. Please try again later.');
    }
  };

  const filteredMovies = searchTerm
    ? allMovies.filter((movie) =>
        movie.title.toLowerCase().startsWith(searchTerm.toLowerCase())
      )
    : allMovies;

  return (
    <div className="search-page-container">
      <h1 className="search-header">Search Movies</h1>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search movies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      <div className="movie-list">
        <h2>{showingAllMovies ? 'All Movies' : 'Search Results'}</h2>
        <div className="movie-grid">
          {filteredMovies.length === 0 ? (
            <div className="no-results">No movies available.</div>
          ) : (
            filteredMovies.map((movie, index) => (
              <div key={index} className="movie-box">
                <div className="movie-title">{movie.title}</div>
                <button
                  className="add-button"
                  onClick={() => handleAddToPoll(movie.movieID)}
                >
                  Add To Poll
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="navigation-bar">
        <div className="nav-item current-page">
          <Link to="/search">Search</Link>
        </div>
        <div className="nav-item">
          <Link to="/vote">Vote</Link>
        </div>
        <div className="nav-item">
          <Link to="/home">Home</Link>
        </div>
        <div className="nav-item">
          <Link to="/profile">Profile</Link>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
