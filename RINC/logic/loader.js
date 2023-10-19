export async function loadHtml(address, targetID) {
  const response = await fetch(address);
  const html = await response.text();
  $(targetID).html(html);
  console.log("loaded: ", address);
}

export async function loadJS(address, async = true) {
  import(address).then((module) => {
    module.onLoadScript();
  }).catch((err) => {
    console.error(err);
  });
}
