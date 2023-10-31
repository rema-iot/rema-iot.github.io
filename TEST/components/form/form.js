const API = {
    service1: "https://script.google.com/macros/s/AKfycbwlGrMrgUQtJfGKb832RbXqDjQQ3r9OvSy3UI4ycc6k0tBg9WmOg5GsGYR2a2WTu78u/exec",
    service2: "https://script.google.com/macros/s/AKfycbwlGrMrgUQtJfGKb832RbXqDjQQ3r9OvSy3UI4ycc6k0tBg9WmOg5GsGYR2a2WTu78u/exec"
}

async function formPoster(event, resolve, reject) {
    event.preventDefault();
    var button = event.target;
    var form = button.parentElement;
    var children = form.children;
    console.log("children: ", children);

    var action = form.getAttribute("data-action");
    var apiName = form.getAttribute("data-api");

    var data = { action: action };
    for (child of children) {
        data[child.name] = child.value;
    }
    post(data).then( resolve, reject);

    return;
}

function post(data) {
    var promise = new Promise(function (myResolve, myReject) {
        let x = 0;
        if (x == 0) {
            sleep(3000);
            myResolve("OK");
        } else {
            myReject("Error");
        }
    });
    return promise;
}

function onResolve(result) {
    console.log(result);
}

function onReject(result) {
    console.log(result);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}