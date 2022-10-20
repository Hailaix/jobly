"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    adminToken,
    jobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
        title: "newJob",
        salary: 10000,
        equity: '0.1',
        companyHandle: 'c1'
    };

    test("ok for admins", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(201);
        //job will be newJob plus an id
        expect(resp.body.job).toEqual(expect.objectContaining(newJob));
        expect(resp.body.job.id).toBeTruthy();
    });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "realJob"
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                ...newJob,
                extra: "bad field",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("unauthorized for non-admins", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs:
                [
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
                ]
        });
    });

    test("with filter", async function () {
        const res = await request(app).get("/jobs").query({ title: "j", minSalary: 15000 });
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            jobs:
                [
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
                ],
        });
    });

    test("bad filter", async function () {
        const res = await request(app).get("/jobs").query({ badfilter: "nogood" });
        expect(res.statusCode).toBe(400);
    })

    test("fails: test next() handler", async function () {
        // there's no normal failure event which will cause this route to fail ---
        // thus making it hard to test that the error-handler works with it. This
        // should cause an error, all right :)
        await db.query("DROP TABLE jobs CASCADE");
        const resp = await request(app)
            .get("/jobs")
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(500);
    });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
        const resp = await request(app).get(`/jobs/${jobIds[0]}`);
        expect(resp.body).toEqual({
            job: {
                id: jobIds[0],
                title: 'j1',
                salary: 10000,
                equity: '0.1',
                companyHandle: 'c1'
            },
        });
    });

    test("not found for no such job", async function () {
        const resp = await request(app).get(`/jobs/0`);
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
    test("works for admins", async function () {
        const resp = await request(app)
            .patch(`/jobs/${jobIds[0]}`)
            .send({
                title: "Updated Job",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({
            job: {
                id: jobIds[0],
                title: 'Updated Job',
                salary: 10000,
                equity: '0.1',
                companyHandle: 'c1'
            }
        });
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .patch(`/jobs/${jobIds[0]}`)
            .send({
                title: "Updated Job",
            });
        expect(resp.statusCode).toEqual(401);
    });

    test("unauthorized for non-admins", async function () {
        const resp = await request(app)
            .patch(`/jobs/${jobIds[0]}`)
            .send({
                title: "Updated Job",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found on no such company", async function () {
        const resp = await request(app)
            .patch(`/jobs/0`)
            .send({
                title: "Updated Job",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });

    test("bad request on incorrect fields", async function () {
        const resp = await request(app)
            .patch(`/jobs/${jobIds[0]}`)
            .send({
                name: "Updated Job",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
    test("works for admins", async function () {
        const resp = await request(app)
            .delete(`/jobs/${jobIds[0]}`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({ deleted: "" + jobIds[0] });
    });

    test("unauthorized for non-admins", async function () {
        const resp = await request(app)
            .delete(`/jobs/${jobIds[0]}`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .delete(`/jobs/${jobIds[0]}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such job", async function () {
        const resp = await request(app)
            .delete(`/jobs/0`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });
});
