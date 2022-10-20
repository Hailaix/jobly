const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

//functions for Jobs

class Job {

    /** Create a job (from data), update db, return new job data.
   * id, title, salary, equity, company_handle
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   * */
    static async create({ title, salary, equity, companyHandle }) {
        const result = await db.query(`
    INSERT INTO jobs (title, salary, equity, company_handle)
    VALUES ($1, $2, $3, $4)
    RETURNING id, title, salary, equity, company_handle AS "companyHandle"
    `, [title, salary, equity, companyHandle]);
        return result.rows[0];
    }

    /** Find all jobs matching provided filters.
     * if no filters are provided, simply finds all jobs.
     *
     * Returns [{ id, title, salary, equity, companyHandle }, ...]
     * */

    static async find(filters = {}) {
        let query = `
    SELECT id, title, salary, equity, company_handle AS "companyHandle"
    FROM jobs
    `;
        const where = [];
        const parameters = [];
        const { title, minSalary, hasEquity } = filters;

        //if provided, filters by inclusion of title in job title
        if (title) {
            parameters.push(`%${title}%`);
            where.push(`title ILIKE $${parameters.length}`);
        }
        //if provided, filters for salary above provided min
        if (minSalary !== undefined) {
            //push returns length
            where.push(`salary >= $${parameters.push(minSalary)}`);
        }
        //if true, filters for non-zero equity
        if (hasEquity) {
            where.push(`equity > 0`);
        }
        //if any filter matched, add the where clause
        if (where.length > 0) {
            query += (" WHERE " + where.join(" AND "));
        }

        const jobsres = await db.query(query, parameters);
        return jobsres.rows;
    }

    /** Given an id, return data about the job with that id
     * 
     * returns {id, title, salary, equity, companyHandle}
     * Throws NotFoundError if not found.
     */
    static async get(id) {
        const result = await db.query(`
        SELECT id, title, salary, equity, company_handle AS "companyHandle"
        FROM jobs
        WHERE id = $1`,
            [id]);
        if (!result.rows[0]) {
            console.log("here");
            throw new NotFoundError(`No job with id ${id}`);
        }
        return result.rows[0];
    }

    /** Update job with data
     *  update is partial, so fields can be missing
     *  
     *  data can include { title, salary, equity }
     * 
     *  returns {id, title, salary, equity, companyHandle}
     *  Throws NotFoundError if not found.
     */
    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(data, {});
        const ididx = values.length + 1;
        const query = `
        UPDATE jobs
        SET ${setCols}
        WHERE id = $${ididx}
        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`
        const result = await db.query(query, [...values, id]);
        if (!result.rows[0]) {
            console.log("here");
            throw new NotFoundError(`No job with id ${id}`);
        }
        return result.rows[0];
    }

    /** deletes job with id
     * 
     *  returns undefined
     *  Throws NotFoundError if not found.
     */
    static async remove(id) {
        const result = await db.query(`
        DELETE FROM jobs
        WHERE id = $1
        RETURNING id`, [id]);

        if (!result.rows[0]) {
            console.log("here");
            throw new NotFoundError(`No job with id ${id}`);
        }
    }
}

module.exports = Job;