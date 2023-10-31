var stateCurrent;
var controller;

var stateBegin = {
    icon: "img/info.png",
    btnText: "Process",
    btnAction: processData,
    info: "Provide information"
};

var stateProcessing = {
    icon: "img/flipper.gif",
    btnText: "Cancel",
    btnAction: processCancel,
    info: "Processing data"
};

var stateCanceled = {
    icon: "img/stop.png",
    btnText: "Reset",
    btnAction: resetForm,
    info: "Canceled by user"
};

var stateSuccess = {
    icon: "img/success.png",
    btnText: "Reset",
    btnAction: resetForm,
    info: "Success!"
};

var stateFailed = {
    icon: "img/error.png",
    btnText: "Reset",
    btnAction: resetForm,
    info: "Procedure Failed!"
};

function stateRender(state) {
    stateCurrent = state;
    var img = document.getElementById("img_info");
    var info = document.getElementById("txt_info");
    var btn = document.getElementById("btn_action");
    img.src = state.icon;
    btn.innerHTML = state.btnText;
    btn.onclick = state.btnAction;
    info.innerHTML = state.info;
}

function processData() {
    stateRender(stateProcessing);
    console.log("processing");
    controller = new AbortController();
    signal = controller.signal;
    slowProcess({ signal }).then(
        (value) => { stateRender(stateSuccess) },
        (error) => {
            if (error.name === 'AbortError') {
                console.log('Promise Aborted');
                stateRender(stateCanceled)
            } else {
                stateRender(stateFailed);
            }
        }
    )
}

function processCancel() {
    console.log("canceling");
    controller.abort();
    stateRender(stateCanceled);
}

function resetForm() {
    console.log("reseting");
    stateRender(stateBegin);
}

function slowProcess({ signal }) {
    // check if process is aborted
    if (signal.aborted) {
        return Promise.reject(new DOMException('Aborted', 'AbortError'));
    }

    var err;
    var err_check = document.getElementById("server_error");
    if (err_check.checked) err = true;
    else err = false;

    var ms = 3000;

    var promise = new Promise((resolve, reject) => {
        const timeout = window.setTimeout(() => {
            if (!err) { resolve("OK"); }
            else { reject("ERR") };
        }, ms);
        signal.addEventListener('abort', () => {
            window.clearTimeout(timeout);
            reject(new DOMException('Aborted', 'AbortError'));
        });
    });
    return promise;
}

function toggleView(id) {
    elem = document.getElementById(id);
    if (elem.style.display == "none") {
        elem.style.display = "block";
    } else {
        elem.style.display = "none";
    }
}

// Example Promise, which takes signal into account
function doSomethingAsync({ signal }) {
    if (signal.aborted) {
        return Promise.reject(new DOMException('Aborted', 'AbortError'));
    }

    return new Promise((resolve, reject) => {
        console.log('Promise Started');

        // Something fake async
        const timeout = window.setTimeout(resolve, 2500, 'Promise Resolved')

        // Listen for abort event on signal
        signal.addEventListener('abort', () => {
            window.clearTimeout(timeout);
            reject(new DOMException('Aborted', 'AbortError'));
        });
    });
}