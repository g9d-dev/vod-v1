module.exports = function query(sql, ...rest){
    return new Promise(function(resolve, reject){
        sql.query(...rest, function(err, result){
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });
    });
};