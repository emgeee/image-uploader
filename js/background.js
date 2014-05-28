
var services = [];
var appId = 'XCZD_i_hP9q0VH8haeM7UnEjhUihNj_Z6bFefaEdXsENUWjv';
var baseUrl = 'https://api.kloudless.com/v0';

function openOptionsPage(){
  var optionsUrl = chrome.extension.getURL('options.html');

  chrome.tabs.query({url: optionsUrl}, function(tabs) {
    if (tabs.length) {
      chrome.tabs.update(tabs[0].id, {active: true});
    } else {
      chrome.tabs.create({url: optionsUrl});
    }
  });
}

/**
 * Click handler to upload selected image
 */
function getClickHandler() {
  return function (info, tab) {

    if(services.length === 0) openOptionsPage();

    var url = info.srcUrl;
    var fileName = url.replace(/^.*[\\\/]/, '');

    var getImg = new XMLHttpRequest();
    getImg.open("GET", url, true);
    getImg.responseType = "blob";

    getImg.onload = function (oEvent) {
      var blob = getImg.response;

        console.log(services);
      _.each(services, function(service){

        if(!service.enabled) return;
        console.log("uploaded")
        var fd = new FormData();
        fd.append('metadata', JSON.stringify({
          'name': fileName,
          'parent_id': service.folder_id
        }));
        fd.append('file', blob);

        var sendImg = new XMLHttpRequest();
        sendImg.open('POST',  baseUrl + '/accounts/' + service.id + '/files/?overwrite=true');
        sendImg.setRequestHeader('Authorization', 'AccountKey ' + service.apiKey);

        sendImg.onload = function(res) {
          console.log(fileName + " saved to " + service.name);
        };

        sendImg.onError = function(res) {
          console.log(fileName + " could not be uploaded to " + service.name);
        };

        sendImg.send(fd);

      });

    };

    getImg.send();
  };
};


/**
 * Create a context menu which will only show up for images.
 */
chrome.contextMenus.create({
  "title": "Save to Cloud",
  "type": "normal",
  "contexts": ["image"],
  "onclick": getClickHandler()
});


/**
 * Load user from local storage
 */
chrome.storage.local.get('services', function (res) {
  if (res.services) {
    console.log('Loading... ', res.services);
    services = res.services;
  } else { console.log("No user..."); }
});


/**
 * Watch for changes from the config page
 */
chrome.storage.onChanged.addListener(function(changes, namespace) {
    console.log(changes);

    if(changes.services){
      services = changes.services.newValue;
      console.log(services)
    }
});


/**
 * Open options page
 */
chrome.runtime.onInstalled.addListener(function(details){
    if(details.reason == "install"){
      openOptionsPage();
    }else if(details.reason == "update"){
      var thisVersion = chrome.runtime.getManifest().version;
    }
});
