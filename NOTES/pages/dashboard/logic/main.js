import {setCookie, getCookie} from "../../../logic/cookies.js"

// call after load
window.onload = function() {
    console.log("loaded dashboard");
    // get cookies from caller
    checkCookies();
    // set toggle listeners
    setTogglers();
    // check media
    fitMedia();
};

// call on resize
const mql = window.matchMedia("(max-width: 600px)");
mql.onchange = (e) => {
    if (e.matches){
        collapseSideView();
    } else {
        expandSideView();
    }
}

function checkCookies(){
    var originInfo = getCookie("originInfo");
    console.log("originInfo: ", originInfo);
}

function setTogglers(){
    var togglers = document.getElementsByClassName("content-toggler");
    for (var toggler of togglers) {
        togglerOpen(toggler);
        toggler.onclick = (event) => {togglerToggle(event.target)}
    }
}

function collapseSideView(){
    console.log("collapsing");
    var togglers = document.getElementsByClassName("content-toggler");
    for (var toggler of togglers){
        togglerClose(toggler);
    }
}

function expandSideView(){
    console.log("expanding");
    var togglers = document.getElementsByClassName("content-toggler");
    for (var toggler of togglers){
        togglerOpen(toggler);
    }
}

function togglerClose(toggler){
    var target_id = toggler.getAttribute("data-target");
    var content = document.getElementById(target_id);
    content.style.display = "none";
    toggler.innerText = "▽";
}

function togglerOpen(toggler){
    var target_id = toggler.getAttribute("data-target");
    var content = document.getElementById(target_id);
    content.style.display = "block";
    toggler.innerText = "△";
}

function togglerToggle(toggler){
    var target_id = toggler.getAttribute("data-target");
    var content = document.getElementById(target_id);
    if (content.style.display == "none"){
        togglerOpen(toggler);
    } else {
        togglerClose(toggler);
    }
}

function fitMedia(){
    if (window.innerWidth < 600){
        collapseSideView();
    }
}