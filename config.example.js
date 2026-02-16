module.exports = {
    smtp: {
        host: "你的SMTP服务器，比如：smtp.qq.com",
        port: 465, //smtp端口
        https: true, //是否使用https传输协议
        mail: "xxx@example.com", //发件人真实邮箱
        key: "0123456789abcdef" //SMTP授权码（请与登录密码区分开！），QQ邮箱授权码获取方法：设置 > 常规 > 第三方服务（往下滑会看见的） > IMAP/SMTP服务
    },
    sql: { //MySQL配置
        host: "localhost",
        user: "root",
        password: "root",
        database: "g9d",
    },
    key: "qwertyuiopasdfghjklzxcvbnm" //网站密钥，自己随意设置但不要太简单
};//配置完以后重命名为config.js(去掉example)