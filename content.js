
let requestURL;
let librariesCount;
let mainLocation; // 0 - found book; 1 - books by author; 2 - books by other authors;  3 - no results 
let resultType;  
let booksResult         = [];
let booksResultForBadge = [];
let alternativeResults  = false;

const URL_0           = 'http://';
const URL_1           = '/opac/advancedsearch?level=all&limit=20&material_type=all&ob=asc&q=all_titles%3A';
const URL_2           = '&q=all_authors%3A';
const URL_3           = '&s_source=local&sb=relevance&so=and&usage_class=all&view=CONTENT&wi=false';
const URL_1_BUCURESTI = 'func=find-a&find_code=WSU&request=&request_op=AND&find_code=WAU&request=';
const URL_2_BUCURESTI = '&request_op=AND&find_code=TIT&request=';
const URL_3_BUCURESTI = '&request_op=AND&find_code=WTI&request=&request_op=AND&find_code=WYR&request=&request_op=AND&find_code=WPU&request=&request_op=AND&find_code=WPL&request=&adjacent=N&local_base=MLB01&x=22&y=8&filter_code_1=WLN&filter_request_1=&filter_code_2=WYR&filter_request_2=&filter_code_3=WYR&filter_request_3=&filter_code_4=WFM&filter_request_4=&filter_code_5=WSL&filter_request_5=';

/**
 * whenever the page is loaded, trigger calculation of book count 
 */
window.onload = function() {
  setBadgeCount(); 
}

/**
 * add listenters to elements
 */
document.addEventListener('DOMContentLoaded', function () {
  let resultsButton  = document.querySelector('#resultsButton');
  let settingsButton = document.querySelector('#settingsButton');
  let closeButton    = document.querySelector('#closeButton');

  if (!triggerSearch()) {
    return;
  }

  resultsButton.addEventListener('click', function () {
    openTab(event, 'resultsTab');
  }, false);

  settingsButton.addEventListener('click', function () {
    openTab(event, 'settingsTab');
  }, false);

  closeButton.addEventListener('mouseover', function () {
    closeButton.style.opacity = '0.9';
  }, false);

  closeButton.addEventListener('mouseout', function () {
    closeButton.style.opacity = '0.6';
  }, false);

  closeButton.addEventListener('click', function () {
    window.close();
  }, false);

}, false);

/**
 * get current selected and saved library
 */
function getUserPreferences() {
  chrome.storage.sync.get("locationData", function(items) {
    if ((items.locationData != null) && (items.locationData.length > 0)) {
      let data     = items.locationData.split(',');
      mainLocation = data[0];
      document.querySelector('#Availibility').style.display = 'block';
      document.querySelector('#currentLibrary').style.display = 'block';
      document.querySelector('#welcomeMessage').style.display = 'none';
      document.querySelector("#currentLibrary").innerHTML = data[1];
      // chrome.storage.sync.clear();
    } else {
      mainLocation = '';
      if (document.querySelector('#Availibility') != null) {
        document.querySelector('#Availibility').style.display = 'none';
      }

      if (document.querySelector('#currentLibrary') != null) {
        document.querySelector('#currentLibrary').style.display = 'none';
      }
      
      document.querySelector('#welcomeMessage').style.display = 'block';
      document.querySelector("#welcomeMessage").innerHTML = 'Alege o bibliotecă din tab-ul <em>Biblioteci</em><br><br>';
      document.querySelector("#welcomeMessage").innerHTML += 'După, vei putea verifica disponibilitatea în biblioteca respectivă a oricărei cărți aflate pe unul dintre următoarele site-uri:';
      document.querySelector("#welcomeMessage").innerHTML += document.querySelector('#allowedwebsites').innerHTML;
      settingsButton.click();
    }
  });
}

/**
 * save library selection
 */
function setUserPreferences() {
  let checked = document.querySelector('input[name="library"]:checked');
  checked = (checked == null) ? '' : checked.value;
  if (checked !== '') {
    let locationData = {"locationData" : checked};
    chrome.storage.sync.set(locationData, function() {

    });
    triggerSearch();
  }
}

function openTab(evt, tabName) {
  // Declare all variables
  var i, tabcontent, tablinks;

  // Get all elements with class = "tabcontent" and hide them
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Get all elements with class = "tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";

  // Read libraries from json and create libraries list (on first visit of settings tab)
  if (tabName === 'settingsTab'){
    if (document.querySelector('#librariesDiv') == null) {
        createLibrariesList();
      } else {
        getUserPreferences();   
      }
  }
}

/**
 * read libraries from json file and create list
 */
function createLibrariesList() {
  chrome.runtime.getPackageDirectoryEntry(function(root) {
      root.getFile("libraries.json", {}, function(fileEntry) {
        fileEntry.file(function(file) {
          var reader = new FileReader();
          reader.onloadend = function(e) {
            var librariesJson = JSON.parse(this.result);
            /* create table for libraries */
            let div = document.createElement("div");
            div.setAttribute('id', 'librariesDiv');

            let divLibrary0 = document.createElement('div');
            let divLibrary1 = document.createElement('div');
            let divLibrary2 = document.createElement('div');
            let divLibrary3 = document.createElement('div');
            let divLibrary4 = document.createElement('div');

            divLibrary0.setAttribute('class', 'div-library-container');
            divLibrary1.setAttribute('class', 'div-library-container height-1');
            divLibrary2.setAttribute('class', 'div-library-container height-2');
            divLibrary3.setAttribute('class', 'div-library-container height-3');
            divLibrary4.setAttribute('class', 'div-library-container');
            let br = document.createElement('br');

            librariesCount = librariesJson.libraries.length;

            for (let i = 0; i < librariesCount; i++) {
              let divLibrary = document.createElement('div');
              let radio = document.createElement('input');
              let label = document.createElement('label');

              radio.setAttribute('type', 'radio');
              radio.setAttribute('id', 'library_' + i);
              radio.setAttribute('name', 'library');
              radio.setAttribute('value', [librariesJson.libraries[i].url, librariesJson.libraries[i].name]);
              radio.setAttribute('class', 'checkbox-library');
              label.setAttribute('for', 'library_' + i);
              label.setAttribute('class', 'label-library');
              label.innerText = librariesJson.libraries[i].location;
              radio.addEventListener('change', function() {
                setTimeout(function () {
                  setUserPreferences();
                }, 500);
              }, false);
              
              if (!mainLocation.localeCompare(librariesJson.libraries[i].url)) {
                radio.checked = true;
              }

              switch (true) {
                case (i <= 0):
                    divLibrary.appendChild(radio);
                    divLibrary.appendChild(label);
                    divLibrary.setAttribute('class', 'radiobtn one-column');
                    divLibrary0.appendChild(divLibrary);
                    break;
                case (i > 0 && i <= 25):
                    divLibrary.appendChild(radio);
                    divLibrary.appendChild(label);
                    divLibrary.setAttribute('class', 'radiobtn three-columns');
                    divLibrary1.appendChild(divLibrary);
                    break;
                case (i > 25 && i <= 34):
                    divLibrary.appendChild(radio);
                    divLibrary.appendChild(label);
                    divLibrary.setAttribute('class', 'radiobtn two-columns');
                    divLibrary2.appendChild(divLibrary);
                    break;
                case (i > 34 && i <=39):
                    divLibrary.appendChild(radio);
                    divLibrary.appendChild(label);
                    divLibrary.setAttribute('class', 'radiobtn two-columns');
                    divLibrary3.appendChild(divLibrary);
                    break;
                case (i > 39):
                    divLibrary.appendChild(radio);
                    divLibrary.appendChild(label);
                    divLibrary.setAttribute('class', 'radiobtn one-column');
                    divLibrary4.appendChild(divLibrary);
                    break;
              }
            }

            let testspan0 = document.createElement('p');
            testspan0.setAttribute('class', 'library-category');
            testspan0.innerText = 'Metropolitane: ';
            div.appendChild(testspan0);
            div.appendChild(divLibrary0);

            let testspan1 = document.createElement('p');
            testspan1.setAttribute('class', 'library-category');
            testspan1.innerText = 'Județene: ';
            div.appendChild(testspan1);
            div.appendChild(divLibrary1);
            
            let testspan2 = document.createElement('p');
            testspan2.setAttribute('class', 'library-category');
            testspan2.innerHTML = 'Municipale';
            div.appendChild(testspan2);
            div.appendChild(divLibrary2);

            let testspan3 = document.createElement('p');
            testspan3.setAttribute('class', 'library-category');
            testspan3.innerText = 'Universitare: ';
            div.appendChild(testspan3);
            div.appendChild(divLibrary3);

            let testspan4 = document.createElement('p');
            testspan4.setAttribute('class', 'library-category');
            testspan4.innerText = 'Altele: ';
            div.appendChild(testspan4);
            div.appendChild(divLibrary4);
            document.getElementById("data").appendChild(div);
          };
          reader.readAsText(file);
        });
      });
    });
}

/**
 * trigger the search when the popup is open; construct the search url based on title and author, fetch data, parse and display it
 */
function triggerSearch() {
  getUserPreferences();

  if (typeof(availibilityList) == 'undefined') { 
    return false; 
  }

  availibilityList.innerHTML = '';
  booksResult                = [];

  document.querySelector('.loader').style.display = 'block';

  chrome.tabs.executeScript({ code: "getTitleAndAuthorForIcon();" }, function (result) {
    // if the title element doesn't exist in the page, either not supported website or not on a book page
    if (result == null || result[0] == null) {
      let errorMessage = document.createElement('p');
      errorMessage.setAttribute('class', 'error');
      errorMessage.innerHTML = "Extensia nu funcționează pe acest site. <br>Încearcă unul dintre următoarele site-uri:";
      errorMessage.innerHTML += document.querySelector('#allowedwebsites').innerHTML;
      errorMessage.innerHTML += "Dacă ești deja pe unul dintre site-urile de mai sus, reîncarcă pagina și mai încearcă o dată.";

      document.querySelector('#resultsTab').innerHTML = '';
      document.querySelector('#resultsTab').appendChild(errorMessage); 
  
      resultsButton.click();
      return false;
    }

    if (result[0].title == '') {
      let errorMessage = document.querySelector("#Availibility");
      if (result[0].allowedSite) {
        document.querySelector('.loader').style.display = 'none';
        errorMessage.setAttribute('class', 'error');
        document.querySelector('#currentLibrary').style.display = 'none';
        errorMessage.innerText = "Alege o carte de pe acest site.";
      } else {
        document.querySelector('.loader').style.display = 'none';
        errorMessage.setAttribute('class', 'error');
        document.querySelector('#currentLibrary').style.display = 'none';

        errorMessage.innerHTML = "Extensia nu funcționează pe acest site. <br>Încearcă unul dintre următoarele site-uri:";
        errorMessage.innerHTML += document.querySelector('#allowedwebsites').innerHTML;
      }
    } else {
      // there is a title on the page
      let {title, author} = result[0];
      let {searchTitle, searchAuthor} = result[0];
      
      if (title) {
        title = title.toUpperCase();
        searchTitle = removeDiactritics(title);
      }
      if (author) {
        author = author.toUpperCase();
        searchAuthor = removeDiactritics(author);
      }
      
      // create search url        
      if (!isBucuresti()) {
        requestURL = URL_0 + mainLocation + URL_1 + encodeURI(searchTitle) + URL_2 + encodeURI(searchAuthor) + URL_3;
      } else {
        requestURL = mainLocation + URL_1_BUCURESTI + encodeURI(searchAuthor) + URL_2_BUCURESTI + encodeURI(searchTitle) + URL_3_BUCURESTI;
      }

      let method = (!isBucuresti()) ? 'POST' : 'GET';
      chrome.runtime.sendMessage({
        method: method,
        action: 'xhttp',
        url:    requestURL,
      }, function (responseText) {
        // search results for book title + book author
        let resultsArray = (!isBucuresti()) ? getResults(responseText) : getResultsForBucuresti(responseText);
        
        if (resultsArray.length == 0) {
          // no results for title and author, try and search only by author; construct new search url
          
          if (!isBucuresti()) {
            requestURL = URL_0 + mainLocation + URL_1 + URL_2 + encodeURI(searchAuthor) + URL_3;
          } else {
            requestURL = mainLocation + URL_1_BUCURESTI + encodeURI(searchAuthor) + URL_2_BUCURESTI + URL_3_BUCURESTI;
          }

          let method = (!isBucuresti()) ? 'POST' : 'GET';
          chrome.runtime.sendMessage({
            method: method,
            action: 'xhttp',
            url:    requestURL,
          }, function (responseText) {
            let alternativeResultsArray = (!isBucuresti()) ? getResults(responseText) : getResultsForBucuresti(responseText);

            if (alternativeResultsArray.length > 0) {
              // book doesn't exist, showing books by same author

              document.getElementById('Availibility').innerHTML = 'Ne pare rău, nu am găsit această carte. <br>' + 'Alte rezultate pentru ' + author + ': \n';
              let availibilityList = document.querySelector('#availibilityList');
              availibilityList.innerHTML = '';
             
              alternativeResultsArray.forEach(element => {
                let urlBook = (!isBucuresti()) ? URL_0 + mainLocation + '/' + element.link : element.link;
                addBookToResultsList(element, urlBook, false);
              });
              
              waitForResults();

            } else {
              // no other books by the author, searching only for lastname of author; construct new search url

              document.querySelector('#availibilityList').innerHTML = '';
              let bookAuthorAlternate = author.split(' '); 
              if (!isBucuresti()) {
                requestURL = URL_0 + mainLocation + URL_1 + URL_2 + encodeURI(removeDiactritics(bookAuthorAlternate[bookAuthorAlternate.length - 1])) + URL_3;
              } else {
                requestURL = mainLocation + URL_1_BUCURESTI + encodeURI(removeDiactritics(bookAuthorAlternate[bookAuthorAlternate.length - 1])) + URL_2_BUCURESTI + URL_3_BUCURESTI;
              }
              let method = (!isBucuresti()) ? 'POST' : 'GET';
              chrome.runtime.sendMessage({
                method: method,
                action: 'xhttp',
                url:    requestURL,
              }, function (responseText) {
                let alternativeResultsArray = (!isBucuresti()) ? getResults(responseText) : getResultsForBucuresti(responseText);

                if (alternativeResultsArray.length > 0) {
                  // no other books by the author, showing alternative results - by lastname of author

                  document.getElementById('Availibility').innerHTML = 'Ne pare rău, nu am găsit nicio carte scrisă de ' + author + '. <br>' + 'Rezultate pentru ' + bookAuthorAlternate[bookAuthorAlternate.length - 1].toUpperCase() + ': \n';
                  alternativeResults = true;

                  alternativeResultsArray.forEach(element => {
                    let urlBook = (!isBucuresti()) ? URL_0 + mainLocation + '/' + element.link : element.link;
                    addBookToResultsList(element, urlBook, false);
                  });
        
                  waitForResults();
                } else {
                  // NO results

                  document.querySelector('.loader').style.display = 'none';
                  document.getElementById('Availibility').innerText = 'Ne pare rău, nu am găsit nicio carte scrisă de ' + author + '.';
                }
              });
            }
          });
        } else {   
          // the book exists, display results and availability

          document.getElementById('Availibility').innerText = 'Rezultate pentru ' + author + ' - ' + title.toUpperCase() + ': \n';
          
          //clear results list
          let availibilityList = document.querySelector('#availibilityList');
          availibilityList.innerHTML = '';
          
          if (!isBucuresti()) {
            for (let index = 0; index < resultsArray.length; index++) {
              let element = resultsArray[index];
              let urlBook = URL_0 + mainLocation + '/' + element.link;
              let locations = [];
              chrome.runtime.sendMessage({
                method: 'POST',
                action: 'xhttp',
                url:    urlBook,
              }, function (responseText) {
                addBookToResultsList(element, urlBook, responseText);
              });
            }
          } else {
            for (let index = 0; index < resultsArray.length; index++) {
              let element = resultsArray[index];
              addBookToResultsList(element, element.link, false);
            }
          }

          waitForResults();
        }
      });
      
    }

    resultsButton.click();
    
  });
  return true;
}

/**
 * trigger search, get the count and display it in the badge
 */
function setBadgeCount(){
  chrome.storage.sync.get("locationData", function(items) {
    if ((items.locationData != null) && (items.locationData.length > 0)) {
      let data = items.locationData.split(',');
      mainLocation = data[0];
      booksResultForBadge = [];
      
      let title = getTitleAndAuthorForIcon().title;
      let author = getTitleAndAuthorForIcon().author;
      let {searchTitle, searchAuthor} = {title, author};

      if (title) {
        title = title.toUpperCase();
        searchTitle = removeDiactritics(title);
      }
      if (author) {
        author = author.toUpperCase();
        searchAuthor = removeDiactritics(author);
      }

      if (author == '' || title == '') {
        return;
      }

      // construct search url
      let requestURL = URL_0 + mainLocation + URL_1 + encodeURI(searchTitle) + URL_2 + encodeURI(searchAuthor) + URL_3;
      if (isBucuresti()) {
        requestURL = mainLocation + URL_1_BUCURESTI + encodeURI(searchAuthor) + URL_2_BUCURESTI + encodeURI(searchTitle) + URL_3_BUCURESTI;
      }
      let method = (!isBucuresti()) ? 'POST' : 'GET';
      chrome.runtime.sendMessage({
        method: method,
        action: 'xhttp',
        url:    requestURL,
      }, function (responseText) {
        // search results for book title + book author
        let resultsArray = (!isBucuresti()) ? getResults(responseText) : getResultsForBucuresti(responseText);
        
        if (resultsArray.length > 0) {  
          // the book exists

          for (let index = 0; index < resultsArray.length; index++) {
            let element = resultsArray[index];
            let urlBook = (!isBucuresti()) ? URL_0 + mainLocation + '/' + element.link : element.link;
            let locations = [];
            let method = (!isBucuresti()) ? 'POST' : 'GET';
            chrome.runtime.sendMessage({
              method: method,
              action: 'xhttp',
              url:    urlBook,
            }, function (responseText) {
              addBookToResultsList(element, urlBook, responseText, true);
            });
          }
          resultType = 0;
          waitForResultsBadge();
          chrome.runtime.sendMessage({resultType: resultType, booksCount: resultsArray.length});
        } else {  
          // no results by title and author, new url only by author

          if (!isBucuresti()) {
            requestURL = URL_0 + mainLocation + URL_1 + URL_2 + encodeURI(searchAuthor) + URL_3;
          } else {
            requestURL = mainLocation + URL_1_BUCURESTI + encodeURI(searchAuthor) + URL_2_BUCURESTI + URL_3_BUCURESTI;
          }
          let method = (!isBucuresti()) ? 'POST' : 'GET';
          chrome.runtime.sendMessage({
            method: method,
            action: 'xhttp',
            url:    requestURL,
          }, function (responseText) {
            let alternativeResultsArray = (!isBucuresti()) ? getResults(responseText) : getResultsForBucuresti(responseText);
            if (alternativeResultsArray.length > 0) {
              // found other books by same author  

              alternativeResultsArray.forEach(element => {
                let urlBook = (!isBucuresti()) ? URL_0 + mainLocation + '/' + element.link : element.link;
                addBookToResultsList(element, urlBook, false, true);
              });

              resultType = 1;
              waitForResultsBadge();
              chrome.runtime.sendMessage({resultType: resultType, booksCount: alternativeResultsArray.length});
            } else {
              // no other books by the author, searching only for lastname of author

              let bookAuthorAlternate = author.split(' ');
              if (!isBucuresti()) {
                requestURL = URL_0 + mainLocation + URL_1 + URL_2 + encodeURI(removeDiactritics(bookAuthorAlternate[bookAuthorAlternate.length - 1])) + URL_3;
              } else {
                requestURL = mainLocation + URL_1_BUCURESTI + encodeURI(removeDiactritics(bookAuthorAlternate[bookAuthorAlternate.length - 1])) + URL_2_BUCURESTI + URL_3_BUCURESTI;
              }
              let method = (!isBucuresti()) ? 'POST' : 'GET';
              chrome.runtime.sendMessage({
                method: method,
                action: 'xhttp',
                url:    requestURL,
              }, function (responseText) {
                let alternativeResultsArray = (!isBucuresti()) ? getResults(responseText) : getResultsForBucuresti(responseText);
                if (alternativeResultsArray.length > 0) {
                  // found alternative results, by lastname
                  
                  alternativeResults = true;
                  
                  alternativeResultsArray.forEach(element => {
                    let urlBook = (!isBucuresti()) ? URL_0 + mainLocation + '/' + element.link : element.link;
                    addBookToResultsList(element, urlBook, false, true);
                  });
                  
                  resultType = 2;
                  waitForResultsBadge();
                  chrome.runtime.sendMessage({resultType: resultType, booksCount: alternativeResultsArray.length});
                } else {
                  // no results

                  resultType = 3;
                  chrome.runtime.sendMessage({resultType: resultType, booksCount: 0});
                }
              });
            }
          });
        }
      });
    }
  });
}

/**
 * parse the results html page of the library
 * @param {*} obj
 */
function getResults(obj) {
  let books         = [];
  let parser        = new DOMParser();
  let parsedHtml    = parser.parseFromString(obj, 'text/html');
  let resultsObj    = parsedHtml.getElementById("GenericLink");
  let avalilability = parsedHtml.getElementsByClassName("avail_inf");
  let ulBooks       = parsedHtml.querySelectorAll(".reslt_item_head");
  
  // exit if no results on page
  if ((typeof(resultsObj) == 'undefined') || (avalilability.length < 1)) { 
    return books; 
  }

  for (i = 0; i < ulBooks.length; ++i) {
    let title     = ulBooks[i].parentElement.querySelector('.reslt_item_head')
    let author    = ulBooks[i].parentElement.querySelector('.crs_author');
    let year      = ulBooks[i].parentElement.querySelector('.crs_year');
    let publisher = ulBooks[i].parentElement.querySelector('.crs_publisher');
    let language  = ulBooks[i].parentElement.querySelector('.crs_language');
    let count     = ulBooks[i].parentElement.querySelector('.reslt_item_head').closest('table').parentElement.querySelector('.avail_inf > a');
    let isbn      = ulBooks[i].parentElement.querySelector('.crs_isbn');
    let link      = ulBooks[i].parentElement.querySelector('.reslt_item_head > a');

    title     = (title      == null) ? '' : title.innerText.trim(); 
    author    = (author     == null) ? '' : author.innerText.trim();
    year      = (year       == null) ? '' : year.parentElement.innerText.replace(/[^0-9]/g,'');
    publisher = (publisher  == null) ? '' : removeDescription(publisher.parentElement.innerText);
    language  = (language   == null) ? '' : removeDescription(language.parentElement.innerText);
    count     = (count      == null) ? 0  : count.innerText.replace(/[^0-9]/g,'');
    isbn      = (isbn       == null) ? '' : removeDescription(isbn.parentElement.innerText);
    link      = (link       == null) ? '' : link.getAttribute('href');

    let book = {
      isbn:       isbn,
      title:      title, 
      author:     author, 
      year:       year, 
      publisher:  publisher,
      language:   language,
      count:      count,
      link:       link
    };

    if (book.count > 0) {
      books.push(book);
    }
  }
  
  return books;
}

/**
 * parse the results html page of the library (different system and page for Bucuresti)
 * @param {*} obj
 */
function getResultsForBucuresti(obj) {
  let books         = [];
  let parser        = new DOMParser();
  let parsedHtml    = parser.parseFromString(obj, 'text/html')
  let resultsTable  = parsedHtml.querySelectorAll('table')[3];
  let trArray       = resultsTable.querySelectorAll('tr');
  
  // exit if no results on page
  if ((typeof(resultsTable) == 'undefined')) { 
    return books; 
  }
  for (i = 1; i < trArray.length; i++) {
    let tr      = trArray[i]; 
    let tdArray = tr.querySelectorAll('td');

    if (tdArray[7] && tdArray[7].innerText.trim() != '') {  // only if there are any books available
      let title     = tdArray[3];
      let author    = tdArray[2];
      let year      = tdArray[4]
      let publisher = tdArray[6]
      let count     = tdArray[7].querySelectorAll('a');
      let link      = tr.querySelector('a');
      let locations = tdArray[7].querySelectorAll('a');
      let location = [];
      locations.forEach(el => {
        location.push(el.innerText);
      });

      title     = (title      == null) ? '' : cleanUp(title.innerText).trim(); 
      author    = (author     == null) ? '' : author.innerText.trim();
      year      = (year       == null) ? '' : year.innerText.trim();
      publisher = (publisher  == null) ? '' : publisher.innerText.trim();
      count     = (count      == null) ? 0  : counBooksBucuresti(count);
      link      = (link       == null) ? '' : link.getAttribute('href');

      let book = {
        title:      title, 
        author:     author, 
        year:       year, 
        publisher:  publisher,
        count:      count,
        link:       link,
        location:   location
      };

      if (book.count > 0) {
        books.push(book);
      }
    }
  }
  
  return books;
}

/**
 * parse the details page of the books to get the locations 
 * @param {*} obj 
 */
function getBookLocations(obj) {
  let parser      = new DOMParser();
  let parsedHtml  = parser.parseFromString(obj, 'text/html');
  let locations   = []
  let rows = (parsedHtml.querySelector('.grid > tbody') != null) ? parsedHtml.querySelector('.grid > tbody').rows : 0;

  for (let j = 0; j < rows.length; j++) {
    let element = rows[j];
    let branch        = element.querySelectorAll('td')[1].innerText.trim();
    let borrowType    = element.querySelectorAll('td')[2].innerText.trim();
    let borrowStatus  = element.querySelectorAll('td')[6].innerText.trim();

    let location = {
      branch:       branch,
      borrowType:   borrowType,
      borrowStatus: borrowStatus
    };
    locations.push(location);
  }
  
  // check if multiple pages results (those cannot be read)
  let pagination = false;
  if (parsedHtml.querySelector('.pagination-digg').childElementCount > 2) {
    pagination = true;
  }

  return [locations, pagination];
}

/**
 * create book object and add it to the global results
 * @param {*} element 
 * @param {*} responseText 
 * @param {*} urlBook 
 */
function addBookToResultsList(element, urlBook, responseText, forBadge = false){
  let locations   = [];
  let pagination  = false;
  if (responseText) {
    let response    = getBookLocations(responseText);
    locations   = response[0];
    pagination  = response[1];
  }
  
  // for Bucuresti
  if (isBucuresti()) {
    locations = element.location;
  }

  let book = {
    title:      element.title,  
    author:     element.author,
    year:       element.year, 
    publisher:  element.publisher,
    language:   element.language,
    location:   locations,
    count:      element.count,
    morePages:  pagination,
    link:       urlBook
  };

  if (!forBadge) {
    booksResult.push(book);
  } else {
    booksResultForBadge.push(book);
  }
}

/**
 * display book details
 * @param {*} book element 
 */
function displayBook(element, showLocation) {
  let div         = document.createElement('div');
  let detailsSpan = document.createElement('span');
  let author      = document.createElement('span');
  let booksCount  = document.createElement('span');
  let successImg  = document.createElement('img');
  let ul          = document.createElement('ul');
  let li          = document.createElement('li');
  let bookTitle   = document.createElement('a');

  successImg.setAttribute('src', 'images/success.png');
  successImg.setAttribute('class', 'success-image');

  ul.setAttribute('class', 'ul-books');

  bookTitle.setAttribute('href', element.link)
  bookTitle.setAttribute('target', '_blank');
  bookTitle.innerText = element.title;
  bookTitle.setAttribute('class', 'design-name');

  let year        = (element.year != '') ? ('An ' + element.year) : '';
  let publisher   = (element.publisher != '') ? ('editura ' + element.publisher) : '';
  let comma1      = (year != '' && publisher != '') ? ',' : '';

  if (!isBucuresti()) {
    let language    = (element.language != '') ? ('limba ' + element.language.toLowerCase()) : '';
    let comma2      = (publisher != '' && language != '') ? ',' : '';
    detailsSpan.innerText = `(${year}${comma1} ${publisher}${comma2} ${language}) \n`;
  } else {
    detailsSpan.innerText = `(${year}${comma1} ${publisher}) \n`;
  }

  booksCount.innerText = element.count.toString() + ((element.count > 1) ? ' exemplare' : ' exemplar') + '\n';
  booksCount.setAttribute('class', 'books-count');

  li.appendChild(bookTitle);

  if (alternativeResults && element.author != '') {
    author.innerHTML = toTitleCase(element.author) + '<br>';
    author.setAttribute('class', 'author-span');
    li.appendChild(author);
  }

  li.appendChild(detailsSpan);
  li.appendChild(successImg);
  li.appendChild(booksCount);

  // for Bucuresti
  if (isBucuresti()) {
    let locations   = element.location;
    let pagination  = locations.length > 5;
    let ulLocations = document.createElement('ul');
    if (pagination) {
      locations.length = 5;
    } 
    for (let i = 0; i < locations.length; i++) {
      let li = document.createElement('li');
      li.innerText = toTitleCase(locations[i].trim()) + '\n';
      li.setAttribute('class', 'li-locations');
      ulLocations.appendChild(li);
    };
    ulLocations.setAttribute('class', 'ul-locations');
    li.appendChild(ulLocations);

    // if more than 5 location, add a 'view more...' link
    if (pagination) {
      let bookLink = document.createElement('a');
      bookLink.setAttribute('href', element.link)
      bookLink.setAttribute('target', '_blank');
      bookLink.innerText = 'detalii... \n';
      bookLink.setAttribute('class', 'designer-name');
      li.appendChild(bookLink);
    }

  } else {
    if (showLocation) {
      let locations   = element.location;
      let pagination  = element.morePages;
      let ulLocations = document.createElement('ul');
      locations.forEach(el => {
        let li = document.createElement('li');
        li.innerText = `${el.branch}: ${el.borrowStatus} \n`;
        li.setAttribute('class', 'li-locations');
        ulLocations.appendChild(li);
      });
      ulLocations.setAttribute('class', 'ul-locations');
      li.appendChild(ulLocations);

      if (pagination) {
        let bookLink = document.createElement('a');
        bookLink.setAttribute('href', element.link)
        bookLink.setAttribute('target', '_blank');
        bookLink.innerText = 'detalii... \n';
        bookLink.setAttribute('class', 'designer-name');
        li.appendChild(bookLink);
      }
    }
  }

  div.setAttribute('class', 'book-div');
  ul.appendChild(li);
  div.appendChild(ul);             
  availibilityList.appendChild(div);
}

/**
 * wait for results to be loaded inside object
 */
function waitForResults() {
  if (booksResult.length != 0) {
      booksResult.sort((a, b) => (b.year - a.year));
      booksResult.forEach((element, index) => {
        let showLocation = (element.location.length > 0);
        document.querySelector('.loader').style.display = 'none';
        displayBook(element, showLocation);
      });
  } else {
    setTimeout(waitForResults, 250);
  }
}

/**
 * wait for results to be loaded inside object - for badge
 */
function waitForResultsBadge() {
  if (booksResultForBadge.length != 0) {
    return;
  } else {
    setTimeout(waitForResultsBadge, 250);
  }
}

/**
 * get book's title and author for the current window url
 */
function getTitleAndAuthorForIcon() {
  const URL       = window.location.href;
  
  let title       = '';
  let author      = '';
  let allowedSite = false;

  if (URL.indexOf('carturesti.ro') > -1) {
    title       = document.querySelector('.titluProdus');
    author      = document.querySelector('.autorProdus');
    title       = (title == null) ? '' : title.innerText;
    author      = (author == null) ? '' : author.innerText;
    allowedSite = true;

    // fix some issues in the title (containing publisher or other data)
    if (title.indexOf("(Top 10") > -1) {
      title = title.slice(0, title.indexOf("(Top 10")).trim();
    }

    return { title, author, allowedSite };
  }
  
  if (URL.indexOf('elefant.ro') > -1) {
    title       = document.querySelector('.product-title');
    author      = document.querySelector('.product-brand');
    title       = (title == null) ? '' : title.innerText;
    author      = (author == null) ? '' : author.innerText;
    allowedSite = true;

    // fix some issues in title (containing publisher or other data)
    if (title.indexOf("(Top 10") > -1) {
      title = title.slice(0, title.indexOf("(Top 10")).trim();
    }

    return { title, author, allowedSite };
  }
  
  if (URL.indexOf('goodreads.com') > -1) {
    title       = document.querySelector('#bookTitle');
    author      = document.querySelector('.authorName');
    title       = (title == null) ? '' : title.innerText;
    author      = (author == null) ? '' : author.innerText;
    allowedSite = true;

    return { title, author, allowedSite };
  }
  
  if (URL.indexOf('amazon.') > -1) {
    title       = document.querySelector('#title > span');
    author      = document.querySelector('.author > span > a');
    authorAlt   = document.querySelector('.author > a');
    title       = (title == null) ? '' : title.innerText;
    author      = (author == null) ? ((authorAlt == null) ? '' : authorAlt.innerText) : author.innerText;
    allowedSite = true;

    return { title, author, allowedSite };
  }
  
  if (URL.indexOf('bookdepository.com') > -1) {
    title       = document.querySelector('h1');
    author      = document.querySelector('.author-info > span');
    title       = (title == null) ? '' : title.innerText;
    author      = (author == null) ? '' : author.innerText;
    allowedSite = true;

    return { title, author, allowedSite };
  } 
  
  if (URL.indexOf('books-express.ro') > -1) {
    title       = document.querySelector('h1 > span');
    author      = document.querySelector('#book-main > a');
    title       = (title == null) ? '' : title.innerText;
    author      = (author == null) ? '' : author.innerText;
    allowedSite = true;

    return { title, author, allowedSite };
  }
  
  if (URL.indexOf('audible.') > -1) {
    title       = document.querySelector('h1');
    author      = document.querySelector('.authorLabel > a');
    title       = (title == null) ? '' : title.innerText;
    author      = (author == null) ? '' : author.innerText;
    allowedSite = true;

    return { title, author, allowedSite };
  }
  
  if (URL.indexOf('cartepedia.ro') > -1) {
    title       = document.querySelector('.titlu');
    author      = document.querySelector('.autor > a');
    title       = (title == null) ? '' : title.innerText;
    author      = (author == null) ? '' : author.innerText;
    allowedSite = true;

    return { title, author, allowedSite };
  }
  
  if (URL.indexOf('libris') > -1) {
    let product = document.querySelector('h1');
    if (product != null) {
      title   = product.innerText.split(' - ')[0];
      author  = product.innerText.split(' - ')[1];
    } else {
      title = '';
      author = '';
    }
    allowedSite = true;

    return { title, author, allowedSite };
  } 

  return { title, author, allowedSite };
};

/*************
 * HELPERS
 ************/

/**
* string to TitleCase
* @param {*} str 
*/
function toTitleCase(str) {
  return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

/**
 * remove diacritics for search url
 * @param {*} str 
 */
function removeDiactritics(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

/**
 * clean up string
 * @param {*} str 
 */
function removeDescription(str) {
  return str.slice(str.indexOf(':') + 1, str.length).trim();
}

/**
 * check if current library is Bucuresti - needs special logic for processing
 */
function isBucuresti() {
  return (mainLocation.indexOf('aleph20') > -1);
}

function cleanUp(str){
  return str.slice(str.indexOf("('>');") + 6, str.length);
}

function counBooksBucuresti(books) {
  let avalabilityCount = 0;
  books.forEach((book) => {
    let text = book.innerText;
    avalabilityCount += parseInt(text.slice(text.indexOf('(') + 1, text.indexOf('/')).trim());
  });
  return avalabilityCount;
}