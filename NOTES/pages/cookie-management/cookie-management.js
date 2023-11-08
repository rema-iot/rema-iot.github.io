import { setCookie, getCookie} from "../../logic/cookies.js";

export function onLoad(){
    let btn_create = document.getElementById("btn-create-cookie").onclick = exSetCookie;
    let btn_load = document.getElementById("btn-read-cookie").onclick = exGetCookie;
}

function exSetCookie() {
    let cname = document.getElementById("cname").value;
    let cvalue = document.getElementById("cvalue").value;
    setCookie(cname, cvalue, 1, 'h');
}

function exGetCookie() {
    let cname = document.getElementById("cname-get").value;
    let elem = document.getElementById("cvalue-get");
    elem.value = getCookie(cname);
}