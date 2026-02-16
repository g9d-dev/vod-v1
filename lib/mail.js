var nodemailer = require("nodemailer");
var htmlToFormattedText = require("html-to-formatted-text");
var config = require("../config.js").smtp;
var transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.https,
    auth: {
        user: config.mail,
        pass: config.key
    }
});
module.exports = async function send(mail, title, data){
    return await transport.sendMail({
        from: '"G9D" <'+config.mail+'>',
        to: mail,
        subject: title,
        html: data,
        text: htmlToFormattedText(data)
    });
};