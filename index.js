const admin = require('firebase-admin')
const logger = require('./logger')
const cron = require('node-cron')
require('dotenv').config()

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CREDENTIAL_JSON)),
  databaseURL: process.env.FIREBASE_DATABASE_URL
})
const db = admin.database()

db.ref('/notifier').on('child_changed', async (changedSnapshot) => {
  const key = changedSnapshot.key
  const json = changedSnapshot.val()
  logger.exec.info('start key: ' + key)
  logger.exec.info(json)

  delete json['timestamp']
  json['type'] = 'start'
  const message = {
    token: (await db.ref('/fcmToken/' + key).once('value')).val(),
    data: json,
    android: { priority: 'high', ttl: 1 }
  }

  admin.messaging().send(message)
    .then((response) => {
      logger.exec.info('Successfully sent message:', response)
    })
    .catch((error) => {
      logger.exec.warn('Error sending message:', error)
    })
})

db.ref('/stop').on('child_changed', async (changedSnapshot) => {
  const key = changedSnapshot.key
  const json = changedSnapshot.val()
  logger.exec.info('stop key: ' + key)
  logger.exec.info(json)

  delete json['timestamp']
  json['type'] = 'stop'
  const message = {
    data: json,
    token: (await db.ref('/fcmToken/' + key).once('value')).val()
  }
  admin.messaging().send(message)
    .then((response) => {
      logger.exec.info('Successfully sent message:', response)
    })
    .catch((error) => {
      logger.exec.warn('Error sending message:', error)
    })
})

cron.schedule('0 6 * * *', async () => {
  const json = (await db.ref('fcmToken').once('value')).val()
  Object.entries(json).forEach(([key, value]) => {
    const data = {
      message: 'test'
    }
    const message = {
      data: data,
      token: value
    }
    admin.messaging().send(message)
      .then((response) => {
        logger.exec.info('Successfully sent message:', response)
      })
      .catch((error) => {
        if (error.code === "messaging/invalid-registration-token" ||
            error.code === "messaging/registration-token-not-registered") {
          ['fcmToken', 'notifier', 'stop'].forEach(reference => {
            db.ref(reference).child(key).remove()
              .then(() => {
                logger.exec.info('remove invalid token: ', value)
              })
              .catch((err) => {
                logger.exec.warn('remove invalid token error: ' + value, err)
              })
          })
        }
      })
  })
})
