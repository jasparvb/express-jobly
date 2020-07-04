const request = require('supertest');
const app = require('../../app');
const db = require('../../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const DATA = {};


beforeEach(async function() {
  try {
    // Create a test user with token
    const hashedPW = await bcrypt.hash('testpassword', 1);
    await db.query(
        `INSERT INTO users (username, password, first_name, last_name, email, is_admin)
        VALUES ('messi10', $1, 'Lionel', 'Messi', 'messi@fcb.es', true)`,
        [hashedPW]
    );

    const res = await request(app)
        .post('/login')
        .send({username: 'messi10', password: 'testpassword'});

    DATA.token = res.body.token;
    DATA.username = jwt.decode(DATA.token).username;

    // Insert a test company into "companies"
    const result = await db.query(
      'INSERT INTO companies (handle, name, num_employees) VALUES ($1, $2, $3) RETURNING *',
      ['walmart', 'Walmart Inc', 5000]
    );

    DATA.company = result.rows[0];

    const job = await db.query(
      "INSERT INTO jobs (title, salary, company_handle) VALUES ('Full Stack Developer', 120000, $1) RETURNING *",
      [DATA.company.handle]
    );
    DATA.jobId = job.rows[0].id;

  } catch (err) {
    console.error(err);
  }
});

describe("POST /jobs", async function () {
    test("Creates a new job", async function () {
      const res = await request(app)
          .post(`/jobs`)
          .send({
              company_handle: DATA.company.handle,
              title: "Full Stack Web Developer",
              salary: 200000,
              equity: 0.6,
              _token: DATA.token
          });
      expect(res.statusCode).toBe(201);
      expect(res.body.job).toHaveProperty("id");
    });
  
    test("Tests validation when creating a job without required field", async function () {
      const res = await request(app)
          .post(`/jobs`)
          .send({
            _token: DATA.token,
            salary: 200000,
            equity: 0.6,
            company_handle: DATA.company.handle
          });
      expect(res.statusCode).toBe(400);
    });
});

describe("GET /jobs", async function () {
    test("Gets list of jobs", async function () {
        const res = await request(app).get(`/jobs`).send({
            _token: DATA.token
        });
        expect(res.body.jobs).toHaveLength(1);
        expect(res.body.jobs[0]).toHaveProperty("company_handle");
        expect(res.body.jobs[0]).toHaveProperty("title");
    });
  
    test("Test search", async function () {
        await request(app)
            .post(`/jobs`)
            .send({
                company_handle: DATA.company.handle,
                title: "Full Stack Web Developer",
                salary: 200000,
                equity: 0.6,
                _token: DATA.token
            });
    
        await request(app)
            .post(`/jobs`)
            .send({
                company_handle: DATA.company.handle,
                title: "Junior Web Developer",
                salary: 100000,
                equity: 0.3,
                _token: DATA.token
            });
    
        const res = await request(app)
            .get("/jobs?search=junior")
            .send({_token: DATA.token});
        expect(res.body.jobs).toHaveLength(1);
        expect(res.body.jobs[0]).toHaveProperty("company_handle");
        expect(res.body.jobs[0]).toHaveProperty("title");
    });
});
  
describe("GET /jobs/:id", async function () {
    test("Returns a single job", async function () {
        const res = await request(app).get(`/jobs/${DATA.jobId}`).send({
            _token: DATA.token
        });
        expect(res.body.job).toHaveProperty("id");
    
        expect(res.body.job.id).toBe(DATA.jobId);
    });
  
    test("Responds with 404 if job cannot be found", async function () {
        const res = await request(app)
            .get(`/jobs/100000`).send({
                _token: DATA.token
            });
        expect(res.statusCode).toBe(404);
    });
});
  
  
describe("PATCH /jobs/:id", async function () {
    test("Updates a single job", async function () {
        const res = await request(app)
            .patch(`/jobs/${DATA.jobId}`)
            .send({title: "Greeter", salary: 10000, _token: DATA.token});
        expect(res.body.job).toHaveProperty("id");
    
        expect(res.body.job.title).toBe("Greeter");
        expect(res.body.job.salary).toBe(10000);
        expect(res.body.job.id).not.toBe(null);
    });
 
    test("Tests update validation", async function () {
        const res = await request(app)
            .patch(`/jobs/${DATA.jobId}`)
            .send({
                _token: DATA.token, unknownfield: false
            });
        expect(res.statusCode).toBe(400);
    });
  
    test("Responds with 404 if job cannot be found", async function () {
        const res = await request(app)
            .patch(`/jobs/999999999`)
            .send({
                _token: DATA.token, title: "Freelance Web Developer", salary: 100000
            });
        expect(res.statusCode).toBe(404);
    });
  });
  
  
describe("DELETE /jobs/:id", async function () {
    test("Deletes a job", async function () {
        const res = await request(app)
            .delete(`/jobs/${DATA.jobId}`).send({_token: DATA.token})
        expect(res.body).toEqual({message: "Job deleted"});
    });
  
  
    test("Responds with 404 if job cannot be found", async function () {
        const res = await request(app)
            .delete(`/jobs/9999999`).send({_token: DATA.token})
        expect(res.statusCode).toBe(404);
    });
});
    


afterEach(async function() {
    try {
      await db.query('DELETE FROM jobs');
      await db.query('DELETE FROM users');
      await db.query('DELETE FROM companies');
    } catch (err) {
      console.error(err);
    }
  });
  
afterAll(async function() {
    try {
      await db.end();
    } catch (err) {
      console.error(err);
    }
});
  