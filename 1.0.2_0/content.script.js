"use strict";

const LIGHTNING_ELEMENT = '#auraLoadingBox';
const CLASSIC_ELEMENT = 'body.sfdcBody';
const DEVTOOL_ELEMENT = 'body.ApexCSIPage';
const MINIMAL_SEARCH_TERM_LENGTH = 2

$(document).ready(function () {
    
    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            if (request.from === 'SPIDY_SHOW_POPUP') {
                let key = 'SPIDY_' + request.sessionCookie.oid;
                chrome.storage.local.get(key, async function (res) {
                    let data = res[key];
                    showPopup(request.sessionCookie, data);
                })
            }

        }
    );


    function doSupportLoginAs(systemContext, user) { 
        return !(!user || user.Id == systemContext.uid);
    }

    function getLoginAsLink(systemContext, userId) {
        let contextPath = window.location.pathname;
        const retUrl = contextPath || "/";
        const targetUrl = contextPath || "/";
        return "https://" + systemContext.domain + "/servlet/servlet.su" + "?oid=" + encodeURIComponent(systemContext.oid) + "&suorgadminid=" + encodeURIComponent(userId) + "&retURL=" + encodeURIComponent(retUrl) + "&targetURL=" + encodeURIComponent(targetUrl);
    }

    function getElementContainer() {
        let element = '';
        if ($(LIGHTNING_ELEMENT).length) {
            element = LIGHTNING_ELEMENT;
        } else if ($(CLASSIC_ELEMENT).length) {
            element = CLASSIC_ELEMENT;
        } if ($(DEVTOOL_ELEMENT).length) {
            element = DEVTOOL_ELEMENT;
        }
        return element;
    }


    function showPopup(systemContext, data) {
        console.log('OUTPUT : showpop-- 1');
        let timestamp = data.timestamp;
        console.log('OUTPUT : showpop-- 2'+data);
        console.log('OUTPUT : showpop-- 3'+data.customLables);
        let customLables = JSON.parse(data.customLables);
        console.log('OUTPUT : showpop-- 4'+customLables);

        let elementName = getElementContainer();
 
        let tableBody = customLables.map(cLab => {
            return `<tr class="slds-hint-parent">
            <th scope="row"></th>
            <td><a target="_blank" href="/${cLab.Id}">${cLab.Name}</a></td>
            <td>${cLab.Value}</td>
        </tr>`;
        });



        let html = `
    <div id="SPIDY-extension" class="SPIDY-ext-container SPIDY-${elementName == LIGHTNING_ELEMENT ? 'lightning' : 'classic'}"> 
       
    <div class="SPIDY-ext-header">
            <div class="SPIDY-row SPIDY_vertical-align-center SPIDY_align-spread">
               
                 <div class="SPIDY-col" title="Refresh Users" >
                        <svg id="SPIDY-ext-refresh" class="slds-icon SPIDY-small-icon" aria-hidden="true"><use xlink:href="/_slds/icons/utility-sprite/svg/symbols.svg#refresh"></use></svg>
                    </div>

                <div class="SPIDY-col">
                    <p>Salesforce Custom Labels</p>
                </div>
                <div class="SPIDY-col SPIDY-ext-action">
                <div class="SPIDY-row SPIDY_vertical-align-center">
                    
                    <div class="SPIDY-col" title="Close">
                        <svg id="SPIDY-ext-close" class="slds-icon SPIDY-small-icon" aria-hidden="true" style="margin: 0px 6px;">
                            <use xlink:href="/_slds/icons/utility-sprite/svg/symbols.svg#close"></use>
                        </svg>
                    </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="SPIDY-ext-searchbar">

            <div class="slds-form-element"> 
                <div class="slds-form-element__control slds-input-has-icon slds-input-has-icon_right">
                    ${elementName == LIGHTNING_ELEMENT ? ` <svg class="slds-icon slds-input__icon slds-input__icon_right slds-icon-text-default" aria-hidden="true">
                    <use xlink:href="/_slds/icons/utility-sprite/svg/symbols.svg#search"></use>
                </svg>` : ''}
               
                    <input type="text" id="SPIDY-search-input"  placeholder="Search label Name or Value..." class="slds-input" />
                </div>
            </div>

        </div>
        <!--User Table : Begin-->
        <div class="SPIDY-ext-user-list"> 
        <div id="SPIDY-ext-loader" class="cover-spin"></div> 

        <table class="SPIDY-ext-user-table SPIDY-table">
        <thead><tr><th scope="col">#</th><th scope="col"><div class="slds-truncate">Name</div></th><th scope="col"><div class="slds-truncate">Value</div></th></thead>
        <tbody>
            ${tableBody.join('\n')}
        </tbody>
        </table>



        </div>
        <!--User Table : End-->
        <div class="SPIDY-ext-footer">
            <div class="SPIDY-row SPIDY_align-spread">
                <div class="SPIDY-col spidyNameBottom">
● Created By SpiDEr <img width="28px" height="28px" src="https://img.icons8.com/color/32/linkedin.png" alt="linkedin"/> <a href="https://www.linkedin.com/in/bdmhatre" target="_blank">Bhushan Dilip Mhatre</a>
                </div>
                <div class="SPIDY-col">
                    v1.0.0
                </div>
            </div>
        </div>
    </div>`;


        if ($('#SPIDY-extension').length) {
            $('#SPIDY-extension').remove();
        }
        $(elementName).after(html);
    }


    $(document).on('click', '#SPIDY-ext-close', function () {
        $("#SPIDY-extension").remove();
    });

    $(document).on('click', '#SPIDY-ext-refresh', function () {
        (async () => {
            const response = await chrome.runtime.sendMessage('SPIDY_EXT_REFRESH');
        })();
    });

    
    $(document).on('click', '.SPIDY-login-button', function () { 
       $('#SPIDY-ext-loader').show()
    });

    function userFilter(value) {
        $(".SPIDY-ext-user-table tbody tr").each(function (index) {
            let text = $(this).find("td").text().replace(/\s+/g, " ").trim();
            if (text.toLowerCase().indexOf(value.toLowerCase()) !== -1) $(this).show();
            else $(this).hide();
        });
    }


    var searchThrottlingTimeout = null;

    $(document).on('keyup', '#SPIDY-search-input', function () {
        let value = $(this).val().replace(/\s+/g, " ").trim(); 

        // Apply search throttling (prevents search if user is still typing)
        if (searchThrottlingTimeout) {
            window.clearTimeout(searchThrottlingTimeout);
        }
 
        searchThrottlingTimeout = window.setTimeout(value => {
            userFilter(value);
            searchThrottlingTimeout = null;
        }, 300, value);

    });


});