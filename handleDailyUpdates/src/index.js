import aws from 'aws-sdk';
import moment from 'moment';
const BUCKET = 'mtgpricetracker';

async function handler(event){
    let rec = event.Records;
    let s3 = new aws.S3();
    for (var record of rec) {
        let new_data = record.body;
        let data = JSON.parse(new_data);
        let params = {
            Bucket: BUCKET,
            Key: data.uniqueName
        };
        try {
            let exists = await s3.headObject(params).promise();
            let existing_data = await s3.getObject(params).promise();
            let existing_data_json = existing_data.Body.toJSON();
            let newest_existing_prices = Object.keys(existing_data.prices).sort((i, j) => parseInt(i) < parseInt(j) ? 1 : -1)[0];
            if (JSON.stringify(existing_data_json.prices[newest_existing_prices]) === JSON.stringify(data.prices)){
                return;
            } else {
                existing_data_json.prices[moment().format('YYYYMMDD')] = data.prices;
                let putParams = {
                    Bucket: BUCKET,
                    Key: data.uniqueName,
                    Body: JSON.stringify(existing_data_json)
                }
                await s3.putObject(putParams).promise();
            }
        } catch (e){
            if (e.code === 'NotFound'){
                var body = {};
                body['prices'] = {};
                body['prices'][moment().format('YYYYMMDD')] = data.prices;
                let putParams = {
                    Bucket: BUCKET,
                    Key: data.uniqueName,
                    Body: JSON.stringify(body)
                };
                await s3.putObject(putParams).promise();
            }
        }
    }
}

export default handler;