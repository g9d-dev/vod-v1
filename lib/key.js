var config = require("../config.js").key;
var crypto = require("crypto");
function usk(data){
    var ky = crypto.createHash("md5").update(data + config).digest("hex");
    return ky;
}
module.exports = {
    useKey: usk,
    checkKey: function(data, ky){
        return (usk(data) === ky);
    }
};