require("dotenv").config();
const firebase = require("firebase");
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries


const firebaseConfig = {
  apiKey: 'AIzaSyBK7kdKrdzO85aEG0Bxh5rZv64mIGKawCc',
  authDomain: 'superchatfire.firebaseapp.com',
  projectId: 'superchatfire',
  storageBucket: 'superchatfire.appspot.com',
  messagingSenderId: '211349948734',
  appId: '1:211349948734:web:aa0ea0cc7e8dc67f8a846f',
  measurementId: 'G-WVW8090KLV',
}
// // Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore()
const prices = db.collection('prices')
const accounts = db.collection('accounts')
const products = db.collection( 'products')
const markets = db.collection( "markets")
const countries = db.collection( "countries")
const districts = db.collection( "districts")

module.exports = {db, prices, accounts, products, markets, countries, districts}