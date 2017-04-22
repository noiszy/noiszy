function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function click_random_link(sendResponse) {
  console.log("clicking random link");
  
  //get element
  var elements = document.querySelectorAll("a[href]:not([target]):not([href^='http']):not([href^='mailto']):not([href^='javascript'])");
//  console.log("elements", elements);
  
  chrome.storage.local.get({
    blockStreams: []
  }, function(result) {
    if (result.blockStreams == true) {
//      console.log("reselecting hrefs without 'live' or 'stream'");
      elements = document.querySelectorAll("a[href]:not([target]):not([href^='http']):not([href^='mailto']):not([href^='javascript']):not([href*='live']):not([href*='stream'])");
    }
    
    //pick one at random and click it
    var num = getRandomIntInclusive(0,elements.length-1);
    var element = elements[num];
    element.click();
    
    console.log("sending response",element.href);
    
    sendResponse(element.href);
  });
}


// Listen for messages
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  
    if (msg.text === 'clicked_link') {

      console.log("clicking random link");
      
      var elements;
      //get element
      if (msg.blockStreams) {
        elements = document.querySelectorAll("a[href]:not([target]):not([href^='http']):not([href^='mailto']):not([href^='javascript']):not([href*='live']):not([href*='stream'])");
      } else {
        elements = document.querySelectorAll("a[href]:not([target]):not([href^='http']):not([href^='mailto']):not([href^='javascript'])");
      }
      
//      console.log("elements", elements);

      // pick one at random and click it
            
      //test to be sure there are elements; if not just pick a new site?
      if (elements.length < 0) {      
        var num = getRandomIntInclusive(0,elements.length-1);
        var element = elements[num];
        element.click();

        console.log("should send this to bg",element.href);
        sendResponse(element.href);
      } else { // no clickable elements on the page, so send failure response
        sendResponse("linkclick failed");
      }

    }
});