const SQS_URL = 'https://sqs.us-west-2.amazonaws.com/792438677065/mtgcards';

import axios from 'axios';
import aws from 'aws-sdk';

async function handler(event){
    var sqs = new aws.SQS({region : 'us-west-2'});
    let j = await axios.get('https://api.scryfall.com/cards');
    console.log(j);
    let total_pages = Math.ceil(j.data.total_cards / 175);
    var promises = [];
    for(var i = 1; i <= total_pages; i++){
        let params = {
            MessageBody: JSON.stringify(i),
            QueueUrl: SQS_URL
        };
        promises.push(sqs.sendMessage(params).promise().then(r => console.log(r)).catch(e => console.log(e)));
    }
    await Promise.all(promises);
}

export default handler;