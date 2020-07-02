const express = require("express");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const User = require("../models/user");

const router = new express.Router();

/** POST /login - login: {username, password} => {token} */

router.post("/login", async function(req, res, next) {
    try {
        const user = await User.authenticate(req.body);
        let token = jwt.sign({username: user.username, is_admin: user.is_admin}, SECRET_KEY);
        
        return res.json({ token });

    } catch (err) {
        return next(err);
    }
});


module.exports = router;