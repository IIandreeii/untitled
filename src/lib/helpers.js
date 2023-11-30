const bcrypt = require('bcryptjs');

const helpers = {};

helpers.encrypyPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return hash;
};

helpers.matchPassword = async (password, savedPassword) => {
    try {
        return await bcrypt.compare(password, savedPassword);
    } catch (e) {
        console.log(e)
    }
};


helpers.gt = function (a, b) {
    return a > b;
};

helpers.ne = function (value1, value2) {
    return value1 !== value2;
};
helpers.lt = function (value1, value2) {
    return value1 < value2;
};

helpers.add = function (value1, value2) {
    return value1 + value2;
};

helpers.sub = function (value1, value2) {
    return value1 - value2;
};






module.exports = helpers;