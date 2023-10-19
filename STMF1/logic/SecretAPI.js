var secret;
createModule().then(({
    Secret
}) => {
    // save ref to object
    secret = new Secret();
});

function unlockSecret(){
    var usr = document.getElementById("in_usr").value;
    var psw = document.getElementById("in_psw").value;
    var status = secret.unlock(usr, psw);
    console.log("unlock status: ", status);
    console.log("secretIDs: ", secret.getIDs());
}

function getSecrets(){
    var data1 = secret.getData("secret1");
    var data2 = secret.getData("secret2");
    var data3 = secret.getData("secret3");
    console.log("data1: ", data1);
    console.log("data2: ", data2);
    console.log("data3: ", data3);
}

document.getElementById("btn_login").onclick = unlockSecret;
document.getElementById("btn_getSecret1").onclick = getSecrets;