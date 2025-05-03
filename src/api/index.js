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

const router = express.Router();

router.get('/', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const payload = await verifyJWT(token);

  res.json({
    message: `From the backend, welcome ${payload.email}. ENV: ${process.env.NODE_ENV}${process.env.DEPLOYED_URL ? ` | ${process.env.DEPLOYED_URL}` : ''}`,
  });
});

router.post('/create-checkout-session', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const payload = await verifyJWT(token);
  if (!payload){
    return res.status(401).json({error: "Token invalid."}); 
  }
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    line_items: [
      {
        price: 'price_1RKmaQEJNDgJoqWpW9Ji5DOs',
        quantity: 1,
      },
    ],
    mode: 'payment',
    return_url: `${YOUR_DOMAIN}/return?session_id={CHECKOUT_SESSION_ID}`,
  });

  res.send({clientSecret: session.client_secret});
});

module.exports = router;
