function uncheck(event, duration) {
    var elem = event.target;
    setTimeout((elem) => {
        elem.checked = false;
    }, duration, elem);
}

function uncheck2(elem) {
    elem.checked = false;
}

function process(event) {
    delay(3000).then(
        (value) => { 
            uncheck2(event.target)
            document.getElementById("label").style.color = "black";
        },
        (error) => {
            uncheck2(event.target);
            document.getElementById("label").style.color = "red";
        }
    );
}

function delay(ms) {
    var err = document.getElementById("errCtl").checked;
    const promise = new Promise((resolve, reject) => {
        setTimeout(() => {
            if (!err) { resolve("OK"); }
            else { reject("ERR") };
        }, ms);
    });
    return promise;
}