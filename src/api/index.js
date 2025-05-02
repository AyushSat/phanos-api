const { CognitoJwtVerifier } = require('aws-jwt-verify');

const express = require('express');

const userPoolId = 'us-east-2_AqjEcBPFO';

async function verifyJWT(token) {
  try {
    const verifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: 'id',
      clientId: null
    });

    const payload = await verifier.verify(token);
    return payload;
  } catch (err) {
    console.error('Error verifying JWT:', err);
  }
}

const emojis = require('./emojis');

const router = express.Router();

router.get('/', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const payload = await verifyJWT(token);

  res.json({
    message: "From the backend, welcome " + payload["email"],
  });
});

router.use('/emojis', emojis);

module.exports = router;
