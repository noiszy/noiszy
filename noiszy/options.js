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

  // get the default inputs
  var default_sites = document.getElementById("default_sites");
  var default_site_list = default_sites.getElementsByTagName("input");
  var sites_formatted = new Object();
  sites_formatted.default = [];
  console.log("default_site list: ",default_site_list);
  // loop through the displayed sites and make an array; then update what's saved
  for (var i=0; i < default_site_list.length; i++) { 
    console.log("i: ",i,default_site_list[i]);
    sites_formatted.default[i] = new Object();
    sites_formatted.default[i].url = default_site_list[i].value;
    sites_formatted.default[i].checked = default_site_list[i].checked;
  }
  
  // get the user inputs
  var user_sites = document.getElementById("user_sites");
  var user_site_list = user_sites.getElementsByTagName("input");
  sites_formatted.user = [];
  console.log("user_site list: ",user_site_list);
  // loop through the displayed sites and make an array; then update what's saved
  for (var i=0; i < user_site_list.length; i++) { 
    console.log("i: ",i,user_site_list[i]);
    sites_formatted.user[i] = new Object();
    sites_formatted.user[i].url = user_site_list[i].value;
    sites_formatted.user[i].checked = user_site_list[i].checked;
  }

  chrome.storage.local.set({
    sites: sites_formatted
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Site list saved.';
    chrome.storage.local.get('sites', function (result) {
      console.log(result.sites)
      
      // also pretend we clicked "Start" so the new vals are loaded
      // enable_script();
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


function add_user_site() {
  console.log("adding site");
  
  //get value from HTML
  var new_site = document.getElementById("new_site").value;
  console.log("new_site", new_site)
  
  //check against blacklist
  try {
    if (newsite.indexOf("amazon.") > -1) {
      console.log("amazon");
    }
  } catch(e) {
  }
  
  //add to storage
  console.log("adding to storage");
  //get current values
  chrome.storage.local.get({
    enabled: 'Ready',
    sites: 'sites'
  }, function(items) {
    
    console.log("sites: ",items.sites);
    
    //add to items with new value
    var i = 0;
    if (items.sites.user) {
      i = items.sites.user.length;
    } else {
      items.sites.user = new Object();
    }
    items.sites.user[i] = new Object();
    items.sites.user[i].url = new_site;
    items.sites.user[i].checked = "checked";
    
//    console.log("items.sites.user",items.sites.user);
//    console.log("sites: ",sites);
    console.log("items.sites: ",items.sites);
    console.log("items: ",items);
    
    chrome.storage.local.set({
      sites: items.sites
    }, function() {
      console.log("added it");
      
      chrome.storage.local.get({
        enabled: 'Ready',
        sites: 'sites'
      }, function(items) {

        console.log("enabled: ",items.enabled);
        console.log("sites: ",items.sites);

        //rewrite full list of user sites
        write_sites_to_page(items);
      });

    });
   
    
  });
  
  
  
  return false;
}

// writes a site to the site list on the page
function write_site_to_div(site, div, i) {
  var thisid, thisurl, thisinput, thislabel;
  thisid = "s" + i;
  thisurl = site.url;
  thischecked = site.checked;

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

  div.appendChild(thisinput);
  div.appendChild(thislabel);
  div.appendChild(document.createElement("br"));
  
  return;
}
  

function write_sites_to_page(items) {
  
  // default sites first
  document.getElementById("default_sites").innerHTML= "";
  try {
    console.log("items.sites.default", items.sites.default);
    var default_sites = document.getElementById("default_sites");
    for (var i = 0; i < items.sites.default.length; i++) { 
      write_site_to_div(items.sites.default[i], default_sites, i);
    }
  } catch(e) {}

  // now user sites; start #ing at default+1
  var offset = items.sites.default.length;
  console.log("user_sites div:",document.getElementById("user_sites"));
  document.getElementById("user_sites").innerHTML = "";
  try {
    console.log("items.sites.user",items.sites.user);
    var user_sites = document.getElementById("user_sites");
    for (var i = 0; i < items.sites.user.length; i++) { 
      console.log("writing site", i);
      write_site_to_div(items.sites.user[i], user_sites, i+offset);
    }
  } catch(e) {}

  return;
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
    
    write_sites_to_page(items);
    
    document.getElementById('enabled_status').textContent = items.enabled;
  });
}

function reset_options() {  
  chrome.runtime.sendMessage({msg: "reset"}, function(response) {
//      console.log(response.farewell);
  });
}


document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
document.getElementById('sites_wrapper').addEventListener('click',
    save_options);
document.getElementById('disable').addEventListener('click',
    disable_script);
document.getElementById('enable').addEventListener('click',
    enable_script);
document.getElementById('add_site_button').addEventListener('click',
    add_user_site);
document.getElementById('reset_button').addEventListener('click',
    reset_options);