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
  var catSites = [];
  
  for (var c=0; c < site_categories.length; c++) {
    // get name
    console.log("site_categories[c]: ",site_categories[c]);
    console.log('site_categories[c].getAttribute("data-category"): ',site_categories[c].getAttribute("data-category"));
    cat = site_categories[c].getAttribute("data-category");
    console.log("cat",cat);
    console.log('site_categories[c].getAttribute("data-category-menuOpen"): ',site_categories[c].getAttribute("data-category-menuOpen"));
    
    catSites = [];
    
    inputs = site_categories[c].getElementsByTagName("input");
    console.log("inputs: ",inputs);

    // loop through the displayed sites and make an array; then update what's saved
    for (var i=0; i < inputs.length; i++) { 
      catSites.push({"url" : inputs[i].value, "checked" : inputs[i].checked});
    }
    
    console.log("push to sites_formatted: ",site_categories[c].getAttribute("data-category"),catSites);
    sites_formatted.push({
      "name" : site_categories[c].getAttribute("data-category"),
      "displayName" : site_categories[c].getAttribute("data-category-displayName"),
      "menuOpen" : site_categories[c].getAttribute("data-category-menuOpen"), //TODO: set dynamically
      "order" : site_categories[c].getAttribute("data-category-order"), //TODO: set synamically
      "sites" : catSites
    });
  }
  
  // get the user inputs
  var user_sites = document.getElementById("user_sites");
  var user_site_list = user_sites.getElementsByTagName("input");
  
  catSites = [];
  
  console.log("user_site list: ",user_site_list);
  
  // loop through the displayed sites and make an array; then update what's saved
  for (var i=0; i < user_site_list.length; i++) { 
    console.log("i: ",i,user_site_list[i]);
//    catSites.push({"url" : inputs[i].value, "checked" : inputs[i].checked});
    catSites.push({"url" : user_site_list[i].value, "checked" : user_site_list[i].checked});
  }
  
  sites_formatted.push({
    "name" : "user",
    "displayName" : "User",
    "menuOpen" : true,
    "order" : 1, //TODO: set synamically
    "sites" : catSites
  });



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
    browser.alarms.clearAll();

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
//      inputs[i].checked = true;
      inputs[i].checked = "checked";
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
//      inputs[i].checked = false;
      inputs[i].checked = "";
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
    console.log("blacklist problem");
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
    
  } catch(e) {
    console.log("url parse problem");
  }
    
  //add to storage
  console.log("adding to storage");
  //get current values
  browser.storage.local.get({
    enabled: 'Ready',
    sites: 'sites'
  }, function(items) {
    
    console.log("items: ",items);
    console.log("items.sites: ",items.sites);
    
    //get the user array
    for (var i=0; i<items.sites.length; i++) {
      console.log("i: ",i);
      if (items.sites[i].name == "user") {
        console.log("got 'user' sites obj: ", items.sites[i]);
        items.sites[i].sites.push({"url" : new_site, "checked" : true});
      }
    }
    
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

        console.log("sites: ",items.sites);

        //rewrite full list of user sites
        write_sites_to_page(items.sites);
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
    var userSites;
    for (var j=0; j<items.sites.length; j++) {
      //find user sites
      if (items.sites[j].name == "user") {
        
        for (var i=0; i<items.sites[j].sites.length; i++) {
          if (items.sites[j].sites[i].url == url_to_remove) {
            items.sites[j].sites.splice(i,1);
            i = items.sites[j].sites.length+1;
          }
        }
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
  thisinput.addEventListener("click",save_options); //TODO: add on label too?  or not necessary?

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
  var menuId = this.getAttribute("data-category");
  document.getElementById(menuId+"_sites").classList.toggle("show");
  document.getElementById(menuId+"_sites_controls").classList.toggle("show");
  //change triangle
  document.getElementById(menuId+"_triangle").classList.toggle("triangle_right");
  document.getElementById(menuId+"_triangle").classList.toggle("triangle_down");
  // and save to prefs, too
  browser.storage.local.get({
    sites: []
  }, function(cats) {
    //which category is it?
    console.log("got stored sites: ", cats);
    
    var categories = cats.sites;
    
    for (var i=0; i<categories.length; i++) {
      if (categories[i].name == menuId) {
        console.log("get classes...");
//        console.log(
        try {
          if (document.getElementById(menuId+"_sites").classList.contains("show")) {
            categories[i].menuOpen = true;
          } else {
            categories[i].menuOpen = false;
          } 
        } catch(e) {
          console.log("error matching class list for shown menus", e);
        }
      }
    }
    
    console.log("about to set to storage:", categories);
    browser.storage.local.set({
      sites: categories
    }, function(result) {
      console.log("result: of setting categories: ", result);
    });
  });
  
}
  
function write_site_category_list(categoryObj,toDiv,iOffset) {
  var thisWrapper, thisTitle, thisSites, thisControls, thisDisableAll, thisEnableAll, thisTriangle;
  
  var category = categoryObj.name
  var displayName = categoryObj.displayName;

  thisWrapper = document.createElement("div");
  thisWrapper.setAttribute("class","site_list_category_wrapper");
  thisWrapper.setAttribute("data-category",category);
  thisWrapper.setAttribute("data-category-displayName",displayName);
  thisWrapper.setAttribute("data-category-menuOpen",categoryObj.menuOpen);
  thisWrapper.setAttribute("data-category-order",categoryObj.order);
  
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
  

  thisWrapper.appendChild(thisTitle);
  thisWrapper.appendChild(thisSites);
  thisWrapper.appendChild(thisControls);
  thisControls.appendChild(thisDisableAll);
  thisControls.appendChild(thisEnableAll);

  toDiv.appendChild(thisWrapper);

  // loop through items here
  try {
//    console.log("items.sites.default", items.sites.news);
    for (var i = 0; i < categoryObj.sites.length; i++) { 
      write_site_to_div(categoryObj.sites[i], categoryObj.name, thisSites, i, false);
    }
  } catch(e) {
    console.log("error writing site to div:", e);
  }
  
  // if the menu is supposed to be open, simulate a click:
  if (categoryObj.menuOpen) {
    thisTitle.click();
  }

}


function write_sites_to_page(categories) {
  
  console.log("write_sites_to_page(categories)");
  console.log("categories", categories);
  
  var default_sites_inner_wrapper = document.getElementById("default_sites_inner_wrapper");  
  // clear so we can write all of them
  default_sites_inner_wrapper.innerHTML = "";
  
  
  console.log("default_sites_inner_wrapper",default_sites_inner_wrapper);
  //loop through site categories in items
  for (var i = 0; i < categories.length; i++) {
    if (categories[i].name != "user") {
      console.log("writing default sites to page: ", categories[i]);
      write_site_category_list(categories[i],default_sites_inner_wrapper);
      
    } else { //user sites
      console.log("writing category to page: ", categories[i]);

      var user_sites = document.getElementById("user_sites");
      user_sites.innerHTML = "";

      console.log("user_sites div:",document.getElementById("user_sites_inner_wrapper"));
      console.log("erased");

      for (var u=0; u<categories[i].sites.length; u++) {
        console.log("u: ", u);
        console.log('write_site_to_div(categories[i].sites[u], "user", user_sites, u, true);');
        console.log(categories[i].sites[u]);
        write_site_to_div(categories[i].sites[u], "user", user_sites, u, true);
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
    sites: []
  }, function(items) {

//    write_sites_to_page(items);
    try {
      if (items.sites.length > 0) {
        write_sites_to_page(items.sites);
      }
    } catch(e) {
      console.log("no sites returned from localstorage");
      console.log(e);
    }

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
document.getElementById('disable').addEventListener('click', disable_script);
document.getElementById('enable').addEventListener('click', enable_script);
document.getElementById('start_link').addEventListener('click', enable_script);
document.getElementById('block_streams').addEventListener('click', save_options);
document.getElementById('reset_button').addEventListener('click', reset_options);

document.getElementById('add_site_form').addEventListener('submit', add_user_site);
document.getElementById('disable_all_user_sites').addEventListener('click', disable_all_sites);
document.getElementById('enable_all_user_sites').addEventListener('click', enable_all_sites);