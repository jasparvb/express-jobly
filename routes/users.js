const express = require("express");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const {ensureLoggedIn, ensureCorrectUser} = require("../middleware/auth");

const router = new express.Router();

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, email, photo_url} => {token}.
 */
router.post("/", async function(req, res, next) {
    try {
        const user = await User.register(req.body);
        let token = jwt.sign({username: user.username, is_admin: user.is_admin}, SECRET_KEY);
        return res.status(201).json({ token });
    } catch (err) {
        return next(err);
    }
});

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, email}, ...]}
 *
 **/
router.get("/", ensureLoggedIn, async function(req, res, next) {
    try {
        const users = await User.getAll();
  
        return res.json({ users });
    } catch (err) {
        return next(err);
    }
});

/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, email, photo_url}}
 *
 **/
router.get("/:username/", ensureCorrectUser, async function(req, res, next) {
    try {
        const user = await User.get(req.params.username);
  
        return res.json({ user });
    } catch (err) {
        return next(err);
    }
});
