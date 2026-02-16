function rand(min, max){
  return Math.floor(Math.random()*(max-min))+min;
}
function reverse(list){
  var res = [];
  for(let i of list){
    res.unshift(i);
  }
  return res;
}
/**
 * 转义HTML关键字符。
 * @param {string} html 待转义的HTML字符串。
 * @returns {string} 转义后的HTML字符串。
 */
function encodeHTML(html){
  var html2 = String(html).replace(/^\s*/, '').replace(/\s*$/, '');
  return html2.replace(/(\<|\>|\&|\s|\n)/g, function(str){
    switch(str){
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case ' ':
        return '&nbsp;';
      case '\t':
        return '&nbsp;&nbsp;&nbsp;&nbsp;';
      case '\n':
        return '<br/>';
    }

    return '&nbsp;';
  })
}
module.exports = {rand, reverse, encodeHTML};