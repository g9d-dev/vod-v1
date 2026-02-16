@echo off
set /p username=Enter User Name: 
mysqldump -u %username% -p g9d > ./g9d.sql