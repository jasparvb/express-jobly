const express = require("express");
const ExpressError = require("../helpers/expressError");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const jsonschema = require("jsonschema");
const userSchema = require("../schemas/user.json");
const userUpdateSchema = require("../schemas/userUpdate.json");
const {ensureLoggedIn, ensureCorrectUser} = require("../middleware/auth");
const { SECRET_KEY } = require("../config");

const router = new express.Router();

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, email, photo_url} => {token}.
 */
router.post("/", async function(req, res, next) {
    try {
        const result = jsonschema.validate(req.body, userSchema);
        if (!result.valid) {
            let listOfErrors = result.errors.map(error => error.stack);
            let err = new ExpressError(listOfErrors, 400);
            return next(err);
        }
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
router.get("/:username/", ensureLoggedIn, async function(req, res, next) {
    try {
        const user = await User.get(req.params.username);
  
        return res.json({ user });
    } catch (err) {
        return next(err);
    }
});

/** PATCH / - update user.
 *
 * {username, first_name, last_name, email, photo_url} =>
 *   {user: {username, first_name, last_name, email, photo_url}}
 *
 **/

router.patch("/:username", ensureCorrectUser, async function (req, res, next) {
    try {
        const result = jsonschema.validate(req.body, userUpdateSchema);
        if (!result.valid) {
            let listOfErrors = result.errors.map(error => error.stack);
            let err = new ExpressError(listOfErrors, 400);
            return next(err);
        }
        const user = await User.update(req.body, req.params.username);
        return res.status(201).json({ user });
    } catch (err) {
        return next(err);
    }
});

/** DELETE /[username]   => {message: "User deleted"} */

router.delete("/:username", ensureCorrectUser, async function (req, res, next) {
    try {
        await User.remove(req.params.username);
        return res.json({ message: "User deleted" });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;