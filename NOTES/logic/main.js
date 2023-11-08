import { loadHtml, loadJS } from "./loader.js";
import { setCookie, getCookie } from "./cookies.js";

var CONTENT_PATH = "";
var SCRIPT_PATH = "";
var DEFAULT_CK_DURATION_DAYS = 3;

window.onload = ()=>{
    createLoaderListeners();
    recoverLoaderState();
}

function createLoaderListeners(){
    var loaders = document.getElementsByClassName("loader");
    for (var elem of loaders){
        elem.onclick = (event)=>{
            event.preventDefault();
            var CONTENT_PATH = event.target.getAttribute("href");
            if (CONTENT_PATH){
                setCookie("CONTENT_PATH", CONTENT_PATH, DEFAULT_CK_DURATION_DAYS, 'd');
                loadHtml(CONTENT_PATH, "content");
            } else {
                console.log(event.target.innerHTML, ": no html path");
            }
            var SCRIPT_PATH = event.target.getAttribute("data-js");
            if (SCRIPT_PATH){
                setCookie("SCRIPT_PATH", SCRIPT_PATH, DEFAULT_CK_DURATION_DAYS, 'd');
                loadJS(SCRIPT_PATH);
            } else {
                console.log(event.target.innerHTML, ": no js path");
            }
            
        }
    }
    // set default content path and script path
    CONTENT_PATH = loaders[0].getAttribute("href");
    SCRIPT_PATH = loaders[0].getAttribute("data-js");
}

function recoverLoaderState(){
    let contentPath = getCookie("CONTENT_PATH");
    let scriptPath = getCookie("SCRIPT_PATH");
    if (contentPath){
        CONTENT_PATH = contentPath;
        loadHtml(CONTENT_PATH, "content");
    }
    if (scriptPath){
        SCRIPT_PATH = scriptPath;
        loadJS(SCRIPT_PATH);
    }
}