/** User class for jobly */
const db = require("../db");
const ExpressError = require("../helpers/expressError");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");


/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, email, photo_url, is_admin}) {
    //Check to see if username already exists
    const checkUsername = await db.query(
        `SELECT username FROM users WHERE username = $1`, [username]
        );
    if (checkUsername.rows[0]) {
        throw new ExpressError(`The username '${username}' already exists`, 404);
    }
    const hashedPassword = await bcrypt.hash(
      password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
      `INSERT INTO users (username, 
        password, 
        first_name, 
        last_name, 
        email, 
        photo_url, 
        is_admin)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING username, password, first_name, last_name, email`,
      [username, hashedPassword, first_name, last_name, email, photo_url, is_admin]
    );
    return result.rows[0];
  }
}

module.exports = User;