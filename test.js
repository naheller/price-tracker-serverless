const { getProductDetailsCamel } = require("./scraper");

const test = async () => {
  const url =
    "https://www.amazon.com/bird-some-instructions-writing-life-ebook/dp/b000segi8q";
  const productDetails = await getProductDetailsCamel(url);
  console.log(productDetails);
};

test();
