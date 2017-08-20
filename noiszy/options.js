window.browser = (function () {
  return window.msBrowser ||
    window.browser ||
    window.chrome;
})();


// track in GA when this page is opened/created

browser.runtime.sendMessage({
  msg: "track options open"
}, function(response) {
  console.log("response", response);
});


function status_alert(divId, message, time) {
  var status = document.getElementById(divId);
    status.textContent = message;
    setTimeout(function() {
      status.textContent = '';
    }, time);
}


// Saves options to storage
function save_options() {

  // get the default inputs
  
  var default_sites = document.getElementById("default_sites_wrapper");
//  console.log("news_sites: ",news_sites);

  // get the categories
  var site_categories = default_sites.getElementsByClassName("site_list_category_wrapper");
  console.log("site_categories: ",site_categories);

  var cat, inputs;
//  var sites_formatted = new Object();
  var sites_formatted = [];
  var thisCategory, thisSite;
  
  for (var c=0; c < site_categories.length; c++) {
    // get name
    console.log("site_categories[c]: ",site_categories[i]);
    console.log('site_categories[c].getAttribute("data-category"): ',site_categories[c].getAttribute("data-category"));
    cat = site_categories[c].getAttribute("data-category");
    console.log("cat",cat);

    thisCategory = {};
    thisCategory.name = site_categories[c].getAttribute("data-category");
    thisCategory.displayName = site_categories[c].getAttribute("data-category-displayName");
//    thisSite = new Object();  // TODO: is this going to cause a memory problem?
    ////////
    //TODO: displayName, order, etc
    ////////
    
    inputs = site_categories[c].getElementsByTagName("input");
    console.log("inputs: ",inputs);
//    var sites_formatted = new Object();
  //  sites_formatted.default = [];
//    sites_formatted[cat] = [];
    thisCategory.sites = []
    console.log("sites_formatted[cat]: ",sites_formatted[cat]);

    // loop through the displayed sites and make an array; then update what's saved
    for (var i=0; i < inputs.length; i++) { 
      console.log("i: ",i,inputs[i]);
//      thisSite = new Object();
//      thisSite = new Object();
//      thisSite.url = inputs[i].value;
//      thisSite.checked = inputs[i].checked;
//      console.log(thisSite);
//      thisCategory.sites.push(thisSite);
      thisCategory.sites.push({"url" : inputs[i].value, "checked" : inputs[i].checked});
    }
    
    sites_formatted.push(thisCategory);
  }
  
  // get the user inputs
  var user_sites = document.getElementById("user_sites");
  var user_site_list = user_sites.getElementsByTagName("input");
//  sites_formatted.user = [];
  thisCategory = {};
  thisCategory.name = "user";
  thisCategory.displayName = "User";
  thisCategory.sites = [];
  
  console.log("user_site list: ",user_site_list);
  
  // loop through the displayed sites and make an array; then update what's saved
  for (var i=0; i < user_site_list.length; i++) { 
    console.log("i: ",i,user_site_list[i]);
//    sites_formatted.user[i] = new Object();
//    sites_formatted.user[i].url = user_site_list[i].value;
//    sites_formatted.user[i].checked = user_site_list[i].checked;
//    thisSite.url = inputs[i].value;
//    thisSite.checked = inputs[i].checked;
//    thisCategory.sites.push(thisSite);
    thisCategory.sites.push({"url" : inputs[i].value, "checked" : inputs[i].checked});

  }
  
  sites_formatted.push(thisCategory);


  // also check other options
  var block_streams = document.getElementById("block_streams").checked;
//  var explode_links = document.getElementById("explode_links").checked;
  
  console.log("saving site settings:");
  console.log(sites_formatted);
  browser.storage.local.set({
    blockStreams: block_streams,
//    explodeLinks: explode_links,
    sites: sites_formatted
  }, function() {
  });
}


function disable_script() {
  console.log("disabling");
  browser.storage.local.set({enabled: "Waiting"}, function () {
    alarms.clearAll();

    console.log("disabled");
    document.getElementById('enabled_status').textContent = "Waiting";
  });
}

function enable_script() {
  console.log("enabling");
  // send message to background
  //  runtime.sendMessage({msg: "enable"}, function(response) {
  browser.runtime.sendMessage({msg: "start"}, function(response) {
    console.log("response", response);
    if (response.farewell == "no enabled sites") {
      // no enabled sites
      console.log("no enabled sites");
      // show an alert
      status_alert("alerts", "You must enable at least one site.", 10000);
      // clean up, so alarms get cleared etc
      disable_script();
    } else {
      console.log("response", response);
      // it worked
      browser.storage.local.set({enabled: "Running"}, function () {
        console.log("running");
        document.getElementById('enabled_status').textContent = "Running";      
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
  Event.stopPropagation();
  return false;
}

function disable_all_sites() {
  //get wrapper div
  var wrapper_div = this.parentNode.parentNode;
  //get & check checkboxes
  
  console.log("disabling all sites in " + this.getAttribute('id'));
  var inputs = wrapper_div.getElementsByTagName("input");
  for (var i=0; i<inputs.length; i++) {
    if (inputs[i].getAttribute("type") == "checkbox") {
      inputs[i].checked = false;
    }
  }
  // and save everything
  save_options();
  Event.stopPropagation();

  return false;
}


function add_user_site(event) {
  // don't submit the form
  event.preventDefault();
  console.log("adding site");
  
  //get value from HTML
  var new_site = document.getElementById("new_site").value;
  new_site = new_site.trim();
//  console.log("new_site", new_site)
  
  //check against blacklist
  var blacklist = new RegExp("(amazon\.|ebay\.)","i");
  try {
    if (blacklist.test(new_site)) {
      //alert & cancel
      status_alert("user_site_alerts","Sorry, that site cannot be added to Noiszy.",5000);
      //clear the entry
      document.getElementById("new_site").value = "";

      //bail out
      return false;
    }
  } catch(e) {
  }
  
  //check for real URL, & reject or modify if needed
  try {
    //test to see if it's a valid http/https URL
    if (/((https\:\/\/)?[-a-z0-9]+(\.[-a-z0-9]{2,}){1,4}($|\s|\/.*))/i.test(new_site)) {
      // matches, so modify to remove http:// if it's there
      new_site = new_site.match(/((https\:\/\/)?[-a-z0-9]+(\.[-a-z0-9]{2,}){1,2}($|\s|\/.*))/i)[1];
    } else {
      // send a message in the status div and return
      // don't clear the text field in case it was a typo
      status_alert("user_site_alerts", "Not a valid URL - please try again", 3000);
      return;
    }
    
  } catch(e) {}
    
  //add to storage
  console.log("adding to storage");
  //get current values
  browser.storage.local.get({
    enabled: 'Ready',
    sites: 'sites'
  }, function(items) {
    
//    console.log("sites: ",items.sites);
    
    //add to items with new value
    var new_site_obj = new Object();
    new_site_obj.url = new_site;
    new_site_obj.checked = "checked";
    
//    items.sites.user.push(new_site_obj);
    //get the user array
    for (var i=0; i<items.sites.length; i++) {
      if (items.sites[i].name == "user") {
        console.log("got 'user' sites obj: ", items.sites[i]);
        items.sites[i].sites.push(new_site_obj);
      }
    }
    
/*    var i = 0;
    if (items.sites.user) {
      i = items.sites.user.length;
    } else {
      items.sites.user = new Object();
    }
    items.sites.user[i] = new Object();
    items.sites.user[i].url = new_site;
    items.sites.user[i].checked = "checked";
*/    
    console.log("items.sites: ",items.sites);
    console.log("items: ",items);
    
    browser.storage.local.set({
      sites: items.sites
    }, function() {
      //track it
      browser.runtime.sendMessage({
        msg: "track add site",
        added: new_site
      }, function(response) {
        console.log("response", response);
      });

      
      browser.storage.local.get({
//        enabled: 'Ready',
        sites: 'sites'
      }, function(items) {

//        console.log("enabled: ",items.enabled);
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

  // get url to remove
  var url_to_remove = this.parentNode.getAttribute("data-val");

  //remove from page
//  console.log("this",this);
  this.parentNode.parentNode.removeChild(this.parentNode);

  // get current values
  browser.storage.local.get({
    sites: 'sites'
  }, function(items) {
    
//    console.log("sites: ",items.sites);
    // find site to remove - must be in sites.user (for now)
    
    // remove
    for (var i=0; i<items.sites.user.length; i++) {
      if (items.sites.user[i].url == url_to_remove) {
        items.sites.user.splice(i,1);
        i = items.sites.user.length+1;
      }
    }
    
    console.log("items: ",items);
    
    browser.storage.local.set({
      sites: items.sites
    }, function() {
    });
  });    
}

// writes a site to the site list on the page
function write_site_to_div(site, cat, div, i, delete_button) {
  var thiswrapper, thisid, thisurl, thisinput, thislabel, thisdelete;
//  thisid = "s" + i;
  thisid = cat + i;
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

  return;
}

function toggle_menu() {
//  console.log("toggle menu click");
//  console.log("this");
//  console.log(this);
//  var menuId = this.getAttribute("data-category") + "_sites";
  var menuId = this.getAttribute("data-category");
//  console.log("menuId", menuId);
//  var menu = document.getElementById(menuId);
  document.getElementById(menuId+"_sites").classList.toggle("show");
  document.getElementById(menuId+"_sites_controls").classList.toggle("show");
  //change triangle
  document.getElementById(menuId+"_triangle").classList.toggle("triangle_right");
  document.getElementById(menuId+"_triangle").classList.toggle("triangle_down");
}
  
function write_site_category_list(categoryObj,toDiv,iOffset) {
  var thisWrapper, thisTitle, thisSites, thisControls, thisDisableAll, thisEnableAll, thisTriangle;
  
  var category = categoryObj.name
  var displayName = categoryObj.displayName;

  thisWrapper = document.createElement("div");
  thisWrapper.setAttribute("class","site_list_category_wrapper");
  thisWrapper.setAttribute("data-category",category);
  thisWrapper.setAttribute("data-category-displayName",displayName);
  
  thisTriangle = document.createElement("div");
  thisTriangle.setAttribute("class","triangle_right");
  thisTriangle.setAttribute("id", category+"_triangle");
  
  thisTitle = document.createElement("div");
  thisTitle.setAttribute("class","site_category_name");
  thisTitle.setAttribute("data-category",category);
  thisTitle.appendChild(thisTriangle);
//  thisTitle.textContent = category;
  thisTitle.innerHTML += "&nbsp;" + displayName;
  thisTitle.addEventListener('click', toggle_menu);
  
  thisSites = document.createElement("div");
  thisSites.setAttribute("id", category+"_sites");
  thisSites.setAttribute("class", "site_list");
  
  thisControls = document.createElement("div");
  thisControls.setAttribute("id", category+"_sites_controls");
  thisControls.setAttribute("class","control-links");
  
  thisDisableAll = document.createElement("span");
  thisDisableAll.setAttribute("id", "disable_all_"+category+"_sites");
  thisDisableAll.setAttribute("class","control-link");
  thisDisableAll.textContent = "Disable all "+displayName;
  thisDisableAll.addEventListener('click', disable_all_sites);
  
  thisEnableAll = document.createElement("span");
  thisEnableAll.setAttribute("id", "enable_all_"+category+"_sites");
  thisEnableAll.setAttribute("class","control-link");
  thisEnableAll.textContent = "Enable all "+displayName;
  thisEnableAll.addEventListener('click', enable_all_sites);
  
//  document.getElementById('disable_all_news_sites').addEventListener('click', disable_all_sites);
//  document.getElementById('enable_all_news_sites').addEventListener('click', enable_all_sites);

  
  thisWrapper.appendChild(thisTitle);
  thisWrapper.appendChild(thisSites);
  thisWrapper.appendChild(thisControls);
  thisControls.appendChild(thisDisableAll);
  thisControls.appendChild(thisEnableAll);

  toDiv.appendChild(thisWrapper);

//  <div id="news_sites_wrapper_small">
//    <div id="news_sites"></div>
//    <div id="news_site_controls" class="control-links">
//      <span id="disable_all_news_sites" class="control-link">Disable all</span>
//      <span id="enable_all_news_sites" class="control-link">Enable all</span>
//    </div>
//  </div>
  
  // loop through items here
  try {
//    console.log("items.sites.default", items.sites.news);
//    for (var i = 0; i < items.length; i++) { 
//      write_site_to_div(items[i], thisSites, i, false);
    for (var i = 0; i < categoryObj.sites.length; i++) { 
      write_site_to_div(categoryObj.sites[i], categoryObj.name, thisSites, i, false);
    }
  } catch(e) {}


}

function write_sites_to_page(items) {
  
  console.log("items.sites", items.sites);
  
  var default_sites_inner_wrapper = document.getElementById("default_sites_inner_wrapper");  
  // clear so we can write all of them
  default_sites_inner_wrapper.innerHTML = "";
  
  
  console.log("default_sites_inner_wrapper",default_sites_inner_wrapper);
  //loop through site categories in items
  for (var i = 0; i < items.sites.length; i++) {
    if (items.sites[i].name != "user") {
      console.log("writing default sites to page: ", items.sites[i]);
      write_site_category_list(items.sites[i],default_sites_inner_wrapper);
      
    } else { //user sites
      console.log("writing user sites to page: ", items.sites[i]);

      var user_sites = document.getElementById("user_sites");
      user_sites.innerHTML = "";

      console.log("user_sites div:",document.getElementById("user_sites_inner_wrapper"));
      console.log("erased");

      for (var u=0; u<items.sites[i].sites.length; u++) {
        console.log("u: ", u);
        console.log('write_site_to_div(items.sites[i].sites[u], "user", user_sites, u, true);');
        console.log(items.sites[i].sites[u]);
        write_site_to_div(items.sites[i].sites[u], "user", user_sites, u, true);
      }
    }
  }

  return;
}

// Restores select box and checkbox state using the preferences
// stored in storage.
function restore_options(options) {
  
  console.log("restoring options from saved - options:",options);
  
  browser.storage.local.get({
    enabled: 'Ready',
    blockStreams: [],
    userSitePreset: [],
    sites: 'sites'
  }, function(items) {

    write_sites_to_page(items);

    //reset other options, too
    console.log("items.blockStreams",items.blockStreams);
    document.getElementById("block_streams").checked = items.blockStreams;
    document.getElementById('enabled_status').textContent = items.enabled;
    document.getElementById('new_site').value = items.userSitePreset;

  });
}

function reset_options() {  
//  console.log("reset_options");
  browser.runtime.sendMessage({msg: "reset"}, function(response) {
//    console.log("reset_options sendMessage 'reset' callback response:",response);
    restore_options();
//    restore_options(response);
  });
}


document.addEventListener('DOMContentLoaded', function () {
    var links = document.getElementsByTagName("a");
    for (var i = 0; i < links.length; i++) {
        (function () {
            var ln = links[i];
            var location = ln.href;
            ln.onclick = function () {
                browser.tabs.create({active: true, url: location});
            };
        })();
    }
});

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('sites_wrapper').addEventListener('click', save_options);
document.getElementById('disable').addEventListener('click', disable_script);
document.getElementById('enable').addEventListener('click', enable_script);
document.getElementById('start_link').addEventListener('click', enable_script);
document.getElementById('add_site_form').addEventListener('submit', add_user_site);

//document.getElementById('disable_all_default_sites').addEventListener('click', disable_all_sites);
//document.getElementById('enable_all_default_sites').addEventListener('click', enable_all_sites);

//document.getElementById('disable_all_news_sites').addEventListener('click', disable_all_sites);
//document.getElementById('enable_all_news_sites').addEventListener('click', enable_all_sites);

document.getElementById('disable_all_user_sites').addEventListener('click', disable_all_sites);
document.getElementById('enable_all_user_sites').addEventListener('click', enable_all_sites);

document.getElementById('block_streams').addEventListener('click', save_options);
document.getElementById('reset_button').addEventListener('click', reset_options);


//document.getElementById('explode_links').addEventListener('click',
//    save_options);
