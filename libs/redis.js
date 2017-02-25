'use strict';

const Sqlite   = require( '../libs/sqlite' );
const util     = require( 'util' );
const db       = new Sqlite();
const bluebird = require( 'bluebird' );
const redis    = require( 'redis' );
const config   = require( '../config/redis' );
const client   = redis.createClient( config.port, config.host, config.options );
client.incr    = bluebird.promisify( client.incr );
client.hget    = bluebird.promisify( client.hget );
client.hset    = bluebird.promisify( client.hset );
const queue    = 'shorturl';

if (config.auth !== "")
    client.auth( config.auth, (err, result) => console.log( "redis: ", err, result ) );

class Redis {

    static async getCode() {
        return await client.incr( 'short' );
    }

    static async get(hash) {
        let url = await client.hget( queue, hash );

        if (url === null) {
            let data = db.find( hash );

            url = data.url;

            if (!util.isUndefined( url )) await Redis.set( url, hash );
        }

        return url;
    }

    static async set(url, hash) {
        return await client.hset( queue, hash, url );
    }
}

module.exports = Redis;
