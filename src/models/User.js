const db = require('../config/database');

class User {
    static getByEmail(email) {
        return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    }

    static getById(id) {
        return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    }
}

module.exports = User;
