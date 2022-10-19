const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

describe("sql for partial update", function(){
    
    test("returns an object with formatted data", function() {
        const person = {
            firstname : "testy",
            lastname : "testerson",
            age : 23
        };
        const jsToSql = {
            firstname : "first_name",
            lastname : "last_name"
        }
        const result = sqlForPartialUpdate(person, jsToSql);
        expect(result.values).toEqual(["testy", "testerson", 23]);
        expect(result.setCols).toEqual("\"first_name\"=$1, \"last_name\"=$2, \"age\"=$3");
    });

    test("Throws error on empty/malformed data", function(){
        expect(() => sqlForPartialUpdate({})).toThrow(BadRequestError);
    });
});