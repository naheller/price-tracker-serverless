const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} = require("@aws-sdk/lib-dynamodb");
const express = require("express");
const serverless = require("serverless-http");

const { getProductDetailsFromUrl } = require("./scraper");
const { amazonAsinRegex } = require("./utils");

const app = express();

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;

const client = new DynamoDBClient();
const dynamoDbClient = DynamoDBDocumentClient.from(client);

app.use(express.json());

app.get("/products/:productId", async function (req, res) {
  const params = {
    TableName: PRODUCTS_TABLE,
    Key: {
      productId: req.params.productId,
    },
  };

  try {
    const { Item } = await dynamoDbClient.send(new GetCommand(params));
    if (Item) {
      const { productId, title, price } = Item;
      res.json({ productId, title, price });
    } else {
      res
        .status(404)
        .json({ error: 'Could not find product with provided "productId"' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive product" });
  }
});

app.post("/products", async function (req, res) {
  const { url } = req.body;

  if (url === "") {
    res.status(400).json({ error: "URL must not be empty" });
  }

  if (typeof url !== "string") {
    res.status(400).json({ error: "URL must be a string" });
  }

  if (!amazonAsinRegex.test(url)) {
    res.status(400).json({ error: "URL does not contain an ASIN" });
  }

  let productDetails = {};

  try {
    productDetails = getProductDetailsFromUrl();
  } catch (error) {
    res.status(500).json({ error: "Unable to get product details from URL" });
  }

  const { productId, title, price } = productDetails;

  const params = {
    TableName: PRODUCTS_TABLE,
    Item: {
      productId: productId,
      title: title,
      price: price,
    },
  };

  try {
    await dynamoDbClient.send(new PutCommand(params));
    res.json({ productId, title, price });
  } catch (error) {
    res.status(500).json({ error: "Could not create product", details: error });
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

module.exports.handler = serverless(app);
