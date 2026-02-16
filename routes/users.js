var express = require("express");
var { jsonReturn, err, succ, query, gangwei } = require("../lib/route.js");
var { encodeHTML, reverse } = require("../lib/utils.js");
var sendMail = require("../lib/mail.js");
var crypto = require("crypto");
var path = require("path");
var fs = require("fs");
async function query_with_col(a, b, ...c) {
    var r = await query(a, ...c);
    if (r && r[0]) {
        return r[0][b];
    }
    return undefined;
}
function decodeDate(str) {
    return new Date(str).valueOf();
}
/**
 * 路由函数。
 * @param {()=>any} getDB 获取数据库的函数。
 * @returns {any} 路由器对象。
 */
module.exports = function (getDB) {
    var router = express.Router();
    var users = {};
    var glb = {};
    /* GET users listing. */
    router.get("/", async function (req, res, next) {
        var sql;
        if (!req.session.uid) {
            jsonReturn(res, []);
            return;
        }
        try {
            sql = await getDB();
            var cid = await gangwei(sql, req);
            //cid = cid[0].currentGangwei;
            if (req.query.gid) {
                var s = await query(
                    sql,
                    "SELECT id FROM attend WHERE uid=? and gid=?",
                    [req.session.uid, req.query.gid]
                );
                if (s[0]) cid = req.query.gid;
            }
            var ids = await query(sql, "SELECT uid FROM attend WHERE gid=?", [
                cid,
            ]);
            ids = Array.from(ids)
                .map(function (val) {
                    return val.uid;
                })
                .join(",");
            if (ids) {
                var uii = req.session.uid;
                var r = await query(
                    sql,
                    "SELECT id, username, nick, nick_color FROM user WHERE id in (" + ids + ")"
                );
                var list = await Promise.all(
                    Array.from(r).map(function (val) {
                        return Promise.all([
                            val.username,
                            val.id,
                            query_with_col(
                                sql,
                                "unread",
                                "SELECT max(unread) as unread FROM chat WHERE sender=? and towho=? and gangwei=?",
                                [val.id, uii, cid]
                            ),
                            query_with_col(
                                sql,
                                "time",
                                "SELECT max(sendtime) as time FROM chat WHERE gangwei=? and (sender=? and towho=?) or (sender=? and towho=?)",
                                [cid, val.id, uii, uii, val.id]
                            ),
                            val.nick_color,
                            val.nick
                        ]);
                    })
                );
                list = list.map(function (s) {
                    console.log(s[3]);
                    return [s[0], s[1], s[2], decodeDate(s[3]), s[4], s[5]];
                });
                list.sort(function (a, b) {
                    return b[3] - a[3];
                });
                console.log(list);
                jsonReturn(res, list);
            } else {
                jsonReturn(res, []);
            }
        } catch (e) {
            err(res, 500, "SQL Error");
            console.error(e);
        } finally {
            if (sql) sql.release();
        }
    });
    router.get("/name", async function (req, res, next) {
        var sql;
        try {
            if (req.query && req.query.id) {
                sql = await getDB();
                var r = await query(
                    sql,
                    "SELECT username FROM user WHERE id=?",
                    [req.query.id]
                );
                if (r && r[0]) jsonReturn(res, { name: r[0].username });
                else jsonReturn(res, { name: "" });
            } else {
                jsonReturn(res, { name: "" });
            }
        } catch (e) {
            err(res, 500, "SQL Error");
            console.error(e);
        }
    });
    router.get("/data", async function (req, res, next) {
        var sql;
        if (req.query && req.session && req.session.uid) {
            try {
                sql = await getDB();
                //console.log(req.query.uid);
                var hisname;
                if (req.query.id) {
                    hisname = (
                        await query(
                            sql,
                            "SELECT username FROM user WHERE id=?",
                            [req.query.id]
                        )
                    )[0].username;
                } else {
                    hisname = null;
                }
                var my = (
                    await query(sql, "SELECT username FROM user WHERE id=?", [
                        req.session.uid,
                    ])
                )[0];
                var myname = my.username;
                var cid = await gangwei(sql, req);
                await query(
                    sql,
                    'UPDATE chat SET unread="0" WHERE towho=? and sender=? and gangwei=?',
                    [req.session.uid, req.query.id || null, cid]
                );
                var r;
                if (req.query.id)
                    r = await query(
                        sql,
                        "SELECT sender, message FROM chat WHERE ((sender=? and towho=?) or (towho=? and sender=?)) and gangwei=? ORDER BY sendtime DESC LIMIT 60",
                        [
                            req.session.uid,
                            req.query.id,
                            req.session.uid,
                            req.query.id,
                            cid,
                        ]
                    );
                else
                    r = await query(
                        sql,
                        "SELECT DISTINCT chat.sender as sender, user.username as sendername, chat.message as message, chat.id as id, chat.sendtime as sendtime FROM user, chat WHERE chat.gangwei=? and chat.towho is null and user.id = chat.sender ORDER BY sendtime DESC LIMIT 60",
                        [cid]
                    );
                //console.log(hisname, myname);
                var list = reverse(Array.from(r)).map(function (val) {
                    //console.log(val, req.query.id, val.sender===req.query.id);
                    return [
                        req.query.id
                            ? String(val.sender) === String(req.query.id)
                                ? hisname
                                : myname
                            : val.sendername,
                        val.message,
                        val.id
                    ];
                });
                jsonReturn(res, list);
            } catch (e) {
                err(res, 500, "SQL Error");
                console.error(e);
            } finally {
                if (sql) sql.release();
            }
        } else {
            err(res, 400, "参数错误");
        }
    });
    router.post("/msg", async function (req, res, next) {
        var sql;
        if (req.body && req.body.message && req.session && req.session.uid) {
            try {
                sql = await getDB();
                var message = encodeHTML(req.body.message);
                var nm = await query(
                    sql,
                    "SELECT username FROM user WHERE id=?",
                    [req.session.uid]
                );
                if (nm && nm[0] && nm[0].username) {
                    if (!message) err(res, 400, "信息不可为空");
                    else {
                        var cid = await gangwei(sql, req);
                        //cid = cid[0].currentGangwei;
                        if (!users[cid]) err(res, 404, "岗位无人加入");
                        else if (!glb[cid]) err(res, 404, "岗位无人加入");
                        else {
                            sql = await getDB();
                            var u = await query(
                                sql,
                                "SELECT username FROM user WHERE id=?",
                                [req.body.to || null]
                            );
                            if ((u && u.length && u[0]) || !req.body.to) {
                                var k = await query(
                                    sql,
                                    "INSERT INTO chat (sender, towho, message, gangwei) VALUES (?, ?, ?, ?)",
                                    [
                                        req.session.uid,
                                        req.body.to || null,
                                        message,
                                        cid,
                                    ]
                                );
                                //console.log(k.insertId);
                                succ(res, "发送成功！");
                                //console.log(req.body.to);
                                users[cid].forEach(function (uu) {
                                    if (
                                        String(uu[0].session.uid) ===
                                            String(req.body.to) ||
                                        String(uu[0].session.uid) ===
                                            String(req.session.uid) ||
                                        !req.body.to
                                    ) {
                                        var m =
                                            "From " +
                                            req.session.uid +
                                            " To " +
                                            (req.body.to || 0) +
                                            " "+
                                            (k.insertId) +
                                            ":";
                                        if (!req.body.to) {
                                            m += nm[0].username + "\n";
                                        }
                                        m += message;
                                        var msg =
                                            "event: msg\ndata: " +
                                            m.replace(/\n/, "\ndata: ");
                                        msg += "\n\n";
                                        uu[1].write(msg);
                                    }
                                });
                                glb[cid].forEach(function (u) {
                                    var m =
                                        "From " +
                                        req.session.uid +
                                        " To " +
                                        (req.body.to || 0);
                                    var msg =
                                        "event: msg\ndata: " +
                                        m.replace(/\n/, "\ndata: ");
                                    msg += "\n\n";
                                    u[1].write(msg);
                                });
                            } else {
                                err(res, 404, "用户不存在");
                            }
                        }
                    }
                } else {
                    err(res, 404, "无法查询用户名");
                }
            } catch (e) {
                err(res, 500, "SQL Error");
                console.error(e);
            } finally {
                if (sql) sql.release();
            }
        } else {
            err(res, 400, "参数错误");
        }
    });
    router.get("/sse", async function (req, res, next) {
        var sql;
        if (req.session && req.session.uid) {
            try {
                sql = await getDB();
                var cid = await gangwei(sql, req);
                //cid = cid[0].currentGangwei;
                if (!users[cid]) users[cid] = [];
                var k = [req, res];
                users[cid].push(k);
                req.socket.on("close", function () {
                    users[cid].splice(users[cid].indexOf(k), 1);
                    res.end();
                });
                res.writeHead(200, {
                    "content-type": "text/event-stream",
                    connection: "keep-alive",
                    "cache-control": "no-cache",
                });
            } catch (e) {
                err(res, 500, "SQL Error");
                console.error(e);
            } finally {
                if (sql) sql.release();
            }
        } else {
            err(res, 400, "参数错误");
        }
    });
    router.get("/global", async function (req, res, next) {
        var sql;
        if (req.session && req.session.uid) {
            try {
                sql = await getDB();
                var cid = await gangwei(sql, req);
                //cid = cid[0].currentGangwei;
                if (!glb[cid]) glb[cid] = [];
                var k = [req, res];
                glb[cid].push(k);
                req.socket.on("close", function () {
                    glb[cid].splice(glb[cid].indexOf(k), 1);
                    res.end();
                });
                res.writeHead(200, {
                    "content-type": "text/event-stream",
                    connection: "keep-alive",
                    "cache-control": "no-cache",
                });
            } catch (e) {
                err(res, 500, "SQL Error");
                console.error(e);
            } finally {
                if (sql) sql.release();
            }
        } else {
            err(res, 400, "参数错误");
        }
    });
    router.get("/my", async function (req, res, next) {
        var sql;
        if (req.session && req.session.uid) {
            try {
                sql = await getDB();
                var my = (
                    await query(sql, "SELECT username, nick, nick_color FROM user WHERE id=?", [
                        req.session.uid,
                    ])
                )[0];
                jsonReturn(res, { id: req.session.uid, name: my.username, nick: my.nick, nickBg: my.nick_color });
            } catch (e) {
                err(res, 500, "SQL Error");
                console.error(e);
            } finally {
                if (sql) sql.release();
            }
        } else {
            jsonReturn(res, { id: -1, name: "" });
        }
    });
    router.get("/msgs", async function (req, res, next) {
        var sql;
        if (req.session && req.session.uid) {
            try {
                sql = await getDB();
                var c = await query(sql, "SELECT count(id) as 'cnt' FROM msg WHERE uid=?", [req.session.uid]);
                var d = await query(sql, "SELECT id, uid, msg, type, appendix, min(isread) as 'read' FROM msg WHERE uid=?", [
                    req.session.uid,
                ]);
                //console.log(c);
                if(c && c[0] && typeof c[0].cnt !== "undefined"){
                    if(d.length > c[0].cnt){
                        d.length = c[0].cnt;//解决消息为null的BUG
                    }
                }
                jsonReturn(res, { status: 200, data: d });
            } catch (e) {
                err(res, 500, "SQL Error");
                console.error(e);
            } finally {
                if (sql) sql.release();
            }
        } else {
            jsonReturn(res, { status: 200, data: [] });
        }
    });
    router.get("/readmsg", async function (req, res, next) {
        var sql;
        if (req.session && req.session.uid) {
            try {
                sql = await getDB();
                await query(sql, "UPDATE msg SET isread=? WHERE uid=?", [
                    1,
                    req.session.uid,
                ]);
                succ(res, "设置成功！");
            } catch (e) {
                err(res, 500, "SQL Error");
                console.error(e);
            } finally {
                if (sql) sql.release();
            }
        } else {
            err(res, 400, "用户未登录");
        }

    });
    
    router.post("/login", async function (req, res, next) {
        var sql;
        if (req.body && req.body.username && req.body.password) {
            try {
                sql = await getDB();
                var s = await query(
                    sql,
                    "SELECT id, thumbnailUrl, admin FROM user WHERE username=? and password=?",
                    [
                        req.body.username,
                        crypto
                            .createHash("md5")
                            .update(req.body.password)
                            .digest("hex"),
                    ]
                );
                if (s && s.length > 0 && s[0] && s[0].id) {
                    req.session.uid = s[0].id;
                    if(String(s[0].admin) === '1') req.session.isAdmin = true;
                    else req.session.isAdmin = false;
                    jsonReturn(res, {
                        status: 200,
                        msg: "登录成功",
                        thumbnailUrl: s[0].thumbnailUrl || "",
                    });
                } else {
                    err(res, 403, "用户名或密码错误，登陆失败！");
                }
            } catch (e) {
                console.error(e);
                err(res, 500, "SQL Error");
            } finally {
                if (sql) sql.release();
            }
        } else {
            err(res, 400, "参数错误");
        }
    });
    router.get("/auth", async function (req, res, next) {
        if (req.session && req.query && req.query.email) {
            try {
                if (
                    req.session.sendTime &&
                    Date.now() - req.session.sendTime < 60000
                ) {
                    err(res, 429, "请求过于频繁");
                }
                var emailRegex = /^[^\<\>]*$/;
                if (emailRegex.exec(req.query.email)) {
                    var list = "abcdefghijklmnopqrstuvwxyz1234567890/?!_-+=";
                    var l = 15;
                    var result = "";
                    for (var i = 0; i < l; i++) {
                        result += list[Math.floor(Math.random() * list.length)];
                    }
                    data = `<h1>G9D官网注册验证码</h1><p>您正在注册G9D工作室官网，验证码是：${result}，请不要泄露信息或转告他人。若非本人操作，请忽略此消息或删除。</p>`;
                    req.session.mailAuth = result;
                    req.session.mail = req.query.email;
                    req.session.sendTime = Date.now();
                    console.log("Sending to " + req.query.email, data);
                    await sendMail(req.query.email, "G9D注册验证码", data);
                    succ(res, "发送成功！");
                } else {
                    err(res, 400, "邮件格式错误");
                }
            } catch (e) {
                err(res, 500, "发送失败");
            }
        } else {
            err(res, 400, "参数错误：请使用email参数");
        }
    });

    router.post("/file", async function(req, res, next){
        if(req.session.uid && req.files && req.files.file){
            if(req.files.file.size > 1000000 && !req.session.isAdmin){
                err(res, 403, "文件太大");
            }else{
                var al = Math.floor(Date.now()) + "" + Math.floor(Math.random() * 10) + path.extname(req.files.file.name);
                req.files.file.mv(path.join(__dirname, "..", ".data", al), async function(er){
                    try{
                        sql = await getDB();
                                
                        if(er){
                            err(res, 500, JSON.stringify(er));
                            console.error(er);
                        }else{
                            req.session.lcode = al;
                            var mimename = Buffer.from(req.files.file.name).toString('utf8');
                            var message = `
                                <a class="file" href="/users/file/${al}" download=${JSON.stringify(String(mimename))}>发送文件 <span class="filename">${encodeHTML(mimename)}</span>，点击查看</a>
                            `;
                            var nm = await query(
                                sql,
                                "SELECT username FROM user WHERE id=?",
                                [req.session.uid]
                            );
                            if (nm && nm[0] && nm[0].username) {
                                if (!message) err(res, 400, "信息不可为空");
                                else {
                                    var cid = await gangwei(sql, req);
                                    //cid = cid[0].currentGangwei;
                                    if (!users[cid]) err(res, 404, "岗位无人加入");
                                    else if (!glb[cid]) err(res, 404, "岗位无人加入");
                                    else {
                                        sql = await getDB();
                                        var u = await query(
                                            sql,
                                            "SELECT username FROM user WHERE id=?",
                                            [req.body.to || null]
                                        );
                                        if ((u && u.length && u[0]) || !req.body.to) {
                                            var k = await query(
                                                sql,
                                                "INSERT INTO chat (sender, towho, message, gangwei) VALUES (?, ?, ?, ?)",
                                                [
                                                    req.session.uid,
                                                    req.body.to || null,
                                                    message,
                                                    cid,
                                                ]
                                            );
                                            //console.log(k.insertId);
                                            //succ(res, "发送成功！");
                                            jsonReturn(res, {
                                                status: 200,
                                                msg: "分享成功",
                                                code: al
                                            });
                                            //console.log(req.body.to);
                                            users[cid].forEach(function (uu) {
                                                if (
                                                    String(uu[0].session.uid) ===
                                                        String(req.body.to) ||
                                                    String(uu[0].session.uid) ===
                                                        String(req.session.uid) ||
                                                    !req.body.to
                                                ) {
                                                    var m =
                                                        "From " +
                                                        req.session.uid +
                                                        " To " +
                                                        (req.body.to || 0) +
                                                        " "+
                                                        (k.insertId) +
                                                        ":";
                                                    if (!req.body.to) {
                                                        m += nm[0].username + "\n";
                                                    }
                                                    m += message;
                                                    var msg =
                                                        "event: msg\ndata: " +
                                                        m.replace(/\n/g, "\ndata: ");
                                                    msg += "\n\n";
                                                    uu[1].write(msg);
                                                }
                                            });
                                            glb[cid].forEach(function (u) {
                                                var m =
                                                    "From " +
                                                    req.session.uid +
                                                    " To " +
                                                    (req.body.to || 0);
                                                var msg =
                                                    "event: msg\ndata: " +
                                                    m.replace(/\n/, "\ndata: ");
                                                msg += "\n\n";
                                                u[1].write(msg);
                                            });
                                        } else {
                                            err(res, 404, "用户不存在");
                                        }
                                    }
                                }
                            } else {
                                err(res, 404, "无法查询用户名");
                            }
                        }
                    } catch (e) {
                        err(res, 500, "SQL Error");
                        console.error(e);
                    } finally {
                        if (sql) sql.release();
                    }
                });
            }
        }else{
            err(res, 400, "参数错误");
        }
    });

    router.get("/file/:code", function(req, res, next){
        fs.access(path.join(__dirname, "..", ".data", req.params.code.replace(/\/\\/g, "")), function(er){
            if(er){
                res.status(404);
                res.render("nofile");
            }else{
                res.header("Content-Disposition", "attachment");
                res.sendFile(path.join(__dirname, "..", ".data", req.params.code.replace(/\/\\/g, "")));
            }
        });
    });
    router.get("/lastcode", function(req, res, next){
        if(req.session.lcode) jsonReturn(res, {status: 200, code: req.session.lcode});
        else jsonReturn(res, {status: 200, code: ""});
    });

    return router;
};
