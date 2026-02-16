var express = require('express');
var {jsonReturn, err, succ, query, gangwei} = require('../lib/route.js');

async function sqlHas(...params){
  var j = await query(...params);
  return (j && j.length > 0 && j[0]);
}

async function rmGangwei(sql, id){
  await query(sql, 'DELETE FROM gangwei WHERE id=?', [id]);
  var list = await query(sql, 'SELECT * FROM users WHERE currentGangwei=?', [id]);
  for(var user of list){
    var joins = await query(sql, 'SELECT * FROM attend WHERE uid=? and gid!=?', [user.id, id]);
    if(joins.length > 0 && joins[joins.length - 1]) await query(sql, 'UPDATE users SET currentGangwei=? WHERE uid=?', [joins[joins.length - 1].gid, user.id]);
    else await query(sql, 'UPDATE users SET currentGangwei=? WHERE uid=?', [0, user.id]);
  }
}
/**
 * 路由函数。
 * @param {()=>any} getDB 获取数据库的函数。
 * @returns {any} 路由器对象。
 */
module.exports = function(getDB){
  var router = express.Router();
  /* GET user listing. */
  router.get('/', async function(req, res, next) {
    var sql;
    if(req.session && req.session.uid){
      try{
        sql = await getDB();
        var ids = await query(sql, 'SELECT gid FROM attend WHERE uid=?', [req.session.uid]);
        var cid = await gangwei(sql, req);
        //if(!cid) jsonReturn(res, []);
        //cid = cid[0].currentGangwei;
        var r = [];
        for(var i = 0; i < ids.length; i ++){
          var c = ids[i];
          var nm = await query(sql, 'SELECT name, owner FROM gangwei WHERE id=?', [c.gid]);
          var name = nm[0].name;
          r.push({
            id: c.gid,
            name: name,
            isCurrent: (c.gid === cid),
            isOwning: nm[0].owner === req.session.uid
          });
        }
        jsonReturn(res, r);
      }catch(e){
        err(res, 500, 'SQL Error');
        console.error(e);
      }finally{
        if(sql) sql.release();
      }
    }else{
      err(res, 403, '用户未登录');
    }
  });
  /*
  router.post('/', async function(req, res, next) {
    var sql;
    if(req.session && req.session.uid && req.body && req.body.id){
      try{
        sql = await getDB();
        var ids = await query(sql, 'SELECT id FROM attend WHERE uid=? and gid=?', [req.session.uid, req.body.id]);
        if(ids.length > 0){
          //await query(sql, 'UPDATE user SET currentGangwei=? WHERE id=?', [req.body.id, req.session.uid]);
          succ(res, "设置成功！");
        }else{
          err(res, 403, '岗位未加入或不存在');
        }
      }catch(e){
        err(res, 500, 'SQL Error');
        console.error(e);
      }finally{
        if(sql) sql.release();
      }
    }else{
      err(res, 400, '参数错误');
    }
  });
  */
  router.post('/new', async function(req, res, next) {
    var sql;
    if(req.session && req.session.uid && req.body && req.body.name && req.body.joinword){
      try{
        sql = await getDB();
        var detail = await query(sql, 'SELECT * FROM gangwei WHERE name=?', [req.body.name]);
        var flag = true;
        if(detail[0]){
          if(await sqlHas(sql, 'SELECT * FROM attend WHERE uid=? and gid=?', [req.session.uid, detail[0].id])){
            err(res, 304, '用户已加入');
            flag = false;
          }
        }
        if(flag){
          if(detail.length < 1){
            var k = await query(sql, 'SELECT id FROM gangwei WHERE owner=?', [req.session.uid]);
            if(!k[1]){
              var id = await query(sql, 'INSERT INTO gangwei (name, joinword, owner) VALUES (?, ?, ?)', [req.body.name, req.body.joinword, req.session.uid]);
              id = id.insertId;
              await query(sql, 'INSERT INTO attend (uid, gid) VALUES (?, ?)', [req.session.uid, id]);
              //await query(sql, 'UPDATE user SET currentGangwei=? WHERE id=?', [id, req.session.uid]);
              succ(res, '创建成功，请刷新沟通页面，牢记口令！');
            }else{
              err(res, 403, '每人最多创建2个岗位');
            }
          }else{
            if(detail[0].joinword === req.body.joinword){
              var u = await query(sql, 'SELECT username FROM user WHERE id=?', [req.session.uid]);
              if(u[0]){
                //TODO: 发送申请信息至主人
                await query(sql, 'INSERT INTO msg (uid, msg, type, appendix) VALUES (?, ?, ?, ?)', [detail[0].owner, u[0].username + '申请进入岗位' + req.body.name, 1, req.session.uid+','+detail[0].id]);
                succ(res, '申请成功，等待主人许可');
              }else{
                err(res, 404, '用户不存在');
              }
            }else{
              err(res, 403, '口令错误，加入失败。')
            }
          }
        }
      }catch(e){
        err(res, 500, 'SQL Error');
        console.error(e);
      }finally{
        if(sql) sql.release();
      }
    }else{
      err(res, 400, '参数错误');
    }
  });
  router.get('/name', async function(req, res, next){
    var sql;
    if(req.session && req.session.uid && req.query && req.query.id){
      try{
        sql = await getDB();
        var cid = await query(sql, 'SELECT id FROM attend WHERE uid=? and gid=?', [req.session.uid, req.query.id]);
        if(!cid[0]) err(res, 404, "用户未加入");
        else{
          var nm = await query(sql, 'SELECT name FROM gangwei WHERE id=?', [req.query.id]);
          if(!nm[0]) err(res, 404, '岗位不存在');
          else{
            succ(res, nm[0].name);
          }
        }
      }catch(e){
        err(res, 500, 'SQL Error');
        console.error(e);
      }finally{
        if(sql) sql.release();
      }
    }else{
      err(res, 400, '参数错误');
    }
  });
  router.get('/isOwner', async function(req, res, next){
    var sql;
    if(req.session && req.session.uid && req.query && req.query.id){
      try{
        sql = await getDB();
        var cid = await query(sql, 'SELECT id FROM attend WHERE uid=? and gid=?', [req.session.uid, req.query.id]);
        if(!cid[0]) succ(res, false);
        else{
          var nm = await query(sql, 'SELECT owner FROM gangwei WHERE id=?', [req.query.id]);
          if(!nm[0]) succ(res, false);
          else{
            succ(res, nm[0].owner === req.session.uid);
          }
        }
      }catch(e){
        err(res, 500, 'SQL Error');
        console.error(e);
      }finally{
        if(sql) sql.release();
      }
    }else{
      err(res, 400, '参数错误');
    }
  });
  router.get('/addUser', async function(req, res, next){
    var sql;
    if(req.session && req.session.uid && req.query && req.query.uid && req.query.gid){
      try{
        sql = await getDB();
        if(await sqlHas(sql, 'SELECT * FROM msg WHERE type="1" and appendix=?', [req.query.uid + ',' + req.query.gid])){
          if(await sqlHas(sql, 'SELECT * FROM attend WHERE uid=? and gid=?', [req.query.uid, req.query.gid])){
            err(res, 304, '用户已加入');
          }else{
            await query(sql, 'INSERT INTO attend (uid, gid) VALUES (?, ?)', [req.query.uid, req.query.gid]);
            await query(sql, 'DELETE FROM msg WHERE type="1" and appendix=?', [req.query.uid + ',' + req.query.gid]);
            //await query(sql, 'UPDATE user SET currentGangwei=? WHERE id=?', [req.query.gid, req.query.uid]);
            succ(res, "添加成功！");
          }
        }else{
          err(res, 404, '对方未请求加入');
        }
      }catch(e){
        err(res, 500, 'SQL Error');
        console.error(e);
      }finally{
        if(sql) sql.release();
      }
    }else{
      err(res, 400, '参数错误');
    }
  });
  router.post('/out', async function(req, res, next){
    var sql;
    if(req.session && req.session.uid && req.body && req.body.id){
      try{
        sql = await getDB();
        var id = req.body.id, u = req.session.uid;
        var isReal = await sqlHas(sql, 'SELECT * FROM attend WHERE uid=? and gid=?', [u, id]);
        if(isReal){
          var name = await query(sql, 'SELECT username FROM user WHERE id=?', [u]);
          name = name[0].username;
          var gs = await query(sql, 'SELECT gid FROM attend WHERE uid=? and gid!=?', [u, id]);
          var own = await query(sql, 'SELECT owner FROM gangwei WHERE id=?', [id]);
          own = own[0].id;
          var cid;
          if(!gs[0]) cid = 0;
          else cid = gs[0].gid;
          var isOwner = await sqlHas(sql, 'SELECT id FROM gangwei WHERE id=? and owner=?', [id, u]);
          await query(sql, 'DELETE FROM attend WHERE uid=? and gid=?', [u, id]);
          //await query(sql, 'UPDATE user SET currentGangwei=? WHERE id=?', [cid, u]);
          if(isOwner) await rmGangwei(sql, id);
          else await query(sql, 'INSERT INTO msg (uid, msg, type) VALUES (?, ?, ?)', [own, name+"退出岗位", 2]);
          succ(res, (isOwner ? '删除' : '退出') + '成功');
        }else{
          err(res, 404, '未加入此岗位');
        }
      }catch(e){
        err(res, 500, 'SQL Error');
        console.error(e);
      }finally{
        if(sql) sql.release();
      }
    }else{
      err(res, 400, '参数错误');
    }
  });
  router.get('/rm', async function(req, res, next){
    var sql;
    if(req.session && req.session.uid && req.query && req.query.uid && req.query.gid){
      if(String(req.session.uid) === String(req.query.uid)){
      try{
        sql = await getDB();
        var id = req.query.gid, u = req.query.uid;
        var isReal = await sqlHas(sql, 'SELECT * FROM attend WHERE uid=? and gid=?', [u, id]);
        if(isReal){
          var isOwner = await sqlHas(sql, 'SELECT * FROM gangwei WHERE id=? and owner=?', [id, req.session.uid]);
          if(isOwner){
            var gs = await query(sql, 'SELECT gid FROM attend WHERE uid=? and gid!=?', [u, id]);
            var cid;
            if(!gs[0]) cid = 0;
            else cid = gs[0].gid;
            //await query(sql, 'UPDATE user SET currentGangwei=? WHERE id=?', [cid, u]);
            await query(sql, 'DELETE FROM attend WHERE uid=? and gid=?', [u, id]);
            succ(res, '删除成功！');
          }else{
            err(res, 403, '不是管理员');
          }
        }else{
          err(res, 404, '用户未加入');
        }
      }catch(e){
        err(res, 500, 'SQL Error');
        console.error(e);
      }finally{
        if(sql) sql.release();
      }
    }else{
      err(res, 403, '岗位主人不可自我删除；请先转让管理员权限');
    }
    }else{
      err(res, 400, '参数错误');
    }
  });
  router.get('/changeOwner', async function(req, res, next){
    var sql;
    if(req.session && req.session.uid && req.query && req.query.newid && req.query.gid){
      try{
        sql = await getDB();
        var id = req.query.gid, u = req.query.newid, o = req.session.uid;
        var isReal = await sqlHas(sql, 'SELECT id FROM gangwei WHERE id=? and owner=?', [id, o]);
        var isReallyReal = await sqlHas(sql, 'SELECT id FROM attend WHERE uid=? and gid=?', [u, id]);
        if(isReal && isReallyReal){
          await query(sql, 'UPDATE gangwei SET owner=? WHERE id=?', [u, id]);
          succ(res, '切换成功！');
        }else{
          err(res, 404, '请求无效');
        }
      }catch(e){
        err(res, 500, 'SQL ERROR');
        console.error(e);
      }
    }else{
      err(res, 400, '参数错误');
    }
  });
  
  return router;
};
