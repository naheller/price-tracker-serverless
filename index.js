const express = require("express");
const serverless = require("serverless-http");

const { getAllProducts, getProductById, addProduct } = require("./db");
const { getProductDetails } = require("./scraper");
const { amazonAsinRegex } = require("./utils");

const app = express();

app.use(express.json());

app.get("/products", async function (req, res) {
  try {
    const { Items } = await getAllProducts();
    if (Items) {
      res.json({ products: Items });
    } else {
      res.status(404).json({ error: "Could not find any products" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could fetch products" });
  }
});

app.get("/products/:productId", async function (req, res) {
  try {
    const { Item } = await getProductById(req.params.productId);

    if (Item) {
      const { productId, title, price } = Item;
      res.json({ productId, title, price });
    } else {
      res
        .status(404)
        .json({ error: 'Could not find product with provided "productId"' });
    }
  } catch (error) {
    res.status(500).json({ error: "Could not fetch product" });
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

  const productDetails = await getProductDetails(url);

  try {
    await addProduct(productDetails);
    res.json(productDetails);
  } catch (error) {
    res.status(500).json({
      error: "Could not create product",
      productDetails: productDetails,
    });
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

module.exports.handler = serverless(app);
