const mongoose = require('mongoose');

const User = mongoose.model('User', {
    email: {
        type: String,
        required: true,
        trum: true,
        minLength: 1
    }
})

module.exports = {
    User
};