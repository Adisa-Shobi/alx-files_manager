const sha1 = require('sha1');
const dbClient = require('../utils/db');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const isUser = await dbClient.db.collection('users').findOne(
      { email },
    );

    if (isUser) {
      return res.status(400).json({ error: 'Already exist' });
    }

    const sha1Password = sha1(password);
    let result;
    try {
      result = await dbClient.db.collection('users').insertOne(
        { email, password: sha1Password },
      );
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    const user = { id: result.insertedId, email };
    return res.status(201).send(user);
  }
}

module.exports = UsersController;
