const admin = require('firebase-admin')
const logger = require('./logger')
require('dotenv').config()

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CREDENTIAL_JSON)),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});
const db = admin.database()

db.ref('/notifier').on('child_changed', async (changedSnapshot) => {
  const key = changedSnapshot.key
  const json = changedSnapshot.val()
  logger.exec.info('key: ' + key)
  logger.exec.info(json)

  delete json['timestamp']
  const message = {
    data: json,
    token: (await db.ref('/fcmToken/' + key).once('value')).val()
  }
  admin.messaging().send(message)
    .then((response) => {
      logger.exec.info('Successfully sent message:', response);
    })
    .catch((error) => {
      logger.exec.warn('Error sending message:', error);
    })
})
