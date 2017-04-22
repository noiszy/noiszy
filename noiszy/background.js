// track in GA when this page is created
// it's persistent, so it will only happne once

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-96120302-2', 'auto');
ga('set', 'checkProtocolTask', function(){}); // Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200
ga('set', 'forceSSL', true);
// suppress pageview.  We're only tracking options views & plugin clicks.
//ga('send', 'pageview');


function track_clicked_link(link) {
    console.log('tracking this link:\n',link);
    ga('send','pageview',link);
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
    
    var sites_default = result.sites.default;
    for (var i=0; i < sites_default.length; i++) {
      if (sites_default[i].checked) {
        if (sites_default[i].url.indexOf("https://") == -1) {
          sites_default[i].url = "http://"+sites_default[i].url;
        }
        sites.push(sites_default[i].url);
      }
    }
    var offset = sites_default.length;
    var sites_user = result.sites.user;
    for (var i=0; i < sites_user.length; i++) {
      if (sites_user[i].checked) {
        if (sites_user[i].url.indexOf("https://") == -1) {
          sites_user[i].url = "http://"+sites_user[i].url;
        }
        sites.push(sites_user[i].url);
      }
    }
    
    callback(sites);
  });
}

function open_new_site() {
  
  get_enabled_sites(function(result) {

    var sites = result;

    console.log("in open_new_site - sites",sites);

    
    var num = getRandomIntInclusive(0,sites.length-1);
    console.log(num);
    
    //prepend http if it doesn't already exist
    var new_url = sites[num];

    chrome.storage.local.get('tabId', function (resultTabId) {

      chrome.tabs.update(resultTabId.tabId, {url: new_url}, function() {
        // in case we want to put anything here...
      });
      chrome.storage.local.set({activeSite: new_url}, function() {
        // in case we want to put anything here...
      });

      // GA tracking
      ga('send','pageview',new_url);

    });
  });
}


chrome.alarms.onAlarm.addListener(function(alarm) {
  
  console.log("alarm.name", alarm.name);
  
  chrome.storage.local.get('enabled', function(result){
    var enabled = result.enabled;
//    console.log("enabled", enabled);

    if (enabled == "Enabled" || enabled == "Running") {
    
      chrome.storage.local.get({
        'tabId': [],
        'blockStreams': []
      }, function (result) {
        
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
              //click a link on the page, using a content script
//              console.log("inside linkClick");
              chrome.tabs.sendMessage(result.tabId, {
                text: 'click link',
                blockStreams: result.blockStreams
              }, function(response) {
//                console.log("in alarm tabs.sendMessage callback, response:",response);
                
                if (response == "linkclick failed") {
                  // just open a new site instead
                  open_new_site();
                  
                } else {
                  // track the link
                  console.log('tracking this link:',response);
                  ga('send','pageview',response);
                }
              });

              console.log("sent clicked_link");
            }

            // set the next alarm
            // randomize which type it should be
            // the '4' should be controlled in a setting, but use this for now

            // create alarm so link will be clicked
            chrome.storage.local.get('baseInterval', function(result){
              // mult x random 2x, so results skew closer to baseInterval
              var interval = result.baseInterval + (Math.random() * Math.random() * result.baseInterval);
              
              var rand = getRandomIntInclusive(0,4);
//              console.log("rand alarm int: ", rand);
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

  if (request.msg == "start") {
    // start visiting sites
    
    // first confirm that there are enabled sites
    get_enabled_sites(function(result) {

      if (result && result.length > 0) {

        //get current tab
        chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
          // since only one tab should be active and in the current window at once
          // the return variable should only have one entry
          var activeTab = arrayOfTabs[0];
          var activeTabId = activeTab.id; // or do whatever you need
//          console.log("arrayOfTabs[0]",arrayOfTabs[0]);
//          console.log("storing tab id: " + arrayOfTabs[0].id);
          // store the tab id
          chrome.storage.local.set({tabId: arrayOfTabs[0].id}, function() {});

          // open new site
          open_new_site();
          sendResponse({farewell: "open_new_site called"});
        });

        // create first alarm - should always be a linkClick

        chrome.storage.local.get('baseInterval', function(result){
          // mult x random 2x, so results skew lower
          var interval = result.baseInterval + (Math.random() * Math.random() * result.baseInterval);
          chrome.alarms.create("linkClick",{delayInMinutes: interval});
        });
      } else { //no enabled sites
        // send a response; options page will show an alert
        console.log("no enabled sites");
        sendResponse({farewell: "no enabled sites"});
      }
    });

  } else if (request.msg == "track add site") {
    console.log("request", request);
    ga('send','event','add site',request.added);
  } else if (request.msg == "track options open") {
    console.log("request", request);
    ga('send','pageview','options.html');
  } else if (request.msg == "track link click") {
    ga('send','pageview',request.url);
  } else if (request.msg == "reset") {
    initialize_noiszy(false, function(results){
      sendResponse(results);
    });
  }
  // we're done
  return true;
});


function initialize_noiszy(preserve_preferences, callbackFunction) {
  console.log("initializing");
  console.log("presets",presets);
  console.log("preserve_preferences",preserve_preferences);

  // in dev mode, load links more quickly
  var base_interval = isDevMode() ? 0.2 : 1;
  var block_streams = presets.blockStreams;
  var user_site_preset = presets.userSitePreset;
      
  // load settings from local storage into a different variable
  chrome.storage.local.get({
    sites: 'stored_sites',
    blockStreams: [],
    userSitePreset: []
  }, function(result) {

    // copy default from presets into local storage
    // have to do this, or else we wind up updating presets.sites via reference
    var new_sites = JSON.parse(JSON.stringify(presets.sites));
//    console.log("presets sites",new_sites);

    if (preserve_preferences) { //if true
      console.log("preserving preferences");

      // default sites first
      try {
        if (result.sites.default) { 
          var stored_sites = result.sites.default;
          //cycle through
          for (var i=0; i<stored_sites.length; i++) {
            for (var j=0; j<sites.default.length; j++) {

              //this should be the other way around.  stored URLs may be longer.
//              if (new_sites.default[j].url.indexOf(stored_sites[i].url) > -1) {
              if (stored_sites[i].url.indexOf(new_sites.default[j].url) > -1) {
                //then update new_sites[j] with checked value from sites[i]
                new_sites.default[j].checked = stored_sites[i].checked;
              }
            }
          }
        }
      } catch(e) {}

      // user sites too
      try {
        if (result.sites.user) { 
          // then just copy result.sites.user over to sites.user

//          new_sites.user = result.sites.user;
          new_sites.user = JSON.parse(JSON.stringify(result.sites.user));
          console.log("copied user sites");
          console.log("sites",sites);
        }
      } catch(e) {}
      
      //and block streams
      block_streams = result.blockStreams;
    }

    // now sites has current values
    // set values in local storage
//    console.log("base_interval", base_interval);
//    console.log("new_sites", new_sites);
//    console.log("block_streams", block_streams);
    
    //now finally, set values.
    chrome.storage.local.set({
      enabled: "Waiting",
      baseInterval: base_interval,
      blockStreams: block_streams,
      userSitePreset: user_site_preset,
      sites: new_sites
    }, function (result) {
      //check to make sure it worked
      chrome.storage.local.get({
        'sites': [],
        'enabled': [],
        'baseInterval': [],
        'blockStreams': [],
        'userSitePreset': []
      }, function (result) {
        console.log("result", result);
//        console.log("result.enabled", result.enabled);
//        console.log("result.sites", result.sites);
//        console.log("result.blockStreams", result.blockStreams);
//        console.log("result.userSitePreset", result.userSitePreset);

        callbackFunction(result);
      });
    });
  });
}

initialize_noiszy(true, function(){});