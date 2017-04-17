var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-96120302-2']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();


function status_alert(message, time) {
  var status = document.getElementById('alerts');
    status.textContent = message;
    setTimeout(function() {
      status.textContent = '';
    }, time);
}

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
/*    var status = document.getElementById('status');
    status.textContent = 'Site list saved.';
    chrome.storage.local.get('sites', function (result) {
      console.log(result.sites)
      
      // also pretend we clicked "Start" so the new vals are loaded
      // enable_script();
    });

    setTimeout(function() {
      status.textContent = '';
    }, 3000);
*/
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
  console.log("enabling");
  // send message to background
  //  chrome.runtime.sendMessage({msg: "enable"}, function(response) {
  chrome.runtime.sendMessage({msg: "start"}, function(response) {
    console.log("response", response);
    if (response.farewell == "no enabled sites") {
      // no enabled sites
      console.log("no enabled sites");
      // show an alert
      status_alert("You must enable at least one site.", 10000);
      // clean up, so alarms get cleared etc
      disable_script();
//    } else if (response.farewell == "open_new_site called") {
    } else {
      console.log("response", response);
      // it worked
      chrome.storage.local.set({enabled: "Running"}, function () {
        console.log("running");
        document.getElementById('enabled_status').textContent = "Running";
//      console.log(response.farewell);
      
      });
    }
  });
}

function enable_all_sites() {
  //get wrapper div
  var wrapper_div = this.parentNode.parentNode;
  //get & check checkboxes
  var inputs = wrapper_div.getElementsByTagName("input");
  for (var i=0; i<inputs.length; i++) {
    if (inputs[i].getAttribute("type") == "checkbox") {
      inputs[i].checked = true;
    }
  }
  // and save everything
  save_options();
}

function disable_all_sites() {
  //get wrapper div
  var wrapper_div = this.parentNode.parentNode;
  //get & check checkboxes
  var inputs = wrapper_div.getElementsByTagName("input");
  for (var i=0; i<inputs.length; i++) {
    if (inputs[i].getAttribute("type") == "checkbox") {
      inputs[i].checked = false;
    }
  }
  // and save everything
  save_options();
}


function add_user_site(event) {
  event.preventDefault();
  console.log("adding site");
  
  //get value from HTML
  var new_site = document.getElementById("new_site").value;
  console.log("new_site", new_site)
  
  //check for real URL, & modify if helpful
  
  
  //check against blacklist
  var blacklist = new RegExp("(amazon\.|ebay\.)","i");
  try {
    if (blacklist.test(new_site)) {
      //alert & cancel
      //add this to a status div, and remove after 3 secs
      console.log("That site cannot be added to Noiszy.");
      status_alert("That site cannot be added to Noiszy.",5000);
      return false;
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
    
    console.log("items.sites: ",items.sites);
    console.log("items: ",items);
    
    chrome.storage.local.set({
      sites: items.sites
    }, function() {
      console.log("added it");

      //track it
      _gaq.push(["_trackEvent", "add site", new_site]);
      
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
  
  // empty the text box
  document.getElementById("new_site").value = "";

  return false;
}

function remove_site() {
  console.log("remove this",this);
  //remove url from storage
  //get url to remove
  console.log("parent",this.parentNode);
  var url_to_remove = this.parentNode.getAttribute("data-val");
  //remove from storage
  //get current values
  chrome.storage.local.get({
    sites: 'sites'
  }, function(items) {
    
    console.log("sites: ",items.sites);
    //find site to remove - must be in sites.user (for now)
    
    for (var i=0; i<items.sites.user.length; i++) {
      if (items.sites.user[i].url == url_to_remove) {
        items.sites.user.splice(i,1);
        i = items.sites.user.length+1;
      }
    }
    
    console.log("items.sites: ",items.sites);
    console.log("items: ",items);
    
    chrome.storage.local.set({
      sites: items.sites
    }, function() {
      console.log("removed it");
      
/*      chrome.storage.local.get({
        enabled: 'Ready',
        sites: 'sites'
      }, function(items) {

        console.log("enabled: ",items.enabled);
        console.log("sites: ",items.sites);

        //rewrite full list of user sites
        write_sites_to_page(items);
      });
*/
    });
  });
  
  
  //remove from page
  this.parentNode.parentNode.removeChild(this.parentNode);
}

// writes a site to the site list on the page
function write_site_to_div(site, div, i, delete_button) {
  var thiswrapper, thisid, thisurl, thisinput, thislabel, thisdelete;
  thisid = "s" + i;
  thisurl = site.url;
  thischecked = site.checked;
  
  thiswrapper = document.createElement("div");
  thiswrapper.setAttribute("class","site_wrapper");
  thiswrapper.setAttribute("data-val",thisurl);
  thiswrapper.setAttribute("data-id",thisid);
  
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
  thislabel.textContent = thisurl + " ";
  
  if (delete_button) {
    thisdelete = document.createElement("a");
    thisdelete.textContent = "remove";
    thisdelete.setAttribute("href","#");
    thisdelete.setAttribute("class","remove_site_link");
    thisdelete.addEventListener("click",remove_site);
  }

  thiswrapper.appendChild(thisinput);
  thiswrapper.appendChild(thislabel);
  if (delete_button) {
    thiswrapper.appendChild(thisdelete);
  }
  thiswrapper.appendChild(document.createElement("br"));
  div.appendChild(thiswrapper);
/*
  div.appendChild(thisinput);
  div.appendChild(thislabel);
  if (delete_button) {
    div.appendChild(thisdelete);
  }
  div.appendChild(document.createElement("br"));
*/
  
  return;
}
  

function write_sites_to_page(items) {
  
  // default sites first
  document.getElementById("default_sites").innerHTML= "";
  try {
    console.log("items.sites.default", items.sites.default);
    var default_sites = document.getElementById("default_sites");
    for (var i = 0; i < items.sites.default.length; i++) { 
      write_site_to_div(items.sites.default[i], default_sites, i, false);
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
      write_site_to_div(items.sites.user[i], user_sites, i+offset, true);
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
    restore_options();
  });
}


document.addEventListener('DOMContentLoaded', restore_options);
//document.getElementById('save').addEventListener('click',
//    save_options);
document.getElementById('sites_wrapper').addEventListener('click',
    save_options);
document.getElementById('disable').addEventListener('click',
    disable_script);
document.getElementById('enable').addEventListener('click',
    enable_script);
document.getElementById('start_link').addEventListener('click',
    enable_script);
//document.getElementById('add_site_button').addEventListener('click',
//    add_user_site);
document.getElementById('add_site_form').addEventListener('submit',
    add_user_site);
document.getElementById('disable_all_default_sites').addEventListener('click', disable_all_sites);
document.getElementById('enable_all_default_sites').addEventListener('click', enable_all_sites);
document.getElementById('disable_all_user_sites').addEventListener('click', disable_all_sites);
document.getElementById('enable_all_user_sites').addEventListener('click', enable_all_sites);
document.getElementById('reset_button').addEventListener('click',
    reset_options);