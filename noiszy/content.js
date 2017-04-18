function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function click_random_link(sendResponse) {
  console.log("clicking random link");
  //get element
  var elements = document.querySelectorAll("a[href]:not([target]):not([href^='http']):not([href^='mailto']):not([href^='javascript'])");
  console.log("elements", elements);
//  console.log(elements);
  
  chrome.storage.local.get({
    blockStreams: []
  }, function(result) {
    if (result.blockStreams == true) {
      console.log("reselecting hrefs without 'live' or 'stream'");
      elements = document.querySelectorAll("a[href]:not([target]):not([href^='http']):not([href^='mailto']):not([href^='javascript']):not([href*='live']):not([href*='stream'])");
    }
    
    //pick one at random and click it
    var num = getRandomIntInclusive(0,elements.length-1);
    var element = elements[num];
    element.click();
    
    console.log("sending response",element.href);
    
    sendResponse(element.href);
  });

//  return element.href;
}


// Listen for messages
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    // If the received message has the expected format...
    // console.log("msg.text:");
    // console.log(msg.text);
  
    console.log(sender.tab ?
                  "from a content script:" + sender.tab.url :
                  "from the extension");
  
    if (msg.text === 'clicked_link') {
//      console.log("in the content.js listener");
//      console.log("sending response");
//      click_random_link();
//      sendResponse(click_random_link());      

/*      click_random_link(function(result){
        console.log("content.js received response",result);
        sendResponse(result);
        console.log("...and passed it on");
      });      
*/
      
      console.log("clicking random link");
      
      console.log("blockStreams",msg.blockStreams);
      
      var elements;
      //get element
      if (msg.blockStreams) {
        elements = document.querySelectorAll("a[href]:not([target]):not([href^='http']):not([href^='mailto']):not([href^='javascript']):not([href*='live']):not([href*='stream'])");
      } else {
        elements = document.querySelectorAll("a[href]:not([target]):not([href^='http']):not([href^='mailto']):not([href^='javascript'])");
      }
      
      console.log("elements", elements);
    //  console.log(elements);

      console.log("picking random link to click");
      //pick one at random and click it
      
      
      //test to be sure there are elements; if not just pick a new site?
      
      
      var num = getRandomIntInclusive(0,elements.length-1);
      var element = elements[num];
      element.click();

      console.log("should send this to bg",element.href);
      sendResponse(element.href);

      
/*      chrome.storage.local.get({
        blockStreams: []
      }, function(result) {
        if (result.blockStreams == true) {
          console.log("reselecting hrefs without 'live' or 'stream'");
          
        }

        console.log("picking random link to click");
        //pick one at random and click it
        var num = getRandomIntInclusive(0,elements.length-1);
        var element = elements[num];
        element.click();

        console.log("sending response",element.href);
        
//        chrome.runtime.sendMessage({
//          message: "track link click", 
//          url: element.href
//        }, function(response) {
//          console.log(response.farewell);
//        });

//        sendResponse({url: element.href});        
//        sendResponse({"url": "test"});      
//        console.log("response sent",{"url": "test"});
      });
*/      
      
      
//      sendResponse("should have clicked a link now");      
      
    }
});