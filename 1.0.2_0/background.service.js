/* createdBy: nisarahmad.ajmer@gmail.com */

"use strict";
import { SalesforceService } from "/assets/js/salesforce.service.js";

var sessionCookie = null;
var connectedApp = null;
var userInfo = null;
const API_VERSION = 'v60.0';


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request === 'SPIDY_EXT_REFRESH') {
        (async () => {
            setState('Wait');
            checkUserAndStorage(true);
            sendResponse('REFRESHED')
        })();
    }
});

function openPopup() {
    (async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { from: "SPIDY_SHOW_POPUP", sessionCookie: { ...sessionCookie, uid: userInfo.user_id } });

        } catch (error) {
            console.error(error)
        } finally {
            setState('');
        }
    })();
}

async function checkUserAndStorage(isRefresh) {
    let key = "SPIDY_" + sessionCookie.oid;
    userInfo = userInfo ? userInfo : await connectedApp.callout("/services/oauth2/userinfo");
    //Get & Set Storage
    chrome.storage.local.get(key, async function (res) {
        if (isRefresh || Object.keys(res).length === 0 && res.constructor === Object) {
            let apiResponse = await connectedApp.callout(`/services/data/${API_VERSION}/tooling/query/?q=SELECT id,Name,Value from ExternalString ORDER BY CreatedDate desc`);
            console.log('lables : ', apiResponse);
            let customLables = [...apiResponse.records];
            if (!apiResponse.done) {
                let nxtResponse = await connectedApp.callout(apiResponse.nextRecordsUrl);
                console.log('nxtResponse : ', nxtResponse.records);
                customLables = [...customLables, ...nxtResponse.records]
            }

            if (apiResponse.records) {
                customLables.map(item => {
                    delete item['attributes'];
                    return item;
                });

                let store = {};
                store[key] = { timestamp: new Date().toISOString(), customLables: JSON.stringify(customLables) };
                chrome.storage.local.set(store, function () { });
                openPopup();
            }

        } else {
            console.log('OLD_RC_CALLED');
            openPopup();
        }

    }); //storage
}

function setState(name) {
    chrome.action.setBadgeText({ text: name });
    chrome.action.setBadgeBackgroundColor({ color: 'dodgerblue' });
}

chrome.action.onClicked.addListener((tab) => {
    setState('Wait');
    (async () => {
        sessionCookie = await getSessionId(tab);
        connectedApp = new SalesforceService(sessionCookie.sid, sessionCookie.domain, 60);
        checkUserAndStorage(false);
    })();
});

function getSessionId(tab) {
    return new Promise((resolve, reject) => {
        const currentDomain = new URL(tab.url);
        const orderedDomains = ["salesforce.com", "cloudforce.com", "salesforce.mil", "cloudforce.mil", "sfcrmproducts.cn"];

        chrome.cookies.get({ url: currentDomain.origin, name: "sid" }, cookie => {
            const [oid] = cookie.value.split("!");
            orderedDomains.forEach(currentDomain => {
                chrome.cookies.getAll({ name: "sid", domain: currentDomain.hostname, secure: true }, cookies => {
                    let sessionCookie = cookies.find(c => c.value.startsWith(oid + "!") && orderedDomains.some(dmn => c.domain.endsWith(dmn)));
                    if (sessionCookie) {
                        resolve({ oid, domain: sessionCookie.domain, sid: sessionCookie.value })
                    }
                });
            });

        });
    });
}


function getPageStateMatcher(urlContains) {
    return new chrome.declarativeContent.PageStateMatcher({
        pageUrl: { hostSuffix: urlContains },
    });
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.action.disable();
    chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
        let domainRules = {
            conditions: [
                getPageStateMatcher('.salesforce.com'),
                getPageStateMatcher('.visual.force.com'),
                getPageStateMatcher('.vf.force.com'),
                getPageStateMatcher('.lightning.force.com'),
                getPageStateMatcher('.cloudforce.com'),
                getPageStateMatcher('.visualforce.com'),
                getPageStateMatcher('.sfcrmapps.cn'),
                getPageStateMatcher('.sfcrmproducts.cn'),
                getPageStateMatcher('.salesforce.mil'),
                getPageStateMatcher('.visual.force.mil'),
                getPageStateMatcher('.vf.force.mil'),
                getPageStateMatcher('.lightning.force.mil'),
                getPageStateMatcher('.cloudforce.mil'),
                getPageStateMatcher('.visualforce.mil'),
                getPageStateMatcher('.crmforce.mil')
            ],
            actions: [new chrome.declarativeContent.ShowAction()],
        };
        let rules = [domainRules];
        chrome.declarativeContent.onPageChanged.addRules(rules);
    });
});
