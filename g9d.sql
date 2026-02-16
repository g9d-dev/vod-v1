-- MySQL dump 10.13  Distrib 5.5.53, for Win32 (AMD64)
--
-- Host: localhost    Database: g9d
-- ------------------------------------------------------
-- Server version	5.5.53

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `articles`
--

DROP TABLE IF EXISTS `articles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `articles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uid` int(11) NOT NULL DEFAULT '3',
  `title` varchar(255) NOT NULL DEFAULT '新文章',
  `tm` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `data` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `articles`
--

LOCK TABLES `articles` WRITE;
/*!40000 ALTER TABLE `articles` DISABLE KEYS */;
INSERT INTO `articles` VALUES (1,3,'G9D：抢占第一个文章位','2024-11-29 10:53:12','<h2>啥也不是，就是来抢位置啦</h2>\r\n<p>呵呵呵，</p>\r\n<p>我只能说--欢迎光临G9D。</p>'),(2,3,'G9D:测试成功','2024-11-29 10:49:02','<h2>测试成功</h2>\n<p>Wow！您又一次看到了我们的测试文章！</p>\n'),(3,3,'G9D','2024-11-29 10:50:05','<h2>测试成功</h2>\n<p>Wow！您又一次看到了我们的测试文章！</p>\n'),(4,3,'用户提示','2024-11-29 10:51:59','<p>访问 <a href=\"/user.html\">用户页面</a>即可获取和设置用户信息！</p>\n'),(5,3,'用户牌子细则','2025-02-10 03:26:29','<h2>用户名牌子简介</h2><p style=\"background:#55ccff\">我的用户名牌子：<span class=\"tag\" id=\"ttt\">Loading...</span></p>\n<p>欢迎来到G9D。这里是新一代在线聊天工具，是用户交流的平台。在聊天时，您可能会遇到用户名旁边的彩色牌子（如<img src=\"/articlecdn/tag.png\"/>）。这是什么意思呢？</p>\n<pre><code>\n“用户名牌子是用户等级、信誉、能力的象征。\n通过用户名牌子，G9D可以促进用户规范言行，并改善社区气氛。\n由此可知，用户名牌子在用户沟通间起着巨大作用。\n</code></pre>\n<h2>用户名牌子列表</h2>\n<h3>灰色牌子：</h3>\n<p>普通用户的用户名牌子为灰色。在刚注册时，用户的称号为灰色“小白”。</p>\n<h3>绿色牌子：</h3>\n<p>高级用户的用户名牌子为绿色。在金币满1000时，可兑换一次自定义绿色称号。</p>\n<h3>金色牌子：</h3>\n<p>管理员或杰出用户的用户名牌子为金色。</p>\n\n<hr/>\n<p><sup>精彩稍后更新</sup></p>\n\n<script>\nfetch(\"/users/my\").then(s=>s.json()).then(n=>{\n    var tg = document.getElementById(\"ttt\");\n    if(!n.nick){ tg.innerText=\"未登录\"; return; }\n    tg.style.background=n.nickBg;tg.innerText=n.nick;\n}).catch(console.error);\n</script>\n');
/*!40000 ALTER TABLE `articles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attend`
--

DROP TABLE IF EXISTS `attend`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `attend` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uid` int(11) NOT NULL DEFAULT '0',
  `gid` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `a_uid` (`uid`),
  KEY `a_gid` (`gid`),
  CONSTRAINT `a_gid` FOREIGN KEY (`gid`) REFERENCES `gangwei` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `a_uid` FOREIGN KEY (`uid`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attend`
--

LOCK TABLES `attend` WRITE;
/*!40000 ALTER TABLE `attend` DISABLE KEYS */;
INSERT INTO `attend` VALUES (5,2,2),(7,1,2),(8,1,3),(9,2,3),(10,3,3),(11,3,4),(12,3,2);
/*!40000 ALTER TABLE `attend` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat`
--

DROP TABLE IF EXISTS `chat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chat` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sender` int(11) NOT NULL DEFAULT '0',
  `towho` int(11) DEFAULT NULL,
  `sendtime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `message` longtext NOT NULL,
  `gangwei` int(11) NOT NULL DEFAULT '0',
  `unread` int(11) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `gangwei` (`gangwei`),
  KEY `sender` (`sender`),
  KEY `towho` (`towho`),
  CONSTRAINT `gangwei` FOREIGN KEY (`gangwei`) REFERENCES `gangwei` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `sender` FOREIGN KEY (`sender`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `towho` FOREIGN KEY (`towho`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat`
--

LOCK TABLES `chat` WRITE;
/*!40000 ALTER TABLE `chat` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gangwei`
--

DROP TABLE IF EXISTS `gangwei`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gangwei` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT '未命名岗位',
  `joinword` varchar(255) DEFAULT NULL,
  `owner` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `owner` (`owner`),
  CONSTRAINT `owner` FOREIGN KEY (`owner`) REFERENCES `user` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gangwei`
--

LOCK TABLES `gangwei` WRITE;
/*!40000 ALTER TABLE `gangwei` DISABLE KEYS */;
INSERT INTO `gangwei` VALUES (2,'test','test',1),(3,'new','new',1),(4,'管理员','test',3);
/*!40000 ALTER TABLE `gangwei` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `msg`
--

DROP TABLE IF EXISTS `msg`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `msg` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uid` int(11) NOT NULL DEFAULT '0',
  `msg` varchar(255) NOT NULL DEFAULT '',
  `type` int(11) NOT NULL DEFAULT '0' COMMENT '消息类型，1为加入岗位验证消息，0为普通可删除消息',
  `appendix` varchar(255) NOT NULL DEFAULT '' COMMENT '备注',
  `isread` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `msg`
--

LOCK TABLES `msg` WRITE;
/*!40000 ALTER TABLE `msg` DISABLE KEYS */;
/*!40000 ALTER TABLE `msg` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL DEFAULT '',
  `password` varchar(255) NOT NULL DEFAULT '' COMMENT 'md5加密后的密码值',
  `email` varchar(255) DEFAULT NULL,
  `thumbnailUrl` varchar(255) NOT NULL DEFAULT '/static/blank.png',
  `currentGangwei` int(11) NOT NULL DEFAULT '0',
  `admin` int(11) NOT NULL DEFAULT '0',
  `nick` varchar(255) DEFAULT '小白' COMMENT '用户称号',
  `nick_color` varchar(255) DEFAULT '#bbbbbb',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'老师','daf77f5cb7ea362651d4c2d56619d80b',NULL,'/static/blank.png',2,0,'砖家','#00ff55'),(2,'学生','098f6bcd4621d373cade4e832627b4f6','test@example.com','/static/blank.png',2,0,'小白','#bbbbbb'),(3,'erhu','5a007a27ae2020d08db8637e1bf49bc3',NULL,'/static/1ecf709d51049924997e78dbb922cbd2.svg',0,1,'大V','#ffaa00');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-02-22 11:28:12
