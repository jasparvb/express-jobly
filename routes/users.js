const express = require("express");
const User = require("../models/user");
const {ensureLoggedIn, ensureCorrectUser} = require("../middleware/auth");

const router = new express.Router();

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
