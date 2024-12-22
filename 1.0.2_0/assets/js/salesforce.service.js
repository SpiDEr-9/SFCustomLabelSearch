/*  Created by nisarahmad.ajmer@gmail.com */
var SalesforceService = (function () {

    var _sessionId, _instanceName, _apiVersion;

    function SalesforceApi(sessionId, instanceName, apiVersion) {
        _sessionId = sessionId;
        _instanceName = instanceName;
        _apiVersion = apiVersion;
    }

    SalesforceApi.prototype.callout = function (url, method = 'GET', body = '') {
         
        let endpoint = `https://${_instanceName}${url}`;

        return new Promise((resolve, reject) => {
            if (method === 'POST') {

                fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        "Authorization": "Bearer " + _sessionId,
                        "Content-type": "application/json"
                    },
                    body: JSON.stringify(body),
                }).then(response => response.json())
                    .then(json => {
                        resolve(json);
                    })
                    .catch(err => {
                        console.log('POST Request Failed', err);
                        reject(err);
                    });
            } else {
                fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        "Authorization": "Bearer " + _sessionId,
                        "Content-type": "application/json"
                    },
                }).then(response => response.json())
                    .then(json => {
                        resolve(json);
                    })
                    .catch(err => {
                        console.log('GET Request Failed', err);
                        reject(err);
                    });
            }//else
        });

    };

    return SalesforceApi;

})();

export { SalesforceService }

