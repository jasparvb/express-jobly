/** Middleware for handling req authorization for routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const ExpressError = require("../helpers/expressError");

/** Middleware: Requires user is authenticated. */

function ensureLoggedIn(req, res, next) {
    try {
        const tokenFromBody = req.body._token;
        const payload = jwt.verify(tokenFromBody, SECRET_KEY);
        req.user = payload; // create a current user
        
        return next();
    } catch (err) {
        next(new ExpressError("You must log in to view this page", 401))
    }
}

/** Middleware: Requires correct username. */

function ensureCorrectUser(req, res, next) {
    try {
        const tokenFromBody = req.body._token;
        const payload = jwt.verify(tokenFromBody, SECRET_KEY);
        req.user = payload; // create a current user

        if (req.user.username === req.params.username) {
            return next();
        } else {
            return next(new ExpressError("You cannot view another user's page", 401));
        }
    } catch (err) {
        // errors would happen here if we made a request and req.user is undefined
        return next(new ExpressError("You must log in to view this page", 401));
    }
}

/** Middleware: Requires user to be admin. */

function ensureAdmin(req, res, next) {
    try {
        const tokenFromBody = req.body._token;
        const payload = jwt.verify(tokenFromBody, SECRET_KEY);
        req.user = payload; // create a current user
        
        if (req.user.is_admin) {
            return next();
        } else {
            return next(new ExpressError("You must be an admin to view this page", 401));
        }
    } catch (err) {
        // errors would happen here if we made a request and req.user is undefined
        return next(new ExpressError("You must log in to view this page", 401));
    }
}


module.exports = {
  ensureLoggedIn,
  ensureCorrectUser,
  ensureAdmin
};
