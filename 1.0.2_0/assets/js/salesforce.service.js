var SalesforceService = (function () {
console.log('inside SalesforceService  1');

var _sessionId, _instanceName, _apiVersion;

function SalesforceApi(sessionId, instanceName, apiVersion) {
    console.log('SalesforceApi---'+ sessionId+'   2- '+instanceName+'  3- '+apiVersion);
    
    _sessionId = sessionId;
    _instanceName = instanceName;
    _apiVersion = apiVersion;
}

SalesforceApi.prototype.callout = function (url, method = 'GET', body = '') {
    console.log('inside SalesforceService  2');
    
    let endpoint = `https://${_instanceName}${url}`;
    
    console.log('inside SalesforceService  3'+ endpoint);

        return new Promise((resolve, reject) => {
            if (method === 'POST') {
                console.log('post body---'+ JSON.stringify(body));
                
                fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        "Authorization": "Bearer " + _sessionId,
                        "Content-type": "application/json"
                    },
                    body: JSON.stringify(body),
                }).then(response => response.json())
                    .then(json => {
                        console.log('post resp---'+ JSON.stringify(json));
                        resolve(json);
                    })
                    .catch(err => {
                        console.log('POST Request Failed', err);
                        reject(err);
                    });
            } else {
                console.log('post get---'+ JSON.stringify(body));
                fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        "Authorization": "Bearer " + _sessionId,
                        "Content-type": "application/json"
                    },
                }).then(response => response.json())
                    .then(json => {
                        console.log('get resp---'+ JSON.stringify(json));
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

