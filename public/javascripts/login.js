function getParams(){
    var name = $("[name='username']"),
        pwd = $("[name='password']");
    return {username: name.val(), password: pwd.val()};
}
function handleUpdate(callback){
    var params = getParams();
    if(params.username && params.password){
        handleUserUpdate(params, 'login', callback);
    }else{
        alert('用户名和密码不能为空');
    }
}
function callback(suceeded, json){
    if(suceeded && json && json.status === 200){
        var sp = new URL(window.location.href).searchParams;
        if(sp.has('link')){
            window.location.replace(sp.get("link"));
        }else{
            window.location.replace('/');
        }
    }else{
        alert((json && json.msg) ? json.msg : '登录失败');
        console.error(json);
    }
}
$("#submit").on('click', function(){
    handleUpdate(callback);
});