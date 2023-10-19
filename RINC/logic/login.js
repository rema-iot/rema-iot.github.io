import { post } from "./post.js";
import { getCookie, setCookie } from "./cookieUtil.js";
import { overlayOn, overlayOff } from "./main.js";

export var RINC_API =
"https://script.google.com/macros/s/AKfycbwlGrMrgUQtJfGKb832RbXqDjQQ3r9OvSy3UI4ycc6k0tBg9WmOg5GsGYR2a2WTu78u/exec";

export var SESSION = { userName: undefined, sessionType: undefined, sessionId: undefined, sessionCk: undefined, sessionEnd: undefined };
// check if session is active
export function checkSession(){
    loadSession();
    if (SESSION.sessionEnd){
        console.log("sessionEnd: ", SESSION.sessionEnd);
        var now = Date.now() / 1000;
        console.log("now: ", now);
        if (now < SESSION.sessionEnd){
            activeSessionInterface();
            return true;
        } else {
            inactiveSessionInterface();
            return false;
        }
    } else {
        inactiveSessionInterface();
        return false;
    }
}

export function onLoadScript() {
    // add navigation listeners
    var toggleList = document.getElementsByClassName("toggle");
    var togglerList = document.getElementsByClassName("toggler");
    for (var i = 0; i < togglerList.length; i++) {
        togglerList[i].addEventListener("click", event => {
            const toggleElemId = event.target.getAttribute("data-toggle");
            toggleContent(toggleList, toggleElemId);
        });
    }
    // add password view togglers
    var pswTogglerList = document.getElementsByClassName("pswToggler");
    for (var i = 0; i < pswTogglerList.length; i++) {
        pswTogglerList[i].addEventListener("click", event => {
            const pswId = event.target.getAttribute("data-pswId");
            togglePassword(pswId)
        });
    }
    // login listener
    $("#formLogin").submit(loginListener);
    // other listeners
    document.getElementById("btnLogOut").addEventListener("click", logoutListener);

    // check if session exists
    if(checkSession()){
        console.log("found active session");
    } else {
        console.log("no active session found");
    }
    // station loader listener
    document.getElementById("btnLoadStationList").addEventListener("click", requestStationList);
}

function loginListener(event) {
    console.log("sending data to server");
    event.preventDefault();
    var data = {
        rqst: "login",
        email: $("#loginEmail").val(),
        psw: $("#loginPsw").val(),
    };
    // erase password before sending form
    $("#loginPsw").val("");
    overlayOn("Validando usuario...");
    post(RINC_API, data, loginCbk);
}

function loginCbk(resp) {
    overlayOff();
    if (resp.status == "OK") {
        console.log("creating session");
        createSession(resp.userName, resp.sessionId, resp.sessionCk, resp.sessionEnd, resp.sessionType);
        // activate session loader
        activeSessionInterface();
    } else if (resp.status == "FAILED") {
        destroySession();
        inactiveSessionInterface();
        alert("Senha inválida")
        console.log("loginCbk: failed");
        console.log(resp.msg);
    } else {
        console.log("undefined behavior");
    }
}

function logoutListener(){
    console.log("closing session");
    destroySession();
    inactiveSessionInterface();
}

// set session and cookies
function createSession(userName, sessionId, sessionCk, sessionEnd, sessionType) {
    SESSION.userName = userName;
    SESSION.sessionType = sessionType;
    SESSION.sessionId = sessionId;
    SESSION.sessionCk = sessionCk;
    SESSION.sessionEnd = sessionEnd;
    setCookie("userName", userName, sessionEnd, "expiration_s");
    setCookie("sessionType", sessionType, sessionEnd, "expiration_s");
    setCookie("sessionId", sessionId, sessionEnd, "expiration_s");
    setCookie("sessionCk", sessionCk, sessionEnd, "expiration_s");
    setCookie("sessionEnd", sessionEnd, sessionEnd, "expiration_s");
}

// remove session and cookies
function destroySession() {
    SESSION.userName = undefined;
    SESSION.sessionType = undefined;
    SESSION.sessionId = undefined;
    SESSION.sessionCk = undefined;
    SESSION.sessionEnd = undefined;
    setCookie("userName", "", 0, "duration_h");
    setCookie("sessionType", "", 0, "duration_h");
    setCookie("sessionId", "", 0, "duration_h");
    setCookie("sessionCk", "", 0, "duration_h");
    setCookie("sessionEnd", "", 0, "duration_h");
}

// load session and cookies
function loadSession() {
    var userName = getCookie("userName");
    var sessionType = getCookie("sessionType");
    var sessionId = getCookie("sessionId");
    var sessionCk = getCookie("sessionCk");
    var sessionEnd = getCookie("sessionEnd");
    SESSION.userName = userName;
    SESSION.sessionType = sessionType;
    SESSION.sessionId = sessionId;
    SESSION.sessionCk = sessionCk;
    SESSION.sessionEnd = sessionEnd;
    console.log("loaded session: ", SESSION);
}

// set active session interface
function activeSessionInterface(){
    $("#loaderSession").text(SESSION.userName);
    $("#loaderSession").css("display", "block");
    // define propper interface for type of user.
    switch(SESSION.sessionType){
        case "view":
            $("#loaderSession").attr("data-path", "pages/viewer.html");
            $("#loaderSession").attr("data-script", "./viewer.js");
            break;
        case "super":
            $("#loaderSession").attr("data-path", "pages/super.html");
            $("#loaderSession").attr("data-script", "./super.js");
            break;
        default:
            console.log("Unknown session type: " + SESSION.sessionType);
    }
    // set toggle to logout
    toggleToElement("secLogout");
}

// set active session interface
function inactiveSessionInterface(){
    $("#loaderSession").text("");
    $("#loaderActivity").css("display", "none");
    
    // set toggle to logout
    toggleToElement("secLogin");
}

function toggleContent(toggleList, contentElemId) {
    for (var i = 0; i < toggleList.length; i++) {
        if (toggleList[i].id === contentElemId) {
            toggleList[i].style.display = "block";
        } else {
            toggleList[i].style.display = "none";
        }
    }
}

function toggleToElement(contentElemId) {
    var toggleList = document.getElementsByClassName("toggle");
    for (var i = 0; i < toggleList.length; i++) {
        if (toggleList[i].id === contentElemId) {
            toggleList[i].style.display = "block";
        } else {
            toggleList[i].style.display = "none";
        }
    }
}

function togglePassword(pswId) {
    var obj = document.getElementById(pswId);
    if (obj.type === "password") {
        obj.type = "text";
    } else {
        obj.type = "password";
    }
}
