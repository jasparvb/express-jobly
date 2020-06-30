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
    
}

module.exports = Company;