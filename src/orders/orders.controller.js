const path = require("path");

// data stored for orders; array of objects.
const orders = require(path.resolve("src/data/orders-data"));

// function to assign id's to new orders.
const nextId = require("../utils/nextId");

// LIST array of all stored orders available.
function list(req, res) {
    res.json({ data: orders });
}

// middleware to check if all incoming post requests have all properties.
function bodyHasProperty(property) {
    return function(req, res, next) {
        const { data = {} } = req.body;
        if (!data[property]){
            return next({ status: 400, message: `Order must include a ${property}` });
        }
        next();
    }
}

module.exports = {
    list,
}