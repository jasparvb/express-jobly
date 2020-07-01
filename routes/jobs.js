const express = require("express");
const Job = require("../models/job");
const jsonschema = require("jsonschema");
const jobSchema = require("../schemas/job.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

//const {ensureLoggedIn, ensureCorrectUser} = require("../middleware/auth");

const router = new express.Router();

/** GET / - get list of jobs.
 *
 * => {jobs: [{handle, name}, ...]}
 *
 **/
router.get("/", async function (req, res, next) {
    try {
        const jobs = await Job.getAll(req.query);

        return res.json({ jobs });
    } catch (err) {
        return next(err);
    }
});

/** POST / - post job.
 *
 * {id, title, salary, equity, company_handle, date_posted} =>
 *   {job: {id, title, salary, equity, company_handle, date_posted}}
 *
 **/

router.post("/", async function (req, res, next) {
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

/** GET /[handle]  => {job: jobData} */

router.get("/:handle", async function (req, res, next) {
    try {
        const job = await Job.get(req.params.handle);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** PATCH / - update job.
 *
 * {id, title, salary, equity, company_handle, date_posted} =>
 *   {job: {id, title, salary, equity, company_handle, date_posted}}
 *
 **/

router.patch("/:handle", async function (req, res, next) {
    try {
        const result = jsonschema.validate(req.body, jobUpdateSchema);
        if (!result.valid) {
            let listOfErrors = result.errors.map(error => error.stack);
            let err = new ExpressError(listOfErrors, 400);
            return next(err);
        }
        const job = await Job.update(req.body, req.params.handle);
        return res.status(201).json({ job });
    } catch (err) {
        return next(err);
    }
});

/** DELETE /[handle]   => {message: "job deleted"} */

router.delete("/:handle", async function (req, res, next) {
    try {
        await Job.remove(req.params.handle);
        return res.json({ message: "Job deleted" });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;