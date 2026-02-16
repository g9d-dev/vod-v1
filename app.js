var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var mysql = require("mysql");
var util = require("util");
var config = require("./config.js");

var indexRouter = require("./routes/index");
var gangweiRouter = require("./routes/gangwei");
var usersRouter = require("./routes/users");
var adminRouter = require("./routes/admin");

function getDB() {
  return new Promise(function (resolve, reject) {
    var conn = mysql.createConnection(config.sql);
    conn.connect(function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          query: function (...stmt) {
            return conn.query(...stmt);
          },
          release: function () {
            return conn.end();
          },
          beginTransaction: util.promisify(conn.beginTransaction),
          commit: util.promisify(conn.commit),
          rollback: util.promisify(conn.rollback),
        });
      }
    });
  });
}

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  require("express-fileupload")({ 
    limits: { fileSize: 250 * 1024 * 1024 },
    defParamCharset: 'utf8' 
  })
);
app.use(
  require("express-session")({
      secret: "fftt52536",
      resave: true,
      saveUninitialized: true,
  })
);

//app.get("/", function(rq, rs){rs.redirect("/mobile.html")});
app.use("/", indexRouter(getDB));
app.use("/gangwei", gangweiRouter(getDB));
app.use("/users", usersRouter(getDB));
app.use("/admin", adminRouter(getDB));


//Just testing
//app.get("/_login", (r, rs)=>{r.session.uid = 1;rs.redirect("/mobile.html")});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});





module.exports = app;
