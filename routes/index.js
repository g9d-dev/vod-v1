var express = require("express");
var path = require("path");
var svgc = require("svg-captcha");
var mysql = require("mysql");
var router = express.Router();
var { jsonReturn, err, succ, query, sqlHas } = require("../lib/route.js");
var { encodeHTML, reverse } = require("../lib/utils.js");
var { useKey, checkKey } = require("../lib/key.js");
var http = require("https");








/**
 * 路由函数。
 * @param {()=>any} getDB 获取数据库的函数。
 * @returns {any} 路由器对象。
 */
module.exports = function (getDB) {
    /* GET home page. */
    router.get("/", async function (req, res, next) {
        var sql;
        try {
            sql = await getDB();
            var profile = {
                title: "G9D工作室",
                isLogin: false,
                thumbnail: "/favicon.png",
                username: "未登录",
                unread: false,
                nick: undefined,
                nickBg: "#bbbbbb",
                apps: ["进入聊天", "CodeToys编辑器", "用户中心"],
                links: ["/mobile.html", "/code-toys/index.html", "/user.html"],
            };
            if (req.session.uid) {
                profile.isLogin = true;
                var my = (
                    await query(sql, "SELECT * FROM user WHERE id=?", [
                        req.session.uid,
                    ])
                )[0];
                if (my) {
                    profile.username = my.username;
                    profile.thumbnail = my.thumbnailUrl;
                    profile.nick = my.nick;
                    profile.nickBg = my.nick_color;
                    var unread = await sqlHas(sql, "SELECT * FROM msg WHERE isread = ? and uid = ?", [0, req.session.uid]);
                    if(unread){
                        profile.unread = true;
                    }
                } else {
                    profile.username = "加载失败";
                }
            }
            res.render("index", profile);
        } catch (e) {
            err(res, 500, "SQL Error");
            console.error(e);
        } finally {
            if (sql) sql.release();
        }
    });
    
    router.get("/account.html", async function (req, res, next) {
        var sql;
        //if(String(parseInt(req.query.id)) === String(req.session.uid)) res.redirect("/user.html");
        try {
            sql = await getDB();
            var profile = {
                isLogin: false,
                thumbnail: "/favicon.png",
                username: "未登录",
                id: req.query.id,
                payload: {
                    name: "加载失败",
                    id: -1,
                    icon: "/fail.png",
                    nick: "",
                    nickBg: "#bbbbbb"
                },
            };
            if (req.session.uid) {
                profile.isLogin = true;
                var my = (
                    await query(sql, "SELECT * FROM user WHERE id=?", [
                        req.session.uid,
                    ])
                )[0];
                if (my) {
                    profile.username = my.username;
                    profile.thumbnail = my.thumbnailUrl;
                } else {
                    profile.username = "加载失败";
                }
            }
            var id = req.query.id;
            var r = await query(
                sql,
                "SELECT username as name, thumbnailUrl as icon, nick, nick_color FROM user WHERE id=?",
                [id]
            );
            if (r && r[0]) {
                profile.payload.name = r[0].name;
                profile.payload.id = id;
                profile.payload.icon = r[0].icon;
                profile.payload.nick = r[0].nick;
                profile.payload.nickBg = r[0].nick_color;
            }
            res.render("account", profile);
        } catch (e) {
            err(res, 500, "SQL Error");
            console.error(e);
        } finally {
            if (sql) sql.release();
        }
    });
    router.get("/verify", async function (req, res, next) {
        try {
            var svg = svgc.create({
                size: 4,
                ignoreChars: "ozOZ029g1Il",
                noise: 5,
                color: true,
                background: "#0088ff",
            });
            res.setHeader("content-type", "image/svg+xml");
            req.session.verify = svg.text;
            req.session.verifyDate = Date.now();
            res.write(svg.data);
            res.end();
        } catch (e) {
            try {
                res.sendFile(path.join(__dirname, "..", "data", "fail.png"));
            } catch (e) {
                null;
            }
        }
    });
    var atCache = [],
        lastCache = 0;
    router.get("/articles", async function (req, res, next) {
        if (lastCache + 10000 > Date.now()) {
            jsonReturn(res, {
                status: 200,
                msg: "获取到已缓存内容",
                payload: atCache,
            });
        } else {
            var sql;
            try {
                sql = await getDB();
                var rs = await query(
                    sql,
                    "SELECT id, title, tm FROM articles ORDER BY tm DESC LIMIT 4"
                );
                atCache = rs.map(function(e){
                    return {
                        ...e,
                        href: "/viewArt?id="+e.id
                    }
                });
                lastCache = Date.now();
                jsonReturn(res, { status: 200, msg: "获取成功", payload: atCache });
            } catch (e) {
                console.log(e);
                err(res, 500, "SQL ERROR");
            } finally {
                if (sql) sql.release();
            }
        }
    });

    router.get("/viewArt", async function(req, res, next){
        if(req.query && req.query.id){
            var sql;
            try {
                sql = await getDB();
                var rs = await query(
                    sql,
                    "SELECT * FROM articles WHERE id=?",
                    [req.query.id]
                );
                if(rs[0]){
                    res.render("article", {title: rs[0].title, text: rs[0].data, owner: rs[0].uid});
                }else{
                    next();
                }
            } catch (e) {
                console.log(e);
                res.status(500);
                next();
            } finally {
                if (sql) sql.release();
            }
        }else{
            next();
        }
    });

    router.get("/user.html", function(req, res, next){
        if(req.session.uid){
            res.redirect("/account.html?id="+req.session.uid);
        }else{
            res.redirect("/login.html?link=%2Fuser.html");
        }
    });
    router.get("/cross", function (req, res) {
        res.header("Content-Type", "text/html");
        console.log(req.query);

        // 发送请求
        http.get(req.query.url || "", function (o) {
            o.pipe(res);
            o.on('end', function(){
                res.end();
            });
        });
    });
    router.get("/logout", function (req, res, next){
        delete req.session.uid;
        res.redirect("/login.html");
    });

    return router;
};
