const { getProductDetailsCamel } = require("./scraper");

const test = async () => {
  const url =
    "https://www.amazon.com/CURTAINS-JOHN-FRUSCIANTE/dp/B00069YE16/ref=sr_1_1?keywords=frusciante+curtains+vinyl&qid=1696866428&sr=8-1";
  const productDetails = await getProductDetailsCamel(url);
  console.log(productDetails);
};

test();
