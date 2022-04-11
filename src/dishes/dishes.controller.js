const path = require("path");

// data stored for dishes; array of objects.
const dishes = require(path.resolve("src/data/dishes-data"));

// function to assign id's to new dishes.
const nextId = require("../utils/nextId");

// LIST array of all stored dishes available.
function list(req, res){
    res.send({ data: dishes });
}

// middleware to check if all incoming post requests have all properties.
function bodyHasProperty(property){
    return function(req, res, next) {
        const { data = {} } = req.body;
        if (!data[property]) {
            return next({ status: 400, message: `Dish must include ${property}`});
        }
        next();
    }
}

// middleware to check if all present post request properties are valid.
function propertyIsValid(property) {
    return function(req, res, next) {
        const { data = {} } = req.body;
        if (property === 'price'){
            return (data[property] <= 0) ? next({ status: 400, message: `Dish must have a ${property} that is an integer greater than 0`}) : next();
        } else if (!data[property].length) {
            return next({ status: 400, message: `Dish must include ${property}`});
        }
        next();
    }
}

// create and post a new dish to 'dishes'.
function create(req, res) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const id = nextId();
    const newDish = {
        id,
        name,
        description,
        price,
        image_url,
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

// middleware to check if requested dish exists by dishId before attempting return.
function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id == dishId);
    if (foundDish) {
        res.locals.dish = foundDish;
        next();
    }
    next({ status: 404, message: `${dishId} is not a valid dish id.`});
}

// get a requested dish by id.
function read(req, res) {
    res.json({ data: res.locals.dish });
}

module.exports = {
    create: [
        bodyHasProperty('name'),
        bodyHasProperty('description'),
        bodyHasProperty('price'),
        bodyHasProperty('image_url'),
        propertyIsValid('name'),
        propertyIsValid('description'),
        propertyIsValid('price'),
        propertyIsValid('image_url'),
        create,
    ],
    read: [
        dishExists,
        read,
    ],
    list
};