const { onRequest, onCall } = require("firebase-functions/v2/https");
const admin = require('firebase-admin');
const functions = require("firebase-functions");

admin.initializeApp();

exports.registerUser = onRequest({
  // region: 'asia-south1',
  cors: {
      origin: '*',
      methods: ['POST']
  }
 }, async (req, res) => {
  const data = req.body;
  let userInitialCheck;
  const db = admin.database();
  const root = 'lastModeratorId';

  try {
    userInitialCheck = await admin.auth().getUserByEmail(data['email']);
  } catch (error) {
    userInitialCheck = null;
  }

  try {
    if(userInitialCheck){
      return {message: "A user with the same email already exists!"};
    }else{
      const user = await admin.auth().createUser({
        email: data['email'],
        name: data['name'],
        password: data['password'],
        emailVerified: false,
        disabled: false
      })
      const moderatorRunningId = await db.ref(`/${root}/`).transaction((currentValue) => (currentValue) + 1)
      .then(result => result.snapshot.val());
      return res.status(200).send({ uid: user.uid, email: data['email'], name: data['name'], role: data['role'], userId: moderatorRunningId });
    }
      
      // res.status(200).send({ uid: user.uid, email: data['email'] });
  } catch (error) {
      // res.status(400).send(error.message);
      return res.status(400).send(error.message);
  }
});


