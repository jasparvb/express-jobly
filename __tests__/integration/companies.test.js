process.env.NODE_ENV = "test";

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

  } catch (err) {
    console.error(err);
  }
});


describe('POST /companies', function() {
  test('Creates a new company', async function() {
    const res = await request(app)
      .post('/companies')
      .send({
        handle: 'tesla',
        name: 'Tesla',
        _token: DATA.token
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.company).toHaveProperty('handle');
  });

  test('Prevents creating a company with already used handle', async function() {
    const res = await request(app)
      .post('/companies')
      .send({
        _token: DATA.token,
        handle: 'walmart',
        name: 'Walmart Inc'
      });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /companies', function() {
  test('Retrieves a list of 1 company', async function() {
    const res = await request(app).get('/companies')
    .send({
      _token: DATA.token
    });
    expect(res.body.companies).toHaveLength(1);
    expect(res.body.companies[0]).toHaveProperty('handle');
  });

  test('Returns results based on search term', async function() {
    await request(app)
      .post('/companies')
      .set('authorization', `${DATA.token}`)
      .send({
        _token: DATA.token,
        handle: 'tesla',
        name: 'Tesla'
      });

    const res = await request(app)
      .get('/companies?search=tesla')
      .send({
        _token: DATA.token
      });
    expect(res.body.companies).toHaveLength(1);
    expect(res.body.companies[0]).toHaveProperty('handle');
  });
});

describe('GET /companies/:handle', function() {
  test('Returns a single company', async function() {
    const res = await request(app)
      .get(`/companies/${DATA.company.handle}`)
      .send({
        _token: DATA.token
      });
    expect(res.body.company).toHaveProperty('handle');
    expect(res.body.company.handle).toBe('walmart');
  });

  test('Responds with 404 if company cannot be found', async function() {
    const res = await request(app)
      .get(`/companies/tradedesk`)
      .send({
        _token: DATA.token
      });
    expect(res.statusCode).toBe(404);
  });
});

describe('PATCH /companies/:handle', function() {
  test("Updates a single company", async function() {
    const res = await request(app)
      .patch(`/companies/${DATA.company.handle}`)
      .send({
        name: 'SamsClub',
        _token: DATA.token
      });
    expect(res.body.company).toHaveProperty('handle');
    expect(res.body.company.name).toBe('SamsClub');
    expect(res.body.company.handle).not.toBe(null);
  });

  test('Prevents a bad company update', async function() {
    const res = await request(app)
      .patch(`/companies/${DATA.company.handle}`)
      .send({
        _token: DATA.token,
        unknownparam: false
      });
    expect(res.statusCode).toBe(400);
  });

  test('Responds with 404 if company cannot be found', async function() {
    const res = await request(app)
      .patch(`/companies/sdagaergaasd`)
      .send({
        name: 'SamsClub',
        _token: DATA.token
      });
    expect(res.statusCode).toBe(404);
  });
});

describe('DELETE /companies/:handle', function() {
  test('Deletes a company', async function() {
    const res = await request(app)
      .delete(`/companies/${DATA.company.handle}`)
      .send({
        _token: DATA.token
      });
    expect(res.body).toEqual({ message: 'Company deleted' });
  });

  test('Responds with 404 if company cannot be found', async function() {
    const res = await request(app)
      .delete(`/companies/sdagaergaasd`)
      .send({
        _token: DATA.token
      });
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
