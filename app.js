const express = require('express');
var bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;

const dbConnectionString = 'mongodb+srv://challengeUser:WUMglwNBaydH8Yvu@challenge-xzwqd.mongodb.net/getir-case-study?retryWrites=true'

const app = express();
app.use(bodyParser.json());

const STATUSES = Object.freeze({
    success: {
        code: 0,
        msg: "Success"
    },
    invalidInput: {
        code: -1,
        msg: "Input format error"
    },
    dbConnectionFailure: {
        code: -2,
        msg: "Database connection failure"
    },
    dbQueryFailure: {
        code: -3,
        msg: "Database query failure"
    },
    unknownError: {
        code: -4,
        msg: "Unknwon error"
    }
})

function getQuery(request) {
    const query = [
        {
            '$match': {
                'createdAt': {
                    '$gte': new Date(request.startDate),
                    '$lte': new Date(request.endDate)
                }
            }
        }, {
            '$addFields': {
                'totalCount': {
                    '$sum': '$counts'
                }
            }
        }, {
            '$project': {
                '_id': 0,
                'key': 1,
                'createdAt': 1,
                'totalCount': 1
            }
        }, {
            '$match': {
                'totalCount': {
                    '$lte': request.maxCount,
                    '$gte': request.minCount
                }
            }
        }
    ]
    return query;
}

function addErrorMessageToStatus(satus, error) {
    return {
        code: satus.code,
        msg: satus.code + error ? ("+[" + error + "]") : ""
    }
}

function validateRequest(request) {
    return new Promise((resolve, reject) => {
        if (!request) {
            reject(addErrorMessageToStatus(STATUSES.invalidInput, "Filter request does not exist"));
        }
        if (typeof request.startDate !== "string") {
            reject(addErrorMessageToStatus(STATUSES.invalidInput, "Filter request does not contain a valid startDate field"));
        }
        if (typeof request.endDate !== "string") {
            reject(addErrorMessageToStatus(STATUSES.invalidInput, "Filter request does not contain a valid endDate field"));
        }
        if (typeof request.minCount !== "number") {
            reject(addErrorMessageToStatus(STATUSES.invalidInput, "Filter request does not contain a valid minCount field"));
        }
        if (typeof request.maxCount !== "number") {
            reject(addErrorMessageToStatus(STATUSES.invalidInput, "Filter request does not contain a valid maxCount field"));
        }
        resolve();
    });
}

function connectToDb() {
    return MongoClient.connect(dbConnectionString, { useUnifiedTopology: true }).
        catch(err => {
            return Promise.reject(addErrorMessageToStatus(STATUSES.dbConnectionFailure, err));
        });
}

function fetchRecords(client, request) {
    const db = client.db("getir-case-study");
    const query = getQuery(request);
    return db.collection("records").aggregate(query).toArray().
        catch(err => {
            return Promise.reject(addErrorMessageToStatus(STATUSES.dbQueryFailure, err));
        }).
        finally(() => {
            client.close();
        });
}

app.post('/filter', (req, res) => {
    const request = req.body;
    validateRequest(request).
        then(() => connectToDb()).
        then(client => fetchRecords(client, request)).
        then(result => res.send({
            code: STATUSES.success.code,
            msg: STATUSES.success.msg,
            records: result
        })).
        catch(err => {
            if (typeof err === "object") {
                res.send(err);
            } else {
                res.send(addErrorMessageToStatus(STATUSES.unknownError, err));
            }
        });
});

module.exports = app;