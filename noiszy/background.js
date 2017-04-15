var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-96120302-2']);
// suppress pageview.  We're only tracking options views & plugin clicks.
//_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();



// A function to use as callback
function track_clicked_link(link) {
    console.log('tracking this link:\n' + link);
    _gaq.push(['_trackPageview',link]);
}


function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


function open_new_site() {
  
  chrome.storage.local.get({
    sites: []
  }, function (result) {
    // the input argument is ALWAYS an object containing the queried keys
    // so we select the key we need
    var sites_default = result.sites.default;

    // build array of sites
    var sites = [];
    for (var i=0; i < sites_default.length; i++) {
      if (sites_default[i].checked) {
        sites[i] = sites_default[i].url;
      }
    }

    console.log("sites");
    console.log(sites);

    var num = getRandomIntInclusive(0,sites.length-1);
    console.log(num);

    chrome.storage.local.get('tabId', function (resultTabId) {

      chrome.tabs.update(resultTabId.tabId, {url: sites[num]}, function() {
        // in case we want to put anything here...
      });
      chrome.storage.local.set({activeSite: sites[num]}, function() {
        // in case we want to put anything here...
      });

      // GA tracking
       _gaq.push(['_trackPageview', sites[num]]);

    });
  });
}


// Called when the user clicks on the browser action.
// currently overridden by the popup
chrome.browserAction.onClicked.addListener(function(tab) {

/*  var sites = settings.sites;
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
*/
});


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

            var rand = getRandomIntInclusive(0,4);
            console.log("rand alarm int: ", rand);
            if (rand == 0) { // 1/4 of the time
              chrome.alarms.create("newSite",{delayInMinutes: 0.3});
            } else {
              chrome.alarms.create("linkClick",{delayInMinutes: 0.3});
            }
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
    });

    // create alarm so link will be clicked
    chrome.alarms.create("linkClick",{delayInMinutes: 0.3});
    sendResponse({farewell: "open_new_site called"});

  } else if (request.msg == "reset") {
    initialize_noiszy(function(){});
    sendResponse({farewell: "reset called"});
  }
  // we're done
});


function initialize_noiszy(callbackFunction) {
  console.log("initializing");
  console.log("settings",settings);
    
  // copy default from settings into local storage
  var sites = settings.sites;
  console.log("settings sites",sites);
  
  // when upgrading, we should check for existing values in storage
  // but make that optional
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

  
//  chrome.storage.local.set({sites: sites}, function () {
  chrome.storage.local.set({
    sites: sites
  }, function () {
      chrome.storage.local.get('sites', function (result) {
          console.log(result.sites)
      });
  });
  chrome.storage.local.set({enabled: "Waiting"}, function () {
      chrome.storage.local.get('enabled', function (result) {
          console.log(result.enabled)
      });
  });

  callbackFunction();
}

initialize_noiszy(function(){});