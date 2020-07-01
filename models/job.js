/** Job class */
const db = require("../db");
const ExpressError = require("../helpers/expressError");
const sqlForPartialUpdate = require("../helpers/partialUpdate");

class Job {
    static async getAll(q) {
        let query = "SELECT title, company_handle FROM jobs";
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
            throw new ExpressError(`No companies: ${username}`, 404);
        }
        
        return result.rows[0];
    }

    
}

module.exports = Job;