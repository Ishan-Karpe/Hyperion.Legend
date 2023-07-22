const { model, Schema } = require('mongoose');

let roleschema = new Schema ({
    Guild: String,
    Role: String
})

module.exports = model('roleschema', roleschema);
