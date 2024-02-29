import { getStationInfo, getProcessData} from "./data.js";
import { loadSession } from "./session.js"

// call after load
window.onload = function () {
    console.log("loaded dashboard");
    // get cookies from caller
    loadSession();
    // set toggle listeners
    setTogglers();
    // check media
    fitMedia();
    // get station parameters
    getStationInfo();
    // get raw data
    getProcessData();
};

// call on resize
const mql = window.matchMedia("(max-width: 600px)");
mql.onchange = (e) => {
    if (e.matches) {
        collapseSideView();
    } else {
        expandSideView();
    }
}

function setTogglers() {
    var togglers = document.getElementsByClassName("content-toggler");
    for (var toggler of togglers) {
        togglerOpen(toggler);
        toggler.onclick = (event) => { togglerToggle(event.target) }
    }
    // set console toggler
    var btn = document.getElementById("float-btn");
    btn.onclick = () => {
        var console = document.getElementById("console");
        if (console.style.display == "none"){
            console.style.display = "block";
        } else {
            console.style.display = "none";
        }
    }
}

function collapseSideView() {
    console.log("collapsing");
    var togglers = document.getElementsByClassName("content-toggler");
    for (var toggler of togglers) {
        togglerClose(toggler);
    }
}

function expandSideView() {
    console.log("expanding");
    var togglers = document.getElementsByClassName("content-toggler");
    for (var toggler of togglers) {
        togglerOpen(toggler);
    }
}

function togglerClose(toggler) {
    var target_id = toggler.getAttribute("data-target");
    var content = document.getElementById(target_id);
    var dataState = content.getAttribute("data-ready");
    switch (dataState){
        case "wait":
            content.style.display = "none";
            // toggler.innerText = "⏳";
            toggler.src = "img/loading.gif";
            break;
        case "ready":
            content.style.display = "none";
            // toggler.innerText = "🔽"; //"▽";
            toggler.src = "img/open.png";
            break;
        default:
            content.style.display = "none";
            // toggler.innerText = "⛔";
            toggler.src = "img/error.png";
            break;
    }
}

export function togglerOpen(toggler) {
    var target_id = toggler.getAttribute("data-target");
    var content = document.getElementById(target_id);
    var dataState = content.getAttribute("data-ready");
    switch (dataState){
        case "wait":
            content.style.display = "none";
            // toggler.innerText = "⏳";
            toggler.src = "img/loading.gif";
            break;
        case "ready":
            content.style.display = "block";
            // toggler.innerText = "🔼";//"△";
            toggler.src = "img/close.png";
            break;
        default:
            content.style.display = "none";
            // toggler.innerText = "⛔";
            toggler.src = "img/error.png";
            break;
    }
}

function togglerToggle(toggler) {
    var target_id = toggler.getAttribute("data-target");
    var content = document.getElementById(target_id);
    if (content.style.display == "none") {
        togglerOpen(toggler);
    } else {
        togglerClose(toggler);
    }
}

function fitMedia() {
    if (window.innerWidth < 600) {
        collapseSideView();
    }
}

export function logMessage(msg){
    const creationTime = new Date();
    const formattedDate = creationTime.toLocaleDateString('pt-BR', { hour: 'numeric', minute: 'numeric', second: 'numeric' });

    var elem = document.getElementById("console");
    elem.appendChild(document.createTextNode(formattedDate + ": " + msg));
    elem.appendChild(document.createElement('br'));
}