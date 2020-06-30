const express = require("express");
const Company = require("../models/company");
//const {ensureLoggedIn, ensureCorrectUser} = require("../middleware/auth");

const router = new express.Router();

/** GET / - get list of companies.
 *
 * => {companies: [{handle, name}, ...]}
 *
 **/
router.get("/", async function(req, res, next) {
    try {
      const companies = await Company.get(req.query);
  
      return res.json({ companies });
    } catch (err) {
      return next(err);
    }
});

module.exports = router;