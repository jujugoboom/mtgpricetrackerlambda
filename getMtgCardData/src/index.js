import axios from 'axios';
import aws from 'aws-sdk';
const BASE_URL = 'https://api.scryfall.com/cards?page=';
const STREAM_NAME = 'mtgpricetrackerstream';

async function handler(event){
    let firehose = new aws.Firehose();
    let rec = event.Records;
    for (var record of rec) {
        let i = record.body;
        if(isNaN(i)){
            continue;
        }
        let resp = await axios.get(BASE_URL + i);
        let data = resp.data.data;
        let formatted = data.map(c => ({setCode: c.set, name: c.name, prices: c.prices, lang: c.lang})).map(j => JSON.stringify(j)).join('')
        let params = {
            Record: {
                Data: formatted
            },
            DeliveryStreamName: STREAM_NAME
        }
        while(true){
            try {
                await firehose.putRecord(params).promise();
                return;
            } catch (e) {
                console.log(e);
                continue;
            }
        }

    }
}

export default handler;