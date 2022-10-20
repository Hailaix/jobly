/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobFilterSchema = require("../schemas/jobFilter.json");

const router = new express.Router();

/** POST / { data } =>  { job }
 *
 * data should be { title, salary, equity, companyHandle }
 *
 * Returns { job: { id, title, salary, equity, companyHandle } }
 *
 * Authorization required: login as Admin
 */
router.post("/", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    }
    catch (e) {
        return next(e);
    }
});

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
 *
 * Can filter on provided search filters:
 * - minSalary
 * - hasEquity (Boolean)
 * - title (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */
router.get("/", async function (req, res, next) {
    try {
        //turn min into a Number if it exists
        if (req.query.minSalary !== undefined) req.query.minSalary = +req.query.minSalary;
        const validator = jsonschema.validate(req.query, jobFilterSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const jobs = await Job.find(req.query);
        return res.json({ jobs });
    }
    catch (e) {
        return next(e);
    }
});

/** GET /[id]  =>  { job }
 *
 *  Returns { job : { id, title, salary, equity, companyHandle } }
 *
 * Authorization required: none
 */
router.get("/:id", async function (req, res, next) {
    try {
        const job = await Job.get(req.params.id);
        return res.json({ job });
    }
    catch (e) {
        return next(e);
    }
});


/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { job : { id, title, salary, equity, companyHandle } }
 *
 * Authorization required: login as Admin
 */
router.patch("/:id", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const job = await Job.update(req.params.id, req.body);
        return res.json({ job });
    }
    catch (e) {
        return next(e);
    }
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: login as Admin
 */
router.delete("/:id", ensureAdmin, async function (req, res, next) {
    try {
        await Job.remove(req.params.id);
        return res.json({ deleted: req.params.id });
    }
    catch (e) {
        return next(e);
    }
});

module.exports = router;