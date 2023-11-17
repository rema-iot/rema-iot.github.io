import {setCookie, getCookie} from "../../../logic/cookies.js"

window.onload = function() {
    console.log("loaded dashboard");
    checkCookies();
};

function checkCookies(){
    var originInfo = getCookie("originInfo");
    console.log("originInfo: ", originInfo);
}