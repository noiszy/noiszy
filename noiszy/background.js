var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-96120302-2']);
// suppress pageview.  We're only tracking options views & plugin clicks.
//_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();



function track_clicked_link(link) {
    console.log('tracking this link:\n' + link);
    _gaq.push(['_trackPageview',link]);
}


function isDevMode() {
    return !('update_url' in chrome.runtime.getManifest());
}


function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function get_enabled_sites(callback) {
  chrome.storage.local.get({
    sites: []
  }, function (result) {

    // build array of sites
    var sites = [];
    
    // should do this in a loop instead - fix this
/*    for (var j=0; j<result.sites.length; j++) {
      console.log("j",j,result.sites[j]);
      var sites_default = result.sites[j];
      for (var i=0; i < sites_default.length; i++) {
        if (sites_default[i].checked) {
          sites.push(sites_default[i].url);
        }
      }
    }
*/      
    var sites_default = result.sites.default;
    for (var i=0; i < sites_default.length; i++) {
      if (sites_default[i].checked) {
//        sites[i] = sites_default[i].url;
        sites.push(sites_default[i].url);
      }
    }
    var offset = sites_default.length;
    var sites_user = result.sites.user;
    for (var i=0; i < sites_user.length; i++) {
      if (sites_user[i].checked) {
//        sites[i+offset] = sites_user[i].url;
        sites.push(sites_user[i].url);
      }
    }
    
    callback(sites);
  });
//  return false;
}

function open_new_site() {
  
  get_enabled_sites(function(result) {
  
/*  chrome.storage.local.get({
    sites: []
  }, function (result) {

    // build array of sites
    var sites = [];
    
    console.log("result",result);
    console.log("result.sites",result.sites);
    console.log("result.sites.length",result.sites.length);
    
    var sites_default = result.sites.default;
    for (var i=0; i < sites_default.length; i++) {
      if (sites_default[i].checked) {
//        sites[i] = sites_default[i].url;
        sites.push(sites_default[i].url);
      }
    }
    var offset = sites_default.length;
    var sites_user = result.sites.user;
    for (var i=0; i < sites_user.length; i++) {
      if (sites_user[i].checked) {
//        sites[i+offset] = sites_user[i].url;
        sites.push(sites_user[i].url);
      }
    }

*/
    var sites = result;

    console.log("in open_new_site - sites",sites);

    
    var num = getRandomIntInclusive(0,sites.length-1);
    console.log(num);
    
    //prepend http if it doesn't already exist
    var new_url = sites[num];
    if (!/^https?\:\/\//i.test(sites[num])) {
      new_url = "http://" + sites[num];
    }

    chrome.storage.local.get('tabId', function (resultTabId) {

//      chrome.tabs.update(resultTabId.tabId, {url: sites[num]}, function() {
      chrome.tabs.update(resultTabId.tabId, {url: new_url}, function() {
        // in case we want to put anything here...
      });
//      chrome.storage.local.set({activeSite: sites[num]}, function() {
      chrome.storage.local.set({activeSite: new_url}, function() {
        // in case we want to put anything here...
      });

      // GA tracking
//       _gaq.push(['_trackPageview', sites[num]]);
       _gaq.push(['_trackPageview', new_url]);

    });
  });
}


// Called when the user clicks on the browser action.
// currently overridden by the popup
/*chrome.browserAction.onClicked.addListener(function(tab) {

  var sites = settings.sites;
  console.log("sites",sites);
  
  chrome.storage.local.set({sites: sites}, function () {
      // you can use strings instead of objects
      // if you don't  want to define default values
      chrome.storage.local.get('sites', function (result) {
          console.log(result.sites)
      });
  });
  chrome.storage.local.set({enabled: "Enabled"}, function () {
      // you can use strings instead of objects
      // if you don't  want to define default values
      chrome.storage.local.get('enabled', function (result) {
          console.log(result.enabled)
      });
  });

});
*/


chrome.alarms.onAlarm.addListener(function(alarm) {
  
  console.log("alarm.name", alarm.name);
  
  chrome.storage.local.get('enabled', function(result){
    var enabled = result.enabled;
    console.log("enabled", enabled);

    if (enabled == "Enabled" || enabled == "Running") {
    
      chrome.storage.local.get('tabId', function (result) {
        
        console.log(result.tabId);
        
        //get the tab, to be sure it exists
        chrome.tabs.get(result.tabId, function (tab) {
          console.log("tab",tab);
          
          if (chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
          } else {
      
            if (alarm.name == "newSite") {
              //open a new site;
              open_new_site();
              
            } else if (alarm.name == "linkClick") {
              //update the format here
              
              console.log("inside linkClick");
              chrome.tabs.sendMessage(result.tabId, {text: 'clicked_link'}, track_clicked_link);
              console.log("sent clicked_link");
            }

            // set a new alarm
            // randomize which type it should be
            // the '4' should be controlled in a setting, but use this for now
            // should also randomize the amount of time between pvs eventually

            // create alarm so link will be clicked
            chrome.storage.local.get('baseInterval', function(result){
              // mult x random 2x, so results skew lower
              var interval = result.baseInterval + (Math.random() * Math.random() * result.baseInterval);
              
              var rand = getRandomIntInclusive(0,4);
              console.log("rand alarm int: ", rand);
              if (rand == 0) { // 1/4 of the time
                chrome.alarms.create("newSite",{delayInMinutes: interval});
              } else {
                chrome.alarms.create("linkClick",{delayInMinutes: interval});
              }
            });

          }
        });
      });
    }
    console.log("alarm completed");
  });

});



chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
    
  console.log("message: ", request.msg);

//    if (request.msg == "init") {
//      console.log("initializing");
//    } else if (request.msg == "start") {
  if (request.msg == "start") {
    console.log("starting!");
    
//    var r = "";
    
    //first confirm that there are enabled sites
    get_enabled_sites(function(result) {
      if (result && result.length > 0) {
        //get current tab
        chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
          // since only one tab should be active and in the current window at once
          // the return variable should only have one entry
          var activeTab = arrayOfTabs[0];
          var activeTabId = activeTab.id; // or do whatever you need
          console.log("arrayOfTabs[0]",arrayOfTabs[0]);
          console.log("storing tab id: " + arrayOfTabs[0].id);
          // store the tab id
          chrome.storage.local.set({tabId: arrayOfTabs[0].id}, function() {});
          console.log("stored");

          // open new site
          open_new_site();
//          r = "open_new_site called";
          sendResponse({farewell: "open_new_site called"});
        });

        // create alarm so link will be clicked
        chrome.storage.local.get('baseInterval', function(result){
          // mult x random 2x, so results skew lower
          var interval = result.baseInterval + (Math.random() * Math.random() * result.baseInterval);
          chrome.alarms.create("linkClick",{delayInMinutes: interval});
//          sendResponse({farewell: "open_new_site called"});
        });
      } else { //no enabled sites
        //for now...
        console.log("no enabled sites");
//        r = "no enabled sites";
        sendResponse({farewell: "no enabled sites"});
      }
    });

  } else if (request.msg == "reset") {
    initialize_noiszy(function(){});
//    r = "reset called";
    sendResponse({farewell: "reset called"});
  }
  // we're done
//  sendResponse({farewell: r});
  return true;
});


function initialize_noiszy(callbackFunction) {
  console.log("initializing");
  console.log("settings",settings);
    
  // copy default from settings into local storage
  var sites = settings.sites;
  console.log("settings sites",sites);
  
  // when upgrading, we should check for existing values in storage...
/*  chrome.storage.local.get({
    enabled: 'Ready',
    sites: 'sites'
  }, function(items) {    
    console.log("enabled: ",items.enabled);
    console.log("sites: ",items.sites);
//    var storage_sites = items.sites;
    sites = items.sites;
  });
*/

  // in dev mode, load links more quickly
  var base_interval = isDevMode() ? 0.2 : 1;
  
//  chrome.storage.local.set({sites: sites}, function () {
  chrome.storage.local.set({
    enabled: "Waiting",
    baseInterval: base_interval,
    sites: sites
  }, function () {
      chrome.storage.local.get('sites', function (result) {
          console.log(result.enabled)
          console.log(result.sites)
      });
  });
/*  chrome.storage.local.set({enabled: "Waiting"}, function () {
      chrome.storage.local.get('enabled', function (result) {
          console.log(result.enabled)
      });
  });
*/

  callbackFunction();
}

initialize_noiszy(function(){});