const express = require("express");
const ExpressError = require("../helpers/expressError");
const Job = require("../models/job");
const jsonschema = require("jsonschema");
const jobSchema = require("../schemas/job.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const {ensureLoggedIn, ensureAdmin} = require("../middleware/auth");

const router = new express.Router();

/** GET / - get list of jobs.
 *
 * => {jobs: [{id, title, company_handle}, ...]}
 *
 **/
router.get("/", ensureLoggedIn, async function (req, res, next) {
    try {
        const jobs = await Job.getAll(req.query);

        return res.json({ jobs });
    } catch (err) {
        return next(err);
    }
});

/** POST / - post job.
 *
 * {title, salary, equity, company_handle} =>
 *   {job: {id, title, salary, equity, company_handle, date_posted}}
 *
 **/

router.post("/", ensureAdmin, async function (req, res, next) {
    try {
        const result = jsonschema.validate(req.body, jobSchema);
        if (!result.valid) {
            let listOfErrors = result.errors.map(error => error.stack);
            let err = new ExpressError(listOfErrors, 400);
            return next(err);
        }
        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    } catch (err) {
        return next(err);
    }
});

/** GET /[id]  => {job: jobData} */

router.get("/:id", ensureLoggedIn, async function (req, res, next) {
    try {
        const job = await Job.get(req.params.id);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** PATCH / - update job.
 *
 * {title, salary, equity, company_handle} =>
 *   {job: {id, title, salary, equity, company_handle, date_posted}}
 *
 **/

router.patch("/:id", ensureAdmin, async function (req, res, next) {
    try {
        const result = jsonschema.validate(req.body, jobUpdateSchema);
        if (!result.valid) {
            let listOfErrors = result.errors.map(error => error.stack);
            let err = new ExpressError(listOfErrors, 400);
            return next(err);
        }
        const job = await Job.update(req.body, req.params.id);
        return res.status(201).json({ job });
    } catch (err) {
        return next(err);
    }
});

/** DELETE /[id]   => {message: "Job deleted"} */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
    try {
        await Job.remove(req.params.id);
        return res.json({ message: "Job deleted" });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;