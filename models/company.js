/** Company class */
const db = require("../db");
const ExpressError = require("../expressError");

class Company {
    static async getAll(q) {
        let query = "SELECT handle, name, FROM companies";
        let where = [];
        let values = [];

        if (+q.min_employees >= +q.max_employees) {
            throw new ExpressError(
              "Min employees must be less than max employees",
              400
            );
        }
      
        if(q.search){
            values.push(`%${q.search}%`);
            where.push(`name ILIKE $${values.length}`);
        }
        if(q.min_employees){
            values.push(+q.min_employees);
            where.push(`num_employees >= $${values.length}`);
        }
        if(q.max_employees){
            values.push(+q.max_employees);
            where.push(`num_employees <= $${values.length}`);
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

    static async create(data) {
        const checkHandle = await db.query(
            `SELECT handle 
            FROM companies 
            WHERE handle = $1`,
            [data.handle]
        );
      
        if (checkHandle.rows[0]) {
            throw new ExpressError(`There's already a company with the handle '${data.handle}`, 400);
        }

        const result = await db.query(
            `INSERT INTO companies (
                handle,
                name,
                num_employees,
                description,
                logo_url) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING handle,
                name,
                num_employees,
                description,
                logo_url`,
            [
                data.handle,
                data.name,
                data.num_employees,
                data.description,
                data.logo_url
            ]
        );
    
        return result.rows[0];
    }
}

module.exports = Company;