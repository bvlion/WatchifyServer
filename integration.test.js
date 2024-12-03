const admin = require('firebase-admin')
require('dotenv').config()

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CREDENTIAL_JSON)),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
})

const db = admin.database()
const messaging = admin.messaging()

describe('Integration Test for Firebase', () => {
  let testRef

  beforeAll(() => {
    testRef = db.ref('/testNotifier')
  })

  afterAll(async () => {
    try {
      await testRef.remove()
    } catch (error) {
      console.error('Error cleaning up test data:', error)
    }
  })

  test('should handle database changes', async () => {
    const testData = { timestamp: Date.now(), foo: 'bar' }

    await testRef.child('testKey').set(testData)

    const snapshot = await testRef.child('testKey').once('value')
    expect(snapshot.val()).toEqual(testData)
  })

  test('send FCM error', async () => {
    const message = {
      token: 'fakeFCMToken',
      data: { type: 'start', foo: 'bar', timestamp: Date.now() },
      android: { priority: 'high', ttl: 3600 },
    }

    try {
      await messaging.send(message)
    } catch (error) {
      expect(error.message).toEqual('data must only contain string values')
    }
  })

  const TEST_REAL_FCM = process.env.TEST_REAL_FCM === 'true';

  (TEST_REAL_FCM ? test : test.skip)('send FCM ok', async () => {
    const snapshot = await db.ref('fcmToken').limitToFirst(1).once('value')
    const key = Object.keys(snapshot.val())[0]
    const value = snapshot.val()[key]
    const message = {
      token: value,
      data: { type: 'start', foo: 'bar' },
      android: { priority: 'high', ttl: 3600 },
    }

    const response = await messaging.send(message)
    expect(response).toBeDefined()
    console.log('FCM Response:', response)
  })
})

