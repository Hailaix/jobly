"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require('./job.js');
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    jobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
        title: "newJob",
        salary: 10000,
        equity: '0.1',
        companyHandle: 'c1'
    };

    test("works", async function () {
        const job = await Job.create(newJob);
        //job will be newJob plus an id
        expect(job).toEqual(expect.objectContaining(newJob));
        expect(job.id).toBeTruthy();
        const result = await db.query(`
    SELECT id, title, salary, equity, company_handle AS "companyHandle"
    FROM jobs
    WHERE id = $1`, [job.id]);
        expect(result.rows).toEqual([job]);
    });
});

/************************************** find */
describe("find", function () {
    test("works: no filter", async function () {
        const result = await Job.find();
        expect(result).toEqual([
            {
                id: jobIds[0],
                title: 'j1',
                salary: 10000,
                equity: '0.1',
                companyHandle: 'c1'
            },
            {
                id: jobIds[1],
                title: 'j2',
                salary: 20000,
                equity: '0.2',
                companyHandle: 'c2'
            },
            {
                id: jobIds[2],
                title: 'j3',
                salary: 30000,
                equity: '0',
                companyHandle: 'c1'
            }
        ])
    });

    test("works: all filters", async function () {
        const queryString = {
            title: "2",
            minSalary: 10000,
            hasEquity: true
        };
        const result = await Job.find(queryString);
        expect(result).toEqual([
            {
                id: jobIds[1],
                title: 'j2',
                salary: 20000,
                equity: '0.2',
                companyHandle: 'c2'
            }
        ]);
    });

    test("works: title filter", async function () {
        const result = await Job.find({ title: "1" });
        expect(result).toEqual([
            {
                id: jobIds[0],
                title: 'j1',
                salary: 10000,
                equity: '0.1',
                companyHandle: 'c1'
            }
        ]);
    });

    test("works: minSalary filter", async function () {
        const result = await Job.find({ minSalary: 15000 });
        expect(result).toEqual([
            {
                id: jobIds[1],
                title: 'j2',
                salary: 20000,
                equity: '0.2',
                companyHandle: 'c2'
            },
            {
                id: jobIds[2],
                title: 'j3',
                salary: 30000,
                equity: '0',
                companyHandle: 'c1'
            }
        ]);
    });

    test("works: hasEquity filter", async function () {
        const result = await Job.find({ hasEquity: true });
        expect(result).toEqual([
            {
                id: jobIds[0],
                title: 'j1',
                salary: 10000,
                equity: '0.1',
                companyHandle: 'c1'
            },
            {
                id: jobIds[1],
                title: 'j2',
                salary: 20000,
                equity: '0.2',
                companyHandle: 'c2'
            }
        ]);
    });
});

/************************************** get */

describe("get", function () {
    test("works", async function () {
        const result = await Job.get(jobIds[0]);
        expect(result).toEqual({
            id: jobIds[0],
            title: 'j1',
            salary: 10000,
            equity: '0.1',
            companyHandle: 'c1'
        });
    });

    test("not found if no such job", async function () {
        try {
            await Job.get(0);
            fail();
        }
        catch (e) {
            expect(e instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** update */

describe("update", function () {
    const updateData = {
        title: "updatedJob",
        salary: 100000,
        equity: '0.5'
    };

    test("works", async function () {
        const result = await Job.update(jobIds[0], updateData);
        expect(result).toEqual({
            id: jobIds[0],
            title: 'updatedJob',
            salary: 100000,
            equity: '0.5',
            companyHandle: 'c1'
        });
        const dbUpdate = await db.query(`
        SELECT id, title, salary, equity, company_handle AS "companyHandle"
        FROM jobs
        WHERE id = $1`, [jobIds[0]]);
        expect(dbUpdate.rows).toEqual([{
            id: jobIds[0],
            title: 'updatedJob',
            salary: 100000,
            equity: '0.5',
            companyHandle: 'c1'
        }]);
    });

    test("works: partial update", async function () {
        const result = await Job.update(jobIds[0], { title: "partialUpdate" });
        expect(result).toEqual({
            id: jobIds[0],
            title: 'partialUpdate',
            salary: 10000,
            equity: '0.1',
            companyHandle: 'c1'
        });
        const dbUpdate = await db.query(`
        SELECT id, title, salary, equity, company_handle AS "companyHandle"
        FROM jobs
        WHERE id = $1`, [jobIds[0]]);
        expect(dbUpdate.rows).toEqual([{
            id: jobIds[0],
            title: 'partialUpdate',
            salary: 10000,
            equity: '0.1',
            companyHandle: 'c1'
        }]);
    });
    test("not found if no such job", async function () {
        try {
            await Job.update(0, updateData);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request with no data", async function () {
        try {
            await Job.update(jobIds[0], {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** remove */

describe("remove", function () {
    test("works", async function () {
        await Job.remove(jobIds[0]);
        const result = await db.query(`
        SELECT id
        FROM jobs
        WHERE id = $1`, [jobIds[0]]);
        expect(result.rows[0]).toBeFalsy();
    });

    test("not found if no such job", async function () {
        try {
            await Job.remove(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});
