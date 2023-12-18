import {getCookie} from "../../JSTK/cookies.js"

export var RINC_API = "https://script.google.com/macros/s/AKfycbwZqDsNgYgE3ttxmnJI7bI4kOE6YuTIO_Y-2qInw0tV52vG48X_a63REAU-LDFAeuTw/exec";
export var SESSION = { userName: undefined, sessionType: undefined, sessionId: undefined, sessionCk: undefined, sessionEnd: undefined };

export function loadSession(){
    SESSION.userName = getCookie("userName");
    SESSION.sessionType = getCookie("sessionType");
    SESSION.sessionId = getCookie("sessionId");
    SESSION.sessionCk = getCookie("sessionCk");
    SESSION.sessionEnd = getCookie("sessionEnd");
    console.log("SESSION: " + JSON.stringify(SESSION));
}