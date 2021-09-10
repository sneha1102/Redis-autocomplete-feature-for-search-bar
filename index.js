import express from "express";
import Redis from 'ioredis';

const app = express();

const port = 3001;

let client = new Redis({
   port: 6379,
   host: '127.0.0.1',
   connectTimeout: 10000
} );

const initDb = async() =>
{
	var countries = [
		{"name": "abc", "code": "AF"},
		{"name": "abd Islands", "code": "AX"},
		{"name": "alc", "code": "AL"},
		{"name": "alm", "code": "DZ"},
		{"name": "asb Samoa", "code": "AS"},
		{"name": "avb", "code": "AD"},
		{"name": "bvf", "code": "AO"},
		{"name": "css", "code": "AI"},
		{"name": "df", "code": "AQ"},
		{"name": "hi and Barbuda", "code": "AG"},
		{"name": "ij", "code": "AR"},
	]

	for ( const country of countries ) {
		let term = country.name.toUpperCase();
		let terms = [];

		for ( let i = 1; i < term.length; i++ ) {
			terms.push( 0 );
			terms.push( term.substring( 0, i ) );
		}
		terms.push( 0 );
		terms.push( term + "*" );
		( async () =>
		{
			await client.zadd( "terms", ...terms )
		} )();

	}
	console.log( 'initdb func runs successfully' );
}

async function searchQuery ( query )
{
	if ( !query ) {
		return {
			statusCode: 400,
			body: JSON.stringify(
				{
					message: 'Invalid parameters. query params needed.',
				}
			),
		};
	}
	let term = query.toUpperCase();
	let res = [];
	let rank = await client.zrank( "terms", term );
	if ( rank != null ) {
		let temp = await client.zrange( "terms", rank, -1 );
		for ( const el of temp ) {
			if ( !el.startsWith( term ) ) {
				break;
			}
			if ( el.endsWith( "*" ) ) {
				res.push( el.substring( 0, el.length - 1 ) );
			}
		}
	}
	return {
		statusCode: 200,
		body: JSON.stringify(
			{
				message: 'Query:' + query,
				result: res,
			}
		),
	};
}

app.get( `/test/:searchText`, async( req, res ) =>
{
	try {
		await initDb();
	const resp = await searchQuery( req.params.term );
		res.status( resp.statusCode ).send( resp.body );
	} catch {
		res.status( 400 ).send( "Bad request" );
	}
} );

app.listen( port, () => console.log( `Listening at http://localhost:${ port }` ) );