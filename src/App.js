import "./App.css";

import React, { useState, useEffect } from "react";
import { NFTStorage } from "nft.storage";
import { ethers } from "ethers";

import NFTAbi from "./contractsData/NFT.json";
import NFTAddress from "./contractsData/NFT-address.json";

import MarketplaceAbi from "./contractsData/Marketplace.json";
import MarketplaceAddress from "./contractsData/Marketplace-address.json";

const NFT_STORAGE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDVlZWZiNDg2OTg4NzkzNjUyQThmNjZDNzI2RENBMDY5QjdiNGRENEUiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY2MDIyNTk0OTUwMCwibmFtZSI6IkhvbmV5c2VlZCJ9.NENUxGi66h-N9eUDcURqZt_b00PvkydCo1Lwx2YcENE";

function App() {
  const [account, setAccount] = useState();
  const [nft, setNft] = useState({});
  const [marketplace, setMarketplace] = useState({});

  const [image, setImage] = useState();
  const [price, setPrice] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleAccount = async (accounts) => {
    setAccount(accounts[0]);
  };

  const web3Handler = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    const nft = new ethers.Contract(NFTAddress.address, NFTAbi.abi, signer);
    const marketplace = new ethers.Contract(
      MarketplaceAddress.address,
      MarketplaceAbi.abi,
      signer
    );

    const accounts = await provider.send("eth_requestAccounts", []);

    setNft(nft);
    setMarketplace(marketplace);
    setAccount(accounts[0]);
  };

  useEffect(() => {
    web3Handler();
    window.ethereum.on("accountsChanged", handleAccount);
  }, []);

  const uploadToIPFS = async () => {
    if (typeof image !== "undefined") {
      try {
        const nftstorage = new NFTStorage({ token: NFT_STORAGE_KEY });
        const { url } = await nftstorage.store({
          image,
          name,
          description,
        });
        mintThenList(url);
      } catch (err) {
        console.log(err);
      }
    }
  };

  const mintThenList = async (url) => {
    const id = await nft.tokenCount();
    // mint the nft
    await (await nft.mint(url)).wait();
    // get tokenId of the new NFT
    await (await nft.approve(marketplace.address, id)).wait();
    const listingPrice = ethers.utils.parseEther(price);
    // list the item in marketplace
    await (await marketplace.initialMint(id, "", "", "")).wait();
  };

  return (
    <div className="App">
      <h2>{account}</h2>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          // createNFT();
          uploadToIPFS();
        }}
      >
        <div className="form-input">
          <input
            type="file"
            name="file"
            onChange={(event) => {
              event.preventDefault();
              setImage(event.target.files[0]);
            }}
          />
        </div>

        <div className="form-input">
          <input
            type="text"
            name="name"
            value={name}
            placeholder="Name"
            onChange={({ target }) => setName(target.value)}
          />
        </div>

        <div className="form-input">
          <input
            type="number"
            name="price"
            value={price ? price : ""}
            placeholder="Price"
            onChange={({ target }) => setPrice(target.value)}
          />
        </div>

        <div className="form-input">
          <input
            type="text"
            name="description"
            value={description}
            placeholder="Description"
            onChange={({ target }) => setDescription(target.value)}
          />
        </div>

        <div className="form-input">
          <input type="submit" name="description" value="Create NFT" />
        </div>
      </form>

      <button
        onClick={async () => {
          await marketplace.setItemsPublic();
        }}
      >
        Set Items Public
      </button>
    </div>
  );
}

export default App;
