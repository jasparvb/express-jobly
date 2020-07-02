/** User class for jobly */
const db = require("../db");
const ExpressError = require("../helpers/expressError");
const partialUpdate = require("../helpers/partialUpdate");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");


/** User of the site. */

class User {

    /** register new user -- returns
    *    {username, password, is_admin}
    */

    static async register({username, password, first_name, last_name, email, photo_url}) {
        //Check to see if username already exists
        const checkUsername = await db.query(
            `SELECT username FROM users WHERE username = $1`, [username]
        );
        if (checkUsername.rows[0]) {
            throw new ExpressError(`The username '${username}' already exists`, 400);
        }
        const hashedPassword = await bcrypt.hash(
            password, BCRYPT_WORK_FACTOR);
        const result = await db.query(
        `INSERT INTO users (username, 
            password, 
            first_name, 
            last_name, 
            email, 
            photo_url)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING username, password, is_admin`,
        [username, hashedPassword, first_name, last_name, email, photo_url]
        );
        return result.rows[0];
    }

    /** Login user */

    static async authenticate(data) {
        const result = await db.query(
            `SELECT username, 
                password, 
                is_admin
            FROM users 
            WHERE username = $1`,
            [data.username]
        );

        const user = result.rows[0];

        if (user) {
            const valid = await bcrypt.compare(data.password, user.password);
            if (valid) {
                return user;
            }
        }

        throw ExpressError("Invalid Username/Password", 401);
    }

    /** Get all users. */

    static async getAll() {
        const result = await db.query(
            `SELECT username, first_name, last_name, email
            FROM users
            ORDER BY username`
        );

        return result.rows;
    }

    /** Retrieve a user given a username. */

    static async getUser(username) {
        const result = await db.query(
            `SELECT username, first_name, last_name, email, photo_url 
            FROM users 
            WHERE username = $1`,
        [username]
        );

        if (!result.rows[0]) {
            throw new ExpressError(`There is no user with the username '${username}'`, 404);
        }
        return result.rows[0];
    }

    /** Update a user using partial update */

    static async update(username, data) {
        if (data.password) {
            data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
        }
    
        let { query, values } = partialUpdate("users", data, "username", username);
    
        const result = await db.query(query, values);
        const user = result.rows[0];
    
        if (!user) {
            throw new ExpressError(`There is no user with the username '${username}'`, 404);
        }
    
        delete user.password;
        delete user.is_admin;
    
        return user;
    }
    
      /** Delete user given username */
    
    static async remove(username) {
        let result = await db.query(
            `DELETE FROM users 
            WHERE username = $1
            RETURNING username`,
            [username]
        );
    
        if (result.rows.length === 0) {
            throw new ExpressError(`There is no user with the username '${username}'`, 404);
        }
    }
}
module.exports = User;