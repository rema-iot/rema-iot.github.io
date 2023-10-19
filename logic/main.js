import { setCookie, getCookie } from "./cookieUtil.js";
import { loadHtml, loadJS } from "./loader.js";
import { checkSession } from "./login.js";

var contextPathHtml = "./pages/home.html";
var contextPathScript = "./home.js";

window.onload = windowSetup;

function windowSetup() {
    // check cookies
    getContex("#content");
    // check activity session
    checkSession();
    // context loaders
    $(".loader").click(
        async (event) => {
            const pathHTML = event.target.getAttribute("data-path");
            const pathJS = event.target.getAttribute("data-script");
            setContext(pathHTML, pathJS, "#content");
        }
    );

}

async function setContext(pathHTML, pathJS, targetID) {
    await loadHtml(pathHTML, targetID);
    await loadJS(pathJS, true);

    console.log("loading: ", pathHTML);
    contextPathHtml = pathHTML;
    contextPathScript = pathJS;
    setCookie("contextPathHtml", contextPathHtml, 1, "duration_h");
    setCookie("contextPathScript", contextPathScript, 1, "duration_h");
}

async function getContex(targetID) {
    contextPathHtml = getCookie("contextPathHtml");
    contextPathScript = getCookie("contextPathScript");
    if (contextPathHtml && contextPathScript) {
        setContext(contextPathHtml, contextPathScript, targetID);
    }
}

export function overlayOn(msg) {
    $("#loadingMsg").text(msg);
    document.getElementById("overlay").style.display = "block";
}

export function overlayOff() {
    document.getElementById("loadingMsg").textContent = "";
    console.log("deactivating overlay");
    document.getElementById("overlay").style.display = "none";
}