const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class AuthController {
  static async getConnect(req, res) {
    let authData = req.header('Authorization') || '';
    authData = authData.split(' ');
    const creds = authData[authData.length - 1];
    const binData = Buffer.from(creds, 'base64').toString('utf-8');
    const user = binData.split(':');
    const userObj = await dbClient.users.findOne({
      email: user[0],
      password: sha1(user[1]),
    });
    if (!userObj) return res.status(401).json({ error: 'Unauthorized' });

    // If the user object exists move on to create auth token
    const authToken = uuidv4();
    const key = `auth_${authToken}`;
    console.log(userObj);
    redisClient.set(key, userObj._id.toString(), 24 * 60 * 60);
    return res.status(200).json({ token: authToken });
  }

  // Disconnects the user from th API access
  static async getDisconnect(req, res) {
    const token = req.header('X-Token') || '';

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    redisClient.del(key);
    return res.status(204).send();
  }
}

module.exports = AuthController;
