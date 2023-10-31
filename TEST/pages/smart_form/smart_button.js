// div with info image and action button

var containerState = {
    cancelled: false,
    imgInfo: "info.jpg",
    info: "some_text",
    btnAction: "processData"
}

function onMainAction(){
    cancelled = false;
    changeIcon("img_info", "loading.jpg");
    changeBtn("btn_action", cancelProcess, "Cancel");
}

function onCancel(){
    cancelled = true;
    changeIcon("img_info", "stop.jpg");
    changeBtn("btn_action", processData, "Process");
}

function processData(event) {
    onMainAction();    
    slowProcess().then(
        (value) => {
            if (cancelled) {
                // don't follow chain
            } else {
                event.target.innerHTML = "Process";
                changeIcon("img_info", "success.png");
                changeBtn("btn_action", postProcess, "postProcess");
            }
        },
        (error) => {
            event.target.innerHTML = "Process";
            changeIcon("img_info", "error.jpg");
            changeBtn("btn_action", processData, "Process");
        }
    )
}

function cancelProcess(event) {
   
    console.log("canceling: ", event);
}

function postProcess() {
    cancelled = false;
    reset();
}

function reset() {
    changeIcon("img_info", "info.jpg");
    changeBtn("btn_action", processData, "Process");
}

function slowProcess() {
    var err = false;
    var ms = 3000;
    var promise = new Promise((resolve, reject) => {
        setTimeout(() => {
            if (!err) { resolve("OK"); }
            else { reject("ERR") };
        }, ms);
    });
    return promise;
}

function changeIcon(id, path) {
    document.getElementById(id).src = path;
    document.getElementById(id).srcset = path;
}

function changeBtn(id, callback, text) {
    var btn = document.getElementById(id);
    btn.onclick = callback;
    btn.innerHTML = text;
}