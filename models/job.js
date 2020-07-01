/** Job class */
const db = require("../db");
const ExpressError = require("../helpers/expressError");
const sqlForPartialUpdate = require("../helpers/partialUpdate");

class Job {
    static async getAll(q) {
        let query = "SELECT id, title, company_handle FROM jobs";
        let where = [];
        let values = [];
     
        if(q.search){
            values.push(`%${q.search}%`);
            where.push(`title ILIKE $${values.length}`);
        }
        if(q.min_salary){
            values.push(+q.min_salary);
            where.push(`salary >= $${values.length}`);
        }
        if(q.min_equity){
            values.push(+q.min_equity);
            where.push(`equity >= $${values.length}`);
        }

        if(where.length) {
            query += " WHERE ";
        }

        let finalQuery = query + where.join(" AND ") + " ORDER BY name";

        const result = await db.query(finalQuery, values);
            
        if (!result.rows[0]) {
            throw new ExpressError(`No jobs found`, 404);
        }
        
        return result.rows;
    }

    static async create(data) {
        const result = await db.query(
            `INSERT INTO jobs (
                title,
                salary,
                equity,
                company_handle) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id,
                title,
                salary,
                equity,
                company_handle,
                date_posted`,
            [
                data.title,
                data.salary,
                data.equity,
                data.company_handle
            ]
        );
    
        return result.rows[0];
    }

    static async get(id) {
        const result = await db.query(
            `SELECT id,
                title,
                salary,
                equity,
                company_handle
            FROM jobs 
            WHERE id = $1`, [id]);

        let job = result.rows[0];
    
        if (!job) {
            throw new ExpressError(`There's no job with the id '${id}`, 404);
        }
    
        const companyResult = await db.query(
            `SELECT name, 
                num_employees, 
                description, 
                logo_url 
            FROM companies 
            WHERE handle = $1`,
            [job.company_handle]
        );
      
        job.company = companyResult.rows[0];
      
        return job;
    }

    
}

module.exports = Job;