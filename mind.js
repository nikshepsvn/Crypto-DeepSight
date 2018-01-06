var cron = require('node-cron');
var twit = require('twit');
const snoowrap = require('snoowrap');
var unirest = require('unirest');
const CoinMarketCap = require('coinmarketcap-api')
var sentiment = require('sentiment');


const client = new CoinMarketCap()
var datawarehouse = [];
var sentimentwarehouse = {};
var listOfCoins = [];

const r = new snoowrap({
  clientId: 'XXX',
  clientSecret: 'XXX',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36',
  username: 'XXX',
  password: 'XXX'
});

var T = new twit({
  consumer_key:         'XXX',
  consumer_secret:      'XXX',
  access_token:         'XXX',
  access_token_secret:  'XXX',
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
})

function fetchData(searchcoin) {
	var warehouse = [];	
	r.getSubreddit('cryptocurrency').search({query: searchcoin, sort: 'new', limit: 10}).then((data) => {for (var ele in data){ try{warehouse.push(data[ele].title);} catch(e){} }}).catch();
	r.getSubreddit('cryptomarkets').search({query: searchcoin, sort: 'new', limit: 10}).then((data) => {for (var ele in data){ try{warehouse.push(data[ele].title);} catch(e){} }}).catch();
	T.get('search/tweets', { q: searchcoin + ' cryptocurrency', count: 100 }, function(err, data, response) {for (var ele in data["statuses"]){warehouse.push(data["statuses"][ele].text); }}); 
	unirest.get('https://api.cognitive.microsoft.com/bing/v7.0/news/search?q='+searchcoin+' cryptocurrency')
	.headers({'Ocp-Apim-Subscription-Key': '83f621b817894205a90dc3484250318a'})
	.end(function (response) {
	  for (var ele in response.body["value"]){
	  	warehouse.push(response.body["value"][ele].name);
	  }
	});
	datawarehouse[searchcoin] = [];
	datawarehouse[searchcoin].push(warehouse);
	warehouse = [];
}

function getCoinData(){		
	for (var coin in listOfCoins){
		searchcoin = listOfCoins[coin];
		console.log(searchcoin);		
		setTimeout(function(searchcoin){fetchData(searchcoin)}, coin*5000, searchcoin);
	}
}

function init(){
	client.getTicker({limit: 100}).then((data)=> {
		for (var ele in data){
			listOfCoins.push(data[ele].name);
		}
		getCoinData();
		setTimeout(function() {
			updateData();
		}, listOfCoins.length*5000);		
	});
}
	
cron.schedule('00 59 * * * *', function(){
	getCoinData();
	setTimeout(function() {
		updateData();
	}, listOfCoins.length*5000);
});

function updateData(){
	for (var coin in listOfCoins){
		sentimentwarehouse[listOfCoins[coin]] = [];
		var result = sentiment(datawarehouse[listOfCoins[coin]]);
		console.dir(result);
		sentimentwarehouse[listOfCoins[coin]].push(result);
	}
}

init();