const express = require("express");
const Company = require("../models/company");
const jsonschema = require("jsonschema");
const companySchema = require("../schemas/company.json");

//const {ensureLoggedIn, ensureCorrectUser} = require("../middleware/auth");

const router = new express.Router();

/** GET / - get list of companies.
 *
 * => {companies: [{handle, name}, ...]}
 *
 **/
router.get("/", async function(req, res, next) {
    try {
      const companies = await Company.getAll(req.query);
  
      return res.json({ companies });
    } catch (err) {
      return next(err);
    }
});

/** POST / - post company.
 *
 * {handle, name, num_employees, description, logo_url} =>
 *   {company: {handle, name, num_employees, description, logo_url}}
 *
 **/

router.post("/", async function (req, res, next) {
  try {
    const result = jsonschema.validate(req.body, companySchema);
    if (!result.valid) {
      let listOfErrors = result.errors.map(error => error.stack);
      let err = new ExpressError(listOfErrors, 400);
      return next(err);
    }
    const company = await Company.create(req.body);
    return res.status(201).json({ company });
  } catch (err) {
    return next(err);
  }
});



module.exports = router;