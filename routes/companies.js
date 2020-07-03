const express = require("express");
const Company = require("../models/company");
const jsonschema = require("jsonschema");
const companySchema = require("../schemas/company.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");

const {ensureLoggedIn, ensureAdmin} = require("../middleware/auth");

const router = new express.Router();

/** GET / - get list of companies.
 *
 * => {companies: [{handle, name}, ...]}
 *
 **/
router.get("/", ensureLoggedIn, async function (req, res, next) {
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

router.post("/", ensureAdmin, async function (req, res, next) {
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

/** GET /[handle]  => {company: companyData} */

router.get("/:handle", ensureLoggedIn, async function (req, res, next) {
    try {
        const company = await Company.get(req.params.handle);
        return res.json({ company });
    } catch (err) {
        return next(err);
    }
});

/** PATCH / - update company.
 *
 * {handle, name, num_employees, description, logo_url} =>
 *   {company: {handle, name, num_employees, description, logo_url}}
 *
 **/

router.patch("/:handle", ensureAdmin, async function (req, res, next) {
    try {
        const result = jsonschema.validate(req.body, companyUpdateSchema);
        if (!result.valid) {
            let listOfErrors = result.errors.map(error => error.stack);
            let err = new ExpressError(listOfErrors, 400);
            return next(err);
        }
        const company = await Company.update(req.body, req.params.handle);
        return res.status(201).json({ company });
    } catch (err) {
        return next(err);
    }
});

/** DELETE /[handle]   => {message: "Company deleted"} */

router.delete("/:handle", ensureAdmin, async function (req, res, next) {
    try {
        await Company.remove(req.params.handle);
        return res.json({ message: "Company deleted" });
    } catch (err) {
        return next(err);
    }
});


module.exports = router;