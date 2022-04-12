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

// middleware to check if string properties (deliverTo, mobileNumber) are valid.
function stringIsValid(property) {
    return function(req, res, next) {
        const { data = {} } = req.body;
        if (!data[property].length) {
            return next({ status: 400, message: `Order must include a ${property}` });
        }
        next();
    }
}

// check dishes property is an array and is NOT empty.
function dishesIsValid(req, res, next) {
    const { data: { dishes } = {} } = req.body;
    if (!Array.isArray(dishes) && dishes.length == 0) {
        return next({ status: 400, message: `Order must include at least one dish` });
    }
    res.locals.dishes = dishes;
    next();
}

// check the property 'quantity' nested within the array of objects within 'dishes'.
function quantityIsValid(req, res, next) {
    const dishes = res.locals.dishes;
    let isValid = true;
    let failureIndex;

    // overall check to see if every dish in order has a quantity property
    // and if it is an integer greater than 0.
    dishes.forEach((dish) => {
        const index = dishes.indexOf(dish);
        if (!dish.quantity || dish.quantity <= 0) {
            isValid = false;
            failureIndex = index;
        }
    });

    if (!isValid) {
        return next({ status: 400, message: `Dish ${failureIndex} must have a quantity that is an integer greater than 0` });
    }
    next();
}

// create a new order to add to array of orders.
function create(req, res) {
    const { data: { deliverTo, mobileNumber, status = 'out-for-delivery', dishes } = {} } = req.body;
    const id = nextId();

    const newOrder = {
        id,
        deliverTo,
        mobileNumber,
        status,
        dishes,
    }
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

module.exports = {
    create: [
        bodyHasProperty('deliverTo'),
        bodyHasProperty('mobileNumber'),
        bodyHasProperty('dishes'),
        stringIsValid('deliverTo'),
        stringIsValid('mobileNumber'),
        dishesIsValid,
        quantityIsValid,
        create
    ],
    list,
}