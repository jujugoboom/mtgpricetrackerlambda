import aws from 'aws-sdk';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
const ISSUER = 'https://dev-ynp64m1e.auth0.com/';

var client = jwksClient({
    jwksUri: 'https://dev-ynp64m1e.auth0.com/.well-known/jwks.json'
  });
function getKey(header, callback){
    client.getSigningKey(header.kid, function(err, key) {
        var signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
    });
}

function handler(event, context, callback) {
    if(!event.headers || !event.headers.Authorization || !event.headers.Authorization.split(' ')[1]){
        callback(null,  {
            statusCode: '401',
            body: {error: 'no access to requested information'},
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    jwt.verify(event.headers.Authorization.split(' ')[1], getKey, {issuer: ISSUER, ignoreExpiration: false}, function (err, decoded) {
        console.log("test");
        if(err){
            console.error(err);
            callback(null,  {
                statusCode: '401',
                body: {error: 'no access to requested information'},
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }
        let user = event.user;
        let S3 = new aws.S3();
        let user_params = {Bucket: 'mtgpricetrackerusers', Key: user};
        console.log('getting user collection form ' + user);
        S3.headObject(user_params).promise().then(_ => {
            S3.getObject(user_params).promise().then(user_collection_raw => {
                let user_collection = JSON.parse(user_collection_raw.Body.toString());
                console.log('got user collection...');
                console.log(user_collection);
                var collection_prices = [];
                var head_promises = [];
                Object.keys(user_collection).forEach(v => {
                    let params = {Bucket: 'mtgpricetracker', Key: v};
                    collection_prices.push(S3.getObject(params).promise().then(r => {
                        let data = r.Body;
                        let data_json = JSON.parse(data.toString());
                        data_json['count'] = user_collection[v];
                        return data_json;
                    }).catch(e => console.log("could not find card" + v)));
                });
                Promise.all(collection_prices).then(b => {
                    console.log(b);
                    callback(null, {
                        statusCode: '200',
                        body: JSON.stringify(b),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                });
            });
        }).catch(e => callback(null,  {
            statusCode: '404',
            body: {error: 'no collection for current user'},
            headers: {
                'Content-Type': 'application/json',
            },
        }));
    });
}

export default handler;