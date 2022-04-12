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
    return (req, res, next) => {
        const { data = {} } = req.body;
        if (!data[property]){
            return next({ status: 400, message: `Order must include a ${property}` });
        }
        next();
    }
}

// middleware to check if string properties (deliverTo, mobileNumber) are valid.
function stringIsValid(property) {
    return (req, res, next) => {
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
    if (Array.isArray(dishes) && dishes.length > 0) {
        return next();
    }
    next({ status: 400, message: `Order must include at least one dish` });
}

// check the property 'quantity' nested within the array of objects within 'dishes'.
function quantityIsValid(req, res, next) {
    const { data: { dishes } = {} } = req.body;
    
    // overall check to see if every dish in order has a quantity property
    // and if it is an integer greater than 0.
    dishes.forEach((dish) => {
        const index = dishes.indexOf(dish);
        if (!dish.quantity || dish.quantity <= 0 || dish.quantity !== Number(dish.quantity)) {
            return next({ status: 400, message: `Dish ${index} must have a quantity that is an integer greater than 0` });
        }
    });
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

// middleware to check if requested order exists.
function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id == orderId);
    if (!foundOrder) {
        next({ status: 404, message: `Order does not exist: ${orderId}` });
    }
    res.locals.order = foundOrder;
    next();
}

// fulfill request to view an individual order.
function read(req, res) {
    res.json({ data: res.locals.order });
}

// check to make sure request is not attempting to alter the id of order.
function doesIdMatch(req, res, next) {
    const { orderId } = req.params;
    const { data: { id } = {} } = req.body;

    if (id && id !== orderId) {
        return next({ status: 400, message: `Order id does not match route id. Order: ${id}, Route: ${orderId}` });
    }
    next();
}

// middleware to check if order has an appropriate 'status' property.
// reject if invalid status, empty status, or already delivered.
function statusIsValid(req, res, next) {
    const { data = {} } = req.body;
    const status = data['status'];
    const validStatus = ['pending', 'preparing', 'out-for-delivery'];
    if (validStatus.includes(status)) {
        return next();
    } else if (status === 'delivered') {
        return next({ status: 400, message: `A delivered order cannot be changed` });
    }
    next({ status: 400, message: `Order must have a status of pending, preparing, out-for-delivery, delivered` });
}

// route to update a pre-existing order.
function update(req, res) {
    const order = res.locals.order;
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    
    // new properties.
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;

    res.json({ data: order });
}

// middleware to make sure an order requested for deletion isn't pending.
function isOrderPending(req, res, next) {
    const order = res.locals.order;
    if (order.status !== 'pending') {
        return next({ status: 400, message: `An order cannot be deleted unless it is pending` });
    }
    next();
}

// delete a non-pending order.
function destroy(req, res) {
    const order = res.locals.order;
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id == orderId);

    const deletedOrders = orders.splice(index, 1);
    res.sendStatus(204);
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
    read: [
        orderExists,
        read
    ],
    update: [
        orderExists,
        bodyHasProperty('deliverTo'),
        bodyHasProperty('mobileNumber'),
        bodyHasProperty('dishes'),
        stringIsValid('deliverTo'),
        stringIsValid('mobileNumber'),
        doesIdMatch,
        dishesIsValid,
        quantityIsValid,
        statusIsValid,
        update,
    ],
    delete: [
        orderExists,
        isOrderPending,
        destroy,
    ],
    list,
}