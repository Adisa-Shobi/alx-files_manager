const fs = require('fs');
const { ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class FilesController {
  static async postUpload(req, res) {
    const path = process.env.FOLDER_PATH || '/tmp/files_manager';
    const error = { error: 'Unauthorized' };
    const acceptedTypes = ['folder', 'file', 'image'];
    const token = req.header('X-token');

    if (!token) return res.status(401).json(error);

    const userId = await redisClient.get(`auth_${token}`);

    const userObj = await dbClient.users.findOne({ _id: ObjectId(userId) });

    if (!userObj) return res.status(401).json(error);

    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Missing name' });

    if (!type || !acceptedTypes.includes(type)) return res.status(400).json({ error: 'Missing type' });

    if (!data && type !== 'folder') return res.status(400).json({ error: 'Missing data' });

    if (parentId) {
      const fileObj = await dbClient.files.findOne({ _id: ObjectId(parentId) });
      if (!fileObj) return res.status(400).json({ error: 'Parent not found' });
      if (fileObj.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    if (type === 'folder') {
      const file = {
        name, type, userId, parentId, isPublic, data,
      };
      await dbClient.files.insertOne(file);
      file.id = file._id;
      delete file._id;
      return res.status(201).json(file);
    }

    // creates the file storage directory if it does not exist
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }

    const filename = uuidv4();
    const clearData = Buffer.from(data, 'base64').toString('utf-8');
    const localPath = `${path}/${filename}`;

    const file = {
      name, type, userId, parentId, isPublic, localPath,
    };

    fs.writeFile(localPath, clearData, { flag: 'wx' }, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      await dbClient.files.insertOne(file);
      file.id = file._id;
      delete file._id;
      delete file.localPath;
      return res.status(201).json(file);
    });
    return 0;
  }
}

module.exports = FilesController;
