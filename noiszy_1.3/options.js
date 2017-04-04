var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-96120302-2']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();


// Saves options to chrome.storage
function save_options() {

  // get the inputs
  var default_sites = document.getElementById("default_sites");
  var site_list = default_sites.getElementsByTagName("input");
  var sites_formatted = new Object();
  sites_formatted.default = [];
  console.log("site list: ",site_list);
  // loop through the displayed sites and make an array; then update what's saved
  for (var i=0; i < site_list.length; i++) { 
    console.log("i: ",i,site_list[i]);
    sites_formatted.default[i] = new Object();
    sites_formatted.default[i].url = site_list[i].value;
    sites_formatted.default[i].checked = site_list[i].checked;
  }
  

  chrome.storage.local.set({
    sites: sites_formatted
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Site list saved.';
    chrome.storage.local.get('sites', function (result) {
      console.log(result.sites)
      
      //also pretend we clicked "Start" so the new vals are loaded
      enable_script();
    });

    setTimeout(function() {
      status.textContent = '';
    }, 3000);
  });
  
  
}


function disable_script() {
  console.log("disabling");
  chrome.storage.local.set({enabled: "Waiting"}, function () {
    chrome.alarms.clearAll();

    console.log("disabled");
    document.getElementById('enabled_status').textContent = "Waiting";
  });
  
}

function enable_script() {
  console.log("enabled");
  chrome.storage.local.set({enabled: "Running"}, function () {
    console.log("running");
    document.getElementById('enabled_status').textContent = "Running";
  // send message to background
  //  chrome.runtime.sendMessage({msg: "enable"}, function(response) {
    chrome.runtime.sendMessage({msg: "start"}, function(response) {
//      console.log(response.farewell);
    });
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  
  console.log("restoring options from saved");
  chrome.storage.local.get({
    enabled: 'Ready',
    sites: 'sites'
  }, function(items) {
    
    console.log("enabled: ",items.enabled);
    console.log("sites: ",items.sites);
    
    // new - output site list
    var default_sites = document.getElementById("default_sites");
    var thisid, thisurl, thisinput, thislabel;
    for (var i = 0; i < items.sites.default.length; i++) { 
      thisid = "s" + i;
      thisurl = items.sites.default[i].url;
      thischecked = items.sites.default[i].checked;
      
      thisinput = document.createElement("input");
      thisinput.setAttribute("id", thisid);
      thisinput.setAttribute("type", "checkbox");
      thisinput.setAttribute("class", "site");
      if (thischecked) {
        thisinput.setAttribute("checked", "checked");
      }

      thisinput.setAttribute("value", thisurl);
      
      thislabel = document.createElement("label");
      thislabel.setAttribute("for", thisid);
      thislabel.textContent = thisurl;

      default_sites.appendChild(thisinput);
      default_sites.appendChild(thislabel);
      default_sites.appendChild(document.createElement("br"));
    }
    
//    document.getElementById('enabled_status').textContent = items.enabled;
/*    if (items.enabled == "Enabled" || items.enabled == "Ready") {
      document.getElementById('enabled_status').textContent = "Ready";
    } else if (items.enabled == "Disabled" || items.enabled == "Waiting") {
      document.getElementById('enabled_status').textContent = "Waiting";
    }
*/
    document.getElementById('enabled_status').textContent = items.enabled;
  });
}


document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
document.getElementById('disable').addEventListener('click',
    disable_script);
document.getElementById('enable').addEventListener('click',
    enable_script);