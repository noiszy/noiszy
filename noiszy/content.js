function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function click_random_link() {
  //get element
  var elements = document.querySelectorAll("a[href]:not([target]):not([href^='http']):not([href^='mailto']):not([href^='javascript'])");
//  console.log(elements);
//  elements = elements.querySelectorAll("a:not([href^='http'])");
//  console.log(elements);
  var num = getRandomIntInclusive(0,elements.length-1);
  var element = elements[num];
  element.click();
  
  return element.href;
}


// Listen for messages
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    // If the received message has the expected format...
    // console.log("msg.text:");
    // console.log(msg.text);
    if (msg.text === 'clicked_link') {
//      console.log("in the content.js listener");
//      console.log("sending response");
//      click_random_link();
      sendResponse(click_random_link());      
      sendResponse("should have clicked a link now");      
      
    }
});