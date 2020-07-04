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
      const response = await request(app)
          .post(`/jobs`)
          .send({
            _token: DATA.token,
            salary: 200000,
            equity: 0.6,
            company_handle: DATA.company.handle
          });
      expect(response.statusCode).toBe(400);
    });
});

describe("GET /jobs", async function () {
    test("Gets list of jobs", async function () {
        const res = await request(app).get(`/jobs`);
        const jobs = res.body.jobs;
        expect(jobs).toHaveLength(1);
        expect(jobs[0]).toHaveProperty("company_handle");
        expect(jobs[0]).toHaveProperty("title");
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
    
        const response = await request(app)
            .get("/jobs?search=junior")
            .send({_token: DATA.token});
        expect(response.body.jobs).toHaveLength(1);
        expect(response.body.jobs[0]).toHaveProperty("company_handle");
        expect(response.body.jobs[0]).toHaveProperty("title");
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
  