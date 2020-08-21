const request = require("supertest");
const expect = require("expect");
const app = require("./app");

test("when there is records sutisfing the filter, a response having records array must be sent", done => {
    const post = request(app).post("/filter");
    post.send({
        "startDate": "2016-01-26",
        "endDate": "2018-02-02",
        "minCount": 2700,
        "maxCount": 3000
    }).set('Accept', 'application/json')
        .then(response => {
            expect(response.statusCode).toBe(200);
            expect(response.body.code).toBe(0);
            expect(response.body.msg).toBe("Success");
            expect(Array.isArray(response.body.records)).toBe(true);
            expect(response.body.records.length).toBeGreaterThan(0);
            const aRecord = response.body.records[0];
            expect(typeof aRecord.key).toBe("string");
            expect(typeof aRecord.createdAt).toBe("string");
            expect(Date.parse(aRecord.createdAt)).not.toBeNaN();
            expect(typeof aRecord.totalCount).toBe("number");
            done();
        });
});

test("every record must be sutisfy the filter", done => {
    const post = request(app).post("/filter");
    post.send({
        "startDate": "2016-01-26",
        "endDate": "2016-02-02",
        "minCount": 2700,
        "maxCount": 3000
    }).set('Accept', 'application/json')
        .then(response => {
            response.body.records.forEach(record => {
                expect(Date.parse(record.createdAt)).toBeGreaterThanOrEqual(Date.parse("2016-01-26"));
                expect(Date.parse(record.createdAt)).toBeLessThanOrEqual(Date.parse("2016-02-02"));
                expect(record.totalCount).toBeGreaterThanOrEqual(2700);
                expect(record.totalCount).toBeLessThanOrEqual(3000);
            });
            done();
        });
});

test("when an invalid request received, a error response must be sent", done => {
    const post = request(app).post("/filter");
    post.send().set('Accept', 'application/json')
        .then(response => {
            expect(response.statusCode).toBe(200);
            expect(response.body.code).not.toBe(0);
            expect(response.body.msg).not.toBe("Success");
            done();
        });
});
