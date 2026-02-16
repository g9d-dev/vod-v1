var urls = ['free-v4-font-face.css', 'free-v5-font-face.css', 'free-v4-shims.min.css', 'free.min.css'];
urls.forEach(function(el){
    var css = document.createElement("link");
    css.setAttribute("rel", "stylesheet");
    css.setAttribute("href", "/stylesheets/fa/"+el);
    document.head.append(css);
});