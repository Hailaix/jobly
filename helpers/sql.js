const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.
/**
 * Helps sanitize dataToUpdate to be put in the database by parameterizing. 
 * @param {Object} dataToUpdate - Object containing the fields being updated 
 * @param {Object} jsToSql - Object containing key value pairs of field names 
 * in the js class mapped to their name in the database if they are different.
 * @returns Object with 2 keys, setCols contains the parameterized columns being updated in the database,
 * values contains the data in the correct order
 */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
