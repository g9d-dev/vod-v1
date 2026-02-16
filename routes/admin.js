var express = require("express");
var { jsonReturn, err, succ, query, sqlHas } = require("../lib/route.js");
var { useKey } = require("../lib/key.js");
var { encodeHTML, reverse } = require("../lib/utils.js");
var sendMail = require("../lib/mail.js");
const { json } = require("body-parser");
var marked = require("marked");
var insane = require("insane");
async function query_with_col(a, b, ...c) {
    var r = await query(a, ...c);
    if (r && r[0]) {
        return r[0][b];
    }
    return undefined;
}

var _mdc = {};
function markdown(st){
    console.log(st);

    var sri = String(st);
    if(typeof _mdc[sri] !== 'undefined'){
        return _mdc[sri];
    }else{
        var res = insane(marked.parse(sri), {
            "allowedAttributes": {
                "a": ["href", "name", "target"],
                "iframe": ["allowfullscreen", "frameborder", "src"],
                "img": ["src"]
            },
            "allowedClasses": {},
            "allowedSchemes": ["http", "https", "mailto"],
            "allowedTags": [
                "a", "article", "b", "blockquote", "br", "caption", "code", "del", "details", "div", "em",
                "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img", "ins", "kbd", "li", "main", "ol",
                "p", "pre", "section", "span", "strike", "strong", "sub", "summary", "sup", "table",
                "tbody", "td", "th", "thead", "tr", "u", "ul"
            ],
            "filter": null,
            "transformText": null
        });
        if(res && res.length > 0){
            _mdc[sri] = res;
        }
        return res;
    }
}

/**
 * 路由函数。
 * @param {()=>any} getDB 获取数据库的函数。
 * @returns {any} 路由器对象。
 */
module.exports = function (getDB) {
    async function adminOnly(req, res, next){
        
        var sql;
        if (req.query && req.session && req.session.uid) {
            try {
                sql = await getDB();
                if(await sqlHas(sql, "SELECT * FROM user WHERE id=? and admin=?", [req.session.uid, 1])){
                    next();
                }else{
                    err(res, 403, "用户不是管理员");
                }
            }catch(e){
                err(res, 500, "Error while checking");
                console.error(e);
            }finally{
                if(sql) sql.release();
            }
        }else{
            err(res, 403, "用户未登录");
        }
    }
    var router = express.Router();

    router.use(adminOnly);

    router.get("/reports", async function(req, res, next){
        var sql;
        if (req.query && req.session && req.session.uid) {
            try {
                sql = await getDB();
                var dt = await query(sql, "SELECT * FROM project_report ORDER BY dt");
                jsonReturn(res, {status: 200, msg: "获取成功", data: dt});
            }catch(e){
                err(res, 500, "Error while checking");
            }finally{
                if(sql) sql.release();
            }
        }else{
            err(res, 403, "参数错误");
        }

    });

    router.post("/article", async function(req, res, next){
        var sql;
        if (req.query && req.session && req.session.uid && req.body && req.body.title && req.body.content && req.body.verify && req.session.verifyDate) {
            if(req.body.verify === req.session.verify && (Date.now() + 30000 > req.session.verifyDate)){
                req.session.verify = null;
                req.session.verifyDate = 0;
                try {
                    sql = await getDB();
                    var dt = markdown(req.body.content);
                    var s = await query(sql, "INSERT INTO articles (title, data) VALUES (?, ?)", [req.body.title, dt]);
                    res.redirect("/viewArt?id="+s.insertId);
                }catch(e){
                    console.error(e);
                    err(res, 500, "Error while checking");
                }finally{
                    if(sql) sql.release();
                }
            }else{
                err(res, 403, "验证码错误或过期");
            }
        }else{
            err(res, 403, "参数错误");
        }
    });

    return router;
};