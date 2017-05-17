function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clickRandomLink(blockStreams, sendResponse) {
  console.log("clicking random link");
  
  // construct query selector
  var domain = document.location.href.match(/(((https?\:\/\/)?([-a-z0-9]+(\.[-a-z0-9]{2,}){1,2}))($|\s|\/.*))/i);
  // [2] is domain with the protocol,
  // [4] is domian without the protocol
  var basicQS, no_domain_QS, onsite_with_protocol_QS, onsite_with_domain_QS, blockStream_QS;
  blockStream_QS = "";
  if (blockStreams == true) {
    // /go2 = cnn live TV link
    blockStream_QS = ":not([href*='live']):not([href*='stream']):not([href*='/go2']):not([href*='video'])";
  }
  
  // don't open new windows, email programs, or javascript links
  basicQS = ":not([target]):not([href^='mailto']):not([href^='javascript'])";
  // if there's no domain in the list, it's onsite
  no_domain_QS = "a[href]" + basicQS + ":not([href^='http'])" + blockStream_QS;
  // if it points to its own domain with protocol, it's onsite
  onsite_with_protocol_QS = "a[href^='" + domain[2] + "']" + basicQS + blockStream_QS;
  // if it points to its own domain by domain name only, it's onsite
  onsite_with_domain_QS = "a[href^='" + domain[4] + "']" + basicQS + blockStream_QS;
  // what about subdomains...?
  // base that on the stored current site
  
  //put it all together
  var full_QS = no_domain_QS + ", " + onsite_with_protocol_QS + ", " + onsite_with_domain_QS;
//  console.log("full_QS", full_QS);

  var elements = document.querySelectorAll(no_domain_QS + ", " + onsite_with_protocol_QS + ", " + onsite_with_domain_QS);
//  console.log("elements", elements);
  
//  chrome.storage.local.get({
//    blockStreams: []
//  }, function(result) {
//    if (result.blockStreams == true) {
/*    if (blockStreams == true) {
//      console.log("reselecting hrefs without 'live' or 'stream'");
      elements = document.querySelectorAll("a[href]:not([target]):not([href^='http']):not([href^='mailto']):not([href^='javascript']):not([href*='live']):not([href*='stream'])");
    }
*/    
    if (elements.length > 0) {      
      //pick one at random and click it
      var num = getRandomIntInclusive(0,elements.length-1);
      var element = elements[num];
      element.click();
      sendResponse(element.href);
    } else {
      sendResponse("linkclick failed");
    }
    
//    console.log("sending response",element.href);
    
//    sendResponse(element.href);
//  });
}


// Listen for messages
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  
    if (msg.text === 'click link') {

      console.log("clicking random link");
      
//      var elements;
      //get element
/*      if (msg.blockStreams) {
        elements = document.querySelectorAll("a[href]:not([target]):not([href^='http']):not([href^='mailto']):not([href^='javascript']):not([href*='live']):not([href*='stream'])");
      } else {
        elements = document.querySelectorAll("a[href]:not([target]):not([href^='http']):not([href^='mailto']):not([href^='javascript'])");
      }
*/      
//      console.log("elements", elements);

      // pick one at random and click it
            
      //test to be sure there are elements; if not just pick a new site?
/*      if (elements.length < 0) {      
        var num = getRandomIntInclusive(0,elements.length-1);
        var element = elements[num];
        element.click();

        console.log("should send this to bg",element.href);
        sendResponse(element.href);
      } else { // no clickable elements on the page, so send failure response
        sendResponse("linkclick failed");
      }
*/      
      
      clickRandomLink(msg.blockStreams, function(result) {
        sendResponse(result);
      });

    }
});