export function setCookie(cname, cvalue, ctime, time_unit) {
    const d = new Date();
    switch (time_unit) {
        case 'd': // cookie duration in days to ms
            d.setTime(d.getTime() + ctime * 24 * 60 * 60 * 1000);
            break;
        case 'h': // cookie duration in hours to ms
            d.setTime(d.getTime() + ctime * 60 * 60 * 1000);
            break;
        case 'm': // cookie duration in minutes to ms
            d.setTime(d.getTime() + ctime * 60 * 1000);
            break;
        default:
            console.log("undefined expiration cookie option");
            return;
    }
    let cstring = cname + "=" + cvalue + ";expires=" +
                  d.toUTCString() + ";path=/";
    document.cookie = cstring;
}

export function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}