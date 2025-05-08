const { CognitoJwtVerifier } = require('aws-jwt-verify');
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SK);
var AWS = require("aws-sdk");
AWS.config.update({ 
  region: "us-east-2",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

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
    mode: 'subscription',
    return_url: `${process.env.DEPLOYED_URL}return?session_id={CHECKOUT_SESSION_ID}`,
    customer_email: req.body.email,
  });

  res.send({clientSecret: session.client_secret});
});

router.get('/session-status', async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
  
  if (session.status === 'complete') {
    var ddb = new AWS.DynamoDB({ apiVersion: "2012-08-10" });
    var params = {
      TableName: "AmplifyDataStore-hwc3jm3okngk7hddmj2su73qqu-dev",
      Key: {
        ds_pk: { S: session.customer_details.email },
        ds_sk: { S: "premium_user" }
      },
      UpdateExpression: "SET premium = :premium",
      ExpressionAttributeValues: {
        ":premium": { BOOL: true }
      },
      ReturnValues: "ALL_NEW"
    };

    try {
      await ddb.updateItem(params).promise();
    } catch (err) {
      console.error("Error updating premium status:", err);
    }
  }

  res.send({
    status: session.status,
    customer_email: session.customer_details.email
  });
});

router.get('/get-status', async (req, res) => {
  const email = req.query.email;
  if(!email){
    res.status(401).json({error: "No email provided"});
  }
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const payload = await verifyJWT(token);
  if (!payload){
    return res.status(401).json({error: "Token invalid."}); 
  }
  if(payload.email != email){
    return res.status(401).json({error: "Invalid token for given email"});
  }
  var ddb = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

  var params = {
    TableName: "AmplifyDataStore-hwc3jm3okngk7hddmj2su73qqu-dev",
    Key: {
      ds_pk: { S: email },
      ds_sk: { S: "premium_user" } 
    }
  };

  // Call DynamoDB to read the item from the table
  ddb.getItem(params, function (err, data) {
    if (err) {
      console.log("Error", err);
      res.status(500).json({ error: err.message });
    } else {
      if(!data.Item){
        res.json({premium: {BOOL: false}})
      }else{
        res.json(data.Item);
      }
    }
  });
});

router.get('/unsubscribe', async (req, res) => {
  const email = req.query.email;
  if(!email){
    res.status(401).json({error: "No email provided"});
  }
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const payload = await verifyJWT(token);
  if (!payload){
    return res.status(401).json({error: "Token invalid."}); 
  }
  if(payload.email != email){
    return res.status(401).json({error: "Invalid token for given email"});
  }
  var ddb = new AWS.DynamoDB({ apiVersion: "2012-08-10" });
  var params = {
    TableName: "AmplifyDataStore-hwc3jm3okngk7hddmj2su73qqu-dev",
    Key: {
      ds_pk: { S:  email},
      ds_sk: { S: "premium_user" }
    },
    UpdateExpression: "SET premium = :premium",
    ExpressionAttributeValues: {
      ":premium": { BOOL: false }
    },
    ReturnValues: "ALL_NEW"
  };

  try {
    await ddb.updateItem(params).promise();
    res.status(200).json({message: "Successfully unsubscribed"});
  } catch (err) {
    res.status(500).json({message: "Error unsubscribing"});
    console.error("Error updating premium status:", err);
  }
});

module.exports = router;
