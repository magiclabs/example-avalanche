import React, { useState, useEffect } from "react";
import "./styles.css";
import { Magic } from "magic-sdk";
import { AvalancheExtension } from "@magic-ext/avalanche";
import { Avalanche } from "avalanche";

const magic = new Magic("pk_live_C5678C9C36A5A9E1", {
  extensions: {
    xchain: new AvalancheExtension({
      rpcUrl: "https://testapi.avax.network",
      chainId: "X",
      networkId: 4,
    }),
  },
});

export default function App() {
  const [email, setEmail] = useState("");
  const [publicAddress, setPublicAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [sendAmount, setSendAmount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userMetadata, setUserMetadata] = useState({});
  const [txHash, setTxHash] = useState("");
  const [sendingTransaction, setSendingTransaction] = useState(false);

  useEffect(() => {
    magic.user.isLoggedIn().then(async (magicIsLoggedIn) => {
      setIsLoggedIn(magicIsLoggedIn);
      if (magicIsLoggedIn) {
        const metadata = await magic.user.getMetadata();
        setPublicAddress(metadata.publicAddress);
        setUserMetadata(metadata);
      }
    });
  }, [isLoggedIn]);

  const login = async () => {
    await magic.auth.loginWithMagicLink({ email });
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await magic.user.logout();
    setIsLoggedIn(false);
  };

  const handlerSendTransaction = async () => {
    setSendingTransaction(true);
    const metadata = await magic.user.getMetadata();
    let myNetworkID = 4; //default is 3, we want to override that for our local network
    let myBlockchainID = "X"; // The XChain blockchainID on this network
    let ava = new Avalanche(
      "testapi.avax.network",
      443,
      "https",
      myNetworkID,
      myBlockchainID
    );
    let xchain = ava.XChain();
    let assetId = "nznftJBicce1PfWQeNEVBmDyweZZ6zcM3p78z9Hy9Hhdhfaxm";

    let fromAddresses = [metadata.publicAddress];
    let toAddresses = [destinationAddress];

    const signedTx = await magic.xchain.signTransaction(
      sendAmount * 100000000,
      assetId,
      toAddresses,
      fromAddresses,
      toAddresses
    );

    console.log("signedTX", signedTx);

    let txid = await xchain.issueTx(signedTx);
    setSendingTransaction(false);

    setTxHash(txid);

    console.log("send transaction", txid);
  };

  return (
    <div className="App">
      {!isLoggedIn ? (
        <div className="container">
          <h1>Please sign up or login</h1>
          <input
            type="email"
            name="email"
            required="required"
            placeholder="Enter your email"
            onChange={(event) => {
              setEmail(event.target.value);
            }}
          />
          <button onClick={login}>Send</button>
        </div>
      ) : (
        <div>
          <div className="container">
            <h1>Current user: {userMetadata.email}</h1>
            <button onClick={logout}>Logout</button>
          </div>
          <div className="container">
            <h1>Avalanche address</h1>
            <div className="info">{publicAddress}</div>
          </div>
          <div className="container">
            <h1>Send AVAX Transaction</h1>
            {txHash ? (
              <div>
                <div>Send transaction success</div>
                <div className="info">{txHash}</div>
              </div>
            ) : sendingTransaction ? (
              <div className="sending-status">Sending transaction</div>
            ) : (
              <div />
            )}
            <input
              type="text"
              name="destination"
              className="full-width"
              required="required"
              placeholder="Destination address"
              onChange={(event) => {
                setDestinationAddress(event.target.value);
              }}
            />
            <input
              type="text"
              name="amount"
              className="full-width"
              required="required"
              placeholder="Amount in AVAX"
              onChange={(event) => {
                setSendAmount(event.target.value);
              }}
            />
            <button id="btn-send-txn" onClick={handlerSendTransaction}>
              Send Transaction
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
