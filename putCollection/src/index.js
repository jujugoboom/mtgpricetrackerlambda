import csvtojson from 'csvtojson';
import aws from 'aws-sdk';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
const ISSUER = 'https://dev-ynp64m1e.auth0.com/';
const lang_codes = {English: 'en', Spanish: 'es', French: 'fr', German: 'de', Italian: 'it', Portugese: 'pt', Japanese: 'ja', Korean: 'ko', Russian: 'ru', 'Simplified Chinese': 'zhs', 'Traditional Chinese': 'zht', Hebrew: 'he', Latin: 'la', 'Ancient Greek': 'grc', Arabic: 'ar', Sanskrit: 'sa', Phyrexian: 'px'};

var client = jwksClient({
    jwksUri: 'https://dev-ynp64m1e.auth0.com/.well-known/jwks.json'
  });
function getKey(header, callback){
    client.getSigningKey(header.kid, function(err, key) {
        var signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
    });
}


function handler(event, context, callback){
    console.log(event);
    if(!event.headers || !event.headers.Authorization || !event.headers.Authorization.split(' ')[1]){
        callback(null,  {
            statusCode: '401',
            body: {error: 'no access to requested information'},
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    jwt.verify(event.headers.Authorization.split(' ')[1], getKey, {issuer: ISSUER, ignoreExpiration: false}, async function (err, decoded) {
        if(err){
            callback(null,  {
                statusCode: '401',
                body: {error: 'no access to requested information'},
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }
        let S3 = new aws.S3();
        let new_data = await csvtojson().fromString(event.collection);
        console.log(new_data);
        let collection = {};
        new_data.forEach(v => {
            collection[`${v.Name}-${v.Edition}-${lang_codes[v.Language]}`] = v.Count 
        });
        console.log(collection);
        let params = {Bucket: 'mtgpricetrackerusers', Key: event.user, Body: JSON.stringify(collection)};
        await S3.putObject(params).promise();
        callback(null, {
                statusCode: '200',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    });
}

export default handler;