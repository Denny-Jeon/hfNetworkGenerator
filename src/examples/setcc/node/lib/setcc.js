/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');
const uuidv1 = require('uuid/v1');

class Setcc extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        // const cars = [
        //     {
        //         color: 'blue',
        //         make: 'Toyota',
        //         model: 'Prius',
        //         owner: 'Tomoko',
        //     },
        //     {
        //         color: 'red',
        //         make: 'Ford',
        //         model: 'Mustang',
        //         owner: 'Brad',
        //     },
        //     {
        //         color: 'green',
        //         make: 'Hyundai',
        //         model: 'Tucson',
        //         owner: 'Jin Soo',
        //     },
        //     {
        //         color: 'yellow',
        //         make: 'Volkswagen',
        //         model: 'Passat',
        //         owner: 'Max',
        //     },
        //     {
        //         color: 'black',
        //         make: 'Tesla',
        //         model: 'S',
        //         owner: 'Adriana',
        //     },
        //     {
        //         color: 'purple',
        //         make: 'Peugeot',
        //         model: '205',
        //         owner: 'Michel',
        //     },
        //     {
        //         color: 'white',
        //         make: 'Chery',
        //         model: 'S22L',
        //         owner: 'Aarav',
        //     },
        //     {
        //         color: 'violet',
        //         make: 'Fiat',
        //         model: 'Punto',
        //         owner: 'Pari',
        //     },
        //     {
        //         color: 'indigo',
        //         make: 'Tata',
        //         model: 'Nano',
        //         owner: 'Valeria',
        //     },
        //     {
        //         color: 'brown',
        //         make: 'Holden',
        //         model: 'Barina',
        //         owner: 'Shotaro',
        //     },
        // ];

        // for (let i = 0; i < cars.length; i++) {
        //     cars[i].docType = 'car';
        //     await ctx.stub.putState('CAR' + i, Buffer.from(JSON.stringify(cars[i])));
        //     console.info('Added <--> ', cars[i]);
        // }
        console.info('============= END : Initialize Ledger ===========');
    }

    async queryRate(ctx, id) {
        const rateAsBytes = await ctx.stub.getState(id); // get the rate from chaincode state
        if (!rateAsBytes || rateAsBytes.length === 0) {
            throw new Error(`${id} does not exist`);
        }
        console.log(rateAsBytes.toString());
        return rateAsBytes.toString();
    }

    async createRate(ctx, name, from, to, rate) {
        console.info('============= START : Create Rate ===========');
        const id = uuidv1();
        console.log(id);

        const newRate = {
            id,
            name,
            docType: 'rate',
            from,
            to,
            rate,
        };
        
        console.log(newRate);


        await ctx.stub.putState(id, Buffer.from(JSON.stringify(newRate)));
        console.info('============= END : Create Rate ===========');
    }


    async queryAllRate(ctx) {
        const startKey = '0';
        const endKey =   'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz';

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        const allResults = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                
                console.log(Record.docType);
                

                if (Record.docType == 'rate')
                    allResults.push({ Key, Record });
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }

    async changeRate(ctx, id, newRate) {
        console.info('============= START : changeRate ===========');

        const rateAsBytes = await ctx.stub.getState(id); // get the car from chaincode state
        if (!rateAsBytes || rateAsBytes.length === 0) {
            throw new Error(`${id} does not exist`);
        }
        const rate = JSON.parse(rateAsBytes.toString());
        rate.rate = newRate;

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(rate)));
        console.info('============= END : changeRate ===========');
    }



    async createRecord(ctx, rateId, usage) {
        console.info('============= START : Create Record ===========');

        const rateAsBytes = await ctx.stub.getState(rateId); // get the rate from chaincode state
        if (!rateAsBytes || rateAsBytes.length === 0) {
            throw new Error(`${rateId} does not exist`);
        }
        const rate = JSON.parse(rateAsBytes.toString());

        console.log(rate);

        const id = uuidv1();
        console.log(id);

        const newRecord = {
            id,
            docType: 'record',
            rateId,
            rateFee: rate.fee,
            total: usage,
            fee: (usage * (rate.rate/100))
        };
        
        console.log(newRecord);


        await ctx.stub.putState(id, Buffer.from(JSON.stringify(newRecord)));
        console.info('============= END : Create Record ===========');
    }



    async queryAllRecord(ctx) {
        const startKey = '0';
        const endKey =   'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz';

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        const allResults = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }

                console.log(Record.docType);

                if (Record.docType == 'record')
                    allResults.push({ Key, Record });
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }


    async queryAll(ctx) {
        const startKey = '0';
        const endKey =   'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz';

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        const allResults = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }

                console.log(Record.docType);

                allResults.push({ Key, Record });
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }

}

module.exports = Setcc;
