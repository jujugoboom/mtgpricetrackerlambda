import axios from 'axios';
import aws from 'aws-sdk';
const BASE_URL = 'https://api.scryfall.com/cards?page=';
const SQS_URL = "https://sqs.us-west-2.amazonaws.com/792438677065/mtgcardupdates";

async function handler(event){
    let sqs = new aws.SQS();
    let rec = event.Records;
    for (var record of rec) {
        let i = record.body;
        if(isNaN(i)){
            continue;
        }
        let resp = await axios.get(BASE_URL + i);
        let data = resp.data.data;
        var promises = [];
        data.map(c => ({uniqueName: `${c.name}-${c.set_name}-${c.lang}`, prices: c.prices})).forEach(f => {
            let params = {
                MessageBody: JSON.stringify(f),
                QueueUrl: SQS_URL
            };
            promises.push(sqs.sendMessage(params).promise().then(r => console.log(r)).catch(e => console.log(e)));
        });
        await Promise.all(promises);
    }
}

export default handler;