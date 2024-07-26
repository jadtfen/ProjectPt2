const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Party = require('../models/Party');
const PartyMembers = require('../models/PartyMembers');
const Poll = require('../models/Poll');
const Movie = require('../models/Movie');
const { ObjectId } = require('mongodb');

// Generates unique party invite code when creating new party
const generateUniquePartyCode = async () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code;
  let isUnique = false;

  while (!isUnique) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    const existingParty = await Party.findOne({ partyInviteCode: code });
    if (!existingParty) {
      isUnique = true;
    }
  }
  return code;
};

// Edit Party Name
router.post('/EditPartyName', async (req, res) => {
  const { newPartyName, hostID } = req.body;

  if (!hostID) {
    return res.status(400).json({ message: 'Host ID is required' });
  }

  try {
    const party = await Party.findOne({ hostID });

    if (!party) {
      return res.status(404).json({ message: 'Party not found' });
    }

    party.partyName = newPartyName;
    await party.save();

    res.status(200).json({ message: 'Party name updated successfully', party });
  } catch (err) {
    console.error('Error updating party name:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create party
router.post('/create', async (req, res) => {
  const { partyName } = req.body;
  const userID = req.session.userId;

  if (!userID) {
    return res.status(401).json({ message: 'userID not found' });
  }

  try {
    const existingParty = await Party.findOne({ hostID: userID });

    if (existingParty) {
      return res.status(400).json({ message: 'User already has a party' });
    }

    const partyInviteCode = await generateUniquePartyCode();

    const newParty = new Party({
      partyName,
      hostID: userID,
      partyInviteCode,
    });

    const savedParty = await newParty.save();

    const newPoll = new Poll({
      pollID: Date.now(),
      partyID: savedParty._id,
      movieID: null,
      votes: 0,
      watchedStatus: false,
    });

    const savedPoll = await newPoll.save();

    const newMember = new PartyMembers({
      userID: userID,
      partyID: savedParty._id,
    });

    await newMember.save();

    res.status(201).json({
      message: 'Party, Poll, and Membership created successfully',
      party: savedParty,
      poll: savedPoll,
    });
  } catch (err) {
    console.error('Error creating party, poll, and membership:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Join Party
router.post('/joinParty', async (req, res) => {
  const { partyInviteCode, userID } = req.body;

  try {
    const user = await User.findById(userID);
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (!user.isEmailVerified) {
      return res.status(400).json({ message: 'Please verify your email first' });
    }

    const party = await Party.findOne({ partyInviteCode });
    if (!party) {
      return res.status(400).json({ message: 'Party not found' });
    }

    const isAlreadyInParty = party.members.includes(userID);
    if (isAlreadyInParty) {
      return res.status(200).json({ userAlreadyInParty: true, partyID: party._id });
    }

    party.members.push(userID);
    await party.save();

    const newMember = new PartyMembers({
      userID,
      partyID: party._id,
    });

    await newMember.save();

    res.status(200).json({ userAlreadyInParty: false, partyID: party._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Home Endpoint
router.get('/home', async (req, res) => {
  const userID = req.session.userId;

  if (!userID) {
    return res.status(401).json({ message: 'userID not found in session' });
  }

  try {
    const partyMember = await PartyMembers.findOne({ userID }).populate('partyID');
    if (!partyMember) {
      return res.status(404).json({ message: 'Party not found for user' });
    }

    const partyID = partyMember.partyID._id;

    const party = await Party.findById(partyID).populate('hostID');
    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }

    const guests = await PartyMembers.find({ partyID }).populate('userID');

    const guestDetails = guests.map((guest) => ({
      userName: guest.userID.username,
      userEmail: guest.userID.email,
    }));

    const polls = await Poll.find({ partyID });

    const moviesWithDetails = await Promise.all(
      polls.map(async (poll) => {
        if (!poll.movies || poll.movies.length === 0) return [];
        return await Promise.all(
          poll.movies.map(async (movieEntry) => {
            if (!movieEntry.movieID) {
              return {
                movieName: 'No movie assigned',
                votes: movieEntry.votes,
                watchedStatus: movieEntry.watchedStatus,
                genre: null,
                description: null,
              };
            }
            const movie = await Movie.findOne({ movieID: movieEntry.movieID });
            if (!movie) {
              return null;
            }
            return {
              movieName: movie.title,
              votes: movieEntry.votes,
              watchedStatus: movieEntry.watchedStatus,
              genre: movie.genre,
              description: movie.description,
            };
          })
        );
      })
    );

    const topVotedMovie = moviesWithDetails.flat().reduce((top, movie) => {
      if (!movie) return top;
      return movie.votes > (top.votes || 0) ? movie : top;
    }, {});

    res.status(200).json({
      partyName: party.partyName,
      partyInviteCode: party.partyInviteCode,
      hostName: party.hostID.name,
      guests: guestDetails,
      topVotedMovie: topVotedMovie.movieName || 'No votes yet',
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Leave Party
router.post('/leaveParty', async (req, res) => {
  const userID = req.session.userId;

  if (!userID) {
    return res.status(401).json({ message: 'userID not found' });
  }

  try {
    const userObjectId = new ObjectId(userID);

    const partyMember = await PartyMembers.findOne({ userID: userObjectId });
    if (!partyMember) {
      return res.status(400).json({ message: 'User is not in any party' });
    }

    const partyObjectId = partyMember.partyID;

    const currentMembers = await PartyMembers.find({ partyID: partyObjectId });

    await PartyMembers.deleteOne({
      userID: userObjectId,
      partyID: partyObjectId,
    });

    const updatedMembers = await PartyMembers.find({ partyID: partyObjectId });

    await User.updateOne(
      { _id: userObjectId },
      { $set: { status: 0 } }
    );

    res.status(200).json({ message: 'Left party successfully' });
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

module.exports = router;
