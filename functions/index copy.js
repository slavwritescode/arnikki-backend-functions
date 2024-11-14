/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
//keeping this just in case...
const {onRequest, onCall} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require('firebase-admin');
// const storage = admin.storage();
// if (!admin.apps.length) {
admin.initializeApp();
// }
// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

exports.helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  return response.send("Hello from Firebase!");
});

exports.registerNewUser = onCall( async({data})=> {
  // const makeid = (length) => {
  //   let result = '';
  //   const characters = 'abcdefghijklmnopqrstuvwxyz';
  //   const charactersLength = characters.length;
  //   let counter = 0;
  //   while (counter < length) {
  //       result += characters.charAt(Math.floor(Math.random() * charactersLength));
  //       counter += 1;
  //   }
  //   return result;
  // }
  logger.log(data, 'is the data');
  logger.log(data.name)
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
      return { uid: user.uid, email: data['email'], name: data['name'], role: data['role'], userId: moderatorRunningId };
    }
    
  } catch (error) {
    console.log(error);
    return {error: error};
  }

})

