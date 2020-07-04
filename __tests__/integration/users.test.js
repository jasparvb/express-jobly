const request = require('supertest');
const app = require('../../app');
const db = require('../../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../../models/user');
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

describe('POST /users', function() {
    test('Creating a new user', async function() {
        const res = await request(app)
        .post('/users')
        .send({
            username: "suarez",  
            password: "copadelRey1",
            first_name: "Luis",
            last_name: "Suarez",
            email: "suarez@fcb.es",
            photo_url: "https://www.fcb.es/cdn/suarez.jpg"
        });
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("token");
        const userTest = await User.getUser("suarez");
        expect(userTest.first_name).toEqual("Luis");
    });
  
    test('Test creating a user with same username', async function() {
      const res = await request(app)
        .post('/users')
        .send({
            username: "messi10",  
            password: "copadelRey1",
            first_name: "Luis",
            last_name: "Suarez",
            email: "suarez@fcb.es",
            photo_url: "https://www.fcb.es/cdn/suarez.jpg"
        });
      expect(res.statusCode).toBe(400);
    });
  
    test('Test creating a user without required password field', async function() {
      const res = await request(app)
        .post('/users')
        .send({
            username: "suarez11",  
            first_name: "Luis",
            last_name: "Suarez",
            email: "suarez@fcb.es",
            photo_url: "https://www.fcb.es/cdn/suarez.jpg"
        });
      expect(res.statusCode).toBe(400);
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
