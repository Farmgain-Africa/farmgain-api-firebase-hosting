const functions = require('firebase-functions');

const express = require('express');
const cors = require('cors')({ origin: true });
const app = express();
const firebase = require('firebase/compat/app');
require('firebase/compat/firestore');
require("dotenv").config();

const firebaseConfig = {
  apiKey: process.env.apiKey,
  authDomain: "farmgain-93726.firebaseapp.com",
  projectId: "farmgain-93726",
  storageBucket: "farmgain-93726.appspot.com",
  messagingSenderId: "90279065969",
  appId: process.env.appId,
  measurementId: "G-0360T4STPS"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const prices = db.collection("prices");
const accounts = db.collection("accounts");
const products = db.collection("products");
const markets = db.collection("markets");
const countries = db.collection("countries");
const districts = db.collection("districts");

app.use(express.json());
app.use(cors);

//app.listen(5000, () => console.log('Its alive'));

app.post('/add_account', async (req, res) => {
  const data = req.body;
  accounts
    .add(data)
    .then(() => {
      res.status(200).send('doc added');
    })
    .catch((e) => res.status(400).send(e));
});

app.post('add_market', async (req, res) => {
  const data = req.body;
  markets
    .add(data)
    .then(() => {
      res.status(200).send('doc added');
    })
    .catch((e) => res.status(400).send(e));
});

app.post('/add_prices', async (req, res) => {
  const data = req.body;
  prices
    .add(data)
    .then(() => {
      res.status(200).send('price added');
    })
    .catch((e) => res.status(400).send(e));
});

app.post('/add_product', async (req, res) => {
  const data = req.body;
  products
    .add(data)
    .then(() => {
      res.status(200).send('doc added');
    })
    .catch((e) => res.status(400).send(e));
});

app.get('/markets', async (req, res) => {
  try {
    const snapshot = await markets.get();
    if (snapshot.docs) {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        districtId: doc.data().district?.id,
        country: doc.data().district?.country?.name,
        countryId: doc.data().district?.country?.id,
        countryCode: doc.data().district?.country?.code,
      }));
      res.status(200).send(list);
    }
  } catch (e) {
    res.status(400).send(e);
  }
});

app.get('/countries', async (req, res) => {
  try {
    const snapshot = await countries.get();
    if (snapshot.docs) {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        country: doc.data().name,
        countryCode: doc.data().code,
      }));
      res.status(200).send(list);
    }
  } catch (e) {
    res.status(400).res.send(e);
  }
});

app.get('/districts', async (req, res) => {
  try {
    const snapshot = await districts.get();
    if (snapshot.docs) {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        country: doc.data().country.name,
        countryId: doc.data().country.id,
        countryCode: doc.data().country.code,
      }));
      res.status(200).send(list);
    }
  } catch (e) {
    res.status(400).res.send(e);
  }
});

app.get('/products', async (req, res) => {
  try {
    const snapshot = await products.get();
    if (snapshot.docs) {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        units: doc.data().units,
      }));
      res.status(200).send(list);
    }
  } catch (e) {
    res.status(400).res.send(e);
  }
});

app.get('/latestPriceByProductMarket', async (req, res) => {
  const data = req.query;
  console.log({ data });
  try {
    const snapshot = await prices
      .where('product.id', '==', data.productId)
      .where('market.id', '==', data.marketId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    console.log(snapshot.docs);
    if (!snapshot) {
      res.status(200).send({ data: 'no matching products' });
    } else {
      const list = snapshot.docs.map((doc) => {
        return {
          id: doc.id,
          country: doc.data().market?.district?.country?.name,
          countryId: doc.data().market?.district?.country?.id,
          countryCode: doc.data().market?.district?.country?.code,
          district: doc.data().market?.district?.name,
          districtId: doc.data().market?.district?.id,
          market: doc.data().market?.name,
          marketId: doc.data().market?.id,
          product: doc.data().product?.name,
          productId: doc.data().product?.id,
          wholesalePrice: doc.data().price,
          retailPrice: doc.data().retailPrice,
          date: new Date(doc.data().createdAt.seconds * 1000),
        };
      });
      res.status(200).send({ data: list });
    }
  } catch (e) {
    console.log({ e });
    res.status(400).send(e);
  }
});

app.get('/prices', async (req, res) => {
  const data = req.query;
  let metaDataOnly = req.query.metaDataOnly;
  let query = prices;
  let dateStamp;
  let tomorrow;
  let startStamp;
  let endStamp;
  let metaMarkets = {};
  let metaProducts = {};
  let metaDistricts = {};
  let metaCountries = {};
  let metaPricePoints = 0;
  let metaStart;
  let metaEnd;

  if (data.start) {
    startStamp = firebase.firestore.Timestamp.fromDate(new Date(data.start));
  }

  if (data.end) {
    let ms = new Date(data.end).getTime() + 86400000;
    endStamp = firebase.firestore.Timestamp.fromDate(new Date(ms));
  }

  if (data.date) {
    dateStamp = firebase.firestore.Timestamp.fromDate(new Date(data.date));
    let ms = new Date(data.date).getTime() + 86400000;
    tomorrow = firebase.firestore.Timestamp.fromDate(new Date(ms));
  }

  const selections = {
    'product.id': data.productId,
    'market.id': data.marketId,
    'market.district.id': data.districtId,
    'market.district.country.id': data.countryId,
    createdAt: dateStamp,
    start: startStamp,
    end: endStamp,
    userId: data.userId,
    retail: data.retailIncluded,
    wholesale: data.wholesaleIncluded,
    limit: data.limit ? data.limit : 1000,
  };
  let wholeRetail = false;
  for (key in selections) {
    if (key == 'createdAt' && selections[key] !== undefined) {
      query = query.where('createdAt', '>', dateStamp);
      query = query.where('createdAt', '<', tomorrow);
    } else if (
      selections['wholesale'] &&
      !wholeRetail &&
      !selections['retail']
    ) {
      wholeRetail = true;
      query = query.orderBy('createdAt');
      query = query.orderBy('price');
    } else if (
      selections['retail'] &&
      !wholeRetail &&
      !selections['wholesale']
    ) {
      wholeRetail = true;
      query = query.orderBy('createdAt');
      query = query.orderBy('retailPrice');
    } else if (key == 'start' && selections[key] !== undefined) {
      query = query.where('createdAt', '>', startStamp);
    } else if (key == 'end' && selections[key] !== undefined) {
      query = query.where('createdAt', '<=', endStamp);
    } else if (key === 'limit') {
      query = query.limit(selections['limit']);
    } else if (
      selections[key] != '' &&
      selections[key] != undefined &&
      key != 'wholesale' &&
      key != 'retail'
    ) {
      query = query.where(key, '==', selections[key]);
    }
  }

  try {
    const snapshot = await query.get();
    if (snapshot.docs) {
      if (snapshot.docs.length === 0) {
        res.status(200).send({ data: 'no matching products in that market' });
      } else {
        const list = snapshot.docs.map((doc) => {
          let dateValue = new Date(doc.data().createdAt.seconds * 1000);
          let marketValue = doc.data().market?.name;
          let productValue = doc.data().product?.name;
          let districtValue = doc.data().market?.district?.name;
          let countryValue = doc.data().market?.district?.country?.name;
          if (!metaStart) metaStart = dateValue;
          metaPricePoints += 1;
          if (!metaMarkets[marketValue]) metaMarkets[marketValue] = 1;
          if (!metaProducts[productValue]) metaProducts[productValue] = 1;
          if (!metaDistricts[districtValue]) metaDistricts[districtValue] = 1;
          if (!metaCountries[countryValue]) metaCountries[countryValue] = 1;
          metaEnd = dateValue;
          return {
            id: doc.id,
            country: countryValue,
            countryId: doc.data().market?.district?.country?.id,
            countryCode: doc.data().market?.district?.country?.code,
            district: districtValue,
            districtId: doc.data().market?.district?.id,
            market: marketValue,
            marketId: doc.data().market?.id,
            product: productValue,
            productId: doc.data().product?.id,
            wholesalePrice: doc.data().price,
            retailPrice: doc.data().retailPrice,
            date: dateValue,
          };
        });
        const mktMeta = Object.keys(metaMarkets);
        const prdMeta = Object.keys(metaProducts);
        const metaData = {
          'number of markets': mktMeta.length,
          markets: mktMeta,
          'number of products': prdMeta.length,
          products: prdMeta,
          'start date': metaStart,
          'end date': metaEnd,
          'total price points': metaPricePoints,
          'first price point': metaStart,
          'last price point': metaEnd,
        };
        metaDataOnly
          ? res.status(200).send({ metaData })
          : res.status(200).send({ metaData, data: list });
      }
    }
  } catch (e) {
    console.log({ e });
    res.status(400).send(e);
  }
});

exports.app = functions.https.onRequest(app);
