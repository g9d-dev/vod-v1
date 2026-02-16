function jsonReturn(res, json){
  try{
    res.status(200).setHeader("Content-Type", "application/json").end(JSON.stringify(json));
  }catch(e){
    try{
      res.end();
    }catch(ee){
      console.log("Cannot stop req!");
      null;
    }
    null;
  }
}

function err(res, status, msg){
  jsonReturn(res, {status: status, msg: msg});
}

function succ(res, msg){
  err(res, 200, msg);
}

function query(connection, ...rest){
  return new Promise(function(resolve, reject){
    connection.query(...rest,function(error,results){
      if(error){
        reject(error);
      }else{
        resolve(results);
      }
    });
  });
}
async function sqlHas(...params){
  var j = await query(...params);
  return (j && j.length > 0 && j[0]);
}
async function gangwei(sql, req){
  var gid = req.query.gid || '0';
  if(!await sqlHas(sql, 'SELECT * FROM attend WHERE uid=? and gid=?', [req.session.uid, gid])){
    gid = '0';
  }
  return parseInt(gid) || 0;
}
module.exports = {jsonReturn, err, succ, query, sqlHas, gangwei};