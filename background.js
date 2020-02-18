/**
 * Possible parameters for request:
 *  action: "xhttp" for a cross-origin HTTP request
 *  method: Default "GET"
 *  url   : required, but not validated
 *  data  : data to send in a POST request
 *
 * The callback function is called upon completion of the request */
chrome.runtime.onMessage.addListener(function(request, sender, callback) {
  if (request.action == "xhttp") {
    //console.log()
    // chrome.browserAction.setBadgeText({text: "10"}); 

    var xhttp = new XMLHttpRequest();
      var method = request.method ? request.method.toUpperCase() : 'GET';

      xhttp.onload = function() {
          callback(xhttp.responseText);
      };
      xhttp.onerror = function() {
          // Do whatever you want on error. Don't forget to invoke the
          // callback to clean up the communication port.
          callback();
      };
      xhttp.open(method, request.url, true);
      if (method == 'POST') {
          xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      }
      xhttp.send(request.data);
      return true; // prevents the callback from being called too early on return
  } else {
    //

    if (request) {
      let resultType = request.resultType;
      let booksCount = request.booksCount;
      
      if (sender.tab) {
        chrome.tabs.get(sender.tab.id, function(tab) {
          if (chrome.runtime.lastError) {
              return; // the prerendered tab has been nuked, happens in omnibox search
          }
          if (tab.index >= 0) { // tab is visible
            displayBadge(tab.id, resultType, booksCount);
          } else { // prerendered tab, invisible yet, happens quite rarely
              var tabId = sender.tab.id;
              chrome.webNavigation.onCommitted.addListener(function update(details) {
                  if (details.tabId == tabId) {
                    displayBadge(tabId, resultType, booksCount);                 
                    chrome.webNavigation.onCommitted.removeListener(update);
                  }
              });
          }
      });
    } else {
      // set extension badge when tab_id undefined (sender is empty)
      chrome.tabs.query(
        {currentWindow: true, active : true},
        function(tabArray){
          chrome.browserAction.setBadgeText({tabId: tabArray[0].id, text: ''});
        }
      )
    }
  }
}
});

function displayBadge(tabId, resultType, booksCount) {
  switch (resultType) {
    case 0:
      // exact match
      chrome.browserAction.setBadgeBackgroundColor({tabId: tabId, color: '#799900' });
      chrome.browserAction.setBadgeText({tabId: tabId, text: booksCount.toString()});
      break;
    case 1:
      // alternative results - same author
      chrome.browserAction.setBadgeBackgroundColor({tabId: tabId, color: '#ffb100' });
      chrome.browserAction.setBadgeText({tabId: tabId, text: booksCount.toString()});
      break;
    case 2:
      // alternative results - similar authors (same last name)
      chrome.browserAction.setBadgeBackgroundColor({tabId: tabId, color: '#337ab7' });
      chrome.browserAction.setBadgeText({tabId: tabId, text: booksCount.toString()});
      break;
    case 3:
      // no results
      chrome.browserAction.setBadgeBackgroundColor({tabId: tabId, color: '#e43838' });
      chrome.browserAction.setBadgeText({tabId: tabId, text: booksCount.toString()});
      break;
    default:
      chrome.browserAction.setBadgeText({tabId: tabId, text: ''});
      break;
  }
}