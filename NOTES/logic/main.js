import { loadHtml } from "./loader.js";

window.onload = ()=>{
    var loaders = document.getElementsByClassName("loader");
    for (var elem of loaders){
        elem.onclick = (event)=>{
            event.preventDefault();
            var path = event.target.getAttribute("href");
            console.log("path: ", path);
            loadHtml(path, "content");
        }
    }
    // set content to first selector
    loadHtml(loaders[0].getAttribute("href"), "content");
}
